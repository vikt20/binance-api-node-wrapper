import BinanceBase, { AccountData, OrderData, OrderType, TimeInForce, OrderStatus, OrderWorkingType, PositionDirection } from "./BinanceBase.js";
import ws from 'ws';
export type UserDataWebSocket = {
    e: UserData['event'];
    o?: OrderDataWebSocket;
    a?: AccountDataWebSocket;
};
export type AccountDataWebSocket = {
    B: Array<{
        a: string;
        wb: string;
        cw: string;
        bc: string;
    }>;
    P: Array<{
        s: string;
        pa: string;
        ep: string;
        cr: string;
        up: string;
        mt: string;
        iw: string;
        ps: string;
    }>;
};
export type OrderDataWebSocket = {
    s: string;
    c: string;
    S: "BUY" | "SELL";
    o: OrderType;
    f: TimeInForce;
    q: string;
    p: string;
    ap: string;
    sp: string;
    x: OrderStatus;
    X: OrderStatus;
    i: number;
    l: string;
    z: string;
    L: string;
    n: string;
    N: string;
    T: number;
    t: number;
    b: string;
    a: string;
    m: boolean;
    R: boolean;
    wt: OrderWorkingType;
    ot: OrderType;
    ps: PositionDirection;
    cp: boolean;
    rp: string;
    pP: boolean;
    si: number;
    ss: number;
    V: string;
    pm: string;
    gtd: number;
    AP: string;
    cr: string;
};
export type BookTickerDataWebSocket = {
    stream: string;
    data: {
        e: string;
        u: number;
        E: number;
        s: string;
        b: string;
        B: string;
        a: string;
        A: string;
    };
};
export type KlineDataWebSocket = {
    stream: string;
    data: {
        e: string;
        E: number;
        s: string;
        k: {
            t: number;
            T: number;
            s: string;
            i: string;
            f: number;
            L: number;
            o: string;
            c: string;
            h: string;
            l: string;
            v: string;
            n: number;
            x: boolean;
            q: string;
            V: string;
            Q: string;
            B: string;
        };
    };
};
export type DepthDataWebSocket = {
    stream: string;
    data: {
        e: string;
        E: number;
        s: string;
        U: number;
        u: number;
        b: [string, string];
        a: [string, string];
    };
};
export type UserData = {
    event: "ACCOUNT_UPDATE" | "ORDER_TRADE_UPDATE";
    accountData: AccountData | undefined;
    orderData: OrderData | undefined;
};
export type DepthData = {
    symbol: string;
    asks: [string, string];
    bids: [string, string];
};
export type KlineData = {
    symbol: string;
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    trades: number;
};
export type BookTickerData = {
    symbol: string;
    bestBid: number;
    bestBidQty: number;
    bestAsk: number;
    bestAskQty: number;
};
export default class BinanceStreams extends BinanceBase {
    constructor(apiKey?: string, apiSecret?: string);
    protected subscriptions: ws[];
    protected isKeepAlive: boolean;
    closeAllSockets(): void;
    handleWebSocket(webSocket: ws, parser: Function, callback: Function, reconnect: Function, title: string): Promise<void>;
    spotDepthStream(symbols: string[], callback: (data: DepthData) => void): Promise<void>;
    futuresDepthStream(symbols: string[], callback: (data: DepthData) => void): Promise<void>;
    spotCandleStickStream(symbols: string[], interval: string, callback: (data: KlineData) => void): Promise<void>;
    futuresCandleStickStream(symbols: string[], interval: string, callback: (data: KlineData) => void): Promise<void>;
    futuresBookTickerStream(symbols: string[], callback: (data: BookTickerData) => void): Promise<void>;
    spotBookTickerStream(symbols: string[], callback: (data: BookTickerData) => void): Promise<void>;
    futuresUserDataStream(callback: (data: UserData) => void): Promise<void>;
}
