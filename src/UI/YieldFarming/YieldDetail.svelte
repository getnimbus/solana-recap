<script lang="ts">
  import { colorPairs } from "~/utils/constants";
  import { nimbus } from "~/lib/network";
  import { createQuery } from "@tanstack/svelte-query";
  import { marked } from "marked";

  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import ApyAndTvlChart from "./APYAndTVLChart.svelte";
  import Simulator from "./Simulator.svelte";

  export let selectedChain;
  export let selectedProtocol;
  export let showSideYieldDetail;

  const formatLabel = (label: string) => {
    let name = "";
    switch (label) {
      case "low_risk":
        name = "Low risk";
        break;
      case "stable_yield":
        name = "Stable yield";
        break;
      case "high_risk_high_return":
        name = "High risk/return";
        break;
      case "airdrop":
        name = "Airdrop ⚡";
        break;
    }
    return name;
  };

  const tagColor = (type: string) => {
    let colorData = colorPairs[2];
    switch (type) {
      case "low_risk":
        colorData = colorPairs[0];
        break;
      case "high_risk_high_return":
        colorData = colorPairs[1];
        break;
      case "airdrop":
        colorData = colorPairs[2];
        break;
      case "stable_yield":
        colorData = colorPairs[5];
        break;
    }
    return colorData;
  };

  const handleAPYChart = async (protocol: any) => {
    const response = await nimbus
      .get(`/v2/farming/${protocol?.id}/apy-historical`)
      .then((res: any) => res.data);
    return response;
  };

  $: queryAPYChart = createQuery({
    queryKey: ["query-apy-historical", selectedProtocol, showSideYieldDetail],
    queryFn: () => handleAPYChart(selectedProtocol),
    retry: false,
    enabled: Boolean(
      showSideYieldDetail &&
        selectedProtocol &&
        Object.keys(selectedProtocol)?.length !== 0,
    ),
  });

  let dataAPYAndTVLChart: any[] = [];

  $: {
    if (!$queryAPYChart.isError && $queryAPYChart && $queryAPYChart?.data) {
      dataAPYAndTVLChart = $queryAPYChart?.data;
    } else {
      dataAPYAndTVLChart = [];
    }
  }
</script>

<div class="flex flex-col gap-6">
  <div class="flex flex-col gap-1">
    <ApyAndTvlChart
      {dataAPYAndTVLChart}
      isLoading={$queryAPYChart.isFetching}
    />

    <div class="flex justify-between items-center mt-1">
      {#if Object.keys(selectedProtocol)?.length !== 0 && selectedProtocol?.label?.length !== 0}
        <div
          class="flex justify-end items-center text-sm font-medium flex-wrap gap-2"
        >
          {#each selectedProtocol?.label?.map((eachLabel) => {
            return { label: eachLabel, textColor: tagColor(eachLabel).textColor, backgroundColor: tagColor(eachLabel).backgroundColor };
          }) as eachLabel}
            <div
              class="w-max text-sm rounded-[30px] px-2 py-1"
              style="background-color: {eachLabel?.backgroundColor}; color: {eachLabel?.textColor};"
            >
              {formatLabel(eachLabel.label)}
            </div>
          {/each}
        </div>
      {:else}
        <div></div>
      {/if}
      <div class="flex items-center gap-1">
        <div class="flex items-center gap-1">
          <div class="text-gray-400">TVL:</div>
          <div class="font-medium">
            <TooltipNumber number={selectedProtocol?.tvl} type="value" />
          </div>
        </div>
        <div class="text-gray-400">-</div>
        <div class="flex items-center gap-1">
          <div class="text-gray-400">APY:</div>
          <div class="font-medium">
            <TooltipNumber
              number={selectedProtocol?.apy * 100}
              type="percent"
            />%
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if selectedProtocol && selectedProtocol?.yieldSource !== null}
    <div class="flex flex-col gap-2">
      <div class="text-2xl font-medium">Where there yield come from?</div>
      {@html marked(selectedProtocol?.yieldSource)}
    </div>
  {/if}

  {#if selectedProtocol && selectedProtocol?.riskFactors !== null}
    <div class="flex flex-col gap-2">
      <div class="text-2xl font-medium">Risks Factors</div>
      {@html marked(selectedProtocol?.riskFactors)}
    </div>
  {/if}

  <!-- <Simulator {selectedProtocol} {selectedChain} /> -->
</div>

<style></style>
