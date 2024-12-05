<script lang="ts">
  import {
    typeWallet,
    wallet,
    chain,
    tab,
    isDarkMode,
    totalPositions,
    pastProfit,
    isHidePortfolio,
  } from "~/store";
  import { createQueries, createQuery } from "@tanstack/svelte-query";
  import {
    handleValidateAddress,
    getPositionList,
    getPositions,
    getOverview,
  } from "~/lib/queryAPI";
  import {
    DEFIChainSupported,
    formatDataProtocol,
  } from "./Defi/DefiPosition/utils";
  import { flatten, groupBy } from "lodash";
  import { isNimbusVersion } from "~/utils/constants";
  import { t } from "~/lib/i18n";

  import Loading from "~/components/Loading.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import OverviewCard from "~/components/OverviewCard.svelte";
  import CountUpNumber from "~/components/CountUpNumber.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Positions from "./Defi/Positions.svelte";
  import OverviewDeFiChart from "./OverviewDeFiChart.svelte";

  let positionsData: any = [];

  $: queryValidate = createQuery({
    queryKey: ["validate", $wallet],
    queryFn: () => handleValidateAddress($wallet),
    retry: false,
    enabled: Boolean($wallet && $wallet?.length !== 0),
  });

  $: queryPositionList = createQuery({
    queryKey: ["position-list", $wallet, $chain],
    queryFn: () => getPositionList($wallet, $chain),
    enabled: Boolean(
      $wallet &&
        $wallet?.length !== 0 &&
        !$queryValidate.isFetching &&
        $tab === "defi" &&
        DEFIChainSupported.includes($typeWallet),
    ),
  });

  $: positionListQueries =
    !$queryPositionList.isError && $queryPositionList.data !== undefined
      ? $queryPositionList.data
      : [];

  $: queryAllPositions = createQueries(
    positionListQueries?.map((item: any) => {
      return {
        queryKey: ["positions", $wallet, item],
        queryFn: () => getPositions($wallet, item),
        retry: true,
        enabled: Boolean(
          positionListQueries &&
            positionListQueries.length !== 0 &&
            $wallet &&
            $wallet?.length !== 0 &&
            !$queryValidate.isFetching &&
            $tab === "defi" &&
            DEFIChainSupported.includes($typeWallet),
        ),
      };
    }),
  );

  $: {
    if ($queryAllPositions && $queryAllPositions.length !== 0) {
      const allData = flatten(
        $queryAllPositions
          ?.filter((item) => Array.isArray(item.data))
          ?.map((item) => item.data),
      )?.filter((item: any) => item.positionId);

      const seen = new Set();
      const uniqueAllData = allData.filter((item: any) => {
        const duplicate = seen.has(item.positionId);
        seen.add(item.positionId);
        return !duplicate;
      });

      if (allData && allData.length !== 0) {
        handleFormatData(uniqueAllData);
      }
    }
  }

  const handleFormatData = (data: any) => {
    try {
      const groupByDataChain = groupBy(data, "chain");
      positionsData = flatten(
        Object.keys(groupByDataChain).map((item) => {
          return formatDataProtocol(groupByDataChain[item]);
        }),
      )?.sort((a: any, b: any) => b.sum - a.sum);
    } catch (e) {
      console.error("error", e);
    }
  };

  $: filterPositionData =
    $typeWallet === "EVM"
      ? $chain === "ALL"
        ? positionsData
        : positionsData?.filter((item: any) => item.chain === $chain)
      : positionsData;

  $: {
    if (filterPositionData) {
      const sum = filterPositionData?.reduce((prev: any, item: any) => {
        return prev + Number(item.sum);
      }, 0);

      const sumYield = filterPositionData?.reduce((prev: any, item: any) => {
        return prev + Number(item.sumYield);
      }, 0);

      totalPositions.update((n) => (n = sum));
      pastProfit.update((n) => (n = sumYield));
    }
  }

  let nativeToken: any = {};

  $: queryOverview = createQuery({
    queryKey: ["overview", $wallet, $chain],
    queryFn: () => getOverview($wallet, $chain, $queryValidate.data),
    enabled: Boolean(
      $wallet && $wallet?.length !== 0 && !$queryValidate.isFetching,
    ),
  });

  $: isLoading =
    $queryAllPositions.some((item: any) => item.isLoading === true) ||
    $queryPositionList.isLoading;

  $: {
    if (!$queryOverview.isError && $queryOverview.data !== undefined) {
      nativeToken = $queryOverview.data?.nativeToken;
    }
  }

  $: nativeTokenAmount =
    nativeToken?.price !== 0 ? $totalPositions / nativeToken?.price : 0;

  $: nativeTokenSymbol = nativeToken?.symbol || "";
</script>

<div class="grid xl:grid-cols-2 grid-cols-1 xl:gap-6 gap-4">
  <div class="grid grid-cols-2 xl:gap-6 gap-4">
    <OverviewCard title={$t("Net Worth")} isDetail={false}>
      <span slot="number" class="flex items-center">
        <CountUpNumber number={$totalPositions} type="value" personalValue />
      </span>
      <span slot="sub-number">
        <div class="flex items-center gap-1">
          <CountUpNumber
            number={nativeTokenAmount}
            type="balance"
            personalValue
          />
          {#if nativeTokenSymbol}
            {nativeTokenSymbol}
          {/if}
        </div>
      </span>
    </OverviewCard>

    <OverviewCard
      title={$t("Yield")}
      tooltipText="Total unclaimed fees and farming rewards."
      isTooltip
      isDetail={false}
    >
      <span slot="number" class="flex items-center">
        {#if $pastProfit.toString().toLowerCase().includes("e-")}
          $<TooltipNumber number={$pastProfit} type="balance" personalValue />
        {:else}
          <span>
            {#if $pastProfit < 0 && !$isHidePortfolio}
              -
            {/if}
          </span>
          <CountUpNumber
            number={Math.abs($pastProfit)}
            type="value"
            personalValue
          />
        {/if}
      </span>
    </OverviewCard>
  </div>

  <div
    class={`rounded-[20px] lg:py-4 py-3 border border_0000001a lg:px-6 px-3 ${
      $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
    }`}
  >
    <OverviewDeFiChart
      positionsData={filterPositionData}
      isLoading={$queryOverview.isLoading ||
        (isLoading && filterPositionData.length === 0)}
    />
  </div>
</div>

<div
  class={`flex flex-col gap-2 rounded-[20px] xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
    $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
  }`}
>
  <div class="text-2xl font-medium">{$t("Positions")}</div>

  {#if filterPositionData.length === 0 && !($queryOverview.isLoading || isLoading)}
    <div class="flex justify-center items-center min-h-[300px]">
      {$t("Empty")}
    </div>
  {:else}
    <div class="flex flex-col gap-6">
      {#each filterPositionData as item}
        <Positions data={item} chain={item?.chain} />
      {/each}
      {#if $queryOverview.isLoading || isLoading}
        <div class="flex justify-center items-center min-h-[300px]">
          {#if isNimbusVersion}
            <LoadingPremium />
          {:else}
            <Loading />
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <button
    class="hover:text-blue-500 underline cursor-pointer text-left w-max text-sm"
    data-featurebase-feedback
  >
    {$t("Report or request adding new protocol")}
  </button>
</div>

<style></style>
