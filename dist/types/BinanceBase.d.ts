export type FormattedResponse<T> = {
    success: boolean;
    data?: T;
    errors?: string;
};
export type ListenKey = {
    listenKey: string;
};
export type ExchangeInfo = {
    symbols: Array<{
        symbol: string;
        status: string;
        baseAsset: string;
        baseAssetPrecision: number;
        quoteAsset: string;
        quotePrecision: number;
        quoteAssetPrecision: number;
        baseCommissionPrecision: number;
        quoteCommissionPrecision: number;
        orderTypes: Array<'LIMIT' | 'LIMIT_MAKER' | 'MARKET' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT_LIMIT'>;
        icebergAllowed: boolean;
        ocoAllowed: boolean;
        quoteOrderQtyMarketAllowed: boolean;
        isSpotTradingAllowed: boolean;
        isMarginTradingAllowed: boolean;
        filters: Array<{
            filterType: string;
            minPrice: string;
            maxPrice: string;
            tickSize: string;
            multiplierUp: string;
            multiplierDown: string;
            minQty: string;
            maxQty: string;
            stepSize: string;
            minNotional?: string;
            notional: number;
            applyToMarket: boolean;
            avgPriceMins: number;
            limit: number;
            maxNumAlgoOrders: number;
        }>;
    }>;
};
export type ExtractedInfo = {
    status: string;
    minPrice: number;
    maxPrice: number;
    tickSize: number;
    stepSize: number;
    minQty: number;
    maxQty: number;
    minNotional: number;
    orderTypes: Array<'LIMIT' | 'LIMIT_MAKER' | 'MARKET' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT_LIMIT'>;
    icebergAllowed: boolean;
    baseAsset: string;
    quoteAsset: string;
};
export type Type = 'futures' | 'spot';
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP' | 'TAKE_PROFIT' | 'STOP_MARKET' | 'TAKE_PROFIT_MARKET' | 'LIMIT_MAKER' | 'TRAILING_STOP_MARKET';
export type OrderSide = 'BUY' | 'SELL';
export type OrderWorkingType = 'CONTRACT_PRICE' | 'MARK_PRICE';
export type PositionDirection = "LONG" | "SHORT";
export type OrderStatus = "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "PENDING_CANCEL" | "REJECTED" | "EXPIRED" | "PENDING" | "TRIGGERED";
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTX';
export type PositionSide = 'BOTH' | 'LONG' | 'SHORT';
export type AccountData = {
    balances: Array<{
        asset: string;
        balance: string;
        crossWalletBalance: string;
        balanceChange: string;
    }>;
    positions: PositionData[];
};
export type PositionData = {
    symbol: string;
    positionAmount: number;
    entryPrice: number;
    positionDirection: PositionDirection;
    isInPosition: boolean;
    unrealizedPnL: number;
};
export type OrderData = {
    symbol: string;
    clientOrderId: string;
    side: OrderSide;
    orderType: OrderType;
    timeInForce: TimeInForce;
    originalQuantity: number;
    originalPrice: number;
    averagePrice: number;
    stopPrice: number;
    executionType: string;
    orderStatus: OrderStatus;
    orderId: number;
    orderLastFilledQuantity: number;
    orderFilledAccumulatedQuantity: number;
    lastFilledPrice: number;
    commissionAsset: string;
    commission?: string;
    orderTradeTime: number;
    tradeId: number;
    bidsNotional?: string;
    askNotional?: string;
    isMakerSide: boolean;
    isReduceOnly: boolean;
    workingType: OrderWorkingType;
    originalOrderType: OrderType;
    positionSide: PositionSide;
    closeAll: boolean;
    activationPrice: string;
    callbackRate: string;
    realizedProfit: string;
    isAlgoOrder: boolean;
};
export type OrderRequestResponse = {
    orderId: number;
    symbol: string;
    status: OrderStatus;
    clientOrderId: string;
    price: string;
    avgPrice: string;
    origQty: string;
    executedQty: string;
    cumQuote: string;
    timeInForce: TimeInForce;
    type: OrderType;
    reduceOnly: boolean;
    closePosition: boolean;
    side: OrderSide;
    positionSide: PositionSide;
    stopPrice: string;
    workingType: OrderWorkingType;
    priceProtect: boolean;
    origType: OrderType;
    priceMatch: string;
    selfTradePreventionMode: string;
    goodTillDate: number;
    time: number;
    updateTime: number;
};
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
    algoId: number;
    clientAlgoId: string;
    algoType: 'CONDITIONAL';
    orderType: OrderType;
    symbol: string;
    side: OrderSide;
    positionSide: PositionSide;
    timeInForce: TimeInForce;
    quantity: string;
    algoStatus: OrderStatus;
    actualOrderId: string;
    actualPrice: string;
    triggerPrice: string;
    price: string;
    icebergQuantity: string;
    tpTriggerPrice: string;
    tpPrice: string;
    slTriggerPrice: string;
    slPrice: string;
    tpOrderType: string;
    selfTradePreventionMode: string;
    workingType: OrderWorkingType;
    priceMatch: string;
    closePosition: boolean;
    priceProtect: boolean;
    reduceOnly: boolean;
    createTime: number;
    updateTime: number;
    triggerTime: number;
    goodTillDate: number;
};
export type StaticDepth = {
    lastUpdateId: number;
    asks: Array<[string, string]>;
    bids: Array<[string, string]>;
};
export type AggTradesData = {
    symbol: string;
    id: number;
    price: number;
    quantity: number;
    time: number;
    isBuyer: boolean;
};
export type GetStaticDepthParams = {
    symbol: string;
    limit?: number;
};
export type GetAggTradesParams = {
    symbol: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
};
export type CancelOrderByIdParams = {
    symbol: string;
    clientOrderId: string;
    isAlgoOrder?: boolean;
};
export type MarketOrderParams = {
    symbol: string;
    quantity: number;
    reduceOnly?: boolean;
};
export type TrailingStopOrderParams = {
    symbol: string;
    side: OrderSide;
    quantity: number;
    callbackRate: number;
    activationPrice?: number;
};
export type LimitOrderParams = {
    symbol: string;
    price: number;
    quantity: number;
};
export type StopOrderParams = {
    symbol: string;
    price: number;
    side: OrderSide;
    type: OrderType;
    workingType?: OrderWorkingType;
};
export type StopMarketOrderParams = {
    symbol: string;
    price: number;
    quantity: number;
    side: OrderSide;
};
export type ReduceOrderParams = {
    symbol: string;
    price: number;
    quantity: number;
    side: OrderSide;
    workingType?: OrderWorkingType;
};
export type ReducePositionParams = {
    symbol: string;
    positionDirection: PositionDirection;
    quantity: number;
};
export type CancelAllOpenOrdersParams = {
    symbol: string;
};
export type GetOpenOrdersBySymbolParams = {
    symbol: string;
};
export default class BinanceBase {
    private apiKey;
    private apiSecret;
    private _HTTP_AGENT;
    private _HTTPS_AGENT;
    private _AXIOS_INSTANCE;
    private pingServerInterval;
    static FUTURES_STREAM_URL: string;
    static SPOT_STREAM_URL: string;
    static FUTURES_STREAM_URL_COMBINED: string;
    static SPOT_STREAM_URL_COMBINED: string;
    static FUTURES_BASE_URL: string;
    static SPOT_BASE_URL: string;
    protected timeOffset: number;
    protected recvWindow: number;
    constructor(apiKey?: string, apiSecret?: string);
    private pingServer;
    private generateSignature;
    getFuturesListenKey(): Promise<FormattedResponse<ListenKey>>;
    keepAliveListenKey(type: Type): Promise<FormattedResponse<any>>;
    setTimeOffset(): Promise<void>;
    getServerTime(): Promise<number>;
    publicRequest(type: Type, method: string, endpoint: string, params?: any): Promise<FormattedResponse<any>>;
    signedRequest(type: Type, method: 'POST' | 'GET' | 'DELETE' | 'PUT', endpoint: string, params?: any): Promise<FormattedResponse<any>>;
    formattedResponse(object: {
        data?: any;
        errors?: string;
    }): FormattedResponse<any>;
}
