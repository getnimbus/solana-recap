<script lang="ts">
  import { isDarkMode, typeWallet } from "~/store";
  import { shorterAddress } from "~/utils";
  import {
    DEFIPositionHistorySupported,
    positionHistorySupported,
  } from "./utils";
  import { shorterName } from "~/utils";
  import tooltip from "~/lib/tooltip";
  import { t } from "~/lib/i18n";

  import OverlaySidebar from "~/components/OverlaySidebar.svelte";
  import Table from "~/components/Table.svelte";
  import StatusModalUi from "~/components/StatusModalUI.svelte";
  import AppOverlay from "~/components/Overlay.svelte";
  import ScallopWithdraw from "../ScallopWithdraw.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Image from "~/components/Image.svelte";
  import DefiPositionHistory from "../DefiPositionHistory/DefiPositionHistory.svelte";

  import defaultToken from "~/assets/defaultToken.png";
  import TrendUp from "~/assets/trend-up.svg";
  import TrendDown from "~/assets/trend-down.svg";
  import information from "~/assets/information_content.svg";
  import information_white from "~/assets/information_white.svg";

  export let data;
  export let protocolInfo;

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

  let showPositionDetail = false;
  let selectedPosition: any = {};
  let statusData: any = {};
  let isOpenModalStatus = false;

  const handleShowStatusModal = (data: any) => {
    statusData = data;
    isOpenModalStatus = true;
  };

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
    <div class="bg_f4f5f8 grid grid-cols-5">
      <div class="pl-3 py-3">
        <div class="text-left text-xs uppercase font-medium">
          {$t("Invested")}
        </div>
      </div>

      <div class="py-3">
        <div class="text-xs uppercase font-medium">
          {$t("Token")}
        </div>
      </div>

      <div class="col-spans-2 py-3">
        <div class="text-xs uppercase font-medium">
          {$t("Yield")}
        </div>
      </div>

      <!-- <div class="py-3">
        <div class="text-xs uppercase font-medium">{$t("Reward")}</div>
      </div>

      <div class="py-3">
        <div class="text-right text-xs uppercase font-medium">PnL</div>
      </div> -->

      <div class="py-3 pr-3">
        <div class="text-right text-xs uppercase font-medium">
          {$t("Value")}
        </div>
      </div>
    </div>

    {#each data as itemRow}
      <div
        class={`grid grid-cols-5 group transition-all ${$isDarkMode ? "bg_f4f5f8" : ""} ${
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
          class={`col-spans-2 py-3 ${
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
            $isDarkMode
              ? "group-hover:bg-[#000]"
              : "group-hover:bg-gray-100"
          }`}
        >
          <div
            class="text-left text-sm text_00000099 font-medium gap-2 flex items-center gap-4 h-full"
          >
            <div class="flex flex-col gap-2">
              {#each itemRow?.yieldCollected || [] as reward}
                {#if reward?.amount !== 0}
                  <div class="flex items-center gap-1">
                    <div class="rounded-full w-6 h-6 overflow-hidden">
                      <Image
                        defaultLogo={defaultToken}
                        logo={reward?.token?.logo || defaultToken}
                      />
                    </div>

                    <TooltipNumber number={reward?.amount} type="amount" />
                    {reward?.token?.symbol || ""}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        </div>

        <div
          class={`py-3 ${
            $isDarkMode
              ? "group-hover:bg-[#000]"
              : "group-hover:bg-gray-100"
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
            {$t("Invested")}
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
          <div class="text-right text-sm uppercase font-medium">{$t("Reward")}</div>
          <div
            class="flex items-center justify-end font-medium text-sm text_00000099"
          >
            <div class="flex flex-col gap-2">
              {#each itemRow?.yieldCollected || [] as reward}
                {#if reward?.amount !== 0}
                  <div class="flex items-center gap-1">
                    <div class="rounded-full w-6 h-6 overflow-hidden">
                      <Image
                        defaultLogo={defaultToken}
                        logo={reward?.token?.logo || defaultToken}
                      />
                    </div>

                    <TooltipNumber number={reward?.amount} type="amount" />
                    {reward?.token?.symbol || ""}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        </div>

        <div class="flex justify-between items-start">
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
          <div class="flex justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Action")}
            </div>
            <div
              class="flex items-center justify-end font-medium text-sm text_00000099"
            >
              <div
                class="w-[20px] h-[20px] cursor-pointer"
                on:click={() => {
                  showPositionDetail = true;
                  selectedPosition = itemRow;
                }}
              >
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  ><g fill={$isDarkMode ? "white" : "#00000080"}
                    ><path
                      clip-rule="evenodd"
                      d="m23 4c0-1.65685-1.3431-3-3-3h-16c-1.65685 0-3 1.34315-3 3v10c0 1.6569 1.34315 3 3 3h1c.55228 0 1-.4477 1-1s-.44772-1-1-1h-1c-.55228 0-1-.4477-1-1v-6h18v6c0 .5523-.4477 1-1 1h-1c-.5523 0-1 .4477-1 1s.4477 1 1 1h1c1.6569 0 3-1.3431 3-3zm-2 2v-2c0-.55228-.4477-1-1-1h-16c-.55228 0-1 .44771-1 1v2z"
                      fill-rule="evenodd"
                    /><path
                      d="m13 22c0 .5523-.4477 1-1 1s-1-.4477-1-1v-5.5931l-1.29286 1.2927c-.39057.3907-1.02368.3907-1.41425 0-.3905-.3903-.3905-1.0236 0-1.414l2.99951-2.9933c.3906-.3899 1.0232-.3895 1.4135.0007l2.9991 2.9992c.3906.3906.3906 1.0237 0 1.4143-.3905.3904-1.0237.3904-1.4142 0l-1.2908-1.2908z"
                    /></g
                  ></svg
                >
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
    {#if ["Scallop"].includes(protocolInfo?.protocol)}
      <ScallopWithdraw {handleShowStatusModal} {selectedPosition} />
    {/if}
    <DefiPositionHistory data={selectedPosition} {showPositionDetail} />
  {/if}
</OverlaySidebar>

<AppOverlay
  clickOutSideToClose
  isOpen={isOpenModalStatus}
  on:close={() => {
    isOpenModalStatus = false;
    statusData = {};
  }}
>
  <StatusModalUi
    type={statusData?.status}
    title={statusData?.status === "success" ? "Success" : "Fail"}
  >
    <span slot="msg">
      {#if statusData?.status === "fail"}
        Something wrong when try to {statusData?.type}. Please try again!
      {:else}
        You have successfully <span class="font-medium">{statusData?.type}</span
        >
        on <span class="font-medium">Scallop</span> with tx
        <span class="underline font-medium">
          <span class="font-medium underline">
            <a
              href={`https://suiscan.xyz/tx/${statusData?.tx}`}
              target="_blank"
            >
              {shorterAddress(statusData?.tx)}
            </a>
          </span>
        </span>
      {/if}
    </span>
  </StatusModalUi>
</AppOverlay>

<style></style>
