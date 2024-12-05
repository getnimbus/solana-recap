<script lang="ts">
  import { isDarkMode } from "~/store";
  import { nimbus } from "~/lib/network";
  import { autoFontSize, formatValue } from "~/utils";
  import dayjs from "dayjs";
  import { isNimbusVersion } from "~/utils/constants";
  import { t } from "~/lib/i18n";

  import EChart from "~/components/EChart.svelte";
  import Button from "~/components/Button.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";

  import TrendDown from "~/assets/trend-down.svg";
  import TrendUp from "~/assets/trend-up.svg";

  export let selectedProtocol;
  export let selectedChain;

  let amount = 100;

  let tokenPrice = {
    priceChangeA: 5,
    priceChangeB: 5,
  };

  let tokenWeight = {
    weightA: 50,
    weightB: 50,
  };

  let isLoading = false;

  let data = {
    chartData: [],
    il: 0,
    ilAmount: 0,
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
                      $isDarkMode ? "white" : "black"
                    };">
                      ${formatValue(Math.abs(item.value))}
                    </div>
                  </div>
                </div>
                `;
                })
                .join("")}
            </div>
            `;
      },
    },
    legend: {
      lineStyle: {
        type: "solid",
      },
      data: [],
    },
    grid: {
      left: "0%",
      right: "3%",
      bottom: "0%",
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

  $: pairs = selectedProtocol?.name?.split("-");

  const handleSimulator = async () => {
    try {
      isLoading = true;
      let payload = {};

      if (selectedChain === "SUI") {
        payload = {
          type: "Lending",
          data: {
            value: Number(amount),
            priceChange: Number(tokenPrice.priceChangeA),
          },
        };
      } else {
        payload = {
          type: "Pools",
          data: {
            value: Number(amount),
            priceChangeA: Number(tokenPrice.priceChangeA),
            priceChangeB: Number(tokenPrice.priceChangeB),
            weightA: Number(tokenWeight.weightA),
            weightB: Number(tokenWeight.weightB),
          },
        };
      }

      const response = await nimbus
        .post(
          `/v2/farming/${selectedProtocol.id}/simulate?chain=${selectedChain}`,
          payload,
        )
        .then((res) => res?.data);

      if (
        response &&
        Object.keys(response).length !== 0 &&
        response.data &&
        response.data.length !== 0
      ) {
        data = {
          chartData: response.data,
          il: response.il,
          ilAmount: response.ilAmount,
        };
      }
    } catch (e) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  };

  $: {
    if (data.chartData.length !== 0) {
      const formatXAxisPerformance = data.chartData?.map((item: any) => {
        return dayjs(item.date).format("YYYY-MM-DD");
      });

      const formatDataPortfolio = data.chartData?.map((item: any) => {
        return {
          value: item.value,
          itemStyle: {
            color: "#00b580",
          },
        };
      });

      optionLine = {
        ...optionLine,
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
                    <div style="display:flex; justify-content: flex-end; align-items: center; gap: 4px; flex: 1; font-weight: 500; font-size: 14px; line-height: 17px; color: ${
                      item.value >= 0 ? "#05a878" : "#f25f5d"
                    };">
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
            formatter: "${value}",
            fontSize: autoFontSize(),
          },
        },
        series: [
          {
            name: "Networth",
            type: "line",
            lineStyle: {
              type: "solid",
              color: "#00b580",
            },
            showSymbol: false,
            data: formatDataPortfolio,
          },
        ],
      };
    } else {
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

  $: theme = $isDarkMode ? "dark" : "white";
</script>

<div class="flex flex-col gap-2">
  <div class="text-2xl font-medium">
    {$t("Simulator")}
  </div>

  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <div class="text-base">
        {$t("Initial Investment")}
      </div>
      <div
        class={`flex items-center gap-1 border py-[6px] px-3 rounded-lg ${Number(amount) < 0 ? "border-red-500" : "border_0000000d"}`}
      >
        <div class="text-sm font-normal">$</div>
        <div class="flex-1">
          <input
            type="text"
            placeholder="0"
            autocomplete="off"
            inputmode="decimal"
            class="text-sm font-normal p-0 border-none focus:outline-none focus:ring-0 flex-1 bg-transparent w-full h-full"
            value={amount}
            on:change={(event) => {
              amount = Number(event?.target?.value);
            }}
          />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <div class="text-base">
        {$t("Assets")}
      </div>
      <div
        class={`grid gap-4 ${selectedProtocol.chain === "SUI" ? "grid-cols-1" : "grid-cols-2"}`}
      >
        <div
          class="border border_0000000d py-2 px-3 rounded-[10px] flex flex-col gap-3"
        >
          <div class="text-base">{pairs[0]}</div>

          <div class="flex flex-col gap-1">
            <div class="text-gray-500 text-sm">
              {$t("Price Change")} (%)
            </div>
            <div
              class={`flex items-center gap-1 border border_0000000d py-[6px] px-3 rounded-lg ${$isDarkMode ? "bg-black/50" : "bg-gray-100/50"}`}
            >
              <div class="flex-1">
                <input
                  type="text"
                  placeholder="0"
                  autocomplete="off"
                  inputmode="decimal"
                  class="text-sm font-normal p-0 border-none focus:outline-none focus:ring-0 flex-1 bg-transparent w-full h-full"
                  value={tokenPrice.priceChangeA}
                  on:change={(event) => {
                    tokenPrice = {
                      priceChangeA: event?.target?.value,
                      priceChangeB: tokenPrice.priceChangeB,
                    };
                  }}
                />
              </div>
              <div class="text-sm font-normal">%</div>
            </div>
          </div>

          {#if selectedProtocol.chain !== "SUI"}
            <div class="flex flex-col gap-1">
              <div class="text-gray-500 text-sm">{$t("Weightage")} (%)</div>
              <div
                class={`flex items-center gap-1 border border_0000000d py-[6px] px-3 rounded-lg ${$isDarkMode ? "bg-black/50" : "bg-gray-100/50"} ${tokenWeight.weightA < 0 ? "border-red-500" : "border_0000000d"}`}
              >
                <div class="flex-1">
                  <input
                    type="text"
                    placeholder="0"
                    autocomplete="off"
                    inputmode="decimal"
                    class="text-sm font-normal p-0 border-none focus:outline-none focus:ring-0 flex-1 bg-transparent w-full h-full"
                    value={tokenWeight.weightA}
                    on:change={(event) => {
                      tokenWeight = {
                        weightA: Number(event?.target?.value),
                        weightB: 100 - Number(event?.target?.value),
                      };
                    }}
                  />
                </div>
                <div class="text-sm font-normal">%</div>
              </div>
            </div>
          {/if}
        </div>

        {#if selectedProtocol.chain !== "SUI"}
          <div
            class="border border_0000000d py-2 px-3 rounded-[10px] flex flex-col gap-3"
          >
            <div class="text-base">{pairs[1]}</div>

            <div class="flex flex-col gap-1">
              <div class="text-gray-500 text-sm">{$t("Price Change")} (%)</div>
              <div
                class={`flex items-center gap-1 border border_0000000d py-[6px] px-3 rounded-lg ${$isDarkMode ? "bg-black/50" : "bg-gray-100/50"}`}
              >
                <div class="flex-1">
                  <input
                    type="text"
                    placeholder="0"
                    autocomplete="off"
                    inputmode="decimal"
                    class="text-sm font-normal p-0 border-none focus:outline-none focus:ring-0 flex-1 bg-transparent w-full h-full"
                    value={tokenPrice.priceChangeB}
                    on:change={(event) => {
                      tokenPrice = {
                        priceChangeA: tokenPrice.priceChangeA,
                        priceChangeB: event?.target?.value,
                      };
                    }}
                  />
                </div>
                <div class="text-sm font-normal">%</div>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <div class="text-gray-500 text-sm">{$t("Weightage")} (%)</div>
              <div
                class={`flex items-center gap-1 border py-[6px] px-3 rounded-lg ${$isDarkMode ? "bg-black/50" : "bg-gray-100/50"} ${tokenWeight.weightB < 0 ? "border-red-500" : "border_0000000d"}`}
              >
                <div class="flex-1">
                  <input
                    type="text"
                    placeholder="0"
                    autocomplete="off"
                    inputmode="decimal"
                    class="text-sm font-normal p-0 border-none focus:outline-none focus:ring-0 flex-1 bg-transparent w-full h-full"
                    value={tokenWeight.weightB}
                    on:change={(event) => {
                      tokenWeight = {
                        weightA: 100 - Number(event?.target?.value),
                        weightB: Number(event?.target?.value),
                      };
                    }}
                  />
                </div>
                <div class="text-sm font-normal">%</div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    {#if selectedProtocol.chain !== "SUI"}
      <div class="w-max">
        {#if amount && tokenPrice.priceChangeA.length !== 0 && tokenPrice.priceChangeB.length !== 0 && Number(amount) > 0 && Number(tokenWeight.weightB) > 0 && Number(tokenWeight.weightA) > 0}
          <Button variant="tertiary" on:click={handleSimulator}>
            {$t("Simulate")}
          </Button>
        {:else}
          <Button variant="disabled" disabled>{$t("Simulate")}</Button>
        {/if}
      </div>
    {:else}
      <div class="w-max">
        {#if amount && tokenPrice.priceChangeA.length !== 0 && Number(tokenWeight.weightA) > 0}
          <Button variant="tertiary" on:click={handleSimulator}>
            {$t("Simulate")}
          </Button>
        {:else}
          <Button variant="disabled" disabled>{$t("Simulate")}</Button>
        {/if}
      </div>
    {/if}

    <div
      class="border border_0000000d py-2 px-3 rounded-[20px] flex justify-between items-center gap-3"
    >
      <div class="text-base">
        {$t("Impermanent Loss")}
      </div>
      <div class="flex flex-col items-end">
        <div
          class={`text-base flex items-center ${
            data?.ilAmount !== 0
              ? data?.ilAmount > 0
                ? "text-[#00A878]"
                : "text-red-500"
              : ""
          }`}
        >
          {Number(data?.ilAmount) < 0 ? "-" : ""}$<TooltipNumber
            number={Math.abs(Number(data?.ilAmount))}
            type="balance"
          />
        </div>

        <div
          class={`text-sm flex gap-1 ${
            data?.il !== 0
              ? Number(data?.il) >= 0
                ? "text-[#00A878]"
                : "text-red-500"
              : ""
          }`}
        >
          <span>
            <TooltipNumber
              number={Math.abs(Number(data?.il))}
              type={`${Number(data?.il) < 0.01 ? "amount" : "percent"}`}
            />%
          </span>
          {#if Number(data?.il) !== 0}
            <img
              src={Number(data?.il) >= 0 ? TrendUp : TrendDown}
              alt="trend"
              class="mb-1"
            />
          {/if}
        </div>
      </div>
    </div>

    <div class="rounded-[20px] py-4 px-3 border border_0000000d flex flex-col">
      <div class="text-base">
        {$t("Yield Farming Overtime")}
      </div>
      {#if isLoading}
        <div class="flex items-center justify-center h-[465px]">
          {#if isNimbusVersion}
            <LoadingPremium />
          {:else}
            <Loading />
          {/if}
        </div>
      {:else}
        <div class="h-full">
          {#if data.chartData.length === 0}
            <div
              class="flex justify-center items-center h-[465px] text-base text-gray-400"
            >
              {$t("Empty")}
            </div>
          {:else}
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
  </div>
</div>

<style></style>
