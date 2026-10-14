// Deploys CertificateRegistry and optionally authorises a separate backend signer.
// Usage: npx hardhat run scripts/deploy.js --network <localhost|sepolia>
// Optional env: REGISTRAR_ADDRESS (the backend's signing address, if different from the deployer)
const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  if (!["localhost", "hardhat", "sepolia"].includes(network)) {
    throw new Error(`Refusing to deploy to '${network}'. Only localhost and sepolia are configured.`);
  }

  const [deployer] = await hre.ethers.getSigners();
  const { chainId } = await hre.ethers.provider.getNetwork();
  console.log(`Deploying CertificateRegistry to ${network} (chainId ${chainId}) from ${deployer.address}`);

  const Registry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const address = await registry.getAddress();
  console.log(`CertificateRegistry deployed at ${address}`);

  const registrar = process.env.REGISTRAR_ADDRESS;
  if (registrar && registrar.toLowerCase() !== deployer.address.toLowerCase()) {
    const tx = await registry.setRegistrar(registrar, true);
    await tx.wait();
    console.log(`Authorised registrar ${registrar}`);
  }

  console.log("\nAdd to backend/.env:");
  console.log(`CHAIN_ID=${chainId}`);
  console.log(`CERT_REGISTRY_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
