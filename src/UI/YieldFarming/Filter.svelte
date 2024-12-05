<script lang="ts">
  import { onMount } from "svelte";
  import { isDarkMode } from "~/store";
  import SelectFilter from "./SelectFilter.svelte";
  import { t } from "~/lib/i18n";
  import { chainList, chainMoveList } from "~/lib/chains";

  import Ton from "~/assets/chains/ton.png";

  export let handleChangeFilter = (value) => {};
  export let handleSelectedChain = (value) => {};
  export let handleToggleSingleToken = (value) => {};
  export let selectedChain;

  const tvlFilter = [
    {
      label: "All",
      value: "all",
    },
    {
      label: "< 100K",
      value: "< 100K",
    },
    {
      label: "100K - 500K",
      value: "100K - 500K",
    },
    {
      label: "500K - 1M",
      value: "500K - 1M",
    },
    {
      label: "> 1M",
      value: "> 1M",
    },
  ];

  const apyFilter = [
    {
      label: "All",
      value: "all",
    },
    {
      label: "< 5%",
      value: "< 5%",
    },
    {
      label: "5% - 25%",
      value: "5% - 25%",
    },
    {
      label: "25% - 50%",
      value: "25% - 50%",
    },
    {
      label: "> 50%",
      value: "> 50%",
    },
  ];

  const riskFilter = [
    {
      label: "All",
      value: "all",
    },
    {
      label: "Low",
      value: "low",
    },
    {
      label: "Medium",
      value: "medium",
    },
    {
      label: "High",
      value: "high",
    },
  ];

  const tagFilter = [
    {
      label: "Stable yield",
      value: "stable_yield",
    },
    {
      label: "Low risk",
      value: "low_risk",
    },
    {
      label: "High risk/return",
      value: "high_risk_high_return",
    },
    {
      label: "Airdrop ⚡",
      value: "airdrop",
    },
  ];

  const LIST_CHAINS = new Set(["SUI"]);

  const formatChainList: any = [
    ...chainMoveList.filter((item) => LIST_CHAINS.has(item.value)),
    // ...chainList.filter((item) => LIST_CHAINS.has(item.value)),
    {
      logo: Ton,
      label: "Ton",
      value: "TON",
    },
  ];

  let selectedTVL: any = tvlFilter[0]?.value;
  let selectedAPY: any = apyFilter[0]?.value;
  let selectedRisk: any = riskFilter[0]?.value;
  let selectedTag: string[] = [];

  let singleToken = false;

  $: {
    if (singleToken) {
      handleToggleSingleToken(singleToken);
    } else {
      handleToggleSingleToken(singleToken);
    }
  }

  onMount(() => {
    const yieldTVLSelected: any = localStorage.getItem("yield_tvl_selected");
    const yieldAPYSelected: any = localStorage.getItem("yield_apy_selected");
    const yieldRiskSelected: any = localStorage.getItem("yield_risk_selected");
    const yieldTagSelected: any = localStorage.getItem("yield_tag_selected");

    if (yieldTVLSelected !== null) {
      selectedTVL = yieldTVLSelected;
    } else {
      selectedTVL = tvlFilter[0].value;
    }

    if (yieldAPYSelected !== null) {
      selectedAPY = yieldAPYSelected;
    } else {
      selectedAPY = apyFilter[0].value;
    }

    if (yieldRiskSelected !== null) {
      selectedRisk = yieldRiskSelected;
    } else {
      selectedRisk = riskFilter[0].value;
    }

    if (
      yieldTagSelected !== null &&
      JSON.parse(yieldTagSelected).length !== 0
    ) {
      selectedTag = JSON.parse(yieldTagSelected);
    }
  });

  $: {
    if (selectedTVL || selectedAPY || selectedRisk || selectedTag) {
      handleChangeFilter({
        selectedTVL,
        selectedAPY,
        selectedRisk,
        selectedTag,
      });
    }
  }
</script>

<div
  class={`border border_0000001a w-full flex items-center justify-between rounded-[10px] xl:p-4 py-3 px-2 gap-10 ${
    $isDarkMode ? "bg-[#222222]" : "bg-[#fff]"
  }`}
>
  <div class="flex-1 flex items-start gap-6 flex-wrap">
    <div class="min-w-[120px] flex flex-col gap-1">
      <div
        class={`font-medium text-sm ${$isDarkMode ? "text-gray-300" : "text-gray-500"}`}
      >
        {$t("Chain")}
      </div>
      <SelectFilter
        options={formatChainList}
        selected={selectedChain}
        handleSelected={(selectedItem) => {
          handleSelectedChain(selectedItem.value);
        }}
      />
    </div>

    <div class="min-w-[120px] flex flex-col gap-1">
      <div
        class={`font-medium text-sm ${$isDarkMode ? "text-gray-300" : "text-gray-500"}`}
      >
        TVL
      </div>
      <SelectFilter
        options={tvlFilter}
        selected={selectedTVL}
        handleSelected={(selectedItem) => {
          selectedTVL = selectedItem.value;
          localStorage.setItem("yield_tvl_selected", selectedTVL);
        }}
      />
    </div>

    <div class="min-w-[120px] flex flex-col gap-1">
      <div
        class={`font-medium text-sm ${$isDarkMode ? "text-gray-300" : "text-gray-500"}`}
      >
        APY
      </div>
      <SelectFilter
        options={apyFilter}
        selected={selectedAPY}
        handleSelected={(selectedItem) => {
          selectedAPY = selectedItem.value;
          localStorage.setItem("yield_apy_selected", selectedAPY);
        }}
      />
    </div>

    <!-- <div class="min-w-[120px] flex flex-col gap-1">
      <div
        class={`font-medium text-sm ${$isDarkMode ? "text-gray-300" : "text-gray-500"}`}
      >
        {$t("Risk")}
      </div>
      <SelectFilter
        options={riskFilter}
        selected={selectedRisk}
        handleSelected={(selectedItem) => {
          selectedRisk = selectedItem.value;
          localStorage.setItem("yield_risk_selected", selectedRisk);
        }}
      />
    </div> -->

    <div class="min-w-[120px] flex flex-col gap-2">
      <div
        class={`font-medium text-sm ${$isDarkMode ? "text-gray-300" : "text-gray-500"}`}
      >
        {$t("Tags")}
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        {#each tagFilter || [] as item}
          <div
            class={`relative cursor-pointer text-sm font-medium rounded-[100px] overflow-hidden transition-all flex items-center gap-2 ${$isDarkMode ? "bg-[#cdcdcd59]" : "bg-[#fafafbff]"}`}
          >
            <div
              class={`px-3 py-1 ${
                selectedTag &&
                selectedTag?.length !== 0 &&
                selectedTag?.find((selected) => selected === item?.value) &&
                selectedTag?.find((selected) => selected === item?.value) ===
                  item?.value
                  ? "text-[#006CEC] bg-[#006cec33]"
                  : ""
              }`}
              on:click={() => {
                const selectedItem =
                  selectedTag &&
                  selectedTag?.length !== 0 &&
                  selectedTag?.find((selected) => selected === item.value);
                if (!selectedItem) {
                  selectedTag = [...selectedTag, item.value];
                  localStorage.setItem(
                    "yield_tag_selected",
                    JSON.stringify(selectedTag),
                  );
                } else {
                  selectedTag = selectedTag.filter(
                    (selected) => selected !== item.value,
                  );
                  localStorage.setItem(
                    "yield_tag_selected",
                    JSON.stringify(selectedTag),
                  );
                }
              }}
            >
              {item.label}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <div
        class={`font-medium text-sm ${$isDarkMode ? "text-gray-300" : "text-gray-500"}`}
      >
        Single token
      </div>
      <label class="toggle-token" for="toggle-token">
        <input type="checkbox" id="toggle-token" bind:checked={singleToken} />
        <span class="slider-address" />
      </label>
    </div>
  </div>
</div>

<style>
  .toggle-token {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
  }

  .toggle-token input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider-address {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    border-radius: 34px;
  }
  .slider-address:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 2px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    border-radius: 50%;
  }
  input:checked + .slider-address {
    background-color: #2196f3;
  }
  input:checked + .slider-address {
    box-shadow: 0 0 1px #2196f3;
  }
  input:checked + .slider-address:before {
    -webkit-transform: translateX(16px);
    -ms-transform: translateX(16px);
    transform: translateX(16px);
  }

  @media screen and (max-width: 1280px) {
    .toggle-token {
      width: 60px;
      height: 30px;
    }

    .slider-address {
      border-radius: 44px;
    }

    .slider-address:before {
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 2px;
    }

    input:checked + .slider-address:before {
      -webkit-transform: translateX(26px);
      -ms-transform: translateX(26px);
      transform: translateX(26px);
    }
  }
</style>
