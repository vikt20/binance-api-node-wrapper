// import BinanceBase, { AccountData,  } from "./BinanceBase.js";
import BinanceBase from "./BinanceBase.js";
import { convertTradeDataWebSocket, convertDepthData, convertKlineData, convertUserData, convertBookTickerData } from "./converters.js";
import ws from 'ws';
export default class BinanceStreams extends BinanceBase {
    constructor(apiKey, apiSecret, pingServer = false) {
        super(apiKey, apiSecret, pingServer);
        this.subscriptions = [];
        // keep listen key alive by ping every 30min
        this.keepAliveListenKeyByInterval = (type) => {
            clearInterval(this.listenKeyInterval);
            this.listenKeyInterval = setInterval(() => this.keepAliveListenKey(type), 30 * 60 * 1000);
        };
    }
    closeAllSockets() {
        this.subscriptions.forEach(i => i.disconnect());
        this.subscriptions = [];
        clearInterval(this.listenKeyInterval);
        this.destroy(); // stop ping server or other Base class functions
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
     * @param createWs - function to create webSocket connection
     * @param parser - convertation function
     * @param callback - function to handle data
     * @param title
     * @returns object with webSocket, id and setIsKeepAlive function
     */
    handleWebSocket(createWs, parser, callback, title, statusCallback) {
        const MAX_RECONNECT_ATTEMPTS = 5;
        const RECONNECT_DELAY = 1000;
        let reconnectAttempts = 0;
        //generate random ID
        const id = Math.random().toString(36).substring(7);
        let isKeepAlive = true;
        let currentWs;
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
        };
        this.subscriptions.push({ id, disconnect });
        return new Promise((resolve, reject) => {
            const connect = () => {
                if (!isKeepAlive)
                    return;
                try {
                    currentWs = createWs();
                }
                catch (e) {
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
                currentWs.on('message', (data) => {
                    callback(parser(JSON.parse(data)));
                });
                //onping
                currentWs.on('ping', (data) => {
                    // console.log(`${title} - PING RECEIVED`);
                    currentWs.pong(data);
                });
                currentWs.on('pong', (data) => {
                    // console.log(`${title} - PONG RECEIVED`);
                    if (statusCallback)
                        statusCallback('PONG');
                });
                //onclose
                currentWs.on('close', (code) => {
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
                    if (statusCallback)
                        statusCallback('OPEN');
                    if (!resolved) {
                        resolved = true;
                        resolve({ disconnect, id });
                    }
                });
                //onerror
                currentWs.on('error', (error) => {
                    if (statusCallback)
                        statusCallback('ERROR');
                    // console.log(`${title} - ERROR: `, error);
                    reject(error);
                });
            };
            connect();
        });
    }
    //subscribe to spot depth stream
    spotDepthStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@depth@100ms`);
        const createWs = () => new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        return this.handleWebSocket(createWs, convertDepthData, callback, 'spotDepthStream()', statusCallback);
    }
    //subscribe to futures depth stream
    futuresDepthStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@depth@100ms`);
        const createWs = () => new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        return this.handleWebSocket(createWs, convertDepthData, callback, 'futuresDepthStream()', statusCallback);
    }
    spotCandleStickStream(symbols, interval, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const createWs = () => new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        return this.handleWebSocket(createWs, convertKlineData, callback, 'spotCandleStickStream()', statusCallback);
    }
    futuresCandleStickStream(symbols, interval, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@kline_${interval}`);
        const createWs = () => new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        return this.handleWebSocket(createWs, convertKlineData, callback, 'futuresCanldeStickStream()', statusCallback);
    }
    futuresBookTickerStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const createWs = () => new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        return this.handleWebSocket(createWs, convertBookTickerData, callback, 'futuresBookTicketStream()', statusCallback);
    }
    spotBookTickerStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@bookTicker`);
        const createWs = () => new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        return this.handleWebSocket(createWs, convertBookTickerData, callback, 'spotBookTicketStream()', statusCallback);
    }
    async futuresTradeStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@aggTrade`);
        const createWs = () => new ws(BinanceBase.FUTURES_STREAM_URL_COMBINED + streams.join('/'));
        return this.handleWebSocket(createWs, convertTradeDataWebSocket, callback, 'futuresTradeStream()', statusCallback);
    }
    async spotTradeStream(symbols, callback, statusCallback) {
        const streams = symbols.map(symbol => `${symbol.toLowerCase()}@aggTrade`);
        const createWs = () => new ws(BinanceBase.SPOT_STREAM_URL_COMBINED + streams.join('/'));
        return this.handleWebSocket(createWs, convertTradeDataWebSocket, callback, 'spotTradeStream()', statusCallback);
    }
    async futuresUserDataStream(callback, statusCallback) {
        const listenKey = await this.getFuturesListenKey();
        if (!listenKey.success || !listenKey.data) {
            console.log('Error getting listen key: ', listenKey.errors);
            return Promise.reject();
        }
        // send ping every 30min to keep listenKey alive
        this.keepAliveListenKeyByInterval('futures');
        const createWs = () => new ws(BinanceBase.FUTURES_STREAM_URL + listenKey.data.listenKey);
        return this.handleWebSocket(createWs, convertUserData, callback, 'futuresUserDataStream()', statusCallback);
    }
}
