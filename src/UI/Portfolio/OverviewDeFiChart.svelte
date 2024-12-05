<script lang="ts">
  import numeral from "numeral";
  import { isDarkMode, totalPositions, wallet } from "~/store";
  import { formatValue } from "~/utils";
  import { detectedChain } from "~/lib/chains";
  import { isNimbusVersion } from "~/utils/constants";
  import { t } from "~/lib/i18n";

  import EChart from "~/components/EChart.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let positionsData: any = [];
  export let isLoading;

  let totalOther = 0;

  let option: any = {
    tooltip: {
      trigger: "item",
      axisPointer: {
        type: "shadow",
      },
      extraCssText: "z-index: 9997",
      formatter: function (params: any) {
        const selectedData = positionsData.find(
          (eachItem: any) => eachItem.protocol === params?.seriesName,
        );

        const formatParams = {
          ...selectedData,
          ratio: params.value,
        };

        return `
          <div style="display: flex; flex-direction: column; align-items: centers; gap: 10px; min-width: 220px;">
            <div style="display: flex; align-items: centers; gap: 6px">
              <div style="position: relative;">
                <img src=${formatParams?.meta?.logo || defaultToken} onerror="this.onerror=null;this.src='${defaultToken}';" alt="" width=20 height=20 style="border-radius: 100%" />
                ${params?.seriesName !== "Other Position" ? `<img src=${detectedChain(formatParams?.chain)?.logo} width=12 height=12 style="border-radius: 100%; position: absolute; top: 0px; right: -2px;"/>` : ``}
              </div>
              <div style="font-weight: 500; font-size: 16px; color: ${
                $isDarkMode ? "white" : "black"
              }">
                ${params?.seriesName !== "Other Position" ? formatParams?.protocol : "Other Position"}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${$isDarkMode ? "white" : "black"}">
              <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                ${$t("Value")}
              </div>
              <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); display: flex; justify-content: flex-end; font-weight: 500; font-size: 14px; line-height: 17px;">
                ${formatValue(params?.seriesName !== "Other Position" ? formatParams?.sum : totalOther)}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${$isDarkMode ? "white" : "black"}">
              <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                ${$t("Ratio")}
              </div>
              <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); display: flex; justify-content: flex-end; font-weight: 500; font-size: 14px; line-height: 17px;">
                ${numeral(Number(formatParams?.ratio)).format("0.00")}%
              </div>
            </div>
          </div>
        `;
      },
    },
    legend: {
      type: "scroll",
      top: "10%",
      left: "center",
      formatter: function (name: any) {
        return name;
      },
    },
    grid: {
      left: "-1%",
      right: "0%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      show: false,
    },
    yAxis: {
      type: "category",
      data: [""],
      show: false,
    },
    series: [],
  };

  $: {
    if (positionsData && positionsData.length !== 0) {
      const formatData = (positionsData || []).map((item: any) => {
        return {
          name: item?.meta?.name || "" + "-" + item.chain,
          type: "bar",
          stack: "total",
          label: {
            show: false,
          },
          emphasis: {
            focus: "series",
          },
          data: [(item.sum / $totalPositions) * 100],
          barMinWidth: "120%",
        };
      });

      handleFormatDatChart(formatData);
    }
  }

  const handleFormatDatChart = (data: any) => {
    let formatData = [];
    let otherData = [];
    let total = 0;

    for (let i = 0; i < data.length; i++) {
      let value = data[i].data[0];
      if (total <= 90) {
        formatData.push(data[i]);
        total += value;
      } else {
        otherData.push(data[i]);
      }
    }

    const formatOtherData = otherData.map((item) => {
      const selectedData = positionsData.find(
        (eachData: any) =>
          eachData.protocol + "-" + eachData.chain === item.name,
      );

      return {
        ...selectedData,
        ...item,
      };
    });

    totalOther = formatOtherData.reduce(
      (prev: any, item: any) => prev + Number(item.sum),
      0,
    );

    const seriesData =
      totalOther > 0
        ? formatData.concat([
            {
              name: "Other Position",
              type: "bar",
              stack: "total",
              label: {
                show: false,
              },
              emphasis: {
                focus: "series",
              },
              data: [100 - total],
              barMinWidth: "120%",
            },
          ])
        : formatData;

    const formatSeriesData = seriesData.map((item: any, index: number) => {
      if (seriesData.length === 1) {
        return {
          ...item,
          itemStyle: {
            borderRadius: [10, 10, 10, 10],
          },
        };
      }

      if (index === 0) {
        return {
          ...item,
          itemStyle: {
            borderRadius: [10, 0, 0, 10],
          },
        };
      }

      if (index === seriesData.length - 1) {
        return {
          ...item,
          itemStyle: {
            borderRadius: [0, 10, 10, 0],
          },
        };
      }

      return item;
    });

    option = {
      ...option,
      series: formatSeriesData,
    };
  };

  $: theme = $isDarkMode ? "dark" : "white";
</script>

{#if isLoading}
  <div class="flex justify-center items-center h-[68px]">
    {#if isNimbusVersion}
      <LoadingPremium />
    {:else}
      <Loading />
    {/if}
  </div>
{:else}
  <div class="min-h-[68px]">
    {#if positionsData && positionsData?.length === 0}
      <div
        class="h-[68px] flex justify-center items-center text-base text-gray-400"
      >
        {$t("Empty")}
      </div>
    {:else}
      <EChart
        id={`defi-overview-${$wallet}`}
        {theme}
        notMerge={true}
        {option}
        height={68}
      />
    {/if}
  </div>
{/if}

<style></style>
