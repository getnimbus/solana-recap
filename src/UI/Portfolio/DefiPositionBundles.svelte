<script lang="ts">
  import {
    typeWallet,
    selectedBundle,
    isDarkMode,
    totalPositions,
    pastProfit,
    isHidePortfolio,
    chain,
  } from "~/store";
  import { getPositionList, getPositions } from "~/lib/queryAPI";
  import { flatten, groupBy } from "lodash";
  import { formatDataProtocol } from "./Defi/DefiPosition/utils";
  import { isNimbusVersion } from "~/utils/constants";
  import { t } from "~/lib/i18n";

  import Loading from "~/components/Loading.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import OverviewCard from "~/components/OverviewCard.svelte";
  import CountUpNumber from "~/components/CountUpNumber.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Positions from "./Defi/Positions.svelte";
  import OverviewDeFiChart from "./OverviewDeFiChart.svelte";

  let dataPositions: any = [];
  let formatDataPositions: any = [];
  let isLoading = false;

  const updateStateWithAPIResults = async (array: any) => {
    isLoading = true;

    // Define the API call function
    async function callAPI(item: any) {
      // Simulate an API call with a delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(`Result for ${item}`);
        }, 70);
      });
    }

    // Use a for...of loop with async/await to handle the API calls sequentially
    for (const item of array) {
      await callAPI(item);
    }

    isLoading = false;
  };

  const handleFormatDataPositionBundles = async (
    listBundleAddress: string[],
  ) => {
    const positionList = await Promise.all(
      (listBundleAddress || [])?.map(async (item) => {
        return {
          address: item,
          data: await getPositionList(item, $chain),
        };
      }),
    );

    const allPositions = flatten(
      (positionList || [])?.map((item) => item.data),
    );
    updateStateWithAPIResults(allPositions);

    positionList.forEach(async (item) => {
      await item?.data?.forEach(async (eachPosition: any) => {
        const positionDataResult =
          (await getPositions(item.address, eachPosition)) || [];

        dataPositions = [
          ...dataPositions,
          {
            positionName: eachPosition,
            positionDataResult,
          },
        ];
      });
    });
  };

  $: {
    if ($typeWallet === "BUNDLE") {
      const listAddressBundles = $selectedBundle?.accounts?.map(
        (item: any) => item.value,
      );
      handleFormatDataPositionBundles(listAddressBundles);
    }
  }

  $: {
    if (dataPositions && dataPositions.length !== 0) {
      const formatDataAllPosition = dataPositions
        ?.filter((eachItem: any) => Array.isArray(eachItem.positionDataResult))
        ?.map((item: any) => {
          return flatten(item.positionDataResult);
        });

      const flattenFormatDataAllPosition = flatten(
        formatDataAllPosition,
      )?.filter((item: any) => item.positionId);

      const seen = new Set();
      const uniqueFlattenFormatDataAllPosition =
        flattenFormatDataAllPosition.filter((item: any) => {
          const duplicate = seen.has(item.positionId);
          seen.add(item.positionId);
          return !duplicate;
        });

      const groupByDataChain = groupBy(
        uniqueFlattenFormatDataAllPosition,
        "chain",
      );

      handleFormatData(groupByDataChain);
    }
  }

  const handleFormatData = (data: any) => {
    try {
      formatDataPositions = flatten(
        Object.keys(data).map((item) => {
          return formatDataProtocol(data[item]);
        }),
      ).sort((a: any, b: any) => b.sum - a.sum);

      const sum = formatDataPositions?.reduce((prev: any, item: any) => {
        return prev + Number(item.sum);
      }, 0);

      const sumYield = formatDataPositions?.reduce((prev: any, item: any) => {
        return prev + Number(item.sumYield);
      }, 0);

      totalPositions.update((n) => (n = sum));
      pastProfit.update((n) => (n = sumYield));
    } catch (e) {
      console.error("error", e);
    }
  };
</script>

<div class="grid xl:grid-cols-2 grid-cols-1 xl:gap-6 gap-4">
  <div class="grid grid-cols-2 xl:gap-6 gap-4">
    <OverviewCard title={$t("Net Worth")} isDetail={false}>
      <span slot="number" class="flex items-center">
        <CountUpNumber number={$totalPositions} type="value" personalValue />
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
    <OverviewDeFiChart positionsData={formatDataPositions} {isLoading} />
  </div>
</div>

<div
  class={`flex flex-col gap-2 rounded-[20px] xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
    $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
  }`}
>
  <div class="text-2xl font-medium">{$t("Positions")}</div>

  {#if formatDataPositions.length === 0 && !isLoading}
    <div class="flex justify-center items-center min-h-[300px]">
      {$t("Empty")}
    </div>
  {:else}
    <div class="flex flex-col gap-6">
      {#each formatDataPositions || [] as item}
        <Positions data={item} chain={item?.chain} />
      {/each}
      {#if isLoading}
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
