<script lang="ts">
  import dayjs from "dayjs";
  import "dayjs/locale/en";
  import "dayjs/locale/vi";
  import relativeTime from "dayjs/plugin/relativeTime";
  dayjs.extend(relativeTime);
  import { typeWallet, isDarkMode } from "~/store";
  import { chainList, detectedGeneration, linkExplorer } from "~/lib/chains";
  import { t } from "~/lib/i18n";

  import Copy from "~/components/Copy.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Loading from "~/components/Loading.svelte";
  import Table from "~/components/Table.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let data: any = [];
  export let isLoading;

  const formatTransactionTime = (date: Date) => {
    if (dayjs().diff(date, "days") >= 1) {
      return dayjs(date).format("YYYY-MM-DD, hh:mm A");
    }
    return dayjs(date).fromNow();
  };
</script>

<Table>
  <span slot="desktop">
    <table class="table-auto w-full h-full">
      <thead>
        <tr class="bg_f4f5f8">
          <th class="pl-3 py-3 rounded-tl-[10px]">
            <div class="font-medium text-left text-xs uppercase">
              {$t("Transaction")}
            </div>
          </th>
          <th class="py-3">
            <div class="font-medium text-left text-xs uppercase">
              {$t("Action")}
            </div>
          </th>
          <th class="py-3">
            <div class="font-medium text-left text-xs uppercase">
              {$t("Fee")}
            </div>
          </th>
          <th class="pr-3 py-3 rounded-tr-[10px]">
            <div class="font-medium text-left text-xs uppercase">
              {$t("Token Change")}
            </div>
          </th>
        </tr>
      </thead>
      <tbody class="h-full">
        {#if data && data?.length === 0 && !isLoading}
          <tr>
            <td colspan={5}>
              <div
                class="flex items-center justify-center h-full px-3 py-4 text-base text-gray-400"
              >
                {$t("Empty")}
              </div>
            </td>
          </tr>
        {:else}
          {#each data || [] as item}
            <tr
              class="group transition-all border-b-[0.5px] border_0000000d last:border-none"
            >
              <td
                class={`pl-3 py-3 ${
                  $isDarkMode
                    ? "bg-[#131313] group-hover:bg-[#000]"
                    : "bg-white group-hover:bg-gray-100"
                }`}
              >
                <div class="flex items-start gap-2 text-left w-max">
                  <div class="flex flex-col space-y-2">
                    <div class="text-sm flex gap-2">
                      {#if $typeWallet === "EVM"}
                        <img
                          src={chainList.find(
                            (chain) => chain.value === item?.chain,
                          )?.logo || defaultToken}
                          alt=""
                          class="object-contain w-5 h-5 rounded-full block"
                        />
                      {:else}
                        <img
                          src={detectedGeneration(
                            item?.chain === "SUI" ? "MOVE" : item?.chain,
                          ) || defaultToken}
                          alt=""
                          class="object-contain w-5 h-5 rounded-full block"
                        />
                      {/if}
                      <Copy
                        address={item?.tx_hash}
                        textTooltip="Copy transaction to clipboard"
                        iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                        color={`${$isDarkMode ? "#fff" : "#000"}`}
                        isShorten={true}
                        isLink={true}
                        link={`${linkExplorer(item?.chain, item?.tx_hash).trx}`}
                      />
                    </div>
                    <div class="text-gray-400 text-xs">
                      {formatTransactionTime(new Date(item?.timestamp * 1000))}
                    </div>
                  </div>
                </div>
              </td>

              <td
                class={`py-3 ${
                  $isDarkMode
                    ? "bg-[#131313] group-hover:bg-[#000]"
                    : "bg-white group-hover:bg-gray-100"
                }`}
              >
                <div
                  class="flex justify-start font-medium text-sm text_00000099"
                >
                  {#if item?.action}
                    <div
                      class="w-max px-2 py-1 text_27326F font-normal bg-[#6AC7F533] rounded-[5px] capitalize"
                    >
                      {item?.action}
                    </div>
                  {/if}
                </div>
              </td>

              <td
                class={`py-3 ${
                  $isDarkMode
                    ? "bg-[#131313] group-hover:bg-[#000]"
                    : "bg-white group-hover:bg-gray-100"
                }`}
              >
                <div class="w-max font-medium flex flex-col gap-1">
                  <div class="text-sm text_00000099 flex items-center gap-1">
                    <TooltipNumber number={Number(item?.fee)} type="amount" />
                    {item?.native_token_symbol || "-"}
                  </div>
                  <div class="text-gray-400 text-xs">
                    <TooltipNumber
                      number={Number(item?.fee) * Number(item?.native_price)}
                      type="value"
                    />
                  </div>
                </div>
              </td>

              <td
                class={`py-3 pr-3 ${
                  $isDarkMode
                    ? "bg-[#131313] group-hover:bg-[#000]"
                    : "bg-white group-hover:bg-gray-100"
                }`}
              >
                <div
                  class="flex flex-col items-start gap-2 font-medium text-sm"
                >
                  {#if item?.action === "Add"}
                    <div class="flex items-center gap-2">
                      <img
                        src={item?.token_input_logo || defaultToken}
                        alt=""
                        class="object-contain overflow-hidden rounded-full w-7 h-7 block"
                      />

                      <div class="flex flex-col text-red-500">
                        <div class="flex gap-1">
                          <div class="flex">
                            -<TooltipNumber
                              number={Math.abs(item?.token_input_quality)}
                              type="balance"
                            />
                          </div>
                          <div>
                            {item?.token_input_symbol || "⎯"}
                          </div>
                        </div>
                        <div class="flex w-max text-xs">
                          -<TooltipNumber
                            number={Math.abs(
                              item?.token_input_quality *
                                item?.token_input_price,
                            )}
                            type="value"
                          />
                        </div>
                      </div>
                    </div>
                  {/if}

                  {#if item?.action === "Remove"}
                    <div class="flex items-center gap-2">
                      <img
                        src={item?.token_output_logo || defaultToken}
                        alt=""
                        class="object-contain overflow-hidden rounded-full w-7 h-7 block"
                      />

                      <div class="flex flex-col text-green-500">
                        <div class="flex gap-1">
                          <div class="flex">
                            +<TooltipNumber
                              number={Math.abs(item?.token_output_quality)}
                              type="balance"
                            />
                          </div>
                          <div>
                            {item?.token_output_symbol || "⎯"}
                          </div>
                        </div>
                        <div class="flex w-max text-xs">
                          +<TooltipNumber
                            number={Math.abs(
                              item?.token_output_quality *
                                item?.token_output_price,
                            )}
                            type="value"
                          />
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>

      {#if isLoading && data && data?.length === 0}
        <tbody>
          <tr>
            <td colspan="5">
              <div class="flex justify-center items-center h-full py-3 px-3">
                <Loading />
              </div>
            </td>
          </tr>
        </tbody>
      {/if}
    </table>
  </span>

  <span slot="mobile">
    {#if data && data.length === 0 && !isLoading}
      <div
        class="flex justify-center items-center h-full py-3 px-3 text-base text-gray-400"
      >
        {$t("Empty")}
      </div>
    {:else}
      {#each data || [] as item}
        <div
          class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4"
        >
          <div class="flex justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Transaction")}
            </div>
            <div class="flex items-start gap-2 text-left w-max">
              <div class="flex flex-col space-y-2">
                <div class="text-sm flex gap-2">
                  {#if $typeWallet === "EVM"}
                    <img
                      src={chainList.find(
                        (chain) => chain.value === item?.chain,
                      )?.logo || defaultToken}
                      alt=""
                      class="object-contain w-5 h-5 rounded-full block"
                    />
                  {:else}
                    <img
                      src={detectedGeneration(
                        item?.chain === "SUI" ? "MOVE" : item?.chain,
                      ) || defaultToken}
                      alt=""
                      class="object-contain w-5 h-5 rounded-full block"
                    />
                  {/if}
                  <Copy
                    address={item?.tx_hash}
                    textTooltip="Copy transaction to clipboard"
                    iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                    color={`${$isDarkMode ? "#fff" : "#000"}`}
                    isShorten={true}
                    isLink={true}
                    link={`${linkExplorer(item?.chain, item?.tx_hash).trx}`}
                  />
                </div>
                <div class="text-gray-400 text-xs">
                  {formatTransactionTime(new Date(item?.timestamp * 1000))}
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Action")}
            </div>
            <div class="flex justify-start font-medium text-sm text_00000099">
              <div
                class="w-max px-2 py-1 text_27326F font-normal bg-[#6AC7F533] rounded-[5px] capitalize"
              >
                {item?.action}
              </div>
            </div>
          </div>

          <div class="flex justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Fee")}
            </div>
            <div class="flex justify-start font-medium text-sm text_00000099">
              <div class="w-max font-medium flex flex-col gap-1">
                <div class="text-sm text_00000099 flex items-center gap-1">
                  <TooltipNumber number={Number(item?.fee)} type="amount" />
                  {item?.native_token_symbol || "-"}
                </div>
                <div class="text-gray-400 text-xs">
                  <TooltipNumber
                    number={Number(item?.fee) * Number(item?.native_price)}
                    type="value"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Token Change")}
            </div>
            <div class="flex flex-col items-start gap-2 font-medium text-sm">
              {#if item?.action}
                {#if item?.action === "Add"}
                  <div class="flex items-center gap-2">
                    <img
                      src={item?.token_input_logo || defaultToken}
                      alt=""
                      class="object-contain overflow-hidden rounded-full w-7 h-7 block"
                    />

                    <div class="flex flex-col text-red-500">
                      <div class="flex gap-1">
                        <div class="flex">
                          -<TooltipNumber
                            number={Math.abs(item?.token_input_quality)}
                            type="balance"
                          />
                        </div>
                        <div>
                          {item?.token_input_symbol || "⎯"}
                        </div>
                      </div>
                      <div class="flex w-max text-xs">
                        -<TooltipNumber
                          number={Math.abs(
                            item?.token_input_quality * item?.token_input_price,
                          )}
                          type="value"
                        />
                      </div>
                    </div>
                  </div>
                {/if}

                {#if item?.action === "Remove"}
                  <div class="flex items-center gap-2">
                    <img
                      src={item?.token_output_logo || defaultToken}
                      alt=""
                      class="object-contain overflow-hidden rounded-full w-7 h-7 block"
                    />

                    <div class="flex flex-col text-green-500">
                      <div class="flex gap-1">
                        <div class="flex">
                          +<TooltipNumber
                            number={Math.abs(item?.token_output_quality)}
                            type="balance"
                          />
                        </div>
                        <div>
                          {item?.token_output_symbol || "⎯"}
                        </div>
                      </div>
                      <div class="flex w-max text-xs">
                        +<TooltipNumber
                          number={Math.abs(
                            item?.token_output_quality *
                              item?.token_output_price,
                          )}
                          type="value"
                        />
                      </div>
                    </div>
                  </div>
                {/if}
              {:else}
                <div>-</div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}

    {#if isLoading && data && data?.length === 0}
      <div
        class="flex justify-center items-center h-full py-3 px-3 text-base text-gray-400"
      >
        <Loading />
      </div>
    {/if}
  </span>
</Table>

<style>
</style>
