import BinanceFutures from "./BinanceFutures.js";
const binanceFutures = new BinanceFutures();
// test trade stream
//period last 30 minutes
binanceFutures.getAggTrades({ symbol: "FILUSDT", startTime: Date.now() - 1000 * 60 * 30, endTime: Date.now() }).then(data => console.log(data));
