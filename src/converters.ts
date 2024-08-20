import { ExchangeInfo, ExtractedInfo, AccountData, OrderData, OrderRequestResponse, PositionData, PositionDirection } from './BinanceBase.js';
import { DepthData, KlineData, UserData, DepthDataWebSocket, KlineDataWebSocket, UserDataWebSocket, AccountDataWebSocket, OrderDataWebSocket, BookTickerDataWebSocket, BookTickerData } from './BinanceStreams.js';
import { KlineDataByRequest, PositionDataByRequest } from './BinanceFutures.js';

export function convertObjectIntoUrlEncoded(obj: any) {
    return Object.keys(obj).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])).join('&');
}

export function extractInfo(data: ExchangeInfo['symbols']) {
    let info: { [key: string]: ExtractedInfo } = {};
    for (let obj of data) {
        if (obj.status !== "TRADING") continue

        let filters: any = { status: obj.status };
        for (let filter of obj.filters) {
            // filters.all = obj.filters

            if (filter.filterType == "MIN_NOTIONAL") {
                filters.minNotional = Number(filter.notional);
            } else if (filter.filterType == "NOTIONAL") {
                filters.minNotional = Number(filter.minNotional);
            } else if (filter.filterType == "PRICE_FILTER") {
                filters.minPrice = parseFloat(filter.minPrice);
                filters.maxPrice = parseFloat(filter.maxPrice);
                filters.tickSize = parseFloat(filter.tickSize);
            } else if (filter.filterType == "LOT_SIZE") {
                filters.stepSize = parseFloat(filter.stepSize);
                filters.minQty = parseFloat(filter.minQty);
                filters.maxQty = parseFloat(filter.maxQty);
            }
        }
        //filters.baseAssetPrecision = obj.baseAssetPrecision;
        //filters.quoteAssetPrecision = obj.quoteAssetPrecision;
        filters.orderTypes = obj.orderTypes;
        filters.baseAsset = obj.baseAsset;
        filters.quoteAsset = obj.quoteAsset;
        filters.icebergAllowed = obj.icebergAllowed;
        // filters.pair = obj.pair
        info[obj.symbol] = filters;
    }
    return info
}

export function convertDepthData(inputData: DepthDataWebSocket): DepthData {
    const { s: symbol, a, b } = inputData.data;
    return {
        symbol,
        asks: a,
        bids: b
    }
}
export function convertKlineData(inputData: KlineDataWebSocket): KlineData {
    const { s: symbol, k } = inputData.data;
    return {
        symbol,
        time: k.t,
        open: Number(k.o),
        high: Number(k.h),
        low: Number(k.l),
        close: Number(k.c),
        volume: Number(k.v),
        trades: Number(k.n)
    }

}

export function convertUserData(rawData: UserDataWebSocket): UserData {
    let { e, o, a } = rawData;
    if (e === "ACCOUNT_UPDATE") {
        return { event: e, orderData: undefined, accountData: convertAccountDataWebSocketRaw(a) };
    } else if (e === "ORDER_TRADE_UPDATE") {
        return { event: e, accountData: undefined, orderData: convertOrderDataWebSocket(o) };
    } else {
        return { event: e, accountData: undefined, orderData: undefined };
    }
}

export function convertAccountDataWebSocketRaw(rawAccountData: AccountDataWebSocket): AccountData {
    let { B: balancesRaw, P: positionsRaw } = rawAccountData;
    let balances = balancesRaw.map(balances => {
        let { a: asset, wb: balance, cw: crossWalletBalance, bc: balanceChange } = balances;
        return { asset, balance, crossWalletBalance, balanceChange };
    });
    let positions = positionsRaw.map(position => {
        let { s: symbol, pa: positionAmount, ep: entryPrice, cr: accumulatedRealized, up: unrealizedPnL, mt: marginType, iw: isolatedWallet, ps: positionSide } = position;
        return {
            symbol,
            positionAmount: parseFloat(positionAmount),
            entryPrice: parseFloat(entryPrice),
            positionDirection: (parseFloat(positionAmount) > 0) ? "LONG" : "SHORT" as PositionDirection,
            isInPosition: (parseFloat(positionAmount) !== 0),
            unrealizedPnL: parseFloat(unrealizedPnL),
        };
    });
    return { balances, positions };
};
export function convertOrderDataWebSocket(rawData: OrderDataWebSocket): OrderData {
    let {
        s: symbol,
        c: clientOrderId,
        // special client order id:
        // starts with "autoclose-": liquidation order
        // "adl_autoclose": ADL auto close order
        S: side,
        o: orderType,
        f: timeInForce,
        q: originalQuantity,
        p: originalPrice,
        ap: averagePrice,
        sp: stopPrice, // please ignore with TRAILING_STOP_MARKET order,
        x: executionType,
        X: orderStatus,
        i: orderId,
        l: orderLastFilledQuantity,
        z: orderFilledAccumulatedQuantity,
        L: lastFilledPrice,
        N: commissionAsset, // will not push if no commission
        n: commission, // will not push if no commission
        T: orderTradeTime,
        t: tradeId,
        b: bidsNotional,
        a: askNotional,
        m: isMakerSide, // is this trade maker side
        R: isReduceOnly, // is this reduce only
        wt: workingType,
        ot: originalOrderType,
        ps: positionSide,
        cp: closeAll, // if close-all, pushed with conditional order
        AP: activationPrice, // only pushed with TRAILING_STOP_MARKET order
        cr: callbackRate, // only pushed with TRAILING_STOP_MARKET order
        rp: realizedProfit
    } = rawData;
    return {
        symbol,
        clientOrderId,
        side,
        orderType,
        timeInForce,
        originalQuantity: parseFloat(originalQuantity),
        originalPrice: parseFloat(originalPrice),
        averagePrice: parseFloat(averagePrice),
        stopPrice: parseFloat(stopPrice),
        executionType,
        orderStatus,
        orderId,
        orderLastFilledQuantity: parseFloat(orderLastFilledQuantity),
        orderFilledAccumulatedQuantity: parseFloat(orderFilledAccumulatedQuantity),
        lastFilledPrice: parseFloat(lastFilledPrice),
        commissionAsset,
        commission,
        orderTradeTime,
        tradeId,
        bidsNotional,
        askNotional,
        isMakerSide,
        isReduceOnly,
        workingType,
        originalOrderType,
        positionSide,
        closeAll,
        activationPrice,
        callbackRate,
        realizedProfit
    };
}

export function convertOrderDataRequestResponse(rawData: OrderRequestResponse): OrderData {
    let {
        symbol,
        clientOrderId,
        side,
        type,
        timeInForce,
        origQty,
        price,
        avgPrice,
        stopPrice,
        status,
        orderId,
        executedQty,
        cumQuote,
        time,
        updateTime,
        reduceOnly,
        closePosition,
        positionSide,
        workingType,
        origType,
        priceMatch,
        selfTradePreventionMode,
        goodTillDate
    } = rawData;
    return {
        symbol,
        clientOrderId,
        side,
        orderType: type,
        timeInForce,
        originalQuantity: parseFloat(origQty),
        originalPrice: parseFloat(price),
        averagePrice: parseFloat(avgPrice),
        stopPrice: parseFloat(stopPrice),
        executionType: status,
        orderStatus: status,
        orderId,
        orderLastFilledQuantity: parseFloat(executedQty),
        orderFilledAccumulatedQuantity: parseFloat(cumQuote),
        lastFilledPrice: parseFloat(avgPrice),
        commissionAsset: '',
        commission: '',
        orderTradeTime: time,
        tradeId: 0,
        isMakerSide: false,
        isReduceOnly: reduceOnly,
        workingType,
        originalOrderType: origType,
        positionSide,
        closeAll: closePosition,
        activationPrice: '',
        callbackRate: '',
        realizedProfit: ''
    };
}



export function convertPositionDataByRequest(rawPositionData: PositionDataByRequest): PositionData {
    let { symbol, positionAmt, entryPrice, markPrice, unRealizedProfit, liquidationPrice, leverage, marginType, isolatedMargin, isAutoAddMargin, maxNotionalValue, positionSide } = rawPositionData;
    return {
        symbol,
        positionAmount: parseFloat(positionAmt),
        entryPrice: parseFloat(entryPrice),
        positionDirection: (parseFloat(positionAmt) > 0) ? "LONG" : "SHORT",
        isInPosition: (parseFloat(positionAmt) !== 0),
        unrealizedPnL: parseFloat(unRealizedProfit),
    };
}

export function convertBookTickerData(rawData: BookTickerDataWebSocket): BookTickerData {
    let { s: symbol, b: bestBid, B: bestBidQty, a: bestAsk, A: bestAskQty } = rawData.data;
    return { symbol, bestBid: parseFloat(bestBid), bestBidQty: parseFloat(bestBidQty), bestAsk: parseFloat(bestAsk), bestAskQty: parseFloat(bestAskQty) };
}

export function convertKlinesDataByRequest(rawData: KlineDataByRequest[], symbol: string): KlineData[] {
    return rawData.map(data => ({
        symbol, // Replace with actual symbol value
        time: data[0],
        open: parseFloat(data[1]),
        high: parseFloat(data[2]),
        low: parseFloat(data[3]),
        close: parseFloat(data[4]),
        volume: parseFloat(data[5]),
        trades: data[8] // Assuming number of trades is at index 8
    }));
}