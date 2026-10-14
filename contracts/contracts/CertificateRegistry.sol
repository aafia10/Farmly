// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Farmly certificate registry
/// @notice Anchors certificate integrity proofs (SHA-256 of the exact document bytes,
///         IPFS CID and batch/transaction references). Stores no personal data and no
///         documents. Records are never overwritten; revocations are separate events.
/// @dev Identifiers are keccak256 hashes of Farmly's string IDs (e.g. "CERT-FARM-1A2B3C4D").
contract CertificateRegistry {
    struct Certificate {
        bytes32 certificateHash;      // SHA-256 of the document bytes
        bytes32 batchId;              // keccak256(batch or child-batch ID)
        bytes32 transactionId;        // keccak256(transaction ID), zero for origin certificates
        bytes32 sourceCertificateId;  // keccak256(upstream certificate ID), zero for origin certificates
        string ipfsCid;
        address registeredBy;
        uint64 registeredAt;
        bool revoked;
    }

    address public owner;
    mapping(address => bool) public registrars;
    mapping(bytes32 => Certificate) private certificates;

    event RegistrarUpdated(address indexed registrar, bool allowed);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event CertificateRegistered(
        bytes32 indexed certificateId,
        bytes32 indexed batchId,
        bytes32 transactionId,
        bytes32 sourceCertificateId,
        bytes32 certificateHash,
        string ipfsCid,
        address indexed registeredBy
    );
    event CertificateRevoked(bytes32 indexed certificateId, string reason, address indexed revokedBy);

    error NotOwner();
    error NotRegistrar();
    error AlreadyRegistered(bytes32 certificateId);
    error NotRegistered(bytes32 certificateId);
    error AlreadyRevoked(bytes32 certificateId);
    error InvalidInput();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyRegistrar() {
        if (!registrars[msg.sender]) revert NotRegistrar();
        _;
    }

    constructor() {
        owner = msg.sender;
        registrars[msg.sender] = true;
        emit OwnershipTransferred(address(0), msg.sender);
        emit RegistrarUpdated(msg.sender, true);
    }

    function setRegistrar(address registrar, bool allowed) external onlyOwner {
        if (registrar == address(0)) revert InvalidInput();
        registrars[registrar] = allowed;
        emit RegistrarUpdated(registrar, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidInput();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Registers a certificate. A certificate ID can only be registered once.
    function registerCertificate(
        bytes32 certificateId,
        bytes32 batchId,
        bytes32 transactionId,
        bytes32 sourceCertificateId,
        bytes32 certificateHash,
        string calldata ipfsCid
    ) external onlyRegistrar {
        if (certificateId == bytes32(0) || batchId == bytes32(0) || certificateHash == bytes32(0)) {
            revert InvalidInput();
        }
        if (certificates[certificateId].registeredAt != 0) revert AlreadyRegistered(certificateId);

        certificates[certificateId] = Certificate({
            certificateHash: certificateHash,
            batchId: batchId,
            transactionId: transactionId,
            sourceCertificateId: sourceCertificateId,
            ipfsCid: ipfsCid,
            registeredBy: msg.sender,
            registeredAt: uint64(block.timestamp),
            revoked: false
        });

        emit CertificateRegistered(
            certificateId, batchId, transactionId, sourceCertificateId, certificateHash, ipfsCid, msg.sender
        );
    }

    /// @notice Records a revocation. The original registration stays readable.
    function revokeCertificate(bytes32 certificateId, string calldata reason) external onlyRegistrar {
        Certificate storage cert = certificates[certificateId];
        if (cert.registeredAt == 0) revert NotRegistered(certificateId);
        if (cert.revoked) revert AlreadyRevoked(certificateId);
        cert.revoked = true;
        emit CertificateRevoked(certificateId, reason, msg.sender);
    }

    function getCertificate(bytes32 certificateId)
        external
        view
        returns (
            bool exists,
            bytes32 certificateHash,
            bytes32 batchId,
            bytes32 transactionId,
            bytes32 sourceCertificateId,
            string memory ipfsCid,
            address registeredBy,
            uint64 registeredAt,
            bool revoked
        )
    {
        Certificate storage cert = certificates[certificateId];
        return (
            cert.registeredAt != 0,
            cert.certificateHash,
            cert.batchId,
            cert.transactionId,
            cert.sourceCertificateId,
            cert.ipfsCid,
            cert.registeredBy,
            cert.registeredAt,
            cert.revoked
        );
    }
}
