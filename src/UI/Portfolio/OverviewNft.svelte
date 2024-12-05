<script lang="ts">
  import {
    chain,
    isDarkMode,
    tab,
    totalNfts,
    typeWallet,
    wallet,
  } from "~/store";
  import { formatPercent, formatValue } from "~/utils";
  import { t } from "~/lib/i18n";
  import { isNimbusVersion } from "~/utils/constants";
  import { chainList, chainMoveList, chainSolList } from "~/lib/chains";
  import { createQueries, createQuery } from "@tanstack/svelte-query";
  import { getHoldingNFT, handleValidateAddress } from "~/lib/queryAPI";
  import { flatten } from "lodash";

  import EChart from "~/components/EChart.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";

  export let enabledFetchAllData;
  export let isLoading;

  let holdingNFTData: any = [];

  $: queryValidate = createQuery({
    queryKey: ["validate", $wallet],
    queryFn: () => handleValidateAddress($wallet),
    retry: false,
    enabled: Boolean($wallet && $wallet?.length !== 0),
  });

  $: chainListQueries =
    $typeWallet?.length !== 0 && $typeWallet === "EVM"
      ? chainList.slice(1)?.map((item) => item.value)
      : $typeWallet?.length !== 0 && ["MOVE", "SUI"].includes($typeWallet)
        ? chainMoveList.slice(1)?.map((item) => item.value)
        : $typeWallet?.length !== 0 && ["ECLIPSE", "SOL"].includes($typeWallet)
          ? chainSolList.slice(1)?.map((item) => item.value)
          : [chainSolList[0]?.value];

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
    if ($wallet || $chain) {
      if (
        $wallet?.length !== 0 &&
        $chain?.length !== 0 &&
        !$queryValidate.isFetching
      ) {
        holdingNFTData = [];
      }
    }
  }

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
    holdingNFTData = data?.map((item: any) => {
      return {
        ...item,
        verify: {
          classification: "ham",
        },
      };
    });
  };

  $: isLoadingBreakdownNfts =
    $tab === "nft"
      ? $chain === "ALL"
        ? $queryAllNftHolding.some((item) => item.isLoading === true)
        : $queryNftHolding.isLoading
      : false;

  $: {
    if (holdingNFTData) {
      formatNFTBreakdown(holdingNFTData);
    }
  }

  let dataPieChartNft: any = [];

  let option: any = {
    tooltip: {
      trigger: "item",
      axisPointer: {
        type: "shadow",
      },
      extraCssText: "z-index: 9997",
      formatter: function (params: any) {
        let formatParams: any = {};

        const selectedData =
          holdingNFTData.find(
            (item: any) =>
              item?.collection?.name?.toLowerCase() ===
              params?.seriesName?.toLowerCase(),
          ) || {};

        if (selectedData && Object.keys(selectedData).length !== 0) {
          formatParams = {
            ...selectedData,
            ratio: params.value,
            value:
              selectedData?.floorPrice *
              selectedData?.marketPrice *
              selectedData?.tokens?.length,
          };
        } else {
          const selectedDataOther: any = dataPieChartNft.find(
            (item: any) => item?.name === "Other",
          );

          formatParams = {
            ...selectedDataOther,
            collection: {
              name: "Other",
            },
            ratio: params.value,
            value: ($totalNfts * params.value) / 100,
          };
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 12px; min-width: 220px;">
              <div style="display: flex; align-items: centers; gap: 4px">
                <img src="https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384"
                onerror="this.onerror=null;this.src='https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384';"
                alt="" width=20 height=20 style="border-radius: 100%" />
                <div style="font-weight: 500; font-size: 16px; line-height: 19px; color: ${
                  $isDarkMode ? "white" : "black"
                }">
                  ${formatParams?.collection?.name}
                </div>
              </div>

              ${
                formatParams?.tokens && formatParams?.tokens.length > 0
                  ? `
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                  $isDarkMode ? "white" : "black"
                }">
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                    ${$t("Balance")}
                  </div>
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                    ${formatParams?.tokens.length}
                  </div>
                </div>
              `
                  : ""
              }

              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                $isDarkMode ? "white" : "black"
              }">
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${$t("Value")}
                </div>
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${formatValue(formatParams?.value)}
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                $isDarkMode ? "white" : "black"
              }">
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${$t("Ratio")}
                </div>
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${formatPercent(formatParams?.ratio)}%
                </div>
              </div>
            </div>`;
      },
    },
    legend: {
      type: "scroll",
      top: "10%",
      left: "center",
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

  const formatNFTBreakdown = (data: any) => {
    const formatData = data
      ?.map((item: any) => {
        return {
          ...item,
          current_value:
            item?.floorPrice * item?.marketPrice * item?.tokens?.length,
        };
      })
      ?.filter((item: any) => Number(item.current_value) > 0)
      ?.sort((a: any, b: any) => {
        if (a.current_value < b.current_value) {
          return 1;
        }
        if (a.current_value > b.current_value) {
          return -1;
        }
        return 0;
      });

    const sumNft = (formatData || []).reduce(
      (prev: any, item: any) => prev + Number(item?.current_value),
      0,
    );

    const formatChartData = formatData.map((item: any) => {
      return {
        name: item?.collection?.name || "N/A",
        type: "bar",
        stack: "total",
        label: {
          show: false,
        },
        emphasis: {
          focus: "series",
        },
        data: [(item.current_value / sumNft) * 100],
        barMinWidth: "120%",
      };
    });

    let topData = [];
    let otherData = [];
    let total = 0;

    for (let i = 0; i < formatChartData.length; i++) {
      let value = formatChartData[i].data[0];
      if (total <= 90) {
        topData.push(formatChartData[i]);
        total += value;
      } else {
        otherData.push(formatChartData[i]);
      }
    }

    const formatOtherData = otherData.map((item) => {
      const selectedData = formatData.find(
        (eachData: any) => eachData?.collection?.name || "N/A" === item.name,
      );
      return {
        ...selectedData,
        ...item,
      };
    });

    const sumOrderBreakdownNft = formatOtherData.reduce(
      (prev: any, item: any) => prev + Number(item.current_value),
      0,
    );

    dataPieChartNft =
      sumOrderBreakdownNft > 0
        ? topData.concat([
            {
              name: "Other",
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
        : topData;

    const formatSeriesData = dataPieChartNft.map((item: any, index: number) => {
      if (dataPieChartNft.length === 1) {
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

      if (index === dataPieChartNft.length - 1) {
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

{#if isLoading || isLoadingBreakdownNfts}
  <div class="flex justify-center items-center h-[68px]">
    {#if isNimbusVersion}
      <LoadingPremium />
    {:else}
      <Loading />
    {/if}
  </div>
{:else}
  <div>
    {#if holdingNFTData && holdingNFTData?.length === 0}
      <div
        class="h-[68px] flex justify-center items-center text-base text-gray-400"
      >
        {$t("Empty")}
      </div>
    {:else}
      <EChart id="nfts-overview" {theme} notMerge={true} {option} height={68} />
    {/if}
  </div>
{/if}

<style></style>
