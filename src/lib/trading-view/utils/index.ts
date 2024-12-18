import { nimbus } from "~/lib/network";
import { getNextBarTime } from "./stream";
import axios from "axios";

export const supportedResolutions = [
  "1",
  "5",
  "15",
  "60",
  "120",
  "240",
  "24H",
  "7D",
  "30D",
];

const lastBarsCache = new Map();
const sockets = new Map();

export const Datafeed = (
  baseAsset: any,
  typeWallet: string,
  symbol: string,
  tokenPairInfo?: any,
  isFromSwapPage?: boolean,
) => ({
  onReady: (callback: Function) => {
    callback({
      supported_resolutions: supportedResolutions,
      supports_marks: true,
    });
  },
  resolveSymbol: (symbolName: string, onResolve: Function) => {
    const price = baseAsset?.price;

    const params = {
      name: symbolName,
      description: "",
      type: "crypto",
      session: "24x7",
      ticker: symbolName,
      minmov: 1,
      pricescale: Math.min(
        10 ** String(Math.round(10000 / price)).length,
        10000000000000000,
      ),
      has_intraday: true,
      intraday_multipliers: ["1", "15", "30", "60"],
      supported_resolution: supportedResolutions,
      volume_precision: 8,
      data_status: "streaming",
    };
    onResolve(params);
  },
  getBars: async (
    symbolInfo: any,
    resolution: string,
    periodParams: any,
    onResult: Function,
  ) => {
    if (typeWallet === "SOL") {
      const data: any = await nimbus
        .get(
          `/token/market/chart-history?chain=${typeWallet}&symbol=${symbol}&address=${
            baseAsset.address === "11111111111111111111111111111111"
              ? "So11111111111111111111111111111111111111112"
              : baseAsset.address
          }&resolution=${resolution}&from=${periodParams.from}&to=${
            periodParams.to
          }`,
        )
        .then((res: any) => res.data);
      onResult(data, {
        noData: data.length !== periodParams.countBack,
      });

      if (periodParams.firstDataRequest) {
        lastBarsCache.set(baseAsset?.name, data[data.length - 1]);
      }
    } else if (typeWallet === "TON" || isFromSwapPage) {
      if (tokenPairInfo) {
        const result = await axios
          .get(`https://dyor.io/api/tradingview/${tokenPairInfo.id}/history`, {
            params: {
              symbol: tokenPairInfo.pairSymbol,
              resolution,
              from: periodParams.from,
              to: periodParams.to,
              countback: Number(periodParams.countBack),
              currencyCode: tokenPairInfo.pairSymbol,
            },
          })
          .then((res) => res.data)
          .catch((e) => {
            console.error(e);
          });

        if (result !== undefined) {
          const data =
            result?.o?.map((item: any, index: number) => {
              return {
                close: Number(result?.c[index] || 0),
                high: Number(result?.h[index] || 0),
                low: Number(result?.l[index] || 0),
                open: Number(item || 0),
                time: Number(result?.t[index] || 0) * 1000,
                volume: Number(result?.v[index] || 0),
                isBarClosed: index === result?.c.length - 1 ? false : true,
                isLastBar: index === result?.o.length - 1 ? true : false,
              };
            }) || [];

          onResult(data, {
            noData: data.length === 0 || data.length !== periodParams.countBack,
          });

          if (periodParams.firstDataRequest) {
            lastBarsCache.set(symbol, data[data?.length - 1]);
          }
        } else {
          onResult([], {
            noData: true,
          });
        }
      } else {
        onResult([], {
          noData: true,
        });
      }
    } else {
      const params = {
        from: periodParams.from * 1000,
        to: periodParams.to * 1000,
        amount: periodParams.countBack,
        period: resolution,
        address: baseAsset?.address,
        usd: true,
      };

      const data: any = await axios
        .get("https://api.mobula.io/api/1/market/history/pair", {
          params: {
            ...params,
          },
          headers: { Authorization: "eb66b1f3-c24b-4f43-9892-dbc5f37d5a6d" },
        })
        .then((res) => res.data)
        .catch((e) => console.error(e));

      if (data) {
        onResult(data?.data, {
          noData: data?.data?.length !== periodParams.countBack,
        });

        if (periodParams.firstDataRequest) {
          lastBarsCache.set(
            baseAsset?.name,
            data?.data[data?.data?.length - 1],
          );
        }
      } else {
        onResult([], {
          noData: true,
        });
      }
    }
  },
  searchSymbols: () => {},
  subscribeBars: (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
    onResetCacheNeededCallback,
  ) => {
    console.log("Subscribinnnng");
    const socket = new WebSocket(
      "wss://general-api-wss-fgpupeioaa-uc.a.run.app" as string,
    );
    const authKey =
      import.meta.env.VITE_MOBULA_KEY || "fe18f8be-644a-45a8-ad05-b088a5e61764";
    const params = {
      interval: 5,
      address: baseAsset?.address,
    };

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "pair",
          authorization: authKey,
          payload: params,
        }),
      );
    });

    socket.addEventListener("message", (event) => {
      const eventData = JSON.parse(event.data);
      const { data } = eventData;
      if (data) {
        const { priceUSD: price, date: timestamp } = data;

        const lastDailyBar = lastBarsCache.get(baseAsset?.name);
        const nextDailyBarTime = getNextBarTime(resolution, lastDailyBar.time);
        let bar: any;

        if (timestamp >= nextDailyBarTime) {
          bar = {
            time: nextDailyBarTime,
            open: lastDailyBar.close,
            high: price,
            low: price,
            close: price,
          };
        } else {
          bar = {
            ...lastDailyBar,
            high: Math.max(lastDailyBar.high, price),
            low: Math.min(lastDailyBar.low, price),
            close: price,
          };
        }

        onRealtimeCallback(bar);
      }
    });

    console.log("Subscribe", baseAsset?.name + "-" + subscriberUID);
    sockets.set(baseAsset?.name + "-" + subscriberUID, socket);
  },
  unsubscribeBars: (subscriberUID) => {
    console.log("Unsubscribe", baseAsset?.name + "-" + subscriberUID);
    sockets.get(baseAsset?.name + "-" + subscriberUID).close();
  },
  getMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {},
  getTimeScaleMarks: () => ({}),
  getServerTime: () => ({}),
});
