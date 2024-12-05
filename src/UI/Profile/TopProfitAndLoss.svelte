<script lang="ts">
  import { createQueries, createQuery } from "@tanstack/svelte-query";
  import CopyToClipboard from "svelte-copy-to-clipboard";
  import dayjs from "dayjs";
  import { isDarkMode, typeWallet, chain, unrealizedProfit } from "~/store";
  import { shorterAddress, shorterName, wait } from "~/utils/index";
  import {
    chainList,
    chainMoveList,
    chainSolList,
    detectedChain,
  } from "~/lib/chains";
  import {
    getTradingStats,
    getHoldingToken,
    handleValidateAddress,
  } from "~/lib/queryAPI";
  import { t } from "~/lib/i18n";
  import { isNimbusVersion } from "~/utils/constants";
  import { flatten } from "lodash";
  import {
    calculatePnL,
    calculateRealizedProfit,
    calculateUnrealizedProfit,
  } from "~/utils/functions";

  import Loading from "~/components/Loading.svelte";
  import Image from "~/components/Image.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import OverlaySidebar from "~/components/OverlaySidebar.svelte";
  import Tooltip from "~/components/Tooltip.svelte";
  import TokenDetailSidebar from "../TokenDetail/TokenDetailSidebar.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let selectedAddress;
  export let isSync = false;
  export let enabledFetchAllData = false;

  let showSideTokenDetail = false;
  let selectedTokenDetail: any;
  let isShowTooltipContractAddress = false;
  let isCopied = false;
  let isShowTooltipSymbol = false;
  let isShowTooltipName = false;

  let topProfitToken: any = [];
  let topLossToken: any = [];

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

  $: queryTradingStats = createQuery({
    queryKey: ["trading-stats", selectedAddress],
    queryFn: () => getTradingStats(selectedAddress),
    retry: false,
    enabled: Boolean(selectedAddress?.length !== 0 && isFetch),
  });

  const formatDataTradingStats = (dataTokenHolding: any, data: any) => {
    const formatMetaData = data.metadata?.map((item: any) => {
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
          profit: {
            ...item.holding.profit,
            // unrealizedProfit: item?.unrealizedProfit || 0, // TODO: Show only realized profit on this page
          },
          value:
            Number(item?.holding?.amount || 0) *
            Number(item?.holding?.price?.price || item?.holding?.rate),
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

    const dataNormalize = formatData
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

        return {
          ...item,
          realizedProfit: realizedProfit.profit,
          unrealizedProfit: unrealizedProfit.profit,
          pnl: realizedProfit.profit + unrealizedProfit.profit,
        };
      });

    topProfitToken = dataNormalize
      ?.filter((item: any) => item.pnl >= 0)
      ?.sort((a: any, b: any) => b.pnl - a.pnl);

    topLossToken = dataNormalize
      ?.filter((item: any) => item.pnl < 0)
      ?.sort((a: any, b: any) => a.pnl - b.pnl);

    // topProfitToken = listProfitToken.sort(
    //   (a: any, b: any) => b.realizedProfit - a.realizedProfit,
    // );

    // topLossToken = listLossToken.sort(
    //   (a: any, b: any) => a.realizedProfit - b.realizedProfit,
    // );
  };

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
        formatDataTradingStats(allTokens, $queryTradingStats.data);
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
      formatDataTradingStats($queryTokenHolding?.data, $queryTradingStats.data);
    }
  }
</script>

<div class="col-span-4 grid xl:grid-cols-2 grid-cols-1 gap-5">
  <div
    class="flex flex-col gap-5 xl:border border_0000001a rounded-xl xl:pt-6 xl:pb-2"
  >
    <div class="text-xl font-medium lg:px-3">{$t("Top Profit (30D)")}</div>

    <div
      class={`max-h-[280px] ${$queryTradingStats.isFetching ? "xl:h-[92px]" : ""}`}
    >
      {#if $queryTradingStats.isFetching}
        <div class="h-full flex justify-center items-center py-4">
          {#if isNimbusVersion}
            <LoadingPremium />
          {:else}
            <Loading />
          {/if}
        </div>
      {:else}
        <div class="h-full overflow-y-auto">
          <div class="h-full flex flex-col">
            {#if topProfitToken.length === 0}
              <div
                class="h-full flex items-center justify-center text-center py-4 lg:px-3"
              >
                {$t(
                  "There have been no closed holding positions in the last 30 day",
                )}
              </div>
            {:else}
              {#each topProfitToken as item}
                <div
                  class={`flex items-center justify-between gap-2 py-2 lg:px-3 cursor-pointer ${
                    $isDarkMode
                      ? "bg-[#131313] hover:bg-[#000]"
                      : "bg-white hover:bg-gray-100"
                  }`}
                  on:click={() => {
                    showSideTokenDetail = true;
                    selectedTokenDetail = item;
                  }}
                >
                  <div class="flex-1 flex items-center gap-2">
                    <div class="w-[30px] h-[30px] overflow-hidden rounded-full">
                      <Image logo={item?.logo} defaultLogo={defaultToken} />
                    </div>
                    <span class="flex flex-col">
                      <span class="text-sm font-medium">
                        {item.name}
                      </span>
                      <span class="font-medium text_00000080 text-xs">
                        {#if item.symbol === undefined}
                          N/A
                        {:else}
                          {shorterName(item.symbol, 20)}
                        {/if}
                      </span>
                    </span>
                  </div>
                  <div class="text-[#00A878] text-sm font-medium">
                    <TooltipNumber number={item.pnl} type="value" />
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div
    class="flex flex-col gap-5 xl:border border_0000001a xl:rounded-xl xl:pt-6 xl:pb-2"
  >
    <div class="text-xl font-medium lg:px-3">{$t("Top Loss (30D)")}</div>

    <div
      class={`max-h-[280px] ${$queryTradingStats.isFetching ? "xl:h-[92px]" : ""}`}
    >
      {#if $queryTradingStats.isLoading}
        <div class="h-full flex justify-center items-center py-4">
          {#if isNimbusVersion}
            <LoadingPremium />
          {:else}
            <Loading />
          {/if}
        </div>
      {:else}
        <div class="h-full overflow-y-auto">
          <div class="h-full flex flex-col">
            {#if topLossToken.length === 0}
              <div
                class="h-full flex items-center justify-center text-center py-4 lg:px-3"
              >
                {$t(
                  "There have been no closed holding positions in the last 30 day",
                )}
              </div>
            {:else}
              {#each topLossToken as item}
                <div
                  class={`flex items-center justify-between gap-2 py-2 lg:px-3 cursor-pointer ${
                    $isDarkMode
                      ? "bg-[#131313] hover:bg-[#000]"
                      : "bg-white hover:bg-gray-100"
                  }`}
                  on:click={() => {
                    showSideTokenDetail = true;
                    selectedTokenDetail = item;
                  }}
                >
                  <div class="flex-1 flex items-center gap-2">
                    <div class="w-[30px] h-[30px] overflow-hidden rounded-full">
                      <Image logo={item?.logo} defaultLogo={defaultToken} />
                    </div>
                    <span class="flex flex-col">
                      <span class="text-sm font-medium">
                        {item.name}
                      </span>
                      <span class="font-medium text_00000080 text-xs">
                        {#if item.symbol === undefined}
                          N/A
                        {:else}
                          {shorterName(item.symbol, 20)}
                        {/if}
                      </span>
                    </span>
                  </div>
                  <div class="text-red-500 text-sm font-medium">
                    <TooltipNumber number={item.pnl} type="value" />
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Sidebar Token Detail -->
<OverlaySidebar isOpen={showSideTokenDetail}>
  <div class="flex justify-between items-start">
    <div
      class="text-5xl text-gray-500 cursor-pointer"
      on:click|stopPropagation={() => {
        showSideTokenDetail = false;
        selectedTokenDetail = {};
      }}
    >
      &times;
    </div>
    {#if selectedTokenDetail && Object.keys(selectedTokenDetail).length !== 0}
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-4">
          <div class="relative">
            <div class="rounded-full w-[46px] h-[46px] overflow-hidden">
              <Image
                logo={selectedTokenDetail.logo}
                defaultLogo={defaultToken}
              />
            </div>
            {#if ["EVM", "MOVE", "BUNDLE"].includes($typeWallet)}
              <div class="absolute -top-2 -right-1">
                <img
                  src={detectedChain(selectedTokenDetail?.chain)?.logo}
                  alt=""
                  width="26"
                  height="26"
                  class="rounded-full block"
                />
              </div>
            {/if}
          </div>
          <div class="flex flex-col">
            <div class="flex items-start gap-2">
              <div
                class="relative font-medium text-xl"
                on:mouseover={() => {
                  isShowTooltipName = true;
                }}
                on:mouseleave={() => (isShowTooltipName = false)}
              >
                {#if selectedTokenDetail.name === undefined}
                  N/A
                {:else}
                  {selectedTokenDetail?.name?.length > 20
                    ? shorterName(selectedTokenDetail.name, 20)
                    : selectedTokenDetail.name}
                {/if}
                {#if isShowTooltipName && selectedTokenDetail?.name?.length > 20}
                  <div
                    class="absolute left-0 -top-8"
                    style="z-index: 2147483648;"
                  >
                    <Tooltip text={selectedTokenDetail.name} />
                  </div>
                {/if}
              </div>
            </div>

            <div class="flex items-center gap-2">
              <div
                class="relative font-medium text_00000080 text-base"
                on:mouseover={() => {
                  isShowTooltipSymbol = true;
                }}
                on:mouseleave={() => (isShowTooltipSymbol = false)}
              >
                {#if selectedTokenDetail.symbol === undefined}
                  N/A
                {:else}
                  {shorterName(selectedTokenDetail.symbol, 20)}
                {/if}
                {#if isShowTooltipSymbol && selectedTokenDetail.symbol.length > 20}
                  <div
                    class="absolute left-0 -top-8"
                    style="z-index: 2147483648;"
                  >
                    <Tooltip text={selectedTokenDetail.symbol} />
                  </div>
                {/if}
              </div>
              <CopyToClipboard
                text={selectedTokenDetail?.contractAddress}
                let:copy
                on:copy={async () => {
                  isCopied = true;
                  await wait(1000);
                  isCopied = false;
                }}
              >
                <div
                  class="cursor-pointer relative"
                  on:mouseover={() => {
                    isShowTooltipContractAddress = true;
                  }}
                  on:mouseleave={() => (isShowTooltipContractAddress = false)}
                  on:click={copy}
                >
                  {#if isCopied}
                    <svg
                      width={20}
                      height={20}
                      id="Layer_1"
                      data-name="Layer 1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 122.88 74.46"
                      fill={$isDarkMode ? "#d1d5db" : "#00000080"}
                      ><path
                        fill-rule="evenodd"
                        d="M1.87,47.2a6.33,6.33,0,1,1,8.92-9c8.88,8.85,17.53,17.66,26.53,26.45l-3.76,4.45-.35.37a6.33,6.33,0,0,1-8.95,0L1.87,47.2ZM30,43.55a6.33,6.33,0,1,1,8.82-9.07l25,24.38L111.64,2.29c5.37-6.35,15,1.84,9.66,8.18L69.07,72.22l-.3.33a6.33,6.33,0,0,1-8.95.12L30,43.55Zm28.76-4.21-.31.33-9.07-8.85L71.67,4.42c5.37-6.35,15,1.83,9.67,8.18L58.74,39.34Z"
                      /></svg
                    >
                  {:else}
                    <svg
                      width={20}
                      height={20}
                      viewBox="0 0 12 11"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8.1875 3.3125H10.6875V10.1875H3.8125V7.6875"
                        stroke={$isDarkMode ? "#d1d5db" : "#00000080"}
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M8.1875 0.8125H1.3125V7.6875H8.1875V0.8125Z"
                        stroke={$isDarkMode ? "#d1d5db" : "#00000080"}
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  {/if}

                  {#if isShowTooltipContractAddress}
                    <div
                      class="absolute right-0 -top-8"
                      style="z-index: 2147483648;"
                    >
                      <Tooltip
                        text={shorterAddress(
                          selectedTokenDetail?.contractAddress,
                        )}
                      />
                    </div>
                  {/if}
                </div>
              </CopyToClipboard>
            </div>
          </div>
        </div>
        <div class="flex items-center font-medium text-2xl">
          $<TooltipNumber
            number={Number(selectedTokenDetail?.price)}
            type="balance"
          />
        </div>
      </div>
    {/if}
  </div>
  {#if showSideTokenDetail}
    <TokenDetailSidebar
      data={{
        ...selectedTokenDetail,
        market_price: selectedTokenDetail?.price,
      }}
      {showSideTokenDetail}
    />
  {/if}
</OverlaySidebar>

<style></style>
