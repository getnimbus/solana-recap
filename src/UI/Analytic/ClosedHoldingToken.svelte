<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import {
    isDarkMode,
    typeWallet,
    wallet,
    chain,
    selectedPackage,
  } from "~/store";
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
  import { listSupported } from "~/lib/chains";
  import { handleValidateAddress, getHoldingToken } from "~/lib/queryAPI";
  import { t } from "~/lib/i18n";

  import AnalyticSection from "~/components/AnalyticSection.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import EChart from "~/components/EChart.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Loading from "~/components/Loading.svelte";

  import Logo from "~/assets/logo-1.svg";
  import LogoWhite from "~/assets/logo-white.svg";
  import TrendDown from "~/assets/trend-down.svg";
  import TrendUp from "~/assets/trend-up.svg";
  import defaultToken from "~/assets/defaultToken.png";

  export let address;
  export let isShowSoon;
  export let isSync = false;
  export let enabledFetchAllData = false;

  $: isFetch = isSync ? enabledFetchAllData : true;

  let closedHoldingPosition: any = [];
  let selectedTypeChart: "value" | "percent" = "value";
  let optionBarValue: any = {
    tooltip: {
      trigger: "axis",
      extraCssText: "z-index: 9997",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
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
                      selectedItem?.percentRealizedProfit >= 0
                        ? "#05a878"
                        : "#f25f5d"
                    };">
                      ${formatPercent(
                        Math.abs(selectedItem?.percentRealizedProfit),
                      )}%
                      <img src=${
                        selectedItem?.percentRealizedProfit >= 0
                          ? TrendUp
                          : TrendDown
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
        formatter: function (value, index) {
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
                      selectedItem?.realizedProfit >= 0 ? "#05a878" : "#f25f5d"
                    };">
                      <span>${
                        selectedItem?.realizedProfit < 0 ? "-" : ""
                      }</span>
                      ${formatValue(Math.abs(selectedItem?.realizedProfit))}  
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
  let biggestWin = {};
  let worseLose = {};
  let sumRealizedProfit = 0;

  $: queryValidate = createQuery({
    queryKey: ["validate", $wallet],
    queryFn: () => handleValidateAddress($wallet),
    retry: false,
    enabled: Boolean($wallet && $wallet?.length !== 0),
  });

  const formatDataHoldingToken = (dataTokenHolding: any) => {
    const formatData = dataTokenHolding
      ?.map((item: any) => {
        return {
          ...item,
          value: Number(item?.amount || 0) * Number(item?.price?.price),
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
      ?.filter((item: any) => Number(item?.amount) === 0)
      ?.map((item: any) => {
        return {
          ...item,
          realizedProfit: item?.profit?.realizedProfit,
          percentRealizedProfit:
            (item?.avgCost || 0) === 0
              ? 0
              : (Number(item?.profit?.realizedProfit) /
                  Number(Math.abs(item?.avgCost))) *
                100,
        };
      });

    if (closedHoldingPosition && closedHoldingPosition.length !== 0) {
      sumRealizedProfit = (closedHoldingPosition || [])?.reduce(
        (prev: any, item: any) => prev + Number(item.realizedProfit),
        0,
      );

      biggestWin = (closedHoldingPosition || [])?.reduce(
        (maxObject: any, currentObject: any) => {
          if (currentObject.realizedProfit > maxObject.realizedProfit) {
            return currentObject;
          } else {
            return maxObject;
          }
        },
      );

      worseLose = (closedHoldingPosition || [])?.reduce(
        (maxObject: any, currentObject: any) => {
          if (currentObject.realizedProfit < maxObject.realizedProfit) {
            return currentObject;
          } else {
            return maxObject;
          }
        },
      );

      optionBarValue = {
        ...optionBarValue,
        xAxis: {
          ...optionBarValue.xAxis,
          data: closedHoldingPosition
            ?.sort((a: any, b: any) => a?.realizedProfit - b?.realizedProfit)
            ?.map((item: any) => {
              return item?.contractAddress?.toLowerCase();
            }),
        },
        series: [
          {
            type: "bar",
            label: {
              show: Boolean(closedHoldingPosition.length < 12),
              position: "top",
              formatter: function (value: any, index: any) {
                const selectedItem = closedHoldingPosition.find(
                  (item: any) =>
                    item?.contractAddress?.toLowerCase() ===
                    value?.name?.toLowerCase(),
                );
                return selectedItem?.symbol;
              },
              fontSize: autoFontSize(),
            },
            data: closedHoldingPosition
              ?.sort((a: any, b: any) => a?.realizedProfit - b?.realizedProfit)
              ?.map((item: any) => {
                return {
                  value: item.realizedProfit,
                  itemStyle: {
                    color: item.realizedProfit >= 0 ? "#05a878" : "#f25f5d",
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
            ?.sort(
              (a: any, b: any) =>
                a?.percentRealizedProfit - b?.percentRealizedProfit,
            )
            ?.map((item: any) => {
              return item?.contractAddress?.toLowerCase();
            }),
        },
        series: [
          {
            type: "bar",
            label: {
              show: Boolean(closedHoldingPosition.length < 12),
              position: "top",
              formatter: function (value: any, index: any) {
                const selectedItem = closedHoldingPosition.find(
                  (item: any) =>
                    item?.contractAddress?.toLowerCase() ===
                    value?.name?.toLowerCase(),
                );
                return selectedItem?.symbol;
              },
              fontSize: autoFontSize(),
            },
            data: closedHoldingPosition
              ?.sort(
                (a: any, b: any) =>
                  a?.percentRealizedProfit - b?.percentRealizedProfit,
              )
              ?.map((item: any) => {
                return {
                  value: item.percentRealizedProfit,
                  itemStyle: {
                    color:
                      item.percentRealizedProfit >= 0 ? "#05a878" : "#f25f5d",
                  },
                };
              }),
          },
        ],
      };
    }
  };

  $: queryTokenHolding = createQuery({
    queryKey: ["token-holding", $wallet, $chain],
    queryFn: () => getHoldingToken($wallet, $chain, $queryValidate.data),
    placeholderData: [],
    enabled: Boolean(enabledQuery && isFetch && !$queryValidate.isFetching),
  });

  $: {
    if (!$queryTokenHolding.isError && $queryTokenHolding.data) {
      formatDataHoldingToken($queryTokenHolding.data);
    }
  }

  $: enabledQuery = Boolean(
    listSupported.includes($typeWallet) &&
      $wallet &&
      $wallet?.length !== 0 &&
      $selectedPackage !== "FREE",
  );

  $: theme = $isDarkMode ? "dark" : "white";
</script>

<AnalyticSection {address} {isShowSoon}>
  <span slot="title">
    <div class="flex justify-start font-medium text-2xl">Closed Positions</div>
  </span>

  <span slot="overview">
    <div class="relative">
      {#if !$queryTokenHolding.isFetching && !$queryTokenHolding.isError}
        <div class="mb-4 font-medium text-xl">Overview</div>
      {/if}
      {#if $queryTokenHolding.isFetching}
        <div class="flex items-center justify-center h-[465px]">
          {#if isNimbusVersion}
            <LoadingPremium />
          {:else}
            <Loading />
          {/if}
        </div>
      {:else}
        <div class="h-full relative xl:min-h-[465px]">
          {#if $queryTokenHolding.isError}
            <div
              class={`rounded-[20px] absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center gap-3 z-7 backdrop-blur-md text-base text-gray-400 ${
                $isDarkMode ? "bg-black/90" : "bg-white/95"
              }`}
            >
              {$t("Empty")}
            </div>
          {:else}
            <div class="flex flex-col gap-4 pb-6">
              <div class="grid grid-cols-2">
                <div class="col-span-1">
                  <div class="flex justify-start text-base">
                    Total realized profit
                  </div>
                </div>
                <div
                  class={`flex items-center justify-end text-base col-span-1 ${
                    sumRealizedProfit >= 0 ? "" : "text-[#f25f5d]"
                  }`}
                >
                  <TooltipNumber
                    number={Math.abs(sumRealizedProfit)}
                    type="value"
                  />
                </div>
              </div>

              <div class="flex items-center gap-3">
                {#if worseLose && Object.keys(worseLose).length !== 0}
                  <div class="rounded-[20px] flex-1 bg_fafafbff px-4 pb-3 pt-5">
                    <div class="text-base text-[#6E7787FF] relative">
                      <div
                        class="border border-red-500 absolute -top-1 left-0 w-[40px]"
                      />
                      Worse lose
                    </div>
                    <div class="text-2xl">{worseLose?.symbol}</div>
                    <div class="text-lg text-[#f25f5d]">
                      <TooltipNumber
                        number={Math.abs(worseLose?.realizedProfit)}
                        type="value"
                      />
                    </div>
                  </div>
                {/if}

                {#if biggestWin && Object.keys(biggestWin).length !== 0}
                  <div class="rounded-[20px] flex-1 bg_fafafbff px-4 pb-3 pt-5">
                    <div class="text-base text-[#6E7787FF] relative">
                      <div
                        class="border border-[#00A878] absolute -top-1 left-0 w-[40px]"
                      />
                      Biggest win
                    </div>
                    <div class="text-2xl">{biggestWin?.symbol}</div>
                    <div class="text-lg text-[#05a878]">
                      <TooltipNumber
                        number={Math.abs(biggestWin?.realizedProfit)}
                        type="value"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </span>

  <span slot="chart">
    <div class="relative">
      {#if $queryTokenHolding.isFetching}
        <div class="flex items-center justify-center h-[465px]">
          {#if isNimbusVersion}
            <LoadingPremium />
          {:else}
            <Loading />
          {/if}
        </div>
      {:else}
        <div class="h-full relative">
          {#if $queryTokenHolding.isError}
            <div
              class={`rounded-[20px] absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center gap-3 z-7 backdrop-blur-md text-base text-gray-400 ${
                $isDarkMode ? "bg-black/90" : "bg-white/95"
              }`}
            >
              {$t("Empty")}
            </div>
          {:else}
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
                      {type.label}
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
            {#if closedHoldingPosition && closedHoldingPosition.length === 0}
              <div
                class="flex justify-center items-center h-[465px] text-lg text-gray-400"
              >
                Empty
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
          {/if}
        </div>
      {/if}
    </div>
  </span>
</AnalyticSection>

<style>
</style>
