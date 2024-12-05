<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import { isDarkMode } from "~/store";
  import { createQuery } from "@tanstack/svelte-query";
  import { getVirtualPortfolioDashboard } from "~/lib/queryAPI";
  import tooltip from "~/lib/tooltip";
  import { t } from "~/lib/i18n";
  import { handleImgError, shorterAddress } from "~/utils";

  import Loading from "~/components/Loading.svelte";
  import Copy from "~/components/Copy.svelte";
  import Table from "~/components/Table.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Pagination from "~/components/Pagination.svelte";

  import TrendUp from "~/assets/trend-up.svg";
  import TrendDown from "~/assets/trend-down.svg";
  import defaultToken from "~/assets/defaultToken.png";

  export let tab;
  export let handleSelectedVirtual;

  let virtualPortfolioDashboard: any = [];
  let totalPage = 0;
  let pagination = 1;
  let sort = "";

  $: queryVirtualPortfolioDashboard = createQuery({
    queryKey: ["virtual-portfolio-dashboard", pagination, sort],
    queryFn: () => getVirtualPortfolioDashboard(pagination, sort),
    retry: false,
    enabled: Boolean(tab && tab?.length !== 0),
  });

  $: {
    if (
      !$queryVirtualPortfolioDashboard.isError &&
      $queryVirtualPortfolioDashboard.data !== undefined
    ) {
      totalPage = $queryVirtualPortfolioDashboard?.data?.data?.totalPage;
      handleFormatDatVirtualPortfolioDashboard(
        $queryVirtualPortfolioDashboard?.data?.data?.result || [],
      );
    }
  }

  const handleFormatDatVirtualPortfolioDashboard = async (data: any) => {
    virtualPortfolioDashboard = data?.map((item: any) => {
      const realizedProfit =
        Number(item?.current_networth) - Number(item?.initial_networth);

      const percentRealizeProfit =
        ((Number(item?.current_networth) - Number(item?.initial_networth)) /
          Number(item?.initial_networth)) *
        100;

      return {
        ...item,
        realizedProfit,
        percentRealizeProfit,
      };
    });
  };

  const handlePageChange = (page: number) => {
    pagination = page;
  };

  const keysort = {
    one_day: { title: "change_1d", type: "sortOneDay" },
    one_week: { title: "change_1w", type: "sortOneWeek" },
    one_month: { title: "change_1m", type: "sortOneMonth" },
    total_token: { title: "num_token", type: "sortTotalToken" },
    total_networth: { title: "current_networth", type: "sortTotalNetworth" },
    max_drawdown: { title: "max_drawdown", type: "sortMaxDrawdown" },
  };

  let sortOneDay = "default";
  let sortOneWeek = "default";
  let sortOneMonth = "default";
  let sortTotalToken = "default";
  let sortMaxDrawdown = "default";
  let sortTotalNetworth = "desc";

  const toggleShortDashboard = (key: any, sortType: any) => {
    let sortingType = "default";
    switch (sortType) {
      case "sortOneDay":
        sortTotalToken = "default";
        sortOneMonth = "default";
        sortOneWeek = "default";
        sortMaxDrawdown = "default";
        sortTotalNetworth = "default";
        switch (sortOneDay) {
          case "default":
            sortingType = sortOneDay = "asc";
            break;
          case "asc":
            sortingType = sortOneDay = "desc";
            break;
          case "desc":
            sortingType = sortOneDay = "default";
            break;
          default:
            sortingType = sortOneDay = "default";
        }
        break;
      case "sortOneWeek":
        sortTotalToken = "default";
        sortOneMonth = "default";
        sortOneDay = "default";
        sortMaxDrawdown = "default";
        sortTotalNetworth = "default";
        switch (sortOneWeek) {
          case "default":
            sortingType = sortOneWeek = "asc";
            break;
          case "asc":
            sortingType = sortOneWeek = "desc";
            break;
          case "desc":
            sortingType = sortOneWeek = "default";
            break;
          default:
            sortingType = sortOneWeek = "default";
        }
        break;
      case "sortOneMonth":
        sortTotalToken = "default";
        sortOneDay = "default";
        sortOneWeek = "default";
        sortMaxDrawdown = "default";
        sortTotalNetworth = "default";
        switch (sortOneMonth) {
          case "default":
            sortingType = sortOneMonth = "asc";
            break;
          case "asc":
            sortingType = sortOneMonth = "desc";
            break;
          case "desc":
            sortingType = sortOneMonth = "default";
            break;
          default:
            sortingType = sortOneMonth = "default";
        }
        break;
      case "sortTotalToken":
        sortOneMonth = "default";
        sortOneDay = "default";
        sortOneWeek = "default";
        sortMaxDrawdown = "default";
        sortTotalNetworth = "default";
        switch (sortTotalToken) {
          case "default":
            sortingType = sortTotalToken = "asc";
            break;
          case "asc":
            sortingType = sortTotalToken = "desc";
            break;
          case "desc":
            sortingType = sortTotalToken = "default";
            break;
          default:
            sortingType = sortTotalToken = "default";
        }
        break;
      case "sortMaxDrawdown":
        sortTotalToken = "default";
        sortOneMonth = "default";
        sortOneDay = "default";
        sortOneWeek = "default";
        sortTotalNetworth = "default";
        switch (sortMaxDrawdown) {
          case "default":
            sortingType = sortMaxDrawdown = "asc";
            break;
          case "asc":
            sortingType = sortMaxDrawdown = "desc";
            break;
          case "desc":
            sortingType = sortMaxDrawdown = "default";
            break;
          default:
            sortingType = sortMaxDrawdown = "default";
        }
        break;
      case "sortTotalNetworth":
        sortTotalToken = "default";
        sortOneMonth = "default";
        sortOneDay = "default";
        sortOneWeek = "default";
        sortMaxDrawdown = "default";
        switch (sortTotalNetworth) {
          case "default":
            sortingType = sortTotalNetworth = "asc";
            break;
          case "asc":
            sortingType = sortTotalNetworth = "desc";
            break;
          case "desc":
            sortingType = sortTotalNetworth = "default";
            break;
          default:
            sortingType = sortTotalNetworth = "default";
        }
        break;
      default:
        sortingType = "default";
        break;
    }

    sort = `${key}:${sortingType}`;
  };

  $: sortIcon = (sortType: any) => {
    return `<svg
              height="0.9rem"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0" />
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M16.0686 15H7.9313C7.32548 15 7.02257 15 6.88231 15.1198C6.76061 15.2238 6.69602 15.3797 6.70858 15.5393C6.72305 15.7232 6.93724 15.9374 7.36561 16.3657L11.4342 20.4344C11.6323 20.6324 11.7313 20.7314 11.8454 20.7685C11.9458 20.8011 12.054 20.8011 12.1544 20.7685C12.2686 20.7314 12.3676 20.6324 12.5656 20.4344L16.6342 16.3657C17.0626 15.9374 17.2768 15.7232 17.2913 15.5393C17.3038 15.3797 17.2392 15.2238 17.1175 15.1198C16.9773 15 16.6744 15 16.0686 15Z"
                  stroke="${$isDarkMode ? "#ffffff" : "#000000"}"
                  fill="${
                    sortType === "default" || sortType === "desc"
                      ? $isDarkMode
                        ? "#ffffff"
                        : "#000000"
                      : ""
                  }"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M7.9313 9.00005H16.0686C16.6744 9.00005 16.9773 9.00005 17.1175 8.88025C17.2393 8.7763 17.3038 8.62038 17.2913 8.46082C17.2768 8.27693 17.0626 8.06274 16.6342 7.63436L12.5656 3.56573C12.3676 3.36772 12.2686 3.26872 12.1544 3.23163C12.054 3.199 11.9458 3.199 11.8454 3.23163C11.7313 3.26872 11.6323 3.36772 11.4342 3.56573L7.36561 7.63436C6.93724 8.06273 6.72305 8.27693 6.70858 8.46082C6.69602 8.62038 6.76061 8.7763 6.88231 8.88025C7.02257 9.00005 7.32548 9.00005 7.9313 9.00005Z"
                  stroke="${$isDarkMode ? "#ffffff" : "#000000"}"
                  fill="${
                    sortType === "default" || sortType === "asc"
                      ? $isDarkMode
                        ? "#ffffff"
                        : "#000000"
                      : ""
                  }"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </svg>`;
  };
</script>

<div class="flex flex-col gap-4">
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
              <div
                class="flex items-center justify-end gap-2 text-right text-xs uppercase font-medium"
              >
                1d
                <div
                  on:click={() => {
                    toggleShortDashboard(
                      keysort.one_day.title,
                      keysort.one_day.type,
                    );
                  }}
                  class="cursor-pointer"
                >
                  {@html sortIcon(sortOneDay)}
                </div>
              </div>
            </th>

            <th class="py-3">
              <div
                class="flex items-center justify-end gap-2 text-right text-xs uppercase font-medium"
              >
                1w
                <div
                  on:click={() => {
                    toggleShortDashboard(
                      keysort.one_week.title,
                      keysort.one_week.type,
                    );
                  }}
                  class="cursor-pointer"
                >
                  {@html sortIcon(sortOneWeek)}
                </div>
              </div>
            </th>

            <th class="py-3">
              <div
                class="flex items-center justify-end gap-2 text-right text-xs uppercase font-medium"
              >
                1m
                <div
                  on:click={() => {
                    toggleShortDashboard(
                      keysort.one_month.title,
                      keysort.one_month.type,
                    );
                  }}
                  class="cursor-pointer"
                >
                  {@html sortIcon(sortOneMonth)}
                </div>
              </div>
            </th>

            <th class="py-3">
              <div
                class="flex items-center justify-end gap-2 text-right text-xs uppercase font-medium"
              >
                {$t("Max Drawdown")}
                <div
                  on:click={() => {
                    toggleShortDashboard(
                      keysort.max_drawdown.title,
                      keysort.max_drawdown.type,
                    );
                  }}
                  class="cursor-pointer"
                >
                  {@html sortIcon(sortMaxDrawdown)}
                </div>
              </div>
            </th>

            <th class="py-3">
              <div
                class="flex items-center justify-end gap-2 text-right text-xs uppercase font-medium"
              >
                ROI
                <div
                  on:click={() => {
                    toggleShortDashboard(
                      keysort.total_networth.title,
                      keysort.total_networth.type,
                    );
                  }}
                  class="cursor-pointer"
                >
                  {@html sortIcon(sortTotalNetworth)}
                </div>
              </div>
            </th>

            <th class="pr-3 py-3 rounded-tr-[10px]">
              <div class="text-right text-xs uppercase font-medium">
                {$t("Creator")}
              </div>
            </th>
          </tr>
        </thead>

        {#if $queryVirtualPortfolioDashboard.isFetching && virtualPortfolioDashboard?.length === 0}
          <tbody>
            <tr>
              <td colspan="8">
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
                <td colspan="8">
                  <div
                    class="flex justify-center items-center h-full py-4 px-3 text-lg text-gray-400"
                  >
                    Empty
                  </div>
                </td>
              </tr>
            {:else}
              {#each virtualPortfolioDashboard as item}
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
                          item?.performanceOneDay === 0
                            ? ""
                            : item?.performanceOneDay >= 0
                              ? "text-[#00A878]"
                              : "text-red-500"
                        }`}
                      >
                        <TooltipNumber
                          number={Math.abs(Number(item?.performanceOneDay))}
                          type={Math.abs(Number(item?.performanceOneDay)) >
                          999999
                            ? "balance"
                            : "percent"}
                        />%
                        {#if item?.performanceOneDay !== 0}
                          <img
                            src={item?.performanceOneDay >= 0
                              ? TrendUp
                              : TrendDown}
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
                          item?.performanceOneWeek === 0
                            ? ""
                            : item?.performanceOneWeek >= 0
                              ? "text-[#00A878]"
                              : "text-red-500"
                        }`}
                      >
                        <TooltipNumber
                          number={Math.abs(Number(item?.performanceOneWeek))}
                          type={Math.abs(Number(item?.performanceOneWeek)) >
                          999999
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
                          item?.performanceOneMonth === 0
                            ? ""
                            : item?.performanceOneMonth >= 0
                              ? "text-[#00A878]"
                              : "text-red-500"
                        }`}
                      >
                        <TooltipNumber
                          number={Math.abs(Number(item?.performanceOneMonth))}
                          type={Math.abs(Number(item?.performanceOneMonth)) >
                          999999
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
                          item?.max_drawdown === 0
                            ? ""
                            : item?.max_drawdown >= 0
                              ? "text-[#00A878]"
                              : "text-red-500"
                        }`}
                      >
                        <TooltipNumber
                          number={Math.abs(Number(item?.max_drawdown))}
                          type={Math.abs(Number(item?.max_drawdown)) > 999999
                            ? "balance"
                            : "percent"}
                        />%
                        {#if item?.max_drawdown !== 0}
                          <img
                            src={item?.max_drawdown >= 0 ? TrendUp : TrendDown}
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
                    class={`py-3 pr-3 ${
                      $isDarkMode
                        ? "group-hover:bg-[#000]"
                        : "group-hover:bg-gray-100"
                    }`}
                  >
                    <div class="text-sm flex justify-end">
                      <Copy
                        address={item?.owner}
                        textTooltip="Copy address to clipboard"
                        iconColor={$isDarkMode ? "#9ca3af" : "#666666"}
                        color={$isDarkMode ? "text-gray-400" : "text-[#666666]"}
                        isShorten={true}
                      />
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
      {#if $queryVirtualPortfolioDashboard.isFetching}
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
                  <div
                    class="text-sm text_00000099 font-medium flex justify-end"
                  >
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
                          src={item?.performanceOneDay >= 0
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
                        type={Math.abs(Number(item?.performanceOneWeek)) >
                        999999
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
                        type={Math.abs(Number(item?.performanceOneMonth)) >
                        999999
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
                  <div class="text-right text-sm uppercase font-medium">
                    {$t("Max Drawdown")}
                  </div>
                  <div
                    class="text-sm text-right font-medium flex flex-col items-end gap-1"
                  >
                    <div
                      class={`flex items-center ${
                        item?.max_drawdown === 0
                          ? ""
                          : item?.max_drawdown >= 0
                            ? "text-[#00A878]"
                            : "text-red-500"
                      }`}
                    >
                      <TooltipNumber
                        number={Math.abs(Number(item?.max_drawdown))}
                        type={Math.abs(Number(item?.max_drawdown)) > 999999
                          ? "balance"
                          : "percent"}
                      />%
                      {#if item?.max_drawdown !== 0}
                        <img
                          src={item?.max_drawdown >= 0 ? TrendUp : TrendDown}
                          alt="trend"
                          class="ml-1 mb-1 w-4 h-4"
                        />
                      {/if}
                    </div>
                  </div>
                </div>

                <div class="flex justify-between items-start">
                  <div class="text-right text-sm uppercase font-medium">
                    ROI
                  </div>
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
                    {$t("Creator")}
                  </div>
                  <div
                    class="text-sm text_00000099 font-medium flex justify-end"
                  >
                    <Copy
                      address={item?.owner}
                      textTooltip="Copy address to clipboard"
                      iconColor={$isDarkMode ? "#9ca3af" : "#666666"}
                      color={$isDarkMode ? "text-gray-400" : "text-[#666666]"}
                      isShorten={true}
                    />
                  </div>
                </div>

                <div class="flex justify-between items-center">
                  <div class="text-right text-sm uppercase font-medium mt-1">
                    {$t("Action")}
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
  <Pagination
    isDisabled={$queryVirtualPortfolioDashboard.isFetching}
    {totalPage}
    {pagination}
    {handlePageChange}
  />
</div>

<style></style>
