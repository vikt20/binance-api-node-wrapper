import { FormattedResponse, GetStaticDepthParams, StaticDepth, ExchangeInfo } from "./BinanceBase.js";
import BinanceStreams, { KlineData } from "./BinanceStreams.js";
export default class BinanceSpot extends BinanceStreams {
    constructor(apiKey?: string, apiSecret?: string);
    getStaticDepth(params: GetStaticDepthParams): Promise<FormattedResponse<StaticDepth>>;
    getKlines(params: {
        symbol: string;
        interval: string;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }): Promise<FormattedResponse<KlineData[]>>;
    getExchangeInfo(): Promise<FormattedResponse<ExchangeInfo>>;
}
