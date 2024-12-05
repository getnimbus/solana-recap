<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import { isDarkMode } from "~/store";
  import { formatPercent, formatValue, formatCurrency } from "~/utils/index";
  import { t } from "~/lib/i18n";

  import Loading from "~/components/Loading.svelte";
  import EChart from "~/components/EChart.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let isLoading;
  export let listTokenHolding;

  let optionPie = {
    title: {
      text: "",
    },
    tooltip: {
      trigger: "item",
      extraCssText: "z-index: 9997",
      formatter: function (params) {
        return `
            <div style="display: flex; flex-direction: column; gap: 12px; min-width: 220px;">
              <div style="display: flex; align-items: centers; gap: 4px">
                <img src=${params?.data?.logo || defaultToken}
                onerror="this.onerror=null;this.src='${defaultToken}';"
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
                params?.data?.name_balance?.length !== 0
                  ? `
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                  $isDarkMode ? "white" : "black"
                }">
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                    Balance
                  </div>
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                    ${formatCurrency(params?.data?.value_balance)}
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

  const formatDataPie = (data) => {
    return data?.map((item) => {
      if (isNaN(item.value)) {
        return {
          ...item,
          value: 0,
        };
      } else {
        return item;
      }
    });
  };

  const formatTokenBreakdown = (data) => {
    const formatData = data?.filter((item) => Number(item.value) > 0);

    const sumToken = (formatData || []).reduce(
      (prev, item) => prev + Number(item?.value),
      0,
    );

    const sortBreakdownToken = formatData?.sort((a, b) => {
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
      .map((item) => {
        return {
          ...item,
          id: item.coinId || "N/A",
          symbol: item.symbol || "N/A",
          name: item.name || "N/A",
        };
      });

    const orderBreakdownToken = sortBreakdownToken?.slice(
      5,
      sortBreakdownToken?.length,
    );

    const sumOrderBreakdownToken = (orderBreakdownToken || []).reduce(
      (prev, item) => prev + Number(item.value),
      0,
    );

    const dataPieChartOrderBreakdownToken = [
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
      (item) => {
        return {
          logo: item.logo || defaultToken,
          name: item.name || item.symbol,
          symbol: item.symbol,
          name_ratio: "Ratio",
          value: Number(item.percent),
          name_value: "Value",
          value_value: Number(item.value),
          name_balance: "Balance",
          value_balance: Number(item?.amount),
        };
      },
    );

    const dataPieChartToken =
      sumOrderBreakdownToken > 0
        ? formatDataPieChartTopFiveToken?.concat(
            dataPieChartOrderBreakdownToken,
          )
        : formatDataPieChartTopFiveToken;

    optionPie = {
      ...optionPie,
      legend: {
        ...optionPie.legend,
        formatter: function (name) {
          const selected = dataPieChartToken.find(
            (item) => item.name.toLowerCase() === name.toLowerCase(),
          );
          return selected?.symbol || name;
        },
      },
      series: [
        {
          ...optionPie.series[0],
          data: formatDataPie(dataPieChartToken),
        },
      ],
    };
  };

  $: {
    if (listTokenHolding?.length !== 0) {
      formatTokenBreakdown(listTokenHolding);
    }
  }

  $: theme = $isDarkMode ? "dark" : "white";
</script>

<div
  class={`rounded-[20px] xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
    $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
  }`}
>
  <div class="font-medium text-2xl mb-6">{$t("Allocation")}</div>

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
      {#if listTokenHolding?.length === 0}
        <div
          class="flex justify-center items-center h-[465px] text-base text-gray-400"
        >
          {$t("Empty")}
        </div>
      {:else}
        <div class="xl:block hidden">
          <EChart
            id="pie-chart-token-allocation-virtual-dekstop"
            {theme}
            notMerge={true}
            option={optionPie}
            height={465}
          />
        </div>
        <div class="xl:hidden block">
          <EChart
            id="pie-chart-token-allocation-virtual-mobile"
            {theme}
            notMerge={true}
            option={optionPie}
            height={265}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>

<style windi:preflights:global windi:safelist:global></style>
