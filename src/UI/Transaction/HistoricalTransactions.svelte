<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import dayjs from "dayjs";
  import "dayjs/locale/en";
  import "dayjs/locale/vi";
  import relativeTime from "dayjs/plugin/relativeTime";
  dayjs.extend(relativeTime);
  import { typeWallet, isDarkMode } from "~/store";
  import { chainList, detectedGeneration, linkExplorer } from "~/lib/chains";
  import { flatten } from "lodash";
  import { t } from "~/lib/i18n";

  import Loading from "~/components/Loading.svelte";
  import Table from "~/components/Table.svelte";
  import Button from "~/components/Button.svelte";
  import Copy from "~/components/Copy.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";

  import mobulaLogo from "~/assets/mobula-logo.png";
  import defaultToken from "~/assets/defaultToken.png";

  export let data;
  export let isLoading;
  export let pageToken;
  export let loadMore = (page) => {};

  const formatTransactionTime = (date: Date) => {
    if (dayjs().diff(date, "days") >= 1) {
      return dayjs(date).format("YYYY-MM-DD, hh:mm A");
    }
    return dayjs(date).fromNow();
  };
</script>

{#if $typeWallet === "BTC"}
  <Table>
    <span slot="desktop">
      <table class="table-auto w-full h-full relative">
        <thead>
          <tr class="bg_f4f5f8">
            <th class="pl-3 py-3 rounded-tl-[10px]">
              <div class="font-medium text-left text-xs uppercase">
                {$t("Transaction")}
              </div>
            </th>
            <th class="py-3">
              <div class="font-medium text-left text-xs uppercase">
                {$t("From")}
              </div>
            </th>
            <th class="py-3">
              <div class="font-medium text-left text-xs uppercase">
                {$t("To")}
              </div>
            </th>
            <th class="py-3">
              <div
                class="text-left text-xs uppercase font-medium min-w-[100px]"
              >
                {$t("Type")}
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
                        <img
                          src={detectedGeneration(
                            item?.chain === "SUI" ? "MOVE" : item?.chain,
                          ) || defaultToken}
                          alt=""
                          class="object-contain w-5 h-5 rounded-full block"
                        />
                        <Copy
                          address={item?.transaction_hash}
                          textTooltip="Copy transaction to clipboard"
                          iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                          color={`${$isDarkMode ? "#fff" : "#000"}`}
                          isShorten={true}
                        />
                      </div>
                      <div class="text-gray-400 text-xs">
                        {formatTransactionTime(
                          new Date(item?.detail.timestamp),
                        )}
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
                  {#if item?.detail?.from}
                    <div class="w-max text-sm">
                      <Copy
                        address={item?.detail?.from}
                        textTooltip="Copy address"
                        iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                        color={`${$isDarkMode ? "#fff" : "#000"}`}
                        isShorten={true}
                      />
                    </div>
                  {/if}
                </td>

                <td
                  class={`py-3 ${
                    $isDarkMode
                      ? "bg-[#131313] group-hover:bg-[#000]"
                      : "bg-white group-hover:bg-gray-100"
                  }`}
                >
                  {#if item?.detail?.to}
                    <div class="w-max text-sm">
                      <Copy
                        address={item?.detail?.to}
                        textTooltip="Copy address"
                        iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                        color={`${$isDarkMode ? "#fff" : "#000"}`}
                        isShorten={true}
                      />
                    </div>
                  {/if}
                </td>

                <td
                  class={`py-3 min-w-[100px] ${
                    $isDarkMode
                      ? "bg-[#131313] group-hover:bg-[#000]"
                      : "bg-white group-hover:bg-gray-100"
                  }`}
                >
                  <div
                    class="flex justify-start font-medium text-sm text_00000099"
                  >
                    {#if item?.type}
                      <div
                        class="w-max px-2 py-1 text_27326F font-normal bg-[#6AC7F533] rounded-[5px] capitalize"
                      >
                        {item?.type}
                      </div>
                    {/if}
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
                    {#each flatten(item.changes) as change}
                      <div class="flex items-center gap-2">
                        <img
                          src={change?.logo || defaultToken}
                          alt=""
                          class="object-contain overflow-hidden rounded-full w-7 h-7 block"
                        />
                        <div
                          class={`flex gap-1 ${
                            change?.total < 0
                              ? "text_00000099"
                              : "text-[#00A878]"
                          }`}
                        >
                          <div class="flex gap-1">
                            <div class="flex">
                              {change?.total < 0 ? "-" : "+"}<TooltipNumber
                                number={Math.abs(change?.total)}
                                type="balance"
                              />
                            </div>
                            <div>
                              {change?.symbol || change?.name || "⎯"}
                            </div>
                          </div>
                          <div class="flex w-max">
                            (<TooltipNumber
                              number={Math.abs(
                                change?.total * change?.price?.price,
                              )}
                              type="value"
                            />)
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>

        {#if isLoading}
          <tbody>
            <tr>
              <td colspan="5">
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
                    <img
                      src={detectedGeneration(
                        item?.chain === "SUI" ? "MOVE" : item?.chain,
                      ) || defaultToken}
                      alt=""
                      class="object-contain w-5 h-5 rounded-full block"
                    />
                    <Copy
                      address={item?.transaction_hash}
                      textTooltip="Copy transaction to clipboard"
                      iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                      color={`${$isDarkMode ? "#fff" : "#000"}`}
                      isShorten={true}
                    />
                  </div>
                  <div class="text-gray-400 text-xs">
                    {formatTransactionTime(new Date(item?.detail.timestamp))}
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">
                {$t("From")}
              </div>
              {#if item?.detail?.from}
                <div class="w-max text-sm">
                  <Copy
                    address={item?.detail?.from}
                    textTooltip="Copy address"
                    iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                    color={`${$isDarkMode ? "#fff" : "#000"}`}
                    isShorten={true}
                  />
                </div>
              {:else}
                <div class="w-max text-sm">-</div>
              {/if}
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">
                {$t("To")}
              </div>
              {#if item?.detail?.to}
                <div class="w-max text-sm">
                  <Copy
                    address={item?.detail?.to}
                    textTooltip="Copy address"
                    iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                    color={`${$isDarkMode ? "#fff" : "#000"}`}
                    isShorten={true}
                  />
                </div>
              {:else}
                <div class="w-max text-sm">-</div>
              {/if}
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">
                {$t("Type")}
              </div>
              <div class="flex justify-start font-medium text-sm text_00000099">
                {#if item?.type}
                  <div
                    class="w-max px-2 py-1 text_27326F font-normal bg-[#6AC7F533] rounded-[5px] capitalize"
                  >
                    {item?.type}
                  </div>
                {/if}
              </div>
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">
                {$t("Token Change")}
              </div>
              <div class="flex flex-col items-start gap-2 font-medium text-sm">
                {#if flatten(item.changes) && flatten(item.changes).length !== 0}
                  {#each flatten(item.changes) as change}
                    <div class="flex items-center gap-2">
                      <img
                        src={change?.logo || defaultToken}
                        alt=""
                        class="object-contain overflow-hidden rounded-full w-6 h-6 block"
                      />
                      <div
                        class={`flex gap-1 ${
                          change?.total < 0 ? "text_00000099" : "text-[#00A878]"
                        }`}
                      >
                        <div class="flex gap-1">
                          <div class="flex">
                            {change?.total < 0 ? "-" : "+"}<TooltipNumber
                              number={Math.abs(change?.total)}
                              type="balance"
                            />
                          </div>
                          <div>
                            {change?.symbol || change?.name || "⎯"}
                          </div>
                        </div>
                        <div class="flex w-max">
                          (<TooltipNumber
                            number={Math.abs(
                              change?.total * change?.price?.price,
                            )}
                            type="value"
                          />)
                        </div>
                      </div>
                    </div>
                  {/each}
                {:else}
                  <div class="w-max text-sm">-</div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      {/if}

      {#if isLoading}
        <div
          class="flex justify-center items-center h-full py-3 px-3 text-base text-gray-400"
        >
          {#if isNimbusVersion}
            <LoadingPremium />
          {:else}
            <Loading />
          {/if}
        </div>
      {/if}
    </span>
  </Table>
{:else}
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
                {$t("From")}
              </div>
            </th>
            <th class="py-3">
              <div class="font-medium text-left text-xs uppercase">
                {$t("To")}
              </div>
            </th>
            <th class="py-3">
              <div
                class="text-left text-xs uppercase font-medium min-w-[100px]"
              >
                {$t("Type")}
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
                          address={item?.transaction_hash}
                          textTooltip="Copy transaction to clipboard"
                          iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                          color={`${$isDarkMode ? "#fff" : "#000"}`}
                          isShorten={true}
                          isLink={true}
                          link={`${
                            linkExplorer(item?.chain, item?.transaction_hash)
                              .trx
                          }`}
                        />
                      </div>
                      <div class="text-gray-400 text-xs">
                        {formatTransactionTime(
                          new Date(
                            ["ECLIPSE", "SOL"].includes(item?.chain) ||
                            ["ECLIPSE", "SOL"].includes($typeWallet)
                              ? item?.detail?.timestamp * 1000
                              : item?.detail.timestamp,
                          ),
                        )}
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
                  {#if item?.detail?.from}
                    <div class="w-max text-sm">
                      <Copy
                        address={item?.detail?.from}
                        iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                        color={`${$isDarkMode ? "#fff" : "#000"}`}
                        textTooltip="Copy address"
                        isShorten={true}
                        isLink={true}
                        link={`${
                          linkExplorer(item?.chain, item?.detail?.from).address
                        }`}
                      />
                    </div>
                  {/if}
                </td>

                <td
                  class={`py-3 ${
                    $isDarkMode
                      ? "bg-[#131313] group-hover:bg-[#000]"
                      : "bg-white group-hover:bg-gray-100"
                  }`}
                >
                  {#if item?.detail?.to}
                    <div class="w-max text-sm">
                      <Copy
                        address={item?.detail?.to}
                        iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                        color={`${$isDarkMode ? "#fff" : "#000"}`}
                        textTooltip="Copy address"
                        isShorten={true}
                        isLink={true}
                        link={`${
                          linkExplorer(item?.chain, item?.detail?.to).address
                        }`}
                      />
                    </div>
                  {/if}
                </td>

                <td
                  class={`py-3 min-w-[100px] ${
                    $isDarkMode
                      ? "bg-[#131313] group-hover:bg-[#000]"
                      : "bg-white group-hover:bg-gray-100"
                  }`}
                >
                  <div
                    class="flex justify-start font-medium text-sm text_00000099"
                  >
                    {#if item?.type}
                      <div
                        class="w-max px-2 py-1 text_27326F font-normal bg-[#6AC7F533] rounded-[5px] capitalize"
                      >
                        {item?.type}
                      </div>
                    {/if}
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
                    {#each flatten(item.changes) as change}
                      <div class="flex items-center gap-2">
                        <img
                          src={change?.logo || defaultToken}
                          alt=""
                          class="object-contain overflow-hidden rounded-full w-7 h-7 block"
                        />
                        <div
                          class={`flex gap-1 ${
                            change?.total < 0
                              ? "text_00000099"
                              : "text-[#00A878]"
                          }`}
                        >
                          <div class="flex gap-1">
                            <div class="flex">
                              {change?.total < 0 ? "-" : "+"}<TooltipNumber
                                number={Math.abs(change?.total)}
                                type="balance"
                              />
                            </div>
                            <div>
                              {change?.symbol || change?.name || "⎯"}
                            </div>
                          </div>
                          <div class="flex w-max">
                            (<TooltipNumber
                              number={Math.abs(
                                change?.total * change?.price?.price,
                              )}
                              type="value"
                            />)
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>

        {#if isLoading}
          <tbody>
            <tr>
              <td colspan="5">
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
                      address={item?.transaction_hash}
                      textTooltip="Copy transaction to clipboard"
                      iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                      color={`${$isDarkMode ? "#fff" : "#000"}`}
                      isShorten={true}
                      isLink={true}
                      link={`${
                        linkExplorer(item?.chain, item?.transaction_hash).trx
                      }`}
                    />
                  </div>
                  <div class="text-gray-400 text-xs">
                    {formatTransactionTime(
                      new Date(
                        ["ECLIPSE", "SOL"].includes(item?.chain) ||
                        ["ECLIPSE", "SOL"].includes($typeWallet)
                          ? item?.detail?.timestamp * 1000
                          : item?.detail.timestamp,
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">
                {$t("From")}
              </div>
              {#if item?.detail?.from}
                <div class="w-max text-sm">
                  <Copy
                    address={item?.detail?.from}
                    iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                    color={`${$isDarkMode ? "#fff" : "#000"}`}
                    textTooltip="Copy address"
                    isShorten={true}
                    isLink={true}
                    link={`${
                      linkExplorer(item?.chain, item?.detail?.from).address
                    }`}
                  />
                </div>
              {:else}
                <div class="w-max text-sm">-</div>
              {/if}
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">
                {$t("To")}
              </div>
              {#if item?.detail?.to}
                <div class="w-max text-sm">
                  <Copy
                    address={item?.detail?.to}
                    iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                    color={`${$isDarkMode ? "#fff" : "#000"}`}
                    textTooltip="Copy address"
                    isShorten={true}
                    isLink={true}
                    link={`${
                      linkExplorer(item?.chain, item?.detail?.to).address
                    }`}
                  />
                </div>
              {:else}
                <div class="w-max text-sm">-</div>
              {/if}
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">
                {$t("Type")}
              </div>
              <div class="flex justify-start font-medium text-sm text_00000099">
                {#if item?.type}
                  <div
                    class="w-max px-2 py-1 text_27326F font-normal bg-[#6AC7F533] rounded-[5px] capitalize"
                  >
                    {item?.type}
                  </div>
                {/if}
              </div>
            </div>

            <div class="flex justify-between items-start">
              <div class="text-right text-sm uppercase font-medium">
                {$t("Token Change")}
              </div>
              <div class="flex flex-col items-start gap-2 font-medium text-sm">
                {#if flatten(item.changes) && flatten(item.changes).length !== 0}
                  {#each flatten(item.changes) as change}
                    <div class="flex items-center gap-2">
                      <img
                        src={change?.logo || defaultToken}
                        alt=""
                        class="object-contain overflow-hidden rounded-full w-6 h-6 block"
                      />
                      <div
                        class={`flex gap-1 ${
                          change?.total < 0 ? "text_00000099" : "text-[#00A878]"
                        }`}
                      >
                        <div class="flex gap-1">
                          <div class="flex">
                            {change?.total < 0 ? "-" : "+"}<TooltipNumber
                              number={Math.abs(change?.total)}
                              type="balance"
                            />
                          </div>
                          <div>
                            {change?.symbol || change?.name || "⎯"}
                          </div>
                        </div>
                        <div class="flex w-max">
                          (<TooltipNumber
                            number={Math.abs(
                              change?.total * change?.price?.price,
                            )}
                            type="value"
                          />)
                        </div>
                      </div>
                    </div>
                  {/each}
                {:else}
                  <div class="w-max text-sm">-</div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      {/if}

      {#if isLoading}
        <div
          class="flex justify-center items-center h-full py-3 px-3 text-base text-gray-400"
        >
          {#if isNimbusVersion}
            <LoadingPremium />
          {:else}
            <Loading />
          {/if}
        </div>
      {/if}
    </span>
  </Table>
{/if}

{#if $typeWallet !== "BTC"}
  <div class="mx-auto mt-4">
    <div class="w-[140px]">
      {#if pageToken.length !== 0 && data && data.length !== 0}
        <Button
          variant="secondary"
          on:click={() => {
            loadMore(pageToken);
          }}
          disabled={isLoading}
        >
          {$t("Load more")}
        </Button>
      {:else}
        <Button variant="secondary" disabled={true}>{$t("Load more")}</Button>
      {/if}
    </div>
  </div>
{/if}

{#if $typeWallet === "EVM"}
  <div class="flex items-center gap-2">
    <a href="https://mobula.fi/" target="_blank">
      <img
        src={mobulaLogo}
        alt=""
        class="xl:w-6 xl:h-6 w-10 h-10 rounded-full cursor-pointer block"
      />
    </a>
    <span class="text-sm">{$t("Data by")} Mobula</span>
  </div>
{/if}

<style>
</style>
