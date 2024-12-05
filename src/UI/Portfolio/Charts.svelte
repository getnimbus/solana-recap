<script lang="ts">
  import { onMount } from "svelte";
  import { AnimateSharedLayout, Motion } from "svelte-motion";
  import {
    chain,
    typeWallet,
    isDarkMode,
    selectedBundle,
    tab,
    wallet,
  } from "~/store";
  import { formatPercent, formatValue, autoFontSize } from "~/utils/index";
  import {
    performanceTypeChartPortfolio,
    isNimbusVersion,
  } from "~/utils/constants";
  import {
    listSupported,
    listNotSupportHistoricalBalances,
    chainList,
    chainSolList,
  } from "~/lib/chains";
  import dayjs from "dayjs";
  import numeral from "numeral";
  import { createQueries, createQuery } from "@tanstack/svelte-query";
  import {
    getHoldingNFT,
    getHoldingToken,
    getOverview,
    handleValidateAddress,
  } from "~/lib/queryAPI";
  import { flatten } from "lodash";

  import EChart from "~/components/EChart.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";
  import ErrorBoundary from "~/components/ErrorBoundary.svelte";
  import TokenAllocation from "~/components/TokenAllocation.svelte";
  import TooltipTitle from "~/components/TooltipTitle.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";

  import TrendDown from "~/assets/trend-down.svg";
  import TrendUp from "~/assets/trend-up.svg";
  import defaultToken from "~/assets/defaultToken.png";

  export let enabledFetchAllData;
  export let handleSelectedTableTokenHolding = (
    data: any,
    selectDataPieChart: any,
  ) => {};

  let holdingTokenData: any = [];
  let dataPieChartToken: any = {
    sumOrderBreakdownToken: 0,
    formatDataPieChartTopFiveToken: [],
    dataPieChartOrderBreakdownToken: [],
  };
  let isEmptyDataPieTokens = false;

  let dataPieChartNft = {
    sumOrderBreakdownNft: 0,
    formatDataPieChartTopFiveNft: [],
    dataPieChartOrderBreakdownNft: [],
  };
  let isEmptyDataPieNfts = false;

  let overviewDataPerformance: any = {
    performance: [],
    portfolioChart: [],
  };

  $: chainListQueries =
    $typeWallet?.length !== 0 && $typeWallet === "EVM"
      ? chainList.slice(1)?.map((item) => item.value)
      : $typeWallet?.length !== 0 && ["ECLIPSE", "SOL"].includes($typeWallet)
        ? chainSolList.slice(1)?.map((item) => item.value)
        : [chainSolList[0]?.value];

  $: queryValidate = createQuery({
    queryKey: ["validate", $wallet],
    queryFn: () => handleValidateAddress($wallet),
    retry: false,
    enabled: Boolean($wallet && $wallet?.length !== 0),
  });

  $: {
    if ($wallet || $chain) {
      if (
        $wallet?.length !== 0 &&
        $chain?.length !== 0 &&
        !$queryValidate.isFetching
      ) {
        overviewDataPerformance = {
          performance: [],
          portfolioChart: [],
        };
        holdingTokenData = [];
        dataPieChartToken = {
          sumOrderBreakdownToken: 0,
          formatDataPieChartTopFiveToken: [],
          dataPieChartOrderBreakdownToken: [],
        };
        dataPieChartNft = {
          sumOrderBreakdownNft: 0,
          formatDataPieChartTopFiveNft: [],
          dataPieChartOrderBreakdownNft: [],
        };
      }
    }
  }

  //// OVERVIEW
  $: queryOverview = createQuery({
    queryKey: ["overview", $wallet, $chain],
    queryFn: () => getOverview($wallet, $chain, $queryValidate.data),
    enabled: Boolean(
      enabledFetchAllData &&
        $wallet &&
        $wallet?.length !== 0 &&
        !$queryValidate.isFetching &&
        $tab === "token",
    ),
  });

  $: {
    if (!$queryOverview.isError && $queryOverview.data !== undefined) {
      overviewDataPerformance = {
        performance: $queryOverview?.data?.performance,
        portfolioChart: $queryOverview?.data?.portfolioChart,
      };
    }
  }

  $: isLoading = $queryOverview.isFetching;

  //// TOKEN HOLDING
  $: queryTokenHolding = createQuery({
    queryKey: ["token-holding-each-chain", $wallet, $chain],
    queryFn: () => getHoldingToken($wallet, $chain, $queryValidate.data),
    enabled: Boolean(
      enabledFetchAllData &&
        $wallet &&
        $wallet?.length !== 0 &&
        !$queryValidate.isFetching &&
        $chain.length !== 0 &&
        $chain !== "ALL" &&
        $tab.length !== 0 &&
        $tab === "token",
    ),
  });

  $: queryAllTokenHolding = createQueries(
    chainListQueries?.map((item: any) => {
      return {
        queryKey: ["token-holding", $wallet, $chain, item],
        queryFn: () => getHoldingToken($wallet, item, $queryValidate.data),
        enabled: Boolean(
          enabledFetchAllData &&
            $wallet &&
            $wallet?.length !== 0 &&
            !$queryValidate.isFetching &&
            $chain.length !== 0 &&
            $chain === "ALL" &&
            $tab.length !== 0 &&
            $tab === "token",
        ),
      };
    }),
  );

  $: {
    if ($queryAllTokenHolding.length !== 0) {
      const allTokens = flatten(
        $queryAllTokenHolding
          ?.filter((item) => Array.isArray(item.data))
          ?.map((item) => item.data),
      );
      if (allTokens && allTokens.length !== 0) {
        formatDataHoldingToken(allTokens);
      }
    }
  }

  $: {
    if (!$queryTokenHolding.isError && $queryTokenHolding.data !== undefined) {
      formatDataHoldingToken($queryTokenHolding.data);
    }
  }

  const formatDataHoldingToken = (data: any) => {
    holdingTokenData = data
      ?.filter((item: any) => Number(item?.amount) !== 0)
      ?.map((item: any) => {
        return {
          ...item,
          value: Number(item?.amount) * Number(item?.price?.price),
        };
      })
      .sort((a: any, b: any) => {
        if (a.value < b.value) {
          return 1;
        }
        if (a.value > b.value) {
          return -1;
        }
        return 0;
      });

    formatTokenBreakdown(
      holdingTokenData?.filter((item: any) => Number(item?.amount) > 0),
    );
  };

  const formatTokenBreakdown = (data: any) => {
    if (data && data?.length === 0) {
      isEmptyDataPieTokens = true;
    } else {
      isEmptyDataPieTokens = false;
    }

    const formatData = data
      ?.map((item: any) => {
        return {
          ...item,
          value: Number(item?.amount || 0) * Number(item?.price?.price || 0),
        };
      })
      ?.filter((item: any) => Number(item.value) > 0);

    const sumToken = (formatData || []).reduce(
      (prev: any, item: any) => prev + Number(item?.value),
      0,
    );

    const sortBreakdownToken = formatData?.sort((a: any, b: any) => {
      if (a.value < b.value) {
        return 1;
      }
      if (a.value > b.value) {
        return -1;
      }
      return 0;
    });

    const topFiveBreakdownToken = sortBreakdownToken
      ?.slice(0, 5)
      ?.map((item: any) => {
        return {
          ...item,
          id: item.id || "N/A",
          symbol: item.symbol || "N/A",
          name: item.name || "N/A",
        };
      });

    const orderBreakdownToken = sortBreakdownToken?.slice(
      5,
      sortBreakdownToken.length,
    );

    const sumOrderBreakdownToken = (orderBreakdownToken || []).reduce(
      (prev: any, item: any) => prev + Number(item.value),
      0,
    );

    const dataPieChartOrderBreakdownToken: any = [
      {
        logo: defaultToken,
        name: "Other tokens",
        symbol: "",
        name_ratio: "Ratio",
        value: (sumOrderBreakdownToken / sumToken) * 100,
        name_value: "Value",
        value_value: sumOrderBreakdownToken,
        name_balance: "",
        value_balance: 0,
      },
    ];

    const formatDataPieChartTopFiveToken = topFiveBreakdownToken?.map(
      (item: any) => {
        return {
          logo: item.logo || defaultToken,
          name: item.name || item.symbol,
          symbol: item.symbol,
          name_ratio: "Ratio",
          value: (Number(item.value) / sumToken) * 100,
          name_value: "Value",
          value_value: Number(item.value),
          name_balance: "Balance",
          value_balance: Number(item?.amount || item?.balance),
        };
      },
    );

    dataPieChartToken = {
      sumOrderBreakdownToken,
      formatDataPieChartTopFiveToken,
      dataPieChartOrderBreakdownToken,
    };
  };

  $: isLoadingBreakdownTokens = $queryAllTokenHolding.some(
    (item) => item.isFetching === true,
  );

  //// NFT HOLDING
  $: queryNftHolding = createQuery({
    queryKey: ["nft-holding", $wallet, $chain],
    queryFn: () => getHoldingNFT($wallet, $chain, $queryValidate.data),
    enabled: Boolean(
      enabledFetchAllData &&
        $wallet &&
        $wallet?.length !== 0 &&
        !$queryValidate.isFetching &&
        $chain.length !== 0 &&
        $chain !== "ALL" &&
        $tab.length !== 0 &&
        $tab === "nft",
    ),
  });

  $: queryAllNftHolding = createQueries(
    chainListQueries?.map((item: any) => {
      return {
        queryKey: ["nft-holding", $wallet, $chain, item],
        queryFn: () => getHoldingNFT($wallet, item, $queryValidate.data),
        enabled: Boolean(
          enabledFetchAllData &&
            $wallet &&
            $wallet?.length !== 0 &&
            !$queryValidate.isFetching &&
            $chain.length !== 0 &&
            $chain === "ALL" &&
            $tab.length !== 0 &&
            $tab === "nft",
        ),
      };
    }),
  );

  $: {
    if ($queryAllNftHolding.length !== 0) {
      const allNfts = flatten(
        $queryAllNftHolding
          ?.filter((item) => Array.isArray(item.data))
          ?.map((item) => item.data),
      );
      if (allNfts && allNfts.length !== 0) {
        formatDataHoldingNFT(allNfts);
      }
    }
  }

  $: {
    if (!$queryNftHolding.isError && $queryNftHolding.data !== undefined) {
      formatDataHoldingNFT($queryNftHolding.data);
    }
  }

  const formatDataHoldingNFT = async (data: any) => {
    const holdingNFTData = data?.map((item: any) => {
      return {
        ...item,
        verify: {
          classification: "ham",
        },
      };
    });
    formatNFTBreakdown(holdingNFTData);
  };

  const formatNFTBreakdown = (data: any) => {
    if (data?.length === 0) {
      isEmptyDataPieNfts = true;
    } else {
      isEmptyDataPieNfts = false;
    }

    const formatData = data
      ?.map((item: any) => {
        return {
          ...item,
          current_value:
            item?.floorPrice * item?.marketPrice * item?.tokens?.length,
        };
      })
      ?.filter((item: any) => Number(item.current_value) > 0);

    const sumNft = (formatData || []).reduce(
      (prev: any, item: any) => prev + Number(item?.current_value),
      0,
    );

    const sortBreakdownNft = formatData.sort((a: any, b: any) => {
      if (a.current_value < b.current_value) {
        return 1;
      }
      if (a.current_value > b.current_value) {
        return -1;
      }
      return 0;
    });

    const topFiveBreakdownNft = sortBreakdownNft
      ?.slice(0, 5)
      ?.map((item: any) => {
        return {
          ...item,
          id: item.collection.id || "N/A",
          name: item.collection.name || "N/A",
        };
      });

    const orderBreakdownNft = sortBreakdownNft?.slice(
      5,
      sortBreakdownNft.length,
    );

    const sumOrderBreakdownNft = (orderBreakdownNft || []).reduce(
      (prev: any, item: any) => prev + Number(item.current_value),
      0,
    );

    const dataPieChartOrderBreakdownNft: any = [
      {
        name: "Other NFT Collection",
        name_ratio: "Ratio",
        value: (sumOrderBreakdownNft / sumNft) * 100 || 0,
        name_value: "Value",
        value_value: sumOrderBreakdownNft,
        name_balance: "",
        value_balance: 0,
      },
    ];

    const formatDataPieChartTopFiveNft = topFiveBreakdownNft?.map(
      (item: any) => {
        return {
          name: item.name || item.collection.name,
          name_ratio: "Ratio",
          value: (Number(item.current_value) / sumNft) * 100 || 0,
          name_value: "Value",
          value_value: Number(item.current_value),
          name_balance: "Balance",
          value_balance: Number(item?.tokens?.length),
        };
      },
    );

    dataPieChartNft = {
      sumOrderBreakdownNft,
      formatDataPieChartTopFiveNft,
      dataPieChartOrderBreakdownNft,
    };
  };

  $: isLoadingBreakdownNfts = $queryAllNftHolding.some(
    (item) => item.isFetching === true,
  );

  /// FORMAT CHART DATA
  let selectedTypePerformance: "percent" | "networth" = "percent";
  let optionPie: any = {
    title: {
      text: "",
    },
    tooltip: {
      trigger: "item",
      extraCssText: "z-index: 9997",
      formatter: function (params: any) {
        return `
            <div style="display: flex; flex-direction: column; gap: 12px; min-width: 220px;">
              <div style="display: flex; align-items: centers; gap: 4px">
                <img src="https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384"
                onerror="this.onerror=null;this.src='https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384';"
                alt="" width=20 height=20 style="border-radius: 100%" />
                <div style="font-weight: 500; font-size: 16px; line-height: 19px; color: ${
                  $isDarkMode ? "white" : "black"
                }">
                  ${params?.name} ${
                    params?.data?.symbol ? `(${params?.data?.symbol})` : ""
                  }
                </div>
              </div>

              ${
                params?.data?.name_balance
                  ? `
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                  $isDarkMode ? "white" : "black"
                }">
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                    Balance
                  </div>
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                    ${params?.data?.value_balance}
                  </div>
                </div>
              `
                  : ""
              }

              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                $isDarkMode ? "white" : "black"
              }">
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  Value
                </div>
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${formatValue(params?.data?.value_value)}
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                $isDarkMode ? "white" : "black"
              }">
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  Ratio
                </div>
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${formatPercent(params?.value)}%
                </div>
              </div>
            </div>`;
      },
    },
    legend: {
      type: "scroll",
      top: "0%",
      left: "center",
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "60%"],
        left: 0,
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: false,
            fontSize: 40,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: [],
      },
    ],
  };
  let optionLine: any = {
    title: {
      text: "",
    },
    tooltip: {
      trigger: "axis",
      extraCssText: "z-index: 9997",
      formatter: function (params: any) {
        return `
            <div style="display: flex; flex-direction: column; gap: 12px; min-width: 220px;">
              <div style="font-weight: 500; font-size: 16px; line-height: 19px; color: ${
                $isDarkMode ? "white" : "black"
              }">
                ${params[0].axisValue}
              </div>
              ${params
                .map((item: any) => {
                  return `
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));">
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); display: flex; align-items: centers; gap: 4px; font-weight: 500; color: ${
                    $isDarkMode ? "white" : "black"
                  }">
                    <span>${item?.marker}</span>
                    ${item?.seriesName}
                  </div>

                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); text-align: right;">
                    <div style="display:flex; justify-content: flex-end; align-items: center; gap: 4px; flex: 1; font-weight: 500; font-size: 14px; line-height: 17px; color: ${
                      item.value >= 0 ? "#05a878" : "#f25f5d"
                    };">
                      ${formatPercent(Math.abs(item.value))}%
                      <img
                        src=${item.value >= 0 ? TrendUp : TrendDown} 
                        alt=""
                        style="margin-bottom: 4px;"
                      />
                    </div>
                  </div>
                </div>
                `;
                })
                .join("")}
            </div>`;
      },
    },
    legend: {
      lineStyle: {
        type: "solid",
      },
      data: [],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: [],
      axisLabel: {
        fontSize: autoFontSize(),
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: autoFontSize(),
      },
    },
    series: [],
  };

  let dataLineChartPercent = {
    formatXAxis: [],
    formatDataPortfolio: [],
    formatDataETH: [],
    formatDataBTC: [],
  };

  let dataLineChartNetWorth = {
    formatXAxis: [],
  };

  let networth = 0;
  let portfolioPercentChange = 0;
  let networthValueChange = 0;
  let tooltipDateValue: any;

  $: {
    if (tooltipDateValue) {
      const formatDataPortfolioChart =
        overviewDataPerformance?.portfolioChart.map((item: any) => {
          return {
            timestamp: dayjs(item.timestamp * 1000).format("YYYY-MM-DD"),
            value: item.value,
          };
        });

      const formatDataPerformance = overviewDataPerformance?.performance.map(
        (item: any) => {
          return {
            timestamp: dayjs(item.date).format("YYYY-MM-DD"),
            portfolio: item.portfolio,
          };
        },
      );

      const selectedDataPortfolioChart = formatDataPortfolioChart.find(
        (item: any) => item.timestamp === tooltipDateValue,
      );

      const selectedDataPerformance = formatDataPerformance.find(
        (item: any) => item.timestamp === tooltipDateValue,
      );

      if (selectedDataPortfolioChart) {
        networth = selectedDataPortfolioChart?.value;

        portfolioPercentChange = selectedDataPerformance?.portfolio;

        networthValueChange =
          formatDataPortfolioChart[0]?.value * (portfolioPercentChange / 100);
      }
    }
  }

  $: {
    if (
      ((overviewDataPerformance?.performance &&
        overviewDataPerformance?.performance?.length !== 0) ||
        (overviewDataPerformance?.portfolioChart &&
          overviewDataPerformance?.portfolioChart?.length !== 0)) &&
      $tab === "token"
    ) {
      networth =
        overviewDataPerformance?.portfolioChart[
          overviewDataPerformance?.portfolioChart?.length - 1
        ]?.value;

      portfolioPercentChange =
        overviewDataPerformance?.performance[
          overviewDataPerformance?.performance?.length - 1
        ]?.portfolio;

      networthValueChange =
        overviewDataPerformance?.portfolioChart[0]?.value *
        (portfolioPercentChange / 100);

      const formatXAxisPerformance = overviewDataPerformance?.performance?.map(
        (item: any) => {
          return dayjs(item.date).format("YYYY-MM-DD");
        },
      );

      const formatDataPortfolio = overviewDataPerformance?.performance?.map(
        (item: any) => {
          return {
            value: item.portfolio,
            itemStyle: {
              color: "#00b580",
            },
          };
        },
      );

      const formatDataETH = overviewDataPerformance?.performance?.map(
        (item: any) => {
          return {
            value: item.eth,
            itemStyle: {
              color: "#547fef",
            },
          };
        },
      );

      const formatDataBTC = overviewDataPerformance?.performance?.map(
        (item: any) => {
          return {
            value: item.btc,
            itemStyle: {
              color: "#f7931a",
            },
          };
        },
      );

      const formatXAxisPortfolioChart =
        overviewDataPerformance?.portfolioChart?.map((item: any) => {
          return dayjs(item.timestamp * 1000).format("YYYY-MM-DD");
        });

      dataLineChartPercent = {
        formatXAxis: formatXAxisPerformance,
        formatDataPortfolio,
        formatDataETH,
        formatDataBTC,
      };

      dataLineChartNetWorth = {
        formatXAxis: formatXAxisPortfolioChart,
      };
    } else {
      dataLineChartNetWorth = {
        formatXAxis: [],
      };
      dataLineChartPercent = {
        formatXAxis: [],
        formatDataPortfolio: [],
        formatDataETH: [],
        formatDataBTC: [],
      };
      optionLine = {
        title: {
          text: "",
        },
        tooltip: {
          trigger: "axis",
          extraCssText: "z-index: 9997",
          formatter: function (params: any) {
            return `
            <div style="display: flex; flex-direction: column; gap: 12px; min-width: 220px;">
              <div style="font-weight: 500; font-size: 16px; line-height: 19px; color: ${
                $isDarkMode ? "white" : "black"
              }">
                ${params[0].axisValue}
              </div>
              ${params
                .map((item: any) => {
                  return `
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));">
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); display: flex; align-items: centers; gap: 4px; font-weight: 500; color: ${
                    $isDarkMode ? "white" : "black"
                  }">
                    <span>${item?.marker}</span>
                    ${item?.seriesName}
                  </div>

                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); text-align: right;">
                    <div style="display:flex; justify-content: flex-end; align-items: center; gap: 4px; flex: 1; font-weight: 500; font-size: 14px; line-height: 17px; color: ${
                      item.value >= 0 ? "#05a878" : "#f25f5d"
                    };">
                      ${formatPercent(Math.abs(item.value))}%
                      <img
                        src=${item.value >= 0 ? TrendUp : TrendDown} 
                        alt=""
                        style="margin-bottom: 4px;"
                      />
                    </div>
                  </div>
                </div>
                `;
                })
                .join("")}
            </div>`;
          },
        },
        legend: {
          lineStyle: {
            type: "solid",
          },
          data: [],
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: [],
          axisLabel: {
            fontSize: autoFontSize(),
          },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            fontSize: autoFontSize(),
          },
        },
        series: [],
      };
    }
  }

  $: {
    if (selectedTypePerformance) {
      if (selectedTypePerformance === "percent") {
        optionLine = {
          ...optionLine,
          tooltip: {
            trigger: "axis",
            extraCssText: "z-index: 9997",
            formatter: function (params: any) {
              tooltipDateValue = params[0].axisValue;
              return `
            <div style="display: flex; flex-direction: column; gap: 12px; min-width: 260px;">
              <div style="font-weight: 500; font-size: 16px; line-height: 19px; color: ${
                $isDarkMode ? "white" : "black"
              }">
                ${params[0].axisValue}
              </div>
              ${params
                .map((item: any) => {
                  return `
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));">
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); display: flex; align-items: centers; gap: 4px; font-weight: 500;color: ${
                    $isDarkMode ? "white" : "black"
                  }">
                    <span>${item?.marker}</span>
                    ${item?.seriesName}
                  </div>
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); text-align: right;">
                    <div style="display:flex; justify-content: flex-end; align-items: center; gap: 4px; flex: 1; font-weight: 500; font-size: 14px; line-height: 17px; color: ${
                      item.value >= 0 ? "#05a878" : "#f25f5d"
                    };">
                      ${formatPercent(Math.abs(item.value))}%
                      <img
                        src=${item.value >= 0 ? TrendUp : TrendDown}
                        alt=""
                        style="margin-bottom: 4px;"
                      />
                    </div>
                  </div>
                </div>
                `;
                })
                .join("")}
            </div>`;
            },
          },
          legend: {
            ...optionLine.legend,
            data: [
              {
                name: "Your Portfolio",
                itemStyle: {
                  color: "#00b580",
                },
              },
              {
                name: "Bitcoin",
                itemStyle: {
                  color: "#f7931a",
                },
              },
              {
                name: "Ethereum",
                itemStyle: {
                  color: "#547fef",
                },
              },
            ],
          },
          xAxis: {
            ...optionLine.xAxis,
            data: dataLineChartPercent.formatXAxis,
          },
          yAxis: {
            ...optionLine.yAxis,
            axisLabel: {
              formatter: "{value}%",
              fontSize: autoFontSize(),
            },
          },
          series: [
            {
              name: "Your Portfolio",
              type: "line",
              lineStyle: {
                type: "solid",
                color: "#00b580",
              },
              showSymbol: false,
              data: dataLineChartPercent.formatDataPortfolio,
            },
            {
              name: "Bitcoin",
              type: "line",
              lineStyle: {
                type: "dashed",
                color: "#f7931a",
              },
              showSymbol: false,
              data: dataLineChartPercent.formatDataBTC,
            },
            {
              name: "Ethereum",
              type: "line",
              lineStyle: {
                type: "dashed",
                color: "#547fef",
              },
              showSymbol: false,
              data: dataLineChartPercent.formatDataETH,
            },
          ],
        };
      }
      if (selectedTypePerformance === "networth") {
        optionLine = {
          ...optionLine,
          tooltip: {
            trigger: "axis",
            extraCssText: "z-index: 9997",
            formatter: function (params: any) {
              tooltipDateValue = params[0].axisValue;
              return `
            <div style="display: flex; flex-direction: column; gap: 12px; min-width: 320px;">
              <div style="font-weight: 500; font-size: 16px; line-height: 19px; color: ${
                $isDarkMode ? "white" : "black"
              }">
                ${params[0].axisValue}
              </div>
              ${params
                .map((item: any) => {
                  return `
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));">
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); display: flex; align-items: centers; gap: 4px; font-weight: 500; color: ${
                    $isDarkMode ? "white" : "black"
                  }">
                    <span>${item?.marker}</span>
                    ${item?.seriesName}
                  </div>
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); text-align: right; margin-top: 2px;">
                    <div style="display:flex; justify-content: flex-end; align-items: center; gap: 4px; flex: 1; font-weight: 500; font-size: 14px; line-height: 17px; color: ${
                      $isDarkMode ? "white" : "black"
                    }">
                      ${formatValue(Math.abs(item.value))}
                    </div>
                  </div>
                </div>
                `;
                })
                .join("")}
            </div>`;
            },
          },
          legend: {
            ...optionLine.legend,
            data: [
              {
                name: "Your Portfolio",
                itemStyle: {
                  color: "#00b580",
                },
              },
            ],
          },
          xAxis: {
            ...optionLine.xAxis,
            data: dataLineChartNetWorth.formatXAxis,
          },
          yAxis: {
            ...optionLine.yAxis,
            axisLabel: {
              formatter: function (value: any, index: any) {
                return (
                  `${value < 0 ? "-" : ""} $` +
                  numeral(Math.abs(value)).format("0.00a")
                );
              },
              fontSize: autoFontSize(),
            },
          },
          series: [
            {
              name: "Your Portfolio",
              type: "line",
              lineStyle: {
                type: "solid",
                color: "#00b580",
              },
              showSymbol: false,
              data: overviewDataPerformance?.portfolioChart.map((item: any) => {
                return {
                  value: item.value,
                  itemStyle: {
                    color: "#00b580",
                  },
                };
              }),
            },
          ],
        };
      }
    }
  }

  $: {
    if ($tab) {
      if (Object.keys(dataPieChartNft).length !== 0) {
        if ($tab === "nft") {
          optionPie = {
            ...optionPie,
            series: [
              {
                ...optionPie.series[0],
                data:
                  dataPieChartNft.sumOrderBreakdownNft > 0
                    ? dataPieChartNft.formatDataPieChartTopFiveNft?.concat(
                        dataPieChartNft.dataPieChartOrderBreakdownNft,
                      )
                    : dataPieChartNft.formatDataPieChartTopFiveNft,
              },
            ],
          };
        }
      } else {
        optionPie = {
          title: {
            text: "",
          },
          tooltip: {
            trigger: "item",
            extraCssText: "z-index: 9997",
            formatter: function (params: any) {
              return `
            <div style="display: flex; flex-direction: column; gap: 12px; min-width: 220px;">
              <div style="display: flex; align-items: centers; gap: 4px">
                <img src="https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384"
                onerror="this.onerror=null;this.src='https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384';"
                alt="" width=20 height=20 style="border-radius: 100%" />
                <div style="font-weight: 500; font-size: 16px; line-height: 19px; color: ${
                  $isDarkMode ? "white" : "black"
                }">
                  ${params?.name} ${
                    params?.data?.symbol ? `(${params?.data?.symbol})` : ""
                  }
                </div>
              </div>

              ${
                params?.data?.name_balance
                  ? `
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                  $isDarkMode ? "white" : "black"
                }">
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                    Balance
                  </div>
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                    ${params?.data?.value_balance}
                  </div>
                </div>
              `
                  : ""
              }

              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                $isDarkMode ? "white" : "black"
              }">
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  Value
                </div>
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${formatValue(params?.data?.value_value)}
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                $isDarkMode ? "white" : "black"
              }">
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  Ratio
                </div>
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${formatPercent(params?.value)}%
                </div>
              </div>
            </div>`;
            },
          },
          legend: {
            type: "scroll",
            top: "0%",
            left: "center",
          },
          series: [
            {
              type: "pie",
              radius: ["40%", "60%"],
              left: 0,
              avoidLabelOverlap: false,
              label: {
                show: false,
                position: "center",
              },
              emphasis: {
                label: {
                  show: false,
                  fontSize: 40,
                  fontWeight: "bold",
                },
              },
              labelLine: {
                show: false,
              },
              data: [],
            },
          ],
        };
      }
    }
  }

  $: theme = $isDarkMode ? "dark" : "white";
</script>

<ErrorBoundary>
  <div class="flex flex-col justify-between gap-6 xl:flex-row">
    <div
      class={`rounded-[20px] xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
        $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
      } ${$tab === "token" ? "xl:w-1/2 w-full" : "w-full"}`}
    >
      <div class="font-medium text-2xl mb-6">Allocation</div>

      {#if isLoading || isLoadingBreakdownTokens || isLoadingBreakdownNfts}
        <div class="flex items-center justify-center h-[465px]">
          {#if isNimbusVersion}
            <LoadingPremium />
          {:else}
            <Loading />
          {/if}
        </div>
      {:else}
        <div class="h-full">
          {#if $tab === "token"}
            {#if isEmptyDataPieTokens}
              <div
                class="flex justify-center items-center h-[465px] text-base text-gray-400"
              >
                Empty
              </div>
            {:else}
              <div class={`${$typeWallet !== "BTC" ? "md:-mt-14 -mt-2" : ""}`}>
                <TokenAllocation
                  {handleSelectedTableTokenHolding}
                  {holdingTokenData}
                  {dataPieChartToken}
                  listOptionTypeCategory={[]}
                  selectedOption={{}}
                  id="pie-chart-token-allocation"
                  isComparePage={false}
                />
              </div>
            {/if}
          {/if}

          {#if $tab === "nft"}
            {#if isEmptyDataPieNfts}
              <div
                class="flex justify-center items-center h-[465px] text-base text-gray-400"
              >
                Empty
              </div>
            {:else}
              <div class="xl:block hidden">
                <EChart
                  id="pie-chart-nft-allocation-dekstop"
                  {theme}
                  notMerge={true}
                  option={optionPie}
                  height={465}
                />
              </div>
              <div class="xl:hidden block">
                <EChart
                  id="pie-chart-nft-allocation-mobile"
                  {theme}
                  notMerge={true}
                  option={optionPie}
                  height={265}
                />
              </div>
            {/if}
          {/if}
        </div>
      {/if}
    </div>

    <!-- <div
      class={`view-the-chart-performance xl:block hidden xl:w-1/2 w-full rounded-[20px] relative xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
        $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
      }`}
    >
      {#if $typeWallet === "BTC"}
        <div class="md:pl-4 font-medium text-2xl">Performance</div>
        <div
          class={`absolute top-0 left-0 rounded-[20px] w-full h-full flex items-center justify-center z-7 backdrop-blur-md ${
            $isDarkMode ? "bg-black/90" : "bg-white/95"
          }`}
        >
          <div class="text-lg">Coming soon 🚀</div>
        </div>
      {:else}
        <div class="flex md:flex-row flex-col gap-3 justify-between mb-4">
          <div class="md:pl-4 font-medium text-2xl">Performance</div>

          {#if overviewDataPerformance?.performance?.length !== 0 || overviewDataPerformance?.portfolioChart?.length !== 0}
            <div class="flex items-center gap-2">
              <AnimateSharedLayout>
                {#each performanceTypeChartPortfolio as type}
                  <div
                    class="relative cursor-pointer text-base font-medium py-1 px-3 rounded-[100px] transition-all"
                    on:click={() => (selectedTypePerformance = type.value)}
                  >
                    <div
                      class={`relative z-1 ${
                        selectedTypePerformance === type.value && "text-white"
                      }`}
                    >
                      {type.label}
                    </div>
                    {#if type.value === selectedTypePerformance}
                      <Motion
                        let:motion
                        layoutId="active-pill"
                        transition={{ type: "spring", duration: 0.6 }}
                      >
                        <div
                          class="absolute inset-0 rounded-full bg-[#1E96FC] z-0"
                          use:motion
                        />
                      </Motion>
                    {/if}
                  </div>
                {/each}
              </AnimateSharedLayout>
            </div>
          {/if}
        </div>

        {#if isLoading || isLoadingBreakdownTokens || isLoadingBreakdownNfts}
          <div class="flex items-center justify-center h-[465px]">
            {#if isNimbusVersion}
              <LoadingPremium />
            {:else}
              <Loading />
            {/if}
          </div>
        {:else}
          <div>
            {#if overviewDataPerformance?.performance?.length === 0 || overviewDataPerformance?.portfolioChart?.length === 0}
              <div
                class="flex justify-center items-center h-[465px] text-base text-gray-400"
              >
                Empty
              </div>
            {:else}
              <div class="flex flex-col gap-4 relative">
                <div
                  class={`absolute md:top-8 top-16 md:left-20 left-24 flex flex-col rounded-[4px] w-max px-2 py-1 z-2 ${
                    $isDarkMode ? "bg-[#131313]" : "bg-white"
                  }`}
                  style="box-shadow: rgba(0, 0, 0, 0.2) 1px 2px 10px;"
                >
                  <div class="text-lg font-medium flex items-center">
                    $<TooltipNumber number={networth} type="balance" />
                  </div>
                  <div
                    class={`text-sm flex gap-1 ${
                      portfolioPercentChange >= 0
                        ? "text-[#00A878]"
                        : "text-red-500"
                    }`}
                  >
                    <span>
                      <TooltipNumber
                        number={Math.abs(portfolioPercentChange)}
                        type="percent"
                      />%
                    </span>
                    {#if portfolioPercentChange !== 0}
                      <img
                        src={portfolioPercentChange >= 0 ? TrendUp : TrendDown}
                        alt="trend"
                        class="mb-1"
                      />
                    {/if}
                    <span class="flex">
                      ({#if networthValueChange < 0}-{/if}$<TooltipNumber
                        number={Math.abs(networthValueChange)}
                        type="balance"
                      />)
                    </span>
                  </div>
                </div>
                <EChart
                  id="line-chart"
                  {theme}
                  notMerge={true}
                  option={optionLine}
                  height={465}
                />
              </div>
            {/if}
          </div>
        {/if}
      {/if}
    </div> -->
  </div>
</ErrorBoundary>

<style>
</style>
