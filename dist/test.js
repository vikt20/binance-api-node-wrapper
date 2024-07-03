import BinanceSpot from "./BinanceSpot.js";
const binance = new BinanceSpot();
binance.getKlines({ symbol: 'BTCUSDT', interval: '1m', limit: 100 }).then(console.log);
