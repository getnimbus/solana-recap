<script lang="ts">
  import { useNavigate } from "svelte-navigator";
  import { filterAvgCostType, isNimbusVersion } from "~/utils/constants";
  import { nimbus } from "~/lib/network";
  import { createQuery } from "@tanstack/svelte-query";
  import { wallet, isDarkMode, typeWallet, selectedPackage } from "~/store";
  import { autoFontSize } from "~/utils/index";
  import numeral from "numeral";
  import { TokenDetailAVGCostDistributionSupported } from "./utils";
  import { t } from "~/lib/i18n";

  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import EChart from "~/components/EChart.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Loading from "~/components/Loading.svelte";
  import Select from "~/components/Select.svelte";

  import Logo from "~/assets/logo-1.svg";
  import LogoWhite from "~/assets/logo-white.svg";
  import Button from "~/components/Button.svelte";

  export let data;
  export let id;
  export let avgCost;

  const navigate = useNavigate();

  let filterType = {
    label: "ALL",
    value: "all",
  };

  let optionBar: any = {
    tooltip: {
      trigger: "axis",
      extraCssText: "z-index: 9997",
      formatter: function (params: any) {
        return `
            <div style="display: flex; flex-direction: column; gap: 12px; min-width: 260px;">
              <div style="font-weight: 500; font-size: 16px; line-height: 19px; color: ${
                $isDarkMode ? "white" : "black"
              }">
                $${formatPrice(params[0]?.axisValue)}
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));">
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); display: flex; align-items: centers; gap: 4px; font-weight: 500; color: ${
                  $isDarkMode ? "white" : "black"
                }">
                  <span>${params[0]?.marker}</span>
                  ${$t("Amount")}
                </div>

                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); text-align: right;">
                  <div style="margin-top: 4px; display:flex; justify-content: flex-end; align-items: center; gap: 4px; flex: 1; font-weight: 500; font-size: 14px; line-height: 17px; color: ${
                    $isDarkMode ? "white" : "black"
                  };">
                    ${formatPrice(params[0]?.value[1])}
                  </div>
                </div>
              </div>
              
              ${
                avgCost !== 0
                  ? `
                  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));">
                    <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); display: flex; align-items: centers; gap: 4px; font-weight: 500; color: ${
                      $isDarkMode ? "white" : "black"
                    }">
                      <div style="margin-top: 5px; display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:#eab308;"></div>
                      ${$t("Your Avg Cost")}
                    </div>
                    <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); text-align: right;">
                      <div style="margin-top: 4px; display:flex; justify-content: flex-end; align-items: center; gap: 4px; flex: 1; font-weight: 500; font-size: 14px; line-height: 17px; color: ${
                        $isDarkMode ? "white" : "black"
                      };">
                        $${formatPrice(avgCost)}
                      </div>
                    </div>
                  </div>
                `
                  : ``
              }
              
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));">
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); display: flex; align-items: centers; gap: 4px; font-weight: 500; color: ${
                  $isDarkMode ? "white" : "black"
                }">
                  <div style="margin-top: 5px; display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:#1e96fc;"></div>
                  ${$t("Current Price")}
                </div>
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); text-align: right;">
                  <div style="margin-top: 4px; display:flex; justify-content: flex-end; align-items: center; gap: 4px; flex: 1; font-weight: 500; font-size: 14px; line-height: 17px; color: ${
                    $isDarkMode ? "white" : "black"
                  };">
                    $${formatPrice(data?.market_price)}
                  </div>
                </div>
              </div>
            </div>`;
      },
    },
    grid: {
      left: 70,
      right: 70,
    },
    toolbox: {
      right: "4%",
      feature: {
        dataZoom: {
          yAxisIndex: "none",
        },
      },
    },
    xAxis: {
      type: "value",
      axisTick: { show: false },
      nameGap: 30,
      min: function (value: any) {
        return value.min * 0.95;
      },
      max: function (value: any) {
        return value.max * 1.05;
      },
      axisLabel: {
        formatter: function (value: any, index: any) {
          return "$" + formatPrice(value);
        },
        fontSize: autoFontSize(),
      },
    },
    yAxis: {
      type: "value",
      axisTick: { show: false },
      axisLabel: {
        formatter: function (value: any, index: any) {
          return (
            `${value < 0 ? "-" : ""}` + numeral(Math.abs(value)).format("0.00a")
          );
        },
        fontSize: autoFontSize(),
      },
    },
    series: [],
  };

  const handleGetTradeHistoryAnalysis = async (address: any, filter: any) => {
    const response: any = await nimbus.get(
      `/v2/address/${address}/token/${data?.contractAddress}/trade-analysis?chain=${data?.chain}&type=${filter?.value}`,
    );
    return response?.data;
  };

  $: queryHistoryTokenDetailAnalysis = createQuery({
    queryKey: ["trade-analysis", filterType],
    queryFn: () => handleGetTradeHistoryAnalysis($wallet, filterType),
    retry: false,
    enabled: Boolean(
      $wallet &&
        $wallet?.length !== 0 &&
        TokenDetailAVGCostDistributionSupported.includes($typeWallet),
    ),
  });

  const formatPrice = (value: number) => {
    if (value && value?.toString()?.includes("e-")) {
      const numStr = value?.toString();
      const eIndex = numStr.indexOf("e");
      if (eIndex !== -1) {
        const significand = parseFloat(
          numStr
            .slice(0, 4)
            .split("")
            .filter((e) => e != ".")
            .join(""),
        );

        return `0.0...0${significand}`;
      }
    } else {
      return numeral(Math.abs(value)).format("0.000000a");
    }
  };

  let sumCount = 0;
  let sumCountWinHistoryTokenDetail = 0;
  let sumCountLossHistoryTokenDetail = 0;
  let sumTotalToken = 0;
  let sumWinProfitHistoryTokenDetail = 0;
  let sumLossProfitHistoryTokenDetail = 0;

  $: {
    if (
      !$queryHistoryTokenDetailAnalysis.isError &&
      $queryHistoryTokenDetailAnalysis.data !== undefined &&
      $queryHistoryTokenDetailAnalysis.data.length !== 0
    ) {
      const dataChart = $queryHistoryTokenDetailAnalysis?.data?.map(
        (item: any) => {
          return [item?.price, item?.totalToken];
        },
      );

      if (avgCost !== 0) {
        optionBar = {
          ...optionBar,
          series: [
            {
              tooltip: {
                show: true,
              },
              type: "bar",
              itemStyle: {
                color: "#27326F",
                borderColor: "#27326F",
              },
              data: dataChart,
              markLine: {
                precision: 10,
                symbol: ["none", "none"],
                data: [
                  {
                    name: "Current Price",
                    label: "Current Price",
                    xAxis:
                      data?.market_price || data?.price?.price || data?.rate,
                    lineStyle: {
                      color: "#1e96fc",
                      type: "solid",
                      width: 2,
                    },
                  },
                  {
                    name: "Avg Cost",
                    label: "Avg Cost",
                    xAxis: avgCost || 0,
                    lineStyle: {
                      color: "#eab308",
                      type: "dashed",
                      width: 2,
                    },
                  },
                ],
                label: {
                  show: false,
                },
              },
            },
          ],
        };
      } else {
        optionBar = {
          ...optionBar,
          series: [
            {
              tooltip: {
                show: true,
              },
              type: "bar",
              itemStyle: {
                color: "#27326F",
                borderColor: "#27326F",
              },
              data: dataChart,
              markLine: {
                precision: 10,
                symbol: ["none"],
                data: [
                  {
                    name: "Current Price",
                    label: "Current Price",
                    xAxis: data?.market_price || 0,
                    lineStyle: {
                      color: "#1e96fc",
                      type: "solid",
                      width: 2,
                    },
                  },
                ],
                label: {
                  show: false,
                },
              },
            },
          ],
        };
      }

      sumCount = $queryHistoryTokenDetailAnalysis?.data.reduce(
        (prev: any, item: any) => prev + Number(item.count),
        0,
      );

      sumTotalToken = $queryHistoryTokenDetailAnalysis?.data.reduce(
        (prev: any, item: any) => prev + Number(item.totalToken),
        0,
      );

      // logic win
      const winHistoryTokenDetail =
        $queryHistoryTokenDetailAnalysis?.data.filter(
          (item: any) => Number(item.price) <= Number(data?.market_price),
        );

      const formatWinHistoryTokenDetail = winHistoryTokenDetail?.map((item) => {
        return {
          ...item,
          valueProfit:
            Number(data?.market_price) * Number(item.totalToken) -
            Number(item.price) * Number(item.totalToken),
        };
      });

      sumWinProfitHistoryTokenDetail = formatWinHistoryTokenDetail.reduce(
        (prev: any, item: any) => prev + Number(item.valueProfit),
        0,
      );

      sumCountWinHistoryTokenDetail = winHistoryTokenDetail.reduce(
        (prev: any, item: any) => prev + Number(item.count),
        0,
      );

      // logic lose
      const lossHistoryTokenDetail =
        $queryHistoryTokenDetailAnalysis.data.filter(
          (item: any) => Number(item.price) > Number(data?.market_price),
        );

      const formatLossHistoryTokenDetail = lossHistoryTokenDetail?.map(
        (item: any) => {
          return {
            ...item,
            valueProfit:
              Number(data?.market_price) * Number(item.totalToken) -
              Number(item.price) * Number(item.totalToken),
          };
        },
      );

      sumLossProfitHistoryTokenDetail = formatLossHistoryTokenDetail.reduce(
        (prev: any, item: any) => prev + Number(item.valueProfit),
        0,
      );

      sumCountLossHistoryTokenDetail = lossHistoryTokenDetail.reduce(
        (prev: any, item: any) => prev + Number(item.count),
        0,
      );
    } else {
      optionBar = {
        ...optionBar,
        series: [
          {
            tooltip: {
              show: true,
            },
            type: "bar",
            itemStyle: {
              color: "#27326F",
              borderColor: "#27326F",
            },
            data: [],
            markLine: {
              precision: 10,
              symbol: ["none", "none"],
              data: [
                {
                  name: "Current Price",
                  label: "Current Price",
                  xAxis: 0,
                  lineStyle: {
                    color: "#1e96fc",
                    type: "solid",
                    width: 2,
                  },
                },
                {
                  name: "Avg Cost",
                  label: "Avg Cost",
                  xAxis: 0,
                  lineStyle: {
                    color: "#eab308",
                    type: "dashed",
                    width: 2,
                  },
                },
              ],
              label: {
                show: false,
              },
            },
          },
        ],
      };
    }
  }

  $: theme = $isDarkMode ? "dark" : "white";
</script>

<div
  class={`rounded-[20px] flex flex-col gap-4 relative py-4 lg:px-3 ${
    $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff] xl:border border_0000001a"
  }`}
>
  <div class="flex justify-between items-center">
    <div class="text-2xl font-medium">{$t("Avg Cost distribution")}</div>
    <Select
      type="lang"
      positionSelectList="right-0"
      listSelect={filterAvgCostType}
      bind:selected={filterType}
      isDisabledSelectWallet={false}
      indexWalletDisabled={-1}
    />
  </div>

  <div class="flex flex-col pb-10">
    {#if $queryHistoryTokenDetailAnalysis.isFetching}
      <div class="flex items-center justify-center h-[475px]">
        {#if isNimbusVersion}
          <LoadingPremium />
        {:else}
          <Loading />
        {/if}
      </div>
    {:else}
      <div class="h-full">
        {#if $queryHistoryTokenDetailAnalysis.isError || ($queryHistoryTokenDetailAnalysis.data !== undefined && $queryHistoryTokenDetailAnalysis.data.length === 0)}
          <div
            class="flex justify-center items-center h-[475px] text-base text-gray-400"
          >
            {$t("Empty")}
          </div>
        {:else}
          <div class="relative">
            <EChart
              id={id + "bar-chart"}
              {theme}
              notMerge={true}
              option={optionBar}
              height={485}
            />

            {#if isNimbusVersion}
              <div
                class="opacity-40 absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2"
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

    <div class="flex flex-col gap-14">
      <div class="flex flex-col gap-2">
        <div class="text-lg">{$t("Win / Lose addresses")}</div>
        <div
          class="h-2 rounded-lg relative"
          style={`background: ${
            sumCountWinHistoryTokenDetail === 0
              ? "#00000066"
              : `linear-gradient(to right, #25b770 ${(
                  (sumCountWinHistoryTokenDetail / sumCount) *
                  100
                ).toFixed(2)}%, #e14040 ${(
                  (sumCountWinHistoryTokenDetail / sumCount) *
                  100
                ).toFixed(2)}%)`
          }`}
        >
          <div class="absolute top-5 left-0 text-sm">
            <TooltipNumber
              number={(sumCountWinHistoryTokenDetail / sumCount) * 100}
              type="percent"
            />% {$t("Win")}
          </div>
          <div class="absolute top-5 right-0 text-sm">
            <TooltipNumber
              number={(sumCountLossHistoryTokenDetail / sumCount) * 100}
              type="percent"
            />% {$t("Lose")}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="text-lg">{$t("Profit / Loss")}</div>
        <div
          class="h-2 rounded-lg relative"
          style={`background: ${
            sumWinProfitHistoryTokenDetail === 0
              ? "#00000066"
              : `linear-gradient(to right, #25b770 ${Math.abs(
                  (sumWinProfitHistoryTokenDetail /
                    (Math.abs(sumLossProfitHistoryTokenDetail) +
                      Math.abs(sumWinProfitHistoryTokenDetail))) *
                    100,
                ).toFixed(2)}%, #e14040 ${Math.abs(
                  (sumWinProfitHistoryTokenDetail /
                    (Math.abs(sumLossProfitHistoryTokenDetail) +
                      Math.abs(sumWinProfitHistoryTokenDetail))) *
                    100,
                )?.toFixed(2)}%)`
          }`}
        >
          <div class="flex gap-1 absolute top-5 left-0 text-sm w-max">
            {$t("Profit")}
            <TooltipNumber
              number={Math.abs(sumWinProfitHistoryTokenDetail)}
              type="value"
            />
          </div>
          <div class="flex gap-1 absolute top-5 right-0 text-sm">
            {$t("Loss")}
            <TooltipNumber
              number={Math.abs(sumLossProfitHistoryTokenDetail)}
              type="value"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if isNimbusVersion}
    {#if $selectedPackage === "FREE"}
      <div
        class={`absolute top-0 left-0 xl:rounded-[20px] w-full h-full flex flex-col items-center justify-center gap-3 z-7 backdrop-blur-md ${
          $isDarkMode ? "bg-black/90" : "bg-white/95"
        }`}
      >
        <div class="flex flex-col items-center gap-1">
          {#if isNimbusVersion}
            <div class="text-lg font-medium">
              {$t("Use Nimbus")}
            </div>
          {/if}
          <div class="text-base text-gray-500">
            {$t("Upgrade to Premium to access feature")}
          </div>
        </div>
        <div class="mt-2 w-max">
          <Button variant="premium" on:click={() => navigate("/upgrade")}>
            {$t("Upgrade Plan")}
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
</style>
