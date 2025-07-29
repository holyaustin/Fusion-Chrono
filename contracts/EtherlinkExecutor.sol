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
    error InsufficientOutput();
    
    event SwapExecuted(
        bytes32 indexed orderId,    // indexed for cheaper filtering
        uint256 indexed chunkIndex, // added index for better filtering
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _aggregator, address _bridge) Ownable(msg.sender) {
        // Combined validation check saves gas
        if (_aggregator == address(0) || _bridge == address(0)) {
            revert InvalidAddress();
        }
        
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
        
        // Transfer tokens from bridge (single call)
        token.safeTransferFrom(bridge, address(this), amountIn);
        
        // Optimized approval process
        uint256 currentAllowance = token.allowance(address(this), aggregator);
        if (currentAllowance < amountIn) {
            token.forceApprove(aggregator, 0);  // Reset if needed
            token.forceApprove(aggregator, amountIn);
        }
        
        // Cache initial balance
        uint256 initialBalance = IERC20(tokenOut).balanceOf(address(this));
        
        // Execute swap with error data
        (bool success, bytes memory data) = aggregator.call(swapData);
        if (!success) revert SwapFailed(data);
        
        // Calculate actual output with overflow protection
        uint256 finalBalance = IERC20(tokenOut).balanceOf(address(this));
        uint256 amountOut = finalBalance - initialBalance;
        
        // Revert if no tokens received
        if (amountOut == 0) revert InsufficientOutput();
        
        // Emit event with actual values
        emit SwapExecuted(orderId, chunkIndex, tokenIn, tokenOut, amountIn, amountOut);
    }
    
    function setBridge(address _bridge) external onlyOwner {
        if (_bridge == address(0)) revert InvalidAddress();
        bridge = _bridge;
    }
    
    // Add recovery function for safety
    function recoverToken(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).safeTransfer(owner(), amount);
    }
}