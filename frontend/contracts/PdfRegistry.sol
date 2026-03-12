// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PdfRegistry {
    enum DocumentStatus { Inexistente, Activo, Revocado }

    struct DocumentRecord {
        bytes32 fileHash;
        string ipfsCid;
        address issuer;
        uint256 timestamp;
        DocumentStatus status;
    }

    mapping(bytes32 => DocumentRecord) public documents;
    mapping(bytes32 => address) public documentIssuers; // Para mapear hash a emisor y permitir solo al emisor revocar

    event DocumentRegistered(bytes32 indexed fileHash, string ipfsCid, address indexed issuer, uint256 timestamp);
    event DocumentRevoked(bytes32 indexed fileHash, address indexed revoker, uint256 timestamp);

    modifier onlyIssuer(bytes32 _fileHash) {
        require(documentIssuers[_fileHash] == msg.sender, "Solo el emisor puede revocar este documento.");
        _;
    }

    function registerDocument(bytes32 _fileHash, string calldata _ipfsCid) public {
        require(documents[_fileHash].status == DocumentStatus.Inexistente, "El documento ya esta registrado.");

        documents[_fileHash] = DocumentRecord({
            fileHash: _fileHash,
            ipfsCid: _ipfsCid,
            issuer: msg.sender,
            timestamp: block.timestamp,
            status: DocumentStatus.Activo
        });
        documentIssuers[_fileHash] = msg.sender;

        emit DocumentRegistered(_fileHash, _ipfsCid, msg.sender, block.timestamp);
    }

    function revokeDocument(bytes32 _fileHash) public onlyIssuer(_fileHash) {
        require(documents[_fileHash].status == DocumentStatus.Activo, "El documento no esta activo o no existe.");

        documents[_fileHash].status = DocumentStatus.Revocado;
        emit DocumentRevoked(_fileHash, msg.sender, block.timestamp);
    }

    function getDocumentByHash(bytes32 _fileHash) public view returns (bytes32, string memory, address, uint256, DocumentStatus) {
        DocumentRecord storage record = documents[_fileHash];
        return (record.fileHash, record.ipfsCid, record.issuer, record.timestamp, record.status);
    }

    function isValid(bytes32 _fileHash) public view returns (bool) {
        return documents[_fileHash].status == DocumentStatus.Activo;
    }
}
