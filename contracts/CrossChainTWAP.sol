// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ✅ Use OApp for bidirectional messaging
import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CrossChainTWAP is OApp {
    using SafeERC20 for IERC20;

    struct SwapOrder {
        address owner;
        address fromToken;
        address toToken;
        uint256 totalAmount;
        uint256 numSlices;
        uint256 interval;
        uint256 startTime;
        uint256 executedSlices;
        uint256 minAvgReturn;
        bool canceled;
    }

    SwapOrder[] public orders;
    mapping(address => uint256[]) public userOrders;

    address public optimismExecutor;
    uint32 public constant OPTIMISM_ENDPOINT_ID = 10132;

    event SwapScheduled(uint256 indexed orderId, address indexed owner, uint256 totalAmount);
    event SliceSent(uint256 indexed orderId, uint256 sliceId, uint256 amount);
    event SliceResultReceived(uint256 indexed orderId, uint256 amountIn, uint256 amountOut);

    struct SwapParams {
        address fromToken;
        address toToken;
        uint256 amount;
        uint256 minReturn;
        address refundAddress;
    }

    constructor(address _oapp, address _optimismExecutor) OApp(_oapp) {
        optimismExecutor = _optimismExecutor;
    }

    function scheduleSwap(
        address fromToken,
        address toToken,
        uint256 totalAmount,
        uint256 numSlices,
        uint256 interval,
        uint256 minAvgReturn
    ) external {
        require(numSlices > 0, "Slices > 0");
        require(interval >= 30, "Interval >= 30s");
        require(totalAmount > 0, "Amount > 0");

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

        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), totalAmount);
        emit SwapScheduled(orderId, msg.sender, totalAmount);
    }

    function executeNextSlice(uint256 orderId) external {
        SwapOrder storage order = orders[orderId];
        require(!order.canceled, "Canceled");
        require(order.executedSlices < order.numSlices, "Completed");
        require(block.timestamp >= order.startTime + (order.interval * order.executedSlices), "Too early");

        uint256 amountPerSlice = order.totalAmount / order.numSlices;
        uint256 sliceAmount = (order.executedSlices + 1 == order.numSlices)
            ? order.totalAmount - (amountPerSlice * order.executedSlices)
            : amountPerSlice;

        SwapParams memory params = SwapParams({
            fromToken: order.fromToken,
            toToken: order.toToken,
            amount: sliceAmount,
            minReturn: (order.minAvgReturn * sliceAmount) / order.totalAmount,
            refundAddress: order.owner
        });

        bytes memory payload = abi.encode(params);

        _send(
            OPTIMISM_ENDPOINT_ID,
            bytes32(uint256(uint160(optimismExecutor))),
            payload,
            _defaultAdapterParams()
        );

        order.executedSlices++;
        emit SliceSent(orderId, order.executedSlices, sliceAmount);
    }

    // ✅ Now valid: OApp inherits OAppReceiver → has onlyEndpoint
    function receiveMessage(
        uint32, // _srcChainId
        bytes32, // _srcAddress
        bytes memory _payload,
        bytes memory // _extraData
    ) external virtual override onlyEndpoint {
        (uint256 amountOut, uint256 amountIn, uint256 timestamp) = abi.decode(_payload, (uint256, uint256, uint256));
        emit SliceResultReceived(0, amountIn, amountOut);
    }

    function setOptimismExecutor(address _addr) external {
        optimismExecutor = _addr;
    }

    function _defaultAdapterParams() internal pure returns (bytes memory) {
        return abi.encodePacked(uint16(1), uint256(500000));
    }
}