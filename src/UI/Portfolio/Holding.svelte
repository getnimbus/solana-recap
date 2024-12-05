<script lang="ts">
  import {
    wallet,
    chain,
    typeWallet,
    isDarkMode,
    totalTokens,
    unrealizedProfit,
    realizedProfit,
    pastProfit,
    totalNfts,
    tab,
  } from "~/store";
  import { chunkArray, getChangePercent } from "~/utils/index";
  import { filterTokenValueType, isNimbusVersion } from "~/utils/constants";
  import { flatten, groupBy } from "lodash";
  import { priceMobulaSubscribe } from "~/lib/price-mobulaWs";
  import { priceSubscribe } from "~/lib/price-ws";
  import {
    getHoldingNFT,
    getHoldingToken,
    handleValidateAddress,
  } from "~/lib/queryAPI";
  import { createQueries, createQuery } from "@tanstack/svelte-query";
  import { chainList, chainMoveList, chainSolList } from "~/lib/chains";
  import { extractAndClassify } from "nft-scam-detector";
  import pLimit from "p-limit";
  import { t } from "~/lib/i18n";
  import { calculatePnL, calculateRealizedProfit } from "~/utils/functions";

  import Cta from "~/UI/Portfolio/CTA.svelte";
  import HoldingNFT from "~/UI/Portfolio/HoldingNFT.svelte";
  import HoldingToken from "~/UI/Portfolio/HoldingToken.svelte";
  import Select from "~/components/Select.svelte";
  import ErrorBoundary from "~/components/ErrorBoundary.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";

  export let enabledFetchAllData;
  export let selectedTokenHolding;
  export let selectedDataPieChart;
  export let selectedTypeTable: any;

  const limit = pLimit(3);

  let defaultDataHoldingNFT: any = [];
  let holdingNFTData: any = [];
  let holdingTokenData: any = [];

  let dataSubWS: any = [];
  let formatData: any = [];
  let formatDataNFT: any = [];

  let sumTokens = 0;
  let sumNFT = 0;
  let sumRealizedProfit = 0;
  let sumUnrealizedProfit = 0;

  let selectedTokenHoldingPercent = 0;
  let checkScam = false;
  let checkScamToken = false;

  let filterTokenType = {
    label: "$1",
    value: 1,
  };

  let filterNFTType = {
    label: "$1",
    value: 1,
  };

  const handleUpdateTotalTokenHolding = (data: any) => {
    sumTokens = data.totalSumTokens;
    sumRealizedProfit = data.totalSumRealizedProfit;
    sumUnrealizedProfit = data.totalSumUnrealizedProfit;
    totalTokens.update((n) => (n = sumTokens));
    realizedProfit.update((n) => (n = sumRealizedProfit));
    unrealizedProfit.update((n) => (n = sumUnrealizedProfit));
  };

  const handleUpdateTotalNftHolding = (data: any) => {
    sumNFT = data.totalSumNFT;
    sumRealizedProfit = data.totalSumPnL;
    totalNfts.update((n) => (n = sumNFT));
    realizedProfit.update((n) => (n = sumRealizedProfit));
    unrealizedProfit.update((n) => (n = 0));
  };

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
      const allTokens =
        flatten(
          $queryAllTokenHolding
            ?.filter((item) => Array.isArray(item.data))
            ?.map((item) => item.data),
        ) || [];
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
    try {
      holdingTokenData = data
        ?.filter((item: any) => Number(item?.amount) !== 0)
        ?.map((item: any) => {
          return {
            ...item,
            market_price: item?.price?.price || 0,
            value: Number(item?.amount) * Number(item?.price?.price),
            percent_24h_price_change:
              item?.last_24h_price && item?.last_24h_price?.price !== 0
                ? getChangePercent(
                    Number(item?.price?.price),
                    Number(item?.last_24h_price?.price),
                  )
                : null,
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

      formatData = holdingTokenData;

      sumTokens =
        (formatData || []).reduce(
          (prev: any, item: any) => prev + item.value,
          0,
        ) || 0;

      sumRealizedProfit =
        (formatData || []).reduce(
          (prev: any, item: any) =>
            prev + Number(item?.profit?.realizedProfit || 0),
          0,
        ) || 0;

      sumUnrealizedProfit =
        (formatData || [])
          ?.filter(
            (item: any) =>
              Number(item?.amount) > 0 && Number(item?.avgCost) !== 0,
          )
          ?.map((item: any) => {
            const price = Number(item?.market_price || item?.price?.price || 0);

            const realizedProfit = calculateRealizedProfit(
              Number(item?.avgCost),
              Number(item?.profit?.realizedProfit),
            );

            const pnl = calculatePnL(
              realizedProfit.profit,
              Number(price),
              Number(item?.amount || 0),
              Number(item?.profit?.totalBought || 0),
              Number(item?.profit?.totalSold || 0),
              Number(item?.profit?.totalGain || 0),
              Number(item?.profit?.cost || 0),
            );

            return {
              unrealized_profit:
                Number(item?.avgCost) === 0
                  ? 0
                  : Number(pnl) - realizedProfit.profit,
            };
          })
          ?.reduce(
            (prev: any, item: any) => prev + Number(item.unrealized_profit),
            0,
          ) || 0;

      handleUpdateTotalTokenHolding({
        totalSumTokens: sumTokens,
        totalSumRealizedProfit: sumRealizedProfit,
        totalSumUnrealizedProfit: sumUnrealizedProfit,
      });
    } catch (e) {
      console.error(e);
    }
  };

  $: isLoadingToken =
    $chain === "ALL"
      ? $queryAllTokenHolding.some((item) => item.isLoading === true)
      : $queryTokenHolding.isLoading;

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
      const allNfts =
        flatten(
          $queryAllNftHolding
            ?.filter((item) => Array.isArray(item.data))
            ?.map((item) => item.data),
        ) || [];
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

  const handleCalculateTotalNativeTokenPriceNFT = (data: any) => {
    return data?.tokens?.reduce(
      (prev: any, item: any) => prev + Number(item.price),
      0,
    );
  };

  const handleCalculateProfitAndLossNFT = (data: any) => {
    const totalNativeTokenPrice = handleCalculateTotalNativeTokenPriceNFT(data);
    return totalNativeTokenPrice === 0
      ? 0
      : data?.current_native_token - (totalNativeTokenPrice || 0);
  };

  const formatDataHoldingNFT = async (data: any) => {
    try {
      holdingNFTData = data?.map((item: any) => {
        const pnl = handleCalculateProfitAndLossNFT(item);
        const totalCostNativeToken =
          handleCalculateTotalNativeTokenPriceNFT(item);

        return {
          ...item,
          verify: {
            classification: item?.collection?.scam ? "scam" : "ham",
          },
          pnl: totalCostNativeToken === 0 ? 0 : pnl * item?.marketPrice,
          current_value:
            Number(item?.floorPrice) *
            Number(item?.marketPrice) *
            item?.tokens?.length,
        };
      });
      defaultDataHoldingNFT = holdingNFTData;
      sumNFT =
        holdingNFTData.reduce(
          (prev: any, item: any) => prev + item.current_value,
          0,
        ) || 0;
      const totalPnl =
        holdingNFTData.reduce((prev: any, item: any) => prev + item.pnl, 0) ||
        0;
      handleUpdateTotalNftHolding({
        totalSumNFT: sumNFT,
        totalSumPnL: totalPnl,
      });
    } catch (e) {
      console.error(e);
    }
  };

  $: isLoadingNFT =
    $chain === "ALL"
      ? $queryAllNftHolding.some((item) => item.isLoading === true)
      : $queryNftHolding.isLoading;

  // format initial data token holding
  $: {
    if (
      selectedTokenHolding &&
      Object.keys(selectedTokenHolding).length !== 0 &&
      selectedTokenHolding.data.length !== 0 &&
      !isLoadingToken
    ) {
      let data: any = [];
      if (
        selectedTypeTable &&
        Object.keys(selectedTypeTable).length !== 0 &&
        selectedTypeTable.value.length !== 0
      ) {
        if (Array.isArray(selectedTokenHolding.data)) {
          data = selectedTokenHolding?.data.find(
            (item: any) => item.name === selectedTypeTable.value,
          )?.data;
        } else {
          data = selectedTokenHolding.data.data;
        }
      } else {
        data = [];
      }

      if (data && data.length !== 0) {
        formatData = data.map((item: any) => {
          return {
            ...item,
            market_price: item?.price?.price || 0,
          };
        });
      }
    }
  }

  // format initial data nft holding
  $: {
    if (holdingNFTData && holdingNFTData.length !== 0) {
      formatDataNFT = holdingNFTData
        ?.map((item: any) => {
          return {
            ...item,
            current_native_token:
              Number(item?.floorPrice) * item?.tokens?.length,
            current_value:
              Number(item?.floorPrice) *
              Number(item?.marketPrice) *
              item?.tokens?.length,
          };
        })
        ?.sort((a: any, b: any) => {
          if (a.current_native_token < b.current_native_token) {
            return 1;
          }
          if (a.current_native_token > b.current_native_token) {
            return -1;
          }
          return 0;
        });
    }
  }

  $: filteredUndefinedCmcHoldingTokenData =
    !isLoadingToken && holdingTokenData?.length !== 0
      ? holdingTokenData?.filter(
          (item: any) =>
            Number(item?.amount) > 0 &&
            (item?.price?.source === undefined ||
              item?.price?.source !== "Modifed") &&
            item?.cmc_id === undefined,
        )
      : [];

  $: filteredNullCmcHoldingTokenData =
    !isLoadingToken && holdingTokenData?.length !== 0
      ? holdingTokenData?.filter(
          (item: any) =>
            Number(item?.amount) > 0 &&
            (item?.price?.source === undefined ||
              item?.price?.source !== "Modifed") &&
            (item?.cmc_id === null || item?.cmc_id === 0),
        )
      : [];

  // subscribe to ws
  $: {
    if (!isLoadingToken) {
      if (holdingTokenData?.length !== 0) {
        const dataTokenHolding = holdingTokenData?.filter(
          (item: any) =>
            Number(item?.amount) > 0 &&
            (item?.price?.source === undefined ||
              item?.price?.source !== "Modifed") &&
            item?.cmc_id !== undefined &&
            item?.cmc_id !== null &&
            item?.cmc_id > 0,
        );
        dataSubWS = dataTokenHolding.map((item: any) => {
          return {
            symbol: item.symbol,
            cmcId: item.cmc_id,
          };
        });
      }
    }
    if (!isLoadingNFT) {
      if (holdingNFTData?.length !== 0) {
        const formatHoldingNFTData = holdingNFTData
          ?.filter((item: any) => item?.nativeToken?.cmcId)
          ?.map((item: any) => {
            return {
              symbol: item.nativeToken.symbol,
              cmcId: item.nativeToken.cmcId,
            };
          });
        dataSubWS = dataSubWS?.concat(formatHoldingNFTData);
      }
    }
  }

  $: {
    if (
      !isLoadingNFT &&
      !isLoadingToken &&
      filteredNullCmcHoldingTokenData &&
      filteredNullCmcHoldingTokenData.length !== 0
    ) {
      const groupFilteredNullCmcHoldingTokenData = groupBy(
        filteredNullCmcHoldingTokenData,
        "chain",
      );
      const chainList = Object.keys(groupFilteredNullCmcHoldingTokenData);
      chainList.map((chain) => {
        const chunkedArray = chunkArray(
          groupFilteredNullCmcHoldingTokenData[chain],
          100,
        );
        chunkedArray.forEach((chunk) => {
          const listTokenSubWs = chunk.filter(
            (item: any) => item?.contractAddress,
          );
          if (listTokenSubWs && listTokenSubWs.length !== 0) {
            priceMobulaSubscribe(
              listTokenSubWs.map((item: any) => item.contractAddress),
              listTokenSubWs[0]?.chain,
            );
          }
        });
      });
    }
  }

  $: {
    if (
      !isLoadingNFT &&
      !isLoadingToken &&
      dataSubWS &&
      dataSubWS.length !== 0
    ) {
      let filteredData: any = [];
      const symbolSet = new Set();
      dataSubWS.forEach((item: any) => {
        if (!symbolSet.has(item.symbol)) {
          symbolSet.add(item.symbol);
          filteredData.push(item);
        }
      });
      filteredData?.map((item: any) => {
        priceSubscribe([Number(item?.cmcId)], item?.chain);
      });
    }
  }

  $: {
    if (
      selectedTokenHolding &&
      Object.keys(selectedTokenHolding).length !== 0 &&
      selectedTokenHolding.data.length !== 0 &&
      selectedTokenHolding?.data?.data?.length === 0
    ) {
      sumRealizedProfit = 0;
      sumUnrealizedProfit = 0;
      sumTokens = 0;
      sumNFT = 0;
      formatDataNFT = [];
      formatData = [];
      totalTokens.update((n) => (n = 0));
      totalNfts.update((n) => (n = 0));
      unrealizedProfit.update((n) => (n = 0));
      realizedProfit.update((n) => (n = 0));
    }
  }

  $: {
    if (holdingTokenData && $tab === "token") {
      const closedHoldingToken = holdingTokenData?.filter(
        (item: any) =>
          item?.profit?.realizedProfit !== undefined &&
          Number(item?.amount) === 0,
      );

      pastProfit.update(
        (n) =>
          (n = closedHoldingToken.reduce(
            (prev: any, item: any) =>
              prev + Number(item?.profit.realizedProfit),
            0,
          )),
      );
    }
  }

  $: {
    if (selectedTypeTable) {
      if (selectedDataPieChart && selectedDataPieChart?.length !== 0) {
        const selectedPercent =
          selectedDataPieChart &&
          (selectedDataPieChart || [])?.find(
            (item: any) =>
              item?.name?.toString().toLowerCase() ===
              selectedTypeTable?.label?.toString().toLowerCase(),
          );
        selectedTokenHoldingPercent = selectedPercent?.value;
      }
    }
  }

  let selectedDataNftScam: any;

  const formatDataHoldingNFTScam = async (data: any) => {
    if (data && data?.length !== 0) {
      data?.forEach(async (item: any) => {
        if (
          Number(item.floorPrice) < 1 &&
          item?.tokens[0]?.imageUrl &&
          item?.verify?.classification === "ham"
        ) {
          limit(async () => {
            if (
              item?.tokens[0]?.imageUrl &&
              item?.tokens[0]?.imageUrl.startsWith("https://")
            ) {
              selectedDataNftScam = {
                ...item,
                verify: await extractAndClassify(
                  `https://sui-nft-spam-api.getnimbus.io/read-image?link=${encodeURIComponent(item?.tokens[0]?.imageUrl)}`,
                ),
              };
            } else if (
              item?.tokens[0]?.imageUrl &&
              item?.tokens[0]?.imageUrl.startsWith("ipfs://")
            ) {
              selectedDataNftScam = {
                ...item,
                verify: await extractAndClassify(
                  `https://sui-nft-spam-api.getnimbus.io/read-image?ipfs=${encodeURIComponent(item?.tokens[0]?.imageUrl)}`,
                ),
              };
            } else {
              selectedDataNftScam = item;
            }
          });
        } else {
          selectedDataNftScam = item;
        }
      });
    }
  };

  $: {
    if (selectedDataNftScam) {
      formatDataNFT = formatDataNFT
        .map((item: any) => {
          if (item.collectionId === selectedDataNftScam.collectionId) {
            return {
              ...item,
              verify: {
                ...selectedDataNftScam?.verify,
              },
            };
          }

          return {
            ...item,
          };
        })
        .sort((a: any, b: any) => {
          if (a.current_native_token < b.current_native_token) {
            return 1;
          }
          if (a.current_native_token > b.current_native_token) {
            return -1;
          }
          return 0;
        });
    }
  }

  $: {
    if (
      !isLoadingNFT &&
      defaultDataHoldingNFT &&
      defaultDataHoldingNFT.length !== 0
    ) {
      formatDataHoldingNFTScam(defaultDataHoldingNFT);
    }
  }
</script>

{#if ["MOVE", "TON"].includes($typeWallet) && $tab === "token" && !isLoadingToken && holdingTokenData.length !== 0 && isNimbusVersion}
  <Cta />
{/if}

<div
  class={`flex flex-col gap-6 rounded-[20px] xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
    $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
  }`}
>
  <ErrorBoundary>
    <div class="flex flex-col gap-2">
      <div class="flex xl:flex-row flex-col gap-2 justify-between">
        <div class="flex items-end gap-3">
          <div class="text-2xl font-medium">
            {$t("Holding")}
          </div>
          <!-- <a
            href="https://forms.gle/HfmvSTzd5frPPYDz8"
            target="_blank"
            class="text-sm font-normal text-blue-500 mb-[2px] hover:text-blue-700 transition-all"
          >
            Get investment opportunities notification
          </a> -->
        </div>
        <div class="xl:text-3xl text-2xl font-medium md:block hidden">
          {#if $tab === "token"}
            <TooltipNumber number={sumTokens} type="value" personalValue />
          {/if}
          {#if $tab === "nft"}
            <TooltipNumber number={sumNFT} type="value" personalValue />
          {/if}
        </div>
      </div>

      <!-- token holding table -->
      {#if $tab === "token"}
        <div class="flex flex-col gap-2">
          {#if selectedTokenHolding && Object.keys(selectedTokenHolding).length !== 0 && selectedTokenHolding?.select.length !== 0}
            <div
              class="text-xl font-medium text-gray-400 xl:text-right text-left"
            >
              <TooltipNumber
                number={selectedTokenHoldingPercent}
                type="percent"
              />%
            </div>
          {/if}

          <div class="flex flex-col gap-4">
            <div class="flex md:items-center items-end gap-3 justify-between">
              <div
                class={`xl:order-1 order-2 flex flex-col items-start gap-4 ${
                  selectedTokenHolding &&
                  Object.keys(selectedTokenHolding).length !== 0 &&
                  selectedTokenHolding?.select.length !== 0
                    ? "xl:-mt-8"
                    : ""
                }`}
              >
                {#if selectedTokenHolding && Object.keys(selectedTokenHolding).length !== 0 && selectedTokenHolding?.select.length !== 0}
                  <div class="xl:block hidden">
                    <Select
                      type="lang"
                      positionSelectList="left-0"
                      listSelect={selectedTokenHolding?.select || []}
                      bind:selected={selectedTypeTable}
                      isDisabledSelectWallet={false}
                      indexWalletDisabled={-1}
                    />
                  </div>
                  <div class="xl:hidden block">
                    <Select
                      type="lang"
                      positionSelectList="right-0"
                      listSelect={selectedTokenHolding?.select || []}
                      bind:selected={selectedTypeTable}
                      isDisabledSelectWallet={false}
                      indexWalletDisabled={-1}
                    />
                  </div>
                {/if}
                <div
                  class="flex-1 xl:flex hidden items-center justify-end gap-2 text-[#666666]"
                >
                  <div class="text-sm font-regular text-gray-400">
                    {$t("Hide Scam Tokens")}
                  </div>
                  <label class="switch" for="switch">
                    <input
                      type="checkbox"
                      id="switch"
                      bind:checked={checkScamToken}
                    />
                    <span class="slider" />
                  </label>
                </div>
              </div>

              <div
                class="xl:order-2 order-1 flex items-center justify-end gap-2"
              >
                <div class="xl:block hidden text-sm font-regular text-gray-400">
                  {$t("Hide tokens less than")}
                </div>
                <div class="xl:block hidden">
                  <Select
                    type="filter"
                    positionSelectList="right-0"
                    listSelect={filterTokenValueType}
                    bind:selected={filterTokenType}
                    isDisabledSelectWallet={false}
                    indexWalletDisabled={-1}
                  />
                </div>
                <div class="xl:hidden block">
                  <Select
                    type="filter"
                    positionSelectList="left-0"
                    listSelect={filterTokenValueType}
                    bind:selected={filterTokenType}
                    isDisabledSelectWallet={false}
                    indexWalletDisabled={-1}
                  />
                </div>
              </div>
            </div>

            <HoldingToken
              {checkScamToken}
              {filterTokenType}
              {sumTokens}
              defaultData={holdingTokenData}
              dataTokenHolding={formatData}
              isLoading={isLoadingToken}
              {handleUpdateTotalTokenHolding}
            />

            <button
              class="hover:text-blue-500 underline cursor-pointer text-left w-max text-sm"
              data-featurebase-feedback
            >
              {$t("Report Incorrect data")}
            </button>
          </div>
        </div>
      {/if}

      <!-- nft holding table -->
      {#if $tab === "nft"}
        <div class="flex flex-col gap-4">
          <div class="flex justify-between items-center">
            <div
              class="xl:order-1 order-2 flex items-center justify-end gap-2 text-[#666666]"
            >
              <div class="text-sm font-regular text-gray-400">
                {$t("Hide Scam Collections")}
              </div>
              <label class="switch" for="switch">
                <input type="checkbox" id="switch" bind:checked={checkScam} />
                <span class="slider" />
              </label>
            </div>

            <div
              class="xl:order-2 order-1 flex items-center xl:justify-end justify-start gap-2"
            >
              <div class="xl:block hidden text-sm font-regular text-gray-400">
                {$t("Hide NFT Collections less than")}
              </div>
              <div class="xl:block hidden">
                <Select
                  type="filter"
                  positionSelectList="right-0"
                  listSelect={filterTokenValueType}
                  bind:selected={filterNFTType}
                  isDisabledSelectWallet={false}
                  indexWalletDisabled={-1}
                />
              </div>
              <div class="xl:hidden block">
                <Select
                  type="filter"
                  positionSelectList="left-0"
                  listSelect={filterTokenValueType}
                  bind:selected={filterNFTType}
                  isDisabledSelectWallet={false}
                  indexWalletDisabled={-1}
                />
              </div>
            </div>
          </div>

          <HoldingNFT
            {checkScam}
            {filterNFTType}
            defaultData={defaultDataHoldingNFT}
            dataNftHolding={formatDataNFT}
            isLoading={isLoadingNFT}
            {handleUpdateTotalNftHolding}
          />

          <button
            class="hover:text-blue-500 underline cursor-pointer text-left w-max text-sm"
            data-featurebase-feedback
          >
            {$t("Report Incorrect data")}
          </button>
        </div>
      {/if}
    </div>
  </ErrorBoundary>
</div>

<style>
  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    border-radius: 34px;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 2px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    border-radius: 50%;
  }
  input:checked + .slider {
    background-color: #2196f3;
  }
  input:checked + .slider {
    box-shadow: 0 0 1px #2196f3;
  }
  input:checked + .slider:before {
    -webkit-transform: translateX(16px);
    -ms-transform: translateX(16px);
    transform: translateX(16px);
  }

  @media screen and (max-width: 1280px) {
    .switch {
      width: 60px;
      height: 30px;
    }

    .slider {
      border-radius: 44px;
    }

    .slider:before {
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 2px;
    }

    input:checked + .slider:before {
      -webkit-transform: translateX(26px);
      -ms-transform: translateX(26px);
      transform: translateX(26px);
    }
  }
</style>
