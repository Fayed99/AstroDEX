// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title AstroDEX
 * @notice Fully confidential DEX on Zama with encrypted balances and swaps
 * @dev Uses FHE for homomorphic encryption of amounts
 */
contract AstroDEX is SepoliaConfig {
    using FHE for euint64;
    using FHE for euint128;

    // Encrypted balances: user => token => encrypted balance
    mapping(address => mapping(address => euint64)) private encryptedBalances;

    // Pool reserves: tokenA => tokenB => encrypted reserve
    mapping(address => mapping(address => euint128)) private poolReserves;

    // Pool liquidity tokens
    mapping(address => mapping(address => euint128)) private totalLiquidity;

    // User liquidity positions: user => tokenA => tokenB => LP tokens
    mapping(address => mapping(address => mapping(address => euint64))) private userLiquidity;

    // Pool fees (in basis points, e.g., 30 = 0.3%)
    mapping(address => mapping(address => uint16)) public poolFees;

    // Pool existence tracking
    mapping(address => mapping(address => bool)) public poolExists;

    // Events
    event PoolCreated(address indexed tokenA, address indexed tokenB, uint16 fee);
    event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut);
    event LiquidityAdded(address indexed user, address indexed tokenA, address indexed tokenB);
    event LiquidityRemoved(address indexed user, address indexed tokenA, address indexed tokenB);
    event BalanceDecrypted(address indexed user, address indexed token, uint64 amount);

    /**
     * @notice Create a new liquidity pool
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param encryptedAmountA Encrypted amount of tokenA (with input proof)
     * @param encryptedAmountB Encrypted amount of tokenB (with input proof)
     * @param fee Pool fee in basis points (e.g., 30 for 0.3%)
     */
    function createPool(
        address tokenA,
        address tokenB,
        externalEuint64 encryptedAmountA,
        externalEuint64 encryptedAmountB,
        bytes calldata inputProofA,
        bytes calldata inputProofB,
        uint16 fee
    ) external {
        require(tokenA != tokenB, "Identical tokens");
        require(!poolExists[tokenA][tokenB] && !poolExists[tokenB][tokenA], "Pool exists");
        require(fee <= 1000, "Fee too high"); // Max 10%

        // Convert encrypted inputs to euint64
        euint64 amountA = FHE.fromExternal(encryptedAmountA, inputProofA);
        euint64 amountB = FHE.fromExternal(encryptedAmountB, inputProofB);

        // Check user has sufficient balance (encrypted comparison)
        euint64 userBalanceA = encryptedBalances[msg.sender][tokenA];
        euint64 userBalanceB = encryptedBalances[msg.sender][tokenB];

        ebool hasEnoughA = FHE.ge(userBalanceA, amountA);
        ebool hasEnoughB = FHE.ge(userBalanceB, amountB);
        ebool canCreatePool = FHE.and(hasEnoughA, hasEnoughB);

        // Use FHE.select to deduct amounts if sufficient, otherwise 0
        euint64 deductA = FHE.select(canCreatePool, amountA, FHE.asEuint64(0));
        euint64 deductB = FHE.select(canCreatePool, amountB, FHE.asEuint64(0));

        // Deduct from user balance
        encryptedBalances[msg.sender][tokenA] = FHE.sub(userBalanceA, deductA);
        encryptedBalances[msg.sender][tokenB] = FHE.sub(userBalanceB, deductB);

        // Initialize pool reserves with actually deducted amounts
        poolReserves[tokenA][tokenB] = FHE.asEuint128(deductA);
        poolReserves[tokenB][tokenA] = FHE.asEuint128(deductB);

        // Calculate initial liquidity: sqrt(amountA * amountB)
        euint128 liquidityA = FHE.asEuint128(deductA);
        euint128 liquidityB = FHE.asEuint128(deductB);
        euint128 initialLiquidity = FHE.mul(liquidityA, liquidityB); // Simplified

        totalLiquidity[tokenA][tokenB] = initialLiquidity;
        userLiquidity[msg.sender][tokenA][tokenB] = FHE.asEuint64(initialLiquidity);

        poolFees[tokenA][tokenB] = fee;
        poolFees[tokenB][tokenA] = fee;
        poolExists[tokenA][tokenB] = true;
        poolExists[tokenB][tokenA] = true;

        emit PoolCreated(tokenA, tokenB, fee);
    }

    /**
     * @notice Swap tokens with encrypted amounts
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param encryptedAmountIn Encrypted input amount
     * @param inputProof Input proof for encryption
     */
    function swap(
        address tokenIn,
        address tokenOut,
        externalEuint64 encryptedAmountIn,
        bytes calldata inputProof
    ) external returns (euint64) {
        require(poolExists[tokenIn][tokenOut], "Pool does not exist");

        // Convert encrypted input
        euint64 amountIn = FHE.fromExternal(encryptedAmountIn, inputProof);

        // Check user balance (encrypted comparison)
        euint64 userBalance = encryptedBalances[msg.sender][tokenIn];
        ebool hasEnoughBalance = FHE.ge(userBalance, amountIn);

        // Use FHE.select to swap amount if sufficient, otherwise 0
        euint64 swapAmountIn = FHE.select(hasEnoughBalance, amountIn, FHE.asEuint64(0));

        // Get pool reserves
        euint128 reserveIn = poolReserves[tokenIn][tokenOut];
        euint128 reserveOut = poolReserves[tokenOut][tokenIn];

        // NOTE: FHE limitation - Full AMM formula requires division by encrypted denominator
        // which is not supported. Using simplified constant-product approximation.
        // For a production DEX, consider hybrid approaches with partial decryption.
        uint16 fee = poolFees[tokenIn][tokenOut];

        // Simplified: amountOut ≈ (amountIn * reserveOut) / fixedDivisor
        // This is NOT a proper AMM but demonstrates FHE constraints
        euint128 amountInAfterFee = FHE.mul(
            FHE.asEuint128(swapAmountIn),
            uint128(10000 - fee)
        );
        amountInAfterFee = FHE.div(amountInAfterFee, uint128(10000));

        euint128 amountOut128 = FHE.mul(amountInAfterFee, reserveOut);
        // Simplified division by a conservative factor to prevent pool drainage
        amountOut128 = FHE.div(amountOut128, uint128(10000));
        euint64 amountOut = FHE.asEuint64(amountOut128);

        // Update balances
        encryptedBalances[msg.sender][tokenIn] = FHE.sub(userBalance, swapAmountIn);
        encryptedBalances[msg.sender][tokenOut] = FHE.add(
            encryptedBalances[msg.sender][tokenOut],
            amountOut
        );

        // Update pool reserves
        poolReserves[tokenIn][tokenOut] = FHE.add(reserveIn, FHE.asEuint128(swapAmountIn));
        poolReserves[tokenOut][tokenIn] = FHE.sub(reserveOut, amountOut128);

        emit Swap(msg.sender, tokenIn, tokenOut);

        // Allow user to decrypt their output amount
        FHE.allow(amountOut, msg.sender);

        return amountOut;
    }

    /**
     * @notice Add liquidity to existing pool
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param encryptedAmountA Encrypted amount of tokenA
     * @param encryptedAmountB Encrypted amount of tokenB
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        externalEuint64 encryptedAmountA,
        externalEuint64 encryptedAmountB,
        bytes calldata inputProofA,
        bytes calldata inputProofB
    ) external {
        require(poolExists[tokenA][tokenB], "Pool does not exist");

        euint64 amountA = FHE.fromExternal(encryptedAmountA, inputProofA);
        euint64 amountB = FHE.fromExternal(encryptedAmountB, inputProofB);

        // Check balances (encrypted comparison)
        euint64 userBalanceA = encryptedBalances[msg.sender][tokenA];
        euint64 userBalanceB = encryptedBalances[msg.sender][tokenB];

        ebool hasEnoughA = FHE.ge(userBalanceA, amountA);
        ebool hasEnoughB = FHE.ge(userBalanceB, amountB);
        ebool canAddLiquidity = FHE.and(hasEnoughA, hasEnoughB);

        // Use FHE.select to add amounts if sufficient, otherwise 0
        euint64 addAmountA = FHE.select(canAddLiquidity, amountA, FHE.asEuint64(0));
        euint64 addAmountB = FHE.select(canAddLiquidity, amountB, FHE.asEuint64(0));

        // Deduct from user
        encryptedBalances[msg.sender][tokenA] = FHE.sub(userBalanceA, addAmountA);
        encryptedBalances[msg.sender][tokenB] = FHE.sub(userBalanceB, addAmountB);

        // Add to reserves
        poolReserves[tokenA][tokenB] = FHE.add(
            poolReserves[tokenA][tokenB],
            FHE.asEuint128(addAmountA)
        );
        poolReserves[tokenB][tokenA] = FHE.add(
            poolReserves[tokenB][tokenA],
            FHE.asEuint128(addAmountB)
        );

        // Calculate LP tokens (simplified)
        euint128 liquidityMinted = FHE.mul(
            FHE.asEuint128(addAmountA),
            FHE.asEuint128(addAmountB)
        );

        userLiquidity[msg.sender][tokenA][tokenB] = FHE.add(
            userLiquidity[msg.sender][tokenA][tokenB],
            FHE.asEuint64(liquidityMinted)
        );

        emit LiquidityAdded(msg.sender, tokenA, tokenB);
    }

    /**
     * @notice Deposit tokens to get encrypted balance
     * @param token Token address
     * @param encryptedAmount Encrypted amount to deposit
     */
    function deposit(
        address token,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        encryptedBalances[msg.sender][token] = FHE.add(
            encryptedBalances[msg.sender][token],
            amount
        );

        // Allow user to view their balance
        FHE.allow(encryptedBalances[msg.sender][token], msg.sender);
    }

    /**
     * @notice Get encrypted balance (user can decrypt with their key)
     * @param token Token address
     * @return Encrypted balance
     */
    function getBalance(address token) external view returns (euint64) {
        return encryptedBalances[msg.sender][token];
    }

    /**
     * @notice Get pool reserves (encrypted)
     * @param tokenA First token
     * @param tokenB Second token
     */
    function getReserves(address tokenA, address tokenB)
        external
        view
        returns (euint128, euint128)
    {
        return (poolReserves[tokenA][tokenB], poolReserves[tokenB][tokenA]);
    }

    // TODO: Implement decryption using new @fhevm/solidity decryption oracle API
    // The Gateway API has been replaced with a new decryption oracle system
    // See: IDecryptionOracle in @fhevm/solidity/lib/FHE.sol
}
