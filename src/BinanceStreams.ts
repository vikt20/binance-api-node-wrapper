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
    constructor(apiKey?: string, apiSecret?: string) {
        super(apiKey, apiSecret)
    }

    protected subscriptions: { id: string, disconnect: Function }[] = [];
    protected listenKeyInterval: NodeJS.Timeout | undefined

    closeAllSockets() {
        this.subscriptions.forEach(i => i.disconnect());
        this.subscriptions = [];
        clearInterval(this.listenKeyInterval)
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
     * @param webSocket
     * @param parser - convertation function
     * @param callback - function to handle data
     * @param reconnect
     * @param title
     * @returns object with webSocket, id and setIsKeepAlive function
     */
    handleWebSocket(webSocket: ws, parser: Function, callback: Function, reconnect: Function, title: string, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        //generate random ID
        const id = Math.random().toString(36).substring(7);

        let isKeepAlive = true

        const disconnect = () => {
            isKeepAlive = false;
            webSocket.close()
        }

        this.subscriptions.push({ id, disconnect });

        return new Promise((resolve, reject) => {
            //onmessage
            webSocket.on('message', (data: any) => {
                callback(parser(JSON.parse(data)));
            });
            //onping
            webSocket.on('ping', (data: any) => {
                // console.log(`${title} - PING RECEIVED`);
                webSocket.pong(data);
            });
            webSocket.on('pong', (data: any) => {
                // console.log(`${title} - PONG RECEIVED`);
                if (statusCallback) statusCallback('PONG');
            });
            //onclose
            webSocket.on('close', () => {
                // console.log(`${title} - CLOSED`);
                if (statusCallback) statusCallback('CLOSE');
                if (isKeepAlive) reconnect();
            });
            //onopen
            webSocket.on('open', () => {
                // console.log(`${title} - OPEN`);
                if (statusCallback) statusCallback('OPEN');
                resolve({ disconnect, id })
            });
            //onerror
            webSocket.on('error', (error: string) => {
                if (statusCallback) statusCallback('ERROR');
                // console.log(`${title} - ERROR: `, error);
                isKeepAlive = false;

                // throw new Error(`${title} - ERROR: ${error}`);
                reject(error);

            });
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
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotDepthStream(symbols, callback);

        return this.handleWebSocket(webSocket, convertDepthData, callback, reconnect, 'spotDepthStream()', statusCallback);
    }

    //subscribe to futures depth stream
    futuresDepthStream(symbols: string[], callback: (data: DepthData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@depth@100ms`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresDepthStream(symbols, callback);

        return this.handleWebSocket(webSocket, convertDepthData, callback, reconnect, 'futuresDepthStream()', statusCallback);
    }

    spotCandleStickStream(symbols: string[], interval: string, callback: (data: KlineData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotCandleStickStream(symbols, interval, callback);

        return this.handleWebSocket(webSocket, convertKlineData, callback, reconnect, 'spotCandleStickStream()', statusCallback);
    }

    futuresCandleStickStream(symbols: string[], interval: string, callback: (data: KlineData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresCandleStickStream(symbols, interval, callback);

        return this.handleWebSocket(webSocket, convertKlineData, callback, reconnect, 'futuresCanldeStickStream()', statusCallback);
    }

    futuresBookTickerStream(symbols: string[], callback: (data: BookTickerData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresBookTickerStream(symbols, callback);

        return this.handleWebSocket(webSocket, convertBookTickerData, callback, reconnect, 'futuresBookTicketStream()', statusCallback);
    }

    spotBookTickerStream(symbols: string[], callback: (data: BookTickerData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotBookTickerStream(symbols, callback);

        return this.handleWebSocket(webSocket, convertBookTickerData, callback, reconnect, 'spotBookTicketStream()', statusCallback);
    }

    async futuresTradeStream(symbols: string[], callback: (data: TradeData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@aggTrade`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresTradeStream(symbols, callback, statusCallback);

        return this.handleWebSocket(webSocket, convertTradeDataWebSocket, callback, reconnect, 'futuresTradeStream()', statusCallback);
    }

    async spotTradeStream(symbols: string[], callback: (data: TradeData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@aggTrade`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotTradeStream(symbols, callback, statusCallback);

        return this.handleWebSocket(webSocket, convertTradeDataWebSocket, callback, reconnect, 'spotTradeStream()', statusCallback);
    }

    async futuresUserDataStream(callback: (data: UserData) => void, statusCallback?: (status: SocketStatus) => void): Promise<HandleWebSocket> {
        const listenKey = await this.getFuturesListenKey();
        if (!listenKey.success || !listenKey.data) {
            console.log('Error getting listen key: ', listenKey.errors);
            return Promise.reject()
        }

        // send ping every 60min to keep listenKey alive
        this.keepAliveListenKeyByInterval('futures')

        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL + listenKey.data.listenKey);
        const reconnect = () => this.futuresUserDataStream(callback, statusCallback);

        return this.handleWebSocket(webSocket, convertUserData, callback, reconnect, 'futuresUserDataStream()', statusCallback);
    }



}



