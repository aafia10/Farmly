# Farmly Certificate Registry (smart contract)

`contracts/CertificateRegistry.sol` anchors certificate **integrity proofs** on an EVM chain:

- `keccak256` of Farmly's certificate, batch, transaction and source-certificate IDs
- the SHA-256 hash of the exact certificate document bytes
- the IPFS CID of the document
- the registering wallet and block timestamp

No documents, personal data or prices are stored on-chain. A certificate ID can only be registered **once** (no overwrites). Revocations are recorded as a separate flag and event; the original proof stays readable.

Only **registrar** wallets can register or revoke. The deployer is the owner and the first registrar; the owner can add or remove registrars with `setRegistrar`.

This package is development and deployment tooling only. The backend talks to the deployed contract with `ethers` using the ABI in `backend/src/blockchain/CertificateRegistry.abi.json`.

## Setup

```bash
cd contracts
npm install
npm run compile   # compiles and refreshes the backend ABI
npm test          # 8 contract tests on Hardhat's in-memory chain
```

## Local chain (development)

Terminal 1, a local chain with funded test accounts:

```bash
npm run node
```

Terminal 2:

```bash
npm run deploy:local
```

Then set in `backend/.env`:

```
CHAIN_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
CERT_REGISTRY_ADDRESS=<address printed by the deploy script>
CHAIN_SIGNER_PRIVATE_KEY=<one of the private keys printed by `npm run node`>
```

The local chain is reset every time `npm run node` restarts, so redeploy and update the address afterwards. Hardhat's printed keys are public test keys: never use them on a real network.

## Sepolia testnet

1. Create a **dedicated** test wallet and fund it with Sepolia ETH from a faucet.
2. Get an RPC URL from a provider (Alchemy, Infura, or a public Sepolia endpoint).
3. Create `contracts/.env` from `.env.example`:
   ```
   SEPOLIA_RPC_URL=...
   DEPLOYER_PRIVATE_KEY=...
   ```
4. Deploy:
   ```bash
   npm run deploy:sepolia
   ```
5. Set in `backend/.env`:
   ```
   CHAIN_RPC_URL=<Sepolia RPC URL>
   CHAIN_ID=11155111
   CERT_REGISTRY_ADDRESS=<deployed address>
   CHAIN_SIGNER_PRIVATE_KEY=<registrar wallet key>
   CHAIN_EXPLORER_TX_URL=https://sepolia.etherscan.io/tx
   ```

To let the backend sign with a different wallet than the deployer, set `REGISTRAR_ADDRESS` before deploying (or call `setRegistrar` later from the owner wallet).

The deploy script refuses any network other than `localhost` and `sepolia`. Mainnet deployment is intentionally not configured.

## Contract interface

| Function | Access | Purpose |
| --- | --- | --- |
| `registerCertificate(certificateId, batchId, transactionId, sourceCertificateId, certificateHash, ipfsCid)` | registrar | Register a certificate proof (reverts `AlreadyRegistered` if the ID exists) |
| `revokeCertificate(certificateId, reason)` | registrar | Mark a certificate revoked (emits `CertificateRevoked`) |
| `getCertificate(certificateId)` | anyone | Read the proof: `exists`, hashes, CID, registrar, timestamp, `revoked` |
| `setRegistrar(address, allowed)` | owner | Authorise or remove a registrar |
| `transferOwnership(newOwner)` | owner | Transfer contract ownership |

All IDs are passed as `bytes32` values: `ethers.id("CERT-FARM-1A2B3C4D")`. The certificate hash is the document's SHA-256 as `bytes32`.
