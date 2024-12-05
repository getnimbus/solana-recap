<script lang="ts">
  import { nimbus } from "~/lib/network";
  import { createQuery } from "@tanstack/svelte-query";
  import {
    typeWallet,
    isDarkMode,
    isHidePortfolio,
    wallet,
    selectedPackage,
    chain,
  } from "~/store";
  import { linkExplorer, listSupported } from "~/lib/chains";
  import { shorterAddress } from "~/utils/index";
  import { isNimbusVersion } from "~/utils/constants";
  import dayjs from "dayjs";
  import { TokenDetailAVGCostDistributionSupported } from "./utils";
  import { t } from "~/lib/i18n";
  import {
    calculatePnL,
    calculateRealizedProfit,
    calculateUnrealizedProfit,
  } from "~/utils/functions";
  import { normalizeSuiAddress } from "@mysten/sui/utils";

  import Pagination from "~/components/Pagination.svelte";
  import Select from "~/components/Select.svelte";
  import Button from "~/components/Button.svelte";
  import Loading from "~/components/Loading.svelte";
  import TooltipTitle from "~/components/TooltipTitle.svelte";
  import ErrorBoundary from "~/components/ErrorBoundary.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import OverviewCard from "~/components/OverviewCard.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import TokenHistoryItem from "./TokenHistoryItem.svelte";
  import PriceChart from "./PriceChart.svelte";
  import BalanceAvgCostChart from "./BalanceAvgCostChart.svelte";
  import HistoryCsvExport from "./HistoryCSVExport.svelte";

  import TrendUp from "~/assets/trend-up.svg";
  import TrendDown from "~/assets/trend-down.svg";

  export let data;
  export let showSideTokenDetail;

  const handleFormatSuiAddress = (address: string) => {
    if (address === "0x2::sui::SUI") {
      return address;
    }

    const regexSymbol = /::(.+)/;
    const matchSymbol = address.match(regexSymbol);

    const resultSymbol = matchSymbol && matchSymbol[0];

    const regexAddress = /^[^:]+/;
    const matchAddress = address.match(regexAddress);

    const resultAddress = matchAddress && matchAddress[0];

    return normalizeSuiAddress(resultAddress || "") + resultSymbol;
  };

  $: birdeyeChartUrl = `https://birdeye.so/tv-widget/${handleFormatSuiAddress(data?.contractAddress)}?chain=sui&viewMode=pair&chartInterval=5&chartType=CANDLE&chartLeftToolbar=show&theme=${$isDarkMode ? "dark" : "light"}`;

  $: totalCost = data?.profit?.cost ? Number(data?.profit?.cost) : 0;

  $: realizedProfit = calculateRealizedProfit(
    Number(data?.avgCost),
    Number(data?.profit?.realizedProfit)
  ).profit;

  $: percentRealizedProfit = calculateRealizedProfit(
    Number(data?.avgCost),
    Number(data?.profit?.realizedProfit)
  ).percent;

  $: pnl = calculatePnL(
    Number(realizedProfit),
    Number(data?.market_price || 0),
    Number(data?.amount || 0),
    Number(data?.profit?.totalBought || 0),
    Number(data?.profit?.totalSold || 0),
    Number(data?.profit?.totalGain || 0),
    Number(data?.profit?.cost || 0)
  );

  $: unrealizedProfit = calculateUnrealizedProfit(
    realizedProfit,
    Number(data?.avgCost),
    Number(pnl)
  ).profit;

  $: percentUnrealizedProfit = calculateUnrealizedProfit(
    realizedProfit,
    Number(data?.avgCost),
    Number(pnl)
  ).percent;

  const handleGetAllTokenTradeHistory = async (address: any) => {
    const response: any = await nimbus.get(
      `/v2/address/${address}/token/${data?.contractAddress}/trade-history?chain=${data?.chain}&isExportCSV=true`
    );
    return response?.data;
  };

  const handleGetTradeHistory = async (address: any, pagination: number) => {
    const response: any = await nimbus.get(
      `/v2/address/${address}/token/${data?.contractAddress}/trade-history?chain=${data?.chain}&page=${pagination - 1}`
    );
    return response?.data;
  };

  let exportCSV = false;
  let isLoading = false;

  let allDataHistory: any = [];
  let dataCSV: any = [];
  let dataHistoryTokenDetail: any = [];
  let sellHistoryTradeList: any = [];
  let buyHistoryTradeList: any = [];
  let buyAmounts = 0;
  let sellAmounts = 0;

  let pagination = 1;
  let totalPage = 0;
  let previousTotalPage = 0;

  $: {
    if (
      allDataHistory &&
      allDataHistory.length !== 0 &&
      $selectedPackage !== "FREE" &&
      exportCSV
    ) {
      handleFormatDataCSV(allDataHistory, data?.contractAddress);
    }
  }

  $: queryAllHistoryTokenDetail = createQuery({
    queryKey: ["all-trade-history", $wallet, showSideTokenDetail, data],
    queryFn: () => handleGetAllTokenTradeHistory($wallet),
    retry: false,
    enabled: Boolean(
      exportCSV &&
        showSideTokenDetail &&
        data !== undefined &&
        Object.keys(data).length !== 0 &&
        $wallet &&
        $wallet?.length !== 0
    ),
  });

  $: queryHistoryTokenDetail = createQuery({
    queryKey: ["trade-history", $wallet, showSideTokenDetail, data, pagination],
    queryFn: () => handleGetTradeHistory($wallet, pagination),
    retry: false,
    enabled: Boolean(
      showSideTokenDetail &&
        data !== undefined &&
        Object.keys(data).length !== 0 &&
        $wallet &&
        $wallet?.length !== 0
    ),
  });

  $: {
    if (
      !$queryAllHistoryTokenDetail?.isFetching &&
      !$queryAllHistoryTokenDetail?.isError &&
      $queryAllHistoryTokenDetail?.data !== undefined
    ) {
      allDataHistory = $queryAllHistoryTokenDetail?.data?.result;
    } else {
      allDataHistory = [];
    }
  }

  $: {
    if ($queryAllHistoryTokenDetail?.data?.result) {
      sellHistoryTradeList = $queryAllHistoryTokenDetail?.data?.result.filter(
        (item: any) =>
          item?.from_token_address?.toLowerCase() ===
          data?.contractAddress?.toLowerCase()
      );
      buyHistoryTradeList = $queryAllHistoryTokenDetail?.data?.result.filter(
        (item: any) =>
          item?.to_token_address?.toLowerCase() ===
          data?.contractAddress?.toLowerCase()
      );
      buyAmounts = (buyHistoryTradeList || []).reduce(
        (prev: any, item: any) => prev + Number(item.quantity_out),
        0
      );
      sellAmounts = (sellHistoryTradeList || []).reduce(
        (prev: any, item: any) => prev + Number(item.quantity_in),
        0
      );
    } else {
      sellHistoryTradeList = [];
      buyHistoryTradeList = [];
      buyAmounts = 0;
      sellAmounts = 0;
    }
  }

  $: {
    if (
      !$queryHistoryTokenDetail?.isError &&
      $queryHistoryTokenDetail?.data !== undefined
    ) {
      dataHistoryTokenDetail = $queryHistoryTokenDetail?.data?.result;
      const newTotalPage = $queryHistoryTokenDetail?.data?.totalPage;
      if (newTotalPage !== previousTotalPage) {
        totalPage = newTotalPage;
        previousTotalPage = newTotalPage;
      }
    } else {
      dataHistoryTokenDetail = [];
      totalPage = 0;
      previousTotalPage = 0;
    }
  }

  $: totalFee =
    $queryAllHistoryTokenDetail?.data?.result?.reduce(
      (total: any, item: any) => total + Number(item?.fee),
      0
    ) || 0;

  $: colspan =
    listSupported.includes($typeWallet) && dataHistoryTokenDetail !== undefined
      ? 6
      : 5;

  const handlePageChange = (page: number) => {
    pagination = page;
  };

  const triggerExportCSV = () => {
    exportCSV = !exportCSV;
  };

  $: {
    if (!showSideTokenDetail) {
      exportCSV = false;
    }
  }

  const handleFormatDataCSV = (dataHistory: any, address: any) => {
    isLoading = true;
    dataCSV = dataHistory?.map((item: any) => {
      return {
        trx_hash: item.transaction_hash,
        trx_link: item.transaction_hash
          ? linkExplorer(item.chain, item.transaction_hash).trx
          : "",
        value: `$${Number(item?.amount_usd)}`,
        time: dayjs(item?.created_at * 1000).format("YYYY-MM-DD HH:mm:ss"),
        fee: `$${Number(item?.fee)}`,
        amount_in: Number(item?.quantity_in),
        token_address_in: item.from_token_address,
        token_in_symbol:
          item?.from_token_address?.toLowerCase() === address?.toLowerCase()
            ? data?.symbol
            : "",
        amount_out: Number(item?.quantity_out),
        token_address_out: item?.to_token_address,
        token_out_symbol:
          item?.to_token_address?.toLowerCase() === address?.toLowerCase()
            ? data?.symbol
            : "",
      };
    });
    isLoading = false;
  };
</script>

<ErrorBoundary>
  {#if showSideTokenDetail}
    {#if ["MOVE", "SUI"].includes($typeWallet) || ($typeWallet === "BUNDLE" && data?.chain === "SUI")}
      <div class="w-full">
        <iframe
          width="100%"
          height="521"
          src={birdeyeChartUrl}
          frameBorder="0"
          allowFullScreen
        ></iframe>
      </div>
    {:else}
      <PriceChart
        contractAddress={data?.contractAddress}
        cgId={data?.cg_id}
        {sellHistoryTradeList}
        {buyHistoryTradeList}
        id={data?.name}
        symbol={data?.symbol}
        avgCost={data?.profit?.averageCost}
        chain={data?.chain}
        price={Number(data?.market_price || 0)}
      />
    {/if}
  {/if}

  <div class="flex flex-col justify-between gap-6">
    <div class="flex-1 flex md:flex-row flex-col justify-between gap-6">
      <OverviewCard title={$t("Avg Cost")}>
        <span slot="number" class="flex items-center">
          <div class="flex justify-end">
            ${#if data?.profit}
              <TooltipNumber
                number={data?.profit?.averageCost}
                type="balance"
                personalValue
              />
            {:else}
              0
            {/if}
          </div>
        </span>
      </OverviewCard>

      <OverviewCard title={$t("Fee paid")}>
        <span slot="number" class="flex items-center">
          <div class="flex justify-end">
            <TooltipNumber number={totalFee} type="balance" personalValue />
          </div>
        </span>
      </OverviewCard>
      <!-- 
      <OverviewCard title={$t("Cost Basis")}>
        <span slot="number" class="flex items-center">
          <div class="flex justify-end">
            ${#if $isHidePortfolio}
              ******
            {:else if totalCost}
              <TooltipNumber number={totalCost} type="balance" personalValue />
            {:else}
              0
            {/if}
          </div>
        </span>
      </OverviewCard> -->
    </div>

    <div class="flex-1 flex md:flex-row flex-col justify-between gap-6">
      <OverviewCard title={$t("Realized PnL")}>
        <span slot="number" class="flex items-center">
          <div
            class={`${
              realizedProfit !== 0
                ? realizedProfit >= 0
                  ? "text-[#00A878]"
                  : "text-red-500"
                : ""
            }`}
          >
            <TooltipNumber
              number={Math.abs(realizedProfit)}
              type="value"
              personalValue
            />
          </div>
        </span>

        <span slot="sub-number">
          <div class="flex items-center gap-1">
            <div
              class={`flex items-center text-lg ${
                realizedProfit !== 0
                  ? realizedProfit >= 0
                    ? "text-[#00A878]"
                    : "text-red-500"
                  : ""
              }`}
            >
              <TooltipNumber
                number={Math.abs(percentRealizedProfit) * 100}
                type="percent"
              />
              <span>%</span>
            </div>
            {#if realizedProfit !== 0}
              <img
                src={realizedProfit >= 0 ? TrendUp : TrendDown}
                alt="trend"
                class="mb-1 block"
              />
            {/if}
          </div>
        </span>
      </OverviewCard>

      <OverviewCard title={$t("Unrealized PnL")}>
        <span slot="number" class="flex items-center">
          <div
            class={`${
              unrealizedProfit !== 0
                ? percentUnrealizedProfit >= 0
                  ? "text-[#00A878]"
                  : "text-red-500"
                : ""
            }`}
          >
            <TooltipNumber
              number={Math.abs(unrealizedProfit)}
              type="value"
              personalValue
            />
          </div>
        </span>

        <span slot="sub-number">
          <div class="flex items-center gap-1">
            <div
              class={`flex items-center text-lg ${
                unrealizedProfit !== 0
                  ? unrealizedProfit >= 0
                    ? "text-[#00A878]"
                    : "text-red-500"
                  : ""
              }`}
            >
              <TooltipNumber
                number={Math.abs(percentUnrealizedProfit) * 100}
                type="percent"
              />
              <span>%</span>
            </div>
            {#if unrealizedProfit !== 0}
              <img
                src={unrealizedProfit >= 0 ? TrendUp : TrendDown}
                alt="trend"
                class="mb-1 block"
              />
            {/if}
          </div>
        </span>
      </OverviewCard>
    </div>

    <!-- <div class="flex-1 flex md:flex-row flex-col justify-between gap-6">
      <OverviewCard title={$t("Total Fee")}>
        <span slot="number" class="flex items-center">
          <div class="flex justify-end">
            ${#if $isHidePortfolio}
              ******
            {:else if totalFee}
              <TooltipNumber number={totalFee} type="balance" personalValue />
            {:else}
              0
            {/if}
          </div>
        </span>
      </OverviewCard>

      <OverviewCard title={$t("30D Trx (Buy/Sell)")}>
        <span slot="number" class="flex items-center">
          {buyHistoryTradeList.length}/{sellHistoryTradeList.length}
        </span>
      </OverviewCard>
    </div> -->
  </div>

  <div class="flex flex-col gap-6">
    {#if TokenDetailAVGCostDistributionSupported.includes($typeWallet) && data && Object.keys(data).length !== 0}
      <BalanceAvgCostChart
        {data}
        id={data?.name}
        avgCost={data?.profit?.averageCost || 0}
      />
    {/if}

    <div
      class={`rounded-[20px] flex flex-col gap-4 py-4 lg:px-3 xl:border border_0000001a ${
        $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
      }`}
    >
      <div class="flex justify-between items-center gap-6">
        {#if sellAmounts > buyAmounts}
          <TooltipTitle
            tooltipText="Unusual trade. Total sell amount > total buy amount"
            type="warning"
          >
            <div class="text-2xl font-medium">{$t("History")}</div>
          </TooltipTitle>
        {:else}
          <div class="text-2xl font-medium">{$t("History")}</div>
        {/if}
        <HistoryCsvExport
          data={dataCSV}
          name={`${shorterAddress($wallet)}_${data?.symbol}_Trades`}
          {triggerExportCSV}
          isLoading={isLoading && $queryAllHistoryTokenDetail?.isFetching}
        />
      </div>

      <div
        class={`rounded-[10px] xl:overflow-visible overflow-x-auto h-full ${
          $isDarkMode ? "bg-[#131313]" : "bg-[#fff] border border_0000000d"
        }`}
      >
        <table class="table-auto xl:w-full w-[1000px] h-full">
          <thead>
            <tr class="bg_f4f5f8">
              <th
                class="pl-3 py-3 rounded-tl-[10px] xl:static xl:bg-transparent sticky left-0 z-10 bg_f4f5f8 w-[100px]"
              >
                <div class="text-left text-sm uppercase font-medium">
                  {$t("Amount")}
                </div>
              </th>

              <th class="py-3">
                <div class="text-right text-sm uppercase font-medium">
                  {$t("Cost/Gain")}
                </div>
              </th>

              <th class="py-3">
                <div class="text-right text-sm uppercase font-medium">
                  {$t("Price")}
                </div>
              </th>

              <th class="py-3">
                <div class="text-right text-sm uppercase font-medium">
                  {$t("Fee")}
                </div>
              </th>

              <th
                class={`py-3 rounded-tr-[10px] ${
                  listSupported.includes($typeWallet) &&
                  dataHistoryTokenDetail !== undefined
                    ? ""
                    : "pr-3"
                }`}
              >
                <div class="text-right text-sm uppercase font-medium">
                  {$t("Time")}
                </div>
              </th>

              {#if listSupported.includes($typeWallet) && dataHistoryTokenDetail !== undefined}
                <th class="py-3 w-10" />
              {/if}
            </tr>
          </thead>
          {#if $queryHistoryTokenDetail.isFetching}
            <tbody>
              <tr>
                <td {colspan}>
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
            <tbody>
              {#if dataHistoryTokenDetail && dataHistoryTokenDetail?.length === 0}
                <tr>
                  <td {colspan}>
                    <div
                      class="flex justify-center items-center h-full py-3 px-3 text-base text-gray-400"
                    >
                      {$t("Empty")}
                    </div>
                  </td>
                </tr>
              {:else}
                {#each dataHistoryTokenDetail as item}
                  <TokenHistoryItem
                    data={item}
                    contractAddress={data?.contractAddress}
                    owner={$typeWallet === "BUNDLE"
                      ? dataHistoryTokenDetail[0].owner
                      : $wallet}
                    chain={$typeWallet === "BUNDLE"
                      ? dataHistoryTokenDetail[0].chain
                      : $chain}
                  />
                {/each}
              {/if}
            </tbody>
          {/if}
        </table>
      </div>

      {#if totalPage > 1}
        <Pagination
          isDisabled={$queryHistoryTokenDetail.isFetching}
          {totalPage}
          {pagination}
          {handlePageChange}
        />
      {/if}
    </div>
  </div>
</ErrorBoundary>

<style>
</style>
