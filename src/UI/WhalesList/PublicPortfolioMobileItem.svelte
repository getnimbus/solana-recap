<script lang="ts">
  import dayjs from "dayjs";
  import relativeTime from "dayjs/plugin/relativeTime";
  import utc from "dayjs/plugin/utc";
  import tooltip from "~/lib/tooltip";
  import { isDarkMode, typeWallet, chain } from "~/store";
  import { formatAHT, handleImgError } from "~/utils/index";
  dayjs.extend(relativeTime);
  dayjs.extend(utc);
  import { chainList, chainMoveList, chainSolList } from "~/lib/chains";

  export let data;
  export let whalePageChain;

  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Copy from "~/components/Copy.svelte";

  import TrendUp from "~/assets/trend-up.svg";
  import TrendDown from "~/assets/trend-down.svg";
  import defaultToken from "~/assets/defaultToken.png";

  let linkWhale = "";

  $: {
    if (
      chainMoveList
        .filter((item) => item.value !== "ALL")
        .map((item) => item.value)
        .includes(whalePageChain)
    ) {
      typeWallet.update((n) => (n = "MOVE"));
      linkWhale = `/?tab=summary&type=MOVE&chain=ALL&address=${data?.owner}`;
    }

    if (
      chainSolList
        .filter((item) => item.value !== "ALL")
        .map((item) => item.value)
        .includes(whalePageChain)
    ) {
      typeWallet.update((n) => (n = "SOL"));
      linkWhale = `/?tab=summary&type=SOL&chain=ALL&address=${data?.owner}`;
    }

    if (
      chainList
        .filter((item) => item.value !== "ALL")
        .map((item) => item.value)
        .includes(whalePageChain)
    ) {
      typeWallet.update((n) => (n = "EVM"));
      chain.update((n) => (n = whalePageChain));
      linkWhale = `/?tab=summary&type=EVM&chain=ALL&address=${data?.owner}`;
    }

    if (whalePageChain === "TON") {
      typeWallet.update((n) => (n = "TON"));
      linkWhale = `/?tab=summary&type=TON&address=${data?.owner}`;
    }
  }
</script>

<div
  class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4"
>
  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">Address</div>
    <div class="flex gap-2 items-center">
      <div class="text-sm">
        <Copy
          address={data?.owner}
          textTooltip="Copy address to clipboard"
          iconColor={$isDarkMode ? "#fff" : "#000"}
          color={$isDarkMode ? "#fff" : "#000"}
          isShorten={true}
          isLink={true}
          link={linkWhale}
        />
      </div>
    </div>
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">1D PnL</div>
    <div class="text-sm text-right font-medium flex flex-col items-end gap-1">
      {#if data?.pnl1d === null}
        <div class="text-right text_00000099">-</div>
      {:else}
        <div
          class={`flex items-center ${
            data?.pnl1d * 100 >= 0 ? "text-[#00A878]" : "text-red-500"
          }`}
        >
          <TooltipNumber
            number={Math.abs(Number(data?.pnl1d * 100))}
            type={Math.abs(Number(data?.pnl1d * 100)) > 999999
              ? "balance"
              : Math.abs(Number(data?.pnl1d * 100)) < 0.01
                ? "amount"
                : "percent"}
          />
          <span>%</span>
          <img
            src={data?.pnl1d * 100 >= 0 ? TrendUp : TrendDown}
            alt="trend"
            class="ml-1 mb-1 w-4 h-4"
          />
        </div>
      {/if}
    </div>
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">7D PnL</div>
    <div class="text-sm text-right font-medium flex flex-col items-end gap-1">
      {#if data?.pnl7d === null}
        <div class="text-right text_00000099">-</div>
      {:else}
        <div
          class={`flex items-center ${
            data?.pnl7d * 100 > 0 ? "text-[#00A878]" : "text-red-500"
          }`}
        >
          <TooltipNumber
            number={Math.abs(Number(data?.pnl7d * 100))}
            type={Math.abs(Number(data?.pnl7d * 100)) > 999999
              ? "balance"
              : Math.abs(Number(data?.pnl7d * 100)) < 0.01
                ? "amount"
                : "percent"}
          />
          <span>%</span>
          <img
            src={data?.pnl7d * 100 > 0 ? TrendUp : TrendDown}
            alt="trend"
            class="ml-1 mb-1 w-4 h-4"
          />
        </div>
      {/if}
    </div>
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">30D PnL</div>
    <div class="text-sm text-right font-medium flex flex-col items-end gap-1">
      {#if data?.pnl30d === null}
        <div class="text-right text_00000099">-</div>
      {:else}
        <div
          class={`flex items-center ${
            data?.pnl30d * 100 >= 0 ? "text-[#00A878]" : "text-red-500"
          }`}
        >
          <TooltipNumber
            number={Math.abs(Number(data?.pnl30d * 100))}
            type={Math.abs(Number(data?.pnl30d * 100)) > 999999
              ? "balance"
              : Math.abs(Number(data?.pnl30d * 100)) < 0.01
                ? "amount"
                : "percent"}
          />
          <span>%</span>
          <img
            src={data?.pnl30d * 100 >= 0 ? TrendUp : TrendDown}
            alt="trend"
            class="ml-1 mb-1 w-4 h-4"
          />
        </div>
      {/if}
    </div>
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">Realized Profit</div>
    <div class="text-sm text-right font-medium flex flex-col items-end gap-1">
      {#if data?.profitlf === null}
        <div class="text-right text_00000099">-</div>
      {:else}
        <div
          class={`flex items-center ${
            data?.profitlf >= 0 ? "text-[#00A878]" : "text-red-500"
          }`}
        >
          $<TooltipNumber
            number={Math.abs(Number(data?.profitlf))}
            type={Math.abs(Number(data?.profitlf)) > 999999
              ? "balance"
              : Math.abs(Number(data?.profitlf * 100)) < 0.01
                ? "amount"
                : "percent"}
          />
          <img
            src={data?.profitlf >= 0 ? TrendUp : TrendDown}
            alt="trend"
            class="ml-1 mb-1 w-4 h-4"
          />
        </div>
      {/if}
    </div>
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">30D Txs</div>
    {#if data?.total_trades30d === null}
      <div class="text-right text_00000099">-</div>
    {:else}
      <div
        class="text-sm text-right text_00000099 font-medium flex justify-end items-center"
      >
        {Number(data?.total_trades30d)}
      </div>
    {/if}
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">AHT</div>
    {#if data?.avg_holding_time === null}
      <div class="text-right text_00000099">-</div>
    {:else}
      <div
        class="text-sm text-right text_00000099 font-medium flex justify-end items-center"
      >
        {formatAHT(Number(data?.avg_holding_time || 0))}
      </div>
    {/if}
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">ATV</div>
    {#if data?.avg_total_vol === null}
      <div class="text-right text_00000099">-</div>
    {:else}
      <div
        class="text-sm text-right text_00000099 font-medium flex justify-end items-center"
      >
        <TooltipNumber number={Number(data?.avg_total_vol)} />
      </div>
    {/if}
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">Last Action</div>
    {#if data?.last_trade === null}
      <div class="text-right text_00000099">-</div>
    {:else}
      <div
        class="text-sm text-right text_00000099 font-medium flex justify-end items-center"
      >
        {dayjs.utc(data?.last_trade).fromNow()}
      </div>
    {/if}
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">RPT</div>
    <div class="flex justify-end items-center -space-x-2">
      {#if data?.tokens7d?.length === 0}
        <div class="text-right text_00000099">-</div>
      {:else}
        {#each data?.tokens7d?.slice(0, 3) || [] as token, index}
          <div
            class={`${index > 0 && "-ml-2"}`}
            use:tooltip={token.symbol
              ? {
                  content: `<tooltip-detail text=${token.symbol} />`,
                  allowHTML: true,
                  placement: "top",
                }
              : false}
          >
            <img
              src={token.image_url || defaultToken}
              alt=""
              class="w-7 h-7 object-contain rounded-full bg-white"
              on:error={(e) => handleImgError(e, defaultToken)}
            />
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
</style>
