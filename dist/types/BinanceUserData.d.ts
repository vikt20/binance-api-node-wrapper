/// <reference types="node" />
import { OrderData, PositionData } from "./BinanceBase.js";
import BinanceFutures from "./BinanceFutures.js";
import { UserData as WebSocketUserData } from "./BinanceStreams.js";
import { EventEmitter } from 'events';
export type CustomUserData = {
    positions: PositionData[];
    orders: OrderData[];
};
export default class BinanceUserData extends BinanceFutures {
    constructor(apiKey: string, apiSecret: string);
    static Emitter: EventEmitter;
    static POSITION_EVENT: string;
    static ORDER_EVENT: string;
    static TRIGGER_POSITION_EVENT: string;
    static TRIGGER_ORDER_EVENT: string;
    userData: CustomUserData;
    init(): Promise<[import("./BinanceStreams.js").HandleWebSocket, void, void]>;
    emitPosition: (symbol: string) => void;
    emitOrders: (symbol: string) => void;
    handleUserData: (data: WebSocketUserData) => void;
    requestAllOrders(): Promise<void>;
    requestAllPositions(): Promise<void>;
    setOrders: (data: OrderData) => Promise<void>;
    setPosition: (data: PositionData) => Promise<void>;
}
