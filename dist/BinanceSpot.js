import BinanceStreams from "./BinanceStreams.js";
import { convertKlinesDataByRequest, convertOrderDataRequestResponse } from "./converters.js";
export default class BinanceSpot extends BinanceStreams {
    constructor(apiKey, apiSecret) {
        super(apiKey, apiSecret);
    }
    async closeListenKey() {
        return await this.signedRequest('spot', 'DELETE', '/api/v3/userDataStream');
    }
    async getStaticDepth(params) {
        return await this.publicRequest('spot', 'GET', '/api/v3/depth', { symbol: params.symbol, limit: params.limit ? params.limit : 500 });
    }
    async getKlines(params) {
        const request = await this.publicRequest('spot', 'GET', '/api/v3/klines', { symbol: params.symbol, interval: params.interval, startTime: params.startTime, endTime: params.endTime, limit: params.limit });
        if (request.errors)
            return this.formattedResponse({ errors: request.errors });
        return this.formattedResponse({ data: convertKlinesDataByRequest(request.data, params.symbol) });
    }
    async getExchangeInfo() {
        let request = await this.publicRequest('spot', 'GET', '/api/v1/exchangeInfo');
        if (request.success) {
            return this.formattedResponse({ data: request.data });
        }
        else {
            return this.formattedResponse({ errors: request.errors });
        }
    }
    async getBalance() {
        return await this.signedRequest('spot', 'GET', '/api/v3/account');
    }
    async getPositionRisk() {
        // Not applicable for spot trading
        return this.formattedResponse({ errors: 'Not applicable for spot trading' });
    }
    async getOpenPositions() {
        // Not applicable for spot trading
        return this.formattedResponse({ errors: 'Not applicable for spot trading' });
    }
    async getOpenPositionBySymbol(params) {
        // Not applicable for spot trading
        return this.formattedResponse({ errors: 'Not applicable for spot trading' });
    }
    async getOpenOrders() {
        const request = await this.signedRequest('spot', 'GET', '/api/v3/openOrders');
        if (request.success && request.data !== undefined) {
            return this.formattedResponse({ data: request.data.map(convertOrderDataRequestResponse) });
        }
        else {
            return this.formattedResponse({ errors: request.errors });
        }
    }
    async getOpenOrdersBySymbol(params) {
        const request = await this.signedRequest('spot', 'GET', '/api/v3/openOrders', { symbol: params.symbol });
        if (request.success && request.data !== undefined) {
            return this.formattedResponse({ data: request.data.map(convertOrderDataRequestResponse) });
        }
        else {
            return this.formattedResponse({ errors: request.errors });
        }
    }
    async cancelAllOpenOrders(params) {
        return await this.signedRequest('spot', 'DELETE', '/api/v3/openOrders', { symbol: params.symbol });
    }
    async cancelOrderById(params) {
        return await this.signedRequest('spot', 'DELETE', '/api/v3/order', { symbol: params.symbol, origClientOrderId: params.clientOrderId });
    }
    async trailingStopOrder(params) {
        // Not applicable for spot trading
        return this.formattedResponse({ errors: 'Not applicable for spot trading' });
    }
    async marketBuy(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: 'BUY',
            type: 'MARKET',
            quantity: params.quantity
        });
    }
    async marketSell(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: 'SELL',
            type: 'MARKET',
            quantity: params.quantity
        });
    }
    async limitBuy(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: 'BUY',
            type: 'LIMIT',
            quantity: params.quantity,
            price: params.price,
            timeInForce: 'GTC'
        });
    }
    async limitSell(params) {
        return this.customOrder({
            symbol: params.symbol,
            side: 'SELL',
            type: 'LIMIT',
            quantity: params.quantity,
            price: params.price,
            timeInForce: 'GTC'
        });
    }
    async stopOrder(params) {
        // Not applicable for spot trading
        return this.formattedResponse({ errors: 'Not applicable for spot trading' });
    }
    async reduceLimitOrder(params) {
        // Not applicable for spot trading
        return this.formattedResponse({ errors: 'Not applicable for spot trading' });
    }
    async stopLimitOrder(params) {
        // Not applicable for spot trading
        return this.formattedResponse({ errors: 'Not applicable for spot trading' });
    }
    async reducePosition(params) {
        // Not applicable for spot trading
        return this.formattedResponse({ errors: 'Not applicable for spot trading' });
    }
    async customOrder(orderInput) {
        const { symbol, side, type, quantity = undefined, price = undefined, timeInForce = undefined } = orderInput;
        const timestamp = Date.now();
        let params = {
            symbol,
            side,
            type,
            timeInForce,
            quantity,
            price,
            timestamp,
            recvWindow: this.recvWindow,
            newOrderResponseType: 'RESULT'
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        return await this.signedRequest('spot', 'POST', '/api/v3/order', params);
    }
}
