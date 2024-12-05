<script lang="ts">
  import { nimbus } from "~/lib/network";
  import {
    isHidePortfolio,
    totalTokens,
    totalNfts,
    totalAirdrops,
    totalPositions,
    unrealizedProfit,
    realizedProfit,
    wallet,
    chain,
    tab,
    isDarkMode,
    typeWallet,
  } from "~/store";
  import { createQuery } from "@tanstack/svelte-query";
  import { getOverview, handleValidateAddress } from "~/lib/queryAPI";
  import { groupBy } from "lodash";
  import { t } from "~/lib/i18n";

  import CountUpNumber from "~/components/CountUpNumber.svelte";
  import OverviewCard from "~/components/OverviewCard.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import ErrorBoundary from "~/components/ErrorBoundary.svelte";
  import OverviewToken from "./OverviewToken.svelte";
  import OverviewNft from "./OverviewNft.svelte";

  export let enabledFetchAllData;
  export let handleSelectedTableTokenHolding = (
    data: any,
    selectDataPieChart: any,
  ) => {};

  let data: any = {
    overview: {
      assets: 0,
      assetsChange: 0,
      change: "",
      claimable: 0,
      claimableChange: 0,
      debts: 0,
      debtsChange: 0,
      networth: 0,
      networthChange: 0,
      postionNetworth: 0,
      postionNetworthChange: 0,
    },
  };
  let nativeToken: any = {};
  let dataPersonalizeTag: any = [];

  const getPersonalizeTag = async () => {
    try {
      const response: any = await nimbus.get(
        `/address/${$wallet}/personalize/tag`,
      );
      if (response && response.data) {
        const categoriesData = Object.getOwnPropertyNames(response.data);
        const categoriesDataList = categoriesData?.map((item) => {
          return {
            category: item,
            dataTag: groupBy(response.data[item], "tag"),
          };
        });
        const formatDataCategory = categoriesDataList?.map((item) => {
          return {
            category: item.category,
            dataTag: Object.getOwnPropertyNames(item.dataTag)?.map((tag) => {
              return {
                name: tag,
                tokens: item.dataTag[tag],
              };
            }),
          };
        });

        dataPersonalizeTag = formatDataCategory;
      }
    } catch (e) {
      console.error("e: ", e);
    }
  };

  $: queryValidate = createQuery({
    queryKey: ["validate", $wallet],
    queryFn: () => handleValidateAddress($wallet),
    retry: false,
    enabled: Boolean($wallet && $wallet?.length !== 0),
  });

  $: queryOverview = createQuery({
    queryKey: ["overview", $wallet, $chain],
    queryFn: () => getOverview($wallet, $chain, $queryValidate.data),
    enabled: Boolean(
      enabledFetchAllData &&
        $wallet &&
        $wallet?.length !== 0 &&
        !$queryValidate.isFetching,
    ),
  });

  $: {
    if (!$queryOverview.isError && $queryOverview.data !== undefined) {
      data = $queryOverview.data;
      nativeToken = $queryOverview.data?.nativeToken;
    }
  }

  $: {
    if ($wallet || $chain) {
      if (
        $wallet?.length !== 0 &&
        $chain?.length !== 0 &&
        !$queryValidate.isFetching
      ) {
        dataPersonalizeTag = [];
        data = {
          overview: {
            assets: 0,
            assetsChange: 0,
            change: "",
            claimable: 0,
            claimableChange: 0,
            debts: 0,
            debtsChange: 0,
            networth: 0,
            networthChange: 0,
            postionNetworth: 0,
            postionNetworthChange: 0,
          },
        };
        getPersonalizeTag();
      }
    }
  }

  $: totalNetWorth =
    $tab === "token"
      ? $totalTokens
      : $tab === "nft"
        ? $totalNfts
        : $totalTokens + $totalNfts + $totalPositions + $totalAirdrops;

  $: totalPnl = $realizedProfit + $unrealizedProfit;

  $: isLoading = $queryOverview.isLoading;

  $: nativeTokenAmount =
    nativeToken?.price !== 0 ? totalNetWorth / nativeToken?.price : 0;

  $: nativeTokenSymbol = nativeToken?.symbol || "";
</script>

<ErrorBoundary>
  <div class="grid xl:grid-cols-2 grid-cols-1 xl:gap-6 gap-4">
    {#if $tab === "token" || $tab === "nft"}
      <div class="grid grid-cols-2 xl:gap-6 gap-4">
        <OverviewCard title={$t("Net Worth")} isDetail={false}>
          <span slot="number" class="flex items-center">
            <CountUpNumber number={totalNetWorth} type="value" personalValue />
          </span>

          <span slot="sub-number">
            {#if ["ECLIPSE", "SOL"].includes($typeWallet) || ["MOVE", "SUI"].includes($typeWallet)}
              <div>
                {#if $chain !== "ALL"}
                  <div class="flex items-center gap-1">
                    <CountUpNumber
                      number={nativeTokenAmount || 0}
                      type="balance"
                      personalValue
                    />
                    {#if nativeTokenSymbol}
                      {nativeTokenSymbol || ""}
                    {/if}
                  </div>
                {/if}
              </div>
            {:else}
              <div>
                {#if $typeWallet !== "BUNDLE"}
                  <div class="flex items-center gap-1">
                    <CountUpNumber
                      number={nativeTokenAmount || 0}
                      type="balance"
                      personalValue
                    />
                    {#if nativeTokenSymbol}
                      {nativeTokenSymbol || ""}
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          </span>

          <!-- <span slot="sub-number">
            <div
              class={`flex items-center gap-3 ${
                $typeWallet === "BTC" ? "opacity-50" : ""
              }`}
            >
              <div
                class={`flex text-lg font-medium ${
                  data?.overview?.networthChange < 0
                    ? "text-red-500"
                    : "text-[#00A878]"
                }`}
              >
                {#if data?.overview?.networthChange < 0}
                  ↓
                {:else}
                  ↑
                {/if}
                <CountUpNumber
                  number={Math.abs(data?.overview?.networthChange || 0)}
                  type="percent"
                />%
              </div>
              <div class="font-medium text_00000066 text-base">24h</div>
            </div>
          </span> -->
        </OverviewCard>

        <OverviewCard title={$t("Profit & Loss")} isDetail={false}>
          <span slot="number" class="flex items-center">
            {#if totalPnl.toString().toLowerCase().includes("e-")}
              $<TooltipNumber number={totalPnl} type="balance" personalValue />
            {:else}
              <span>
                {#if totalPnl < 0 && !$isHidePortfolio}
                  -
                {/if}
              </span>
              <CountUpNumber
                number={Math.abs(totalPnl || 0)}
                type="value"
                personalValue
              />
            {/if}
          </span>
          <span slot="sub-number">
            <!-- <div
            class={`flex items-center gap-3 ${
              ["BTC", "SOL", "NEAR", "TON", "AURA", "ALGO"].includes(
                $typeWallet,
              )
                ? "opacity-50"
                : ""
            }`}
          >
            <div
              class={`flex text-lg font-medium ${
                data?.overview?.cumulativeInflow < 0
                  ? "text-red-500"
                  : "text-[#00A878]"
              }`}
            >
              {#if data?.overview?.cumulativeInflowChange < 0}
                ↓
              {:else}
                ↑
              {/if}
              <CountUpNumber
                number={Math.abs(data?.overview?.cumulativeInflowChange)}
                type="percent"
              />%
            </div>
            <div class="font-medium text_00000066 text-base">24h</div>
          </div> -->
          </span>
        </OverviewCard>
      </div>

      <div
        class={`view-the-chart-allocation rounded-[20px] lg:py-4 py-3 border border_0000001a lg:px-6 px-3 ${
          $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
        }`}
      >
        {#if $tab === "token"}
          <OverviewToken
            {enabledFetchAllData}
            {isLoading}
            {dataPersonalizeTag}
            {handleSelectedTableTokenHolding}
          />
        {/if}

        {#if $tab === "nft"}
          <OverviewNft {enabledFetchAllData} {isLoading} />
        {/if}
      </div>
    {/if}

    <!-- {#if $tab === "airdrops"}
      <OverviewCard title="Net Worth Airdrops" isDetail={false}>
        <span slot="number" class="flex items-center">
          <CountUpNumber number={$totalAirdrops} type="value" personalValue />
        </span>

        <span slot="sub-number">
          <div
            class={`flex items-center gap-3 ${
              $typeWallet === "BTC" ? "opacity-50" : ""
            }`}
          >
            <div
              class={`flex text-lg font-medium ${
                data?.overview?.networthChange < 0
                  ? "text-red-500"
                  : "text-[#00A878]"
              }`}
            >
              {#if data?.overview?.networthChange < 0}
                ↓
              {:else}
                ↑
              {/if}
              <CountUpNumber
                number={Math.abs(data?.overview?.networthChange || 0)}
                type="percent"
              />%
            </div>
            <div class="font-medium text_00000066 text-base">24h</div>
          </div>
        </span>
      </OverviewCard>
    {/if} -->
  </div>
</ErrorBoundary>

<style>
</style>
