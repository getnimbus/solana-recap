<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import { isDarkMode, user } from "~/store";
  import { nimbus } from "~/lib/network";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { shorterAddress, shorterName, wait } from "~/utils/index";
  import { triggerToast } from "~/utils/functions";
  import { onMount } from "svelte";
  import CopyToClipboard from "svelte-copy-to-clipboard";
  import { detectedChain } from "~/lib/chains";
  import { t } from "~/lib/i18n";

  import Image from "~/components/Image.svelte";
  import Button from "~/components/Button.svelte";
  import AppOverlay from "~/components/Overlay.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Copy from "~/components/Copy.svelte";
  import Tooltip from "~/components/Tooltip.svelte";
  import Loading from "~/components/Loading.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  let isCopied = false;
  let selectedItemDelete: any;
  let isOpenConfirmDelete = false;
  let isLoadingDelete = false;

  let selectedItemIndex = -1;
  let isShowTooltipName = false;
  let isShowTooltipSymbol = false;

  let listTrashToken: any = [];

  onMount(() => {
    const listTrashTokenStorage = localStorage.getItem("listTrashToken");
    if (listTrashTokenStorage) {
      listTrashToken = JSON.parse(listTrashTokenStorage);
    }
  });

  const queryClient = useQueryClient();

  const handleDataReportToken = async () => {
    const response: any = await nimbus.get("/holding/trash?type=token");
    return response.data;
  };

  $: query = createQuery({
    queryKey: ["token-report"],
    queryFn: () => handleDataReportToken(),
    retry: false,
    enabled: Boolean($user && Object.keys($user)?.length !== 0),
  });

  const handleDeleteReportToken = async () => {
    isLoadingDelete = true;
    try {
      await nimbus.delete("/holding/trash/revert", selectedItemDelete);
      listTrashToken = listTrashToken?.filter(
        (item: any) =>
          item?.ca?.toLowerCase() !==
          selectedItemDelete.contractAddress.toLowerCase(),
      );
      localStorage.setItem("listTrashToken", JSON.stringify(listTrashToken));
      queryClient.refetchQueries(["token-report"]);
      isLoadingDelete = false;
      isOpenConfirmDelete = false;
      triggerToast("Successfully delete your token report!", "success");
    } catch (e) {
      console.error("e: ", e);
      isLoadingDelete = false;
      isOpenConfirmDelete = false;
      triggerToast(
        "Something wrong when delete your token. Please try again!",
        "fail",
      );
    }
  };
</script>

<!-- Desktop View -->
<div
  class={`xl:block hidden border border_0000000d rounded-[10px] overflow-x-auto h-full ${
    $isDarkMode ? "bg-[#131313]" : "bg-[#fff]"
  }`}
>
  <table class="table-auto xl:w-full w-[1800px] h-full">
    <thead>
      <tr class="bg_f4f5f8">
        <th class="py-3 pl-3">
          <div class="font-medium uppercase text-xs text-left">
            {$t("Assets")}
          </div>
        </th>

        <th class="py-3">
          <div class="font-medium uppercase text-xs text-left">
            {$t("Contract Address")}
          </div>
        </th>

        <th class="py-3">
          <div class="font-medium text-left uppercase text-xs">
            {$t("Chain")}
          </div>
        </th>

        <th class="py-3 pr-3">
          <div class="font-medium text-right uppercase text-xs">
            {$t("Action")}
          </div>
        </th>
      </tr>
    </thead>

    {#if $query.isError}
      <tbody>
        <tr>
          <td colspan="4">
            <div class="flex items-center justify-center h-full px-3 py-4">
              {$t("Please connect wallet")}
            </div>
          </td>
        </tr>
      </tbody>
    {:else if $query.isLoading}
      <tbody>
        <tr>
          <td colspan="4">
            <div class="flex items-center justify-center h-full px-3 py-4">
              {#if isNimbusVersion}
                <LoadingPremium />
              {:else}
                <Loading />
              {/if}
            </div>
          </td>
        </tr>
      </tbody>
    {:else}
      <tbody>
        {#if ($query.data && $query.data?.length === 0) || $query.isError}
          <tr>
            <td colspan="4">
              <div
                class="flex items-center justify-center h-full px-3 py-4 text-base"
              >
                {$t("No report tokens")}
              </div>
            </td>
          </tr>
        {:else}
          {#each $query.data as item, index}
            <tr class="group transition-all">
              <td
                class={`pl-3 py-3 ${
                  $isDarkMode
                    ? "group-hover:bg-[#000]"
                    : "group-hover:bg-gray-100"
                }`}
              >
                <div class="flex items-center justify-start gap-2">
                  <div class="w-6 h-6 rounded-full overflow-hidden">
                    <Image logo={item?.logoUrl} defaultLogo={defaultToken} />
                  </div>
                  <div class="flex flex-col">
                    <div
                      class="relative font-medium text-base"
                      on:mouseover={() => {
                        selectedItemIndex = index;
                        isShowTooltipName = true;
                      }}
                      on:mouseleave={() => {
                        selectedItemIndex = -1;
                        isShowTooltipName = false;
                      }}
                    >
                      {#if item.contractName === undefined}
                        N/A
                      {:else}
                        {item.contractName?.length > 20
                          ? shorterName(item.contractName, 20)
                          : item.contractName}
                      {/if}
                      {#if isShowTooltipName && selectedItemIndex === index && item.contractName?.length > 20}
                        <div
                          class="absolute left-0 -top-8"
                          style="z-index: 2147483648;"
                        >
                          <Tooltip text={item.contractName} />
                        </div>
                      {/if}
                    </div>
                    <div
                      class="relative font-medium text_00000080 text-xs"
                      on:mouseover={() => {
                        selectedItemIndex = index;
                        isShowTooltipSymbol = true;
                      }}
                      on:mouseleave={() => {
                        selectedItemIndex = -1;
                        isShowTooltipSymbol = false;
                      }}
                    >
                      {#if item.contractTickerSymbol === undefined}
                        N/A
                      {:else}
                        {shorterName(item.contractTickerSymbol, 20)}
                      {/if}
                      {#if isShowTooltipSymbol && selectedItemIndex === index && item.contractTickerSymbol?.length > 20}
                        <div
                          class="absolute left-0 -top-8"
                          style="z-index: 2147483648;"
                        >
                          <Tooltip text={item.contractTickerSymbol} />
                        </div>
                      {/if}
                    </div>
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
                <div class="text-base text-left w-max">
                  <CopyToClipboard
                    text={item.contractAddress === "TONCOIN"
                      ? "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
                      : item.contractAddress}
                    let:copy
                    on:copy={async () => {
                      isCopied = true;
                      await wait(1000);
                      isCopied = false;
                    }}
                  >
                    <div
                      class="cursor-pointer flex items-center gap-2"
                      on:click={copy}
                    >
                      {shorterAddress(item.contractAddress)}
                      {#if isCopied}
                        <svg
                          width={20}
                          height={20}
                          id="Layer_1"
                          data-name="Layer 1"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 122.88 74.46"
                          fill={$isDarkMode ? "#d1d5db" : "#00000080"}
                          ><path
                            fill-rule="evenodd"
                            d="M1.87,47.2a6.33,6.33,0,1,1,8.92-9c8.88,8.85,17.53,17.66,26.53,26.45l-3.76,4.45-.35.37a6.33,6.33,0,0,1-8.95,0L1.87,47.2ZM30,43.55a6.33,6.33,0,1,1,8.82-9.07l25,24.38L111.64,2.29c5.37-6.35,15,1.84,9.66,8.18L69.07,72.22l-.3.33a6.33,6.33,0,0,1-8.95.12L30,43.55Zm28.76-4.21-.31.33-9.07-8.85L71.67,4.42c5.37-6.35,15,1.83,9.67,8.18L58.74,39.34Z"
                          /></svg
                        >
                      {:else}
                        <svg
                          width={20}
                          height={20}
                          viewBox="0 0 12 11"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8.1875 3.3125H10.6875V10.1875H3.8125V7.6875"
                            stroke={$isDarkMode ? "#d1d5db" : "#00000080"}
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M8.1875 0.8125H1.3125V7.6875H8.1875V0.8125Z"
                            stroke={$isDarkMode ? "#d1d5db" : "#00000080"}
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      {/if}
                    </div>
                  </CopyToClipboard>
                </div>
              </td>

              <td
                class={`py-3 ${
                  $isDarkMode
                    ? "group-hover:bg-[#000]"
                    : "group-hover:bg-gray-100"
                }`}
              >
                <div class="text-base text-left">
                  <img
                    src={detectedChain(item.chain)?.logo}
                    alt=""
                    width="26"
                    height="26"
                    class="rounded-full"
                  />
                </div>
              </td>

              <td
                class={`py-3 pr-3 ${
                  $isDarkMode
                    ? "group-hover:bg-[#000]"
                    : "group-hover:bg-gray-100"
                }`}
              >
                <div class="flex justify-end">
                  <div
                    class="text-base font-semibold text-red-600 transition-all cursor-pointer hover:underline dark:text-red-500 w-max"
                    on:click={() => {
                      selectedItemDelete = {
                        chain: item.chain,
                        contractAddress: item.contractAddress,
                        type: "token",
                      };
                      isOpenConfirmDelete = true;
                    }}
                  >
                    {$t("Delete")}
                  </div>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    {/if}
  </table>
</div>

<!-- Mobile View -->
<div class="xl:hidden block border border_0000000d rounded-[10px] p-2">
  {#if $query.isError}
    <div class="flex items-center justify-center h-full px-3 py-4 text-base">
      {$t("Please connect wallet")}
    </div>
  {:else if $query.isLoading}
    <div class="flex items-center justify-center h-full px-3 py-4">
      {#if isNimbusVersion}
        <LoadingPremium />
      {:else}
        <Loading />
      {/if}
    </div>
  {:else}
    <div class="flex flex-col">
      {#if ($query.data && $query.data?.length === 0) || $query.isError}
        <div
          class="flex items-center justify-center h-full px-3 py-4 text-base"
        >
          {$t("No report tokens")}
        </div>
      {:else}
        {#each $query.data as item, index}
          <div
            class="flex flex-col gap-4 py-2 border-b-[1px] border_0000000d last:border-none"
          >
            <div class="flex justify-between items-start">
              <div class="text-sm font-medium flex justify-end gap-1">
                <div class="flex items-center justify-start gap-2">
                  <div class="w-6 h-6 rounded-full overflow-hidden">
                    <Image logo={item?.logoUrl} defaultLogo={defaultToken} />
                  </div>
                  <div class="flex flex-col">
                    <div
                      class="relative font-medium text-base"
                      on:mouseover={() => {
                        selectedItemIndex = index;
                        isShowTooltipName = true;
                      }}
                      on:mouseleave={() => {
                        selectedItemIndex = -1;
                        isShowTooltipName = false;
                      }}
                    >
                      {#if item.contractName === undefined}
                        N/A
                      {:else}
                        {item.contractName?.length > 20
                          ? shorterName(item.contractName, 20)
                          : item.contractName}
                      {/if}
                      {#if isShowTooltipName && selectedItemIndex === index && item.contractName?.length > 20}
                        <div
                          class="absolute left-0 -top-8"
                          style="z-index: 2147483648;"
                        >
                          <Tooltip text={item.contractName} />
                        </div>
                      {/if}
                    </div>
                    <div
                      class="relative font-medium text_00000080 text-xs"
                      on:mouseover={() => {
                        selectedItemIndex = index;
                        isShowTooltipSymbol = true;
                      }}
                      on:mouseleave={() => {
                        selectedItemIndex = -1;
                        isShowTooltipSymbol = false;
                      }}
                    >
                      {#if item.contractTickerSymbol === undefined}
                        N/A
                      {:else}
                        {shorterName(item.contractTickerSymbol, 20)}
                      {/if}
                      {#if isShowTooltipSymbol && selectedItemIndex === index && item.contractTickerSymbol?.length > 20}
                        <div
                          class="absolute left-0 -top-8"
                          style="z-index: 2147483648;"
                        >
                          <Tooltip text={item.contractTickerSymbol} />
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="text-sm font-semibold text-red-600 transition-all cursor-pointer hover:underline dark:text-red-500 text-right"
                on:click={() => {
                  selectedItemDelete = {
                    chain: item.chain,
                    contractAddress: item.contractAddress,
                    type: "token",
                  };
                  isOpenConfirmDelete = true;
                }}
              >
                {$t("Delete")}
              </div>
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">
                {$t("Contract Address")}
              </div>
              <div class="text-sm text_00000099">
                <Copy
                  address={item?.contractAddress}
                  textTooltip="Copy address to clipboard"
                  iconColor={$isDarkMode ? "#fff" : "#000"}
                  color={$isDarkMode ? "#ccc" : "#00000099"}
                  isShorten={true}
                  isLink={true}
                  link={`/?type=EVM&chain=ALL&address=${item?.contractAddress}`}
                />
              </div>
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">Chain</div>
              <img
                src={detectedChain(item.chain)?.logo}
                alt=""
                width="24"
                height="24"
                class="rounded-full"
              />
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<AppOverlay
  clickOutSideToClose
  isOpen={isOpenConfirmDelete}
  on:close={() => (isOpenConfirmDelete = false)}
>
  <div class="flex flex-col gap-4 xl:mt-0 mt-4">
    <div class="flex flex-col items-start gap-1">
      <div class="font-semibold title-3">{$t("Are you sure?")}</div>
      <div class="text-gray-500 text-sm">
        <!-- Do you really want to delete this token report? -->
        {$t("Do you really want", { name: "token report" })}
      </div>
    </div>
    <div class="flex justify-end gap-4">
      <div class="w-[120px]">
        <Button
          variant="secondary"
          on:click={() => {
            isOpenConfirmDelete = false;
          }}
        >
          {$t("Cancel")}
        </Button>
      </div>
      <div class="w-[120px]">
        <Button
          isLoading={isLoadingDelete}
          disabled={isLoadingDelete}
          variant="delete"
          on:click={handleDeleteReportToken}
        >
          {$t("Delete")}
        </Button>
      </div>
    </div>
  </div>
</AppOverlay>

<style></style>
