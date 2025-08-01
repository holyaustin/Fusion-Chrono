// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OAppReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract OptimismSwapExecutor is OAppReceiver {
    using SafeERC20 for IERC20;

    struct SwapParams {
        address fromToken;
        address toToken;
        uint256 amount;
        uint256 minReturn;
        address refundAddress;
    }

    address public etherlinkTWAP;
    uint32 public constant ETHERLINK_ENDPOINT_ID = 10208;

    event SwapExecuted(
        uint64 indexed nonce,
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 amountOut,
        address refundAddress
    );

    constructor(address _oapp, address _etherlinkTWAP) OAppReceiver(_oapp) {
        etherlinkTWAP = _etherlinkTWAP;
    }

    function receiveMessage(
        uint32, // _srcChainId
        bytes32, // _srcAddress
        bytes memory _payload,
        bytes memory // _extraData
    ) external virtual override onlyEndpoint {
        SwapParams memory params = abi.decode(_payload, (SwapParams));

        uint256 amountOut = (params.amount * 98) / 100; // mock

        emit SwapExecuted(
            uint64(block.number),
            params.fromToken,
            params.toToken,
            params.amount,
            amountOut,
            params.refundAddress
        );

        bytes memory response = abi.encode(amountOut, params.amount, block.timestamp);
        _send(
            ETHERLINK_ENDPOINT_ID,
            bytes32(uint256(uint160(etherlinkTWAP))),
            response,
            _defaultAdapterParams()
        );
    }

    function _defaultAdapterParams() internal pure returns (bytes memory) {
        return abi.encodePacked(uint16(1), uint256(500000));
    }

    function setEtherlinkTWAP(address _addr) external {
        etherlinkTWAP = _addr;
    }
}