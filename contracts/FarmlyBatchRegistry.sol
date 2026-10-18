// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FarmlyBatchRegistry
 * @dev High-efficiency agricultural batch registry for Farmly on Sepolia Testnet.
 *      Anchors tamper-proof Pinata IPFS metadata CIDs on-chain.
 *      Deployed on Sepolia at: 0xFB558c0cC86738A7a40ff1BD7538E7cbeC89d794
 */
contract FarmlyBatchRegistry {
    struct BatchRecord {
        string batchId;
        string crop;
        uint256 quantityScaled;
        string ipfsHash;
        uint256 registeredAt;
        address registeredBy;
        bool exists;
    }

    address public owner;
    mapping(string => BatchRecord) private _batches;
    uint256 public totalBatches;

    event BatchRegistered(
        string indexed batchIdIndexed,
        string batchId,
        string crop,
        uint256 quantityScaled,
        string ipfsHash,
        address indexed registeredBy,
        uint256 timestamp
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() payable {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Register batch with core provenance data & Pinata IPFS CID.
     * Open to any farmer/caller — stamps msg.sender on-chain.
     */
    function registerBatch(
        string calldata batchId,
        string calldata crop,
        uint256 quantityScaled,
        string calldata ipfsHash
    ) external {
        require(bytes(batchId).length > 0, "Batch ID empty");
        require(!_batches[batchId].exists, "Batch already registered");
        require(bytes(ipfsHash).length > 0, "IPFS CID required");

        _batches[batchId] = BatchRecord({
            batchId: batchId,
            crop: crop,
            quantityScaled: quantityScaled,
            ipfsHash: ipfsHash,
            registeredAt: block.timestamp,
            registeredBy: msg.sender,
            exists: true
        });

        totalBatches += 1;

        emit BatchRegistered(
            batchId,
            batchId,
            crop,
            quantityScaled,
            ipfsHash,
            msg.sender,
            block.timestamp
        );
    }

    function getBatch(string calldata batchId) external view returns (
        string memory batchIdOut,
        string memory crop,
        uint256 quantityScaled,
        string memory ipfsHash,
        uint256 registeredAt,
        address registeredBy,
        bool exists
    ) {
        require(_batches[batchId].exists, "Batch does not exist");
        BatchRecord storage b = _batches[batchId];
        return (
            b.batchId,
            b.crop,
            b.quantityScaled,
            b.ipfsHash,
            b.registeredAt,
            b.registeredBy,
            b.exists
        );
    }

    function batchExists(string calldata batchId) external view returns (bool) {
        return _batches[batchId].exists;
    }

    function getIpfsHash(string calldata batchId) external view returns (string memory) {
        require(_batches[batchId].exists, "Batch does not exist");
        return _batches[batchId].ipfsHash;
    }
}
