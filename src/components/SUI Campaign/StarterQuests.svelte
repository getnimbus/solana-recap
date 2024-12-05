<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { nimbus } from "~/lib/network";
  import { createQuery } from "@tanstack/svelte-query";
  import { getCampaignQuestsBoard } from "~/lib/queryAPI";

  import Referrals from "./StarterQuests/Referrals.svelte";
  import StarterQuestTable from "./StarterQuests/StarterQuestTable.svelte";

  let dataQuestsBoard: any = [];
  let listQuestCompleted: any = [];
  let listQuestVerified: any = [];
  let dataReferrals: any = {};

  let intervalId: any = null;

  const getCampaignReferrals = async () => {
    const response: any = await nimbus.get("/v2/campaign/sui-unlock/referral");
    if (response && response?.data) {
      dataReferrals = response?.data;
    }
  };

  onMount(() => {
    getCampaignReferrals();
  });

  onDestroy(() => {
    clearInterval(intervalId);
  });

  $: {
    intervalId = setInterval(
      () => {
        getCampaignReferrals();
      },
      5 * 60 * 1000,
    ); // 5m
  }

  $: queryQuestsBoard = createQuery({
    queryKey: ["quests-campaign"],
    queryFn: () => getCampaignQuestsBoard(),
    retry: false,
  });

  $: {
    if (
      !$queryQuestsBoard.isError &&
      $queryQuestsBoard &&
      $queryQuestsBoard?.data !== undefined
    ) {
      dataQuestsBoard = $queryQuestsBoard?.data?.campaign?.quests;
      listQuestCompleted = $queryQuestsBoard?.data?.completedQuests.filter(
        (item: any) => item.type === "QUEST",
      );
      listQuestVerified = $queryQuestsBoard?.data?.completedQuests.filter(
        (item: any) => item.type === "QUEST_VERIFIED",
      );
    }
  }
</script>

<div class="flex xl:flex-row flex-col items-start justify-between gap-6">
  <Referrals {dataReferrals} />
  <StarterQuestTable
    {listQuestCompleted}
    {listQuestVerified}
    {dataQuestsBoard}
  />
</div>

<style>
</style>
