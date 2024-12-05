<script lang="ts">
  import {
    calculatePnL,
    calculateRealizedProfit,
    calculateUnrealizedProfit,
  } from "~/utils/functions";
  import { createQueries, createQuery } from "@tanstack/svelte-query";
  import { isDarkMode, chain, typeWallet } from "~/store";
  import { t } from "~/lib/i18n";
  import {
    getTradingStats,
    getHoldingToken,
    handleValidateAddress,
  } from "~/lib/queryAPI";
  import { AnimateSharedLayout, Motion } from "svelte-motion";
  import numeral from "numeral";
  import {
    autoFontSize,
    formatPercent,
    formatValue,
    shorterName,
  } from "~/utils/index";
  import {
    typeClosedHoldingTokenChart,
    isNimbusVersion,
  } from "~/utils/constants";
  import dayjs from "dayjs";
  import { chainList, chainMoveList, chainSolList } from "~/lib/chains";
  import { flatten } from "lodash";

  import Loading from "~/components/Loading.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import EChart from "~/components/EChart.svelte";

  import Logo from "~/assets/logo-1.svg";
  import LogoWhite from "~/assets/logo-white.svg";
  import TrendDown from "~/assets/trend-down.svg";
  import TrendUp from "~/assets/trend-up.svg";
  import defaultToken from "~/assets/defaultToken.png";

  export let selectedAddress;
  export let isSync = false;
  export let enabledFetchAllData = false;

  let closedHoldingPosition: any = [];
  let selectedTypeChart: "value" | "percent" = "value";
  let optionBarValue: any = {
    tooltip: {
      trigger: "axis",
      extraCssText: "z-index: 9997",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params: any) {
        const selectedItem = closedHoldingPosition.find(
          (item: any) =>
            item?.contractAddress?.toLowerCase() ===
            params[0]?.name?.toLowerCase(),
        );
        return `
          <div style="display: flex; flex-direction: column; gap: 12px; min-width: 400px;">
            <div style="display: flex; align-items: centers; gap: 4px">
              <img src=${
                selectedItem?.logo || defaultToken
              } alt="" width=20 height=20 style="border-radius: 100%" />
              <div style="margin-top: 2px; font-weight: 500; font-size: 16px; line-height: 19px; color: ${
                $isDarkMode ? "white" : "black"
              }">
                ${
                  selectedItem?.name?.length > 20
                    ? shorterName(selectedItem?.name, 20)
                    : selectedItem?.name || "N/A"
                } ${selectedItem?.symbol ? `(${selectedItem?.symbol})` : ""}
              </div>
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="font-weight: 500; font-size: 14px; line-height: 17px; color: ${
                $isDarkMode ? "white" : "black"
              }">
                ROI
              </div>
            
              <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end; gap: 4px; flex: 1; width: 100%; text-align: right; font-weight: 500; font-size: 14px; line-height: 17px;">
                <div style="display:flex; justify-content: flex-end; align-items: center; color: ${
                  params[0].value >= 0 ? "#05a878" : "#f25f5d"
                };">
                  <span>${params[0].value < 0 ? "-" : ""}</span>
                  ${formatValue(Math.abs(params[0].value))}
                </div>
                <div style="display:flex; justify-content: flex-end; align-items: center; gap: 4px; color: ${
                  selectedItem?.percentPnL >= 0 ? "#05a878" : "#f25f5d"
                };">
                  ${formatPercent(Math.abs(selectedItem?.percentPnL))}%
                  <img src=${
                    selectedItem?.percentPnL >= 0 ? TrendUp : TrendDown
                  } alt="" style="margin-bottom: 4px;" />
                </div>
              </div>
            </div>
          </div>`;
      },
    },
    toolbox: {
      right: "3%",
      top: "-1%",
      feature: {
        dataZoom: {
          yAxisIndex: "none",
        },
      },
    },
    xAxis: {
      type: "category",
      axisTick: { show: false },
      show: false,
      data: [],
      axisLabel: {
        fontSize: autoFontSize(),
      },
    },
    yAxis: {
      type: "value",
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
    series: [],
  };
  let optionBarPercent: any = {
    tooltip: {
      trigger: "axis",
      extraCssText: "z-index: 9997",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params: any) {
        const selectedItem = closedHoldingPosition.find(
          (item: any) =>
            item?.contractAddress?.toLowerCase() ===
            params[0]?.name?.toLowerCase(),
        );
        return `
          <div style="display: flex; flex-direction: column; gap: 12px; min-width: 400px;">
            <div style="display: flex; align-items: centers; gap: 4px">
              <img src=${
                selectedItem?.logo || defaultToken
              } alt="" width=20 height=20 style="border-radius: 100%" />
              <div style="margin-top: 2px; font-weight: 500; font-size: 14px; line-height: 17px; color: ${
                $isDarkMode ? "white" : "black"
              }">
                ${
                  selectedItem?.name?.length > 20
                    ? shorterName(selectedItem?.name, 20)
                    : selectedItem?.name || "N/A"
                } ${selectedItem?.symbol ? `(${selectedItem?.symbol})` : ""}
              </div>
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="font-weight: 500; font-size: 14px; line-height: 17px; color: ${
                $isDarkMode ? "white" : "black"
              }">
                ROI
              </div>
              <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end; gap: 4px; flex: 1; width: 100%; text-align: right; font-weight: 500; font-size: 14px; line-height: 17px;">
                <div style="display:flex; justify-content: flex-end; align-items: center; color: ${
                  selectedItem?.pnl >= 0 ? "#05a878" : "#f25f5d"
                };">
                  <span>${selectedItem?.pnl < 0 ? "-" : ""}</span>
                  ${formatValue(Math.abs(selectedItem?.pnl))}
                </div>
                <div style="display:flex; justify-content: flex-end; align-items: center; gap: 4px; color: ${
                  params[0].value >= 0 ? "#05a878" : "#f25f5d"
                };">
                  ${formatPercent(Math.abs(params[0].value))}%
                  <img src=${
                    params[0].value >= 0 ? TrendUp : TrendDown
                  } alt="" style="margin-bottom: 4px;" />
                </div>
              </div>
            </div>
          </div>`;
      },
    },
    toolbox: {
      right: "3%",
      top: "-1%",
      feature: {
        dataZoom: {
          yAxisIndex: "none",
        },
      },
    },
    xAxis: {
      type: "category",
      axisTick: { show: false },
      show: false,
      data: [],
      axisLabel: {
        fontSize: autoFontSize(),
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: "{value}%",
        fontSize: autoFontSize(),
      },
    },
    series: [],
  };

  $: isFetch = isSync ? enabledFetchAllData : true;

  $: queryValidate = createQuery({
    queryKey: ["validate", selectedAddress],
    queryFn: () => handleValidateAddress(selectedAddress),
    retry: false,
    enabled: Boolean(selectedAddress && selectedAddress?.length !== 0),
  });

  $: chainListQueries =
    $typeWallet?.length !== 0 && $typeWallet === "EVM"
      ? chainList.slice(1)?.map((item) => item.value)
      : $typeWallet?.length !== 0 && ["MOVE", "SUI"].includes($typeWallet)
        ? chainMoveList.slice(1)?.map((item) => item.value)
        : $typeWallet?.length !== 0 && ["ECLIPSE", "SOL"].includes($typeWallet)
          ? chainSolList.slice(1)?.map((item) => item.value)
          : [chainSolList[0]?.value];

  $: queryTokenHolding = createQuery({
    queryKey: ["token-holding-each-chain", selectedAddress, $chain],
    queryFn: () =>
      getHoldingToken(selectedAddress, $chain, $queryValidate.data),
    enabled: Boolean(
      selectedAddress?.length !== 0 &&
        isFetch &&
        !$queryValidate.isFetching &&
        $chain.length !== 0 &&
        $chain !== "ALL",
    ),
  });

  $: queryAllTokenHolding = createQueries(
    chainListQueries?.map((item: any) => {
      return {
        queryKey: ["token-holding", selectedAddress, $chain, item],
        queryFn: () =>
          getHoldingToken(selectedAddress, item, $queryValidate.data),
        enabled: Boolean(
          selectedAddress?.length !== 0 &&
            isFetch &&
            !$queryValidate.isFetching &&
            $chain.length !== 0 &&
            $chain === "ALL",
        ),
      };
    }),
  );

  const formatDataMetadata = (dataTokenHolding: any, dataTradingStats: any) => {
    const formatMetaData = dataTradingStats.metadata.map((item: any) => {
      const selectedHolding = dataTokenHolding.find(
        (dataToken: any) =>
          dataToken.contractAddress.toString().toLowerCase() ===
          item.address.toString().toLowerCase(),
      );
      if (selectedHolding) {
        return {
          ...item,
          holding: selectedHolding,
        };
      }
      return item;
    });

    const formatData = formatMetaData
      ?.filter((item: any) => item.holding)
      ?.filter(
        (item: any) =>
          dayjs().subtract(30, "day").valueOf() < item.lastTrade * 1000,
      )
      ?.map((item: any) => {
        return {
          ...item.holding,
          value:
            Number(item?.holding?.amount || 0) *
            Number(item?.holding.price?.price || item?.holding.rate),
          price: Number(item?.holding?.price?.price || 0),
        };
      })
      ?.sort((a: any, b: any) => {
        if (a.value < b.value) {
          return 1;
        }
        if (a.value > b.value) {
          return -1;
        }
        return 0;
      });

    closedHoldingPosition = formatData
      ?.filter((item: any) => item?.profit?.realizedProfit)
      ?.map((item: any) => {
        const realizedProfit = calculateRealizedProfit(
          Number(item?.avgCost),
          Number(item?.profit?.realizedProfit),
        );

        const pnl = item?.pnl
          ? Number(item?.pnl)
          : calculatePnL(
              realizedProfit.profit,
              Number(item?.price || 0),
              Number(item?.amount || 0),
              Number(item?.profit?.totalBought || 0),
              Number(item?.profit?.totalSold || 0),
              Number(item?.profit?.totalGain || 0),
              Number(item?.profit?.cost || 0),
            );

        const unrealizedProfit = calculateUnrealizedProfit(
          realizedProfit.profit,
          Number(item?.avgCost),
          Number(pnl),
        );

        const percentPnL =
          (realizedProfit.percent + unrealizedProfit.percent) * 100;

        return {
          ...item,
          pnl: realizedProfit.profit + unrealizedProfit.profit,
          percentPnL,
        };
      });

    if (closedHoldingPosition && closedHoldingPosition.length !== 0) {
      optionBarValue = {
        ...optionBarValue,
        xAxis: {
          ...optionBarValue.xAxis,
          data: closedHoldingPosition
            .sort((a: any, b: any) => a?.pnl - b?.pnl)
            .map((item: any) => {
              return item?.contractAddress?.toLowerCase();
            }),
        },
        series: [
          {
            type: "bar",
            data: closedHoldingPosition
              .sort((a: any, b: any) => a?.pnl - b?.pnl)
              .map((item: any) => {
                return {
                  value: item.pnl,
                  itemStyle: {
                    color: item.pnl >= 0 ? "#05a878" : "#f25f5d",
                  },
                };
              }),
          },
        ],
      };

      optionBarPercent = {
        ...optionBarPercent,
        xAxis: {
          ...optionBarPercent.xAxis,
          data: closedHoldingPosition
            .sort((a: any, b: any) => a?.percentPnL - b?.percentPnL)
            .map((item: any) => {
              return item?.contractAddress?.toLowerCase();
            }),
        },
        series: [
          {
            type: "bar",
            data: closedHoldingPosition
              .sort((a: any, b: any) => a?.percentPnL - b?.percentPnL)
              .map((item: any) => {
                return {
                  value: item.percentPnL,
                  itemStyle: {
                    color: item.percentPnL >= 0 ? "#05a878" : "#f25f5d",
                  },
                };
              }),
          },
        ],
      };
    }
  };

  $: queryTradingStats = createQuery({
    queryKey: ["trading-stats", selectedAddress],
    queryFn: () => getTradingStats(selectedAddress),
    retry: false,
    enabled: Boolean(selectedAddress?.length !== 0 && isFetch),
  });

  $: {
    if (
      !$queryTradingStats.isError &&
      $queryTradingStats.data &&
      $queryTradingStats.data !== undefined &&
      $queryAllTokenHolding.length !== 0
    ) {
      const allTokens = flatten(
        $queryAllTokenHolding
          ?.filter((item) => Array.isArray(item.data))
          ?.map((item) => item.data),
      );
      if (allTokens && allTokens.length !== 0) {
        formatDataMetadata(allTokens, $queryTradingStats.data);
      }
    }
  }

  $: {
    if (
      !$queryTradingStats.isError &&
      $queryTradingStats.data &&
      $queryTradingStats.data !== undefined &&
      !$queryTokenHolding.isError &&
      $queryTokenHolding.data &&
      $queryTokenHolding?.data !== undefined
    ) {
      formatDataMetadata($queryTokenHolding.data, $queryTradingStats.data);
    }
  }

  $: theme = $isDarkMode ? "dark" : "white";
</script>

<div
  class="col-span-4 xl:border border_0000001a rounded-xl flex flex-col gap-3 xl:p-6 py-3"
>
  <div class="flex justify-start font-medium text-2xl">
    {$t("Positions 30D")}
  </div>

  {#if $queryTradingStats.isFetching}
    <div class="flex items-center justify-center flex-1">
      {#if isNimbusVersion}
        <LoadingPremium />
      {:else}
        <Loading />
      {/if}
    </div>
  {:else}
    <div class="h-full relative">
      {#if $queryTradingStats.isError}
        <div
          class="h-full flex justify-center items-center text-base text-gray-400"
        >
          {$t("Empty")}
        </div>
      {:else}
        <div class="h-full">
          {#if closedHoldingPosition && closedHoldingPosition.length !== 0}
            <div class="flex flex-row">
              <AnimateSharedLayout>
                {#each typeClosedHoldingTokenChart as type}
                  <div
                    class="relative cursor-pointer text-base font-medium py-1 px-3 rounded-[100px] transition-all"
                    on:click={() => (selectedTypeChart = type.value)}
                  >
                    <div
                      class={`relative z-1 ${
                        selectedTypeChart === type.value && "text-white"
                      }`}
                    >
                      {$t(type.label)}
                    </div>
                    {#if type.value === selectedTypeChart}
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

          {#if closedHoldingPosition && closedHoldingPosition.length === 0}
            <div class="h-full flex items-center justify-center text-center">
              {$t(
                "There have been no closed holding positions in the last 30 day",
              )}
            </div>
          {:else}
            <div class="relative pl-4">
              <EChart
                id="closed-holding-token"
                {theme}
                option={selectedTypeChart === "value"
                  ? optionBarValue
                  : optionBarPercent}
                notMerge={true}
                height={465}
              />

              {#if isNimbusVersion}
                <div
                  class="absolute transform -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none top-1/2 left-1/2"
                >
                  <img
                    src={$isDarkMode ? LogoWhite : Logo}
                    alt="logo"
                    loading="lazy"
                    decoding="async"
                    width="140"
                    height="140"
                  />
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
</style>
