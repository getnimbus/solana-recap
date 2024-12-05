<script lang="ts">
  import {
    isDarkMode,
    selectedTokenDetail,
    showScallopDeFiFarmModal,
    showStonfiDeFiFarmModal,
    showModalBridge,
  } from "~/store";
  import axios from "axios";
  import { isNimbusVersion } from "~/utils/constants";
  import { t } from "~/lib/i18n";
  import { colorPairs } from "~/utils/constants";
  import { createQuery } from "@tanstack/svelte-query";

  import Bridge from "~/components/Bridge.svelte";
  import Button from "~/components/Button.svelte";
  import AppOverlay from "~/components/Overlay.svelte";
  import Loading from "~/components/Loading.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import OverlaySidebar from "~/components/OverlaySidebar.svelte";
  import YieldDetail from "./YieldDetail.svelte";
  import ScallopProvideLiquidity from "../Portfolio/Defi/ScallopProvideLiquidity.svelte";
  import StonfiProvideLiquidity from "../Portfolio/Defi/StonfiProvideLiquidity.svelte";

  export let handleChangeOrderBy = (value) => {};
  export let dataVaults;
  export let isLoading;
  export let selectedToken;
  export let holdingTokenData;
  export let selectedChain;

  let showSideYieldDetail = false;
  let selectedProtocol = {};

  let listTONToken: any = [];

  const handleQueryTONListToken = async () => {
    const response = await axios
      .get("https://api.ston.fi/v1/assets")
      .then((res) => res.data?.asset_list);
    return response;
  };

  $: queryListToken = createQuery({
    queryKey: ["query-ton-list-token"],
    queryFn: () => handleQueryTONListToken(),
    retry: false,
    enabled: Boolean(selectedChain && selectedChain?.length !== 0),
  });

  $: {
    if (!$queryListToken.isError && $queryListToken.data !== undefined) {
      listTONToken = $queryListToken.data;
    }
  }

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

  let searchValue = "";

  $: filteredBySearchProtocol = searchValue
    ? dataVaults.filter(
        (item) =>
          item.protocol?.toLowerCase()?.includes(searchValue?.toLowerCase()) ||
          item.name?.toLowerCase()?.includes(searchValue?.toLowerCase()),
      )
    : dataVaults;

  $: filteredBySelectedTokenHolding =
    selectedToken && Object.keys(selectedToken).length !== 0
      ? filteredBySearchProtocol.filter((item) =>
          selectedChain === "SUI"
            ? item?.name
                .toLowerCase()
                .includes(selectedToken?.symbol?.toLowerCase())
            : item.coins.includes(
                [
                  "0:0000000000000000000000000000000000000000000000000000000000000000",
                  "TONCOIN",
                ].includes(
                  selectedToken?.address || selectedToken?.contractAddress,
                )
                  ? "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
                  : selectedToken?.address || selectedToken?.contractAddress,
              ),
        )
      : filteredBySearchProtocol;

  const formatString = (inputStr: string) => {
    return inputStr
      .replace("-", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  let orderBy = "apy:desc";

  const toggleSortWhalesList = (key: any) => {
    let orderKey = orderBy.split(":")[0];
    let orderType = orderBy.split(":")[1];
    if (key === orderKey) {
      if (orderType === "asc") {
        orderType = "desc";
      } else {
        orderType = "asc";
      }
    } else {
      orderKey = key;
      orderType = "asc";
    }
    orderBy = `${orderKey}:${orderType}`;
  };

  $: {
    if (orderBy) {
      handleChangeOrderBy(orderBy);
    }
  }

  const closeSideDetail = (event: any) => {
    if (event.key === "Escape") {
      showSideYieldDetail = false;
    }
  };

  $: sortIcon = (sortType: any) => {
    return `<svg
              height="0.9rem"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0" />
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M16.0686 15H7.9313C7.32548 15 7.02257 15 6.88231 15.1198C6.76061 15.2238 6.69602 15.3797 6.70858 15.5393C6.72305 15.7232 6.93724 15.9374 7.36561 16.3657L11.4342 20.4344C11.6323 20.6324 11.7313 20.7314 11.8454 20.7685C11.9458 20.8011 12.054 20.8011 12.1544 20.7685C12.2686 20.7314 12.3676 20.6324 12.5656 20.4344L16.6342 16.3657C17.0626 15.9374 17.2768 15.7232 17.2913 15.5393C17.3038 15.3797 17.2392 15.2238 17.1175 15.1198C16.9773 15 16.6744 15 16.0686 15Z"
                  stroke="${$isDarkMode ? "#ffffff" : "#000000"}"
                  fill="${
                    sortType === "default" || sortType === "desc"
                      ? $isDarkMode
                        ? "#ffffff"
                        : "#000000"
                      : ""
                  }"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M7.9313 9.00005H16.0686C16.6744 9.00005 16.9773 9.00005 17.1175 8.88025C17.2393 8.7763 17.3038 8.62038 17.2913 8.46082C17.2768 8.27693 17.0626 8.06274 16.6342 7.63436L12.5656 3.56573C12.3676 3.36772 12.2686 3.26872 12.1544 3.23163C12.054 3.199 11.9458 3.199 11.8454 3.23163C11.7313 3.26872 11.6323 3.36772 11.4342 3.56573L7.36561 7.63436C6.93724 8.06273 6.72305 8.27693 6.70858 8.46082C6.69602 8.62038 6.76061 8.7763 6.88231 8.88025C7.02257 9.00005 7.32548 9.00005 7.9313 9.00005Z"
                  stroke="${$isDarkMode ? "#ffffff" : "#000000"}"
                  fill="${
                    sortType === "default" || sortType === "asc"
                      ? $isDarkMode
                        ? "#ffffff"
                        : "#000000"
                      : ""
                  }"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </svg>`;
  };
</script>

<svelte:window on:keydown={closeSideDetail} />

<div class="xl:col-span-2 col-span-full flex flex-col gap-4 h-[80vh]">
  <div
    class={`border border_0000001a focus:outline-none w-full py-[6px] px-3 rounded-lg ${
      searchValue && !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
    }`}
  >
    <input
      bind:value={searchValue}
      on:change={(event) => {
        searchValue = event?.target?.value;
      }}
      placeholder={$t("Search by name or protocol")}
      type="text"
      class={`w-full p-0 border-none focus:outline-none focus:ring-0 text-sm font-normal ${
        searchValue && !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
      } ${$isDarkMode ? "text-white" : "text-[#5E656B] placeholder-[#5E656B]"}`}
    />
  </div>

  <div
    class={`xl:block hidden border border_0000001a rounded-lg overflow-y-auto h-full ${$isDarkMode ? "bg-[#222222]" : "bg-[#fff]"}`}
  >
    <div class="grid grid-cols-6 sticky top-0 left-0 z-2 bg_f4f5f8">
      <div class="col-spans-1 pl-3 py-3 h-max">
        <div class="text-left text-xs uppercase font-medium">
          {$t("Name")}
        </div>
      </div>

      <div class="col-spans-1 py-3 h-max">
        <div class="text-right text-xs uppercase font-medium">
          {$t("Protocol")}
        </div>
      </div>

      <div class="col-spans-1 py-3 h-max">
        <div class="flex justify-end text-xs uppercase font-medium">
          <div
            class="flex items-center justify-end gap-2 cursor-pointer w-max"
            on:click={() => {
              toggleSortWhalesList("apy");
            }}
          >
            APY
            <div>
              {@html sortIcon(
                orderBy.split(":")[0] === "apy"
                  ? orderBy.split(":")[1]
                  : "default",
              )}
            </div>
          </div>
        </div>
      </div>

      <div class="col-spans-1 py-3 h-max">
        <div class="flex justify-end text-xs uppercase font-medium">
          <div
            class="flex items-center justify-end gap-2 cursor-pointer w-max"
            on:click={() => {
              toggleSortWhalesList("tvl");
            }}
          >
            TVL
            <div>
              {@html sortIcon(
                orderBy.split(":")[0] === "tvl"
                  ? orderBy.split(":")[1]
                  : "default",
              )}
            </div>
          </div>
        </div>
      </div>

      <div class="col-spans-2 py-3 pr-3 h-max">
        <div class="text-right text-xs uppercase font-medium">
          {$t("Tags")}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-6">
      {#if !isLoading}
        {#if filteredBySelectedTokenHolding?.length === 0}
          <div
            class="col-span-full flex justify-center items-center h-[50vh] py-3 px-3 text-base text-gray-400"
          >
            {$t("Empty")}
          </div>
        {:else}
          <div class="col-span-full w-full h-full overflow-y-auto">
            {#each filteredBySelectedTokenHolding as item}
              <div
                class={`w-full grid grid-cols-6 group transition-all cursor-pointer min-h-[53px] overflow-hidden ${item.protocol === "Suilend" && item.name === "sSUI" ? "border border-yellow-300 rounded-[10px]" : ""}`}
                on:click={() => {
                  showSideYieldDetail = true;
                  selectedProtocol = item;

                  const selectedHolding = holdingTokenData.find(
                    (eachHolding) =>
                      eachHolding?.name?.toLowerCase() ===
                        item?.name?.toLowerCase() ||
                      eachHolding?.symbol?.toLowerCase() ===
                        item?.symbol?.toLowerCase(),
                  );

                  if (selectedHolding) {
                    selectedTokenDetail.update((n) => (n = selectedHolding));
                  } else {
                    const isPoolTONJETTON = item.name.includes("TON-");
                    if (isPoolTONJETTON) {
                      const selectedTonHolding = holdingTokenData.find(
                        (eachHolding) =>
                          eachHolding?.name?.toLowerCase() === "ton" ||
                          eachHolding?.symbol?.toLowerCase() === "ton",
                      );
                      selectedTokenDetail.update(
                        (n) => (n = selectedTonHolding),
                      );
                    } else {
                      selectedTokenDetail.update(
                        (n) =>
                          (n = {
                            logo: item.logo,
                            name: item.name,
                            symbol: item.name,
                          }),
                      );
                    }
                  }
                }}
              >
                <div
                  class={`col-spans-1 pl-3 py-2 relative ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                >
                  <div
                    class="text-sm text-left h-full font-medium flex items-center"
                  >
                    {item.name}
                  </div>

                  {#if item.protocol === "Suilend" && item.name === "sSUI"}
                    <div class="absolute top-0 left-0">
                      <div
                        class="w-max flex items-center justyfy-center text-[9px] font-medium text-yellow-300 bg-[#fde04766] px-[8px] pb-[2px] pt-[1px] rounded-br-[3px]"
                      >
                        Featured
                      </div>
                    </div>
                  {/if}
                </div>

                <div
                  class={`col-spans-1 py-2 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                >
                  <div
                    class="text-sm text-right h-full font-medium flex flex-col justify-center items-end"
                  >
                    {formatString(item.protocol)}
                  </div>
                </div>

                <div
                  class={`col-spans-1 py-2 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                >
                  <div
                    class="text-sm text-right h-full font-medium flex justify-end items-center"
                  >
                    <TooltipNumber
                      number={item.apy * 100}
                      type={`${item.apy * 100 > 100000 ? "balance" : "percent"}`}
                    />%
                  </div>
                </div>

                <div
                  class={`col-spans-1 py-2 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                >
                  <div
                    class="text-sm text-right h-full font-medium flex justify-end items-center"
                  >
                    {#if Number(item.tvl) < 10}
                      <span>{`<$10`}</span>
                    {:else}
                      <TooltipNumber number={item.tvl} type="value" />
                    {/if}
                  </div>
                </div>

                <div
                  class={`col-spans-2 py-2 pr-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                >
                  <div
                    class="h-full flex justify-end items-center text-sm font-medium flex-wrap gap-1"
                  >
                    {#each item?.label?.map((eachLabel) => {
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
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}

      {#if isLoading}
        <div
          class="col-span-full flex justify-center items-center h-[50vh] py-3 px-3"
        >
          {#if isNimbusVersion}
            <LoadingPremium />
          {:else}
            <Loading />
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <div
    class={`xl:hidden block border border_0000001a rounded-[10px] overflow-y-auto h-full ${$isDarkMode ? "bg-[#222222]" : "bg-[#fff]"}`}
  >
    {#if isLoading}
      <div class="flex justify-center items-center h-screen py-3 px-3">
        {#if isNimbusVersion}
          <LoadingPremium />
        {:else}
          <Loading />
        {/if}
      </div>
    {:else}
      <div class="w-full">
        {#if filteredBySelectedTokenHolding && filteredBySelectedTokenHolding?.length === 0}
          <div
            class="flex justify-center items-center h-screen py-3 px-3 text-lg text-gray-400"
          >
            {$t("Empty")}
          </div>
        {:else}
          {#each filteredBySelectedTokenHolding as item}
            <div
              class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4 px-3"
            >
              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  {$t("Name")}
                </div>
                <div
                  class="text-sm text-left text_00000099 font-medium flex items-center gap-1"
                >
                  {#if item.protocol === "Suilend" && item.name === "sSUI"}
                    <div
                      class="w-max flex items-center justyfy-center px-2 py-1 text-[10px] font-medium text-yellow-300 bg-[#fde04766] rounded-[1000px]"
                    >
                      Featured
                    </div>
                  {/if}
                  {item.name}
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  {$t("Protocol")}
                </div>
                <div class="text-sm text-left text_00000099 font-medium">
                  {formatString(item.protocol)}
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">APY</div>
                <div
                  class="text-sm text-right font-medium flex items-center justify-end text_00000099"
                >
                  <TooltipNumber
                    number={item.apy * 100}
                    type={`${item.apy * 100 > 100000 ? "balance" : "percent"}`}
                  />%
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">TVL</div>
                <div
                  class="text-sm text-right font-medium flex flex-col items-end gap-1 text_00000099"
                >
                  {#if Number(item.tvl) < 10}
                    <span>{`<$10`}</span>
                  {:else}
                    <TooltipNumber number={item.tvl} type="value" />
                  {/if}
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  {$t("Tags")}
                </div>
                <div
                  class="flex justify-end items-center text-sm font-medium flex-wrap gap-1"
                >
                  {#if item.label && item.label.length !== 0}
                    {#each item.label.map((eachLabel) => {
                      return { label: eachLabel, textColor: tagColor(eachLabel).textColor, backgroundColor: tagColor(eachLabel).backgroundColor };
                    }) as eachLabel}
                      <div
                        class="w-max text-sm rounded-[30px] px-2 py-1"
                        style="background-color: {eachLabel?.backgroundColor}; color: {eachLabel?.textColor};"
                      >
                        {formatLabel(eachLabel.label)}
                      </div>
                    {/each}
                  {:else}
                    <div class="text-sm text-right text_00000099">-</div>
                  {/if}
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  {$t("Action")}
                </div>
                <div
                  class="flex justify-center cursor-pointer"
                  on:click={() => {
                    showSideYieldDetail = true;
                    selectedProtocol = item;

                    const selectedHoldingProtocol = holdingTokenData.find(
                      (eachHolding) =>
                        eachHolding?.name?.toLowerCase() ===
                          item?.name?.toLowerCase() ||
                        eachHolding?.symbol?.toLowerCase() ===
                          item?.symbol?.toLowerCase(),
                    );

                    if (selectedHoldingProtocol) {
                      selectedTokenDetail.update(
                        (n) => (n = selectedHoldingProtocol),
                      );
                    } else {
                      selectedTokenDetail.update(
                        (n) =>
                          (n = {
                            logo: item.logo,
                            name: item.name,
                            symbol: item.name,
                          }),
                      );
                    }
                  }}
                >
                  <div class="w-[20px] h-[20px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink"
                      version="1.1"
                      viewBox="0 0 256 256"
                      xml:space="preserve"
                    >
                      <defs />
                      <g
                        style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                        fill={$isDarkMode ? "white" : "#00000080"}
                        transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
                      >
                        <path
                          d="M 87.994 0 H 69.342 c -1.787 0 -2.682 2.16 -1.418 3.424 l 5.795 5.795 l -33.82 33.82 L 28.056 31.196 l -3.174 -3.174 c -1.074 -1.074 -2.815 -1.074 -3.889 0 L 0.805 48.209 c -1.074 1.074 -1.074 2.815 0 3.889 l 3.174 3.174 c 1.074 1.074 2.815 1.074 3.889 0 l 15.069 -15.069 l 14.994 14.994 c 1.074 1.074 2.815 1.074 3.889 0 l 1.614 -1.614 c 0.083 -0.066 0.17 -0.125 0.247 -0.202 l 37.1 -37.1 l 5.795 5.795 C 87.84 23.34 90 22.445 90 20.658 V 2.006 C 90 0.898 89.102 0 87.994 0 z"
                          style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                          transform=" matrix(1 0 0 1 0 0) "
                          fill={$isDarkMode ? "white" : "#00000080"}
                          stroke-linecap="round"
                        />
                        <path
                          d="M 65.626 37.8 v 49.45 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 23.518 L 65.626 37.8 z"
                          style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                          fill={$isDarkMode ? "white" : "#00000080"}
                          transform=" matrix(1 0 0 1 0 0) "
                          stroke-linecap="round"
                        />
                        <path
                          d="M 47.115 56.312 V 87.25 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 42.03 L 47.115 56.312 z"
                          style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                          fill={$isDarkMode ? "white" : "#00000080"}
                          transform=" matrix(1 0 0 1 0 0) "
                          stroke-linecap="round"
                        />
                        <path
                          d="M 39.876 60.503 c -1.937 0 -3.757 -0.754 -5.127 -2.124 l -6.146 -6.145 V 87.25 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 59.844 C 41.952 60.271 40.933 60.503 39.876 60.503 z"
                          style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                          fill={$isDarkMode ? "white" : "#00000080"}
                          transform=" matrix(1 0 0 1 0 0) "
                          stroke-linecap="round"
                        />
                        <path
                          d="M 22.937 46.567 L 11.051 58.453 c -0.298 0.298 -0.621 0.562 -0.959 0.8 V 87.25 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 48.004 L 22.937 46.567 z"
                          style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                          fill={$isDarkMode ? "white" : "#00000080"}
                          transform=" matrix(1 0 0 1 0 0) "
                          stroke-linecap="round"
                        />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Modal Scallop Farm -->
<AppOverlay
  isOpen={$showScallopDeFiFarmModal}
  on:close={() => {
    showScallopDeFiFarmModal.update((n) => (n = false));
  }}
  clickOutSideToClose={false}
>
  {#if $showScallopDeFiFarmModal}
    <ScallopProvideLiquidity {holdingTokenData} />
  {/if}
</AppOverlay>

<!-- Modal Stonfi Farm -->
<AppOverlay
  isOpen={$showStonfiDeFiFarmModal}
  on:close={() => {
    showStonfiDeFiFarmModal.update((n) => (n = false));
  }}
  clickOutSideToClose={false}
>
  {#if $showStonfiDeFiFarmModal}
    <StonfiProvideLiquidity
      {selectedProtocol}
      {listTONToken}
      isLoading={$queryListToken.isFetching}
      poolName={selectedProtocol?.name?.split("-")}
      {holdingTokenData}
    />
  {/if}
</AppOverlay>

<!-- Modal Bridge -->
<AppOverlay
  isOpen={$showModalBridge}
  on:close={() => {
    showModalBridge.update((n) => (n = false));
  }}
  clickOutSideToClose={false}
>
  {#if $showModalBridge}
    <div class="font-semibold title-3">
      {$t("Bridge")}
    </div>
    <Bridge />
  {/if}
</AppOverlay>

<!-- Sidebar Yield Detail -->
<OverlaySidebar isOpen={showSideYieldDetail}>
  <div class="flex justify-between items-start">
    <div
      class="text-5xl text-gray-500 cursor-pointer"
      on:click|stopPropagation={() => {
        showSideYieldDetail = false;
      }}
    >
      &times;
    </div>

    {#if selectedProtocol && Object.keys(selectedProtocol).length !== 0}
      <div class="flex flex-col">
        <div class="font-medium text-xl">{selectedProtocol?.name}</div>
        <div class="font-medium text_00000080 text-base">
          {formatString(selectedProtocol?.protocol)}
        </div>
      </div>
    {/if}
  </div>

  <div class="flex flex-col gap-4 -mt-3">
    <div class="w-full flex justify-end">
      {#if selectedProtocol?.protocol?.toLowerCase() === "scallop" || (selectedProtocol?.protocol?.toLowerCase() === "ston.fi" && selectedProtocol.reward.version === 2)}
        <div class="w-[140px]">
          <Button
            on:click={() => {
              if (selectedProtocol?.protocol?.toLowerCase() === "ston.fi") {
                showStonfiDeFiFarmModal.update((n) => (n = true));
              }
              if (selectedProtocol?.protocol?.toLowerCase() === "scallop") {
                showScallopDeFiFarmModal.update((n) => (n = true));
              }
            }}
          >
            {$t("Invest")}
          </Button>
        </div>
      {:else}
        <a class="w-[140px]" href={selectedProtocol?.farmLink} target="_blank">
          <Button>{$t("Invest")}</Button>
        </a>
      {/if}
    </div>

    {#if showSideYieldDetail}
      <YieldDetail {selectedChain} {selectedProtocol} {showSideYieldDetail} />
    {/if}
  </div>
</OverlaySidebar>

<style>
</style>
