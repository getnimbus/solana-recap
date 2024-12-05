<script lang="ts">
  import { groupBy } from "lodash";
  import { isDarkMode } from "~/store";
  import { shorterName } from "~/utils";
  import dayjs from "dayjs";
  import { isNimbusVersion } from "~/utils/constants";
  import { t } from "~/lib/i18n";

  import Loading from "~/components/Loading.svelte";
  import Table from "~/components/Table.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Image from "~/components/Image.svelte";
  import Tooltip from "~/components/Tooltip.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let isLoading;
  export let listTokenHistoryChanges;

  let formatListTokenHistoryChanges: any = [];
  let selectedItemIndex = -1;
  let isShowTooltipSymbol = false;

  $: {
    if (listTokenHistoryChanges) {
      handleFormatListTokenHistoryChanges(listTokenHistoryChanges);
    }
  }

  const getUniqueArray = (arr1: any, arr2: any) => {
    return arr1.filter(
      (item1: any) => !arr2.some((item2: any) => item1.symbol === item2.symbol),
    );
  };

  const handleCompareVersion = (
    ver: number,
    dataCurrentVer: any,
    dataPrevVer: any,
    dataInitialVersion: any,
  ) => {
    let listDataChanged: any = [];

    const formatAllData = new Set([
      ...dataPrevVer.map((item: any) => item.symbol),
      ...dataCurrentVer.map((item: any) => item.symbol),
    ]);

    formatAllData.forEach((symbol) => {
      const selectedDataPrevVer = dataPrevVer.find(
        (item: any) => item.symbol === symbol,
      );
      const selectedDataCurrentVer = dataCurrentVer.find(
        (item: any) => item.symbol === symbol,
      );

      const selectedDataPrevVerPercent = selectedDataPrevVer
        ? selectedDataPrevVer.percent
        : 0;

      const selectedDataCurrentVerPercent = selectedDataCurrentVer
        ? selectedDataCurrentVer.percent
        : 0;

      listDataChanged.push({
        symbol,
        percent: selectedDataCurrentVerPercent - selectedDataPrevVerPercent,
      });
    });

    const formatListDataChanged = listDataChanged.map((item: any) => {
      const selectedInfoDataFromInitial = dataInitialVersion?.find(
        (eachInfoData: any) =>
          item.symbol.toLowerCase() === eachInfoData.symbol.toLowerCase(),
      );

      const selectedInfoDataFromCurrentVer = dataCurrentVer?.find(
        (eachInfoData: any) =>
          item.symbol.toLowerCase() === eachInfoData.symbol.toLowerCase(),
      );

      return {
        ...item,
        name:
          selectedInfoDataFromInitial?.name ||
          selectedInfoDataFromCurrentVer?.name,
        logo:
          selectedInfoDataFromInitial?.logo ||
          selectedInfoDataFromCurrentVer?.logo,
        price:
          selectedInfoDataFromInitial?.price ||
          selectedInfoDataFromCurrentVer?.logo,
        amount:
          selectedInfoDataFromInitial?.amount ||
          selectedInfoDataFromCurrentVer?.logo,
      };
    });

    const dataAdded = getUniqueArray(formatListDataChanged, dataPrevVer);
    const dataChanged = getUniqueArray(formatListDataChanged, dataAdded);

    return {
      version: ver,
      listDataChanged: formatListDataChanged,
      dataAdded,
      dataChanged,
    };
  };

  const handleFormatListTokenHistoryChanges = (data: any) => {
    const groupByChangesVersion = groupBy(data, "version");
    formatListTokenHistoryChanges = Object.keys(groupByChangesVersion)
      .map((ver) => {
        return {
          rebalanceTime: groupByChangesVersion[ver][0].startedAt,
          data: groupByChangesVersion[ver],
          version: ver,
          compare: handleCompareVersion(
            Number(ver),
            groupByChangesVersion[ver],
            groupByChangesVersion[Number(ver) - 1] || [],
            groupByChangesVersion[0],
          ),
        };
      })
      .sort((a, b) => Number(b?.version) - Number(a?.version));
  };
</script>

<div
  class={`rounded-[20px] xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
    $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
  }`}
>
  <div class="flex flex-col gap-2">
    <div class="flex xl:flex-row flex-col gap-2 justify-between">
      <div class="flex items-end gap-3">
        <div class="text-2xl font-medium">{$t("Changes History")}</div>
      </div>
    </div>

    <Table>
      <span slot="desktop">
        <table class="table-auto w-full h-full">
          <thead>
            <tr class="bg_f4f5f8">
              <th class="pl-3 py-3 rounded-tl-[10px]">
                <div class="text-left text-xs uppercase font-medium">
                  {$t("Updated At")}
                </div>
              </th>

              <th class="py-3">
                <div class="text-left text-xs uppercase font-medium">
                  {$t("Action")}
                </div>
              </th>

              <th class="py-3">
                <div class="text-right text-xs uppercase font-medium">
                  {$t("Allocation")}
                </div>
              </th>

              <th class="py-3">
                <div class="text-right text-xs uppercase font-medium">
                  {$t("Allocation Change")}
                </div>
              </th>

              <th class="py-3">
                <div class="text-right text-xs uppercase font-medium">
                  {$t("Price")}
                </div>
              </th>

              <th class="py-3">
                <div class="text-right text-xs uppercase font-medium">
                  {$t("Amount")}
                </div>
              </th>

              <th class="pr-3 py-3 rounded-tr-[10px]">
                <div class="text-right text-xs uppercase font-medium">
                  {$t("Value")}
                </div>
              </th>
            </tr>
          </thead>

          {#if isLoading}
            <tbody>
              <tr>
                <td colspan="7">
                  <div
                    class="flex justify-center items-center h-full py-3 px-3"
                  >
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
            <tbody class="relative">
              {#if formatListTokenHistoryChanges && formatListTokenHistoryChanges?.length === 0}
                <tr>
                  <td colspan="7">
                    <div
                      class="flex justify-center items-center h-full py-4 px-3 text-lg text-gray-400"
                    >
                      {$t("Empty")}
                    </div>
                  </td>
                </tr>
              {:else}
                {#each formatListTokenHistoryChanges as item, index}
                  <tr
                    class={`group transition-all border-b-[0.5px] border_0000000d last:border-none ${
                      $isDarkMode ? "text-gray-400" : "text-[#666666]"
                    }`}
                  >
                    <td
                      class={`pl-3 py-3 ${
                        $isDarkMode
                          ? "group-hover:bg-[#000]"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      <div class="font-medium text-sm text_00000099">
                        {dayjs(item.rebalanceTime).format("YYYY-MM-DD")}
                      </div>
                    </td>

                    <td
                      class={`py-3 ${
                        $isDarkMode
                          ? "group-hover:bg-[#000]"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      {#if Number(item.version) === 0}
                        <div class="font-medium text-sm text_00000099">
                          {$t("Create new paper trade")}
                        </div>
                      {:else}
                        <div class="flex flex-col gap-1">
                          <div class="font-medium text-sm text_00000099">
                            {$t("Add")}
                            {item.compare.dataAdded.length}
                            {item.compare.dataAdded.length > 1
                              ? "tokens"
                              : "token"}
                          </div>
                          <div class="font-medium text-sm text_00000099">
                            {$t("Change")}
                            {item.compare.dataChanged.filter(
                              (item) => item.percent !== 0,
                            ).length}
                            {item.compare.dataChanged.filter(
                              (item) => item.percent !== 0,
                            ).length > 1
                              ? "tokens"
                              : "token"}
                          </div>
                          {#if item.compare.dataChanged.filter((item) => item.percent === 0)?.length > 0}
                            <div class="font-medium text-sm text_00000099">
                              {$t("Keep")}
                              {item.compare.dataChanged.filter(
                                (item) => item.percent === 0,
                              ).length}
                              {item.compare.dataChanged.filter(
                                (item) => item.percent === 0,
                              ).length > 1
                                ? "tokens"
                                : "token"}
                            </div>
                          {/if}
                        </div>
                      {/if}
                    </td>

                    <td
                      class={`py-3 ${
                        $isDarkMode
                          ? "group-hover:bg-[#000]"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      <div class="flex flex-col gap-2">
                        {#each item.data as token}
                          <div
                            class="relative flex items-center justify-end gap-3"
                          >
                            <div
                              class="relative flex items-center justify-start gap-2"
                            >
                              <div
                                class="rounded-full w-[24px] h-[24px] overflow-hidden"
                              >
                                <Image
                                  logo={token.logo}
                                  defaultLogo={defaultToken}
                                />
                              </div>
                              <div class="flex items-center gap-2">
                                <div
                                  class="relative font-medium text_00000099 text-sm"
                                  on:mouseover={() => {
                                    if (index > 0) {
                                      selectedItemIndex = index;
                                      isShowTooltipSymbol = true;
                                    }
                                  }}
                                  on:mouseleave={() => {
                                    if (index > 0) {
                                      selectedItemIndex = -1;
                                      isShowTooltipSymbol = false;
                                    }
                                  }}
                                >
                                  {#if token.symbol === undefined}
                                    N/A
                                  {:else}
                                    {shorterName(token.symbol, 12)}
                                  {/if}
                                  {#if isShowTooltipSymbol && selectedItemIndex === index && token.symbol.length > 12}
                                    <div
                                      class="absolute left-0 -top-8"
                                      style="z-index: 2147483648;"
                                    >
                                      <Tooltip text={token.symbol} />
                                    </div>
                                  {/if}
                                </div>

                                {#if token?.positionType === "ERC_404"}
                                  <span
                                    class="inline-flex items-center gap-x-1.5 rounded-full bg-yellow-100 px-1 py-0.5 text-[10px] font-medium text-yellow-800"
                                  >
                                    <svg
                                      class="h-1.5 w-1.5 fill-yellow-500"
                                      viewBox="0 0 6 6"
                                      aria-hidden="true"
                                    >
                                      <circle cx={3} cy={3} r={3} />
                                    </svg>
                                    ERC 404
                                  </span>
                                {/if}
                              </div>
                            </div>
                            <div
                              class="flex justify-end items-center text-sm font-medium text_00000099"
                            >
                              <TooltipNumber
                                number={Math.abs(token.percent)}
                                type={Math.abs(token.percent) > 999999
                                  ? "balance"
                                  : "percent"}
                              />
                              <span>%</span>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </td>

                    <td
                      class={`py-3 ${
                        $isDarkMode
                          ? "group-hover:bg-[#000]"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      <div class="flex flex-col gap-2">
                        {#each item.compare.listDataChanged as token}
                          <div
                            class="relative flex items-center justify-end gap-3"
                          >
                            <div
                              class="relative flex items-center justify-start gap-2"
                            >
                              <div
                                class="rounded-full w-[24px] h-[24px] overflow-hidden"
                              >
                                <Image
                                  logo={token.logo}
                                  defaultLogo={defaultToken}
                                />
                              </div>
                              <div class="flex items-center gap-2">
                                <div
                                  class="relative font-medium text_00000099 text-sm"
                                  on:mouseover={() => {
                                    if (index > 0) {
                                      selectedItemIndex = index;
                                      isShowTooltipSymbol = true;
                                    }
                                  }}
                                  on:mouseleave={() => {
                                    if (index > 0) {
                                      selectedItemIndex = -1;
                                      isShowTooltipSymbol = false;
                                    }
                                  }}
                                >
                                  {#if token.symbol === undefined}
                                    N/A
                                  {:else}
                                    {shorterName(token.symbol, 12)}
                                  {/if}
                                  {#if isShowTooltipSymbol && selectedItemIndex === index && token.symbol.length > 12}
                                    <div
                                      class="absolute left-0 -top-8"
                                      style="z-index: 2147483648;"
                                    >
                                      <Tooltip text={token.symbol} />
                                    </div>
                                  {/if}
                                </div>

                                {#if token?.positionType === "ERC_404"}
                                  <span
                                    class="inline-flex items-center gap-x-1.5 rounded-full bg-yellow-100 px-1 py-0.5 text-[10px] font-medium text-yellow-800"
                                  >
                                    <svg
                                      class="h-1.5 w-1.5 fill-yellow-500"
                                      viewBox="0 0 6 6"
                                      aria-hidden="true"
                                    >
                                      <circle cx={3} cy={3} r={3} />
                                    </svg>
                                    ERC 404
                                  </span>
                                {/if}
                              </div>
                            </div>
                            <div
                              class={`flex justify-end items-center text-sm font-medium ${
                                token.percent !== 0
                                  ? token.percent >= 0
                                    ? "text-[#00A878]"
                                    : "text-red-500"
                                  : "text_00000099"
                              }`}
                            >
                              <TooltipNumber
                                number={Math.abs(token.percent)}
                                type={Math.abs(token.percent) > 999999
                                  ? "balance"
                                  : "percent"}
                              />
                              <span>%</span>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </td>

                    <td
                      class={`py-3 ${
                        $isDarkMode
                          ? "group-hover:bg-[#000]"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      <div class="flex flex-col items-end gap-2">
                        {#each item.data as token}
                          <div
                            class="relative flex items-center justify-start gap-3"
                          >
                            <div class="w-[24px] h-[24px]"></div>
                            <div
                              class="font-medium flex justify-end text-sm text_00000099"
                            >
                              $<TooltipNumber
                                number={token?.price}
                                type="balance"
                              />
                            </div>
                          </div>
                        {/each}
                      </div>
                    </td>

                    <td
                      class={`py-3 ${
                        $isDarkMode
                          ? "group-hover:bg-[#000]"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      <div class="flex flex-col items-end gap-2">
                        {#each item.data as token}
                          <div
                            class="relative flex items-center justify-start gap-3"
                          >
                            <div class="w-[24px] h-[24px]"></div>
                            <div
                              class="font-medium flex justify-end text-sm text_00000099"
                            >
                              <TooltipNumber
                                number={token?.amount || 0}
                                type="amount"
                              />
                            </div>
                          </div>
                        {/each}
                      </div>
                    </td>

                    <td
                      class={`py-3 pr-3 ${
                        $isDarkMode
                          ? "group-hover:bg-[#000]"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      <div class="flex flex-col items-end gap-2">
                        {#each item.data as token}
                          <div
                            class="relative flex items-center justify-start gap-3"
                          >
                            <div class="w-[24px] h-[24px]"></div>
                            <div
                              class="font-medium flex justify-end text-sm text_00000099"
                            >
                              <TooltipNumber
                                number={token?.value}
                                type="value"
                              />
                            </div>
                          </div>
                        {/each}
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
          <div>
            {#if formatListTokenHistoryChanges && formatListTokenHistoryChanges?.length === 0}
              <div
                class="flex justify-center items-center h-full py-3 px-3 text-base text-gray-400"
              >
                {$t("Empty")}
              </div>
            {:else}
              <div class="relative w-full">
                {#each formatListTokenHistoryChanges as item, index}
                  <div
                    class="flex flex-col gap-6 border-b-[1px] border_0000000d last:border-none py-4"
                  >
                    <div class="flex justify-between items-start">
                      <div class="text-right text-sm uppercase font-medium">
                        {$t("Updated At")}
                      </div>
                      <div
                        class="text-sm text_00000099 font-medium flex justify-end"
                      >
                        {dayjs(item.rebalanceTime).format("YYYY-MM-DD")}
                      </div>
                    </div>

                    <div class="flex justify-between items-start">
                      <div class="text-right text-sm uppercase font-medium">
                        {$t("Action")}
                      </div>
                      <div class="flex justify-end">
                        {#if Number(item.version) === 0}
                          <div class="font-medium text-sm text_00000099">
                            Create new paper trade
                          </div>
                        {:else}
                          <div class="flex flex-col items-end gap-1">
                            <div class="font-medium text-sm text_00000099">
                              {$t("Add")}
                              {item.compare.dataAdded.length}
                              {item.compare.dataAdded.length > 1
                                ? "tokens"
                                : "token"}
                            </div>
                            <div class="font-medium text-sm text_00000099">
                              {$t("Change")}
                              {item.compare.dataChanged.filter(
                                (item) => item.percent !== 0,
                              ).length}
                              {item.compare.dataChanged.filter(
                                (item) => item.percent !== 0,
                              ).length > 1
                                ? "tokens"
                                : "token"}
                            </div>
                            {#if item.compare.dataChanged.filter((item) => item.percent === 0)?.length > 0}
                              <div class="font-medium text-sm text_00000099">
                                {$t("Keep")}
                                {item.compare.dataChanged.filter(
                                  (item) => item.percent === 0,
                                ).length}
                                {item.compare.dataChanged.filter(
                                  (item) => item.percent === 0,
                                ).length > 1
                                  ? "tokens"
                                  : "token"}
                              </div>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    </div>

                    <div class="flex justify-between items-start">
                      <div class="text-right text-sm uppercase font-medium">
                        {$t("Allocation")}
                      </div>
                      <div class="flex flex-col gap-2">
                        {#each item.data as token}
                          <div
                            class="relative flex items-center justify-end gap-3"
                          >
                            <div
                              class="relative flex items-center justify-start gap-2"
                            >
                              <div
                                class="rounded-full w-[24px] h-[24px] overflow-hidden"
                              >
                                <Image
                                  logo={token.logo}
                                  defaultLogo={defaultToken}
                                />
                              </div>
                              <div class="flex items-center gap-2">
                                <div
                                  class="relative font-medium text_00000099 text-sm"
                                  on:mouseover={() => {
                                    if (index > 0) {
                                      selectedItemIndex = index;
                                      isShowTooltipSymbol = true;
                                    }
                                  }}
                                  on:mouseleave={() => {
                                    if (index > 0) {
                                      selectedItemIndex = -1;
                                      isShowTooltipSymbol = false;
                                    }
                                  }}
                                >
                                  {#if token.symbol === undefined}
                                    N/A
                                  {:else}
                                    {shorterName(token.symbol, 12)}
                                  {/if}
                                  {#if isShowTooltipSymbol && selectedItemIndex === index && token.symbol.length > 12}
                                    <div
                                      class="absolute left-0 -top-8"
                                      style="z-index: 2147483648;"
                                    >
                                      <Tooltip text={token.symbol} />
                                    </div>
                                  {/if}
                                </div>

                                {#if token?.positionType === "ERC_404"}
                                  <span
                                    class="inline-flex items-center gap-x-1.5 rounded-full bg-yellow-100 px-1 py-0.5 text-[10px] font-medium text-yellow-800"
                                  >
                                    <svg
                                      class="h-1.5 w-1.5 fill-yellow-500"
                                      viewBox="0 0 6 6"
                                      aria-hidden="true"
                                    >
                                      <circle cx={3} cy={3} r={3} />
                                    </svg>
                                    ERC 404
                                  </span>
                                {/if}
                              </div>
                            </div>
                            <div
                              class="flex justify-end items-center text-sm font-medium text_00000099"
                            >
                              <TooltipNumber
                                number={Math.abs(token.percent)}
                                type={Math.abs(token.percent) > 999999
                                  ? "balance"
                                  : "percent"}
                              />
                              <span>%</span>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>

                    <div class="flex justify-between items-start">
                      <div
                        class="md:hidden block text-left text-sm uppercase font-medium"
                      >
                        {$t("Allocation")} <br />
                      </div>
                      <div
                        class="md:block hidden text-right text-sm uppercase font-medium"
                      >
                        {$t("Allocation Change")}
                      </div>
                      <div class="flex flex-col gap-2">
                        {#if item.compare.listDataChanged && item.compare.listDataChanged.length === 0}
                          <div class="font-medium text-sm text_00000099">-</div>
                        {:else}
                          {#each item.compare.listDataChanged as token}
                            <div
                              class="relative flex items-center justify-end gap-3"
                            >
                              <div
                                class="relative flex items-center justify-start gap-2"
                              >
                                <div
                                  class="rounded-full w-[24px] h-[24px] overflow-hidden"
                                >
                                  <Image
                                    logo={token.logo}
                                    defaultLogo={defaultToken}
                                  />
                                </div>
                                <div class="flex items-center gap-2">
                                  <div
                                    class="relative font-medium text_00000099 text-sm"
                                    on:mouseover={() => {
                                      if (index > 0) {
                                        selectedItemIndex = index;
                                        isShowTooltipSymbol = true;
                                      }
                                    }}
                                    on:mouseleave={() => {
                                      if (index > 0) {
                                        selectedItemIndex = -1;
                                        isShowTooltipSymbol = false;
                                      }
                                    }}
                                  >
                                    {#if token.symbol === undefined}
                                      N/A
                                    {:else}
                                      {shorterName(token.symbol, 12)}
                                    {/if}
                                    {#if isShowTooltipSymbol && selectedItemIndex === index && token.symbol.length > 12}
                                      <div
                                        class="absolute left-0 -top-8"
                                        style="z-index: 2147483648;"
                                      >
                                        <Tooltip text={token.symbol} />
                                      </div>
                                    {/if}
                                  </div>

                                  {#if token?.positionType === "ERC_404"}
                                    <span
                                      class="inline-flex items-center gap-x-1.5 rounded-full bg-yellow-100 px-1 py-0.5 text-[10px] font-medium text-yellow-800"
                                    >
                                      <svg
                                        class="h-1.5 w-1.5 fill-yellow-500"
                                        viewBox="0 0 6 6"
                                        aria-hidden="true"
                                      >
                                        <circle cx={3} cy={3} r={3} />
                                      </svg>
                                      ERC 404
                                    </span>
                                  {/if}
                                </div>
                              </div>
                              <div
                                class={`flex justify-end items-center text-sm font-medium ${
                                  token.percent !== 0
                                    ? token.percent >= 0
                                      ? "text-[#00A878]"
                                      : "text-red-500"
                                    : "text_00000099"
                                }`}
                              >
                                <TooltipNumber
                                  number={Math.abs(token.percent)}
                                  type={Math.abs(token.percent) > 999999
                                    ? "balance"
                                    : "percent"}
                                />
                                <span>%</span>
                              </div>
                            </div>
                          {/each}
                        {/if}
                      </div>
                    </div>

                    <div class="flex justify-between items-start">
                      <div class="text-right text-sm uppercase font-medium">
                        {$t("Price")}
                      </div>
                      <div class="flex flex-col items-end gap-2">
                        {#each item.data as token}
                          <div
                            class="relative flex items-center justify-start gap-3"
                          >
                            <div class="w-[24px] h-[24px]"></div>
                            <div class="font-medium text-sm text_00000099 flex">
                              $<TooltipNumber
                                number={token?.price}
                                type="balance"
                              />
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>

                    <div class="flex justify-between items-start">
                      <div class="text-right text-sm uppercase font-medium">
                        {$t("Amount")}
                      </div>
                      <div class="flex flex-col items-end gap-2">
                        {#each item.data as token}
                          <div
                            class="relative flex items-center justify-start gap-3"
                          >
                            <div class="w-[24px] h-[24px]"></div>
                            <div class="font-medium text-sm text_00000099">
                              <TooltipNumber
                                number={token?.amount || 0}
                                type="amount"
                              />
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>

                    <div class="flex justify-between items-start">
                      <div class="text-right text-sm uppercase font-medium">
                        {$t("Value")}
                      </div>
                      <div class="flex flex-col items-end gap-2">
                        {#each item.data as token}
                          <div
                            class="relative flex items-center justify-start gap-3"
                          >
                            <div class="w-[24px] h-[24px]"></div>
                            <div class="font-medium text-sm text_00000099">
                              <TooltipNumber
                                number={token?.value}
                                type="value"
                              />
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </span>
    </Table>
  </div>
</div>

<style windi:preflights:global windi:safelist:global></style>
