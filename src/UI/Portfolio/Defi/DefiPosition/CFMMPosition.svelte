<script lang="ts">
  import { isDarkMode, typeWallet } from "~/store";
  import {
    DEFIPositionHistorySupported,
    positionHistorySupported,
  } from "./utils";
  import { shorterName } from "~/utils";
  import tooltip from "~/lib/tooltip";
  import { t } from "~/lib/i18n";

  import OverlaySidebar from "~/components/OverlaySidebar.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Image from "~/components/Image.svelte";
  import Table from "~/components/Table.svelte";
  import DefiPositionHistory from "../DefiPositionHistory/DefiPositionHistory.svelte";

  import defaultToken from "~/assets/defaultToken.png";
  import TrendUp from "~/assets/trend-up.svg";
  import TrendDown from "~/assets/trend-down.svg";
  import information from "~/assets/information_content.svg";
  import information_white from "~/assets/information_white.svg";

  export let protocolInfo;
  export let data;

  // const handleCalculatePnl = (data: any) => {
  //   if (data?.yieldCollected?.length === 0 || !data?.yieldCollected) {
  //     return 0;
  //   }

  //   const totalInputValue = data?.input?.reduce(
  //     (prev: any, item: any) => prev + Number(item.value),
  //     0,
  //   );

  //   const totalYieldCollected = data?.yieldCollected?.reduce(
  //     (prev: any, item: any) => prev + Number(item.value),
  //     0,
  //   );

  //   return totalInputValue === 0
  //     ? 0
  //     : totalYieldCollected / Math.abs(totalInputValue);
  // };

  const handleCalculateROI = (data: any) => {
    const totalInputValue =
      data?.current?.tokens?.reduce(
        (prev: any, item: any) => prev + Number(item.value),
        0,
      ) || 0;

    const totalYield =
      data?.current?.yield?.reduce(
        (prev: any, item: any) => prev + Number(item.value),
        0,
      ) || 0;

    const totalYieldCollected =
      data?.yieldCollected?.reduce(
        (prev: any, item: any) => prev + Number(item.value),
        0,
      ) || 0;

    return totalInputValue === 0
      ? 0
      : ((totalYieldCollected + totalYield) / totalInputValue) * 100;
  };

  const handleCalculateValue = (data: any) => {
    const totalInputValue =
      data?.current?.tokens?.reduce(
        (prev: any, item: any) => prev + Number(item.value),
        0,
      ) || 0;
    const totalYieldCollected =
      data?.current?.yield?.reduce(
        (prev: any, item: any) => prev + Number(item.value),
        0,
      ) || 0;

    return totalInputValue + totalYieldCollected;
  };

  $: formatData = data.sort(
    (a: any, b: any) => handleCalculateValue(b) - handleCalculateValue(a),
  );

  let showPositionDetail = false;
  let selectedPosition = {};

  const closeSideBar = (event: any) => {
    if (event.key === "Escape") {
      showPositionDetail = false;
      selectedPosition = {};
    }
  };
</script>

<svelte:window on:keydown={closeSideBar} />

<Table isStyleTable={false}>
  <span slot="desktop">
    <div class="bg_f4f5f8 grid grid-cols-4">
      <div class="pl-3 py-3">
        <div class="text-left text-xs uppercase font-medium">
          {$t("Liquidity Pool")}
        </div>
      </div>

      <div class="py-3">
        <div class="text-xs uppercase font-medium">{$t("Token")}</div>
      </div>

      <div class="py-3">
        <div class="text-xs uppercase font-medium">{$t("Yield")}</div>
      </div>

      <!-- <div class="py-3 pr-3">
        <div class="text-right text-xs uppercase font-medium">PnL</div>
      </div> -->

      <div class="py-3 pr-3">
        <div class="text-right text-xs uppercase font-medium">
          {$t("Value")}
        </div>
      </div>
    </div>

    {#each formatData as itemRow}
      <div
        class={`grid grid-cols-4 group transition-all ${$isDarkMode ? "bg_f4f5f8" : ""} ${
          DEFIPositionHistorySupported.includes($typeWallet) &&
          positionHistorySupported.includes(protocolInfo.protocol) &&
          protocolInfo.protocol !== "Aerodrome Finance"
            ? "cursor-pointer"
            : ""
        }`}
        on:click={() => {
          if (
            DEFIPositionHistorySupported.includes($typeWallet) &&
            positionHistorySupported.includes(protocolInfo.protocol) &&
            protocolInfo.protocol !== "Aerodrome Finance"
          ) {
            showPositionDetail = true;
            selectedPosition = itemRow;
          }
        }}
      >
        <div
          class={`pl-3 py-3 ${
            $isDarkMode ? "group-hover:bg-[#000]" : "group-hover:bg-gray-100"
          }`}
        >
          <div class="flex flex-col gap-2 m-auto h-full">
            {#if itemRow.tags && itemRow.tags.length !== 0}
              <div class="flex items-center gap-1 flex-wrap">
                {#each itemRow.tags as tag}
                  <div
                    class="w-max flex items-center justyfy-center px-2 py-1 text_27326F text-xs font-medium bg-[#1e96fc33] rounded-[1000px]"
                  >
                    {tag}
                  </div>
                {/each}
              </div>
            {/if}
            <div class="flex flex-col gap-2">
              {#each itemRow?.input || [] as item}
                <div class="flex items-center gap-1">
                  <div class="rounded-full w-6 h-6 overflow-hidden">
                    <Image
                      defaultLogo={defaultToken}
                      logo={item?.token?.logo || defaultToken}
                    />
                  </div>
                  <div class="text-left text-sm font-medium text_00000099">
                    {#if item?.token?.name?.length > 18}
                      {shorterName(item?.token?.name, 18)}
                    {:else}
                      {item?.token?.name || item?.token?.symbol || "N/A"}
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div
          class={`py-3 ${
            $isDarkMode ? "group-hover:bg-[#000]" : "group-hover:bg-gray-100"
          }`}
        >
          <div
            class="text-left text-sm text_00000099 font-medium gap-2 flex items-start gap-4 h-full"
          >
            <div class="flex flex-col gap-2">
              {#each itemRow?.current?.tokens || [] as token}
                <div class="flex items-center gap-2">
                  <div class="rounded-full w-6 h-6 overflow-hidden">
                    <Image
                      defaultLogo={defaultToken}
                      logo={token?.token?.logo || defaultToken}
                    />
                  </div>
                  <div class="flex flex-col">
                    <div class="flex items-center gap-1">
                      <TooltipNumber
                        number={token?.amount || 0}
                        type="amount"
                      />
                      {token?.token?.symbol || ""}
                    </div>
                    <div class="text-gray-400 text-xs">
                      <TooltipNumber number={token?.value || 0} type="value" />
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div
          class={`py-3 ${
            $isDarkMode ? "group-hover:bg-[#000]" : "group-hover:bg-gray-100"
          }`}
        >
          <div
            class="text-left text-sm text_00000099 font-medium gap-2 flex items-start gap-4 h-full"
          >
            <div class="flex flex-col gap-2">
              {#each itemRow?.current?.yield || [] as yieldData}
                {#if yieldData?.amount !== 0}
                  <div class="flex items-center gap-2">
                    <div class="rounded-full w-6 h-6 overflow-hidden">
                      <Image
                        defaultLogo={defaultToken}
                        logo={yieldData?.token?.logo || defaultToken}
                      />
                    </div>
                    <div class="flex flex-col">
                      <div class="flex items-center gap-1">
                        <TooltipNumber
                          number={yieldData?.amount || 0}
                          type="amount"
                        />
                        {yieldData?.token?.symbol || ""}
                      </div>
                      <div class="text-gray-400 text-xs">
                        <TooltipNumber
                          number={yieldData?.value || 0}
                          type="value"
                        />
                      </div>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        </div>

        <!-- <div
          class={`py-3 ${
            $isDarkMode ? "group-hover:bg-[#000]" : "group-hover:bg-gray-100"
          }`}
        >
          <div
            class="text-right text-sm text_00000099 font-medium flex justify-end h-full"
          >
            <div class="my-auto">
              <TooltipNumber
                number={handleCalculatePnl(itemRow)}
                type="value"
              />
            </div>
          </div>
        </div> -->

        <div
          class={`py-3 pr-3 ${
            $isDarkMode ? "group-hover:bg-[#000]" : "group-hover:bg-gray-100"
          }`}
        >
          <div
            class="text-right text-sm text_00000099 font-medium flex justify-end h-full"
          >
            <div class="flex flex-col items-end justify-center">
              <TooltipNumber
                number={handleCalculateValue(itemRow)}
                type="value"
                personalValue
              />
              <div class="flex items-center gap-1">
                ROI <img
                  src={$isDarkMode ? information_white : information}
                  alt=""
                  class="w-3 h-3"
                  use:tooltip={{
                    content: `<tooltip-detail text="Yield / Principal" />`,
                    allowHTML: true,
                    placement: "top",
                    interactive: true,
                  }}
                />: {#if handleCalculateROI(itemRow) !== 0}
                  <div
                    class={`flex items-center gap-1 ${
                      handleCalculateROI(itemRow) !== 0
                        ? handleCalculateROI(itemRow) >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                        : "text_00000099"
                    }`}
                  >
                    <span>
                      <TooltipNumber
                        number={Math.abs(handleCalculateROI(itemRow))}
                        type={Math.abs(handleCalculateROI(itemRow)) > 999999
                          ? "balance"
                          : "percent"}
                      />%
                    </span>
                    <img
                      src={handleCalculateROI(itemRow) !== 0
                        ? handleCalculateROI(itemRow) >= 0
                          ? TrendUp
                          : TrendDown
                        : ""}
                      alt="trend"
                      class="mb-1"
                    />
                  </div>
                {:else}
                  -
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </span>

  <span slot="mobile">
    {#each data as itemRow}
      <div
        class="flex flex-col gap-6 border-b-[1px] border_0000000d last:border-none py-4"
      >
        <div class="flex justify-between items-start">
          <div class="text-right text-sm uppercase font-medium">
            {$t("Liquidity Pool")}
          </div>
          <div
            class="flex items-center justify-end font-medium text-sm text_00000099"
          >
            <div class="flex flex-col gap-2 m-auto h-full">
              {#if itemRow.tags && itemRow.tags.length !== 0}
                <div class="flex items-center gap-1 flex-wrap">
                  {#each itemRow.tags as tag}
                    <div
                      class="w-max flex items-center justyfy-center px-2 py-1 text_27326F text-xs font-medium bg-[#1e96fc33] rounded-[1000px]"
                    >
                      {tag}
                    </div>
                  {/each}
                </div>
              {/if}
              <div class="flex flex-col gap-2">
                {#each itemRow?.input || [] as item}
                  <div class="flex items-center gap-1">
                    <div class="rounded-full w-6 h-6 overflow-hidden">
                      <Image
                        defaultLogo={defaultToken}
                        logo={item?.token?.logo || defaultToken}
                      />
                    </div>
                    <div class="text-left text-sm font-medium text_00000099">
                      {#if item?.token?.name?.length > 18}
                        {shorterName(item?.token?.name, 18)}
                      {:else}
                        {item?.token?.name || item?.token?.symbol || "N/A"}
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-start">
          <div class="text-right text-sm uppercase font-medium">
            {$t("Token")}
          </div>
          <div
            class="flex items-center justify-end font-medium text-sm text_00000099"
          >
            <div class="flex flex-col gap-2">
              {#each itemRow?.current?.tokens || [] as token}
                <div class="flex items-center gap-2">
                  <div class="rounded-full w-6 h-6 overflow-hidden">
                    <Image
                      defaultLogo={defaultToken}
                      logo={token?.token?.logo || defaultToken}
                    />
                  </div>
                  <div class="flex flex-col">
                    <div class="flex items-center gap-1">
                      <TooltipNumber
                        number={token?.amount || 0}
                        type="amount"
                      />
                      {token?.token?.symbol || ""}
                    </div>
                    <div class="text-gray-400 text-xs">
                      <TooltipNumber number={token?.value || 0} type="value" />
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="flex justify-between items-start">
          <div class="text-right text-sm uppercase font-medium">
            {$t("Yield")}
          </div>
          <div
            class="flex items-center justify-end font-medium text-sm text_00000099"
          >
            <div class="flex flex-col gap-2">
              {#each itemRow?.current?.yield || [] as yieldData}
                {#if yieldData?.amount !== 0}
                  <div class="flex items-center gap-2">
                    <div class="rounded-full w-6 h-6 overflow-hidden">
                      <Image
                        defaultLogo={defaultToken}
                        logo={yieldData?.token?.logo || defaultToken}
                      />
                    </div>
                    <div class="flex flex-col">
                      <div class="flex items-center gap-1">
                        <TooltipNumber
                          number={yieldData?.amount || 0}
                          type="amount"
                        />
                        {yieldData?.token?.symbol || ""}
                      </div>
                      <div class="text-gray-400 text-xs">
                        <TooltipNumber
                          number={yieldData?.value || 0}
                          type="value"
                        />
                      </div>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        </div>

        <!-- <div class="flex justify-between items-start">
          <div class="text-right text-sm uppercase font-medium">PnL</div>
          <div
            class="flex items-center justify-end font-medium text-sm text_00000099"
          >
            <TooltipNumber number={handleCalculatePnl(itemRow)} type="value" />
          </div>
        </div> -->

        <div class="flex justify-between items-start">
          <div class="text-right text-sm uppercase font-medium">
            {$t("Value")}
          </div>
          <div
            class="flex items-center justify-end font-medium text-sm text_00000099"
          >
            <div class="flex flex-col items-end justify-center">
              <TooltipNumber
                number={handleCalculateValue(itemRow)}
                type="value"
                personalValue
              />
              <div class="flex items-center gap-1">
                ROI <img
                  src={$isDarkMode ? information_white : information}
                  alt=""
                  class="w-3 h-3"
                  use:tooltip={{
                    content: `<tooltip-detail text="Yield / Principal" />`,
                    allowHTML: true,
                    placement: "top",
                    interactive: true,
                  }}
                />: {#if handleCalculateROI(itemRow) !== 0}
                  <div
                    class={`flex items-center gap-1 ${
                      handleCalculateROI(itemRow) !== 0
                        ? handleCalculateROI(itemRow) >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                        : "text_00000099"
                    }`}
                  >
                    <span>
                      <TooltipNumber
                        number={Math.abs(handleCalculateROI(itemRow))}
                        type={Math.abs(handleCalculateROI(itemRow)) > 999999
                          ? "balance"
                          : "percent"}
                      />%
                    </span>
                    <img
                      src={handleCalculateROI(itemRow) !== 0
                        ? handleCalculateROI(itemRow) >= 0
                          ? TrendUp
                          : TrendDown
                        : ""}
                      alt="trend"
                      class="mb-1"
                    />
                  </div>
                {:else}
                  -
                {/if}
              </div>
            </div>
          </div>
        </div>

        {#if DEFIPositionHistorySupported.includes($typeWallet) && positionHistorySupported.includes(protocolInfo.protocol) && protocolInfo.protocol !== "Aerodrome Finance"}
          <div class="flex justify-between items-center">
            <div class="text-right text-sm uppercase font-medium mt-1">
              {$t("Action")}
            </div>
            <div
              class="flex justify-center cursor-pointer"
              on:click={() => {
                showPositionDetail = true;
                selectedPosition = itemRow;
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
        {/if}
      </div>
    {/each}
  </span>
</Table>

<!-- Sidebar Position Detail -->
<OverlaySidebar isOpen={showPositionDetail}>
  <div class="flex justify-between items-center">
    <div
      class="text-5xl text-gray-500 cursor-pointer"
      on:click|stopPropagation={() => {
        showPositionDetail = false;
        selectedPosition = {};
      }}
    >
      &times;
    </div>
    <div class="flex items-center gap-2">
      <div class="rounded-full w-6 h-6 overflow-hidden">
        <Image
          defaultLogo={defaultToken}
          logo={protocolInfo?.logo || defaultToken}
        />
      </div>
      <div class="text-xl font-medium">
        {protocolInfo?.protocol || ""}
      </div>
      {#if protocolInfo?.url}
        <a href={protocolInfo?.url} target="_blank">
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            ><path
              d="M6.66667 2H6.33333V2C5.40365 2 4.93881 2 4.55518 2.0921C3.33635 2.38472 2.38472 3.33635 2.0921 4.55518C2 4.93881 2 5.40365 2 6.33333V8.66667C2 10.5335 2 11.4669 2.36331 12.18C2.68289 12.8072 3.19282 13.3171 3.82003 13.6367C4.53307 14 5.46649 14 7.33333 14H9.66667C10.5964 14 11.0612 14 11.4448 13.9079C12.6636 13.6153 13.6153 12.6636 13.9079 11.4448C14 11.0612 14 10.5964 14 9.66667V9.66667V9.33333M8 8L14 2M14 2H10M14 2V6"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path></svg
          >
        </a>
      {/if}
    </div>
  </div>
  {#if showPositionDetail}
    <DefiPositionHistory data={selectedPosition} {showPositionDetail} />
  {/if}
</OverlaySidebar>

<style></style>
