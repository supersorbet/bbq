//SPDX-License-Identifier: frensware
pragma solidity ^0.8.0;

import "./uniswap/v3/ISwapRouter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Arbys is Ownable {
    struct Swap {
        address tokenIn;
        address tokenOut;
        uint24[] fees;
        address[] routers;
        uint256[] splitPercentage;
        address spender;
        address swapTarget;
        bytes swapCallData;
    }

    function zrxFillQuote(
        address tokenIn,
        address spender,
        address payable swapTarget,
        bytes memory swapCallData
    ) internal returns (bool) {
        IERC20(tokenIn).approve(
            spender,
            0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
        );

        (bool success, ) = swapTarget.call{value: msg.value}(swapCallData);

        if (success) {
            payable(address(this)).transfer(address(this).balance);
            return true;
        }

        return false;
    }

    receive() external payable {}

    function uniswapV2(
        address _router,
        address _tokenIn,
        address _tokenOut,
        uint256 _amount
    ) private {
        IERC20(_tokenIn).approve(_router, _amount);
        address[] memory path;
        path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;
        uint256 deadline = block.timestamp;
        IUniswapV2Router(_router).swapExactTokensForTokens(
            _amount,
            1,
            path,
            address(this),
            deadline
        );
    }

    function uniswapV3(
        address _router,
        address _token1,
        address _token2,
        uint256 _amount,
        uint24 _fee
    ) internal returns (uint256 amountOut) {
        ISwapRouter swapRouter = ISwapRouter(_router);
        IERC20(_token1).approve(address(swapRouter), _amount);

        amountOut = swapRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: _token1,
                tokenOut: _token2,
                fee: _fee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: _amount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        );
    }

    function getBalance(address _tokenContractAddress)
        external
        view
        returns (uint256)
    {
        uint256 balance = IERC20(_tokenContractAddress).balanceOf(
            address(this)
        );
        return balance;
    }

    function recoverNative() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function recoverTokens(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

}

interface IUniswapV2Router {
    function getAmountsOut(uint256 amountIn, address[] memory path)
        external
        view
        returns (uint256[] memory amounts);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

interface IUniswapV2Pair {
    function token0() external view returns (address);

    function token1() external view returns (address);

    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external;
}
