<script lang="ts">
  import { t } from "~/lib/i18n";
  import { isDarkMode } from "~/store";
  import { detectedChain } from "~/lib/chains";

  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Image from "~/components/Image.svelte";
  import LendingPosition from "./DefiPosition/LendingPosition.svelte";
  import StakePosition from "./DefiPosition/StakePosition.svelte";
  import BorrowPosition from "./DefiPosition/BorrowPosition.svelte";
  import VestPosition from "./DefiPosition/VestPosition.svelte";
  import AmmPosition from "./DefiPosition/AMMPosition.svelte";
  import ClmmPosition from "./DefiPosition/CLMMPosition.svelte";
  import CfmmPosition from "./DefiPosition/CFMMPosition.svelte";
  import FarmPosition from "./DefiPosition/FarmPosition.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let data;
  export let chain;
</script>

<div class="flex flex-col rounded-[20px] py-4">
  <div
    class="flex md:flex-row flex-col justify-between gap-2 md:items-center mb-6"
  >
    <div class="flex items-center gap-2">
      <div class="relative">
        <div class="rounded-full w-6 h-6 overflow-hidden">
          <Image
            defaultLogo={defaultToken}
            logo={data?.meta?.logo || defaultToken}
          />
        </div>
        <div class="absolute -top-2 -right-1">
          <img
            src={detectedChain(chain)?.logo}
            alt=""
            width="15"
            height="15"
            class="rounded-full"
          />
        </div>
      </div>
      <div class="text-xl font-medium">
        {data?.protocol || ""}
      </div>
      {#if data?.meta?.url}
        <a href={data?.meta?.url} target="_blank">
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
    <div class="text-xl font-medium">
      <TooltipNumber number={data?.sum} type="value" personalValue />
    </div>
  </div>

  {#if data?.data?.length === 0}
    <div
      class="flex justify-center items-center min-h-[300px] py-4 px-3 text-lg text-gray-400"
    >
      {$t("Empty")}
    </div>
  {:else}
    <div class="rounded-[10px] overflow-hidden border border_0000000d">
      {#each data?.data as item}
        {#if item?.data?.length !== 0}
          {#if item.type === "Lending"}
            <div class="flex flex-col">
              <div
                class={`text-base font-medium px-3 pt-2 xl:pb-0 pb-2 bg_f4f5f8 ${
                  $isDarkMode ? "" : ""
                }`}
              >
                {$t(item.type)}
              </div>
              <LendingPosition
                data={item.data}
                protocolInfo={{
                  logo: data?.meta?.logo || defaultToken,
                  protocol: data?.protocol || "",
                  url: data?.meta?.url || "",
                }}
              />
            </div>
          {:else if item.type === "Staking"}
            <div class="flex flex-col">
              <div
                class={`text-base font-medium px-3 pt-2 xl:pb-0 pb-2 bg_f4f5f8 ${
                  $isDarkMode ? "" : ""
                }`}
              >
                {$t(item.type)}
              </div>
              <StakePosition
                data={item.data}
                protocolInfo={{
                  total: data?.sum,
                  logo: data?.meta?.logo || defaultToken,
                  protocol: data?.protocol || "",
                  url: data?.meta?.url || "",
                }}
              />
            </div>
          {:else if item.type === "Borrow"}
            <div class="flex flex-col">
              <div
                class={`text-base font-medium px-3 pt-2 xl:pb-0 pb-2 bg_f4f5f8 ${
                  $isDarkMode ? "" : ""
                }`}
              >
                {$t(item.type)}
              </div>
              <BorrowPosition
                data={item.data}
                protocolInfo={{
                  total: data?.sum,
                  logo: data?.meta?.logo || defaultToken,
                  protocol: data?.protocol || "",
                  url: data?.meta?.url || "",
                }}
              />
            </div>
          {:else if item.type === "Vest"}
            <div class="flex flex-col">
              <div
                class={`text-base font-medium px-3 pt-2 xl:pb-0 pb-2 bg_f4f5f8 ${
                  $isDarkMode ? "" : ""
                }`}
              >
                {$t(item.type)}
              </div>
              <VestPosition
                data={item.data}
                protocolInfo={{
                  total: data?.sum,
                  logo: data?.meta?.logo || defaultToken,
                  protocol: data?.protocol || "",
                  url: data?.meta?.url || "",
                }}
              />
            </div>
          {:else if item.type === "AMM"}
            <div class="flex flex-col">
              <div
                class={`text-base font-medium px-3 pt-2 xl:pb-0 pb-2 bg_f4f5f8 ${
                  $isDarkMode ? "" : ""
                }`}
              >
                {$t("Pool")}
              </div>
              <AmmPosition
                data={item.data}
                protocolInfo={{
                  total: data?.sum,
                  logo: data?.meta?.logo || defaultToken,
                  protocol: data?.protocol || "",
                  url: data?.meta?.url || "",
                }}
              />
            </div>
          {:else if item.type === "CFMM"}
            <div class="flex flex-col">
              <div
                class={`text-base font-medium px-3 pt-2 xl:pb-0 pb-2 bg_f4f5f8 ${
                  $isDarkMode ? "" : ""
                }`}
              >
                {$t("Pool")}
              </div>
              <CfmmPosition
                data={item.data}
                protocolInfo={{
                  total: data?.sum,
                  logo: data?.meta?.logo || defaultToken,
                  protocol: data?.protocol || "",
                  url: data?.meta?.url || "",
                }}
              />
            </div>
          {:else if item.type === "CLMM"}
            <div class="flex flex-col">
              <div
                class={`text-base font-medium px-3 pt-2 xl:pb-0 pb-2 bg_f4f5f8 ${
                  $isDarkMode ? "" : ""
                }`}
              >
                {$t("Concentrated Pool")}
              </div>
              <ClmmPosition
                data={item.data}
                protocolInfo={{
                  total: data?.sum,
                  logo: data?.meta?.logo || defaultToken,
                  protocol: data?.protocol || "",
                  url: data?.meta?.url || "",
                }}
              />
            </div>
          {:else if item.type === "Farm"}
            <div class="flex flex-col">
              <div
                class={`text-base font-medium px-3 pt-2 xl:pb-0 pb-2 bg_f4f5f8 ${
                  $isDarkMode ? "" : ""
                }`}
              >
                {$t(item.type)}
              </div>
              <FarmPosition
                data={item.data}
                protocolInfo={{
                  total: data?.sum,
                  logo: data?.meta?.logo || defaultToken,
                  protocol: data?.protocol || "",
                  url: data?.meta?.url || "",
                }}
              />
            </div>
          {/if}
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style></style>
