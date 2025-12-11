import BinanceFutures from "./BinanceFutures.js";
import BinanceUserData from "./BinanceUserData.js";
const BINANCE_APIKEY = "pKMgDZlbE02u7iMRIHxGjx4C4ppPBl9e0xpTSHrRW9VWf3SyYIKBnQXhrdiPD4D0";
const BINANCE_APISECRET = "dWjPOQ09Y8F3lRrEVgyu5VK4sc3nDwy95geOr5gaJB7GSQfL8yjI8bA8I89yJlF2";
const binanceFutures = new BinanceFutures(BINANCE_APIKEY, BINANCE_APISECRET);
const binanceUserData = new BinanceUserData(BINANCE_APIKEY, BINANCE_APISECRET);
// await binanceUserData.init().then(() => {
//     BinanceUserData.Emitter.on(BinanceUserData.POSITION_EVENT, (symbol: string, position: PositionData) => {
//         console.log(symbol, position)
//     })
//     BinanceUserData.Emitter.on(BinanceUserData.ORDER_EVENT, (symbol: string, order: OrderData[]) => {
//         console.log(symbol, order)
//     })
// })
// make get all orders request
// binanceFutures.cancelAllOpenOrders({ symbol: 'BTCUSDT' }).then(data => console.log(data)).then(() => {
//     binanceFutures.getOpenOrders().then(data => console.log(data));
// })
binanceFutures.getOpenOrders().then(data => console.log(data));
// setTimeout(() => {
// }, 5000);
//place stop loss at 80000
// binanceFutures.trailingStopOrder({ symbol: 'BTCUSDT', side: 'BUY', quantity: 0.002, callbackRate: 1, activationPrice: 80000 }).then(data => console.log(data));
//place limit order
// await binanceFutures.limitBuy({ symbol: 'BTCUSDT', quantity: 0.002, price: 80000 }).then(data => console.log(data));
//cancel by id
// await binanceFutures.cancelOrderById({ clientOrderId: 'R00c8aAKBm9x0eLakgRotw', symbol: 'BTCUSDT', isAlgoOrder: true }).then(data => console.log(data));
// binanceFutures.reduceLimitOrder({ symbol: 'BTCUSDT', side: 'BUY', price: 80000, quantity: 0.002 }).then(data => console.log(data));
