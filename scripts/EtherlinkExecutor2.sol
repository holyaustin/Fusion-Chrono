// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EtherlinkExecutor is Ownable {
    using SafeERC20 for IERC20;
    
    address public immutable aggregator;
    address public bridge;
    
    event SwapExecuted(
        bytes32 orderId,
        uint256 chunkIndex,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _aggregator, address _bridge) Ownable(msg.sender) {
        require(_aggregator != address(0), "Invalid aggregator");
        require(_bridge != address(0), "Invalid bridge");
        aggregator = _aggregator;
        bridge = _bridge;
    }
    
    function executeSwap(
        bytes32 orderId,
        uint256 chunkIndex,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bytes calldata swapData
    ) external onlyOwner {
        IERC20 token = IERC20(tokenIn);
        
        // Transfer tokens from bridge
        token.safeTransferFrom(bridge, address(this), amountIn);
        
        // Set approval using forceApprove
        token.forceApprove(aggregator, amountIn);
        
        // Execute swap
        (bool success, ) = aggregator.call(swapData);
        require(success, "Swap failed");
        
        // Emit event
        emit SwapExecuted(orderId, chunkIndex, tokenIn, tokenOut, amountIn, 0);
    }
    
    function setBridge(address _bridge) external onlyOwner {
        require(_bridge != address(0), "Invalid bridge");
        bridge = _bridge;
    }
}