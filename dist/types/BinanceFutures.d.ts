import BinanceStreams, { KlineData } from './BinanceStreams.js';
import { FormattedResponse, GetStaticDepthParams, StaticDepth, AccountData, OrderData, OrderSide, OrderType, TimeInForce, OrderWorkingType, OrderStatus, PositionSide, GetOpenOrdersBySymbolParams, CancelAllOpenOrdersParams, CancelOrderByIdParams, MarketOrderParams, TrailingStopOrderParams, LimitOrderParams, PositionData, StopOrderParams, ReduceOrderParams, StopLimitOrderParams, ReducePositionParams, ExchangeInfo } from './BinanceBase.js';
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
    number,
    string,
    string,
    string,
    string,
    string,
    number,
    string,
    number,
    string,
    string,
    string
];
export default class BinanceFutures extends BinanceStreams {
    constructor(apiKey?: string, apiSecret?: string);
    closeListenKey(): Promise<FormattedResponse<any>>;
    getExchangeInfo(): Promise<FormattedResponse<ExchangeInfo>>;
    getStaticDepth(params: GetStaticDepthParams): Promise<FormattedResponse<StaticDepth>>;
    getKlines(params: {
        symbol: string;
        interval: string;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }): Promise<FormattedResponse<KlineData[]>>;
    getBalance(): Promise<FormattedResponse<AccountData['balances']>>;
    getPositionRisk(): Promise<FormattedResponse<any>>;
    getOpenPositions(): Promise<FormattedResponse<AccountData['positions']>>;
    getOpenPositionBySymbol(params: {
        symbol: string;
    }): Promise<FormattedResponse<PositionData>>;
    getOpenOrders(): Promise<FormattedResponse<OrderData[]>>;
    getOpenOrdersBySymbol(params: GetOpenOrdersBySymbolParams): Promise<FormattedResponse<OrderData[]>>;
    cancelAllOpenOrders(params: CancelAllOpenOrdersParams): Promise<FormattedResponse<any>>;
    cancelOrderById(params: CancelOrderByIdParams): Promise<FormattedResponse<any>>;
    trailingStopOrder(params: TrailingStopOrderParams): Promise<FormattedResponse<OrderRequestResponse>>;
    marketBuy(params: MarketOrderParams): Promise<FormattedResponse<OrderRequestResponse>>;
    marketSell(params: MarketOrderParams): Promise<FormattedResponse<OrderRequestResponse>>;
    limitBuy(params: LimitOrderParams): Promise<FormattedResponse<OrderRequestResponse>>;
    limitSell(params: LimitOrderParams): Promise<FormattedResponse<OrderRequestResponse>>;
    stopOrder(params: StopOrderParams): Promise<FormattedResponse<OrderRequestResponse>>;
    reduceLimitOrder(params: ReduceOrderParams): Promise<FormattedResponse<OrderRequestResponse>>;
    stopLimitOrder(params: StopLimitOrderParams): Promise<FormattedResponse<OrderRequestResponse>>;
    reducePosition(params: ReducePositionParams): Promise<FormattedResponse<OrderRequestResponse>>;
    customOrder(orderInput: OrderInput): Promise<FormattedResponse<OrderRequestResponse>>;
}
export {};
