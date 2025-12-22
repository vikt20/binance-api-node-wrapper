import http from 'http';
import https from 'https';
import axios from 'axios';
import * as crypto from 'crypto';
import { convertObjectIntoUrlEncoded } from './converters.js';
class BinanceBase {
    constructor(apiKey, apiSecret, pingServer = false) {
        this._HTTP_AGENT = new http.Agent({ keepAlive: true, timeout: 3600000 });
        this._HTTPS_AGENT = new https.Agent({ keepAlive: true, timeout: 3600000 });
        this._AXIOS_INSTANCE = axios.create({ httpAgent: this._HTTP_AGENT, httpsAgent: this._HTTPS_AGENT });
        this.timeOffset = 0;
        this.recvWindow = 3000;
        this.apiKey = apiKey || '';
        this.apiSecret = apiSecret || '';
        if (pingServer)
            this.pingServer();
        this.setTimeOffset();
    }
    destroy() {
        clearInterval(this.pingServerInterval);
    }
    pingServer() {
        clearInterval(this.pingServerInterval);
        this.pingServerInterval = setInterval(() => this._AXIOS_INSTANCE.get(`${BinanceBase.FUTURES_BASE_URL}/fapi/v1/ping`).catch(() => { }), 30000);
    }
    generateSignature(queryString) {
        return crypto.createHmac('sha256', this.apiSecret).update(queryString).digest('hex');
    }
    async getFuturesListenKey() {
        return await this.signedRequest('futures', 'POST', '/fapi/v1/listenKey');
    }
    async keepAliveListenKey(type) {
        return type === 'futures' ? await this.signedRequest(type, 'PUT', '/fapi/v1/listenKey') : await this.signedRequest(type, 'PUT', '/api/v3/userDataStream');
    }
    async setTimeOffset() {
        try {
            const serverTime = await this.getServerTime();
            const localTime = Date.now();
            this.timeOffset = localTime - serverTime;
        }
        catch (error) {
            throw new Error(`Failed to set time offset`);
        }
    }
    async getServerTime() {
        try {
            const response = await this._AXIOS_INSTANCE.get(`${BinanceBase.FUTURES_BASE_URL}/fapi/v1/time`);
            return response.data.serverTime;
        }
        catch (error) {
            throw new Error(`Failed to retrieve server time`);
        }
    }
    async publicRequest(type, method, endpoint, params = {}) {
        try {
            const _URL = type === 'futures' ? BinanceBase.FUTURES_BASE_URL : BinanceBase.SPOT_BASE_URL;
            const response = await this._AXIOS_INSTANCE.request({
                method: method,
                url: `${_URL}${endpoint}`,
                params: params
            });
            return this.formattedResponse({ data: response.data });
        }
        catch (error) {
            if (error.response && error.response.data && error.response.data.msg) {
                return this.formattedResponse({ errors: error.response.data.msg });
            }
            else {
                return this.formattedResponse({ errors: `Failed to make request: ${error.message}` });
            }
        }
    }
    async signedRequest(type, method, endpoint, params = {}) {
        try {
            // const timestamp = Date.now();
            const timestamp = Date.now() - this.timeOffset;
            params.timestamp = timestamp;
            const queryString = convertObjectIntoUrlEncoded(params);
            const signature = this.generateSignature(queryString);
            // console.log(`query:`, queryString);
            const _URL = type === 'futures' ? BinanceBase.FUTURES_BASE_URL : BinanceBase.SPOT_BASE_URL;
            const response = await this._AXIOS_INSTANCE.request({
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
            return this.formattedResponse({ data: response.data });
        }
        catch (error) {
            if (error.response && error.response.data && error.response.data.msg) {
                return this.formattedResponse({ errors: error.response.data.msg });
            }
            else {
                return this.formattedResponse({ errors: `Failed to make request: ${error.message}` });
            }
        }
    }
    formattedResponse(object) {
        return {
            success: object.errors === undefined ? true : false,
            data: object.data,
            errors: object.errors
        };
    }
}
BinanceBase.FUTURES_STREAM_URL = 'wss://fstream.binance.com/ws/';
BinanceBase.SPOT_STREAM_URL = 'wss://stream.binance.com:9443/ws/';
BinanceBase.FUTURES_STREAM_URL_COMBINED = 'wss://fstream.binance.com/stream?streams=';
BinanceBase.SPOT_STREAM_URL_COMBINED = 'wss://stream.binance.com:9443/stream?streams=';
BinanceBase.FUTURES_BASE_URL = 'https://fapi.binance.com';
BinanceBase.SPOT_BASE_URL = 'https://api.binance.com';
export default BinanceBase;
