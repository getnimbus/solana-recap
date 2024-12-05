<script lang="ts">
  import { shorterName } from "~/utils/index";
  import { detectedChain } from "~/lib/chains";
  import { isDarkMode, typeWallet } from "~/store";
  import { Progressbar } from "flowbite-svelte";
  import { isNimbusVersion } from "~/utils/constants";

  import Table from "~/components/Table.svelte";
  import Tooltip from "~/components/Tooltip.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import TooltipTitle from "~/components/TooltipTitle.svelte";

  export let toggleSortOrderTag = () => {};
  export let isLoadingToken;
  export let searchDataResult;
  export let sumTokens;

  let isShowTooltipName = false;
  let isShowTooltipSymbol = false;
  let selectedHover = "";
</script>

<Table>
  <span slot="desktop">
    <table class="table-auto w-full h-full">
      <thead>
        <tr class="bg_f4f5f8">
          <th class="rounded-tl-[10px] py-3 pl-3">
            <div class="text-left text-xs uppercase font-medium">Assets</div>
          </th>

          <th class="py-3">
            <div class="text-right text-xs uppercase font-medium">Price</div>
          </th>

          <th class="py-3">
            <div class="text-right text-xs uppercase font-medium">Amount</div>
          </th>

          <th class="py-3">
            <div class="text-right text-xs uppercase font-medium">Value</div>
          </th>

          <th class="py-3">
            <div class="text-right text-xs uppercase font-medium">
              <TooltipTitle tooltipText="Ratio based on total token holding">
                Ratio
              </TooltipTitle>
            </div>
          </th>

          <th class="rounded-tr-[10px] py-3 pr-3">
            <div
              class="text-right text-xs uppercase font-medium flex items-center justify-end gap-2"
            >
              Tag
              <div on:click={toggleSortOrderTag} class="cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="1.2em"
                  viewBox="0 0 320 512"
                  fill={$isDarkMode ? "#fff" : "#000"}
                  ><path
                    d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z"
                  /></svg
                >
              </div>
            </div>
          </th>
        </tr>
      </thead>
      {#if isLoadingToken}
        <tbody>
          <tr>
            <td colspan={6}>
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
          {#if searchDataResult && searchDataResult.length === 0}
            <tr>
              <td colspan={6}>
                <div
                  class="flex justify-center items-center h-full py-3 px-3 text-base text-gray-400"
                >
                  Empty
                </div>
              </td>
            </tr>
          {:else}
            {#each searchDataResult as data}
              <tr class="group transition-all">
                <td
                  class={`py-3 pl-3 ${
                    $isDarkMode
                      ? "bg-[#131313] group-hover:bg-[#000]"
                      : "bg-white group-hover:bg-gray-100"
                  }`}
                >
                  <div class="text-left flex items-center gap-3">
                    <div class="relative">
                      <img
                        src={data.logo}
                        alt=""
                        width="30"
                        height="30"
                        class="rounded-full"
                      />
                      {#if ["EVM", "BUNDLE"].includes($typeWallet)}
                        <div class="absolute -top-2 -right-1">
                          <img
                            src={detectedChain(data?.chain)?.logo}
                            alt=""
                            width="15"
                            height="15"
                            class="rounded-full"
                          />
                        </div>
                      {/if}
                    </div>

                    <div class="flex flex-col gap-1">
                      <div
                        class="text-sm font-medium relative"
                        on:mouseover={() => {
                          if (data?.name?.length > 20) {
                            selectedHover = data.name;
                            isShowTooltipName = true;
                          }
                        }}
                        on:mouseleave={() => {
                          if (data?.name?.length > 20) {
                            selectedHover = "";
                            isShowTooltipName = false;
                          }
                        }}
                      >
                        {#if data.name === undefined}
                          N/A
                        {:else}
                          {data?.name?.length > 20
                            ? shorterName(data.name, 20)
                            : data.name}
                        {/if}
                        {#if isShowTooltipName && selectedHover === data?.name && data?.name?.length > 20}
                          <div
                            class="absolute -top-8 left-0"
                            style="z-index: 2147483648;"
                          >
                            <Tooltip text={data.name} />
                          </div>
                        {/if}
                      </div>

                      <div
                        class="text_00000080 text-xs font-medium relative"
                        on:mouseover={() => {
                          if (data?.symbol?.length > 20) {
                            selectedHover = data.symbol;
                            isShowTooltipSymbol = true;
                          }
                        }}
                        on:mouseleave={() => {
                          if (data?.symbol?.length > 20) {
                            selectedHover = "";
                            isShowTooltipSymbol = false;
                          }
                        }}
                      >
                        {#if data.symbol === undefined}
                          N/A
                        {:else}
                          {shorterName(data.symbol, 20)}
                        {/if}
                        {#if isShowTooltipSymbol && selectedHover === data?.symbol && data?.symbol?.length > 20}
                          <div
                            class="absolute -top-8 left-0"
                            style="z-index: 2147483648;"
                          >
                            <Tooltip text={data.symbol} />
                          </div>
                        {/if}
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
                    class="text-sm text_00000099 font-medium flex justify-end"
                  >
                    $<TooltipNumber number={data.market_price} type="balance" />
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
                    class="text-sm text_00000099 font-medium flex justify-end"
                  >
                    <TooltipNumber number={data?.amount || 0} type="balance" />
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
                    class="text-sm text_00000099 font-medium flex justify-end"
                  >
                    <TooltipNumber
                      number={data?.amount * data?.market_price || 0}
                      type="value"
                    />
                  </div>
                </td>

                <td
                  class={`py-3 ${
                    $isDarkMode
                      ? "bg-[#131313] group-hover:bg-[#000]"
                      : "bg-white group-hover:bg-gray-100"
                  }`}
                >
                  <div class="flex flex-col gap-1 justify-end items-end">
                    <div
                      class="text-sm text_00000099 font-medium flex justify-end"
                    >
                      <TooltipNumber
                        number={data?.amount
                          ? ((data?.amount * data?.market_price) / sumTokens) *
                            100
                          : 0}
                        type="percent"
                      />%
                    </div>
                    <div class="w-3/4 max-w-20">
                      <Progressbar
                        progress={data?.amount
                          ? Number(
                              ((data?.amount * data?.market_price) /
                                sumTokens) *
                                100,
                            )
                          : 0}
                        size="h-1"
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
                  <div class="flex justify-end">
                    <div
                      class="bg-[#6AC7F533] text_27326F text-sm w-max px-3 py-1 rounded-[5px]"
                    >
                      {data.tag}
                    </div>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      {/if}
    </table>
  </span>
  <span slot="mobile">
    {#if isLoadingToken}
      <div class="flex justify-center items-center h-full py-3 px-3">
        {#if isNimbusVersion}
          <LoadingPremium />
        {:else}
          <Loading />
        {/if}
      </div>
    {:else}
      <div>
        {#if searchDataResult && searchDataResult.length === 0}
          <div
            class="flex justify-center items-center h-full py-3 px-3 text-base text-gray-400"
          >
            Empty
          </div>
        {:else}
          {#each searchDataResult as data}
            <div
              class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4"
            >
              <div class="text-left flex items-center gap-3">
                <div class="relative">
                  <img
                    src={data.logo}
                    alt=""
                    width="30"
                    height="30"
                    class="rounded-full"
                  />
                  {#if ["EVM", "BUNDLE"].includes($typeWallet)}
                    <div class="absolute -top-2 -right-1">
                      <img
                        src={detectedChain(data?.chain)?.logo}
                        alt=""
                        width="15"
                        height="15"
                        class="rounded-full"
                      />
                    </div>
                  {/if}
                </div>

                <div class="flex flex-col gap-1">
                  <div class="text-sm font-medium relative">
                    {#if data.name === undefined}
                      N/A
                    {:else}
                      {data.name}
                    {/if}
                  </div>

                  <div class="text_00000080 text-xs font-medium relative">
                    {#if data.symbol === undefined}
                      N/A
                    {:else}
                      {data.symbol}
                    {/if}
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  Price
                </div>
                <div class="text-sm text_00000099 font-medium flex justify-end">
                  $<TooltipNumber number={data.market_price} type="balance" />
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  Amount
                </div>
                <div class="text-sm text_00000099 font-medium flex justify-end">
                  <TooltipNumber number={data?.amount || 0} type="balance" />
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  Value
                </div>
                <div class="text-sm text_00000099 font-medium flex justify-end">
                  <TooltipNumber
                    number={data?.amount * data?.market_price || 0}
                    type="value"
                  />
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  <TooltipTitle
                    tooltipText="Ratio based on total token holding"
                  >
                    Ratio
                  </TooltipTitle>
                </div>
                <div class="flex flex-col gap-1 justify-end items-end">
                  <div
                    class="text-sm text_00000099 font-medium flex justify-end"
                  >
                    <TooltipNumber
                      number={data?.amount
                        ? ((data?.amount * data?.market_price) / sumTokens) *
                          100
                        : 0}
                      type="percent"
                    />%
                  </div>
                  <div class="w-3/4 max-w-20">
                    <Progressbar
                      progress={data?.amount
                        ? Number(
                            ((data?.amount * data?.market_price) / sumTokens) *
                              100,
                          )
                        : 0}
                      size="h-1"
                    />
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-center">
                <div class="text-right text-sm uppercase font-medium">Tag</div>
                <div class="text-sm text_00000099 font-medium flex justify-end">
                  <div
                    class="bg-[#6AC7F533] text_27326F text-sm w-max px-3 py-1 rounded-[5px]"
                  >
                    {data?.tag}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </span>
</Table>

<style></style>
