import { ExchangeInfo, ExtractedInfo, AccountData, OrderData, OrderRequestResponse, PositionData } from './BinanceBase.js';
import { DepthData, KlineData, UserData, DepthDataWebSocket, KlineDataWebSocket, UserDataWebSocket, AccountDataWebSocket, OrderDataWebSocket, BookTickerDataWebSocket, BookTickerData } from './BinanceStreams.js';
import { PositionDataByRequest } from './BinanceFutures.js';
export declare function convertObjectIntoUrlEncoded(obj: any): string;
export declare function extractInfo(data: ExchangeInfo['symbols']): {
    [key: string]: ExtractedInfo;
};
export declare function convertDepthData(inputData: DepthDataWebSocket): DepthData;
export declare function convertKlineData(inputData: KlineDataWebSocket): KlineData;
export declare function convertUserData(rawData: UserDataWebSocket): UserData;
export declare function convertAccountDataWebSocketRaw(rawAccountData: AccountDataWebSocket): AccountData;
export declare function convertOrderDataWebSocket(rawData: OrderDataWebSocket): OrderData;
export declare function convertOrderDataRequestResponse(rawData: OrderRequestResponse): OrderData;
export declare function convertPositionDataByRequest(rawPositionData: PositionDataByRequest): PositionData;
export declare function convertBookTickerData(rawData: BookTickerDataWebSocket): BookTickerData;
