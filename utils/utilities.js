const fs = require('fs');
const axios = require('axios');
const { ethers } = require('hardhat');
const { tokens } = require('../constants/polygon/tokens');
const { BASE_TOKENS, FLASH_POOL, ROUTERS, UNISWAP_V3_FEE } = require('../constants/polygon/addresses');

const fetchQuote = async (params) => {
    const { data } = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?sellToken=${params.sellToken}&buyToken=${params.buyToken}&sellAmount=${params.sellAmount}&excludedSources=ComethSwap,mStable,Curve,Curve_V2,FirebirdOneSwap,Balancer_V2,KyberDMM,LiquidityProvider,IronSwap,Aave_V2,Synapse,DODO,DODO_V2,Polydex,MultiHop`);
    return data;
}

const fetchQuoteMax = async (params) => {
    const { data } = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?sellToken=${params.sellToken}&buyToken=${params.buyToken}&sellAmount=${params.sellAmount}`);
    return data;
}

const getBigNumber = (token, amount) => {
    return ethers.utils.parseUnits(amount.toString(), getDecimals(token));
}

const getDecimals = (token) => {
    return tokens[token].decimals;

};

const getBPS = (amount = 50000) => {
    switch (amount) {
        case 30000:
            return 1;
        case 100:
            return 500;
        case 1000:
            return 50;
        case 2000:
            return 25;
        case 5000:
            return 8;
        case 10000:
            return 5;
        default:
            throw new Error(`getBPS ${amount} not found`);
    }
};

const setState = () => {
    if (fs.readFileSync("IN_TRADE", "utf8").toString() === "true") {
        fs.writeFileSync("IN_TRADE", "false");
    } else {
        fs.writeFileSync("IN_TRADE", "true");
    }
};

const getState = () => {
    return fs.readFileSync("IN_TRADE", "utf8").toString();
};

const generateTokenList = () => {
    const list = [];
    for (let i in BASE_TOKENS) {
        for (let j in BASE_TOKENS) {
            for (let k in BASE_TOKENS) {
                if (i != j && j != k && k != i) {
                    list.push([i, j, k]);
                }
            }
            // if (i != j) {
            //     list.push([i, j]);
            // }
        }
    }

    fs.writeFileSync('test.txt', JSON.stringify(list));
}

class Swap {
    constructor(tokenIn, tokenOut, fees, routers, splitPercentage, spender, swapTarget, swapCallData) {
        this.tokenIn = tokenIn;
        this.tokenOut = tokenOut;
        this.fees = fees;
        this.routers = routers;
        this.splitPercentage = splitPercentage;
        this.spender = spender;
        this.swapTarget = swapTarget;
        this.swapCallData = swapCallData;
    }
}

const getRouter = (router) => {
    switch (router) {
        case 'Uniswap_V3':
            return ROUTERS.POLYGON_UNISWAP_V3;
        case 'SushiSwap':
            return ROUTERS.POLYGON_SUSHISWAP;
        case 'QuickSwap':
            return ROUTERS.POLYGON_QUICKSWAP;
        case 'ApeSwap':
            return ROUTERS.POLYGON_APESWAP;
        case 'WaultSwap':
            return ROUTERS.POLYGON_WAULTSWAP;
        case 'JetSwap':
            return ROUTERS.POLYGON_JETSWAP;
        case 'Dfyn':
            return ROUTERS.POLYGON_DFYN;
        default:
            throw new Error(`Router ${router} not found`);
    }
}

const getUniV3Fees = (token1, token2) => {
    return UNISWAP_V3_FEE[token1][token2] || 3000;
}

module.exports = {
    getBigNumber,
    getDecimals,
    generateTokenList,
    toBorrow,
    fetchQuote,
    fetchQuoteMax,
    flashPool,
    getBPS,
    setState,
    getState,
    getRouter,
    getUniV3Fees,
    Swap,
}