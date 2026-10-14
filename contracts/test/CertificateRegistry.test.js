const { expect } = require("chai");
const { ethers } = require("hardhat");

const id = (value) => ethers.id(value);
const sha = "0x" + "ab".repeat(32);
const otherSha = "0x" + "cd".repeat(32);

describe("CertificateRegistry", () => {
  let registry, owner, registrar, stranger;

  beforeEach(async () => {
    [owner, registrar, stranger] = await ethers.getSigners();
    registry = await (await ethers.getContractFactory("CertificateRegistry")).deploy();
    await registry.waitForDeployment();
  });

  it("registers a certificate and returns its proof", async () => {
    await expect(
      registry.registerCertificate(id("CERT-FARM-1"), id("BATCH-001"), ethers.ZeroHash, ethers.ZeroHash, sha, "bafy-farm")
    ).to.emit(registry, "CertificateRegistered");

    const cert = await registry.getCertificate(id("CERT-FARM-1"));
    expect(cert.exists).to.equal(true);
    expect(cert.certificateHash).to.equal(sha);
    expect(cert.batchId).to.equal(id("BATCH-001"));
    expect(cert.ipfsCid).to.equal("bafy-farm");
    expect(cert.registeredBy).to.equal(owner.address);
    expect(cert.revoked).to.equal(false);
  });

  it("links downstream certificates to their source", async () => {
    await registry.registerCertificate(id("CERT-FARM-1"), id("BATCH-001"), ethers.ZeroHash, ethers.ZeroHash, sha, "a");
    await registry.registerCertificate(
      id("CERT-DIST-1"), id("BATCH-001-D1"), id("TX-1"), id("CERT-FARM-1"), otherSha, "b"
    );
    const cert = await registry.getCertificate(id("CERT-DIST-1"));
    expect(cert.sourceCertificateId).to.equal(id("CERT-FARM-1"));
    expect(cert.transactionId).to.equal(id("TX-1"));
  });

  it("never overwrites an existing certificate", async () => {
    await registry.registerCertificate(id("CERT-FARM-1"), id("BATCH-001"), ethers.ZeroHash, ethers.ZeroHash, sha, "a");
    await expect(
      registry.registerCertificate(id("CERT-FARM-1"), id("BATCH-001"), ethers.ZeroHash, ethers.ZeroHash, otherSha, "b")
    ).to.be.revertedWithCustomError(registry, "AlreadyRegistered");
    expect((await registry.getCertificate(id("CERT-FARM-1"))).certificateHash).to.equal(sha);
  });

  it("rejects registrations from unauthorised accounts", async () => {
    await expect(
      registry.connect(stranger).registerCertificate(id("C"), id("B"), ethers.ZeroHash, ethers.ZeroHash, sha, "x")
    ).to.be.revertedWithCustomError(registry, "NotRegistrar");
  });

  it("lets the owner authorise and remove registrars", async () => {
    await expect(registry.connect(stranger).setRegistrar(registrar.address, true)).to.be.revertedWithCustomError(
      registry,
      "NotOwner"
    );
    await registry.setRegistrar(registrar.address, true);
    await registry.connect(registrar).registerCertificate(id("C"), id("B"), ethers.ZeroHash, ethers.ZeroHash, sha, "x");
    await registry.setRegistrar(registrar.address, false);
    await expect(
      registry.connect(registrar).registerCertificate(id("C2"), id("B"), ethers.ZeroHash, ethers.ZeroHash, sha, "x")
    ).to.be.revertedWithCustomError(registry, "NotRegistrar");
  });

  it("rejects empty identifiers and hashes", async () => {
    await expect(
      registry.registerCertificate(ethers.ZeroHash, id("B"), ethers.ZeroHash, ethers.ZeroHash, sha, "x")
    ).to.be.revertedWithCustomError(registry, "InvalidInput");
    await expect(
      registry.registerCertificate(id("C"), id("B"), ethers.ZeroHash, ethers.ZeroHash, ethers.ZeroHash, "x")
    ).to.be.revertedWithCustomError(registry, "InvalidInput");
  });

  it("records revocation as an event and keeps the original proof", async () => {
    await registry.registerCertificate(id("CERT-FARM-1"), id("BATCH-001"), ethers.ZeroHash, ethers.ZeroHash, sha, "a");
    await expect(registry.revokeCertificate(id("CERT-FARM-1"), "Issuer withdrew certificate"))
      .to.emit(registry, "CertificateRevoked")
      .withArgs(id("CERT-FARM-1"), "Issuer withdrew certificate", owner.address);

    const cert = await registry.getCertificate(id("CERT-FARM-1"));
    expect(cert.revoked).to.equal(true);
    expect(cert.certificateHash).to.equal(sha);
    await expect(registry.revokeCertificate(id("CERT-FARM-1"), "again")).to.be.revertedWithCustomError(
      registry,
      "AlreadyRevoked"
    );
  });

  it("cannot revoke unknown certificates", async () => {
    await expect(registry.revokeCertificate(id("NOPE"), "x")).to.be.revertedWithCustomError(registry, "NotRegistered");
  });
});
