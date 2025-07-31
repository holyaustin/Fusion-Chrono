// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TWAPManager is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct Order {
        address owner;
        address tokenIn;
        address tokenOut;
        uint256 totalAmount;
        uint256 chunks;
        uint256 interval;
        uint256 chunksExecuted;
        uint256 nextExecution;
    }
    
    mapping(bytes32 => Order) public orders;
    address public bridge;
    
    event OrderCreated(bytes32 orderId, address owner);
    event ChunkInitiated(
        bytes32 orderId,
        uint256 chunkIndex,
        address tokenIn,
        address tokenOut,
        uint256 amount
    );
    
    constructor(address _bridge) {
        require(_bridge != address(0), "Invalid bridge address");
        bridge = _bridge;
    }
    
    function createOrder(
        address tokenIn,
        address tokenOut,
        uint256 totalAmount,
        uint256 chunks,
        uint256 interval
    ) external nonReentrant {
        require(tokenIn != address(0), "Invalid tokenIn");
        require(tokenOut != address(0), "Invalid tokenOut");
        require(chunks > 0, "At least 1 chunk required");
        require(interval > 0, "Interval must be positive");
        require(totalAmount > 0, "Amount must be positive");
        
        // Transfer tokens from user
        IERC20 token = IERC20(tokenIn);
        token.safeTransferFrom(msg.sender, address(this), totalAmount);
        
        // Generate order ID
        bytes32 orderId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            tokenIn,
            tokenOut,
            totalAmount
        ));
        
        // Store order
        orders[orderId] = Order({
            owner: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            totalAmount: totalAmount,
            chunks: chunks,
            interval: interval,
            chunksExecuted: 0,
            nextExecution: block.timestamp
        });
        
        emit OrderCreated(orderId, msg.sender);
    }
    
    function initiateChunk(bytes32 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.owner != address(0), "Order does not exist");
        require(block.timestamp >= order.nextExecution, "Not ready");
        require(order.chunksExecuted < order.chunks, "All chunks executed");
        
        uint256 chunkAmount = order.totalAmount / order.chunks;
        IERC20 token = IERC20(order.tokenIn);
        
        // Set approval using SafeERC20's forceApprove
        token.forceApprove(bridge, chunkAmount);
        
        emit ChunkInitiated(
            orderId,
            order.chunksExecuted,
            order.tokenIn,
            order.tokenOut,
            chunkAmount
        );
        
        // Update order state
        order.chunksExecuted++;
        order.nextExecution = block.timestamp + order.interval;
    }
}