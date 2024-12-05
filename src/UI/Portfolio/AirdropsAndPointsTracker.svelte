<script lang="ts">
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { nimbus } from "~/lib/network";
  import {
    isDarkMode,
    wallet,
    totalAirdrops,
    userPublicAddress,
    typeWallet,
  } from "~/store";
  import { triggerFirework } from "~/utils/functions";
  import {
    handleGetDataDailyCheckin,
    handleValidateAddress,
    getAirdrops,
    getPoints,
  } from "~/lib/queryAPI";
  import { filterTokenValueType, isNimbusVersion } from "~/utils/constants";
  import { t } from "~/lib/i18n";

  import Select from "~/components/Select.svelte";
  import Table from "~/components/Table.svelte";
  import TooltipTitle from "~/components/TooltipTitle.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import ErrorBoundary from "~/components/ErrorBoundary.svelte";
  import Image from "~/components/Image.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Button from "~/components/Button.svelte";
  import Loading from "~/components/Loading.svelte";

  import defaultToken from "~/assets/defaultToken.png";
  import Diamond from "~/assets/Diamond.png";
  import evaa from "~/assets/evaa.png";

  const queryClient = useQueryClient();

  const protocolInfo: any = {
    GMPoints: {
      name: "GMPoints",
      logo: Diamond,
    },
    Switchboard: {
      name: "Switchboard",
      website: "https://switchboard.xyz",
      twitter: "https://twitter.com/switchboardxyz",
      logo: "https://pbs.twimg.com/profile_images/1782814868900311040/vhi2oim4_400x400.jpg",
    },
    Symmetry: {
      name: "Symmetry",
      website: "https://www.symmetry.fi/",
      twitter: "https://twitter.com/symmetry_fi",
      logo: "https://avatars.githubusercontent.com/u/84089824?s=200&v=4",
    },
    Drift: {
      name: "Drift",
      website: "https://app.drift.trade/points",
      twitter: "https://twitter.com/DriftProtocol",
      logo: "https://pbs.twimg.com/profile_images/1854451810117013504/U4jSUuag_400x400.png",
    },
    Kamino: {
      name: "Kamino",
      website: "https://app.kamino.finance",
      twitter: "https://x.com/kaminofinance",
      logo: "https://pbs.twimg.com/profile_images/1739993119150505984/tP0Lcgwp_400x400.jpg",
    },
    Parcl: {
      name: "Parcl",
      website: "https://www.parcl.co/",
      twitter: "https://twitter.com/Parcl",
      logo: "https://airdrops.io/wp-content/uploads/2024/01/Parcl-logo.jpg",
    },
    "Sharky.fi": {
      name: "Sharky",
      website: "https://sharky.fi/",
      twitter: "https://twitter.com/SharkyFi",
      logo: "https://sharky.fi/sharky.svg",
    },
    Sanctum: {
      name: "Sanctum",
      website: "https://www.sanctum.so/",
      twitter: "https://twitter.com/sanctumso",
      logo: "https://image.typedream.com/cdn-cgi/image/width=256,format=auto,fit=scale-down,quality=100/https://api.typedream.com/v0/document/public/1e17facc-56e9-4158-9522-8cfee85931a9/2eijF98kDTQfQ2udXN7dGWGRb4E_Sanctum_logo.png",
    },
    Storm: {
      name: "Storm Trade",
      website: "https://storm.tg/",
      twitter: "https://x.com/storm_trade_ton",
      logo: "https://pbs.twimg.com/profile_images/1671844745247612930/-5ITkQDD_400x400.jpg",
    },
    SPAM: {
      name: "SPAM",
      website: "https://spamsui.com/",
      logo: "https://spamsui.com/img/spam-logo.webp",
    },
    FlowX: {
      name: "FlowX",
      website: "https://flowx.finance/",
      logo: "https://strapi-dev.scand.app/uploads/photo_2023_10_23_09_56_50_7d2b8e58b3.jpg",
    },
    Suilend: {
      name: "Suilend",
      website: "https://www.suilend.fi/",
      logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAA1VBMVEUCChkBCRYABhIAAAAAABwAADkzWapvk+WPsv+cvv+Qtv96pP9Rf+UbSaoADjgAAA4+ZsGiwv/J3f/Y5f/b5//F2P+xzP9Ri/8WTsIACUfh6//l7v/o8P9flP8lcP8hZfbe6f/r8v/t8/81YMAAKXEFFTTw9f9sj9sAACZQcbry9/9Ye8jj7f89Y7dWfdMAGVJJZ6UAGVxPeNSAnuIeQo5ZdrVsl/c/W5kONHq91f8AADQAABYsSYUYPId0k9iQr/JkiuEAIl4DIlM+X6kkTqgfXuUAFUYAxKikAAABfUlEQVR4AY2SBY5rMQxFX3LL3DgPU0jy+8tMwwz7X9JMUUVpLLSO2df5uzF2BXAAsRgAfp6DeCKZSmeyuXwBJ/nFYqksSJJwvYwfOEcUYZYiVVGRFF6mWqvjMC/M6IqxtqLIzfxr/D+ciyGlK7bZtCYSrTbAD6uiQ5Vmt9u1FeqBOzicmBe8vu2uYJQEY2gMhoMRdoljMt2VGXdSZJh6gkQ5saWYRevEZmUGByVX91VfevMNRXpXdQFeSMuKtUbRcg1ZrLyBhm6A2zv16zSNTt/zFXzIaNNczSrmwKMw6yp9L1xPjCWp1QW0N+IY603/vvfA1vDJk32ltBjCwbNqbvq/7MZNlAXR3WuM87i33Uou9pu+DV6H89Vxhtuq6u69uL88ADgMH6JiV8zIFo6+zYGeq41t/rIoXeAHDHz0mb2jfsWu5i6/4ZB91fyUJ2SkKpU+ZRpHRXks8DOeK0hK8qb3ONXedz6XSpfT2cEE/JI0i/H4A47R4cScOX+1H/ovLHjBsaBsAAAAAElFTkSuQmCC",
    },
    SOL: {
      name: "solana",
      website: "https://solana.com",
      logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
    },
    ZETA: {
      name: "Zeta",
      website: "https://dex.zeta.markets/",
      logo: "https://moralis.io/wp-content/uploads/web3wiki/343-zeta-markets/637add4d81763793ad1c4e30_cPTtgWTpPraW-GTW3WbScNVkRHoBUwe2v4XPTsYY3FA.jpeg",
    },
    DegenSeason1: {
      name: "Degen Season 1",
      website: "https://www.degen.tips/",
      logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/30096.png",
    },
    DegenSeason2: {
      name: "Degen Season 2",
      website: "https://www.degen.tips/",
      logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/30096.png",
    },
    DegenSeason3: {
      name: "Degen Season 3",
      website: "https://www.degen.tips/",
      logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/30096.png",
    },
    UPROCK: {
      name: "UPROCK",
      website: "https://uprock.com/",
      twitter: "https://x.com/uprockcom",
      logo: "https://depinhub.io/_next/image?url=https%3A%2F%2Fimgs.hotspotty.net%2Fprojects%2Fuprock.png&w=256&q=75",
    },
    Evaa: {
      name: "EVAA",
      website: "https://app.evaa.finance/",
      twitter: "https://x.com/evaaprotocol",
      logo: evaa,
    },
  };

  const triggerBonusScore = async () => {
    openScreenBonusScore = true;
    triggerFirework();
  };

  let eligibilityData: any = [];
  let eligibilityDataWithoutPrice: any = [];
  let filteredEligibilityData: any = [];
  let pointsData: any = [];
  let marketPointsData: any = [];
  let totalEstimateValueEligibilities = 0;
  let totalEstimateValuePoints = 0;
  let totalListingValue = 0;

  let openScreenBonusScore = false;
  let bonusScore = 0;

  let filterTokenType = {
    label: "$1",
    value: 1,
  };

  $: queryValidate = createQuery({
    queryKey: ["validate", $wallet],
    queryFn: () => handleValidateAddress($wallet),
    retry: false,
    enabled: Boolean($wallet && $wallet?.length !== 0),
  });

  $: queryDailyCheckin = createQuery({
    queryKey: [$userPublicAddress, "daily-checkin"],
    queryFn: () => handleGetDataDailyCheckin(),
    enabled: Boolean($userPublicAddress && $userPublicAddress?.length !== 0),
  });

  $: queryAirdrops = createQuery({
    queryKey: ["airdrops", $wallet],
    queryFn: () => getAirdrops($wallet),
    enabled: Boolean(!$queryValidate.isFetching && !$queryValidate.isError),
  });

  $: queryPoints = createQuery({
    queryKey: ["points", $wallet],
    queryFn: () => getPoints($wallet),
    enabled: Boolean(!$queryValidate.isFetching && !$queryValidate.isError),
  });

  $: {
    if (
      !$queryPoints.isError &&
      $queryPoints.data !== undefined &&
      $queryPoints.data?.length !== 0
    ) {
      handleFormatDataPoints($queryPoints?.data);
    }
  }

  $: {
    if (
      !$queryAirdrops.isError &&
      $queryAirdrops.data !== undefined &&
      $queryAirdrops.data?.length !== 0 &&
      !$queryDailyCheckin.isError &&
      $queryDailyCheckin.data !== undefined
    ) {
      handleFormatDataAirdrops(
        $queryAirdrops?.data,
        $queryDailyCheckin?.data?.checkinLogs,
      );
    }
  }

  const handleFormatDataAirdrops = (
    dataAirdrops: any,
    dataCheckinLogs: any,
  ) => {
    eligibilityData = dataAirdrops
      ?.map((item: any) => {
        return {
          ...item,
          value: Number(item?.amount || 0) * Number(item?.tokenPrice),
        };
      })
      ?.sort((a: any, b: any) => {
        if (a.value < b.value) {
          return 1;
        }
        if (a.value > b.value) {
          return -1;
        }
        return 0;
      });

    eligibilityDataWithoutPrice = eligibilityData.filter(
      (item: any) => item.value === 0 && Number(item.tokenPrice) === 0,
    );

    const findQuestZkCompleted = dataCheckinLogs.find(
      (item: any) => item.questId === "user-not-eligibility-zk",
    );

    const findQuestLayerZeroCompleted = dataCheckinLogs.find(
      (item: any) => item.questId === "user-not-eligibility-layerzero",
    );

    const eligibilityZk =
      eligibilityData.filter((item: any) => item.eligible) &&
      eligibilityData
        ?.filter((item: any) => item.eligible)
        ?.find((item: any) => item.token === "ZK");

    if (
      !eligibilityZk &&
      $typeWallet === "EVM" &&
      $wallet.toString().toLowerCase() ===
        $userPublicAddress.toString().toLowerCase() &&
      !findQuestZkCompleted
    ) {
      bonusScore = 10;
      triggerBonusScore();
    }

    const eligibilityLayerZero =
      eligibilityData.filter((item: any) => item.eligible) &&
      eligibilityData
        ?.filter((item: any) => item.eligible)
        ?.find((item: any) => item.token === "ZRO");

    if (
      !eligibilityLayerZero &&
      $typeWallet === "EVM" &&
      $wallet.toString().toLowerCase() ===
        $userPublicAddress.toString().toLowerCase() &&
      !findQuestLayerZeroCompleted
    ) {
      bonusScore = 10;
      triggerBonusScore();
    }

    totalEstimateValueEligibilities = eligibilityData.reduce(
      (prev, item) => prev + Number(item?.value),
      0,
    );
  };

  const handleFormatDataPoints = (data: any) => {
    const dataPoints = data?.data?.map((point: any) => {
      const pointIndex = (data?.dataWhalesMarket || [])
        ?.map((datawhale: any) =>
          datawhale?.name === "Sharky"
            ? "Sharky.fi"
            : (datawhale?.name === "Drift Protocol" && "Drift") ||
              datawhale?.name,
        )
        .indexOf(point.protocolLabel);

      return {
        ...point,
        price: data?.dataWhalesMarket[pointIndex]?.last_price || null,
      };
    });

    const formatPointsData = [
      {
        points: data?.totalPoint,
        protocol: "gmpoints",
        protocolLabel: "GMPoints",
        price: null,
      },
    ]?.concat(dataPoints);

    pointsData = (isNimbusVersion ? formatPointsData : dataPoints)
      ?.map((item: any) => {
        return {
          ...item,
          value: Number(item?.points) * Number(item?.price),
        };
      })
      ?.sort((a: any, b: any) => {
        if (a.value < b.value) {
          return 1;
        }
        if (a.value > b.value) {
          return -1;
        }
        return 0;
      });

    marketPointsData = data?.pointMarketList
      ?.map((item: any) => {
        return {
          ...item,
          listing_value: Number(item?.value) * Number(item?.ex_token?.price),
        };
      })
      ?.sort((a: any, b: any) => {
        if (a.listing_value < b.listing_value) {
          return 1;
        }
        if (a.listing_value > b.listing_value) {
          return -1;
        }
        return 0;
      });

    totalListingValue =
      marketPointsData &&
      marketPointsData?.reduce(
        (prev: any, item: any) => prev + Number(item?.listing_value),
        0,
      );

    totalEstimateValuePoints = pointsData.reduce(
      (prev: any, item: any) => prev + Number(item?.value),
      0,
    );

    totalAirdrops.update(
      (n) =>
        (n =
          totalEstimateValueEligibilities +
          totalEstimateValuePoints +
          totalListingValue),
    );
  };

  $: {
    if (
      eligibilityDataWithoutPrice &&
      eligibilityDataWithoutPrice.length !== 0
    ) {
      pointsData = pointsData
        ?.map((item: any) => {
          const selectedProtocolWithoutPrice = eligibilityDataWithoutPrice.find(
            (eachEligibility: any) =>
              eachEligibility.protocol === item.protocol,
          );

          const selectedProtocol = eligibilityData.find(
            (eachEligibility: any) =>
              eachEligibility.protocol === item.protocol,
          );

          return {
            ...item,
            selectedProtocol: selectedProtocolWithoutPrice || selectedProtocol,
          };
        })
        ?.filter((item: any) => !item.selectedProtocol);
    }
  }

  $: {
    if (
      totalEstimateValueEligibilities ||
      totalEstimateValuePoints ||
      totalListingValue
    ) {
      totalAirdrops.update(
        (n) =>
          (n =
            totalEstimateValueEligibilities +
            totalEstimateValuePoints +
            totalListingValue),
      );
    }
  }

  const handleClaimBonus = () => {
    const findQuestZkCompleted = $queryDailyCheckin?.data?.checkinLogs.find(
      (item: any) => item.questId === "user-not-eligibility-zk",
    );

    const findQuestLayerZeroCompleted =
      $queryDailyCheckin?.data?.checkinLogs.find(
        (item: any) => item.questId === "user-not-eligibility-layerzero",
      );

    const eligibilityZk =
      eligibilityData.filter((item: any) => item.eligible) &&
      eligibilityData
        ?.filter((item: any) => item.eligible)
        ?.find((item: any) => item.token === "zkSync");

    if (
      !eligibilityZk &&
      $typeWallet === "EVM" &&
      $wallet.toString().toLowerCase() ===
        $userPublicAddress.toString().toLowerCase() &&
      !findQuestZkCompleted
    ) {
      handleReceiveQuest("user-not-eligibility-zk");
    }

    const eligibilityLayerZero =
      eligibilityData.filter((item: any) => item.eligible) &&
      eligibilityData
        ?.filter((item: any) => item.eligible)
        ?.find((item: any) => item.token === "ZRO");

    if (
      !eligibilityLayerZero &&
      $typeWallet === "EVM" &&
      $wallet.toString().toLowerCase() ===
        $userPublicAddress.toString().toLowerCase() &&
      !findQuestLayerZeroCompleted
    ) {
      handleReceiveQuest("user-not-eligibility-layerzero");
    }
  };

  const handleReceiveQuest = async (type: string) => {
    try {
      const res: any = await nimbus.post(`/v2/checkin/quest/${type}`, {});
      if (res?.data?.bonus !== undefined) {
        queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);
        queryClient?.invalidateQueries([$userPublicAddress, "rewards"]);
        queryClient?.invalidateQueries(["users-me"]);
        openScreenBonusScore = false;
      }
    } catch (e) {
      console.error(e);
    }
  };

  $: {
    if (filterTokenType) {
      if (filterTokenType.value === 0) {
        filteredEligibilityData = eligibilityData;
      } else {
        filteredEligibilityData = eligibilityData?.filter(
          (item: any) => item?.value > filterTokenType.value,
        );
      }
    } else {
      filteredEligibilityData = eligibilityData;
    }
  }
</script>

<ErrorBoundary>
  <div class="flex flex-col gap-6">
    <div
      class={`flex flex-col gap-3 rounded-[20px] xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
        $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
      }`}
    >
      <div class="flex items-center gap-2 justify-between">
        <div class="text-2xl font-medium">{$t("Tokens")}</div>
        <div class="xl:text-3xl text-2xl font-medium">
          <TooltipNumber
            number={totalEstimateValueEligibilities}
            type="value"
            personalValue
          />
        </div>
      </div>

      <div class="flex items-center xl:justify-end justify-start w-full gap-2">
        <div class="xl:block hidden text-sm font-regular text-gray-400">
          {$t("Hide airdrops less than")}
        </div>
        <div class="xl:block hidden">
          <Select
            type="filter"
            positionSelectList="right-0"
            listSelect={filterTokenValueType}
            bind:selected={filterTokenType}
            isDisabledSelectWallet={false}
            indexWalletDisabled={-1}
          />
        </div>
        <div class="xl:hidden block">
          <Select
            type="filter"
            positionSelectList="left-0"
            listSelect={filterTokenValueType}
            bind:selected={filterTokenType}
            isDisabledSelectWallet={false}
            indexWalletDisabled={-1}
          />
        </div>
      </div>

      <Table>
        <span slot="desktop">
          <table class="table-auto w-full h-full">
            <thead>
              <tr class="bg_f4f5f8">
                <th class="pl-3 py-3 rounded-tl-[10px]">
                  <div class="text-left text-xs uppercase font-medium">
                    {$t("Assets")}
                  </div>
                </th>

                <th class="py-3">
                  <div class="text-right text-xs uppercase font-medium">
                    {$t("Amount")}
                  </div>
                </th>

                <th class="py-3">
                  <div class="text-right text-xs uppercase font-medium">
                    {$t("Price")}
                  </div>
                </th>

                <th class="py-3 pr-3 rounded-tr-[10px]">
                  <div
                    class="text-right text-xs uppercase font-medium flex justify-end"
                  >
                    <TooltipTitle tooltipText="Based on pre-market price">
                      {$t("Estimated value")}
                    </TooltipTitle>
                  </div>
                </th>
              </tr>
            </thead>

            {#if $queryAirdrops.isFetching}
              <tbody>
                <tr>
                  <td colspan="4">
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
            {:else if filteredEligibilityData?.length === 0}
              <tbody>
                <tr>
                  <td colspan="4">
                    <div
                      class="flex justify-center items-center h-full py-4 px-3 text-lg text-gray-400"
                    >
                      {#if eligibilityData && eligibilityData.length === 0}
                        {$t("Empty")}
                      {:else}
                        {$t("All airdrops less than")} ${filterTokenType.value}
                      {/if}
                    </div>
                  </td>
                </tr>
              </tbody>
            {:else}
              <tbody>
                {#each filteredEligibilityData || [] as item}
                  <tr class="group transition-all relative">
                    <td
                      class={`pl-3 py-3 ${
                        $isDarkMode
                          ? "bg-[#131313] group-hover:bg-[#000]"
                          : "bg-white group-hover:bg-gray-100"
                      }`}
                    >
                      <div
                        class="flex justify-start items-center gap-3 text-sm font-medium"
                      >
                        <div
                          class="rounded-full w-[30px] h-[30px] overflow-hidden"
                        >
                          <Image
                            logo={item.logoUrl}
                            defaultLogo={defaultToken}
                          />
                        </div>
                        <div class="flex flex-col gap-1">
                          <div class="font-medium text-sm">
                            {item?.protocolLabel}
                          </div>
                          <div class="font-medium text_00000080 text-xs">
                            {item?.ticker}
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
                        class="flex justify-end text-sm font-medium text_00000099"
                      >
                        <TooltipNumber
                          number={item?.amount || 0}
                          type="amount"
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
                      <div
                        class="flex justify-end text-sm font-medium text_00000099"
                      >
                        <TooltipNumber
                          number={item?.tokenPrice || 0}
                          type="value"
                        />
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
                        class="flex justify-end text-sm font-medium text_00000099"
                      >
                        <TooltipNumber
                          number={Number(item.value || 0)}
                          type="value"
                        />
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            {/if}
          </table>
        </span>
        <span slot="mobile">
          {#if $queryAirdrops.isFetching}
            <div
              class="flex justify-center items-center min-h-[300px] py-3 px-3"
            >
              {#if isNimbusVersion}
                <LoadingPremium />
              {:else}
                <Loading />
              {/if}
            </div>
          {:else}
            <div>
              {#if eligibilityData?.length === 0}
                <div
                  class="flex justify-center items-center min-h-[300px] py-3 px-3"
                >
                  {$t("Empty")}
                </div>
              {:else}
                {#each eligibilityData || [] as item}
                  <div
                    class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4 px-2"
                  >
                    <div class="flex justify-between items-start">
                      <div
                        class="flex justify-start items-center gap-3 text-sm font-medium"
                      >
                        <div
                          class="rounded-full w-[30px] h-[30px] overflow-hidden"
                        >
                          <Image
                            logo={item.logoUrl}
                            defaultLogo={defaultToken}
                          />
                        </div>
                        <div class="flex flex-col gap-1">
                          <div class="font-medium text-sm">
                            {item?.protocolLabel}
                          </div>
                          <div class="font-medium text_00000080 text-xs">
                            {item?.ticker}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="flex justify-between items-start">
                      <div class="text-right text-sm uppercase font-medium">
                        {$t("Amount")}
                      </div>

                      <div
                        class="flex items-center justify-end font-medium text-sm text_00000099"
                      >
                        <TooltipNumber
                          number={item?.amount || 0}
                          type="amount"
                        />
                      </div>
                    </div>

                    <div class="flex justify-between items-start">
                      <div class="text-right text-sm uppercase font-medium">
                        {$t("Price")}
                      </div>

                      <div
                        class="flex items-center justify-end font-medium text-sm text_00000099"
                      >
                        <TooltipNumber
                          number={item?.tokenPrice || 0}
                          type="value"
                        />
                      </div>
                    </div>

                    <div class="flex justify-between items-start">
                      <div class="text-right text-sm uppercase font-medium">
                        <TooltipTitle tooltipText="Based on pre-market price">
                          {$t("Estimated value")}
                        </TooltipTitle>
                      </div>

                      <div
                        class="flex items-center justify-end font-medium text-sm text_00000099"
                      >
                        <TooltipNumber
                          number={item?.amount
                            ? Number(item?.amount) * Number(item?.tokenPrice)
                            : 0}
                          type="value"
                        />
                      </div>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        </span>
      </Table>
    </div>

    <div class="flex flex-col gap-6">
      <div
        class={`flex flex-col gap-3 rounded-[20px] xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
          $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
        }`}
      >
        <div class="flex items-center gap-2 justify-between">
          <div class="text-2xl font-medium">{$t("Points")}</div>
          <div class="xl:text-3xl text-2xl font-medium">
            <TooltipNumber
              number={totalEstimateValuePoints}
              type="value"
              personalValue
            />
          </div>
        </div>

        <Table>
          <span slot="desktop">
            <table class="table-auto w-full h-full">
              <thead>
                <tr class="bg_f4f5f8">
                  <th class="pl-3 py-3 rounded-tl-[10px]">
                    <div class="text-left text-xs uppercase font-medium">
                      {$t("Assets")}
                    </div>
                  </th>

                  <th class="py-3">
                    <div class="text-right text-xs uppercase font-medium">
                      {$t("Points")}
                    </div>
                  </th>

                  <th class="py-3 pr-3 rounded-tr-[10px]">
                    <div
                      class="text-right text-xs uppercase font-medium flex justify-end"
                    >
                      <TooltipTitle tooltipText="Based on pre-market price">
                        {$t("Estimated value")}
                      </TooltipTitle>
                    </div>
                  </th>
                </tr>
              </thead>

              {#if $queryPoints.isFetching}
                <tbody>
                  <tr>
                    <td colspan="3">
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
              {:else if pointsData?.length === 0}
                <tr>
                  <td colspan="3">
                    <div
                      class="flex justify-center items-center h-full py-4 px-3 text-lg text-gray-400"
                    >
                      {$t("Empty")}
                    </div>
                  </td>
                </tr>
              {:else}
                {#each pointsData || [] as item}
                  <tr class="group transition-all relative">
                    <td
                      class={`pl-3 py-3 ${
                        $isDarkMode
                          ? "bg-[#131313] group-hover:bg-[#000]"
                          : "bg-white group-hover:bg-gray-100"
                      }`}
                    >
                      <div
                        class=" flex justify-start items-center gap-3 text-sm font-medium"
                      >
                        <div
                          class="rounded-full w-[30px] h-[30px] overflow-hidden"
                        >
                          <Image
                            logo={protocolInfo[item?.protocolLabel]?.logo}
                            defaultLogo={defaultToken}
                          />
                        </div>

                        <div class="flex flex-col gap-1">
                          {protocolInfo[item?.protocolLabel]?.name || ""}

                          <div class="flex items-center gap-2 w-max">
                            {#if protocolInfo[item?.protocolLabel]?.twitter}
                              <a
                                href={protocolInfo[item?.protocolLabel]
                                  ?.twitter}
                                target="_blank"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="13"
                                  height="13"
                                  viewBox="0 0 14 14"
                                >
                                  <rect width="14" height="14" fill="none" />
                                  <g fill="none">
                                    <g clip-path="url(#primeTwitter0)">
                                      <path
                                        fill="#606060"
                                        d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z"
                                      />
                                    </g>
                                    <defs>
                                      <clipPath id="primeTwitter0">
                                        <path
                                          fill="#606060"
                                          d="M0 0h14v14H0z"
                                        />
                                      </clipPath>
                                    </defs>
                                  </g>
                                </svg>
                              </a>
                            {/if}

                            {#if protocolInfo[item?.protocolLabel]?.website}
                              <a
                                href={protocolInfo[item?.protocolLabel]
                                  ?.website}
                                target="_blank"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 256 256"
                                >
                                  <rect width="14" height="14" fill="#606060" />
                                  <path
                                    fill="#606060"
                                    d="M137.54 186.36a8 8 0 0 1 0 11.31l-9.94 10a56 56 0 0 1-79.22-79.27l24.12-24.12a56 56 0 0 1 76.81-2.28a8 8 0 1 1-10.64 12a40 40 0 0 0-54.85 1.63L59.7 139.72a40 40 0 0 0 56.58 56.58l9.94-9.94a8 8 0 0 1 11.32 0m70.08-138a56.08 56.08 0 0 0-79.22 0l-9.94 9.95a8 8 0 0 0 11.32 11.31l9.94-9.94a40 40 0 0 1 56.58 56.58l-24.12 24.14a40 40 0 0 1-54.85 1.6a8 8 0 1 0-10.64 12a56 56 0 0 0 76.81-2.26l24.12-24.12a56.08 56.08 0 0 0 0-79.24Z"
                                  />
                                </svg>
                              </a>
                            {/if}

                            {#if item?.protocolLabel === "GMPoints"}
                              <a
                                href="https://app.getnimbus.io/daily-checkin?tab=quests"
                                target="_blank"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 256 256"
                                >
                                  <rect width="14" height="14" fill="#606060" />
                                  <path
                                    fill="#606060"
                                    d="M137.54 186.36a8 8 0 0 1 0 11.31l-9.94 10a56 56 0 0 1-79.22-79.27l24.12-24.12a56 56 0 0 1 76.81-2.28a8 8 0 1 1-10.64 12a40 40 0 0 0-54.85 1.63L59.7 139.72a40 40 0 0 0 56.58 56.58l9.94-9.94a8 8 0 0 1 11.32 0m70.08-138a56.08 56.08 0 0 0-79.22 0l-9.94 9.95a8 8 0 0 0 11.32 11.31l9.94-9.94a40 40 0 0 1 56.58 56.58l-24.12 24.14a40 40 0 0 1-54.85 1.6a8 8 0 1 0-10.64 12a56 56 0 0 0 76.81-2.26l24.12-24.12a56.08 56.08 0 0 0 0-79.24Z"
                                  />
                                </svg>
                              </a>
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
                        class="flex justify-end text-sm font-medium text_00000099"
                      >
                        <TooltipNumber
                          number={item?.points || 0}
                          type="balance"
                        />
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
                        class="flex justify-end text-sm font-medium text_00000099"
                      >
                        {#if item?.price === null}
                          Not available
                        {:else}
                          <div class="flex flex-col items-end gap-1">
                            <TooltipNumber
                              number={item?.value || 0}
                              type="value"
                            />
                            <div class="flex items-center">
                              $<TooltipNumber
                                number={(item?.price * item?.points) /
                                  item?.points || 0}
                                type="balance"
                              />/point
                            </div>
                          </div>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {/each}
              {/if}
            </table>
          </span>
          <span slot="mobile">
            {#if $queryPoints.isFetching}
              <div
                class="flex justify-center items-center min-h-[300px] py-3 px-3"
              >
                {#if isNimbusVersion}
                  <LoadingPremium />
                {:else}
                  <Loading />
                {/if}
              </div>
            {:else}
              <div>
                {#if pointsData?.length === 0}
                  <div
                    class="flex justify-center items-center min-h-[300px] py-3 px-3"
                  >
                    {$t("Empty")}
                  </div>
                {:else}
                  {#each pointsData || [] as item}
                    <div
                      class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4 px-2"
                    >
                      <div class="flex justify-between items-start">
                        <div
                          class="flex gap-2 items-center text-right text-sm uppercase font-medium"
                        >
                          <div
                            class="w-[30px] h-[30px] overflow-hidden rounded-full"
                          >
                            <Image
                              logo={protocolInfo[item?.protocolLabel]?.logo}
                              defaultLogo={defaultToken}
                            />
                          </div>
                          {protocolInfo[item?.protocolLabel]?.name}
                        </div>

                        <div
                          class="flex items-center justify-end gap-3 font-medium text-sm text_00000099"
                        >
                          {#if protocolInfo[item?.protocolLabel]?.twitter}
                            <a
                              href={protocolInfo[item?.protocolLabel]?.twitter}
                              target="_blank"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="17"
                                height="17"
                                viewBox="0 0 14 14"
                              >
                                <rect width="14" height="14" fill="none" />
                                <g fill="#606060">
                                  <g clip-path="url(#primeTwitter0)">
                                    <path
                                      fill="#606060"
                                      d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z"
                                    />
                                  </g>
                                  <defs>
                                    <clipPath id="primeTwitter0">
                                      <path fill="#fff" d="M0 0h14v14H0z" />
                                    </clipPath>
                                  </defs>
                                </g>
                              </svg>
                            </a>
                          {/if}

                          {#if protocolInfo[item?.protocolLabel]?.website}
                            <a
                              href={protocolInfo[item?.protocolLabel]?.website}
                              target="_blank"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22"
                                height="22"
                                viewBox="0 0 256 256"
                              >
                                <rect width="14" height="14" fill="#606060" />
                                <path
                                  fill="#606060"
                                  d="M137.54 186.36a8 8 0 0 1 0 11.31l-9.94 10a56 56 0 0 1-79.22-79.27l24.12-24.12a56 56 0 0 1 76.81-2.28a8 8 0 1 1-10.64 12a40 40 0 0 0-54.85 1.63L59.7 139.72a40 40 0 0 0 56.58 56.58l9.94-9.94a8 8 0 0 1 11.32 0m70.08-138a56.08 56.08 0 0 0-79.22 0l-9.94 9.95a8 8 0 0 0 11.32 11.31l9.94-9.94a40 40 0 0 1 56.58 56.58l-24.12 24.14a40 40 0 0 1-54.85 1.6a8 8 0 1 0-10.64 12a56 56 0 0 0 76.81-2.26l24.12-24.12a56.08 56.08 0 0 0 0-79.24Z"
                                />
                              </svg>
                            </a>
                          {/if}

                          {#if item?.protocolLabel === "GMPoints"}
                            <a
                              href="https://app.getnimbus.io/daily-checkin?tab=quests"
                              target="_blank"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22"
                                height="22"
                                viewBox="0 0 256 256"
                              >
                                <rect width="14" height="14" fill="#606060" />
                                <path
                                  fill="#606060"
                                  d="M137.54 186.36a8 8 0 0 1 0 11.31l-9.94 10a56 56 0 0 1-79.22-79.27l24.12-24.12a56 56 0 0 1 76.81-2.28a8 8 0 1 1-10.64 12a40 40 0 0 0-54.85 1.63L59.7 139.72a40 40 0 0 0 56.58 56.58l9.94-9.94a8 8 0 0 1 11.32 0m70.08-138a56.08 56.08 0 0 0-79.22 0l-9.94 9.95a8 8 0 0 0 11.32 11.31l9.94-9.94a40 40 0 0 1 56.58 56.58l-24.12 24.14a40 40 0 0 1-54.85 1.6a8 8 0 1 0-10.64 12a56 56 0 0 0 76.81-2.26l24.12-24.12a56.08 56.08 0 0 0 0-79.24Z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </div>
                      </div>

                      <div class="flex justify-between items-start">
                        <div class="text-right text-sm uppercase font-medium">
                          {$t("Points")}
                        </div>

                        <div
                          class="flex items-center justify-end font-medium text-sm text_00000099"
                        >
                          <TooltipNumber
                            number={item?.points || 0}
                            type="balance"
                          />
                        </div>
                      </div>

                      <div class="flex justify-between items-start">
                        <div class="text-right text-sm uppercase font-medium">
                          <TooltipTitle tooltipText="Based on pre-market price">
                            {$t("Estimated value")}
                          </TooltipTitle>
                        </div>

                        <div
                          class="flex items-center justify-end font-medium text-sm text_00000099"
                        >
                          {#if item?.price === null}
                            Not available
                          {:else}
                            <div class="flex flex-col items-end gap-1">
                              <TooltipNumber
                                number={item?.value || 0}
                                type="value"
                              />
                              <div class="flex items-center">
                                $<TooltipNumber
                                  number={(item?.price * item?.points) /
                                    item?.points || 0}
                                  type="balance"
                                />/point
                              </div>
                            </div>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
            {/if}
          </span>
        </Table>

        <div class="text-right text-sm text_00000099">
          {$t("Data by")}
          <a
            href="https://www.airdropped.link/"
            class="hover:underline max-lg:underline text-[#1E96FC]"
            target="_blank"
            >https://www.airdropped.link
          </a>
        </div>
      </div>

      <div
        class={`flex flex-col gap-3 rounded-[20px] xl:p-6 py-4 lg:px-3 xl:border border_0000001a ${
          $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
        }`}
      >
        <div class="flex items-center gap-2 justify-between">
          <div class="text-2xl font-medium">{$t("Points Market")}</div>
          <div class="xl:text-3xl text-2xl font-medium">
            <TooltipNumber
              number={totalListingValue}
              type="value"
              personalValue
            />
          </div>
        </div>

        <Table>
          <span slot="desktop">
            <table class="table-auto w-full h-full">
              <thead>
                <tr class="bg_f4f5f8">
                  <th class="pl-3 py-3 rounded-tl-[10px]">
                    <div class="text-left text-xs uppercase font-medium">
                      {$t("Assets")}
                    </div>
                  </th>

                  <th class="py-3">
                    <div class="text-right text-xs uppercase font-medium">
                      {$t("Points")}
                    </div>
                  </th>

                  <th class="py-3">
                    <div class="text-right text-xs uppercase font-medium">
                      {$t("Price")}
                    </div>
                  </th>

                  <th class="py-3 pr-3 rounded-tr-[10px]">
                    <div
                      class="text-right text-xs uppercase font-medium flex justify-end"
                    >
                      {$t("Listing Value")}
                    </div>
                  </th>
                </tr>
              </thead>

              {#if $queryPoints.isFetching}
                <tbody>
                  <tr>
                    <td colspan="4">
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
              {:else if marketPointsData?.length === 0}
                <tr>
                  <td colspan="4">
                    <div
                      class="flex justify-center items-center h-full py-4 px-3 text-lg text-gray-400"
                    >
                      {$t("Empty")}
                    </div>
                  </td>
                </tr>
              {:else}
                {#each marketPointsData || [] as item}
                  <tr class="group transition-all relative">
                    <td
                      class={`pl-3 py-3 ${
                        $isDarkMode
                          ? "bg-[#131313] group-hover:bg-[#000]"
                          : "bg-white group-hover:bg-gray-100"
                      }`}
                    >
                      <div
                        class=" flex justify-start items-center gap-3 text-sm font-medium"
                      >
                        <div
                          class="rounded-full w-[30px] h-[30px] overflow-hidden"
                        >
                          <Image
                            logo={item?.token?.icon}
                            defaultLogo={defaultToken}
                          />
                        </div>

                        <div class="flex flex-col gap-1">
                          {item?.token?.name || ""}

                          <div class="flex items-center gap-2 w-max">
                            {#if item?.token?.token_info?.twitter}
                              <a
                                href={item?.token?.token_info?.twitter}
                                target="_blank"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="13"
                                  height="13"
                                  viewBox="0 0 14 14"
                                >
                                  <rect width="14" height="14" fill="none" />
                                  <g fill="none">
                                    <g clip-path="url(#primeTwitter0)">
                                      <path
                                        fill="#606060"
                                        d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z"
                                      />
                                    </g>
                                    <defs>
                                      <clipPath id="primeTwitter0">
                                        <path
                                          fill="#606060"
                                          d="M0 0h14v14H0z"
                                        />
                                      </clipPath>
                                    </defs>
                                  </g>
                                </svg>
                              </a>
                            {/if}

                            {#if item?.token?.token_info?.website}
                              <a
                                href={item?.token?.token_info?.website}
                                target="_blank"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 256 256"
                                >
                                  <rect width="14" height="14" fill="#606060" />
                                  <path
                                    fill="#606060"
                                    d="M137.54 186.36a8 8 0 0 1 0 11.31l-9.94 10a56 56 0 0 1-79.22-79.27l24.12-24.12a56 56 0 0 1 76.81-2.28a8 8 0 1 1-10.64 12a40 40 0 0 0-54.85 1.63L59.7 139.72a40 40 0 0 0 56.58 56.58l9.94-9.94a8 8 0 0 1 11.32 0m70.08-138a56.08 56.08 0 0 0-79.22 0l-9.94 9.95a8 8 0 0 0 11.32 11.31l9.94-9.94a40 40 0 0 1 56.58 56.58l-24.12 24.14a40 40 0 0 1-54.85 1.6a8 8 0 1 0-10.64 12a56 56 0 0 0 76.81-2.26l24.12-24.12a56.08 56.08 0 0 0 0-79.24Z"
                                  />
                                </svg>
                              </a>
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
                        class="flex justify-end text-sm font-medium text_00000099"
                      >
                        <TooltipNumber
                          number={item?.total_amount || 0}
                          type="balance"
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
                      <div
                        class="flex items-center justify-end text-sm font-medium text_00000099"
                      >
                        $<TooltipNumber
                          number={item?.listing_value / item?.total_amount || 0}
                          type="balance"
                        />/point
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
                        class="flex justify-end text-sm font-medium text_00000099"
                      >
                        <div class="flex flex-col items-end gap-1">
                          <div>
                            <TooltipNumber
                              number={item?.value || 0}
                              type="amount"
                            />
                            {item?.ex_token?.symbol}
                          </div>
                          <TooltipNumber
                            number={item?.listing_value || 0}
                            type="value"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                {/each}
              {/if}
            </table>
          </span>
          <span slot="mobile">
            {#if $queryPoints.isFetching}
              <div
                class="flex justify-center items-center min-h-[300px] py-3 px-3"
              >
                {#if isNimbusVersion}
                  <LoadingPremium />
                {:else}
                  <Loading />
                {/if}
              </div>
            {:else}
              <div>
                {#if marketPointsData?.length === 0}
                  <div
                    class="flex justify-center items-center min-h-[300px] py-3 px-3"
                  >
                    {$t("Empty")}
                  </div>
                {:else}
                  {#each marketPointsData || [] as item}
                    <div
                      class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4 px-2"
                    >
                      <div class="flex justify-between items-start">
                        <div
                          class="flex gap-2 items-center text-right text-sm uppercase font-medium"
                        >
                          <div
                            class="w-[30px] h-[30px] overflow-hidden rounded-full"
                          >
                            <Image
                              logo={item?.token?.icon}
                              defaultLogo={defaultToken}
                            />
                          </div>
                          {item?.token?.name || ""}
                        </div>

                        <div
                          class="flex items-center justify-end gap-3 font-medium text-sm text_00000099"
                        >
                          {#if item?.token?.token_info?.twitter}
                            <a
                              href={item?.token?.token_info?.twitter}
                              target="_blank"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="17"
                                height="17"
                                viewBox="0 0 14 14"
                              >
                                <rect width="14" height="14" fill="none" />
                                <g fill="#606060">
                                  <g clip-path="url(#primeTwitter0)">
                                    <path
                                      fill="#606060"
                                      d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z"
                                    />
                                  </g>
                                  <defs>
                                    <clipPath id="primeTwitter0">
                                      <path fill="#fff" d="M0 0h14v14H0z" />
                                    </clipPath>
                                  </defs>
                                </g>
                              </svg>
                            </a>
                          {/if}

                          {#if item?.token?.token_info?.website}
                            <a
                              href={item?.token?.token_info?.website}
                              target="_blank"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22"
                                height="22"
                                viewBox="0 0 256 256"
                              >
                                <rect width="14" height="14" fill="#606060" />
                                <path
                                  fill="#606060"
                                  d="M137.54 186.36a8 8 0 0 1 0 11.31l-9.94 10a56 56 0 0 1-79.22-79.27l24.12-24.12a56 56 0 0 1 76.81-2.28a8 8 0 1 1-10.64 12a40 40 0 0 0-54.85 1.63L59.7 139.72a40 40 0 0 0 56.58 56.58l9.94-9.94a8 8 0 0 1 11.32 0m70.08-138a56.08 56.08 0 0 0-79.22 0l-9.94 9.95a8 8 0 0 0 11.32 11.31l9.94-9.94a40 40 0 0 1 56.58 56.58l-24.12 24.14a40 40 0 0 1-54.85 1.6a8 8 0 1 0-10.64 12a56 56 0 0 0 76.81-2.26l24.12-24.12a56.08 56.08 0 0 0 0-79.24Z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </div>
                      </div>

                      <div class="flex justify-between items-start">
                        <div class="text-right text-sm uppercase font-medium">
                          {$t("Points")}
                        </div>

                        <div
                          class="flex items-center justify-end font-medium text-sm text_00000099"
                        >
                          <TooltipNumber
                            number={item?.total_amount || 0}
                            type="balance"
                          />
                        </div>
                      </div>

                      <div class="flex justify-between items-start">
                        <div class="text-right text-sm uppercase font-medium">
                          {$t("Price")}
                        </div>

                        <div
                          class="flex items-center justify-end font-medium text-sm text_00000099"
                        >
                          $<TooltipNumber
                            number={item?.listing_value / item?.total_amount ||
                              0}
                            type="balance"
                          />/point
                        </div>
                      </div>

                      <div class="flex justify-between items-start">
                        <div class="text-right text-sm uppercase font-medium">
                          {$t("Listing Value")}
                        </div>

                        <div
                          class="flex items-center justify-end font-medium text-sm text_00000099"
                        >
                          <div class="flex flex-col items-end gap-1">
                            <div>
                              <TooltipNumber
                                number={item?.value || 0}
                                type="amount"
                              />
                              {item?.ex_token?.symbol}
                            </div>
                            <TooltipNumber
                              number={item?.listing_value || 0}
                              type="value"
                            />
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
      </div>
    </div>

    <button
      class="hover:text-blue-500 underline cursor-pointer text-left w-max text-sm"
      data-featurebase-feedback
    >
      {$t("Report Incorrect data")}
    </button>
  </div>
</ErrorBoundary>

{#if openScreenBonusScore}
  <div
    class="fixed h-screen w-screen top-0 left-0 flex items-center justify-center bg-[#000000cc]"
    style="z-index: 2147483648;"
    on:click={() => {
      openScreenBonusScore = false;
    }}
  >
    <div class="flex flex-col items-center justify-center gap-10">
      <img
        src="https://pbs.twimg.com/media/GPy-8sjaYAEReUO?format=png&name=small"
        alt=""
        class="w-70 h-70"
      />
      <div class="text-2xl text-white font-medium text-center">
        You have received {bonusScore}
        <img src={Diamond} alt="" class="w-12 h-12" /> GM Points
      </div>
      <div class="w-max -mt-6">
        <Button
          variant="tertiary"
          on:click={() => {
            handleClaimBonus();
          }}>Claim my GM</Button
        >
      </div>
    </div>
  </div>
{/if}

<style></style>
