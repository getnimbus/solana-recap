<script lang="ts">
  import { isDarkMode, typeWallet } from "~/store";
  import { linkExplorer, listSupported } from "~/lib/chains";
  import dayjs from "dayjs";
  import "dayjs/locale/en";
  import "dayjs/locale/vi";
  import relativeTime from "dayjs/plugin/relativeTime";
  dayjs.extend(relativeTime);
  import { LinkOutlined } from "@ant-design/icons";
  import { getOverview, handleValidateAddress } from "~/lib/queryAPI";
  import { createQuery } from "@tanstack/svelte-query";

  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import ReactAdapter from "~/components/ReactAdapter.svelte";

  export let data;
  export let contractAddress;
  export let owner;
  export let chain;

  $: costBuy = Number(data?.quantity_in) * Number(data?.from_price);
  $: costSell = Number(data?.quantity_out) * Number(data?.to_price);

  $: queryValidate = createQuery({
    queryKey: ["validate", owner],
    queryFn: () => handleValidateAddress(owner),
    retry: false,
    enabled: Boolean(owner && owner?.length !== 0),
  });

  $: queryOverview = createQuery({
    queryKey: ["overview", owner, chain],
    queryFn: () => getOverview(owner, chain, $queryValidate.data),
    enabled: Boolean(owner && owner?.length !== 0),
  });

  $: costGainInNativeToken =
    (data?.to_token_address?.toLowerCase() === contractAddress?.toLowerCase()
      ? costBuy
      : costSell) / Number(data.native_price);

  $: isBuy =
    data?.to_token_address?.toLowerCase() === contractAddress?.toLowerCase();

  $: amount = isBuy ? Number(data?.quantity_out) : Number(data?.quantity_in);

  $: withinLast24Hours = dayjs().diff(dayjs(data?.created_at * 1000), "hour");
</script>

<tr class="group transition-all">
  <td
    class={`pl-3 py-3 xl:static xl:bg-transparent sticky left-0 z-10 w-[100px] ${
      $isDarkMode
        ? "bg-[#131313] group-hover:bg-[#000]"
        : "bg-white group-hover:bg-gray-100"
    }`}
  >
    <div class="text-sm font-medium flex justify-start">
      {#if data?.to_token_address?.toLowerCase() === contractAddress?.toLowerCase()}
        <div class="flex items-center text-[#00A878]">
          <div>+</div>
          <TooltipNumber number={amount} type="balance" />
        </div>
      {:else}
        <div class="flex items-center text-red-500">
          <div>-</div>
          <TooltipNumber number={amount} type="balance" />
        </div>
      {/if}
    </div>
  </td>

  <td
    class={`py-3 ${
      $isDarkMode ? "group-hover:bg-[#000]" : "group-hover:bg-gray-100"
    }`}
  >
    <div class="text-sm font-medium flex justify-end">
      {#if data?.to_token_address?.toLowerCase() === contractAddress?.toLowerCase()}
        <div class="text_00000099 flex items-center gap-1">
          <TooltipNumber number={costBuy} type="value" />
          <div class="flex items-center">
            (<TooltipNumber number={costGainInNativeToken} type="amount" />
            <div class="ml-1">
              {$queryOverview?.data?.nativeToken?.symbol || "N/A"})
            </div>
          </div>
        </div>
      {:else}
        <div class="text-red-500 flex items-center gap-1">
          <div class="flex items-center">
            <span>-</span>
            <TooltipNumber number={costSell} type="value" />
          </div>
          <div class="flex items-center">
            (<TooltipNumber number={costGainInNativeToken} type="amount" />
            <div class="ml-1">
              {$queryOverview?.data?.nativeToken?.symbol || "N/A"})
            </div>
          </div>
        </div>
      {/if}
    </div>
  </td>

  <td
    class={`py-3 ${
      $isDarkMode ? "group-hover:bg-[#000]" : "group-hover:bg-gray-100"
    }`}
  >
    <div class="text-sm text_00000099 font-medium flex justify-end">
      {#if data?.to_token_address?.toLowerCase() === contractAddress?.toLowerCase()}
        {#if data?.to_price < 1}
          $<TooltipNumber number={data?.to_price} type="balance" />
        {:else}
          <TooltipNumber number={data?.to_price} type="value" />
        {/if}
      {/if}

      {#if data?.to_token_address?.toLowerCase() !== contractAddress?.toLowerCase()}
        {#if data?.from_price < 1}
          $<TooltipNumber number={data?.from_price} type="balance" />
        {:else}
          <TooltipNumber number={data?.from_price} type="value" />
        {/if}
      {/if}
    </div>
  </td>

  <td
    class={`py-3 ${
      $isDarkMode ? "group-hover:bg-[#000]" : "group-hover:bg-gray-100"
    }`}
  >
    <div class="text-sm text_00000099 font-medium text-right flex justify-end">
      {#if data?.fee < 1}
        $<TooltipNumber number={data?.fee} type="balance" />
      {:else}
        <TooltipNumber number={data?.fee} type="value" />
      {/if}
    </div>
  </td>

  <td
    class={`py-3 ${
      listSupported.includes($typeWallet) ? "" : "pr-3"
    } ${$isDarkMode ? "group-hover:bg-[#000]" : "group-hover:bg-gray-100"}`}
  >
    <div class="text-sm text_00000099 font-medium text-right">
      {withinLast24Hours < 24
        ? dayjs(data?.created_at * 1000).fromNow()
        : dayjs(data?.created_at * 1000).format("YYYY-MM-DD")}
    </div>
  </td>

  {#if listSupported.includes($typeWallet)}
    <td
      class={`py-3 w-10 ${
        $isDarkMode ? "group-hover:bg-[#000]" : "group-hover:bg-gray-100"
      }`}
    >
      <div class="flex items-center justify-center">
        <a
          href={data.transaction_hash
            ? linkExplorer(data.chain, data.transaction_hash).trx
            : ""}
          target="_blank"
          class="cursor-pointer"
        >
          <ReactAdapter element={LinkOutlined} />
        </a>
      </div>
    </td>
  {/if}
</tr>

<style>
</style>
