// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CrossChainTWAP
 * @dev Schedules time-weighted average price (TWAP) swaps.
 * Users on Etherlink can schedule swaps that execute on Optimism Sepolia via 1inch Fusion+.
 * This contract only stores orders and emits events — no cross-chain logic.
 */
contract CrossChainTWAP {
    using SafeERC20 for IERC20;

    // Struct to represent a scheduled swap
    struct SwapOrder {
        address owner;           // User who scheduled the swap
        address fromToken;       // Token to swap from (e.g., WETH)
        address toToken;         // Token to swap to (e.g., USDC)
        uint256 totalAmount;     // Total amount to swap
        uint256 numSlices;       // Number of time slices
        uint256 interval;        // Time between slices (seconds)
        uint256 startTime;       // When the first slice can execute
        uint256 executedSlices;  // How many slices have been executed
        uint256 minAvgReturn;    // Minimum total return expected
        bool canceled;           // Whether the swap was canceled
    }

    // Array of all orders
    SwapOrder[] public orders;

    // Maps user → list of their order IDs
    mapping(address => uint256[]) public userOrders;

    // Event emitted when a swap is scheduled
    event SwapScheduled(
        uint256 indexed orderId,
        address indexed owner,
        address fromToken,
        address toToken,
        uint256 totalAmount
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
     * @param minAvgReturn Minimum total return expected
     */
    function scheduleSwap(
        address fromToken,
        address toToken,
        uint256 totalAmount,
        uint256 numSlices,
        uint256 interval,
        uint256 minAvgReturn
    ) external {
        require(numSlices > 0, "CrossChainTWAP: numSlices > 0");
        require(interval >= 30, "CrossChainTWAP: interval >= 30s");
        require(totalAmount > 0, "CrossChainTWAP: totalAmount > 0");

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
            minAvgReturn: minAvgReturn,
            canceled: false
        }));

        userOrders[msg.sender].push(orderId);

        // Transfer tokens to this contract
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), totalAmount);

        emit SwapScheduled(orderId, msg.sender, fromToken, toToken, totalAmount);
    }

    /**
     * @dev Get the number of orders for a user
     */
    function getOrderCount(address user) external view returns (uint256) {
        return userOrders[user].length;
    }

    /**
     * @dev Get a specific order by index
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