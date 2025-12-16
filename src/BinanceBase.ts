
import http from 'http';
import https from 'https';
import axios, { AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import { convertObjectIntoUrlEncoded } from './converters.js';

export type FormattedResponse<T> = { success: boolean, data?: T, errors?: string }

export type ListenKey = {
    listenKey: string
}
export type ExchangeInfo = {
    symbols: Array<{
        symbol: string,
        status: string,
        baseAsset: string,
        baseAssetPrecision: number,
        quoteAsset: string,
        quotePrecision: number,
        quoteAssetPrecision: number,
        baseCommissionPrecision: number,
        quoteCommissionPrecision: number,
        orderTypes: Array<'LIMIT' | 'LIMIT_MAKER' | 'MARKET' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT_LIMIT'>,
        icebergAllowed: boolean,
        ocoAllowed: boolean,
        quoteOrderQtyMarketAllowed: boolean,
        isSpotTradingAllowed: boolean,
        isMarginTradingAllowed: boolean,
        filters: Array<{
            filterType: string,
            minPrice: string,
            maxPrice: string,
            tickSize: string,
            multiplierUp: string,
            multiplierDown: string,
            minQty: string,
            maxQty: string,
            stepSize: string,
            minNotional?: string,
            notional: number,
            applyToMarket: boolean,
            avgPriceMins: number,
            limit: number,
            maxNumAlgoOrders: number
        }>
    }>
}

export type ExtractedInfo = {
    status: string,
    minPrice: number,
    maxPrice: number,
    tickSize: number,
    stepSize: number,
    minQty: number,
    maxQty: number,
    minNotional: number,
    orderTypes: Array<'LIMIT' | 'LIMIT_MAKER' | 'MARKET' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT_LIMIT'>,
    icebergAllowed: boolean
    baseAsset: string,
    quoteAsset: string
}

export type Type = 'futures' | 'spot'
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP' | 'TAKE_PROFIT' | 'STOP_MARKET' | 'TAKE_PROFIT_MARKET' | 'LIMIT_MAKER' | 'TRAILING_STOP_MARKET'
export type OrderSide = 'BUY' | 'SELL'
export type OrderWorkingType = 'CONTRACT_PRICE' | 'MARK_PRICE'
export type PositionDirection = "LONG" | "SHORT"
export type OrderStatus = "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "PENDING_CANCEL" | "REJECTED" | "EXPIRED" | "PENDING" | "TRIGGERED" | "FINISHED"
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTX'
export type PositionSide = 'BOTH' | 'LONG' | 'SHORT'

export type AccountData = {
    balances: Array<{
        asset: string,
        balance: string,
        crossWalletBalance: string,
        balanceChange: string
    }>,
    positions: PositionData[]
}
export type PositionData = {
    symbol: string,
    positionAmount: number,
    entryPrice: number,
    positionDirection: PositionDirection
    isInPosition: boolean
    // accumulatedRealized: number,
    unrealizedPnL: number,
    // marginType: string,
    // isolatedWallet: string,
    // positionSide: string
}
export type OrderData = {
    symbol: string,
    clientOrderId: string,
    side: OrderSide,
    orderType: OrderType,
    timeInForce: TimeInForce,
    originalQuantity: number,
    originalPrice: number,
    averagePrice: number,
    stopPrice: number,
    executionType: string,
    orderStatus: OrderStatus,
    orderId: number,
    orderLastFilledQuantity: number,
    orderFilledAccumulatedQuantity: number,
    lastFilledPrice: number,
    commissionAsset: string,
    commission?: string,
    orderTradeTime: number,
    tradeId: number,
    bidsNotional?: string,
    askNotional?: string,
    isMakerSide: boolean,
    isReduceOnly: boolean,
    workingType: OrderWorkingType,
    originalOrderType: OrderType,
    positionSide: PositionSide,
    closeAll: boolean,
    activationPrice: string,
    callbackRate: string,
    realizedProfit: string,
    isAlgoOrder: boolean
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

/**
 * Response Example

{
   "algoId": 2146760,
   "clientAlgoId": "6B2I9XVcJpCjqPAJ4YoFX7",
   "algoType": "CONDITIONAL",
   "orderType": "TAKE_PROFIT",
   "symbol": "BNBUSDT",
   "side": "SELL",
   "positionSide": "BOTH",
   "timeInForce": "GTC",
   "quantity": "0.01",
   "algoStatus": "CANCELED",
   "actualOrderId": "",
   "actualPrice": "0.00000",
   "triggerPrice": "750.000",
   "price": "750.000",
   "icebergQuantity": null,
   "tpTriggerPrice": "0.000",
   "tpPrice": "0.000",
   "slTriggerPrice": "0.000",
   "slPrice": "0.000",
   "tpOrderType": "",
   "selfTradePreventionMode": "EXPIRE_MAKER",
   "workingType": "CONTRACT_PRICE",
   "priceMatch": "NONE",
   "closePosition": false,
   "priceProtect": false,
   "reduceOnly": false,
   "createTime": 1750485492076,
   "updateTime": 1750514545091,
   "triggerTime": 0,
   "goodTillDate": 0
}
 */
export type AlgoOrderResponse = {
    algoId: number,
    clientAlgoId: string,
    algoType: 'CONDITIONAL',
    orderType: OrderType,
    symbol: string,
    side: OrderSide,
    positionSide: PositionSide,
    timeInForce: TimeInForce,
    quantity: string,
    algoStatus: OrderStatus,
    actualOrderId: string,
    actualPrice: string,
    triggerPrice: string,
    price: string,
    icebergQuantity: string,
    tpTriggerPrice: string,
    tpPrice: string,
    slTriggerPrice: string,
    slPrice: string,
    tpOrderType: string,
    selfTradePreventionMode: string,
    workingType: OrderWorkingType,
    priceMatch: string,
    closePosition: boolean,
    priceProtect: boolean,
    reduceOnly: boolean,
    createTime: number,
    updateTime: number,
    triggerTime: number,
    goodTillDate: number
}



export type StaticDepth = {
    lastUpdateId: number,
    asks: Array<[string, string]>,
    bids: Array<[string, string]>
}

export type AggTradesData = {
    symbol: string,
    id: number,
    price: number,
    quantity: number,
    time: number,
    isBuyer: boolean
}

//make types for all methods as object values
export type GetStaticDepthParams = {
    symbol: string,
    limit?: number
}
export type GetAggTradesParams = {
    symbol: string,
    startTime?: number,
    endTime?: number,
    limit?: number
}
export type CancelOrderByIdParams = {
    symbol: string,
    clientOrderId: string,
    isAlgoOrder?: boolean
}
export type MarketOrderParams = {
    symbol: string,
    quantity: number,
    reduceOnly?: boolean
}
export type TrailingStopOrderParams = {
    symbol: string,
    side: OrderSide,
    quantity: number,
    callbackRate: number,
    activationPrice?: number,
    // reduceOnly: boolean
}
export type LimitOrderParams = {
    symbol: string,
    price: number,
    quantity: number
}
export type StopOrderParams = {
    symbol: string,
    price: number,
    side: OrderSide,
    type: OrderType,
    workingType?: OrderWorkingType,
}
export type StopMarketOrderParams = {
    symbol: string,
    price: number,
    quantity: number,
    side: OrderSide,
}
export type ReduceOrderParams = {
    symbol: string,
    price: number,
    quantity: number,
    side: OrderSide,
    workingType?: OrderWorkingType,
}
export type ReducePositionParams = {
    symbol: string,
    positionDirection: PositionDirection,
    quantity: number
}
export type CancelAllOpenOrdersParams = {
    symbol: string
}
export type GetOpenOrdersBySymbolParams = {
    symbol: string
}

export default class BinanceBase {
    private apiKey: string;
    private apiSecret: string;

    private _HTTP_AGENT = new http.Agent({ keepAlive: true, timeout: 3600000 });
    private _HTTPS_AGENT = new https.Agent({ keepAlive: true, timeout: 3600000 });
    private _AXIOS_INSTANCE = axios.create({ httpAgent: this._HTTP_AGENT, httpsAgent: this._HTTPS_AGENT });

    private pingServerInterval: NodeJS.Timeout | undefined;

    public static FUTURES_STREAM_URL: string = 'wss://fstream.binance.com/ws/';
    public static SPOT_STREAM_URL: string = 'wss://stream.binance.com:9443/ws/';
    public static FUTURES_STREAM_URL_COMBINED: string = 'wss://fstream.binance.com/stream?streams=';
    public static SPOT_STREAM_URL_COMBINED: string = 'wss://stream.binance.com:9443/stream?streams=';
    public static FUTURES_BASE_URL: string = 'https://fapi.binance.com';
    public static SPOT_BASE_URL: string = 'https://api.binance.com';


    protected timeOffset: number = 0;
    protected recvWindow: number = 3000;

    constructor(apiKey?: string, apiSecret?: string) {
        this.apiKey = apiKey || '';
        this.apiSecret = apiSecret || '';
        this.pingServer();
        this.setTimeOffset()
    }

    private pingServer() {
        clearInterval(this.pingServerInterval);
        this.pingServerInterval = setInterval(() => this._AXIOS_INSTANCE.get(`${BinanceBase.FUTURES_BASE_URL}/fapi/v1/ping`), 30000)
    }
    private generateSignature(queryString: string): string {
        return crypto.createHmac('sha256', this.apiSecret).update(queryString).digest('hex');
    }

    async getFuturesListenKey(): Promise<FormattedResponse<ListenKey>> {
        return await this.signedRequest('futures', 'POST', '/fapi/v1/listenKey');
    }

    async keepAliveListenKey(type: Type) {
        return type === 'futures' ? await this.signedRequest(type, 'PUT', '/fapi/v1/listenKey') : await this.signedRequest(type, 'PUT', '/api/v3/userDataStream')
    }

    async setTimeOffset(): Promise<void> {
        try {
            const serverTime: number = await this.getServerTime();
            const localTime: number = Date.now();
            this.timeOffset = localTime - serverTime;
        } catch (error) {
            throw new Error(`Failed to set time offset: ${error}`);
        }
    }

    async getServerTime(): Promise<number> {
        try {
            const response: AxiosResponse<any> = await axios.get(`${BinanceBase.FUTURES_BASE_URL}/fapi/v1/time`);
            return response.data.serverTime;
        } catch (error) {
            throw new Error(`Failed to retrieve server time: ${error}`);
        }
    }


    async publicRequest(type: Type, method: string, endpoint: string, params: any = {}): Promise<FormattedResponse<any>> {
        try {
            const _URL = type === 'futures' ? BinanceBase.FUTURES_BASE_URL : BinanceBase.SPOT_BASE_URL;
            const response: AxiosResponse<any> = await axios.request({
                method: method,
                url: `${_URL}${endpoint}`,
                params: params
            });

            return this.formattedResponse({ data: response.data })
        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.msg) {
                return this.formattedResponse({ errors: error.response.data.msg })
            } else {
                return this.formattedResponse({ errors: `Failed to make request: ${error.message}` })
            }
        }
    }

    async signedRequest(type: Type, method: 'POST' | 'GET' | 'DELETE' | 'PUT', endpoint: string, params: any = {}): Promise<FormattedResponse<any>> {
        try {
            // const timestamp = Date.now();
            const timestamp = Date.now() - this.timeOffset;
            params.timestamp = timestamp;
            const queryString = convertObjectIntoUrlEncoded(params);
            const signature = this.generateSignature(queryString);
            // console.log(`query:`, queryString);
            const _URL = type === 'futures' ? BinanceBase.FUTURES_BASE_URL : BinanceBase.SPOT_BASE_URL;
            const response: AxiosResponse<any> = await this._AXIOS_INSTANCE.request({
                method: method,
                url: `${_URL}${endpoint}`,
                params: {
                    ...params,
                    timestamp: timestamp,
                    signature: signature
                },
                headers: {
                    'X-MBX-APIKEY': this.apiKey,
                    'User-Agent': 'Mozilla/4.0 (compatible; Node Binance API)',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'timeout': 5000,
                }
            });

            return this.formattedResponse({ data: response.data })
        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.msg) {
                return this.formattedResponse({ errors: error.response.data.msg })
            } else {
                return this.formattedResponse({ errors: `Failed to make request: ${error.message}` })
            }
        }
    }


    formattedResponse(object: { data?: any, errors?: string }): FormattedResponse<any> {
        return {
            success: object.errors === undefined ? true : false,
            data: object.data,
            errors: object.errors
        }
    }

}