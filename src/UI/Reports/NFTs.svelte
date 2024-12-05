<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import { onMount } from "svelte";
  import { isDarkMode, user } from "~/store";
  import { nimbus } from "~/lib/network";
  import { triggerToast } from "~/utils/functions";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import CopyToClipboard from "svelte-copy-to-clipboard";
  import { detectedChain } from "~/lib/chains";
  import { t } from "~/lib/i18n";
  import { shorterAddress, wait } from "~/utils";

  import Button from "~/components/Button.svelte";
  import AppOverlay from "~/components/Overlay.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Copy from "~/components/Copy.svelte";
  import Loading from "~/components/Loading.svelte";

  let selectedItemDelete: any;
  let isOpenConfirmDelete = false;
  let isLoadingDelete = false;

  const queryClient = useQueryClient();

  let isCopied = false;
  let listTrashNFT: any = [];

  onMount(() => {
    const listTrashNFTStorage = localStorage.getItem("listTrashNFT");
    if (listTrashNFTStorage) {
      listTrashNFT = JSON.parse(listTrashNFTStorage);
    }
  });

  const handleDataReportNft = async () => {
    const response: any = await nimbus.get("/holding-nft/trash?type=nft");
    return response.data;
  };

  $: query = createQuery({
    queryKey: ["nft-report"],
    queryFn: () => handleDataReportNft(),
    retry: false,
    enabled: Boolean($user && Object.keys($user)?.length !== 0),
  });

  const handleDeleteReportNft = async () => {
    isLoadingDelete = true;
    try {
      await nimbus.delete("/holding-nft/trash/revert", selectedItemDelete);
      listTrashNFT = listTrashNFT?.filter(
        (item: any) =>
          item?.ca?.toLowerCase() !==
          selectedItemDelete.contractAddress.toLowerCase(),
      );
      localStorage.setItem("listTrashNFT", JSON.stringify(listTrashNFT));
      queryClient.refetchQueries(["nft-report"]);
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
            {$t("Collection")}
          </div>
        </th>

        <th class="py-3">
          <div class="font-medium uppercase text-xs text-left">
            {$t("Collection")} ID
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
                {$t("No report nft collection")}
              </div>
            </td>
          </tr>
        {:else}
          {#each $query.data as item}
            <tr class="group transition-all">
              <td
                class={`pl-3 py-3 ${
                  $isDarkMode
                    ? "group-hover:bg-[#000]"
                    : "group-hover:bg-gray-100"
                }`}
              >
                <div class="text-base">
                  {item.contractName}
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
                    text={item.contractAddress}
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
                        type: "nft",
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
    <div class="flex items-center justify-center h-full px-3 py-4">
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
          {$t("No report nft collection")}
        </div>
      {:else}
        {#each $query.data as item}
          <div
            class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-2"
          >
            <div class="flex justify-between items-start">
              <div class="text-sm font-medium flex justify-end gap-1">
                <div class="text-sm">
                  {item.contractName}
                </div>
              </div>
              <div
                class="text-sm font-semibold text-red-600 transition-all cursor-pointer hover:underline dark:text-red-500 text-right"
                on:click={() => {
                  selectedItemDelete = {
                    chain: item.chain,
                    contractAddress: item.contractAddress,
                    type: "nft",
                  };
                  isOpenConfirmDelete = true;
                }}
              >
                {$t("Delete")}
              </div>
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">
                {$t("Collection")} ID
              </div>
              <div class="text-sm text-left">
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
              <div class="text-right text-sm uppercase font-medium">
                {$t("Chain")}
              </div>
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
        <!-- Do you really want to delete this NFT report? -->
        {$t("Do you really want", { name: "NFT report" })}
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
          on:click={handleDeleteReportNft}
        >
          {$t("Delete")}
        </Button>
      </div>
    </div>
  </div>
</AppOverlay>

<style></style>
