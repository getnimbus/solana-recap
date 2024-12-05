<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import { groupBy } from "lodash";
  import { createQuery } from "@tanstack/svelte-query";
  import { getVirtualPortfolioProfile } from "~/lib/queryAPI";
  import { t } from "~/lib/i18n";

  export let virtualPortfolioId;
  export let wallet;
  export let isLoading;
  export let listTokenHolding;
  export let listTokenHistoryChanges;

  import Loading from "~/components/Loading.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";

  import TrendUp from "~/assets/trend-up.svg";
  import TrendDown from "~/assets/trend-down.svg";

  let sumTokens = 0;
  let totalChanges = 0;
  let selectedDataOverview: any = {};

  $: {
    if (listTokenHolding && listTokenHolding.length !== 0) {
      const filteredHoldingDataToken = listTokenHolding.filter(
        (item: any) => item.value > 1,
      );
      sumTokens = filteredHoldingDataToken.reduce(
        (prev: any, item: any) => prev + Number(item?.value),
        0,
      );
    }
  }

  $: {
    if (listTokenHolding && listTokenHolding.length !== 0) {
      const groupByChangesVersion = groupBy(listTokenHistoryChanges, "version");
      totalChanges = Object.keys(groupByChangesVersion).length;
    }
  }

  $: queryVirtualPortfolioProfile = createQuery({
    queryKey: ["virtual-portfolio-profile", wallet],
    queryFn: () => getVirtualPortfolioProfile(wallet),
    retry: false,
  });

  $: {
    if (
      !$queryVirtualPortfolioProfile?.isError &&
      $queryVirtualPortfolioProfile?.data !== undefined
    ) {
      const selectedData = (
        $queryVirtualPortfolioProfile?.data?.data || []
      )?.find((item: any) => item.id === virtualPortfolioId);

      const realizedProfit =
        Number(selectedData?.current_networth) -
        Number(selectedData?.initial_networth);

      const percentRealizeProfit =
        ((Number(selectedData?.current_networth) -
          Number(selectedData?.initial_networth)) /
          Number(selectedData?.initial_networth)) *
        100;

      selectedDataOverview = {
        ...selectedData,
        realizedProfit,
        percentRealizeProfit,
      };
    }
  }
</script>

<div
  class="border border_0000001a rounded-xl xl:p-6 p-3 xl:h-[98px] overflow-hidden xl:mt-0 mt-4"
>
  {#if isLoading}
    <div class="h-full flex items-center justify-center">
      {#if isNimbusVersion}
        <LoadingPremium />
      {:else}
        <Loading />
      {/if}
    </div>
  {:else}
    <div class="grid xl:grid-cols-8 md:grid-cols-4 grid-cols-2 gap-5">
      <div class="flex flex-col gap-2 justify-between">
        <div class="text-sm font-medium text_00000099">
          {$t("Initial Investment")}
        </div>
        <div class="text-sm font-medium">
          <TooltipNumber
            number={selectedDataOverview?.initial_networth}
            type="value"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2 justify-between">
        <div class="text-sm font-medium text_00000099">
          {$t("Current Value")}
        </div>
        <div class="text-sm font-medium">
          <TooltipNumber number={sumTokens} type="value" />
        </div>
      </div>

      <div class="flex flex-col gap-2 justify-between">
        <div class="text-sm font-medium text_00000099">
          1D {$t("Performance")}
        </div>
        <div
          class={`flex items-center text-sm font-medium ${
            selectedDataOverview?.change_1d === 0
              ? ""
              : selectedDataOverview?.change_1d >= 0
                ? "text-[#00A878]"
                : "text-red-500"
          }`}
        >
          <TooltipNumber
            number={Math.abs(Number(selectedDataOverview?.change_1d))}
            type={Math.abs(Number(selectedDataOverview?.change_1d)) > 999999
              ? "balance"
              : "percent"}
          />%
          {#if selectedDataOverview?.change_1d !== 0}
            <img
              src={selectedDataOverview?.change_1d >= 0 ? TrendUp : TrendDown}
              alt="trend"
              class="ml-1 mb-1 w-4 h-4"
            />
          {/if}
        </div>
      </div>

      <div class="flex flex-col gap-2 justify-between">
        <div class="text-sm font-medium text_00000099">
          1W {$t("Performance")}
        </div>
        <div
          class={`flex items-center text-sm font-medium ${
            selectedDataOverview?.change_1w === 0
              ? ""
              : selectedDataOverview?.change_1w >= 0
                ? "text-[#00A878]"
                : "text-red-500"
          }`}
        >
          <TooltipNumber
            number={Math.abs(Number(selectedDataOverview?.change_1w))}
            type={Math.abs(Number(selectedDataOverview?.change_1w)) > 999999
              ? "balance"
              : "percent"}
          />%
          {#if selectedDataOverview?.change_1w !== 0}
            <img
              src={selectedDataOverview?.change_1w >= 0 ? TrendUp : TrendDown}
              alt="trend"
              class="ml-1 mb-1 w-4 h-4"
            />
          {/if}
        </div>
      </div>

      <div class="flex flex-col gap-2 justify-between">
        <div class="text-sm font-medium text_00000099">
          1M {$t("Performance")}
        </div>
        <div
          class={`flex items-center text-sm font-medium ${
            selectedDataOverview?.change_1m === 0
              ? ""
              : selectedDataOverview?.change_1m >= 0
                ? "text-[#00A878]"
                : "text-red-500"
          }`}
        >
          <TooltipNumber
            number={Math.abs(Number(selectedDataOverview?.change_1m))}
            type={Math.abs(Number(selectedDataOverview?.change_1m)) > 999999
              ? "balance"
              : "percent"}
          />%
          {#if selectedDataOverview?.change_1m !== 0}
            <img
              src={selectedDataOverview?.change_1m >= 0 ? TrendUp : TrendDown}
              alt="trend"
              class="ml-1 mb-1 w-4 h-4"
            />
          {/if}
        </div>
      </div>

      <div class="flex flex-col gap-2 justify-between">
        <div class="text-sm font-medium text_00000099">ROI</div>
        <div
          class={`flex items-center text-sm font-medium ${
            selectedDataOverview?.realizedProfit === 0
              ? ""
              : selectedDataOverview?.realizedProfit >= 0
                ? "text-[#00A878]"
                : "text-red-500"
          }`}
        >
          <TooltipNumber
            number={Math.abs(
              Number(selectedDataOverview?.percentRealizeProfit),
            )}
            type={Math.abs(Number(selectedDataOverview?.realizedProfit)) >
            999999
              ? "balance"
              : "percent"}
          />%
          {#if selectedDataOverview?.realizedProfit !== 0}
            <img
              src={selectedDataOverview?.realizedProfit >= 0
                ? TrendUp
                : TrendDown}
              alt="trend"
              class="ml-1 mb-1 w-4 h-4"
            />
          {/if}
        </div>
      </div>

      <div class="flex flex-col gap-2 justify-between">
        <div class="text-sm font-medium text_00000099">
          {$t("Max Drawdown")}
        </div>
        <div
          class={`flex items-center text-sm font-medium ${
            selectedDataOverview?.max_drawdown === 0
              ? ""
              : selectedDataOverview?.max_drawdown >= 0
                ? "text-[#00A878]"
                : "text-red-500"
          }`}
        >
          <TooltipNumber
            number={Math.abs(Number(selectedDataOverview?.max_drawdown))}
            type={Math.abs(Number(selectedDataOverview?.max_drawdown)) > 999999
              ? "balance"
              : "percent"}
          />%
          {#if selectedDataOverview?.max_drawdown !== 0}
            <img
              src={selectedDataOverview?.max_drawdown >= 0
                ? TrendUp
                : TrendDown}
              alt="trend"
              class="ml-1 mb-1 w-4 h-4"
            />
          {/if}
        </div>
      </div>

      <div class="flex flex-col gap-2 justify-between">
        <div class="text-sm font-medium text_00000099">
          {$t("Total Rebalance")}
        </div>
        <div class="text-sm font-medium">
          {totalChanges}
        </div>
      </div>
    </div>
  {/if}
</div>

<style></style>
