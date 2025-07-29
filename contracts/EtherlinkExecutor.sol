// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EtherlinkExecutor is Ownable {
    using SafeERC20 for IERC20;
    
    address public immutable aggregator;
    address public bridge;
    
    // Custom errors for gas efficiency
    error InvalidAddress();
    error SwapFailed(bytes data);
    
    event SwapExecuted(
        bytes32 indexed orderId, // indexed for cheaper filtering
        uint256 chunkIndex,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _aggregator, address _bridge) Ownable(msg.sender) {
        // Validate with custom errors
        if (_aggregator == address(0)) revert InvalidAddress();
        if (_bridge == address(0)) revert InvalidAddress();
        
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
        
        // Reset approval to prevent front-running
        token.safeApprove(aggregator, 0);
        token.safeApprove(aggregator, amountIn);
        
        // Execute swap with error data
        (bool success, bytes memory data) = aggregator.call(swapData);
        if (!success) revert SwapFailed(data);
        
        // Calculate actual output
        uint256 amountOut = IERC20(tokenOut).balanceOf(address(this));
        
        // Emit event with actual values
        emit SwapExecuted(orderId, chunkIndex, tokenIn, tokenOut, amountIn, amountOut);
    }
    
    function setBridge(address _bridge) external onlyOwner {
        if (_bridge == address(0)) revert InvalidAddress();
        bridge = _bridge;
    }
    
    // Emergency function to recover tokens
    function recoverToken(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).safeTransfer(owner(), amount);
    }
}