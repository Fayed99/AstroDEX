// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";

/**
 * @title AstroDEX
 * @notice Fully confidential DEX on Zama with encrypted balances and swaps
 * @dev Uses TFHE for homomorphic encryption of amounts
 */
contract AstroDEX is GatewayCaller {
    using TFHE for euint64;
    using TFHE for euint128;

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
        einput encryptedAmountA,
        einput encryptedAmountB,
        bytes calldata inputProofA,
        bytes calldata inputProofB,
        uint16 fee
    ) external {
        require(tokenA != tokenB, "Identical tokens");
        require(!poolExists[tokenA][tokenB] && !poolExists[tokenB][tokenA], "Pool exists");
        require(fee <= 1000, "Fee too high"); // Max 10%

        // Convert encrypted inputs to euint64
        euint64 amountA = TFHE.asEuint64(encryptedAmountA, inputProofA);
        euint64 amountB = TFHE.asEuint64(encryptedAmountB, inputProofB);

        // Check user has sufficient balance
        euint64 userBalanceA = encryptedBalances[msg.sender][tokenA];
        euint64 userBalanceB = encryptedBalances[msg.sender][tokenB];

        require(TFHE.decrypt(TFHE.ge(userBalanceA, amountA)), "Insufficient tokenA");
        require(TFHE.decrypt(TFHE.ge(userBalanceB, amountB)), "Insufficient tokenB");

        // Deduct from user balance
        encryptedBalances[msg.sender][tokenA] = TFHE.sub(userBalanceA, amountA);
        encryptedBalances[msg.sender][tokenB] = TFHE.sub(userBalanceB, amountB);

        // Initialize pool reserves
        poolReserves[tokenA][tokenB] = TFHE.asEuint128(amountA);
        poolReserves[tokenB][tokenA] = TFHE.asEuint128(amountB);

        // Calculate initial liquidity: sqrt(amountA * amountB)
        euint128 liquidityA = TFHE.asEuint128(amountA);
        euint128 liquidityB = TFHE.asEuint128(amountB);
        euint128 initialLiquidity = TFHE.mul(liquidityA, liquidityB); // Simplified

        totalLiquidity[tokenA][tokenB] = initialLiquidity;
        userLiquidity[msg.sender][tokenA][tokenB] = TFHE.asEuint64(initialLiquidity);

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
        einput encryptedAmountIn,
        bytes calldata inputProof
    ) external returns (euint64) {
        require(poolExists[tokenIn][tokenOut], "Pool does not exist");

        // Convert encrypted input
        euint64 amountIn = TFHE.asEuint64(encryptedAmountIn, inputProof);

        // Check user balance
        euint64 userBalance = encryptedBalances[msg.sender][tokenIn];
        require(TFHE.decrypt(TFHE.ge(userBalance, amountIn)), "Insufficient balance");

        // Get pool reserves
        euint128 reserveIn = poolReserves[tokenIn][tokenOut];
        euint128 reserveOut = poolReserves[tokenOut][tokenIn];

        // Calculate output amount with fee
        // amountOut = (amountIn * (10000 - fee) * reserveOut) / ((reserveIn * 10000) + (amountIn * (10000 - fee)))
        uint16 fee = poolFees[tokenIn][tokenOut];
        euint128 amountInWithFee = TFHE.mul(
            TFHE.asEuint128(amountIn),
            TFHE.asEuint128(10000 - fee)
        );

        euint128 numerator = TFHE.mul(amountInWithFee, reserveOut);
        euint128 denominator = TFHE.add(
            TFHE.mul(reserveIn, TFHE.asEuint128(10000)),
            amountInWithFee
        );

        euint128 amountOut128 = TFHE.div(numerator, denominator);
        euint64 amountOut = TFHE.asEuint64(amountOut128);

        // Update balances
        encryptedBalances[msg.sender][tokenIn] = TFHE.sub(userBalance, amountIn);
        encryptedBalances[msg.sender][tokenOut] = TFHE.add(
            encryptedBalances[msg.sender][tokenOut],
            amountOut
        );

        // Update pool reserves
        poolReserves[tokenIn][tokenOut] = TFHE.add(reserveIn, TFHE.asEuint128(amountIn));
        poolReserves[tokenOut][tokenIn] = TFHE.sub(reserveOut, amountOut128);

        emit Swap(msg.sender, tokenIn, tokenOut);

        // Allow user to decrypt their output amount
        TFHE.allow(amountOut, msg.sender);

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
        einput encryptedAmountA,
        einput encryptedAmountB,
        bytes calldata inputProofA,
        bytes calldata inputProofB
    ) external {
        require(poolExists[tokenA][tokenB], "Pool does not exist");

        euint64 amountA = TFHE.asEuint64(encryptedAmountA, inputProofA);
        euint64 amountB = TFHE.asEuint64(encryptedAmountB, inputProofB);

        // Check balances
        require(
            TFHE.decrypt(TFHE.ge(encryptedBalances[msg.sender][tokenA], amountA)),
            "Insufficient tokenA"
        );
        require(
            TFHE.decrypt(TFHE.ge(encryptedBalances[msg.sender][tokenB], amountB)),
            "Insufficient tokenB"
        );

        // Deduct from user
        encryptedBalances[msg.sender][tokenA] = TFHE.sub(
            encryptedBalances[msg.sender][tokenA],
            amountA
        );
        encryptedBalances[msg.sender][tokenB] = TFHE.sub(
            encryptedBalances[msg.sender][tokenB],
            amountB
        );

        // Add to reserves
        poolReserves[tokenA][tokenB] = TFHE.add(
            poolReserves[tokenA][tokenB],
            TFHE.asEuint128(amountA)
        );
        poolReserves[tokenB][tokenA] = TFHE.add(
            poolReserves[tokenB][tokenA],
            TFHE.asEuint128(amountB)
        );

        // Calculate LP tokens (simplified)
        euint128 liquidityMinted = TFHE.mul(
            TFHE.asEuint128(amountA),
            TFHE.asEuint128(amountB)
        );

        userLiquidity[msg.sender][tokenA][tokenB] = TFHE.add(
            userLiquidity[msg.sender][tokenA][tokenB],
            TFHE.asEuint64(liquidityMinted)
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
        einput encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = TFHE.asEuint64(encryptedAmount, inputProof);

        encryptedBalances[msg.sender][token] = TFHE.add(
            encryptedBalances[msg.sender][token],
            amount
        );

        // Allow user to view their balance
        TFHE.allow(encryptedBalances[msg.sender][token], msg.sender);
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

    /**
     * @notice Request decryption of balance via Gateway
     * @param token Token to decrypt balance for
     */
    function requestBalanceDecryption(address token) external {
        euint64 balance = encryptedBalances[msg.sender][token];

        uint256[] memory cts = new uint256[](1);
        cts[0] = Gateway.toUint256(balance);

        Gateway.requestDecryption(
            cts,
            this.callbackBalanceDecryption.selector,
            0,
            block.timestamp + 100,
            false
        );
    }

    /**
     * @notice Callback for balance decryption
     */
    function callbackBalanceDecryption(
        uint256 /*requestId*/,
        uint64 decryptedBalance
    ) external onlyGateway {
        emit BalanceDecrypted(msg.sender, address(0), decryptedBalance);
    }
}
