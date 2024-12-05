<script lang="ts">
  import { isDarkMode, userPublicAddress } from "~/store";
  import { createQuery } from "@tanstack/svelte-query";
  import {
    handleGetDataDailyCheckin,
    getUserInfo,
    getCampaignPartnerList,
  } from "~/lib/queryAPI";
  import { t } from "~/lib/i18n";

  import RandomAvatar from "~/components/RandomAvatar.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import LinkWallet from "~/components/SUI Campaign/LinkWallet.svelte";
  import PartnerQuestCard from "~/components/SUI Campaign/PartnerQuestCard.svelte";
  import StarterQuests from "~/components/SUI Campaign/StarterQuests.svelte";
  import PartnerQuestDetail from "~/components/SUI Campaign/PartnerQuestDetail.svelte";

  import Diamond from "~/assets/Diamond.png";
  import LeftArrow from "~/assets/left-arrow.svg";
  import LeftArrowBlack from "~/assets/left-arrow-black.svg";

  export let socialData;
  export let partnerQuestId;
  export let handleUpdatePartnerQuestsId = (id) => {};

  let totalCompletedQuests = 0;
  let partnersDataList: any = [];

  $: queryDailyCheckin = createQuery({
    queryKey: [$userPublicAddress, "daily-checkin"],
    queryFn: () => handleGetDataDailyCheckin(),
    enabled: Boolean($userPublicAddress && $userPublicAddress?.length !== 0),
  });

  $: queryUserInfo = createQuery({
    queryKey: ["users-me"],
    queryFn: () => getUserInfo(),
    retry: false,
  });

  $: {
    if (
      !$queryUserInfo.isError &&
      $queryUserInfo &&
      $queryUserInfo?.data !== undefined
    ) {
      totalCompletedQuests = $queryUserInfo?.data?.totalQuest;
    }
  }

  $: queryCampaignPartnerList = createQuery({
    queryKey: ["partners-campaign"],
    queryFn: () => getCampaignPartnerList(),
    retry: false,
  });

  $: {
    if (
      !$queryCampaignPartnerList.isError &&
      $queryCampaignPartnerList &&
      $queryCampaignPartnerList?.data !== undefined
    ) {
      partnersDataList = $queryCampaignPartnerList?.data;
    }
  }

  $: twitterUsername = socialData.find(
    (item: any) => item?.type === "twitter",
  )?.name;

  $: queryPositionAddress =
    socialData.find((item: any) => item.chain === "MOVE")?.uid ||
    $userPublicAddress;
</script>

{#if partnerQuestId === ""}
  <div class="flex flex-col gap-10">
    <div
      class="flex xl:flex-row flex-col xl:items-center items-start justify-between gap-8"
    >
      <div class="xl:flex-[0.81] flex-1">
        <div class="xl:w-max w-full flex flex-col gap-3">
          <div class="flex items-center gap-4">
            <div class="md:block hidden">
              <RandomAvatar size={104} />
            </div>

            <div class="flex-1 flex flex-col gap-2">
              <div class="flex items-center gap-4">
                <div class="md:hidden block">
                  <RandomAvatar size={104} />
                </div>
                <div class="flex-1 flex flex-col gap-1">
                  <div class="text-xl font-medium">@{twitterUsername}</div>
                  <LinkWallet />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 flex md:flex-row flex-col gap-4 w-full">
        <div
          class="flex-1 w-full flex flex-col gap-3 bg-[#1589EB] py-4 px-6 rounded-lg"
        >
          <div class="text-2xl font-medium text-white">
            {$t("My GM Points")}
          </div>
          <div
            class="text-4xl font-medium flex items-center gap-2 text-white overflow-hidden"
          >
            {#if $queryDailyCheckin.isFetching}
              <div class="flex justify-center items-center h-[49px] w-full">
                <LoadingPremium />
              </div>
            {:else}
              {$queryDailyCheckin?.data?.totalPoint || 0}
              <img src={Diamond} alt="" class="w-13 h-13" />
            {/if}
          </div>
        </div>

        <div
          class={`flex-1 w-full flex flex-col gap-3 py-4 px-6 rounded-lg border border_0000001a ${$isDarkMode ? "bg-[#000]" : "bg-[#fff]"}`}
        >
          <div
            class={`text-2xl font-medium ${$isDarkMode ? "text-[#ccc]" : "text-[#00000099]"}`}
          >
            {$t("Quests Completed")}
          </div>
          <div class="text-4xl font-medium flex items-center gap-2">
            {#if $queryUserInfo.isFetching}
              <LoadingPremium />
            {:else}
              {totalCompletedQuests}
            {/if}
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1 border-b-[1.5px] border_0000000d pb-4">
        <div class="xl:title-3 title-2">
          {$t("Starter Quests")}
        </div>
        <div class="text-base text-gray-500">
          {$t("Complete all the tasks from Nimbus to collect more GM Points")}
        </div>
      </div>
      <StarterQuests />
    </div>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1 border-b-[1.5px] border_0000000d pb-4">
        <div class="xl:title-3 title-2">
          {$t("Partners Quests")}
        </div>
        <div class="text-base text-gray-500">
          {$t("Explore all the tasks from our Partners for more GM Points")}
        </div>
      </div>

      {#if $queryCampaignPartnerList.isFetching}
        <div class="mx-auto">
          <LoadingPremium />
        </div>
      {:else}
        <div
          class="grid grid-cols-4-1900px lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 w-full"
        >
          {#each partnersDataList?.filter((item) => item.status !== "INACTIVE") as data}
            <PartnerQuestCard {data} {handleUpdatePartnerQuestsId} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="flex flex-col justify-end gap-6">
    <div class="flex justify-between gap-4">
      <div
        class="flex items-center gap-1 cursor-pointer w-max"
        on:click={() => {
          handleUpdatePartnerQuestsId("");
          window.history.replaceState(
            null,
            "",
            window.location.pathname + "?tab=quests",
          );
        }}
      >
        <img
          src={$isDarkMode ? LeftArrow : LeftArrowBlack}
          alt=""
          class="xl:w-5 xl:h-5 w-7 h-7"
        />
        <div class="text-sm font-medium">
          {$t("Quests")}
        </div>
      </div>

      <a
        href="https://t.me/getnimbus"
        target="_blank"
        class="flex items-center gap-2 text-[#999999B2] cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <g
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          >
            <path d="M0 0h24v24H0z" />
            <path
              fill="currentColor"
              d="M19 4c.852 0 1.297.986.783 1.623l-.076.084L15.915 9.5l3.792 3.793c.603.602.22 1.614-.593 1.701L19 15H6v6a1 1 0 0 1-.883.993L5 22a1 1 0 0 1-.993-.883L4 21V5a1 1 0 0 1 .883-.993L5 4h14z"
            />
          </g>
        </svg> Report issues
      </a>
    </div>

    <PartnerQuestDetail
      {partnersDataList}
      id={partnerQuestId}
      {queryPositionAddress}
    />
  </div>
{/if}

<style>
  @media (min-width: 1900px) {
    .grid-cols-4-1900px {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
