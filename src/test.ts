import BinanceStreams from "./BinanceStreams.js";

const binanceStreams = new BinanceStreams();

// test trade stream
binanceStreams.spotTradeStream(["FILUSDT"], (data) => console.log(data));