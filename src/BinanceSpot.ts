import { FormattedResponse, GetStaticDepthParams, StaticDepth } from "./BinanceBase.js";
import BinanceStreams from "./BinanceStreams.js";

export default class BinanceSpot extends BinanceStreams {
    constructor(apiKey?: string, apiSecret?: string) {
        super(apiKey, apiSecret)
    }

    async getStaticDepth(params: GetStaticDepthParams): Promise<FormattedResponse<StaticDepth>> {
        return await this.publicRequest('spot', 'GET', '/api/v3/depth', { symbol: params.symbol, limit: params.limit ? params.limit : 500 });
    }
}