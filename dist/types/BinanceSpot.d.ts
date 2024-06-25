import { FormattedResponse, GetStaticDepthParams, StaticDepth } from "./BinanceBase.js";
import BinanceStreams from "./BinanceStreams.js";
export default class BinanceSpot extends BinanceStreams {
    constructor(apiKey?: string, apiSecret?: string);
    getStaticDepth(params: GetStaticDepthParams): Promise<FormattedResponse<StaticDepth>>;
}
