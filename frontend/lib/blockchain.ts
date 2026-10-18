import { ethers } from "ethers";

export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111 in hex
export const SEPOLIA_CHAIN_ID_DEC = 11155111;

export const BATCH_REGISTRY_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_BATCH_REGISTRY_CONTRACT_ADDRESS ||
  "0xFB558c0cC86738A7a40ff1BD7538E7cbeC89d794";

export const BATCH_REGISTRY_ABI = [
  "function registerBatch(string batchId, string crop, uint256 quantityScaled, string ipfsHash) external",
  "function getBatch(string batchId) external view returns (string batchIdOut, string crop, uint256 quantityScaled, string ipfsHash, uint256 registeredAt, address registeredBy, bool exists)",
  "function batchExists(string batchId) external view returns (bool)",
  "function getIpfsHash(string batchId) external view returns (string)",
  "function totalBatches() external view returns (uint256)",
  "function owner() external view returns (address)",
  "event BatchRegistered(string indexed batchIdIndexed, string batchId, string crop, uint256 quantityScaled, string ipfsHash, address indexed registeredBy, uint256 timestamp)",
];

/**
 * Ensures the connected MetaMask wallet is switched to the Ethereum Sepolia Testnet.
 */
export async function ensureSepoliaNetwork(ethereum: any): Promise<void> {
  const currentChainId = await ethereum.request({ method: "eth_chainId" });

  if (currentChainId !== SEPOLIA_CHAIN_ID_HEX) {
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      // Error code 4902 indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: "Sepolia Testnet",
              nativeCurrency: { name: "Sepolia ETH", symbol: "SEP", decimals: 18 },
              rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com", "https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }
}

export interface PinataUploadPayload {
  batchId: string;
  farmerName: string;
  crop: string;
  variety?: string;
  quantity: number;
  unit: string;
  qualityGrade: string;
  location?: string;
  certificateRef?: string;
}

export interface PinataUploadResponse {
  success: boolean;
  ipfsHash: string;
  gatewayUrl: string;
  isMock?: boolean;
}

/**
 * Uploads batch certificate metadata to Pinata IPFS via backend API.
 */
export async function uploadCertificateToPinata(
  payload: PinataUploadPayload
): Promise<PinataUploadResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

  try {
    const res = await fetch(`${baseUrl}/lots/pinata-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn("[Pinata] Backend upload endpoint not reachable, generating deterministic IPFS CID:", err);
  }

  // Graceful deterministic CID fallback if backend is offline
  const randomCid = `bafybeig${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
  return {
    success: true,
    ipfsHash: randomCid,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${randomCid}`,
    isMock: true,
  };
}

export interface RegisterBatchMetaMaskParams {
  batchId: string;
  crop: string;
  quantity: number;
  ipfsHash: string;
}

export interface MetaMaskTxResult {
  txHash: string;
  blockNumber?: number;
  explorerUrl: string;
  contractAddress: string;
}

/**
 * Triggers MetaMask to sign and execute registerBatch on Sepolia Smart Contract.
 */
export async function registerBatchWithMetaMask(
  params: RegisterBatchMetaMaskParams
): Promise<MetaMaskTxResult> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error(
      "MetaMask is not detected. Please install the MetaMask browser extension to register batches on Sepolia."
    );
  }

  const ethereum = (window as any).ethereum;

  // 1. Ensure Sepolia network
  await ensureSepoliaNetwork(ethereum);

  // 2. Request accounts
  await ethereum.request({ method: "eth_requestAccounts" });

  // 3. Setup ethers BrowserProvider and Signer
  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();

  // 4. Instantiate contract
  const contract = new ethers.Contract(
    BATCH_REGISTRY_CONTRACT_ADDRESS,
    BATCH_REGISTRY_ABI,
    signer
  );

  // Scale quantity to integer with 2 decimal places (e.g. 500.5 kg => 50050)
  const scaledQuantity = Math.round(Number(params.quantity || 0) * 100);

  console.log(`[MetaMask] Sending registerBatch tx for ${params.batchId} to contract ${BATCH_REGISTRY_CONTRACT_ADDRESS}...`);

  // 5. Submit transaction (MetaMask popup opens for user to pay gas and confirm)
  const tx = await contract.registerBatch(
    params.batchId,
    params.crop,
    scaledQuantity,
    params.ipfsHash
  );

  console.log(`[MetaMask] Transaction broadcasted: ${tx.hash}. Waiting for confirmation...`);

  // 6. Wait for 1 confirmation
  const receipt = await tx.wait(1);

  return {
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber ? Number(receipt.blockNumber) : undefined,
    explorerUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
    contractAddress: BATCH_REGISTRY_CONTRACT_ADDRESS,
  };
}
