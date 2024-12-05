<script lang="ts">
  import { createQueries, createQuery } from "@tanstack/svelte-query";
  import { formatBalance } from "~/utils/index";
  import { chain, typeWallet } from "~/store";
  import { getHoldingToken, handleValidateAddress } from "~/lib/queryAPI";
  import { t } from "~/lib/i18n";
  import { isNimbusVersion } from "~/utils/constants";
  import { chainList, chainMoveList, chainSolList } from "~/lib/chains";
  import { flatten } from "lodash";

  import Loading from "~/components/Loading.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";

  export let selectedAddress;
  export let isSync = false;
  export let enabledFetchAllData = false;

  $: isFetch = isSync ? enabledFetchAllData : true;

  let topThreeTokenHolding: any = [];
  let closedHoldingPosition: any = [];
  let netWorth = 0;

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
        ($chain !== "ALL" || ["MOVE", "SUI"].includes($typeWallet)), // We enable for MOVE that we only fetch SUI for now
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
            $chain === "ALL" &&
            $typeWallet !== "MOVE",
        ),
      };
    }),
  );

  $: {
    if ($queryAllTokenHolding.length !== 0) {
      const allTokens = flatten(
        $queryAllTokenHolding
          ?.filter((item) => Array.isArray(item.data))
          ?.map((item) => item.data),
      );
      if (allTokens && allTokens.length !== 0) {
        formatDataHoldingToken(allTokens);
      }
    }
  }

  $: {
    if (
      !$queryTokenHolding.isError &&
      $queryTokenHolding.data &&
      $queryTokenHolding?.data !== undefined
    ) {
      formatDataHoldingToken($queryTokenHolding.data);
    }
  }

  const formatDataHoldingToken = (dataTokenHolding: any) => {
    const data = dataTokenHolding?.filter(
      (item: any) =>
        Number(item?.amount) !== 0 && Number(item.price.price) !== 0,
    );

    const formatData = data.map((item: any) => {
      return {
        ...item,
        value: Number(item?.amount) * Number(item.price.price),
      };
    });

    closedHoldingPosition = dataTokenHolding
      ?.filter(
        (item: any) =>
          item?.profit?.realizedProfit !== undefined &&
          Number(item?.amount) === 0,
      )
      .sort(
        (a: any, b: any) =>
          Number(b?.profit.realizedProfit) - Number(a?.profit.realizedProfit),
      );

    netWorth = formatData.reduce(
      (prev: any, item: any) => prev + item.value,
      0,
    );

    const sortFormatToken = formatData.sort(
      (a: any, b: any) => b.value - a.value,
    );

    topThreeTokenHolding = sortFormatToken.slice(0, 3).map((item: any) => {
      return {
        ...item,
        ratio: (item.value / netWorth) * 100,
      };
    });
  };
</script>

<div class="xl:col-span-2 col-span-4 border border_0000001a rounded-xl">
  {#if $queryTokenHolding.isFetching}
    <div class="w-full h-full flex justify-center items-center p-6">
      {#if isNimbusVersion}
        <LoadingPremium />
      {:else}
        <Loading />
      {/if}
    </div>
  {:else}
    <div class="flex flex-col gap-3 p-6">
      {#if netWorth !== 0}
        <div>
          {$t("Your Portfolio is value at")}
          <span class="font-medium">
            ${formatBalance(netWorth)}
          </span>
          {$t("is diversified across")}
          {#each topThreeTokenHolding as item}
            <span class="font-medium">
              {item.name}
              (<TooltipNumber number={item.ratio} type="percent" />%),
            </span>{" "}
          {/each}
          {$t("and other assets")}.
        </div>
        {#if closedHoldingPosition.length !== 0 && closedHoldingPosition[0]?.profit?.realizedProfit > 0}
          <div>
            {$t("The best trading is")}
            <span class="font-medium">
              {closedHoldingPosition[0]?.name}
            </span>
            {$t("with")}
            <span class="font-medium text-green-400">
              ${formatBalance(closedHoldingPosition[0]?.profit?.realizedProfit)}
              {$t("earning")}
            </span>
          </div>
        {/if}
      {:else}
        <div>
          {$t("Your Portfolio is value at")}
          <span class="font-medium">
            ${formatBalance(netWorth)}
          </span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style></style>
