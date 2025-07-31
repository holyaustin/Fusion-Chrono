// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@layerzerolabs/solidity-sdk-v2/contracts/lzApp/NonblockingLzApp.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// This contract receives messages from Etherlink and triggers 1inch Fusion+ swaps.

contract OptimismSwapExecutor is NonblockingLzApp {
    using SafeERC20 for IERC20;

    struct SwapParams {
        address fromToken;
        address toToken;
        uint256 amount;
        uint256 minReturn;
        address refundAddress;
    }

    address public etherlinkTWAP;
    uint16 public constant ETHERLINK_CHAIN_ID = 10208;

    event SwapExecuted(
        uint256 indexed sequence,
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 amountOut,
        address refundAddress
    );

    constructor(address _lzEndpoint, address _etherlinkTWAP) NonblockingLzApp(_lzEndpoint) {
        etherlinkTWAP = _etherlinkTWAP;
    }

    function _nonblockingLzReceive(
        uint16, // _srcChainId
        bytes memory, // _srcAddress
        uint64, // _nonce
        bytes memory _payload
    ) internal override {
        SwapParams memory params = abi.decode(_payload, (SwapParams));

        // In production: off-chain bot sees this event and calls 1inch API
        uint256 amountOut = (params.amount * 98) / 100; // mock

        emit SwapExecuted(
            _nonce,
            params.fromToken,
            params.toToken,
            params.amount,
            amountOut,
            params.refundAddress
        );

        // Send result back to Etherlink
        bytes memory response = abi.encode(amountOut, params.amount, block.timestamp);
        _sendToPeer(ETHERLINK_CHAIN_ID, addressToBytes(etherlinkTWAP), response);
    }

    function _sendToPeer(
        uint16 _dstChainId,
        bytes memory _destination,
        bytes memory _payload
    ) internal {
        _lzSend(_dstChainId, _destination, _payload, payable(0x0), address(0x0), bytes(""));
    }

    function addressToBytes(address _addr) internal pure returns (bytes memory) {
        return abi.encodePacked(_addr);
    }

    function setEtherlinkTWAP(address _addr) external {
        etherlinkTWAP = _addr;
    }
}