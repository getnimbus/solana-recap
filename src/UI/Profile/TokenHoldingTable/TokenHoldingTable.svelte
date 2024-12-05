<script lang="ts">
  import {
    totalTokens,
    unrealizedProfit,
    realizedProfit,
    pastProfit,
    chain,
    typeWallet,
  } from "~/store";
  import { createQueries, createQuery } from "@tanstack/svelte-query";
  import { chainList, chainMoveList, chainSolList } from "~/lib/chains";
  import { flatten } from "lodash";
  import { handleValidateAddress, getHoldingToken } from "~/lib/queryAPI";
  import {
    calculatePnL,
    calculateRealizedProfit,
    calculateUnrealizedProfit,
  } from "~/utils/functions";

  import TokenHoldingTrades from "./TokenHoldingTrades.svelte";
  import ClosedHoldingTrades from "./ClosedHoldingTrades.svelte";
  import RuggedHoldingTrades from "./RuggedHoldingTrades.svelte";

  export let selectedAddress;
  export let isSync = false;
  export let enabledFetchAllData = false;

  let holdingTokenData: any = [];
  let closedHoldingPosition: any = [];
  let ruggedHoldingPosition: any = [];

  let sumTokens = 0;

  $: chainListQueries =
    $typeWallet?.length !== 0 && $typeWallet === "EVM"
      ? chainList.slice(1)?.map((item) => item.value)
      : $typeWallet?.length !== 0 && ["MOVE", "SUI"].includes($typeWallet)
        ? chainMoveList.slice(1)?.map((item) => item.value)
        : $typeWallet?.length !== 0 && ["ECLIPSE", "SOL"].includes($typeWallet)
          ? chainSolList.slice(1)?.map((item) => item.value)
          : [chainSolList[0]?.value];

  $: isFetch = isSync ? enabledFetchAllData : true;

  $: queryValidate = createQuery({
    queryKey: ["validate", selectedAddress],
    queryFn: () => handleValidateAddress(selectedAddress),
    retry: false,
    enabled: Boolean(selectedAddress && selectedAddress?.length !== 0),
  });

  $: queryTokenHolding = createQuery({
    queryKey: ["token-holding-each-chain", selectedAddress, $chain],
    queryFn: () =>
      getHoldingToken(selectedAddress, $chain, $queryValidate.data),
    enabled: Boolean(
      enabledFetchAllData &&
        selectedAddress &&
        selectedAddress?.length !== 0 &&
        $chain.length !== 0 &&
        $chain !== "ALL" &&
        isFetch &&
        !$queryValidate.isFetching,
    ),
  });

  $: queryAllTokenHolding = createQueries(
    chainListQueries?.map((item) => {
      return {
        queryKey: ["token-holding", selectedAddress, $chain, item],
        queryFn: () =>
          getHoldingToken(selectedAddress, item, $queryValidate.data),
        enabled: Boolean(
          enabledFetchAllData &&
            selectedAddress &&
            selectedAddress?.length !== 0 &&
            $chain.length !== 0 &&
            $chain === "ALL" &&
            isFetch &&
            !$queryValidate.isFetching,
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
    if (!$queryTokenHolding.isError && $queryTokenHolding.data !== undefined) {
      formatDataHoldingToken($queryTokenHolding.data);
    }
  }

  const formatDataHoldingToken = (data: any) => {
    const formatData = data
      ?.filter((item: any) => Number(item?.amount) !== 0)
      ?.map((item: any) => {
        return {
          ...item,
          value: Number(item?.amount) * Number(item?.price?.price),
        };
      })
      .sort((a: any, b: any) => {
        if (a.value < b.value) {
          return 1;
        }
        if (a.value > b.value) {
          return -1;
        }
        return 0;
      });

    sumTokens = formatData.reduce(
      (prev: any, item: any) => prev + item.value,
      0,
    );

    holdingTokenData = formatData?.filter(
      (item: any) => Number(item?.amount) > 0,
    );

    closedHoldingPosition = formatData?.filter(
      (item: any) =>
        item?.profit?.realizedProfit !== undefined &&
        Number(item?.amount) === 0,
    );

    ruggedHoldingPosition = formatData?.filter(
      (item: any) =>
        item?.profit?.realizedProfit !== undefined &&
        Number(item?.price?.price || item?.rate) === 0 &&
        Number(item?.amount) === 0,
    );
  };

  $: {
    if (holdingTokenData?.length === 0) {
      realizedProfit.update((n) => (n = 0));
      unrealizedProfit.update((n) => (n = 0));
    } else {
      realizedProfit.update(
        (n) =>
          (n = (holdingTokenData || [])
            ?.filter((item: any) => item?.profit?.realizedProfit !== undefined)
            ?.map((item: any) => {
              return {
                realized_profit: item?.profit?.realizedProfit || 0,
              };
            })
            .reduce(
              (prev: any, item: any) => prev + Number(item.realized_profit),
              0,
            )),
      );

      unrealizedProfit.update(
        (n) =>
          (n = (holdingTokenData || [])
            ?.filter(
              (item: any) =>
                Number(item?.amount) > 0 && Number(item?.avgCost) !== 0,
            )
            ?.map((item: any) => {
              const price = Number(
                item?.market_price || item?.price?.price || 0,
              );

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

              const unrealizedProfit = calculateUnrealizedProfit(
                realizedProfit.profit,
                Number(item?.avgCost),
                Number(pnl),
              );

              return {
                unrealized_profit: unrealizedProfit.profit,
              };
            })
            ?.reduce(
              (prev: any, item: any) => prev + Number(item.unrealized_profit),
              0,
            )),
      );
    }
  }

  $: {
    if (closedHoldingPosition?.length === 0) {
      pastProfit.update((n) => (n = 0));
    } else {
      pastProfit.update(
        (n) =>
          (n = closedHoldingPosition.reduce(
            (prev: any, item: any) =>
              prev + Number(item?.profit.realizedProfit),
            0,
          )),
      );
    }
  }

  $: {
    if (
      ($chain === "ALL"
        ? !$queryAllTokenHolding.some((item) => item.isFetching === true)
        : !$queryTokenHolding.isFetching) &&
      sumTokens
    ) {
      totalTokens.update((n) => (n = sumTokens));
    }
  }
</script>

<TokenHoldingTrades
  {holdingTokenData}
  isLoading={$chain === "ALL"
    ? $queryAllTokenHolding.some((item) => item.isFetching === true)
    : $queryTokenHolding.isFetching}
/>

<ClosedHoldingTrades
  holdingTokenData={closedHoldingPosition}
  isLoading={$chain === "ALL"
    ? $queryAllTokenHolding.some((item) => item.isFetching === true)
    : $queryTokenHolding.isFetching}
/>

<RuggedHoldingTrades
  holdingTokenData={ruggedHoldingPosition}
  isLoading={$chain === "ALL"
    ? $queryAllTokenHolding.some((item) => item.isFetching === true)
    : $queryTokenHolding.isFetching}
/>

<style>
</style>
