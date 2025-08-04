// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CrossChainTWAP
 * @dev Schedules time-weighted average price (TWAP) swaps between Etherlink and Base.
 * Users can schedule swaps that execute via 1inch Fusion+ off-chain.
 * This contract only stores orders and emits events — no direct swap logic.
 *
 * Flow:
 * 1. User calls scheduleSwap()
 * 2. Contract locks tokens
 * 3. Emits SwapScheduled
 * 4. Off-chain relayer detects event
 * 5. Relayer creates 1inch Fusion+ cross-chain order
 */
contract CrossChainTWAP2 {
    using SafeERC20 for IERC20;

    // Struct to represent a scheduled swap
    struct SwapOrder {
        address owner;           // User who scheduled the swap
        address fromToken;       // Token to swap from (e.g., USDC on Etherlink)
        address toToken;         // Token to swap to (e.g., USDC on Base)
        uint256 totalAmount;     // Total amount to swap
        uint256 numSlices;       // Number of time slices
        uint256 interval;        // Time between slices (seconds)
        uint256 startTime;       // When the first slice can execute
        uint256 executedSlices;  // How many slices have been executed
        uint256 minReturnAmount; // Minimum total return expected
        bool canceled;           // Whether the swap was canceled
        bool isBaseToEtherlink;  // Direction of swap
    }

    // Array of all orders
    SwapOrder[] public orders;

    // Maps user → list of their order IDs
    mapping(address => uint256[]) public userOrders;

    // LayerZero Chain IDs (for off-chain use)
    uint16 public constant BASE_CHAIN_ID = 10106;      // LayerZero ID for Base
    uint16 public constant ETHERLINK_CHAIN_ID = 10208;  // LayerZero ID for Etherlink

    // Event emitted when a swap is scheduled
    event SwapScheduled(
        uint256 indexed orderId,
        address indexed owner,
        address fromToken,
        address toToken,
        uint256 totalAmount,
        bool isBaseToEtherlink
    );

    // Event emitted when a slice is executed (off-chain)
    event SliceExecuted(
        uint256 indexed orderId,
        uint256 sliceId,
        uint256 amountIn,
        uint256 amountOut
    );

    // Event emitted when swap is canceled
    event SwapCanceled(uint256 indexed orderId);

    /**
     * @dev Constructor (no setup needed)
     */
    constructor() {}

    /**
     * @dev Schedule a new TWAP swap
     * @param fromToken Token to swap from
     * @param toToken Token to swap to
     * @param totalAmount Total amount to swap
     * @param numSlices Number of time slices
     * @param interval Time between slices (seconds)
     * @param minReturnAmount Minimum total return expected
     * @param isBaseToEtherlink Direction: true = Base → Etherlink, false = Etherlink → Base
     */
    function scheduleSwap(
        address fromToken,
        address toToken,
        uint256 totalAmount,
        uint256 numSlices,
        uint256 interval,
        uint256 minReturnAmount,
        bool isBaseToEtherlink
    ) external {
        // Input validation
        require(numSlices > 0, "CrossChainTWAP: numSlices must be > 0");
        require(interval >= 60, "CrossChainTWAP: interval must be >= 60 seconds");
        require(totalAmount > 0, "CrossChainTWAP: totalAmount must be > 0");

        // Create new order
        uint256 orderId = orders.length;
        orders.push(SwapOrder({
            owner: msg.sender,
            fromToken: fromToken,
            toToken: toToken,
            totalAmount: totalAmount,
            numSlices: numSlices,
            interval: interval,
            startTime: block.timestamp,
            executedSlices: 0,
            minReturnAmount: minReturnAmount,
            canceled: false,
            isBaseToEtherlink: isBaseToEtherlink
        }));

        // Record order ID for user
        userOrders[msg.sender].push(orderId);

        // Transfer tokens to this contract
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), totalAmount);

        // Emit event (for relayer to detect)
        emit SwapScheduled(orderId, msg.sender, fromToken, toToken, totalAmount, isBaseToEtherlink);
    }

    /**
     * @dev Get the number of orders for a user
     */
    function getOrderCount(address user) external view returns (uint256) {
        return userOrders[user].length;
    }

    /**
     * @dev Get a specific order by index
     * @param user User address
     * @param index Index in their order list
     */
    function getOrder(address user, uint256 index) external view returns (SwapOrder memory) {
        require(index < userOrders[user].length, "CrossChainTWAP: index out of bounds");
        uint256 orderId = userOrders[user][index];
        return orders[orderId];
    }

    /**
     * @dev Cancel a swap (only before any execution)
     */
    function cancelSwap(uint256 orderId) external {
        require(orderId < orders.length, "CrossChainTWAP: invalid orderId");
        require(orders[orderId].owner == msg.sender, "CrossChainTWAP: not owner");
        require(orders[orderId].executedSlices == 0, "CrossChainTWAP: already started");
        orders[orderId].canceled = true;
        emit SwapCanceled(orderId);
    }
}