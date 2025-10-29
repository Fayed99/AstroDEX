// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

/**
 * @title EncryptedERC20
 * @notice ERC20-like token with encrypted balances using Zama's TFHE
 * @dev All balances and transfers are fully encrypted
 */
contract EncryptedERC20 {
    using TFHE for euint64;

    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    // Encrypted total supply
    euint64 private encryptedTotalSupply;

    // Encrypted balances: owner => encrypted balance
    mapping(address => euint64) internal encryptedBalances;

    // Encrypted allowances: owner => spender => encrypted allowance
    mapping(address => mapping(address => euint64)) internal encryptedAllowances;

    // Events
    event Transfer(address indexed from, address indexed to);
    event Approval(address indexed owner, address indexed spender);
    event Mint(address indexed to);

    constructor(string memory _name, string memory _symbol, uint64 initialSupply) {
        name = _name;
        symbol = _symbol;

        // Mint initial supply to deployer
        encryptedTotalSupply = TFHE.asEuint64(initialSupply);
        encryptedBalances[msg.sender] = TFHE.asEuint64(initialSupply);

        // Allow deployer to view their balance
        TFHE.allow(encryptedBalances[msg.sender], msg.sender);

        emit Mint(msg.sender);
    }

    /**
     * @notice Get encrypted balance of an account
     * @param account Address to check
     * @return Encrypted balance (can only be decrypted by account owner)
     */
    function balanceOf(address account) public view returns (euint64) {
        return encryptedBalances[account];
    }

    /**
     * @notice Transfer encrypted amount to recipient
     * @param to Recipient address
     * @param encryptedAmount Encrypted amount to transfer
     * @param inputProof Proof for the encrypted input
     */
    function transfer(
        address to,
        einput encryptedAmount,
        bytes calldata inputProof
    ) public returns (bool) {
        euint64 amount = TFHE.asEuint64(encryptedAmount, inputProof);
        _transfer(msg.sender, to, amount);
        return true;
    }

    /**
     * @notice Approve spender to spend encrypted amount
     * @param spender Address to approve
     * @param encryptedAmount Encrypted amount to approve
     * @param inputProof Proof for the encrypted input
     */
    function approve(
        address spender,
        einput encryptedAmount,
        bytes calldata inputProof
    ) public returns (bool) {
        euint64 amount = TFHE.asEuint64(encryptedAmount, inputProof);

        encryptedAllowances[msg.sender][spender] = amount;

        // Allow spender to see allowance
        TFHE.allow(amount, spender);

        emit Approval(msg.sender, spender);
        return true;
    }

    /**
     * @notice Transfer from one account to another using allowance
     * @param from Source address
     * @param to Destination address
     * @param encryptedAmount Encrypted amount to transfer
     * @param inputProof Proof for the encrypted input
     */
    function transferFrom(
        address from,
        address to,
        einput encryptedAmount,
        bytes calldata inputProof
    ) public returns (bool) {
        euint64 amount = TFHE.asEuint64(encryptedAmount, inputProof);
        euint64 currentAllowance = encryptedAllowances[from][msg.sender];

        // Check allowance is sufficient
        ebool hasEnoughAllowance = TFHE.le(amount, currentAllowance);
        require(TFHE.decrypt(hasEnoughAllowance), "Insufficient allowance");

        // Decrease allowance
        encryptedAllowances[from][msg.sender] = TFHE.sub(currentAllowance, amount);

        _transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Get encrypted allowance
     * @param owner Token owner
     * @param spender Approved spender
     */
    function allowance(address owner, address spender) public view returns (euint64) {
        return encryptedAllowances[owner][spender];
    }

    /**
     * @notice Internal transfer function
     * @param from Source address
     * @param to Destination address
     * @param amount Encrypted amount
     */
    function _transfer(address from, address to, euint64 amount) internal {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");

        euint64 balanceFrom = encryptedBalances[from];

        // Check sender has enough balance
        ebool hasEnoughBalance = TFHE.le(amount, balanceFrom);
        require(TFHE.decrypt(hasEnoughBalance), "Insufficient balance");

        // Update balances
        encryptedBalances[from] = TFHE.sub(balanceFrom, amount);
        encryptedBalances[to] = TFHE.add(encryptedBalances[to], amount);

        // Allow both parties to view their new balances
        TFHE.allow(encryptedBalances[from], from);
        TFHE.allow(encryptedBalances[to], to);

        emit Transfer(from, to);
    }

    /**
     * @notice Mint new tokens (only for testing)
     * @param to Recipient address
     * @param encryptedAmount Encrypted amount to mint
     * @param inputProof Proof for the encrypted input
     */
    function mint(
        address to,
        einput encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = TFHE.asEuint64(encryptedAmount, inputProof);

        encryptedTotalSupply = TFHE.add(encryptedTotalSupply, amount);
        encryptedBalances[to] = TFHE.add(encryptedBalances[to], amount);

        TFHE.allow(encryptedBalances[to], to);

        emit Mint(to);
    }

    /**
     * @notice Get encrypted total supply
     */
    function totalSupply() public view returns (euint64) {
        return encryptedTotalSupply;
    }
}
