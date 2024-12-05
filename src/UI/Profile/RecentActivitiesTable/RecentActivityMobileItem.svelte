<script lang="ts">
  import { typeWallet, isDarkMode } from "~/store";
  import dayjs from "dayjs";
  import "dayjs/locale/en";
  import "dayjs/locale/vi";
  import relativeTime from "dayjs/plugin/relativeTime";
  dayjs.extend(relativeTime);
  import {
    chainList,
    chainMoveList,
    chainSolList,
    linkExplorer,
    detectedGeneration,
    bigGeneration,
  } from "~/lib/chains";
  import { shorterName } from "~/utils/index";
  import { t } from "~/lib/i18n";

  import Copy from "~/components/Copy.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Image from "~/components/Image.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let item;

  const formatTransactionTime = (date: Date) => {
    if (dayjs().diff(date, "days") >= 1) {
      return dayjs(date).format("YYYY-MM-DD, hh:mm A");
    }
    return dayjs(date).fromNow();
  };

  $: formatChainList =
    $typeWallet === "EVM"
      ? chainList
      : ["MOVE", "SUI"].includes($typeWallet)
        ? chainMoveList
        : ["ECLIPSE", "SOL"].includes($typeWallet)
          ? chainSolList
          : chainList;
</script>

<div
  class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4"
>
  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">
      {$t("From")}
    </div>
    <div
      class="flex justify-start items-center gap-3 font-medium text-sm text_00000099"
    >
      <div class="rounded-full w-[30px] h-[30px] overflow-hidden">
        <Image logo={item.from_token_logo} defaultLogo={defaultToken} />
      </div>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <TooltipNumber number={item?.quantity_in} type="amount" />
          <div class="relative font-medium text_00000080">
            {#if item?.from_token_symbol === undefined}
              N/A
            {:else}
              {shorterName(item?.from_token_symbol, 20).toUpperCase()}
            {/if}
          </div>
        </div>
        <div class="flex items-center">
          $<TooltipNumber
            number={Number(item?.amount_usd) / Number(item?.quantity_in)}
            type="balance"
          />
        </div>
      </div>
    </div>
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">
      {$t("To")}
    </div>
    <div
      class="flex justify-start items-center gap-3 font-medium text-sm text_00000099"
    >
      <div class="rounded-full w-[30px] h-[30px] overflow-hidden">
        <Image logo={item.to_token_logo} defaultLogo={defaultToken} />
      </div>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <TooltipNumber number={item?.quantity_out} type="amount" />
          <div class="relative font-medium text_00000080">
            {#if item?.to_token_symbol === undefined}
              N/A
            {:else}
              {shorterName(item?.to_token_symbol, 20).toUpperCase()}
            {/if}
          </div>
        </div>
        <div class="flex items-center">
          $<TooltipNumber
            number={Number(item?.amount_usd) / Number(item?.quantity_out)}
            type="balance"
          />
        </div>
      </div>
    </div>
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">
      {$t("Trade Size")}
    </div>
    <div class="flex justify-end font-medium text-sm text_00000099">
      $<TooltipNumber number={item?.amount_usd} type="balance" />
    </div>
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">
      {$t("Fee")}
    </div>
    <div class="flex justify-end font-medium text-sm text_00000099">
      $<TooltipNumber number={item?.fee} type="balance" />
    </div>
  </div>

  <div class="flex justify-between items-start">
    <div class="text-right text-sm uppercase font-medium">
      {$t("Transaction")}
    </div>
    <div class="flex justify-end">
      <div class="flex flex-col items-end space-y-2">
        <div class="text-sm font-medium text_00000099 flex gap-2">
          {#if bigGeneration.includes($typeWallet)}
            <img
              src={formatChainList.find((chain) => chain.value === item?.chain)
                ?.logo || defaultToken}
              alt=""
              class="object-contain w-5 h-5 rounded-full block"
            />
          {:else}
            <img
              src={detectedGeneration(item?.chain) || defaultToken}
              alt=""
              class="object-contain w-5 h-5 rounded-full block"
            />
          {/if}

          {#if bigGeneration.includes($typeWallet)}
            <Copy
              address={item?.transaction_hash}
              textTooltip="Copy transaction to clipboard"
              iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
              color={`${$isDarkMode ? "#fff" : "#000"}`}
              isShorten={true}
              isLink={true}
              link={`${linkExplorer(item?.chain, item?.transaction_hash).trx}`}
            />
          {:else}
            <Copy
              address={item?.transaction_hash}
              textTooltip="Copy transaction to clipboard"
              iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
              color={`${$isDarkMode ? "#fff" : "#000"}`}
              isShorten={true}
            />
          {/if}
        </div>
        <div class="text-gray-400 text-xs">
          {formatTransactionTime(new Date(item?.created_at * 1000))}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
</style>
