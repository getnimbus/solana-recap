<script lang="ts">
  import mixpanel from "mixpanel-browser";
  import { useNavigate } from "svelte-navigator";
  import {
    selectedPackage,
    isDarkMode,
    showScallopDeFiFarmModal,
    userPublicAddress,
  } from "~/store";
  import * as changeCase from "change-case";
  import tooltip from "~/lib/tooltip";
  import { isNimbusVersion, colorPairs } from "~/utils/constants";

  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import TooltipTitle from "~/components/TooltipTitle.svelte";
  import Button from "~/components/Button.svelte";

  import GreenTick from "~/assets/green-tick.svg";

  export let data;
  export let symbol;

  const navigate = useNavigate();

  let isShowTooltipProtocol = false;
  let isSingle = false;
  let sortTVL = "default";
  let sortAPY = "default";

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

  $: formatData =
    data
      ?.map((item) => {
        return {
          ...item,
          tvl: Number(item.tvl),
          apy: item.apy * 100,
          label: item.label.map((label) => {
            return {
              label,
              textColor: tagColor(label).textColor,
              backgroundColor: tagColor(label).backgroundColor,
            };
          }),
        };
      })
      ?.filter((item) => {
        if (isSingle) {
          return item.name === symbol;
        } else {
          return item;
        }
      }) || [];

  const toggleSortTVL = () => {
    if ($selectedPackage === "FREE") {
      return;
    }

    switch (sortTVL) {
      case "default":
        sortTVL = "asc";
        break;
      case "asc":
        sortTVL = "desc";
        break;
      case "desc":
        sortTVL = "default";
        break;
      default:
        sortTVL = "default";
    }

    if (sortTVL === "asc") {
      formatData = formatData.sort((a, b) => {
        if (a.tvl > b.tvl) {
          return 1;
        }
        if (a.tvl < b.tvl) {
          return -1;
        }
        return 0;
      });
    }

    if (sortTVL === "desc") {
      formatData = formatData.sort((a, b) => {
        if (a.tvl < b.tvl) {
          return 1;
        }
        if (a.tvl > b.tvl) {
          return -1;
        }
        return 0;
      });
    }

    if (sortTVL === "default") {
      formatData = data.map((item) => {
        return {
          ...item,
          tvl: Number(item.tvl),
          apy: item.apy * 100,
        };
      });
    }
  };

  const toggleSortAPY = () => {
    if ($selectedPackage === "FREE") {
      return;
    }

    switch (sortAPY) {
      case "default":
        sortAPY = "asc";
        break;
      case "asc":
        sortAPY = "desc";
        break;
      case "desc":
        sortAPY = "default";
        break;
      default:
        sortAPY = "default";
    }

    if (sortAPY === "asc") {
      formatData = formatData.sort((a, b) => {
        if (a.apy > b.apy) {
          return 1;
        }
        if (a.apy < b.apy) {
          return -1;
        }
        return 0;
      });
    }

    if (sortAPY === "desc") {
      formatData = formatData.sort((a, b) => {
        if (a.apy < b.apy) {
          return 1;
        }
        if (a.apy > b.apy) {
          return -1;
        }
        return 0;
      });
    }

    if (sortAPY === "default") {
      formatData = data.map((item) => {
        return {
          ...item,
          tvl: Number(item.tvl),
          apy: item.apy * 100,
        };
      });
    }
  };

  $: sortIcon = (sortType) => {
    return `<svg
                    height="0.9rem"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0" /><g
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

<div class="h-[563px] flex flex-col gap-4">
  <div
    class="flex md:flex-row flex-col gap-4 justify-between md:items-center items-start mt-6"
  >
    <div class="font-medium text-2xl">Yield farming opportunities</div>
    <div class="flex items-center">
      <div class="text-sm px-2 font-medium">Single</div>
      <label
        class={`switch ${$selectedPackage === "FREE" ? "opacity-40" : ""}`}
      >
        <input
          type="checkbox"
          checked={isSingle}
          disabled={$selectedPackage === "FREE"}
          on:click={() => {
            if ($selectedPackage === "FREE") {
              return;
            }
            isSingle = !isSingle;
          }}
        />
        <span class="slider" />
      </label>
    </div>
  </div>

  <div
    class={`xl:block hidden rounded-[10px] overflow-y-auto h-[563px] relative ${
      $isDarkMode ? "bg-[#131313]" : "bg-[#fff] border border_0000000d"
    }`}
  >
    <table
      class={`table-auto w-full ${
        formatData && formatData.length === 0 ? "h-full" : ""
      }`}
    >
      <thead>
        <tr class="bg_f4f5f8">
          <th class="pl-3 py-3 rounded-tl-[10px] w-[350px]">
            <div class="font-medium text-left uppercase text-sm">Name</div>
          </th>
          <th class="py-3">
            <div class="font-medium text-right uppercase text-sm">Chain</div>
          </th>
          <th class="py-3">
            <div class="font-medium text-right uppercase text-sm">Protocol</div>
          </th>
          <th class="py-3">
            <div
              class="flex items-center justify-end gap-2 font-medium text-right uppercase text-sm"
            >
              APY
              <div
                on:click={toggleSortAPY}
                class={`cursor-pointer ${$selectedPackage === "FREE" ? "opacity-40" : ""}`}
              >
                {@html sortIcon(sortAPY)}
              </div>
            </div>
          </th>
          <th class="py-3 pr-3 rounded-tr-[10px]">
            <div
              class="flex items-center justify-end gap-2 font-medium text-right uppercase text-sm"
            >
              <TooltipTitle
                tooltipText={"Total value locked in this protocol"}
                isBigIcon>TVL</TooltipTitle
              >
              <div
                on:click={toggleSortTVL}
                class={`cursor-pointer ${$selectedPackage === "FREE" ? "opacity-40" : ""}`}
              >
                {@html sortIcon(sortTVL)}
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {#if formatData && formatData.length === 0}
          <tr>
            <td colspan="5">
              <div
                class="h-full flex items-center justify-center px-3 py-3 text-base text-gray-400"
              >
                Empty
              </div>
            </td>
          </tr>
        {:else}
          {#each (formatData || [])?.slice(0, $selectedPackage === "FREE" ? 10 : undefined) as item}
            <tr
              class={`transition-all ${$selectedPackage !== "FREE" ? "cursor-pointer group" : ""}`}
              on:click={() => {
                if ($selectedPackage === "FREE") {
                  return;
                }
                window.open(item.farmLink, "_blank");
              }}
            >
              <td
                class={`pl-3 py-3 flex items-center w-[350px] gap-2 ${
                  $isDarkMode
                    ? "bg-[#131313] group-hover:bg-[#000]"
                    : "bg-white group-hover:bg-gray-100"
                }`}
              >
                {#if item.protocol.includes("scallop") && $selectedPackage !== "FREE"}
                  <img src={GreenTick} alt="" class="w-[14px] h-[14px]" />
                {/if}

                <div
                  class="font-medium text-left text-sm flex items-center gap-2"
                >
                  {#if item.name === undefined}
                    N/A
                  {:else}
                    {item.name}
                  {/if}
                  {#each item?.label as label}
                    <div
                      class="w-max flex items-center justyfy-center px-2 py-1 text-[10px] font-medium rounded-[1000px] cursor-pointer"
                      style="background-color: {label?.backgroundColor}; color: {label?.textColor};"
                    >
                      <div class="flex gap-1">{label.label}</div>
                    </div>
                  {/each}
                  {#if item?.reward && item?.reward?.boost}
                    <div
                      class="w-max flex items-center justyfy-center p-1 text_27326F text-[10px] font-medium bg-[#1e96fc33] rounded-[1000px]"
                      use:tooltip={{
                        content: `<tooltip-detail text="Open League" />`,
                        allowHTML: true,
                        placement: "top",
                        interactive: true,
                      }}
                    >
                      <svg
                        fill="currentColor"
                        height="16px"
                        width="16px"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        enable-background="new 0 0 512 512"
                      >
                        <g>
                          <g>
                            <g>
                              <path
                                d="m155.6,199.6l-8.8-147.8h218.4l-8.8,147.8c-3.7,61.7-36.2,108.3-75.5,108.3h-49.6c-39.5,0-72-46.5-75.7-108.3zm-47.2-99.8l3.9,65-42.5-65h38.6v-1.42109e-14zm333.8,0l-42.5,65 3.9-65h38.6v-1.42109e-14zm-104.2,360.4h-164c10.1-31.6 43-54.8 82-54.8 38.9,0 71.9,23.2 82,54.8zm-57.2-111.4c45.3,0 84.4-34.2 103.9-85.6l112.7-172.8c8-10.8 3.1-31.5-17.6-31.5h-73.7l1.6-26.3c0-9.3-2.9-21.6-20.6-21.6h-262.2c-18.2,0-20.6,10.7-20.6,21.6l1.6,26.3h-73.7c-20.7,0-25.6,20.8-17.6,31.5l112.7,172.8c19.5,51.4 58.6,85.5 103.9,85.5h4.2v17.3c-59.9,9.1-105.8,57-105.8,114.5 0,11.3 9.2,20.4 20.6,20.4h211.5c11.4,0 20.6-9.1 20.6-20.4 0-57.5-45.9-105.4-105.8-114.5v-17.3h4.3v0.1z"
                              />
                            </g>
                          </g>
                        </g>
                      </svg>
                    </div>
                  {/if}
                </div>

                {#if item.protocol.toLowerCase().includes("scallop")}
                  <div class="w-max">
                    <Button
                      variant="tertiary"
                      on:click={(e) => {
                        e.stopPropagation();
                        mixpanel.track(
                          `${$userPublicAddress}_farm_Scallop_clicked`,
                        );
                        showScallopDeFiFarmModal.update((n) => (n = true));
                      }}
                    >
                      <div class="text-white text-[11px]">Farm</div>
                    </Button>
                  </div>
                {/if}
              </td>

              <td
                class={`py-3 ${
                  $isDarkMode
                    ? "group-hover:bg-[#000]"
                    : "group-hover:bg-gray-100"
                }`}
              >
                <div class="flex justify-end font-medium text-sm">
                  {item.chain}
                </div>
              </td>

              <td
                class={`py-3 ${
                  $isDarkMode
                    ? "group-hover:bg-[#000]"
                    : "group-hover:bg-gray-100"
                }`}
              >
                <div class="text_00000099 font-medium flex justify-end text-sm">
                  <div
                    class="relative"
                    on:mouseover={() => {
                      isShowTooltipProtocol = true;
                    }}
                    on:mouseleave={() => (isShowTooltipProtocol = false)}
                  >
                    {#if item.protocol === undefined}
                      N/A
                    {:else}
                      {changeCase.capitalCase(item.protocol)}
                    {/if}
                  </div>
                </div>
              </td>

              <td
                class={`py-3 ${
                  $isDarkMode
                    ? "group-hover:bg-[#000]"
                    : "group-hover:bg-gray-100"
                }`}
              >
                <div class="text_00000099 font-medium flex justify-end text-sm">
                  <TooltipNumber number={item.apy} type="percent" />%
                </div>
              </td>

              <td
                class={`py-3 pr-3 ${
                  $isDarkMode
                    ? "group-hover:bg-[#000]"
                    : "group-hover:bg-gray-100"
                }`}
              >
                <div class="text_00000099 font-medium flex justify-end text-sm">
                  $<TooltipNumber number={item.tvl} type="balance" />
                </div>
              </td>
            </tr>
          {/each}
        {/if}

        {#if $selectedPackage === "FREE"}
          {#if formatData && formatData?.length > 5}
            <tr
              class={`absolute z-10 left-0 right-0 bottom-0 top-[220px] flex justify-center pt-10 backdrop-blur-md bg-gradient-to-t to-transparent ${
                $isDarkMode
                  ? "bg-black/90 from-[#000] via-[#222222]"
                  : "bg-white/95 from-white via-white"
              }`}
            >
              <td colspan="5" class="flex flex-col items-center gap-1">
                {#if isNimbusVersion}
                  <div class="text-lg font-medium">
                    Use Nimbus at its full potential
                  </div>
                {/if}
                <div class="text-base text-gray-500">
                  Upgrade to Premium to access all other <span
                    class="font-medium"
                    >{formatData?.length - 5 > 0
                      ? formatData?.length - 5
                      : ""}</span
                  > opportunities
                </div>
                <div class="mt-2 w-max">
                  <Button
                    variant="premium"
                    on:click={() => navigate("/upgrade")}>Upgrade Plan</Button
                  >
                </div>
              </td>
            </tr>
          {:else}
            <tr
              class={`absolute z-10 left-0 right-0 bottom-0 top-[160px] flex justify-center pt-10 backdrop-blur-md bg-gradient-to-t to-transparent ${
                $isDarkMode
                  ? "bg-black/90 from-[#000] via-[#222222]"
                  : "bg-white/95 from-white via-white"
              }`}
            >
              <td colspan="5" class="flex flex-col items-center gap-1">
                {#if isNimbusVersion}
                  <div class="text-lg font-medium">
                    Use Nimbus at its full potential
                  </div>
                {/if}
                <div class="text-base text-gray-500">
                  Upgrade to Premium to access all other <span
                    class="font-medium"
                    >{formatData?.length - 5 > 0
                      ? formatData?.length - 5
                      : ""}</span
                  > opportunities
                </div>
                <div class="mt-2 w-max">
                  <Button
                    variant="premium"
                    on:click={() => navigate("/upgrade")}>Upgrade Plan</Button
                  >
                </div>
              </td>
            </tr>
          {/if}
        {/if}
      </tbody>
    </table>
  </div>

  <div
    class={`xl:hidden block rounded-[10px] p-2 overflow-y-auto h-[563px] relative w-full ${
      $isDarkMode ? "bg-[#131313]" : "bg-[#fff] border border_0000000d"
    }`}
  >
    {#if formatData && formatData?.length === 0}
      <div class="flex justify-center items-center min-h-[300px] py-3 px-3">
        <div class="text-base text-gray-400">Empty</div>
      </div>
    {:else}
      <div class="relative">
        {#each (formatData || [])?.slice(0, $selectedPackage === "FREE" ? 10 : undefined) as item}
          <div
            class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4 px-2"
          >
            <div class="flex justify-between items-start">
              <div class="text-right flex items-center gap-2">
                {#if item.protocol.includes("scallop") && $selectedPackage !== "FREE"}
                  <img src={GreenTick} alt="" class="w-[16px] h-[16px]" />
                {/if}
                <div
                  class="font-medium text-left text-base flex items-center gap-2"
                >
                  {#if item.name === undefined}
                    N/A
                  {:else}
                    {item.name}
                  {/if}
                  {#if item?.reward && item?.reward?.boost}
                    <div
                      class="w-max flex items-center justyfy-center p-1 text_27326F text-[10px] font-medium bg-[#1e96fc33] rounded-[1000px]"
                      use:tooltip={{
                        content: `<tooltip-detail text="Open League" />`,
                        allowHTML: true,
                        placement: "top",
                        interactive: true,
                      }}
                    >
                      <svg
                        fill="currentColor"
                        height="16px"
                        width="16px"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        enable-background="new 0 0 512 512"
                      >
                        <g>
                          <g>
                            <g>
                              <path
                                d="m155.6,199.6l-8.8-147.8h218.4l-8.8,147.8c-3.7,61.7-36.2,108.3-75.5,108.3h-49.6c-39.5,0-72-46.5-75.7-108.3zm-47.2-99.8l3.9,65-42.5-65h38.6v-1.42109e-14zm333.8,0l-42.5,65 3.9-65h38.6v-1.42109e-14zm-104.2,360.4h-164c10.1-31.6 43-54.8 82-54.8 38.9,0 71.9,23.2 82,54.8zm-57.2-111.4c45.3,0 84.4-34.2 103.9-85.6l112.7-172.8c8-10.8 3.1-31.5-17.6-31.5h-73.7l1.6-26.3c0-9.3-2.9-21.6-20.6-21.6h-262.2c-18.2,0-20.6,10.7-20.6,21.6l1.6,26.3h-73.7c-20.7,0-25.6,20.8-17.6,31.5l112.7,172.8c19.5,51.4 58.6,85.5 103.9,85.5h4.2v17.3c-59.9,9.1-105.8,57-105.8,114.5 0,11.3 9.2,20.4 20.6,20.4h211.5c11.4,0 20.6-9.1 20.6-20.4 0-57.5-45.9-105.4-105.8-114.5v-17.3h4.3v0.1z"
                              />
                            </g>
                          </g>
                        </g>
                      </svg>
                    </div>
                  {/if}
                </div>
                {#if item.protocol.includes("scallop")}
                  <div
                    class="text-white text-sm bg-[#1e96fc] w-max py-[2px] px-2 rounded-lg"
                    on:click={(e) => {
                      e.stopPropagation();
                      mixpanel.track(
                        `${$userPublicAddress}_farm_Scallop_clicked`,
                      );
                      showScallopDeFiFarmModal.update((n) => (n = true));
                    }}
                  >
                    Farm
                  </div>
                {/if}
              </div>
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">Chain</div>
              <div
                class="flex items-center justify-end font-medium text-sm text_00000099"
              >
                {item.chain}
              </div>
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">
                Protocol
              </div>
              <div
                class="flex items-center justify-end font-medium text-sm text_00000099"
              >
                <div
                  class="relative"
                  on:mouseover={() => {
                    isShowTooltipProtocol = true;
                  }}
                  on:mouseleave={() => (isShowTooltipProtocol = false)}
                >
                  {#if item.protocol === undefined}
                    N/A
                  {:else}
                    {changeCase.capitalCase(item.protocol)}
                  {/if}
                </div>
              </div>
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">APY</div>
              <div
                class="flex items-center justify-end font-medium text-sm text_00000099"
              >
                <TooltipNumber number={item.apy} type="percent" />%
              </div>
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">TVL</div>
              <div
                class="flex items-center justify-end font-medium text-sm text_00000099"
              >
                $<TooltipNumber number={item.tvl} type="balance" />
              </div>
            </div>
          </div>
        {/each}

        {#if $selectedPackage === "FREE"}
          <div
            class={`absolute z-10 left-0 right-0 bottom-0 top-[520px] flex justify-center pt-10 backdrop-blur-md bg-gradient-to-t to-transparent ${
              $isDarkMode
                ? "bg-black/90 from-[#000] via-[#222222]"
                : "bg-white/95 from-white via-white"
            }`}
          >
            <div class="flex flex-col items-center gap-1">
              {#if isNimbusVersion}
                <div class="text-lg font-medium">
                  Use Nimbus at its full potential
                </div>
              {/if}
              <div class="text-base text-gray-500">
                Upgrade to Premium to access all other <span class="font-medium"
                  >{formatData?.length - 5 > 0
                    ? formatData?.length - 5
                    : ""}</span
                > opportunities
              </div>
              <div class="mt-2 w-max">
                <Button variant="premium" on:click={() => navigate("/upgrade")}
                  >Upgrade Plan</Button
                >
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
  }
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
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
  .slider:before {
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
  input:checked + .slider {
    background-color: #2196f3;
  }
  input:checked + .slider {
    box-shadow: 0 0 1px #2196f3;
  }
  input:checked + .slider:before {
    -webkit-transform: translateX(16px);
    -ms-transform: translateX(16px);
    transform: translateX(16px);
  }

  @media screen and (max-width: 1280px) {
    .switch {
      width: 60px;
      height: 30px;
    }

    .slider {
      border-radius: 44px;
    }

    .slider:before {
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 2px;
    }

    input:checked + .slider:before {
      -webkit-transform: translateX(26px);
      -ms-transform: translateX(26px);
      transform: translateX(26px);
    }
  }
</style>
