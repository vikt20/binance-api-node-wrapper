// import BinanceBase, { AccountData,  } from "./BinanceBase.js";
import BinanceBase from "./BinanceBase.js";
import { convertDepthData, convertKlineData, convertUserData, convertBookTickerData } from "./converters.js";
import ws from 'ws';
export default class BinanceStreams extends BinanceBase {
    constructor(apiKey, apiSecret) {
        super(apiKey, apiSecret);
        this.subscriptions = [];
        this.isKeepAlive = true;
    }
    closeAllSockets() {
        this.isKeepAlive = false;
        this.subscriptions.forEach(ws => ws.close());
        // console.log(`WebSocket subscriptions:`, this.subscriptions);
    }
    handleWebSocket(webSocket, parser, callback, reconnect, title) {
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
                if (this.isKeepAlive)
                    reconnect();
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
        });
    }
    //subscribe to spot depth stream
    spotDepthStream(symbols, callback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@depth@100ms`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotDepthStream(symbols, callback);
        return this.handleWebSocket(webSocket, convertDepthData, callback, reconnect, 'spotDepthStream()');
    }
    //subscribe to futures depth stream
    futuresDepthStream(symbols, callback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@depth@100ms`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresDepthStream(symbols, callback);
        return this.handleWebSocket(webSocket, convertDepthData, callback, reconnect, 'futuresDepthStream()');
    }
    spotCandleStickStream(symbols, interval, callback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotCandleStickStream(symbols, interval, callback);
        return this.handleWebSocket(webSocket, convertKlineData, callback, reconnect, 'spotCandleStickStream()');
    }
    futuresCandleStickStream(symbols, interval, callback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresCandleStickStream(symbols, interval, callback);
        return this.handleWebSocket(webSocket, convertKlineData, callback, reconnect, 'futuresCanldeStickStream()');
    }
    futuresBookTickerStream(symbols, callback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresBookTickerStream(symbols, callback);
        return this.handleWebSocket(webSocket, convertBookTickerData, callback, reconnect, 'futuresBookTicketStream()');
    }
    spotBookTickerStream(symbols, callback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotBookTickerStream(symbols, callback);
        return this.handleWebSocket(webSocket, convertBookTickerData, callback, reconnect, 'spotBookTicketStream()');
    }
    async futuresUserDataStream(callback) {
        const listenKey = await this.getFuturesListenKey();
        if (!listenKey.success) {
            console.log('Error getting listen key: ', listenKey.errors);
            return Promise.reject();
        }
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL + listenKey.data.listenKey);
        const reconnect = () => this.futuresUserDataStream(callback);
        return this.handleWebSocket(webSocket, convertUserData, callback, reconnect, 'futuresUserDataStream()');
    }
}
