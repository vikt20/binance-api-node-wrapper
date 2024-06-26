import { FormattedResponse, GetStaticDepthParams, StaticDepth, ExtractedInfo } from "./BinanceBase.js";
import BinanceStreams from "./BinanceStreams.js";
import { extractInfo } from "./converters.js";

export default class BinanceSpot extends BinanceStreams {
    constructor(apiKey?: string, apiSecret?: string) {
        super(apiKey, apiSecret)
    }

    async getStaticDepth(params: GetStaticDepthParams): Promise<FormattedResponse<StaticDepth>> {
        return await this.publicRequest('spot', 'GET', '/api/v3/depth', { symbol: params.symbol, limit: params.limit ? params.limit : 500 });
    }

    async getExchangeInfo(): Promise<FormattedResponse<{ [key: string]: ExtractedInfo }>> {
        let request = await this.publicRequest('spot', 'GET', '/api/v1/exchangeInfo')
        // return this.formattedResponse({ data: this.extractInfo(request.data) });
        if (request.success) {
            return this.formattedResponse({ data: extractInfo(request.data.symbols) });
        } else {
            return this.formattedResponse({ errors: request.errors });
        }
    } 
}