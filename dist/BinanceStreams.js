// import BinanceBase, { AccountData,  } from "./BinanceBase.js";
import BinanceBase from "./BinanceBase.js";
import { convertTradeDataWebSocket, convertDepthData, convertKlineData, convertUserData, convertBookTickerData } from "./converters.js";
import ws from 'ws';
export default class BinanceStreams extends BinanceBase {
    constructor(apiKey, apiSecret) {
        super(apiKey, apiSecret);
        this.subscriptions = [];
        // keep listen key alive by ping every 60min
        this.keepAliveListenKeyByInterval = (type) => {
            clearInterval(this.listenKeyInterval);
            this.listenKeyInterval = setInterval(() => this.keepAliveListenKey(type), 60 * 60 * 1000);
        };
    }
    closeAllSockets() {
        this.subscriptions.forEach(i => i.disconnect());
        this.subscriptions = [];
        clearInterval(this.listenKeyInterval);
        // console.log(`WebSocket subscriptions:`, this.subscriptions);
    }
    closeById(id) {
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
    handleWebSocket(webSocket, parser, callback, reconnect, title, statusCallback) {
        //generate random ID
        const id = Math.random().toString(36).substring(7);
        let isKeepAlive = true;
        const disconnect = () => {
            isKeepAlive = false;
            webSocket.close();
        };
        this.subscriptions.push({ id, disconnect });
        return new Promise((resolve, reject) => {
            //onmessage
            webSocket.on('message', (data) => {
                callback(parser(JSON.parse(data)));
            });
            //onping
            webSocket.on('ping', (data) => {
                // console.log(`${title} - PING RECEIVED`);
                webSocket.pong(data);
            });
            webSocket.on('pong', (data) => {
                // console.log(`${title} - PONG RECEIVED`);
                if (statusCallback)
                    statusCallback('PONG');
            });
            //onclose
            webSocket.on('close', () => {
                // console.log(`${title} - CLOSED`);
                if (statusCallback)
                    statusCallback('CLOSE');
                if (isKeepAlive)
                    reconnect();
            });
            //onopen
            webSocket.on('open', () => {
                // console.log(`${title} - OPEN`);
                if (statusCallback)
                    statusCallback('OPEN');
                resolve({ disconnect, id });
            });
            //onerror
            webSocket.on('error', (error) => {
                if (statusCallback)
                    statusCallback('ERROR');
                // console.log(`${title} - ERROR: `, error);
                isKeepAlive = false;
                // throw new Error(`${title} - ERROR: ${error}`);
                reject(error);
            });
        });
    }
    //subscribe to spot depth stream
    spotDepthStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@depth@100ms`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotDepthStream(symbols, callback);
        return this.handleWebSocket(webSocket, convertDepthData, callback, reconnect, 'spotDepthStream()', statusCallback);
    }
    //subscribe to futures depth stream
    futuresDepthStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@depth@100ms`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresDepthStream(symbols, callback);
        return this.handleWebSocket(webSocket, convertDepthData, callback, reconnect, 'futuresDepthStream()', statusCallback);
    }
    spotCandleStickStream(symbols, interval, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotCandleStickStream(symbols, interval, callback);
        return this.handleWebSocket(webSocket, convertKlineData, callback, reconnect, 'spotCandleStickStream()', statusCallback);
    }
    futuresCandleStickStream(symbols, interval, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresCandleStickStream(symbols, interval, callback);
        return this.handleWebSocket(webSocket, convertKlineData, callback, reconnect, 'futuresCanldeStickStream()', statusCallback);
    }
    futuresBookTickerStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresBookTickerStream(symbols, callback);
        return this.handleWebSocket(webSocket, convertBookTickerData, callback, reconnect, 'futuresBookTicketStream()', statusCallback);
    }
    spotBookTickerStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotBookTickerStream(symbols, callback);
        return this.handleWebSocket(webSocket, convertBookTickerData, callback, reconnect, 'spotBookTicketStream()', statusCallback);
    }
    async futuresTradeStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@aggTrade`);
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.futuresTradeStream(symbols, callback, statusCallback);
        return this.handleWebSocket(webSocket, convertTradeDataWebSocket, callback, reconnect, 'futuresTradeStream()', statusCallback);
    }
    async spotTradeStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@aggTrade`);
        const webSocket = new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        const reconnect = () => this.spotTradeStream(symbols, callback, statusCallback);
        return this.handleWebSocket(webSocket, convertTradeDataWebSocket, callback, reconnect, 'spotTradeStream()', statusCallback);
    }
    async futuresUserDataStream(callback, statusCallback) {
        const listenKey = await this.getFuturesListenKey();
        if (!listenKey.success || !listenKey.data) {
            console.log('Error getting listen key: ', listenKey.errors);
            return Promise.reject();
        }
        // send ping every 60min to keep listenKey alive
        this.keepAliveListenKeyByInterval('futures');
        const webSocket = new ws(BinanceBase.FUTURES_STREAM_URL + listenKey.data.listenKey);
        const reconnect = () => this.futuresUserDataStream(callback, statusCallback);
        return this.handleWebSocket(webSocket, convertUserData, callback, reconnect, 'futuresUserDataStream()', statusCallback);
    }
}
