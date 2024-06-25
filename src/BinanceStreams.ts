// import BinanceBase, { AccountData,  } from "./BinanceBase.js";
import BinanceBase, { AccountData, OrderData, OrderType, TimeInForce, OrderStatus, OrderWorkingType, PositionDirection } from "./BinanceBase.js";
import { convertDepthData, convertKlineData, convertUserData, convertBookTickerData } from "./converters.js";
import ws from 'ws';


export type UserDataWebSocket = {
    e: UserData['event'],
    o?: OrderDataWebSocket
    a?: AccountDataWebSocket
}

export type AccountDataWebSocket = {
    B: Array<{
        a: string,
        wb: string,
        cw: string,
        bc: string
    }>
    P: Array<{
        s: string,
        pa: string,
        ep: string,
        cr: string,
        up: string,
        mt: string,
        iw: string,
        ps: string
    }>
}
export type OrderDataWebSocket = {
    s: string,
    c: string,
    S: "BUY" | "SELL",
    o: OrderType,
    f: TimeInForce,
    q: string,
    p: string,
    ap: string,
    sp: string,
    x: OrderStatus,
    X: OrderStatus,
    i: number,
    l: string,
    z: string,
    L: string,
    n: string,
    N: string,
    T: number,
    t: number,
    b: string,
    a: string,
    m: boolean,
    R: boolean,
    wt: OrderWorkingType,
    ot: OrderType,
    ps: PositionDirection,
    cp: boolean,
    rp: string,
    pP: boolean,
    si: number,
    ss: number,
    V: string,
    pm: string,
    gtd: number,
    AP: string,
    cr: string
}

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
        b: [string, string]; // Array of bids
        a: [string, string]; // Array of asks
    };
};

export type UserData = {
    event: "ACCOUNT_UPDATE" | "ORDER_TRADE_UPDATE",
    accountData: AccountData | undefined
    orderData: OrderData | undefined
}
export type DepthData = {
    symbol: string,
    asks: [string, string],
    bids: [string, string]
}

export type KlineData = {
    symbol: string,
    time: number,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number,
    trades: number
}
export type BookTickerData = {
    symbol: string,
    bestBid: number,
    bestBidQty: number,
    bestAsk: number,
    bestAskQty: number
}


export default class BinanceStreams extends BinanceBase {
    constructor(apiKey?: string, apiSecret?: string) {
        super(apiKey, apiSecret)
    }

    protected subscriptions: ws[] = [];
    protected isKeepAlive: boolean = true;

    closeAllSockets() {
        this.isKeepAlive = false;
        this.subscriptions.forEach(ws => ws.close());
        // console.log(`WebSocket subscriptions:`, this.subscriptions);
    }

    handleWebSocket(webSocket: ws, parser: Function, callback: Function, reconnect: Function, title: string): Promise<void> {
        this.subscriptions.push(webSocket);
        return new Promise((resolve, reject) => {
            //onmessage
            webSocket.on('message', (data) => {
                callback(parser(JSON.parse(data)));
            });
            //onping
            webSocket.on('ping', (data) => {
                console.log(`${title} - PING RECEIVED`);
                webSocket.pong(data);
            });
            //onclose
            webSocket.on('close', () => {
                console.log(`${title} - CLOSED`);
                if (this.isKeepAlive) reconnect();
            });
            //onopen
            webSocket.on('open', () => {
                console.log(`${title} - OPEN`);
                resolve();
            });
            //onerror
            webSocket.on('error', (error) => {
                // console.log(`${title} - ERROR: `, error);
                this.isKeepAlive = false;
                // reject(error);
                throw new Error(`${title} - ERROR: ${error}`);
                
            });
        })
    }

    //subscribe to spot depth stream
    spotDepthStream(symbols: string[], callback: (data: DepthData) => void): Promise<void> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@depth@100ms`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotDepthStream(symbols, callback);

        return this.handleWebSocket(webSocket, convertDepthData, callback, reconnect, 'spotDepthStream()');
    }

    spotCandleStickStream(symbols: string[], interval: string, callback: (data: KlineData) => void) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotCandleStickStream(symbols, interval, callback);

        return this.handleWebSocket(webSocket, convertKlineData, callback, reconnect, 'spotCandleStickStream()');
    }

    futuresCandleStickStream(symbols: string[], interval: string, callback: (data: KlineData) => void) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresCandleStickStream(symbols, interval, callback);

        return this.handleWebSocket(webSocket, convertKlineData, callback, reconnect, 'futuresCanldeStickStream()');
    }

    futuresBookTickerStream(symbols: string[], callback: (data: BookTickerData) => void) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresBookTickerStream(symbols, callback);

        return this.handleWebSocket(webSocket, convertBookTickerData, callback, reconnect, 'futuresBookTicketStream()');
    }

    spotBookTickerStream(symbols: string[], callback: (data: BookTickerData) => void) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotBookTickerStream(symbols, callback);

        return this.handleWebSocket(webSocket, convertBookTickerData, callback, reconnect, 'spotBookTicketStream()');
    }

    spotUserDataStream(symbols: string[], callback: (data: BookTickerData) => void): Promise<void> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresBookTickerStream(symbols, callback);

        return this.handleWebSocket(webSocket, convertBookTickerData, callback, reconnect, 'futuresBookTicketStream()');
    }

    async futuresUserDataStream(callback: (data: UserData) => void): Promise<void> {
        const listenKey = await this.getFuturesListenKey();
        if (!listenKey.success) {
            console.log('Error getting listen key: ', listenKey.errors);
            return Promise.reject()
        }

        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL + listenKey.data.listenKey);
        const reconnect = () => this.futuresUserDataStream(callback);

        return this.handleWebSocket(webSocket, convertUserData, callback, reconnect, 'futuresUserDataStream()');
    }



}



