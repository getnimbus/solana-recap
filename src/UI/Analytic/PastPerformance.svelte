<script lang="ts">
  import {
    user,
    wallet,
    chain,
    typeWallet,
    isDarkMode,
    selectedPackage,
  } from "~/store";
  import { createQuery } from "@tanstack/svelte-query";
  import { nimbus } from "~/lib/network";

  import Button from "~/components/Button.svelte";
  import DateRangePicker from "~/components/DateRangePicker.svelte";
  import SectorGrowth from "../AnalyticChart/SectorGrowth.svelte";
  import TotalValueHistory from "../AnalyticChart/TotalValueHistory.svelte";
  import DailyPnL from "../AnalyticChart/DailyPnL.svelte";
  import ProfitGrows from "../AnalyticChart/ProfitGrows.svelte";
  import TotalGasFee from "../AnalyticChart/TotalGasFee.svelte";
  import HistoricalActivities from "../AnalyticChart/HistoricalActivities.svelte";

  export let address;
  export let isShowSoon;
  export let packageSelected;
  export let isSync = false;
  export let enabledFetchAllData = false;

  $: isFetch = isSync ? enabledFetchAllData : true;

  // const handleGetDateRange = (data) => {
  //   console.log(data);
  // };

  const getTotalValueHistoryAndDailyGain = async (address, chain) => {
    const response = await nimbus.get(
      `/v2/analysis/${address}/holding-history?chain=${chain}&fromDate=${""}&toDate=${""}`,
    );
    return response.data;
  };

  $: enabledQuery = Boolean(
    ["EVM", "BUNDLE"].includes($typeWallet) &&
      $wallet &&
      $wallet?.length !== 0 &&
      $selectedPackage !== "FREE",
  );

  $: query = createQuery({
    queryKey: ["holding-history", $wallet, $chain],
    queryFn: () => getTotalValueHistoryAndDailyGain($wallet, $chain),
    enabled: Boolean(enabledQuery && isFetch),
  });
</script>

<div class="flex flex-col gap-5">
  <div class="flex justify-start">
    <div class="font-medium text-2xl">Historical Activities</div>
    <!-- <DateRangePicker onChange={handleGetDateRange} /> -->
  </div>
  <div class="flex flex-col gap-6">
    <!-- <ProfitGrows isLoading={$query.isFetching} isEmpty={$query.isError} dataTotalValueHistory={$query.data.holdingHistory} />
    <TotalValueHistory isLoading={$query.isFetching} isEmpty={$query.isError} dataTotalValueHistory={$query.data.holdingHistory} />
    <DailyPnL isLoading={$query.isFetching} isEmpty={$query.isError} dataDailyPnL={$query.data.returnsChange} />
    <SectorGrowth /> -->
    <TotalGasFee {packageSelected} darkMode={$isDarkMode} {isFetch} />
    <HistoricalActivities {packageSelected} darkMode={$isDarkMode} {isFetch} />
  </div>
</div>

<style></style>
