import BinanceFutures from "./BinanceFutures.js";
import { EventEmitter } from 'events';
class BinanceUserData extends BinanceFutures {
    constructor(apiKey, apiSecret) {
        super(apiKey, apiSecret);
        this.userData = {
            positions: [],
            orders: []
        };
        this.emitPosition = (symbol) => {
            BinanceUserData.Emitter.emit(BinanceUserData.POSITION_EVENT, symbol, this.userData.positions.find(p => p.symbol === symbol));
        };
        this.emitOrders = (symbol) => {
            BinanceUserData.Emitter.emit(BinanceUserData.ORDER_EVENT, symbol, this.userData.orders.filter(order => order.symbol === symbol));
        };
        this.handleUserData = (data) => {
            switch (data.event) {
                case "ACCOUNT_UPDATE":
                    if (data.accountData)
                        data.accountData.positions.forEach(this.setPosition);
                    break;
                case "ORDER_TRADE_UPDATE":
                    // console.log(data.orderData)
                    if (data.orderData)
                        this.setOrders(data.orderData);
                    break;
                case "listenKeyExpired":
                    throw new Error("listenKeyExpired");
                    break;
                default:
                    // console.log(`No event found: `, data)
                    break;
            }
            // console.log(userData);
        };
        this.setOrders = async (data) => {
            const symbol = data.symbol;
            // console.log(data);
            if (data.orderType === "MARKET")
                return;
            switch (data.orderStatus) {
                case "CANCELED":
                case "FILLED":
                case "REJECTED":
                case "EXPIRED":
                    // case "TRIGGERED":
                    this.userData.orders = this.userData.orders.filter(order => order.clientOrderId !== data.clientOrderId);
                    break;
                case "NEW":
                    this.userData.orders.push(data);
                    break;
                default:
                    return;
            }
            //Emit event to listeners
            this.emitOrders(symbol);
        };
        this.setPosition = async (data) => {
            const symbol = data.symbol;
            const position = this.userData.positions.find(p => p.symbol === symbol);
            if (typeof position === 'undefined') {
                this.userData.positions.push(data);
            }
            else {
                this.userData.positions = this.userData.positions.map(p => {
                    if (p.symbol === symbol) {
                        return data;
                    }
                    return p;
                });
            }
            //Emit event to listeners
            this.emitPosition(symbol);
        };
    }
    async init() {
        BinanceUserData.Emitter.on(BinanceUserData.TRIGGER_POSITION_EVENT, this.emitPosition);
        BinanceUserData.Emitter.on(BinanceUserData.TRIGGER_ORDER_EVENT, this.emitOrders);
        return Promise.all([
            this.futuresUserDataStream(this.handleUserData),
            this.requestAllOrders(),
            this.requestAllPositions()
        ]);
    }
    async requestAllOrders() {
        const request = await this.getOpenOrders();
        if (!request.success || !request.data) {
            throw new Error(`getOpenOrders() - ${request.errors}`);
        }
        this.userData.orders = request.data;
    }
    async requestAllPositions() {
        const request = await this.getOpenPositions();
        if (!request.success || !request.data) {
            throw new Error(`getOpenPositions() - ${request.errors}`);
        }
        this.userData.positions = request.data;
    }
}
BinanceUserData.Emitter = new EventEmitter();
BinanceUserData.POSITION_EVENT = 'position';
BinanceUserData.ORDER_EVENT = 'order';
BinanceUserData.TRIGGER_POSITION_EVENT = 'triggerPosition';
BinanceUserData.TRIGGER_ORDER_EVENT = 'triggerOrder';
export default BinanceUserData;
