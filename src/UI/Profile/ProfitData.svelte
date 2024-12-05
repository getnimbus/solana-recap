<script lang="ts">
  import { createQueries, createQuery } from "@tanstack/svelte-query";
  import tooltip from "~/lib/tooltip";
  import { t } from "~/lib/i18n";
  import dayjs from "dayjs";
  import { chain, typeWallet } from "~/store";
  import {
    getTradingStats,
    getHoldingToken,
    handleValidateAddress,
  } from "~/lib/queryAPI";
  import { isNimbusVersion } from "~/utils/constants";
  import { chainList, chainMoveList, chainSolList } from "~/lib/chains";
  import { flatten } from "lodash";

  import Loading from "~/components/Loading.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";

  import TrendDown from "~/assets/trend-down.svg";
  import TrendUp from "~/assets/trend-up.svg";

  export let selectedAddress;
  export let isSync = false;
  export let enabledFetchAllData = false;

  let balance = 0;
  let unRealizedProfit = 0;
  let fee = 0;
  let set30DayPnl = 0;
  let winRate = 0;
  let totalCost = 0;
  let totalToken = 0;
  let realizedProfit = 0;
  let badPerf = {};
  let goodPerf = {};

  $: isFetch = isSync ? enabledFetchAllData : true;

  const formatDataHoldingToken = (dataTokenHolding: any) => {
    const formatData = dataTokenHolding
      .map((item: any) => {
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

    balance = formatData.reduce((prev: any, item: any) => prev + item.value, 0);

    const format30D = formatData
      ?.filter((item: any) => item?.profit?.realizedProfit)
      ?.map((item: any) => {
        return {
          ...item,
          realizedProfit: item?.profit?.realizedProfit,
          percentRealizedProfit:
            (item?.avgCost || 0) === 0
              ? 0
              : (Number(item?.profit?.realizedProfit) /
                  Number(Math.abs(item?.avgCost))) *
                100,
        };
      });

    winRate =
      (format30D.filter((item: any) => item?.profit?.realizedProfit > 0)
        .length /
        format30D.length) *
      100;

    totalToken = format30D.length;
  };

  const formatDataTradingStats = (dataTokenHolding: any, data: any) => {
    const formatMetaData = data.metadata.map((item: any) => {
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
      .map((item: any) => {
        return {
          ...item.holding,
          value:
            Number(item?.holding?.amount || 0) *
            Number(item?.holding?.price?.price || item?.holding?.rate),
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

    const tradingStatsMeta = data?.metadata.filter(
      (item: any) =>
        dayjs().subtract(30, "day").valueOf() < item.lastTrade * 1000,
    );

    unRealizedProfit =
      data?.latestStats?.unrealizedProfit ||
      tradingStatsMeta?.reduce(
        (prev: any, item: any) => prev + Number(item.unrealizedProfit),
        0,
      );

    fee = data.latestStats.fee;

    realizedProfit =
      data?.latestStats?.totalRealizedProfit ||
      tradingStatsMeta.reduce(
        (prev: any, item: any) => prev + Number(item.realizedProfit),
        0,
      );

    totalCost =
      data?.latestStats?.cost ||
      tradingStatsMeta?.reduce(
        (prev: any, item: any) => prev + Number(item.cost),
        0,
      );

    if (unRealizedProfit === 0 && realizedProfit === 0) {
      set30DayPnl = 0;
    } else {
      set30DayPnl =
        ((unRealizedProfit + realizedProfit - totalCost) / totalCost) * 100;
    }

    let listProfitToken: any = [];
    let listLossToken: any = [];

    formatData
      ?.filter((item: any) => item?.profit?.realizedProfit)
      ?.map((item: any) => {
        return {
          ...item,
          realizedProfit: item?.profit?.realizedProfit,
          percentRealizedProfit:
            (item?.avgCost || 0) === 0
              ? 0
              : (Number(item?.profit?.realizedProfit) /
                  Number(Math.abs(item?.avgCost))) *
                100,
        };
      })
      .map((item: any) => {
        if (item.realizedProfit < 0) {
          listLossToken.push(item);
        } else {
          listProfitToken.push(item);
        }
      });

    goodPerf =
      listProfitToken.sort(
        (a: any, b: any) => b.realizedProfit - a.realizedProfit,
      )[0] || {};

    badPerf =
      listLossToken.sort(
        (a: any, b: any) => a.realizedProfit - b.realizedProfit,
      )[0] || {};
  };

  $: queryValidate = createQuery({
    queryKey: ["validate", selectedAddress],
    queryFn: () => handleValidateAddress(selectedAddress),
    retry: false,
    enabled: Boolean(selectedAddress && selectedAddress?.length !== 0),
  });

  $: queryTradingStats = createQuery({
    queryKey: ["trading-stats", selectedAddress],
    queryFn: () => getTradingStats(selectedAddress),
    retry: false,
    enabled: Boolean(selectedAddress?.length !== 0 && isFetch),
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

  $: {
    if (
      !$queryTradingStats.isError &&
      $queryTradingStats.data &&
      $queryTradingStats?.data !== undefined &&
      !$queryTokenHolding.isError &&
      $queryTokenHolding.data &&
      $queryTokenHolding?.data !== undefined
    ) {
      formatDataTradingStats($queryTokenHolding?.data, $queryTradingStats.data);
    }
  }
</script>

<div
  class="col-span-4 border border_0000001a rounded-xl xl:p-6 p-3 overflow-hidden"
>
  {#if $queryTokenHolding.isFetching && $queryTradingStats.isFetching}
    <div class="h-full flex items-center justify-center">
      {#if isNimbusVersion}
        <LoadingPremium />
      {:else}
        <Loading />
      {/if}
    </div>
  {:else}
    <div class="flex flex-col gap-4">
      <div class="grid md:grid-cols-3 grid-cols-2 gap-5">
        <div class="flex flex-col gap-2 justify-between">
          <div class="text-sm font-medium text_00000099">
            {$t("Portfolio Value")}
          </div>
          <div class="text-sm font-medium">
            <TooltipNumber number={balance} type="value" personalValue />
          </div>
        </div>

        <div class="flex flex-col gap-2 justify-between">
          <div class="text-sm font-medium text_00000099">
            <span
              use:tooltip={{
                content: `<tooltip-detail text="30D Unrealized PnL" />`,
                allowHTML: true,
                placement: "top",
                interactive: true,
              }}
            >
              {$t("30D Unrealized PnL")}
            </span>
          </div>
          <div
            class={`flex items-center text-sm font-medium ${
              unRealizedProfit !== 0
                ? unRealizedProfit >= 0
                  ? "text-[#00A878]"
                  : "text-red-500"
                : ""
            }`}
          >
            {#if unRealizedProfit < 0}-{/if}
            <TooltipNumber
              number={Math.abs(unRealizedProfit)}
              type="value"
              personalValue
            />
          </div>
        </div>

        <div class="flex flex-col gap-2 justify-between">
          <div class="text-sm font-medium text_00000099">
            {$t("30D Realized PnL")}
          </div>
          <div
            class={`flex items-center text-sm font-medium ${
              realizedProfit !== 0
                ? realizedProfit >= 0
                  ? "text-[#00A878]"
                  : "text-red-500"
                : ""
            }`}
          >
            {#if realizedProfit < 0}-{/if}
            <TooltipNumber
              number={Math.abs(realizedProfit)}
              type="value"
              personalValue
            />
          </div>
        </div>

        <!-- <div class="flex flex-col gap-2 justify-between">
          <div class="text-sm font-medium text_00000099">
            30D PnL
          </div>
          <div
            class={`flex items-center text-sm font-medium ${
              set30DayPnl !== 0
                ? set30DayPnl >= 0
                  ? "text-[#00A878]"
                  : "text-red-500"
                : ""
            }`}
          >
            {#if set30DayPnl < 0}-{/if}
            <TooltipNumber
              number={Math.abs(set30DayPnl)}
              type={Math.abs(Number(set30DayPnl)) > 100 ? "balance" : "percent"}
            />%
          </div>
        </div> -->

        <div class="flex flex-col gap-2 justify-between">
          <div class="text-sm font-medium text_00000099">
            {$t("30D Trade Tokens")}
          </div>
          <div class="text-sm font-medium">
            {totalToken}
          </div>
        </div>

        <div class="flex flex-col gap-2 justify-between">
          <div class="text-sm font-medium text_00000099">{$t("Winrate")}</div>
          <div class="text-sm font-medium">
            <TooltipNumber number={winRate} type="percent" personalValue />%
          </div>
        </div>

        <div class="flex flex-col gap-2 justify-between">
          <div class="text-sm font-medium text_00000099">
            {$t("Total fee paid")}
          </div>
          <div class="text-sm font-medium">
            <TooltipNumber number={fee} type="value" personalValue />
          </div>
        </div>
      </div>

      <!-- {#if (goodPerf && Object.keys(goodPerf)?.length !== 0) || (badPerf && Object.keys(badPerf)?.length !== 0)}
        <div class="grid grid-cols-2 gap-5">
          {#if goodPerf}
            <div class="rounded-[20px] flex-1 bg_fafafbff px-4 pb-3 pt-5">
              <div class="text-sm font-medium text-[#6E7787FF] relative">
                <div
                  class="border border-[#00A878] absolute -top-1 left-0 w-[40px]"
                />
                Biggest win
              </div>

              {#if Object.keys(goodPerf).length !== 0}
                <div class="text-2xl">{goodPerf?.symbol}</div>

                <div class="flex flex-col">
                  <div
                    class={`flex text-lg ${
                      0 >= 0 ? "text-[#00A878]" : "text-red-500"
                    }`}
                  >
                    $<TooltipNumber
                      number={Math.abs(goodPerf?.realizedProfit || 0)}
                      type="balance"
                    />
                  </div>
                  <div class="flex items-center gap-1 text-lg">
                    <img
                      src={goodPerf?.percentRealizedProfit >= 0
                        ? TrendUp
                        : TrendDown}
                      alt="trend"
                      class="mb-1 block"
                    />
                    <div
                      class={`${
                        goodPerf?.percentRealizedProfit >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                      }`}
                    >
                      <TooltipNumber
                        number={Math.abs(goodPerf?.percentRealizedProfit || 0)}
                        type="percent"
                      />
                      %
                    </div>
                  </div>
                </div>
              {:else}
                <div
                  class="h-full flex justify-center items-center pb-8 text-sm font-medium"
                >
                  There is no biggest win
                </div>
              {/if}
            </div>
          {/if}

          {#if badPerf}
            <div class="rounded-[20px] flex-1 bg_fafafbff px-4 pb-3 pt-5">
              <div class="text-sm font-medium text-[#6E7787FF] relative">
                <div
                  class="border border-red-500 absolute -top-1 left-0 w-[40px]"
                />
                Worse lose
              </div>

              {#if Object.keys(badPerf).length !== 0}
                <div class="text-2xl">{badPerf?.symbol}</div>

                <div class="flex flex-col">
                  <div
                    class={`flex text-lg ${
                      badPerf?.realizedProfit >= 0
                        ? "text-[#00A878]"
                        : "text-red-500"
                    }`}
                  >
                    $<TooltipNumber
                      number={Math.abs(badPerf?.realizedProfit || 0)}
                      type="balance"
                    />
                  </div>
                  <div class="flex items-center gap-1 text-lg">
                    <img
                      src={badPerf?.percentRealizedProfit >= 0
                        ? TrendUp
                        : TrendDown}
                      alt="trend"
                      class="mb-1 block"
                    />
                    <div
                      class={`${
                        badPerf?.percentRealizedProfit >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                      }`}
                    >
                      <TooltipNumber
                        number={Math.abs(badPerf?.percentRealizedProfit || 0)}
                        type="percent"
                      />
                      %
                    </div>
                  </div>
                </div>
              {:else}
                <div
                  class="h-full flex justify-center items-center pb-8 text-sm font-medium"
                >
                  There is no worse lose
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if} -->
    </div>
  {/if}
</div>

<style></style>
