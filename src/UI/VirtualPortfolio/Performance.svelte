<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import { autoFontSize, formatPercent } from "~/utils";
  import { isDarkMode } from "~/store";
  import { t } from "~/lib/i18n";
  import dayjs from "dayjs";

  import EChart from "~/components/EChart.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Loading from "~/components/Loading.svelte";

  import TrendDown from "~/assets/trend-down.svg";
  import TrendUp from "~/assets/trend-up.svg";

  export let selectedVirtual;
  export let isLoading;
  export let dataVirtualPortfolioPerformance;

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

  let portfolioPercentChange = 0;
  let tooltipDateValue: any;

  $: {
    if (tooltipDateValue) {
      const formatDataPortfolio =
        dataVirtualPortfolioPerformance?.portfolio?.map((item: any) => {
          const time = dayjs(item.time).unix();
          return {
            value: item.performance,
            time: dayjs(time * 1000).format("YYYY-MM-DD"),
          };
        });

      const selectedDataPerformance = formatDataPortfolio.find(
        (item: any) => item.time === tooltipDateValue,
      );

      if (selectedDataPerformance) {
        portfolioPercentChange = selectedDataPerformance?.value;
      }
    }
  }

  $: {
    if (
      dataVirtualPortfolioPerformance &&
      Object.keys(dataVirtualPortfolioPerformance).length === 0
    ) {
      optionLine = {
        title: {
          text: "",
        },
        tooltip: {
          trigger: "axis",
          extraCssText: "z-index: 9997",
          formatter: function (params) {
            return `
            <div style="display: flex; flex-direction: column; gap: 12px; min-width: 220px;">
              <div style="font-weight: 500; font-size: 16px; line-height: 19px; color: ${
                $isDarkMode ? "white" : "black"
              }">
                ${params[0].axisValue}
              </div>
              ${params
                .map((item) => {
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
    } else {
      portfolioPercentChange =
        dataVirtualPortfolioPerformance?.portfolio[
          dataVirtualPortfolioPerformance?.portfolio?.length - 1
        ]?.performance;

      const formatXAxisPerformance =
        dataVirtualPortfolioPerformance?.portfolio?.map((item: any) => {
          const time = dayjs(item.time).unix();
          return dayjs(time * 1000).format("YYYY-MM-DD");
        });

      const formatDataPortfolio =
        dataVirtualPortfolioPerformance?.portfolio?.map((item: any) => {
          return {
            value: item.performance,
            itemStyle: {
              color: "#00b580",
            },
          };
        });

      const formatDataETH = dataVirtualPortfolioPerformance?.eth?.map(
        (item: any) => {
          return {
            value: item.performance,
            itemStyle: {
              color: "#547fef",
            },
          };
        },
      );

      const formatDataBTC = dataVirtualPortfolioPerformance?.btc?.map(
        (item: any) => {
          return {
            value: item.performance,
            itemStyle: {
              color: "#f7931a",
            },
          };
        },
      );

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
              name: "Your Paper Trade",
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
          data: formatXAxisPerformance,
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
            name: "Your Paper Trade",
            type: "line",
            lineStyle: {
              type: "solid",
              color: "#00b580",
            },
            showSymbol: false,
            data: formatDataPortfolio,
          },
          {
            name: "Bitcoin",
            type: "line",
            lineStyle: {
              type: "dashed",
              color: "#f7931a",
            },
            showSymbol: false,
            data: formatDataBTC,
          },
          {
            name: "Ethereum",
            type: "line",
            lineStyle: {
              type: "dashed",
              color: "#547fef",
            },
            showSymbol: false,
            data: formatDataETH,
          },
        ],
      };
    }
  }

  $: networth =
    selectedVirtual?.initial_networth * (portfolioPercentChange / 100) +
    selectedVirtual?.initial_networth;

  $: theme = $isDarkMode ? "dark" : "white";
</script>

<div
  class={`rounded-[20px] xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
    $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
  }`}
>
  <div class="font-medium text-2xl mb-6">{$t("Performance")}</div>

  {#if isLoading}
    <div class="flex items-center justify-center h-[465px]">
      {#if isNimbusVersion}
        <LoadingPremium />
      {:else}
        <Loading />
      {/if}
    </div>
  {:else}
    <div class="h-full relative">
      {#if dataVirtualPortfolioPerformance && Object.keys(dataVirtualPortfolioPerformance).length === 0}
        <div
          class="flex justify-center items-center h-[465px] text-base text-gray-400"
        >
          {$t("Empty")}
        </div>
      {:else}
        <div
          class={`absolute xl:block hidden md:top-8 top-16 md:left-20 left-24 flex flex-col rounded-[4px] w-max px-2 py-1 z-2 ${
            $isDarkMode ? "bg-[#131313]" : "bg-white"
          }`}
          style="box-shadow: rgba(0, 0, 0, 0.2) 1px 2px 10px;"
        >
          <div class="text-lg font-medium flex items-center">
            {networth < 0 ? "-" : ""}$<TooltipNumber
              number={Math.abs(networth)}
              type="balance"
            />
          </div>
          <div
            class={`text-sm flex gap-1 ${
              portfolioPercentChange >= 0 ? "text-[#00A878]" : "text-red-500"
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
          </div>
        </div>
        <EChart
          id="line-chart"
          {theme}
          notMerge={true}
          option={optionLine}
          height={465}
        />
      {/if}
    </div>
  {/if}
</div>

<style windi:preflights:global windi:safelist:global></style>
