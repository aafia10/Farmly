// Copies the compiled ABI into the backend so it does not depend on Hardhat artifacts.
const fs = require("fs");
const path = require("path");

const artifact = require("../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json");
const target = path.join(__dirname, "..", "..", "backend", "src", "blockchain", "CertificateRegistry.abi.json");

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(artifact.abi, null, 2) + "\n");
console.log(`ABI written to ${path.relative(process.cwd(), target)}`);
