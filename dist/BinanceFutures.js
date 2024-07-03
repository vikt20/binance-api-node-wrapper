import BinanceStreams from './BinanceStreams.js';
import { convertPositionDataByRequest, convertOrderDataRequestResponse } from './converters.js';
export default class BinanceFutures extends BinanceStreams {
    constructor(apiKey, apiSecret) {
        super(apiKey, apiSecret);
    }
    async closeListenKey() {
        return await this.signedRequest('futures', 'DELETE', '/fapi/v1/listenKey');
    }
    async getExchangeInfo() {
        let request = await this.publicRequest('futures', 'GET', '/fapi/v1/exchangeInfo');
        // return this.formattedResponse({ data: this.extractInfo(request.data) });
        if (request.success) {
            return this.formattedResponse({ data: request.data });
        }
        else {
            return this.formattedResponse({ errors: request.errors });
        }
    }
    async getStaticDepth(params) {
        return await this.publicRequest('futures', 'GET', '/fapi/v1/depth', { symbol: params.symbol, limit: params.limit ? params.limit : 500 });
    }
    async getKlines(params) {
        const request = await this.publicRequest('futures', 'GET', '/fapi/v1/klines', { symbol: params.symbol, interval: params.interval, startTime: params.startTime, endTime: params.endTime, limit: params.limit });
        if (request.errors)
            return this.formattedResponse({ errors: request.errors });
        return this.formattedResponse({ data: request.data });
    }
    async getPositionRisk() {
        return await this.signedRequest('futures', 'GET', '/fapi/v2/positionRisk');
    }
    async getOpenPositions() {
        let request = await this.getPositionRisk();
        if (request.errors)
            return request;
        let markets = Object.keys(request.data);
        let arrayOfPositions = [];
        if (typeof markets !== 'undefined' && markets.length > 0) {
            for (let market of markets) {
                let obj = request.data[market], size = Number(obj.positionAmt);
                if (size == 0)
                    continue;
                //  console.info( obj ); //positionAmt entryPrice markPrice unRealizedProfit liquidationPrice leverage marginType isolatedMargin isAutoAddMargin maxNotionalValue
                arrayOfPositions.push(obj);
            }
        }
        // console.log(`ArrayofPositionsBinanceFutures:`, arrayOfPositions);
        return this.formattedResponse({ data: arrayOfPositions.map(convertPositionDataByRequest) });
    }
    async getOpenPositionBySymbol(params) {
        let request = await this.getOpenPositions();
        if (request.errors)
            return this.formattedResponse({ errors: request.errors });
        let position = request.data.find(p => p.symbol === params.symbol);
        if (typeof position === 'undefined')
            return this.formattedResponse({ errors: 'Position not found' });
        return this.formattedResponse({ data: position });
    }
    async getOpenOrders() {
        const request = await this.signedRequest('futures', 'GET', '/fapi/v1/openOrders');
        if (request.success && request.data !== undefined) {
            return this.formattedResponse({ data: request.data.map(convertOrderDataRequestResponse) });
        }
        else {
            return this.formattedResponse({ errors: request.errors });
        }
    }
    async getOpenOrdersBySymbol(params) {
        const request = await this.signedRequest('futures', 'GET', '/fapi/v1/openOrders', { symbol: params.symbol });
        if (request.success && request.data !== undefined) {
            return this.formattedResponse({ data: request.data.map(convertOrderDataRequestResponse) });
        }
        else {
            return this.formattedResponse({ errors: request.errors });
        }
    }
    async cancelAllOpenOrders(params) {
        return await this.signedRequest('futures', 'DELETE', '/fapi/v1/allOpenOrders', { symbol: params.symbol });
    }
    async cancelOrderById(params) {
        return await this.signedRequest('futures', 'DELETE', '/fapi/v1/order', { symbol: params.symbol, origClientOrderId: params.clientOrderId });
    }
    async trailingStopOrder(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: params.side,
            type: 'TRAILING_STOP_MARKET',
            quantity: params.quantity,
            callbackRate: params.callbackRate,
            activationPrice: params.activationPrice,
            reduceOnly: true
        });
    }
    async marketBuy(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: 'BUY',
            type: 'MARKET',
            quantity: params.quantity,
            reduceOnly: params.reduceOnly
        });
    }
    async marketSell(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: 'SELL',
            type: 'MARKET',
            quantity: params.quantity,
            reduceOnly: params.reduceOnly
        });
    }
    async limitBuy(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: 'BUY',
            type: 'LIMIT',
            quantity: params.quantity,
            price: params.price,
            workingType: 'CONTRACT_PRICE',
            timeInForce: 'GTX'
        });
    }
    async limitSell(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: 'SELL',
            type: 'LIMIT',
            quantity: params.quantity,
            price: params.price,
            workingType: 'CONTRACT_PRICE',
            timeInForce: 'GTX'
        });
    }
    async stopOrder(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: params.side,
            type: params.type,
            stopPrice: params.price,
            closePosition: true,
            workingType: params.workingType,
        });
    }
    async reduceLimitOrder(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: params.side,
            type: 'LIMIT',
            price: params.price,
            quantity: params.quantity,
            reduceOnly: true,
            timeInForce: 'GTC',
            workingType: params.workingType,
        });
    }
    async stopLimitOrder(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: params.side,
            type: 'STOP',
            quantity: params.quantity,
            stopPrice: params.price,
            price: params.price,
        });
    }
    async reducePosition(params) {
        if (params.positionDirection === 'LONG')
            return await this.marketSell({ symbol: params.symbol, quantity: params.quantity, reduceOnly: true });
        else if (params.positionDirection === 'SHORT')
            return await this.marketBuy({ symbol: params.symbol, quantity: params.quantity, reduceOnly: true });
        else
            return this.formattedResponse({ errors: 'Invalid position direction' });
    }
    async customOrder(orderInput) {
        const { symbol, side, type, quantity = undefined, price = undefined, 
        // timeInForce = orderInput.reduceOnly ? undefined : 'GTC',
        timeInForce = undefined, stopPrice = undefined, //used with STOP_MARKET or TAKE_PROFIT_MARKET
        closePosition = false, //used with STOP_MARKET or TAKE_PROFIT_MARKET
        reduceOnly = undefined, workingType = 'CONTRACT_PRICE', callbackRate = undefined, //used with trailing
        activationPrice = undefined //used with trailing
         } = orderInput;
        const timestamp = Date.now();
        let params = {
            symbol,
            side,
            type,
            timeInForce,
            quantity,
            price,
            stopPrice,
            closePosition,
            reduceOnly,
            workingType,
            timestamp,
            recWindow: this.recvWindow,
            newOrderResponseType: 'RESULT',
            callbackRate,
            activationPrice
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        return await this.signedRequest('futures', 'POST', '/fapi/v1/order', params);
    }
}
