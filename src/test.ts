import BinanceSpot from "./BinanceSpot.js";

const binance = new BinanceSpot();

binance.getExchangeInfo().then(console.log).catch(console.error);
