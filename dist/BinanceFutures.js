import BinanceStreams from './BinanceStreams.js';
import { convertPositionDataByRequest, convertOrderDataRequestResponse, convertKlinesDataByRequest, convertAggTradesDataByRequest, convertAlgoOrderByRequest } from './converters.js';
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
        return this.formattedResponse({ data: convertKlinesDataByRequest(request.data, params.symbol) });
    }
    async getAggTrades(params) {
        const request = await this.publicRequest('futures', 'GET', '/fapi/v1/aggTrades', { symbol: params.symbol, startTime: params.startTime, endTime: params.endTime, limit: params.limit });
        if (request.errors)
            return this.formattedResponse({ errors: request.errors });
        return this.formattedResponse({ data: convertAggTradesDataByRequest(request.data, params.symbol) });
    }
    async getLongShortRatio(params) {
        const request = await this.publicRequest('futures', 'GET', '/futures/data/takerlongshortRatio', { symbol: params.symbol, limit: params.limit, period: params.period, startTime: params.startTime, endTime: params.endTime });
        if (request.errors)
            return this.formattedResponse({ errors: request.errors });
        return this.formattedResponse({ data: request.data });
    }
    async getBalance() {
        return await this.signedRequest('futures', 'GET', '/fapi/v2/balance');
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
        if (request.errors || !request.data)
            return this.formattedResponse({ errors: request.errors });
        let position = request.data.find(p => p.symbol === params.symbol);
        if (typeof position === 'undefined')
            return this.formattedResponse({ errors: 'Position not found' });
        return this.formattedResponse({ data: position });
    }
    async getOpenOrders(symbol) {
        const query = symbol ? { symbol } : {};
        const [regularRes, algoRes] = await Promise.all([
            this.signedRequest('futures', 'GET', '/fapi/v1/openOrders', query),
            this.signedRequest('futures', 'GET', '/fapi/v1/openAlgoOrders', query) // correct endpoint
        ]).catch(err => {
            const msg = err || 'Network error';
            return [
                { success: false, errors: msg },
                { success: false, errors: msg }
            ];
        });
        // If any error, return it
        if (regularRes.errors || algoRes.errors)
            return this.formattedResponse({ errors: regularRes.errors || algoRes.errors });
        const orders = [];
        const errorMessages = [];
        // Regular orders
        if (regularRes.success && regularRes.data) {
            orders.push(...regularRes.data.map(convertOrderDataRequestResponse));
        }
        else if (regularRes.errors?.length) {
            errorMessages.push(regularRes.errors);
        }
        // Algo orders
        if (algoRes.success && algoRes.data) {
            orders.push(...algoRes.data.map(convertAlgoOrderByRequest));
        }
        else if (algoRes.errors?.length) {
            errorMessages.push(algoRes.errors);
        }
        // Success if we got any orders, even with partial errors
        return this.formattedResponse({
            data: orders,
            errors: errorMessages.length > 0 ? errorMessages.join('; ') : undefined
        });
    }
    async getOpenOrdersBySymbol(params) {
        return await this.getOpenOrders(params.symbol);
    }
    async cancelAllOpenOrders(params) {
        const requestReg = this.signedRequest('futures', 'DELETE', '/fapi/v1/allOpenOrders', { symbol: params.symbol });
        const requestAlgo = this.signedRequest('futures', 'DELETE', '/fapi/v1/algoOpenOrders', { symbol: params.symbol });
        const [regularRes, algoRes] = await Promise.all([requestReg, requestAlgo]);
        if (regularRes.success && algoRes.success) {
            return this.formattedResponse({ data: { regular: regularRes.data, algo: algoRes.data } });
        }
        else {
            return this.formattedResponse({ errors: JSON.stringify([regularRes.errors, algoRes.errors]) });
        }
    }
    async cancelOrderById(params) {
        if (params.isAlgoOrder) {
            return await this.signedRequest('futures', 'DELETE', '/fapi/v1/algoOrder', { symbol: params.symbol, clientalgoid: params.clientOrderId });
        }
        return await this.signedRequest('futures', 'DELETE', '/fapi/v1/order', { symbol: params.symbol, origClientOrderId: params.clientOrderId });
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
            algoType: 'CONDITIONAL',
            symbol: params.symbol,
            side: params.side,
            type: params.type,
            stopPrice: params.price,
            triggerPrice: params.price,
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
    async reduceStopOrder(params) {
        return this.customOrder({
            algoType: 'CONDITIONAL',
            symbol: params.symbol,
            side: params.side,
            type: 'STOP_MARKET',
            triggerPrice: params.price,
            stopPrice: params.price,
            quantity: params.quantity,
            reduceOnly: true,
            timeInForce: 'GTC',
            workingType: params.workingType,
        });
    }
    async stopMarketOrder(params) {
        return this.customOrder({
            algoType: 'CONDITIONAL',
            symbol: params.symbol,
            side: params.side,
            type: 'STOP_MARKET',
            quantity: params.quantity,
            triggerPrice: params.price,
            stopPrice: params.price,
            timeInForce: 'GTC'
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
    async trailingStopOrder(params) {
        return this.customOrder({
            algoType: 'CONDITIONAL',
            symbol: params.symbol,
            side: params.side,
            type: 'TRAILING_STOP_MARKET',
            quantity: params.quantity,
            callbackRate: params.callbackRate,
            activationPrice: params.activationPrice,
            reduceOnly: true
        });
    }
    async customOrder(orderInput) {
        const { symbol, side, type, quantity = undefined, price = undefined, triggerPrice = undefined, 
        // timeInForce = orderInput.reduceOnly ? undefined : 'GTC',
        timeInForce = undefined, stopPrice = undefined, //used with STOP_MARKET or TAKE_PROFIT_MARKET
        closePosition = false, //used with STOP_MARKET or TAKE_PROFIT_MARKET
        reduceOnly = undefined, workingType = 'CONTRACT_PRICE', callbackRate = undefined, //used with trailing
        activationPrice = undefined, //used with trailing
        algoType = undefined //used with trailing
         } = orderInput;
        const timestamp = Date.now();
        let params = {
            symbol,
            side,
            type,
            timeInForce,
            quantity,
            price,
            triggerPrice,
            stopPrice,
            closePosition,
            reduceOnly,
            workingType,
            timestamp,
            recWindow: this.recvWindow,
            newOrderResponseType: 'RESULT',
            callbackRate,
            activationPrice,
            algoType
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        if (algoType)
            return await this.signedRequest('futures', 'POST', '/fapi/v1/algoOrder', params);
        else
            return await this.signedRequest('futures', 'POST', '/fapi/v1/order', params);
    }
}
