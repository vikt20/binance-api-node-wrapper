// import BinanceBase, { AccountData,  } from "./BinanceBase.js";
import BinanceBase, { AccountData, OrderData, OrderType, TimeInForce, OrderStatus, OrderWorkingType, PositionDirection, Type } from "./BinanceBase.js";
import { convertTradeDataWebSocket, convertDepthData, convertKlineData, convertUserData, convertBookTickerData } from "./converters.js";
import ws from 'ws';


export type UserDataWebSocket = {
    e: UserData['event'],
    o?: OrderDataWebSocket | AlgoOrderDataWebSocket
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


export type AlgoOrderDataWebSocket = {
    caid: string,
    aid: number,
    at: string,
    o: string,
    s: string,
    S: string,
    ps: string,
    f: string,
    q: string,
    X: OrderStatus,
    ai: string,
    ap: string,
    aq: string,
    act: string,
    tp: string,
    p: string,
    V: string,
    wt: string,
    pm: string,
    cp: boolean,
    pP: boolean,
    R: boolean,
    tt: number,
    gtd: number,
    rm: string
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
    event: "ACCOUNT_UPDATE" | "ORDER_TRADE_UPDATE" | "ALGO_UPDATE" | "listenKeyExpired",
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

export type TradeDataWebSocket = {
    stream: string;
    data: {
        "e": "aggTrade",  // Event type
        "E": 123456789,   // Event time
        "s": "BTCUSDT",    // Symbol
        "a": 5933014,		// Aggregate trade ID
        "p": "0.001",     // Price
        "q": "100",       // Quantity
        "f": 100,         // First trade ID
        "l": 105,         // Last trade ID
        "T": 123456785,   // Trade time
        "m": true,        // Is the buyer the market maker?
    };
}

export type TradeData = {
    symbol: string,
    price: number,
    quantity: number,
    tradeTime: number,
    orderType: 'BUY' | 'SELL',
}

export type HandleWebSocket = {
    // webSocket: ws,
    disconnect: Function,
    id: string
}

export type SocketStatus = 'OPEN' | 'CLOSE' | 'ERROR' | 'PING' | 'PONG'


export default class BinanceStreams extends BinanceBase {
    constructor(apiKey?: string, apiSecret?: string, pingServer: boolean = false) {
        super(apiKey, apiSecret, pingServer)
    }

    protected subscriptions: { id: string, disconnect: Function }[] = [];
    protected listenKeyInterval: NodeJS.Timeout | undefined

    closeAllSockets() {
        this.subscriptions.forEach(i => i.disconnect());
        this.subscriptions = [];
        clearInterval(this.listenKeyInterval)
        this.destroy(); // stop ping server or other Base class functions

        // console.log(`WebSocket subscriptions:`, this.subscriptions);
    }
    closeById(id: string) {
        const index = this.subscriptions.findIndex(i => i.id === id);
        if (index > -1) {
            this.subscriptions[index].disconnect();
            this.subscriptions.splice(index, 1);
        }
    }

    /**
     * @param createWs - function to create webSocket connection
     * @param parser - convertation function
     * @param callback - function to handle data
     * @param title
     * @returns object with webSocket, id and setIsKeepAlive function
     */
    handleWebSocket(createWs: () => ws, parser: Function, callback: Function, title: string, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const MAX_RECONNECT_ATTEMPTS = 5;
        const RECONNECT_DELAY = 1000;
        let reconnectAttempts = 0;
        //generate random ID
        const id = Math.random().toString(36).substring(7);

        let isKeepAlive = true
        let currentWs: ws;
        let resolved = false;

        const disconnect = () => {
            isKeepAlive = false;
            if (currentWs) {
                currentWs.terminate(); // Immediate, no close handshake → avoids code 1000 confusion
            }

            // Clean up subscription
            const index = this.subscriptions.findIndex(s => s.id === id);
            if (index > -1) {
                this.subscriptions.splice(index, 1);
            }
        }

        this.subscriptions.push({ id, disconnect });

        return new Promise((resolve, reject) => {
            const connect = () => {
                if (!isKeepAlive) return;
                try {
                    currentWs = createWs();
                } catch (e) {
                    reconnectAttempts++;
                    if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
                        reject(e);
                        return;
                    }
                    setTimeout(connect, RECONNECT_DELAY);
                    return;
                }

                // Clean up any lingering listeners (safety)
                currentWs.removeAllListeners();

                //onmessage
                currentWs.on('message', (data: any) => {
                    callback(parser(JSON.parse(data)));
                });
                //onping
                currentWs.on('ping', (data: any) => {
                    // console.log(`${title} - PING RECEIVED`);
                    currentWs.pong(data);
                });
                currentWs.on('pong', (data: any) => {
                    // console.log(`${title} - PONG RECEIVED`);
                    if (statusCallback) statusCallback('PONG');
                });
                //onclose
                currentWs.on('close', (code: number) => {
                    // Do not reconnect on manual disconnect or clean close
                    if (!isKeepAlive || code === 1000) {
                        return;
                    }

                    reconnectAttempts++;

                    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                        console.warn(`${title} - Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);

                        // Only reject if we never successfully connected initially
                        if (!resolved) {
                            resolved = true;
                            reject(new Error('Max reconnection attempts reached'));
                        }
                        return;
                    }

                    // Exponential backoff (highly recommended)
                    const delay = 1000 * Math.pow(2, reconnectAttempts - 1); // 1s, 2s, 4s, 8s...
                    console.log(`${title} - Connection lost. Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

                    setTimeout(connect, delay);
                });
                //onopen
                currentWs.on('open', () => {
                    reconnectAttempts = 0; // Reset counter on successful (re)connection
                    if (statusCallback) statusCallback('OPEN');

                    if (!resolved) {
                        resolved = true;
                        resolve({ disconnect, id });
                    }
                });
                //onerror
                currentWs.on('error', (error: any) => {
                    if (statusCallback) statusCallback('ERROR');
                    // console.log(`${title} - ERROR: `, error);
                    reject(error);
                });
            }

            connect();
        })
    }

    // keep listen key alive by ping every 30min
    keepAliveListenKeyByInterval = (type: Type) => {
        clearInterval(this.listenKeyInterval)
        this.listenKeyInterval = setInterval(() => this.keepAliveListenKey(type), 30 * 60 * 1000)
    }

    //subscribe to spot depth stream
    spotDepthStream(symbols: string[], callback: (data: DepthData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@depth@100ms`);
        const createWs = () => new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));

        return this.handleWebSocket(createWs, convertDepthData, callback, 'spotDepthStream()', statusCallback);
    }

    //subscribe to futures depth stream
    futuresDepthStream(symbols: string[], callback: (data: DepthData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@depth@100ms`);
        const createWs = () => new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));

        return this.handleWebSocket(createWs, convertDepthData, callback, 'futuresDepthStream()', statusCallback);
    }

    spotCandleStickStream(symbols: string[], interval: string, callback: (data: KlineData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const createWs = () => new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));

        return this.handleWebSocket(createWs, convertKlineData, callback, 'spotCandleStickStream()', statusCallback);
    }

    futuresCandleStickStream(symbols: string[], interval: string, callback: (data: KlineData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const createWs = () => new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));

        return this.handleWebSocket(createWs, convertKlineData, callback, 'futuresCanldeStickStream()', statusCallback);
    }

    futuresBookTickerStream(symbols: string[], callback: (data: BookTickerData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const createWs = () => new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));

        return this.handleWebSocket(createWs, convertBookTickerData, callback, 'futuresBookTicketStream()', statusCallback);
    }

    spotBookTickerStream(symbols: string[], callback: (data: BookTickerData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const createWs = () => new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));

        return this.handleWebSocket(createWs, convertBookTickerData, callback, 'spotBookTicketStream()', statusCallback);
    }

    async futuresTradeStream(symbols: string[], callback: (data: TradeData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@aggTrade`);
        const createWs = () => new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));

        return this.handleWebSocket(createWs, convertTradeDataWebSocket, callback, 'futuresTradeStream()', statusCallback);
    }

    async spotTradeStream(symbols: string[], callback: (data: TradeData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@aggTrade`);
        const createWs = () => new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));

        return this.handleWebSocket(createWs, convertTradeDataWebSocket, callback, 'spotTradeStream()', statusCallback);
    }

    async futuresUserDataStream(callback: (data: UserData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const listenKey = await this.getFuturesListenKey();
        if (!listenKey.success || !listenKey.data) {
            console.log('Error getting listen key: ', listenKey.errors);
            return Promise.reject()
        }

        // send ping every 30min to keep listenKey alive
        this.keepAliveListenKeyByInterval('futures')

        const createWs = () => new ws(BinanceBase.FUTURES_STREAM_URL + listenKey.data!.listenKey);

        return this.handleWebSocket(createWs, convertUserData, callback, 'futuresUserDataStream()', statusCallback);
    }



}



