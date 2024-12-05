<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import { createQuery } from "@tanstack/svelte-query";
  import { nimbus } from "~/lib/network";
  import { isDarkMode, wallet } from "~/store";
  import { t } from "~/lib/i18n";

  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";
  import NFTHistoryItem from "./NFTHistoryItem.svelte";

  export let selectedNftCollectionChain;
  export let selectedNftCollectionId;

  const handleGetTradeHistory = async (id: any, address: any, chain: any) => {
    const response: any = await nimbus.get(
      `/v2/address/${address}/nft/${id}/trade-history?chain=${chain}`,
    );
    return response?.data;
  };

  let dataHistoryNftDetail: any = [];

  $: queryHistoryNftDetail = createQuery({
    queryKey: [
      "nft-trade-history",
      selectedNftCollectionId,
      $wallet,
      selectedNftCollectionChain,
    ],
    queryFn: () =>
      handleGetTradeHistory(
        selectedNftCollectionId,
        $wallet,
        selectedNftCollectionChain,
      ),
    retry: false,
    enabled: Boolean(
      selectedNftCollectionChain !== undefined &&
        selectedNftCollectionId !== undefined &&
        $wallet &&
        $wallet?.length !== 0,
    ),
  });

  $: {
    if (
      !$queryHistoryNftDetail.isError &&
      $queryHistoryNftDetail.data !== undefined &&
      $queryHistoryNftDetail.data.length !== 0
    ) {
      dataHistoryNftDetail = $queryHistoryNftDetail.data;
    } else {
      dataHistoryNftDetail = [];
    }
  }
</script>

<div
  class={`rounded-[20px] flex flex-col gap-4 py-4 lg:px-3 xl:border border_0000001a ${
    $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
  }`}
>
  <div class="text-2xl font-medium">{$t("History")}</div>
  <div
    class={`rounded-[10px] overflow-x-auto overflow-y-auto h-[563px] relative ${
      $isDarkMode ? "bg-[#131313]" : "bg-[#fff] border border_0000000d"
    }`}
  >
    <table
      class={`table-auto xl:w-full w-[1000px] ${
        (dataHistoryNftDetail && dataHistoryNftDetail?.length === 0) ||
        $queryHistoryNftDetail.isFetching
          ? "h-full"
          : ""
      }`}
    >
      <thead>
        <tr class="bg_f4f5f8 sticky left-0 top-0">
          <th
            class="pl-3 py-3 rounded-tl-[10px] xl:static xl:bg-transparent sticky left-0 z-10 bg_f4f5f8 w-[100px]"
          >
            <div class="text-left text-sm uppercase font-medium">
              {$t("Token ID")}
            </div>
          </th>

          <th class="py-3">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Cost")}
            </div>
          </th>

          <th class="py-3">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Type")}
            </div>
          </th>

          <th class="py-3">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Time")}
            </div>
          </th>

          <th class="py-3 w-10" />
        </tr>
      </thead>
      {#if $queryHistoryNftDetail.isFetching}
        <tbody>
          <tr>
            <td colspan="7">
              <div class="flex justify-center items-center h-full py-3 px-3">
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
          {#if dataHistoryNftDetail && dataHistoryNftDetail?.length === 0}
            <tr>
              <td colspan="7">
                <div
                  class="flex justify-center items-center h-full py-3 px-3 text-base text-gray-400"
                >
                  {$t("Empty")}
                </div>
              </td>
            </tr>
          {:else}
            {#each dataHistoryNftDetail as item}
              <NFTHistoryItem data={item} />
            {/each}
          {/if}
        </tbody>
      {/if}
    </table>
  </div>
</div>

<style></style>
