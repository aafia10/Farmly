import { Contract, JsonRpcProvider, Wallet, ZeroHash, id as keccakId, isAddress } from "ethers";
import { env } from "../config/env";
import registryAbi from "../blockchain/CertificateRegistry.abi.json";

/**
 * Certificate registry on an EVM chain. Only proofs are stored on-chain:
 * keccak256 of Farmly IDs, the SHA-256 document hash and the IPFS CID.
 */

export class ChainError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "ChainError";
  }
}

export interface ChainRegistration {
  txHash: string;
  blockNumber: number;
  chainId: string;
  contractAddress: string;
}

export interface ChainRecord {
  exists: boolean;
  certificateHash: string; // hex sha256 without 0x
  batchId: string;
  transactionId: string;
  sourceCertificateId: string;
  ipfsCid: string;
  registeredBy: string;
  registeredAt: number;
  revoked: boolean;
}

const CONFIRMATIONS = 1;
const TX_TIMEOUT_MS = 120_000;

let cached: { provider: JsonRpcProvider; contract: Contract; signer: Wallet | null } | null = null;

function connect() {
  if (cached) return cached;
  if (!env.CHAIN_RPC_URL || !env.CERT_REGISTRY_ADDRESS) {
    throw new ChainError("Blockchain is not configured (CHAIN_RPC_URL / CERT_REGISTRY_ADDRESS missing)", false);
  }
  if (!isAddress(env.CERT_REGISTRY_ADDRESS)) {
    throw new ChainError("CERT_REGISTRY_ADDRESS is not a valid address", false);
  }
  const chainId = env.CHAIN_ID ? Number(env.CHAIN_ID) : undefined;
  const provider = new JsonRpcProvider(env.CHAIN_RPC_URL, chainId, chainId ? { staticNetwork: true } : undefined);
  const signer = env.CHAIN_SIGNER_PRIVATE_KEY ? new Wallet(env.CHAIN_SIGNER_PRIVATE_KEY, provider) : null;
  const contract = new Contract(env.CERT_REGISTRY_ADDRESS, registryAbi, signer ?? provider);
  cached = { provider, contract, signer };
  return cached;
}

/** keccak256 of a Farmly string ID, or the zero hash for empty values. */
export function idToBytes32(value?: string | null): string {
  return value ? keccakId(value) : ZeroHash;
}

function describe(err: any): string {
  return err?.shortMessage || err?.reason || err?.message || String(err);
}

function isRetryable(err: any): boolean {
  const code = err?.code;
  // Contract reverts (e.g. AlreadyRegistered, NotRegistrar) will not succeed on retry.
  return !["CALL_EXCEPTION", "INVALID_ARGUMENT", "INSUFFICIENT_FUNDS"].includes(code);
}

export const chainService = {
  /** Read access needs RPC + contract; writes also need a signer. */
  isReadable(): boolean {
    return Boolean(env.CHAIN_RPC_URL && env.CERT_REGISTRY_ADDRESS);
  },

  isWritable(): boolean {
    return this.isReadable() && Boolean(env.CHAIN_SIGNER_PRIVATE_KEY);
  },

  explorerTxUrl(txHash?: string | null): string | null {
    if (!txHash || !env.CHAIN_EXPLORER_TX_URL) return null;
    return `${env.CHAIN_EXPLORER_TX_URL.replace(/\/$/, "")}/${txHash}`;
  },

  async register(input: {
    certificateId: string;
    batchId: string;
    transactionId?: string | null;
    sourceCertificateId?: string | null;
    sha256Hex: string;
    ipfsCid: string;
  }): Promise<ChainRegistration> {
    const { contract, signer, provider } = connect();
    if (!signer) throw new ChainError("CHAIN_SIGNER_PRIVATE_KEY is not configured", false);

    try {
      const tx = await contract.registerCertificate(
        idToBytes32(input.certificateId),
        idToBytes32(input.batchId),
        idToBytes32(input.transactionId),
        idToBytes32(input.sourceCertificateId),
        "0x" + input.sha256Hex,
        input.ipfsCid
      );
      const receipt = await tx.wait(CONFIRMATIONS, TX_TIMEOUT_MS);
      if (!receipt || receipt.status !== 1) throw new ChainError("Registration transaction failed", true);
      const network = await provider.getNetwork();
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        chainId: network.chainId.toString(),
        contractAddress: await contract.getAddress(),
      };
    } catch (err: any) {
      if (err instanceof ChainError) throw err;
      throw new ChainError(`Blockchain registration failed: ${describe(err)}`, isRetryable(err));
    }
  },

  async revoke(certificateId: string, reason: string): Promise<string> {
    const { contract, signer } = connect();
    if (!signer) throw new ChainError("CHAIN_SIGNER_PRIVATE_KEY is not configured", false);
    try {
      const tx = await contract.revokeCertificate(idToBytes32(certificateId), reason);
      const receipt = await tx.wait(CONFIRMATIONS, TX_TIMEOUT_MS);
      if (!receipt || receipt.status !== 1) throw new ChainError("Revocation transaction failed", true);
      return receipt.hash;
    } catch (err: any) {
      if (err instanceof ChainError) throw err;
      throw new ChainError(`Blockchain revocation failed: ${describe(err)}`, isRetryable(err));
    }
  },

  async getRecord(certificateId: string): Promise<ChainRecord> {
    const { contract } = connect();
    try {
      const r = await contract.getCertificate(idToBytes32(certificateId));
      return {
        exists: r.exists,
        certificateHash: (r.certificateHash as string).replace(/^0x/, "").toLowerCase(),
        batchId: r.batchId,
        transactionId: r.transactionId,
        sourceCertificateId: r.sourceCertificateId,
        ipfsCid: r.ipfsCid,
        registeredBy: r.registeredBy,
        registeredAt: Number(r.registeredAt),
        revoked: r.revoked,
      };
    } catch (err: any) {
      throw new ChainError(`Blockchain lookup failed: ${describe(err)}`, true);
    }
  },
};
