<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import { isDarkMode } from "~/store";
  import tooltip from "~/lib/tooltip";
  import { t } from "~/lib/i18n";
  import { handleImgError } from "~/utils";

  export let listVirtualPortfolio;
  export let handleSelectedVirtual = (data) => {};
  export let isLoading;

  import Loading from "~/components/Loading.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Table from "~/components/Table.svelte";

  import TrendUp from "~/assets/trend-up.svg";
  import TrendDown from "~/assets/trend-down.svg";
  import defaultToken from "~/assets/defaultToken.png";

  let virtualPortfolioDashboard: any = [];

  $: {
    if (listVirtualPortfolio && listVirtualPortfolio.length !== 0) {
      handleFormatDatVirtualPortfolioDashboard(listVirtualPortfolio);
    } else {
      virtualPortfolioDashboard = [];
    }
  }

  const handleFormatDatVirtualPortfolioDashboard = (data: any) => {
    virtualPortfolioDashboard = data?.map((item: any) => {
      const realizedProfit =
        Number(item?.current_networth) - Number(item?.initial_networth);

      const percentRealizeProfit =
        ((Number(item?.current_networth) - Number(item?.initial_networth)) /
          Number(item?.initial_networth)) *
        100;

      return {
        ...item,
        data: item.virtual_portfolio.filter(
          (eachData: any) => eachData.version === item.latest_version,
        ),
        realizedProfit,
        percentRealizeProfit,
      };
    });
  };
</script>

<Table>
  <span slot="desktop">
    <table class="table-auto w-full h-full">
      <thead>
        <tr class="bg_f4f5f8">
          <th class="pl-3 py-3 rounded-tl-[10px]">
            <div class="text-left text-xs uppercase font-medium">
              {$t("Name")}
            </div>
          </th>

          <th class="py-3">
            <div class="text-left text-xs uppercase font-medium">
              {$t("Assets")}
            </div>
          </th>

          <th class="py-3">
            <div class="text-right text-xs uppercase font-medium">1d</div>
          </th>

          <th class="py-3">
            <div class="text-right text-xs uppercase font-medium">1w</div>
          </th>

          <th class="py-3">
            <div class="text-right text-xs uppercase font-medium">1m</div>
          </th>

          <th class="py-3">
            <div class="text-right text-xs uppercase font-medium">
              {$t("Max Drawdown")}
            </div>
          </th>

          <th class="py-3">
            <div class="text-right text-xs uppercase font-medium">ROI</div>
          </th>

          <th class="pr-3 py-3 rounded-tr-[10px]">
            <div class="text-right text-xs uppercase font-medium">
              # {$t("of coins")}
            </div>
          </th>
        </tr>
      </thead>

      {#if isLoading}
        <tbody>
          <tr>
            <td colspan="9">
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
          {#if virtualPortfolioDashboard && virtualPortfolioDashboard?.length === 0}
            <tr>
              <td colspan="9">
                <div
                  class="flex justify-center items-center h-full py-4 px-3 text-lg text-gray-400"
                >
                  {$t("No paper trade added yet")}.
                </div>
              </td>
            </tr>
          {:else}
            {#each virtualPortfolioDashboard || [] as item}
              <tr
                class={`group transition-all cursor-pointer ${
                  $isDarkMode ? "text-gray-400" : "text-[#666666]"
                }`}
              >
                <td
                  class={`pl-3 py-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                  on:click={() => {
                    handleSelectedVirtual({
                      tab: "paper-trade",
                      owner: item.owner,
                      virtualPortfolioId: item.id,
                      name: item.name,
                    });
                  }}
                >
                  <div class="text-left text-sm font-medium">
                    {item?.name}
                  </div>
                </td>

                <td
                  class={`py-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                  on:click={() => {
                    handleSelectedVirtual({
                      tab: "paper-trade",
                      owner: item.owner,
                      virtualPortfolioId: item.id,
                      name: item.name,
                    });
                  }}
                >
                  <div class="flex justify-start items-center -space-x-2">
                    {#if item?.data?.length > 5}
                      {#each item?.data?.slice(0, 4) as token, index}
                        <div
                          class={`${index > 0 && "-ml-2"}`}
                          use:tooltip={{
                            content: `<tooltip-detail text="${token.symbol.toUpperCase()}" />`,
                            allowHTML: true,
                            placement: "top",
                          }}
                        >
                          <img
                            src={token.logo || defaultToken}
                            alt=""
                            class="w-7 h-7 object-contain rounded-full bg-white"
                            on:error={(e) => handleImgError(e, defaultToken)}
                          />
                        </div>
                      {/each}
                      <div class="relative w-7 h-7">
                        <div
                          class="absolute top-0 -left-2 w-full h-full bg-[#f1f1f1] text-gray-400 text-center flex justify-center items-center pb-2 rounded-full"
                        >
                          ...
                        </div>
                      </div>
                    {:else}
                      {#each item?.data as token, index}
                        <div
                          class={`${index > 0 && "-ml-2"}`}
                          use:tooltip={{
                            content: `<tooltip-detail text="${token.symbol.toUpperCase()}" />`,
                            allowHTML: true,
                            placement: "top",
                          }}
                        >
                          <img
                            src={token.logo || defaultToken}
                            alt=""
                            class="w-7 h-7 object-contain rounded-full bg-white"
                            on:error={(e) => handleImgError(e, defaultToken)}
                          />
                        </div>
                      {/each}
                    {/if}
                  </div>
                </td>

                <td
                  class={`py-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                  on:click={() => {
                    handleSelectedVirtual({
                      tab: "paper-trade",
                      owner: item.owner,
                      virtualPortfolioId: item.id,
                      name: item.name,
                    });
                  }}
                >
                  <div
                    class="text-sm text-right font-medium flex flex-col items-end gap-1"
                  >
                    <div
                      class={`flex items-center ${
                        item?.change_1d === 0
                          ? ""
                          : item?.change_1d >= 0
                            ? "text-[#00A878]"
                            : "text-red-500"
                      }`}
                    >
                      <TooltipNumber
                        number={Math.abs(Number(item?.change_1d))}
                        type={Math.abs(Number(item?.change_1d)) > 999999
                          ? "balance"
                          : "percent"}
                      />%
                      {#if item?.change_1d !== 0}
                        <img
                          src={item?.change_1d >= 0 ? TrendUp : TrendDown}
                          alt="trend"
                          class="ml-1 mb-1 w-4 h-4"
                        />
                      {/if}
                    </div>
                  </div>
                </td>

                <td
                  class={`py-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                  on:click={() => {
                    handleSelectedVirtual({
                      tab: "paper-trade",
                      owner: item.owner,
                      virtualPortfolioId: item.id,
                      name: item.name,
                    });
                  }}
                >
                  <div
                    class="text-sm text-right font-medium flex flex-col items-end gap-1"
                  >
                    <div
                      class={`flex items-center ${
                        item?.change_1w === 0
                          ? ""
                          : item?.change_1w >= 0
                            ? "text-[#00A878]"
                            : "text-red-500"
                      }`}
                    >
                      <TooltipNumber
                        number={Math.abs(Number(item?.change_1w))}
                        type={Math.abs(Number(item?.change_1w)) > 999999
                          ? "balance"
                          : "percent"}
                      />%
                      {#if item?.change_1w !== 0}
                        <img
                          src={item?.change_1w >= 0 ? TrendUp : TrendDown}
                          alt="trend"
                          class="ml-1 mb-1 w-4 h-4"
                        />
                      {/if}
                    </div>
                  </div>
                </td>

                <td
                  class={`py-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                  on:click={() => {
                    handleSelectedVirtual({
                      tab: "paper-trade",
                      owner: item.owner,
                      virtualPortfolioId: item.id,
                      name: item.name,
                    });
                  }}
                >
                  <div
                    class="text-sm text-right font-medium flex flex-col items-end gap-1"
                  >
                    <div
                      class={`flex items-center ${
                        item?.change_1m === 0
                          ? ""
                          : item?.change_1m >= 0
                            ? "text-[#00A878]"
                            : "text-red-500"
                      }`}
                    >
                      <TooltipNumber
                        number={Math.abs(Number(item?.change_1m))}
                        type={Math.abs(Number(item?.change_1m)) > 999999
                          ? "balance"
                          : "percent"}
                      />%
                      {#if item?.change_1m !== 0}
                        <img
                          src={item?.change_1m >= 0 ? TrendUp : TrendDown}
                          alt="trend"
                          class="ml-1 mb-1 w-4 h-4"
                        />
                      {/if}
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
                  <div
                    class="flex items-center justify-end gap-1 text-sm font-medium"
                  >
                    <div
                      class={`flex items-center ${
                        item.realizedProfit !== 0
                          ? item.realizedProfit >= 0
                            ? "text-[#00A878]"
                            : "text-red-500"
                          : "text_00000099"
                      }`}
                    >
                      <TooltipNumber
                        number={Math.abs(item.percentRealizeProfit)}
                        type="percent"
                      />
                      <span>%</span>
                    </div>
                    {#if item.realizedProfit !== 0}
                      <img
                        src={item.realizedProfit >= 0 ? TrendUp : TrendDown}
                        alt="trend"
                        class="mb-1 block"
                      />
                    {/if}
                  </div>
                </td>

                <td
                  class={`py-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                >
                  <div
                    class="flex items-center justify-end gap-1 text-sm font-medium"
                  >
                    <div
                      class={`flex items-center ${
                        item.max_drawdown !== 0
                          ? item.max_drawdown >= 0
                            ? "text-[#00A878]"
                            : "text-red-500"
                          : "text_00000099"
                      }`}
                    >
                      <TooltipNumber
                        number={Math.abs(item.max_drawdown)}
                        type="percent"
                      />
                      <span>%</span>
                    </div>
                    {#if item.max_drawdown !== 0}
                      <img
                        src={item.max_drawdown >= 0 ? TrendUp : TrendDown}
                        alt="trend"
                        class="mb-1 block"
                      />
                    {/if}
                  </div>
                </td>

                <td
                  class={`py-3 pr-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                  on:click={() => {
                    handleSelectedVirtual({
                      tab: "paper-trade",
                      owner: item.owner,
                      virtualPortfolioId: item.id,
                      name: item.name,
                    });
                  }}
                >
                  <div class="text-right text-sm font-medium">
                    {item?.num_token || 0}
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
    {#if isLoading}
      <div class="flex justify-center items-center h-full py-3 px-3">
        {#if isNimbusVersion}
          <LoadingPremium />
        {:else}
          <Loading />
        {/if}
      </div>
    {:else}
      <div class="relative w-full">
        {#if virtualPortfolioDashboard && virtualPortfolioDashboard?.length === 0}
          <div
            class="flex justify-center items-center h-full py-3 px-3 text-lg text-gray-400"
          >
            {$t("Empty")}
          </div>
        {:else}
          {#each virtualPortfolioDashboard as item}
            <div
              class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4"
            >
              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  {$t("Name")}
                </div>
                <div class="text-sm text_00000099 font-medium flex justify-end">
                  {item?.name}
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  {$t("Assets")}
                </div>
                <div class="flex justify-end items-center -space-x-2">
                  {#if item?.data?.length > 5}
                    {#each item?.data?.slice(0, 4) as token, index}
                      <div
                        class={`${index > 0 && "-ml-2"}`}
                        use:tooltip={{
                          content: `<tooltip-detail text="${token.symbol.toUpperCase()}" />`,
                          allowHTML: true,
                          placement: "top",
                        }}
                      >
                        <img
                          src={token.logo || defaultToken}
                          alt=""
                          class="w-7 h-7 object-contain rounded-full bg-white"
                          on:error={(e) => handleImgError(e, defaultToken)}
                        />
                      </div>
                    {/each}
                    <div class="relative w-7 h-7">
                      <div
                        class="absolute top-0 -left-2 w-full h-full bg-[#f1f1f1] text-gray-400 text-center flex justify-center items-center pb-2 rounded-full"
                      >
                        ...
                      </div>
                    </div>
                  {:else}
                    {#each item?.data as token, index}
                      <div
                        class={`${index > 0 && "-ml-2"}`}
                        use:tooltip={{
                          content: `<tooltip-detail text="${token.symbol.toUpperCase()}" />`,
                          allowHTML: true,
                          placement: "top",
                        }}
                      >
                        <img
                          src={token.logo || defaultToken}
                          alt=""
                          class="w-7 h-7 object-contain rounded-full bg-white"
                          on:error={(e) => handleImgError(e, defaultToken)}
                        />
                      </div>
                    {/each}
                  {/if}
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">1d</div>
                <div
                  class="text-sm text-right font-medium flex flex-col items-end gap-1"
                >
                  <div
                    class={`flex items-center ${
                      item?.performanceOneDay === 0
                        ? ""
                        : item?.performanceOneDay >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                    }`}
                  >
                    <TooltipNumber
                      number={Math.abs(Number(item?.performanceOneDay))}
                      type={Math.abs(Number(item?.performanceOneDay)) > 999999
                        ? "balance"
                        : "percent"}
                    />%
                    {#if item?.performanceOneDay !== 0}
                      <img
                        src={item?.performanceOneDay >= 0 ? TrendUp : TrendDown}
                        alt="trend"
                        class="ml-1 mb-1 w-4 h-4"
                      />
                    {/if}
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">1w</div>
                <div
                  class="text-sm text-right font-medium flex flex-col items-end gap-1"
                >
                  <div
                    class={`flex items-center ${
                      item?.performanceOneWeek === 0
                        ? ""
                        : item?.performanceOneWeek >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                    }`}
                  >
                    <TooltipNumber
                      number={Math.abs(Number(item?.performanceOneWeek))}
                      type={Math.abs(Number(item?.performanceOneWeek)) > 999999
                        ? "balance"
                        : "percent"}
                    />%
                    {#if item?.performanceOneWeek !== 0}
                      <img
                        src={item?.performanceOneWeek >= 0
                          ? TrendUp
                          : TrendDown}
                        alt="trend"
                        class="ml-1 mb-1 w-4 h-4"
                      />
                    {/if}
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">1m</div>
                <div
                  class="text-sm text-right font-medium flex flex-col items-end gap-1"
                >
                  <div
                    class={`flex items-center ${
                      item?.performanceOneMonth === 0
                        ? ""
                        : item?.performanceOneMonth >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                    }`}
                  >
                    <TooltipNumber
                      number={Math.abs(Number(item?.performanceOneMonth))}
                      type={Math.abs(Number(item?.performanceOneMonth)) > 999999
                        ? "balance"
                        : "percent"}
                    />%
                    {#if item?.performanceOneMonth !== 0}
                      <img
                        src={item?.performanceOneMonth >= 0
                          ? TrendUp
                          : TrendDown}
                        alt="trend"
                        class="ml-1 mb-1 w-4 h-4"
                      />
                    {/if}
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">ROI</div>
                <div
                  class="flex items-center justify-end gap-1 text-sm font-medium"
                >
                  <div
                    class={`flex items-center ${
                      item.realizedProfit !== 0
                        ? item.realizedProfit >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                        : "text_00000099"
                    }`}
                  >
                    <TooltipNumber
                      number={Math.abs(item.percentRealizeProfit)}
                      type="percent"
                    />
                    <span>%</span>
                  </div>
                  {#if item.realizedProfit !== 0}
                    <img
                      src={item.realizedProfit >= 0 ? TrendUp : TrendDown}
                      alt="trend"
                      class="mb-1 block"
                    />
                  {/if}
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  {$t("Max Drawdown")}
                </div>
                <div
                  class="flex items-center justify-end gap-1 text-sm font-medium"
                >
                  <div
                    class={`flex items-center ${
                      item.max_drawdown !== 0
                        ? item.max_drawdown >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                        : "text_00000099"
                    }`}
                  >
                    <TooltipNumber
                      number={Math.abs(item.max_drawdown)}
                      type="percent"
                    />
                    <span>%</span>
                  </div>
                  {#if item.max_drawdown !== 0}
                    <img
                      src={item.max_drawdown >= 0 ? TrendUp : TrendDown}
                      alt="trend"
                      class="mb-1 block"
                    />
                  {/if}
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div class="text-right text-sm uppercase font-medium">
                  # {$t("of coins")}
                </div>
                <div class="text-sm text_00000099 font-medium flex justify-end">
                  {item?.num_token || 0}
                </div>
              </div>

              <div class="flex justify-between items-center">
                <div class="text-right text-sm uppercase font-medium mt-1">
                  Action
                </div>
                <div
                  class="flex justify-center cursor-pointer"
                  on:click={() => {
                    handleSelectedVirtual({
                      tab: "paper-trade",
                      owner: item.owner,
                      virtualPortfolioId: item.id,
                      name: item.name,
                    });
                  }}
                >
                  <div class="w-[20px] h-[20px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink"
                      version="1.1"
                      viewBox="0 0 256 256"
                      xml:space="preserve"
                    >
                      <defs />
                      <g
                        style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                        fill={$isDarkMode ? "white" : "#00000080"}
                        transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
                      >
                        <path
                          d="M 87.994 0 H 69.342 c -1.787 0 -2.682 2.16 -1.418 3.424 l 5.795 5.795 l -33.82 33.82 L 28.056 31.196 l -3.174 -3.174 c -1.074 -1.074 -2.815 -1.074 -3.889 0 L 0.805 48.209 c -1.074 1.074 -1.074 2.815 0 3.889 l 3.174 3.174 c 1.074 1.074 2.815 1.074 3.889 0 l 15.069 -15.069 l 14.994 14.994 c 1.074 1.074 2.815 1.074 3.889 0 l 1.614 -1.614 c 0.083 -0.066 0.17 -0.125 0.247 -0.202 l 37.1 -37.1 l 5.795 5.795 C 87.84 23.34 90 22.445 90 20.658 V 2.006 C 90 0.898 89.102 0 87.994 0 z"
                          style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                          transform=" matrix(1 0 0 1 0 0) "
                          fill={$isDarkMode ? "white" : "#00000080"}
                          stroke-linecap="round"
                        />
                        <path
                          d="M 65.626 37.8 v 49.45 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 23.518 L 65.626 37.8 z"
                          style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                          fill={$isDarkMode ? "white" : "#00000080"}
                          transform=" matrix(1 0 0 1 0 0) "
                          stroke-linecap="round"
                        />
                        <path
                          d="M 47.115 56.312 V 87.25 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 42.03 L 47.115 56.312 z"
                          style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                          fill={$isDarkMode ? "white" : "#00000080"}
                          transform=" matrix(1 0 0 1 0 0) "
                          stroke-linecap="round"
                        />
                        <path
                          d="M 39.876 60.503 c -1.937 0 -3.757 -0.754 -5.127 -2.124 l -6.146 -6.145 V 87.25 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 59.844 C 41.952 60.271 40.933 60.503 39.876 60.503 z"
                          style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                          fill={$isDarkMode ? "white" : "#00000080"}
                          transform=" matrix(1 0 0 1 0 0) "
                          stroke-linecap="round"
                        />
                        <path
                          d="M 22.937 46.567 L 11.051 58.453 c -0.298 0.298 -0.621 0.562 -0.959 0.8 V 87.25 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 48.004 L 22.937 46.567 z"
                          style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                          fill={$isDarkMode ? "white" : "#00000080"}
                          transform=" matrix(1 0 0 1 0 0) "
                          stroke-linecap="round"
                        />
                      </g>
                    </svg>
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
