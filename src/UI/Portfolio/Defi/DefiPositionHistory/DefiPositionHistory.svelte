<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import { onDestroy, onMount } from "svelte";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { isDarkMode, typeWallet, wallet } from "~/store";
  import { t } from "~/lib/i18n";
  import { nimbus } from "~/lib/network";
  import dayjs from "dayjs";
  import utc from "dayjs/plugin/utc";
  dayjs.extend(utc);
  import { chainList } from "~/lib/chains";

  import HistoricalCLMM from "./HistoricalCLMM.svelte";
  import HistoricalAMM from "./HistoricalAMM.svelte";
  import HistoricalVest from "./HistoricalVest.svelte";
  import HistoricalStake from "./HistoricalStake.svelte";
  import HistoricalLendingBorrow from "./HistoricalLendingBorrow.svelte";
  import HistoricalCfmm from "./HistoricalCFMM.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import OverviewCard from "~/components/OverviewCard.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";

  import TrendUp from "~/assets/trend-up.svg";
  import TrendDown from "~/assets/trend-down.svg";
  import Loading from "~/components/Loading.svelte";

  export let data;
  export let showPositionDetail;

  const queryClient = useQueryClient();

  $: formatChainList = chainList
    .filter((item) => item?.value !== "ALL")
    .map((item) => item?.value);

  let dataHistory: any = [];
  let dataHistoryAdd: any = [];
  let dataHistoryRemove: any = [];
  let isQueryHistory = false;

  let isLoadingSync = true;
  let intervalId: any = null;

  $: {
    if (data && Object.keys(data).length !== 0 && showPositionDetail) {
      if (isNimbusVersion) {
        isLoadingSync = false;
      }
      isQueryHistory = true;
    }
  }

  $: selectedProtocol = data?.meta?.protocol?.protocol;

  const getSync = async () => {
    try {
      await nimbus
        .get(
          `/v2/address/${$typeWallet === "BUNDLE" ? data?.owner : $wallet}/positions/history/sync?chain=${data?.chain}&protocol=${selectedProtocol}`,
        )
        .then((res: any) => res?.data);
    } catch (e) {
      console.error("e: ", e);
    }
  };

  const getSyncStatus = async () => {
    console.log("getSyncStatus");
    isLoadingSync = true;
    try {
      const response: any = await nimbus
        .get(
          `/v2/address/${$typeWallet === "BUNDLE" ? data?.owner : $wallet}/positions/history/sync-status?chain=${data?.chain}&protocol=${selectedProtocol}&type=${data?.type}`,
        )
        .then((res: any) => res?.data);

      if (response) {
        const responseDate = dayjs.utc(response?.updatedAt);
        const oneHourAgo = dayjs.utc().subtract(1, "hour");

        if (
          !(
            ["SYNCING", "DONE"].includes(response?.status) &&
            oneHourAgo <= responseDate
          )
        ) {
          console.log("Going to full sync");
          getSync();
        } else if (response?.status === "FAIL") {
          console.log("Going to full sync");
          getSync();
        }

        console.log({
          response,
          oneHourAgo,
          responseDate,
        });

        if (response?.status === "DONE" && oneHourAgo <= responseDate) {
          console.log("Already synced history position");
          clearInterval(intervalId);
          isLoadingSync = false;
          isQueryHistory = true;
          queryClient.invalidateQueries(["position-history"]);
        }
      } else {
        console.log("Going to full sync");
        getSync();
      }
    } catch (e) {
      console.error("e: ", e);
    }
  };

  const getPositionHistory = async (position: any) => {
    const response: any = await nimbus
      .get(
        `/v2/address/${$typeWallet === "BUNDLE" ? data?.owner : $wallet}/positions-history`,
        {
          params: {
            protocol: selectedProtocol,
            positionId: position?.positionId,
            chain: position?.chain,
            type: position?.type,
          },
        },
      )
      .then((res: any) => res?.data);
    return response;
  };

  onDestroy(() => {
    clearInterval(intervalId);
  });

  $: {
    if (
      data &&
      Object.keys(data).length !== 0 &&
      ($typeWallet === "EVM" ||
        ($typeWallet === "BUNDLE" && formatChainList.includes(data?.chain))) &&
      showPositionDetail &&
      !isNimbusVersion
    ) {
      getSyncStatus();
    }
  }

  $: {
    intervalId = setInterval(() => {
      if (
        data &&
        Object.keys(data).length !== 0 &&
        ($typeWallet === "EVM" ||
          ($typeWallet === "BUNDLE" &&
            formatChainList.includes(data?.chain))) &&
        showPositionDetail &&
        !isNimbusVersion
      ) {
        getSyncStatus();
      }
    }, 10000); // 10s
  }

  $: queryPositionHistory = createQuery({
    queryKey: ["position-history", isQueryHistory, data, showPositionDetail],
    queryFn: () => getPositionHistory(data),
    cacheTime: 0,
    enabled: Boolean(
      data &&
        Object.keys(data).length !== 0 &&
        showPositionDetail &&
        isQueryHistory,
    ),
  });

  $: {
    if (
      !$queryPositionHistory?.isError &&
      $queryPositionHistory?.data !== undefined &&
      $queryPositionHistory?.data?.length !== 0
    ) {
      dataHistory = ($queryPositionHistory?.data || [])?.map((item: any) => {
        return {
          ...item,
          timestamp: dayjs(item.timestamp).unix(),
        };
      });
      dataHistoryAdd = dataHistory
        .filter((item: any) => item.action === "Add")
        .map((item: any) => {
          return {
            ...item,
            token_a_value: item?.token_a_quality * item?.token_a_price,
            token_b_value: item?.token_b_quality * item?.token_b_price,
            value:
              item?.token_a_quality * item?.token_a_price +
              item?.token_b_quality * item?.token_b_price,
          };
        });
      dataHistoryRemove = dataHistory
        .filter((item: any) => item.action === "Remove")
        .map((item: any) => {
          return {
            ...item,
            token_a_value: item?.token_a_quality * item?.token_a_price,
            token_b_value: item?.token_b_quality * item?.token_b_price,
            value:
              item?.token_a_quality * item?.token_a_price +
              item?.token_b_quality * item?.token_b_price,
          };
        });
    }
  }

  $: {
    if (!showPositionDetail) {
      clearInterval(intervalId);
    }
  }

  $: totalCost =
    (dataHistoryAdd?.reduce(
      (prev: any, item: any) => prev + Number(item.value),
      0,
    ) || 0) -
    (dataHistoryRemove?.reduce(
      (prev: any, item: any) => prev + Number(item.value),
      0,
    ) || 0);

  $: yieldCollected =
    data?.yieldCollected?.reduce(
      (prev: any, item: any) => prev + Number(item.value),
      0,
    ) || 0;

  $: totalInputValue =
    data?.current?.tokens?.reduce(
      (prev: any, item: any) => prev + Number(item.value),
      0,
    ) || 0;

  $: percentPnL =
    totalCost !== 0
      ? ((totalInputValue + yieldCollected - totalCost) / totalCost) * 100
      : 0;

  $: pnl = totalCost !== 0 ? percentPnL * (totalCost / 100) : 0;
</script>

<div class="flex flex-col gap-2">
  <div class="flex-1 flex md:flex-row flex-col justify-between gap-6 mb-6">
    <OverviewCard title={$t("Cost Basis")}>
      <span slot="number" class="flex items-center">
        <div class="flex justify-end">
          ${#if totalCost}
            <TooltipNumber number={totalCost} type="balance" />
          {:else}
            0
          {/if}
        </div>
      </span>
    </OverviewCard>

    <OverviewCard title={$t("Profit and Loss")}>
      <span slot="number" class="flex items-center">
        <div
          class={`${
            pnl !== 0
              ? percentPnL >= 0
                ? "text-[#00A878]"
                : "text-red-500"
              : ""
          }`}
        >
          <TooltipNumber number={Math.abs(pnl)} type="value" personalValue />
        </div>
      </span>

      <span slot="sub-number">
        <div class="flex items-center gap-1">
          <div
            class={`flex items-center text-lg ${
              pnl !== 0 ? (pnl >= 0 ? "text-[#00A878]" : "text-red-500") : ""
            }`}
          >
            <TooltipNumber number={Math.abs(percentPnL)} type="percent" />
            <span>%</span>
          </div>
          {#if pnl !== 0}
            <img
              src={pnl >= 0 ? TrendUp : TrendDown}
              alt="trend"
              class="mb-1 block"
            />
          {/if}
        </div>
      </span>
    </OverviewCard>
  </div>

  <div class="text-2xl font-medium">{$t("History")}</div>
  <div class="my-1">
    <span
      class="w-max px-2 py-1 text-[#F39C12] font-normal bg-[#FDEBD0] rounded-[5px] capitalize text-sm"
    >
      {$t("Beta")}
    </span>
    {$t("If it is missing your transaction, please help us fire")}
    <button
      class="hover:text-blue-500 underline cursor-pointer"
      data-featurebase-feedback
    >
      {$t("feedback")}
    </button>
  </div>

  {#if isLoadingSync && !$queryPositionHistory.isFetching && dataHistory && dataHistory.length === 0}
    <div class="flex flex-col gap-4 items-center justify-center pt-10">
      <div class="flex justify-center items-center h-[68px]">
        {#if isNimbusVersion}
          <LoadingPremium />
        {:else}
          <Loading />
        {/if}
      </div>
      <div class="text-lg text-gray-400">
        {$t("It takes a while to sync your DeFi data")}
      </div>
    </div>
  {/if}

  {#if data.type === "CLMM"}
    <HistoricalCLMM
      isLoading={$queryPositionHistory.isFetching}
      data={dataHistory}
    />
  {:else if data.type === "CFMM"}
    <HistoricalCfmm
      isLoading={$queryPositionHistory.isFetching}
      data={dataHistory}
    />
  {:else if data.type === "AMM"}
    <HistoricalAMM
      isLoading={$queryPositionHistory.isFetching}
      data={dataHistory}
    />
  {:else if data.type === "Vest"}
    <HistoricalVest
      isLoading={$queryPositionHistory.isFetching}
      data={dataHistory}
    />
  {:else if data.type === "Staking"}
    <HistoricalStake
      isLoading={$queryPositionHistory.isFetching}
      data={dataHistory}
    />
  {:else if data.type === "Lending" || data.type === "Borrow"}
    <HistoricalLendingBorrow
      isLoading={$queryPositionHistory.isFetching}
      data={dataHistory}
    />
  {:else}
    <div
      class={`rounded-[10px] p-2 overflow-hidden w-full ${
        $isDarkMode ? "bg-[#131313]" : "bg-[#fff] border border_0000000d"
      }`}
    >
      <div
        class="flex justify-center items-center h-full py-3 px-3 text-base text-gray-400"
      >
        {$t("Empty")}
      </div>
    </div>
  {/if}
</div>

<style></style>
