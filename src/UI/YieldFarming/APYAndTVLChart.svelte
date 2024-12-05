<script lang="ts">
  import { t } from "~/lib/i18n";
  import { timeFrame, isNimbusVersion } from "~/utils/constants";
  import { autoFontSize, formatPercent, formatValue } from "~/utils";
  import { isDarkMode } from "~/store";
  import dayjs from "dayjs";
  import { AnimateSharedLayout, Motion } from "svelte-motion";

  import EChart from "~/components/EChart.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";

  export let dataAPYAndTVLChart;
  export let isLoading;

  let selectedTimeFrame: "7D" | "30D" | "3M" | "1Y" | "ALL" = "30D";
  let timeRange: any = 30;

  let option = {
    tooltip: {
      trigger: "axis",
      extraCssText: "z-index: 9997",
      formatter: function (params: any) {
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
                            <div style="display:flex; justify-content: flex-end; align-items: center; gap: 4px; flex: 1; font-weight: 500; font-size: 14px; line-height: 17px;">
                             ${
                               item.seriesName === "TVL"
                                 ? formatValue(item.value)
                                 : formatPercent(item.value) + "%"
                             }
                            </div>
                          </div>
                        </div>
                        `;
                        })
                        .join("")}
                    </div>`;
      },
    },
    toolbox: {},
    legend: {
      data: [
        {
          name: "TVL",
          itemStyle: {
            color: "#547fef",
          },
        },
        {
          name: "APY",
          itemStyle: {
            color: "#f7931a",
          },
        },
      ],
    },
    grid: {
      left: "1%",
      right: "3%",
      bottom: "0%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        data: [],
        axisPointer: {
          type: "shadow",
        },
      },
    ],
    yAxis: [
      {
        type: "value",
        name: "TVL",
        axisLabel: {
          formatter: "${value}",
        },
      },
      {
        type: "value",
        name: "APY",
        axisLabel: {
          formatter: "{value}%",
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: "TVL",
        type: "bar",
        data: [],
      },
      {
        name: "APY",
        type: "line",
        yAxisIndex: 1,
        showSymbol: false,
        data: [],
      },
    ],
  };

  $: {
    switch (selectedTimeFrame) {
      case "ALL":
        timeRange = "ALL";
        break;
      case "7D":
        timeRange = 7;
        break;
      case "30D":
        timeRange = 30;
        break;
      case "3M":
        timeRange = 90;
        break;
      case "1Y":
        timeRange = 365;
        break;
      default:
        timeRange = 30;
    }
  }

  $: {
    if (dataAPYAndTVLChart && dataAPYAndTVLChart?.length !== 0) {
      option = {
        ...option,
        xAxis: [
          {
            ...option.xAxis[0],
            data: dataAPYAndTVLChart.map((item: any) => {
              const time = dayjs(item.dateKey).unix();
              return dayjs(time * 1000).format("YYYY-MM-DD");
            }),
          },
        ],
        series: [
          {
            ...option.series[0],
            data: dataAPYAndTVLChart.map((item: any) => {
              return {
                value: item.tvl,
                itemStyle: {
                  color: "#547fef",
                },
              };
            }),
            lineStyle: {
              type: "solid",
              color: "#547fef",
            },
          },
          {
            ...option.series[1],
            data: dataAPYAndTVLChart.map((item: any) => {
              return {
                value: item.apy * 100,
                itemStyle: {
                  color: "#f7931a",
                },
              };
            }),
            lineStyle: {
              type: "solid",
              color: "#f7931a",
            },
          },
        ],
      };
    }
  }

  $: theme = $isDarkMode ? "dark" : "white";
</script>

<div
  class={`rounded-[20px] xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
    $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
  }`}
>
  <div class="flex md:flex-row flex-col gap-4 justify-between">
    <div class="font-medium text-2xl">
      {$t("APY and TVL Chart")}
    </div>
    <!-- <div class="flex justify-between w-max">
      <AnimateSharedLayout>
        {#each timeFrame as type}
          <div
            class="relative cursor-pointer text-base font-medium py-1 px-3 rounded-[100px] transition-all"
            on:click={() => {
              selectedTimeFrame = type.value;
            }}
          >
            <div
              class={`relative z-1 ${
                type.value === selectedTimeFrame && "text-white"
              }`}
            >
              {type.label}
            </div>
            {#if type.value === selectedTimeFrame}
              <Motion
                let:motion
                layoutId="active-pill"
                transition={{ type: "spring", duration: 0.6 }}
              >
                <div
                  class="absolute inset-0 rounded-full z-0 bg-[#1E96FC]"
                  use:motion
                />
              </Motion>
            {/if}
          </div>
        {/each}
      </AnimateSharedLayout>
    </div> -->
  </div>

  <br />

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
      {#if dataAPYAndTVLChart?.length === 0}
        <div
          class="flex justify-center items-center h-[465px] text-base text-gray-400"
        >
          {$t("Empty")}
        </div>
      {:else}
        <EChart
          id="chart-apy-tvl"
          {theme}
          notMerge={true}
          {option}
          height={465}
        />
      {/if}
    </div>
  {/if}
</div>

<style windi:preflights:global windi:safelist:global></style>
