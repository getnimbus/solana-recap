<script lang="ts">
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { AnimateSharedLayout, Motion } from "svelte-motion";
  import { nimbus } from "~/lib/network";
  import { user, userPublicAddress } from "~/store";
  import {
    getLootBoxStatus,
    getLinkData,
    handleGetDataDailyCheckin,
    handleGetDataRewards,
    handleValidateAddress,
    getLootBoxWLStatus,
  } from "~/lib/queryAPI";
  import { triggerToast, triggerFirework } from "~/utils/functions";
  import { wait } from "~/utils/index";
  import { isNimbusVersion } from "~/utils/constants";
  import { t } from "~/lib/i18n";

  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";
  import RedeemCard from "~/components/RedeemCard.svelte";
  import TicketCard from "~/components/SUI Campaign/TicketCard.svelte";
  import PartnerCard from "~/components/SUI Campaign/PartnerCard.svelte";
  import BoxCard from "~/components/SUI Campaign/BoxCard.svelte";
  import Image from "~/components/Image.svelte";
  import AppOverlay from "~/components/Overlay.svelte";
  import Button from "~/components/Button.svelte";

  import Diamond from "~/assets/Diamond.png";

  export let handleSelectTabFlip = () => {};

  const dailyCheckinRewardsTypePortfolio = [
    {
      label: "Store",
      value: "redeemGift",
    },
    {
      label: "Inventory",
      value: "yourGift",
    },
  ];

  const queryClient = useQueryClient();

  let totalPoint = 0;

  let selectedType: "redeemGift" | "yourGift" = "redeemGift";

  let openScreenTicketCardSuccess = false;
  let openScreenBoxSuccess = false;

  let rewardBoxWL = [
    // {
    //   cost: 0,
    //   description: "WL FlowX on SUI loot boxes",
    //   title: "WL FlowX Box",
    //   body: "WL_FLOWX_BOX",
    //   logo: "https://nimbus-zodiac.s3.ap-southeast-1.amazonaws.com/sui-unlock/closed_flowx.png",
    //   cap: 0,
    //   sold: 0,
    // },
  ];

  // let rewardPartner = [
  //   {
  //     cost: 1200,
  //     description: "WLs to participate in Pandora Finance IDO",
  //     title: "Pandora IDO Whitelist",
  //     body: "PANDORA_IDO_WHITELIST",
  //     logo: "https://pbs.twimg.com/profile_images/1744278117622120448/D8yZJhLS_400x400.jpg",
  //     cap: 0,
  //     sold: 0,
  //   },
  //   {
  //     cost: 700,
  //     description: "WLs to participate in AtlanSUI NFT Mint",
  //     title: "AtlanSUI NFT Whitelist",
  //     body: "ATLANSUI_NFT_WHITELIST",
  //     logo: "https://pbs.twimg.com/profile_images/1747235711940718592/CbXDeMgn_400x400.jpg",
  //     cap: 0,
  //     sold: 0,
  //   },
  //   {
  //     cost: 1000,
  //     description: "WLs to participate in AtlanSUI NFTs Free Mint",
  //     title: "AtlanSUI NFTs Free Mint WLs",
  //     body: "ATLANSUI_NFT_FREE_MINT_WL",
  //     logo: "https://nimbus-zodiac.s3.ap-southeast-1.amazonaws.com/sui-unlock/atlansui-nft.jpeg",
  //     cap: 0,
  //     sold: 0,
  //   },
  //   {
  //     cost: 5000,
  //     description: "Get a free pizza at GM VietNam this June",
  //     title: "Happy Bitcoin Pizza Day",
  //     body: "HAPPY_BITCOIN_PIZZA_DAY",
  //     logo: "https://nimbus-zodiac.s3.ap-southeast-1.amazonaws.com/sui-unlock/pizza.png",
  //     cap: 0,
  //     sold: 0,
  //   },
  // ];

  let rewardPartner: any = [
    // {
    //   cost: 1000,
    //   description: "WLs to participate in AtlanSUI NFT Mint",
    //   title: "AtlanSUI WL Sales round",
    //   body: "ATLANSUI_WL_SALES",
    //   logo: "https://atlansui.xyz/assets/atlan-sui-logo-B_4PPbBb.png",
    //   cap: 100,
    //   sold: 0,
    // },
    // {
    //   cost: 1200,
    //   description: "WLs to participate in AtlanSUI NFT Mint",
    //   title: "AtlanSUI WL Free mint",
    //   body: "ATLANSUI_WL_FREE_MINT",
    //   logo: "https://atlansui.xyz/assets/atlan-sui-logo-B_4PPbBb.png",
    //   cap: 10,
    //   sold: 0,
    // },
    {
      cost: 2000,
      description: "Ensofi Early Contributor pass on Sui",
      title: "Ensofi Early Contributor pass on Sui",
      body: "ENSOFI_EARLY_CONTRIBUTOR_PASS",
      logo: "https://pbs.twimg.com/profile_images/1743944537612177408/Ym9-uidp_400x400.jpg",
      cap: 20,
      sold: 0,
    },
  ];

  let rewardBox: any = [
    // {
    //   cost: 800,
    //   description: "FlowX on SUI loot boxes",
    //   title: "FlowX Box",
    //   body: "FLOWX_BOX",
    //   logo: "https://nimbus-zodiac.s3.ap-southeast-1.amazonaws.com/sui-unlock/closed_flowx.png",
    //   cap: 0,
    //   sold: 0,
    // },
    // {
    //   cost: 1000,
    //   description: "Nimbus on SUI loot boxes",
    //   title: "Paper Box",
    //   body: "PAPER_BOX",
    //   logo: "https://nimbus-zodiac.s3.ap-southeast-1.amazonaws.com/sui-unlock/closed-box.png",
    //   cap: 0,
    //   sold: 0,
    // },
  ];

  const rewardTicket: any = [
    // {
    //   cost: 1000,
    //   description: "SILVER TICKET - Nimbus On Sui Ticket",
    //   title: "SILVER TICKET",
    //   body: "SILVER_TICKET",
    //   logo: "https://nimbus-zodiac.s3.ap-southeast-1.amazonaws.com/sui-unlock/silver.png",
    //   fromDate: "2024-05-21",
    //   toDate: "2024-05-27",
    // },
    // {
    //   cost: 1000,
    //   description: "BRONZE TICKET - Nimbus On Sui Ticket",
    //   title: "BRONZE TICKET",
    //   body: "BRONZE_TICKET",
    //   logo: "https://nimbus-zodiac.s3.ap-southeast-1.amazonaws.com/sui-unlock/bronze.png",
    //   fromDate: "2024-05-14",
    //   toDate: "2024-05-31",
    // },
    // {
    //   cost: 1000,
    //   description: "GOLD TICKET - Nimbus On Sui Ticket",
    //   title: "GOLD TICKET",
    //   body: "GOLD_TICKET",
    //   logo: "https://nimbus-zodiac.s3.ap-southeast-1.amazonaws.com/sui-unlock/gold.png",
    //   fromDate: "2024-05-14",
    //   toDate: "2024-05-21",
    // },
  ];

  let conditionRenderWLPartner = false;

  const triggerRedeemSuccess = async () => {
    openScreenTicketCardSuccess = true;
    triggerFirework();
    await wait(2000);
    openScreenTicketCardSuccess = false;
  };

  const triggerRedeemBoxSuccess = async () => {
    openScreenBoxSuccess = true;
    triggerFirework();
    await wait(2000);
    openScreenBoxSuccess = false;
  };

  $: queryLootboxWLStatus = createQuery({
    queryKey: ["lootbox-wl-status"],
    queryFn: () => getLootBoxWLStatus(),
    retry: false,
  });

  $: {
    if (
      !$queryLootboxWLStatus.isError &&
      $queryLootboxWLStatus.data !== undefined
    ) {
      conditionRenderWLPartner = $queryLootboxWLStatus?.data?.data.is_eligible;

      // rewardBoxWL = [
      //   {
      //     ...rewardBoxWL[0],
      //     cap:
      //       $queryLootboxWLStatus?.data?.data.is_eligible &&
      //       !$queryLootboxWLStatus?.data?.data.is_claimed
      //         ? 1
      //         : 0,
      //     sold: 0,
      //   },
      // ];
    }
  }

  $: queryLootboxStatus = createQuery({
    queryKey: ["lootbox-status"],
    queryFn: () => getLootBoxStatus(),
    retry: false,
  });

  $: {
    if (
      !$queryLootboxStatus.isError &&
      $queryLootboxStatus.data !== undefined &&
      $queryLootboxStatus?.data?.data?.length !== 0
    ) {
      rewardPartner = rewardPartner.map((item) => {
        const seletedData = $queryLootboxStatus?.data?.data.find(
          (eachItem: any) => eachItem.type === item.body,
        );
        return {
          ...item,
          cap: seletedData?.cap || 0,
          sold: seletedData?.sold || 0,
        };
      });

      rewardBox = (rewardBox || [])?.map((item) => {
        const seletedData = $queryLootboxStatus?.data?.data.find(
          (eachItem: any) => eachItem.type === item.body,
        );

        return {
          ...item,
          cap: seletedData?.cap || 0,
          sold: seletedData?.sold || 0,
        };
      });
    }
  }

  let socialData: any = [];

  $: queryLinkSocial = createQuery({
    queryKey: ["link-socials"],
    queryFn: () => getLinkData(),
    retry: false,
  });

  $: {
    if (!$queryLinkSocial.isError && $queryLinkSocial.data !== undefined) {
      socialData = $queryLinkSocial?.data;
    }
  }

  $: queryDailyCheckin = createQuery({
    queryKey: [$userPublicAddress, "daily-checkin"],
    queryFn: () => handleGetDataDailyCheckin(),
    enabled: Boolean(
      $user &&
        Object.keys($user)?.length !== 0 &&
        $userPublicAddress &&
        $userPublicAddress?.length !== 0,
    ),
  });

  $: {
    if (!$queryDailyCheckin.error && $queryDailyCheckin.data !== undefined) {
      totalPoint = $queryDailyCheckin?.data?.totalPoint;
    }
  }

  $: queryReward = createQuery({
    queryKey: [$userPublicAddress, "rewards"],
    queryFn: () => handleGetDataRewards($userPublicAddress),
    enabled: Boolean(
      $user &&
        Object.keys($user)?.length !== 0 &&
        $userPublicAddress &&
        $userPublicAddress?.length !== 0,
    ),
  });

  let isLoadingRedeem = false;
  let selectedReward: any = {};
  let resRedeem: any = {};

  const handleRedeem = async (data: any) => {
    const validateAddress = await handleValidateAddress($userPublicAddress);
    if (
      validateAddress?.type === "MOVE" ||
      socialData.find((item: any) => item.chain === "MOVE")
    ) {
      isLoadingRedeem = true;
      try {
        if (totalPoint < data.cost) {
          selectedType = "yourGift";
          return;
        }

        const response: any = await nimbus.post("/v2/reward/redeem", {
          address: $userPublicAddress,
          campaignName: data?.campaignName,
        });
        if (response?.error) {
          triggerToast(response?.error, "fail");
        }

        queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);
        queryClient?.invalidateQueries([$userPublicAddress, "rewards"]);

        selectedReward = data;
        triggerRedeemSuccess();
      } catch (e) {
        console.error(e);
        triggerToast(
          "Something went wrong while redeeming. Please try again!",
          "fail",
        );
      } finally {
        isLoadingRedeem = false;
      }
    } else {
      if (
        validateAddress?.type === "MOVE" ||
        socialData.find((item: any) => item.chain === "MOVE")
      ) {
        triggerToast("Something went wrong while redeeming the ticket", "fail");
      } else {
        triggerToast(
          "Please connect your SUI wallet or link you SUI wallet to redeem!",
          "fail",
        );
      }
    }
  };

  const handleRedeemCampaign = async (data: any) => {
    try {
      isLoadingRedeem = true;
      const response: any = await nimbus.post(
        "/v2/campaign/sui-unlock/rewards",
        {
          reward: data.body,
        },
      );
      if (response?.error) {
        triggerToast(response?.error, "fail");
        return;
      }

      queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);
      queryClient?.invalidateQueries([$userPublicAddress, "rewards"]);
      queryClient?.invalidateQueries(["lootbox-status"]);

      if (data.body === "PAPER_BOX" || data.body === "FLOWX_BOX") {
        resRedeem = response?.data;
        triggerRedeemBoxSuccess();
      } else {
        selectedReward = data;
        triggerRedeemSuccess();
      }
    } catch (error) {
      console.error(error);
      triggerToast(
        "Something went wrong while redeeming. Please try again!",
        "fail",
      );
    } finally {
      isLoadingRedeem = false;
    }
  };

  let openScreenClaimSuccess = false;
  let resClaim: any = {};

  const triggerClaimSuccess = (data: any) => {
    resClaim = data;
    openScreenClaimSuccess = true;
  };
</script>

<div class="flex flex-col gap-4">
  <div
    class="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 border-b-[1.5px] border_0000000d pb-4"
  >
    <div class="flex flex-col gap-1">
      <div class="xl:title-3 title-2">{$t("Rewards")}</div>
      <div class="text-base text-gray-500">
        {$t("Use GM Points to redeem gifts")}
      </div>
    </div>
    <div
      class="flex justify-center items-center gap-2 py-2 px-3 max-w-[120px] rounded-full bg-[#27326F]"
    >
      <img src={Diamond} alt="" class="w-8 h-8" />
      <div class="text-white text-xl font-medium">
        {totalPoint}
      </div>
    </div>
  </div>

  <div class="flex flex-col gap-10">
    {#if $queryDailyCheckin.isFetching && $queryReward.isFetching}
      <div class="flex items-center justify-center h-full px-3 py-4">
        <LoadingPremium />
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <AnimateSharedLayout>
            {#each dailyCheckinRewardsTypePortfolio as type}
              <div
                class="relative cursor-pointer text-base font-medium py-1 px-3 rounded-[100px] transition-all"
                on:click={() => (selectedType = type.value)}
              >
                <div
                  class={`relative z-1 ${
                    selectedType === type.value && "text-white"
                  }`}
                >
                  {$t(type.label)}
                </div>
                {#if type.value === selectedType}
                  <Motion
                    let:motion
                    layoutId="active-pill"
                    transition={{ type: "spring", duration: 0.6 }}
                  >
                    <div
                      class="absolute inset-0 rounded-full bg-[#1E96FC] z-0"
                      use:motion
                    />
                  </Motion>
                {/if}
              </div>
            {/each}
          </AnimateSharedLayout>
        </div>

        {#if selectedType === "redeemGift"}
          <div class="flex flex-col gap-4">
            <div
              class="flex justify-center items-center h-full w-full text-lg text-gray-400"
            >
              <!-- {#if $queryReward?.data?.redeemable.length === 0}
                There are no redeems
              {/if} -->

              {#if $queryReward?.data === undefined}
                {$t("Please connect wallet")}
              {/if}
            </div>

            <div class="grid 2xl:grid-cols-3 lg:grid-cols-2 grid-cols-1 gap-6">
              {#each $queryReward?.data?.redeemable || [] as item}
                <RedeemCard
                  isRedeem
                  redeemData={item}
                  {handleRedeem}
                  {isLoadingRedeem}
                />
              {/each}

              {#if $queryReward?.data !== undefined}
                <!-- {#if conditionRenderWLPartner}
                  {#each rewardBoxWL || [] as item}
                    <BoxCard
                      isRedeem
                      data={item}
                      handleRedeemBox={handleRedeemCampaign}
                      {isLoadingRedeem}
                      {totalPoint}
                      {triggerClaimSuccess}
                    />
                  {/each}
                {/if} -->

                {#each rewardBox || [] as item}
                  <BoxCard
                    isRedeem
                    data={item}
                    handleRedeemBox={handleRedeemCampaign}
                    {isLoadingRedeem}
                    {totalPoint}
                    {triggerClaimSuccess}
                  />
                {/each}

                {#each rewardPartner || [] as item}
                  <PartnerCard
                    isRedeem
                    data={item}
                    handleRedeemPartnerCard={handleRedeemCampaign}
                    {isLoadingRedeem}
                    {totalPoint}
                    isConnectSUI={socialData.find(
                      (item) => item.chain === "MOVE",
                    )}
                  />
                {/each}

                {#each rewardTicket || [] as item}
                  <TicketCard
                    isRedeem
                    data={item}
                    handleRedeemTicket={handleRedeemCampaign}
                    {isLoadingRedeem}
                    {totalPoint}
                  />
                {/each}

                {#if rewardBox.length === 0 && rewardPartner.length === 0 && rewardTicket.length === 0}
                  <div
                    class="flex justify-center items-center h-full w-full text-lg text-gray-400 col-span-full"
                  >
                    {$t("Empty")}
                  </div>
                {/if}
              {/if}
            </div>
          </div>
        {/if}

        {#if selectedType === "yourGift"}
          <div class="flex flex-col gap-4">
            <div
              class="flex justify-center items-center h-full w-full text-lg text-gray-400"
            >
              {#if $queryReward?.data === undefined}
                {$t("Please connect wallet")}
              {/if}
              {#if $queryReward?.data?.ownRewards?.length === 0}
                {$t("Empty")}
              {/if}
            </div>

            <div class="grid 2xl:grid-cols-3 lg:grid-cols-2 grid-cols-1 gap-6">
              {#each $queryReward?.data?.ownRewards?.filter((item) => item?.campaignName !== "sui-unlock") || [] as item}
                <RedeemCard
                  redeemData={item}
                  handleRedeem={() => {}}
                  {isLoadingRedeem}
                />
              {/each}

              {#each $queryReward?.data?.ownRewards.filter((item) => item?.campaignName === "sui-unlock" && item.title !== "FLOWX_BOX" && item.title !== "WL_FLOWX_BOX" && item.title !== "PAPER_BOX" && item.title !== "PANDORA_IDO_WHITELIST" && item.title !== "ATLANSUI_NFT_WHITELIST") || [] as item}
                <TicketCard
                  data={item}
                  handleRedeemTicket={() => {}}
                  {isLoadingRedeem}
                  {totalPoint}
                />
              {/each}

              {#each $queryReward?.data?.ownRewards.filter((item) => item?.campaignName === "sui-unlock" && (item.title === "FLOWX_BOX" || item.title === "WL_FLOWX_BOX" || item.title === "PAPER_BOX" || item.title === "FINAL_PRIZE")) || [] as item}
                <BoxCard
                  isClaimable={item.isClaimable}
                  data={item}
                  handleRedeemBox={() => {}}
                  {isLoadingRedeem}
                  {totalPoint}
                  {triggerClaimSuccess}
                />
              {/each}

              {#each $queryReward?.data?.ownRewards.filter((item) => item?.campaignName === "sui-unlock" && (item.title === "PANDORA_IDO_WHITELIST" || item.title === "ATLANSUI_NFT_WHITELIST")) || [] as item}
                <PartnerCard
                  data={item}
                  handleRedeemPartnerCard={() => {}}
                  {isLoadingRedeem}
                  {totalPoint}
                  isConnectSUI={socialData.find(
                    (item) => item.chain === "MOVE",
                  )}
                />
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

{#if openScreenTicketCardSuccess}
  <div
    class="fixed h-screen w-screen top-0 left-0 z-10 flex items-center justify-center bg-[#000000cc]"
    on:click={() => {
      setTimeout(() => {
        openScreenTicketCardSuccess = false;
      }, 500);
    }}
  >
    <div class="flex flex-col items-center justify-center gap-10">
      <div class="text-2xl text-white font-medium">Redeem successfully</div>
      <div class="w-40 h-40">
        <Image logo={selectedReward?.logo} defaultLogo="" />
      </div>
      <div class="text-2xl text-white font-medium text-center">
        You have redeemed the {selectedReward?.title?.toLowerCase() || ""}
      </div>
    </div>
  </div>
{/if}

{#if openScreenBoxSuccess}
  <div
    class="fixed h-screen w-screen top-0 left-0 z-10 flex items-center justify-center bg-[#000000cc]"
    on:click={() => {
      setTimeout(() => {
        openScreenBoxSuccess = false;
      }, 500);
    }}
  >
    <div class="flex flex-col items-center justify-center gap-10">
      <div class="text-2xl text-white font-medium">Congratulations!</div>

      {#if resRedeem?.code === "GM_POINTS"}
        <img src={Diamond} alt="" class="w-40 h-40" />
        <div class="text-2xl text-white font-medium text-center">
          You have received {Number(resRedeem?.value || 0)} GM Points
        </div>
      {:else if resRedeem?.code === "PREMIUM_CODE"}
        <div class="text-2xl text-white font-medium text-center">
          You have received {#if isNimbusVersion}Nimbus{/if}
          Premium Code {resRedeem?.value}
        </div>
      {:else}
        <div class="w-40 h-40">
          <Image logo={resRedeem?.logo} defaultLogo="" />
        </div>
        <div class="text-2xl text-white font-medium text-center">
          You have received {Number(resRedeem?.value || 0) +
            " " +
            resRedeem?.code}
        </div>
      {/if}
    </div>
  </div>
{/if}

<AppOverlay
  clickOutSideToClose
  isOpen={openScreenClaimSuccess}
  on:close={() => (openScreenClaimSuccess = false)}
>
  <div class="flex flex-col gap-4 xl:mt-0 mt-4">
    <div class="flex flex-col items-center gap-1">
      <div class="font-semibold title-3">
        You have claimed {resClaim?.amount + " " + resClaim?.token} successfully!
      </div>
    </div>
    <div class="flex justify-center">
      <div class="min-w-[120px]">
        {#if resClaim?.partner === "FlowX"}
          <a href={resClaim?.link} target="_blank">
            <Button
              variant="tertiary"
              on:click={() => {
                openScreenClaimSuccess = false;
                resClaim = {};
              }}
            >
              Stake it with FlowX for more GM and APY %
            </Button>
          </a>
        {/if}

        {#if resClaim?.partner === "Nimbus"}
          <Button
            variant="tertiary"
            on:click={() => {
              handleSelectTabFlip();
              openScreenClaimSuccess = false;
              resClaim = {};
            }}>FLIP IT</Button
          >
        {/if}
      </div>
    </div>
  </div>
</AppOverlay>

<style>
</style>
