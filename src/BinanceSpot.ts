import { FormattedResponse, GetStaticDepthParams, StaticDepth, ExtractedInfo, ExchangeInfo } from "./BinanceBase.js";
import { KlineDataByRequest } from "./BinanceFutures.js";
import BinanceStreams, { KlineData } from "./BinanceStreams.js";
import { convertKlinesDataByRequest, extractInfo } from "./converters.js";

export default class BinanceSpot extends BinanceStreams {
    constructor(apiKey?: string, apiSecret?: string) {
        super(apiKey, apiSecret)
    }

    async getStaticDepth(params: GetStaticDepthParams): Promise<FormattedResponse<StaticDepth>> {
        return await this.publicRequest('spot', 'GET', '/api/v3/depth', { symbol: params.symbol, limit: params.limit ? params.limit : 500 });
    }

    async getKlines(params: { symbol: string, interval: string, startTime?: number, endTime?: number, limit?: number}): Promise<FormattedResponse<KlineDataByRequest[]>> {
        const request = await this.publicRequest('spot', 'GET', '/api/v3/klines', { symbol: params.symbol, interval: params.interval, startTime: params.startTime, endTime: params.endTime, limit: params.limit });
        if (request.errors) return this.formattedResponse({ errors: request.errors });
        return this.formattedResponse({ data: request.data });
    }

    async getExchangeInfo(): Promise<FormattedResponse<ExchangeInfo>> {
        let request = await this.publicRequest('spot', 'GET', '/api/v1/exchangeInfo')
        // return this.formattedResponse({ data: this.extractInfo(request.data) });
        if (request.success) {
            return this.formattedResponse({ data: request.data });
        } else {
            return this.formattedResponse({ errors: request.errors });
        }
    } 
}