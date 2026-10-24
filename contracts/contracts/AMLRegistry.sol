// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AMLRegistry is AccessControl {
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");

    struct TransactionRecord {
        uint256 id;
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        uint256 riskScore;
        string status; // e.g., "CLEARED", "FLAGGED"
    }

    mapping(uint256 => TransactionRecord) public transactions;
    uint256 public nextTransactionId;

    mapping(address => bool) public watchlist;
    mapping(address => bool) public frozenAccounts;
    
    event TransactionRecorded(uint256 indexed id, address indexed from, address indexed to, uint256 amount, uint256 riskScore, string status);
    event TransactionFlagged(uint256 indexed id, string reason);
    event AddressAddedToWatchlist(address indexed addr);
    event AddressRemovedFromWatchlist(address indexed addr);
    event AccountFrozen(address indexed addr);
    event AccountUnfrozen(address indexed addr);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_OFFICER_ROLE, msg.sender);
    }

    function addToWatchlist(address _addr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        watchlist[_addr] = true;
        emit AddressAddedToWatchlist(_addr);
    }

    function removeFromWatchlist(address _addr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        watchlist[_addr] = false;
        emit AddressRemovedFromWatchlist(_addr);
    }

    function freezeAccount(address _addr) external {
        frozenAccounts[_addr] = true;
        emit AccountFrozen(_addr);
    }

    function unfreezeAccount(address _addr) external {
        frozenAccounts[_addr] = false;
        emit AccountUnfrozen(_addr);
    }

    function recordTransaction(address _from, address _to, uint256 _amount, uint256 _riskScore) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        string memory initialStatus = _riskScore >= 75 ? "FLAGGED" : "CLEARED";
        
        transactions[nextTransactionId] = TransactionRecord({
            id: nextTransactionId,
            from: _from,
            to: _to,
            amount: _amount,
            timestamp: block.timestamp,
            riskScore: _riskScore,
            status: initialStatus
        });

        emit TransactionRecorded(nextTransactionId, _from, _to, _amount, _riskScore, initialStatus);
        
        if (_riskScore >= 75) {
            emit TransactionFlagged(nextTransactionId, "High risk score automatically flagged");
        }

        nextTransactionId++;
    }

    function flagTransaction(uint256 _id, string calldata _reason) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(_id < nextTransactionId, "Transaction does not exist");
        transactions[_id].status = "FLAGGED";
        emit TransactionFlagged(_id, _reason);
    }

    function getTransaction(uint256 _id) external view returns (TransactionRecord memory) {
        require(_id < nextTransactionId, "Transaction does not exist");
        return transactions[_id];
    }
}
