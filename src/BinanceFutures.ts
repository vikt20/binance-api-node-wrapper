import BinanceStreams, { KlineData } from './BinanceStreams.js';
import { convertPositionDataByRequest, convertOrderDataRequestResponse, extractInfo, convertKlinesDataByRequest } from './converters.js';

import {
    FormattedResponse, ListenKey, GetStaticDepthParams, StaticDepth, AccountData, OrderData, OrderSide, OrderType, TimeInForce, OrderWorkingType, OrderStatus, PositionDirection, PositionSide, GetOpenOrdersBySymbolParams,
    CancelAllOpenOrdersParams,
    CancelOrderByIdParams,
    MarketOrderParams,
    TrailingStopOrderParams,
    LimitOrderParams, PositionData, StopOrderParams, ReduceOrderParams,
    StopLimitOrderParams,
    ReducePositionParams,
    ExtractedInfo,
    ExchangeInfo
} from './BinanceBase.js';

type OrderInput = {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    quantity?: number;
    price?: number;
    timeInForce?: TimeInForce;
    stopPrice?: number;
    closePosition?: boolean;
    reduceOnly?: boolean;
    workingType?: OrderWorkingType;
    callbackRate?: number;
    activationPrice?: number;
}


export type OrderRequestResponse = {
    orderId: number,
    symbol: string,
    status: OrderStatus,
    clientOrderId: string,
    price: string,
    avgPrice: string,
    origQty: string,
    executedQty: string,
    cumQuote: string,
    timeInForce: TimeInForce,
    type: OrderType,
    reduceOnly: boolean,
    closePosition: boolean,
    side: OrderSide,
    positionSide: PositionSide,
    stopPrice: string,
    workingType: OrderWorkingType,
    priceProtect: boolean,
    origType: OrderType,
    priceMatch: string,
    selfTradePreventionMode: string,
    goodTillDate: number,
    time: number,
    updateTime: number
}
export type PositionDataByRequest = {
    symbol: string;
    positionAmt: string;
    entryPrice: string;
    breakEvenPrice: string;
    markPrice: string;
    unRealizedProfit: string;
    liquidationPrice: string;
    leverage: string;
    maxNotionalValue: string;
    marginType: string;
    isolatedMargin: string;
    isAutoAddMargin: string;
    positionSide: string;
    notional: string;
    isolatedWallet: string;
    updateTime: number;
    isolated: boolean;
    adlQuantile: number;
};

export type KlineDataByRequest = [
    number, //Open time
    string, //Open
    string, //High
    string, //Low
    string, //Close
    string, //Volume
    number, //Close time
    string, //Quote asset volume
    number, //Number of trades
    string, //Taker buy base asset volume
    string, //Taker buy quote asset volume
    string //Ignore
]

export default class BinanceFutures extends BinanceStreams {
    constructor(apiKey?: string, apiSecret?: string) {
        super(apiKey, apiSecret);
    }


    async closeListenKey() {
        return await this.signedRequest('futures', 'DELETE', '/fapi/v1/listenKey');
    }

    async getExchangeInfo(): Promise<FormattedResponse<ExchangeInfo>> {
        let request = await this.publicRequest('futures', 'GET', '/fapi/v1/exchangeInfo')
        // return this.formattedResponse({ data: this.extractInfo(request.data) });
        if (request.success) {
            return this.formattedResponse({ data: request.data });
        } else {
            return this.formattedResponse({ errors: request.errors });
        }
    }
    async getStaticDepth(params: GetStaticDepthParams): Promise<FormattedResponse<StaticDepth>> {
        return await this.publicRequest('futures', 'GET', '/fapi/v1/depth', { symbol: params.symbol, limit: params.limit ? params.limit : 500 });
    }
    async getKlines(params: { symbol: string, interval: string, startTime?: number, endTime?: number, limit?: number }): Promise<FormattedResponse<KlineData[]>> {
        const request = await this.publicRequest('futures', 'GET', '/fapi/v1/klines', { symbol: params.symbol, interval: params.interval, startTime: params.startTime, endTime: params.endTime, limit: params.limit });
        if (request.errors) return this.formattedResponse({ errors: request.errors });
        return this.formattedResponse({ data: convertKlinesDataByRequest(request.data, params.symbol) });
    }
    async getBalance(): Promise<FormattedResponse<AccountData['balances']>> {
        return await this.signedRequest('futures', 'GET', '/fapi/v2/balance');
    }
    async getPositionRisk(): Promise<FormattedResponse<any>> {
        return await this.signedRequest('futures', 'GET', '/fapi/v2/positionRisk');
    }
    async getOpenPositions(): Promise<FormattedResponse<AccountData['positions']>> {
        let request = await this.getPositionRisk()
        if (request.errors) return request;
        let markets = Object.keys(request.data);
        let arrayOfPositions: PositionDataByRequest[] = [];
        if (typeof markets !== 'undefined' && markets.length > 0) {
            for (let market of markets) {
                let obj = request.data[market], size = Number(obj.positionAmt);
                if (size == 0) continue;
                //  console.info( obj ); //positionAmt entryPrice markPrice unRealizedProfit liquidationPrice leverage marginType isolatedMargin isAutoAddMargin maxNotionalValue
                arrayOfPositions.push(obj);
            }
        }
        // console.log(`ArrayofPositionsBinanceFutures:`, arrayOfPositions);
        return this.formattedResponse({ data: arrayOfPositions.map(convertPositionDataByRequest) });
    }
    async getOpenPositionBySymbol(params: { symbol: string }): Promise<FormattedResponse<PositionData>> {
        let request = await this.getOpenPositions();
        if (request.errors || !request.data) return this.formattedResponse({ errors: request.errors });
        let position = request.data.find(p => p.symbol === params.symbol);
        if (typeof position === 'undefined') return this.formattedResponse({ errors: 'Position not found' });
        return this.formattedResponse({ data: position });
    }
    async getOpenOrders(): Promise<FormattedResponse<OrderData[]>> {
        const request = await this.signedRequest('futures', 'GET', '/fapi/v1/openOrders') as FormattedResponse<OrderRequestResponse[]>;
        if (request.success && request.data !== undefined) {
            return this.formattedResponse({ data: request.data.map(convertOrderDataRequestResponse) });
        } else {
            return this.formattedResponse({ errors: request.errors });
        }
    }
    async getOpenOrdersBySymbol(params: GetOpenOrdersBySymbolParams): Promise<FormattedResponse<OrderData[]>> {
        const request = await this.signedRequest('futures', 'GET', '/fapi/v1/openOrders', { symbol: params.symbol }) as FormattedResponse<OrderRequestResponse[]>;
        if (request.success && request.data !== undefined) {
            return this.formattedResponse({ data: request.data.map(convertOrderDataRequestResponse) });
        } else {
            return this.formattedResponse({ errors: request.errors });
        }
    }
    async cancelAllOpenOrders(params: CancelAllOpenOrdersParams): Promise<FormattedResponse<any>> {
        return await this.signedRequest('futures', 'DELETE', '/fapi/v1/allOpenOrders', { symbol: params.symbol });
    }
    async cancelOrderById(params: CancelOrderByIdParams): Promise<FormattedResponse<any>> {
        return await this.signedRequest('futures', 'DELETE', '/fapi/v1/order', { symbol: params.symbol, origClientOrderId: params.clientOrderId });
    }
    async trailingStopOrder(params: TrailingStopOrderParams): Promise<FormattedResponse<OrderRequestResponse>> {
        return this.customOrder({
            symbol: params.symbol,
            side: params.side,
            type: 'TRAILING_STOP_MARKET',
            quantity: params.quantity,
            callbackRate: params.callbackRate,
            activationPrice: params.activationPrice,
            reduceOnly: true
        })
    }
    async marketBuy(params: MarketOrderParams): Promise<FormattedResponse<OrderRequestResponse>> {
        return this.customOrder({
            symbol: params.symbol,
            side: 'BUY',
            type: 'MARKET',
            quantity: params.quantity,
            reduceOnly: params.reduceOnly
        })
    }
    async marketSell(params: MarketOrderParams): Promise<FormattedResponse<OrderRequestResponse>> {
        return this.customOrder({
            symbol: params.symbol,
            side: 'SELL',
            type: 'MARKET',
            quantity: params.quantity,
            reduceOnly: params.reduceOnly
        })
    }
    async limitBuy(params: LimitOrderParams): Promise<FormattedResponse<OrderRequestResponse>> {
        return this.customOrder({
            symbol: params.symbol,
            side: 'BUY',
            type: 'LIMIT',
            quantity: params.quantity,
            price: params.price,
            workingType: 'CONTRACT_PRICE',
            timeInForce: 'GTX'
        })
    }
    async limitSell(params: LimitOrderParams): Promise<FormattedResponse<OrderRequestResponse>> {
        return this.customOrder({
            symbol: params.symbol,
            side: 'SELL',
            type: 'LIMIT',
            quantity: params.quantity,
            price: params.price,
            workingType: 'CONTRACT_PRICE',
            timeInForce: 'GTX'
        })
    }
    async stopOrder(params: StopOrderParams): Promise<FormattedResponse<OrderRequestResponse>> {
        return this.customOrder({
            symbol: params.symbol,
            side: params.side,
            type: params.type,
            stopPrice: params.price,
            closePosition: true,
            workingType: params.workingType,
        })
    }
    async reduceLimitOrder(params: ReduceOrderParams): Promise<FormattedResponse<OrderRequestResponse>> {
        return this.customOrder({
            symbol: params.symbol,
            side: params.side,
            type: 'LIMIT',
            price: params.price,
            quantity: params.quantity,
            reduceOnly: true,
            timeInForce: 'GTC',
            workingType: params.workingType,
        })
    }
    async stopLimitOrder(params: StopLimitOrderParams): Promise<FormattedResponse<OrderRequestResponse>> {
        return this.customOrder({
            symbol: params.symbol,
            side: params.side,
            type: 'STOP',
            quantity: params.quantity,
            stopPrice: params.price,
            price: params.price,
        })
    }
    async reducePosition(params: ReducePositionParams): Promise<FormattedResponse<OrderRequestResponse>> {
        if (params.positionDirection === 'LONG') return await this.marketSell({ symbol: params.symbol, quantity: params.quantity, reduceOnly: true });
        else if (params.positionDirection === 'SHORT') return await this.marketBuy({ symbol: params.symbol, quantity: params.quantity, reduceOnly: true });
        else return this.formattedResponse({ errors: 'Invalid position direction' });
    }


    async customOrder(orderInput: OrderInput): Promise<FormattedResponse<OrderRequestResponse>> {
        const {
            symbol,
            side,
            type,
            quantity = undefined,
            price = undefined,
            // timeInForce = orderInput.reduceOnly ? undefined : 'GTC',
            timeInForce = undefined,
            stopPrice = undefined, //used with STOP_MARKET or TAKE_PROFIT_MARKET
            closePosition = false, //used with STOP_MARKET or TAKE_PROFIT_MARKET
            reduceOnly = undefined,
            workingType = 'CONTRACT_PRICE',
            callbackRate = undefined, //used with trailing
            activationPrice = undefined //used with trailing
        } = orderInput

        const timestamp = Date.now();
        let params: any = {
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
        }
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key])
        return await this.signedRequest('futures', 'POST', '/fapi/v1/order', params);
    }


}