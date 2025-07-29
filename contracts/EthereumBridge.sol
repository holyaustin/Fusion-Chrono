// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract EthereumBridge is AccessControl {
    using SafeERC20 for IERC20;
    
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    
    event CrossChainTransfer(
        bytes32 indexed orderId,
        uint256 chunkIndex,
        address token,
        uint256 amount,
        address recipient
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function lockTokens(
        bytes32 orderId,
        uint256 chunkIndex,
        address token,
        uint256 amount,
        address recipient
    ) external onlyRole(EXECUTOR_ROLE) {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit CrossChainTransfer(orderId, chunkIndex, token, amount, recipient);
    }
}