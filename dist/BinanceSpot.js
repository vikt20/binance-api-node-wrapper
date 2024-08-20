import BinanceStreams from "./BinanceStreams.js";
import { convertKlinesDataByRequest } from "./converters.js";
export default class BinanceSpot extends BinanceStreams {
    constructor(apiKey, apiSecret) {
        super(apiKey, apiSecret);
    }
    async getStaticDepth(params) {
        return await this.publicRequest('spot', 'GET', '/api/v3/depth', { symbol: params.symbol, limit: params.limit ? params.limit : 500 });
    }
    async getKlines(params) {
        const request = await this.publicRequest('spot', 'GET', '/api/v3/klines', { symbol: params.symbol, interval: params.interval, startTime: params.startTime, endTime: params.endTime, limit: params.limit });
        if (request.errors)
            return this.formattedResponse({ errors: request.errors });
        return this.formattedResponse({ data: convertKlinesDataByRequest(request.data, params.symbol) });
    }
    async getExchangeInfo() {
        let request = await this.publicRequest('spot', 'GET', '/api/v1/exchangeInfo');
        // return this.formattedResponse({ data: this.extractInfo(request.data) });
        if (request.success) {
            return this.formattedResponse({ data: request.data });
        }
        else {
            return this.formattedResponse({ errors: request.errors });
        }
    }
}
