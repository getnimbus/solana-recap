<script lang="ts">
  import { nimbus } from "~/lib/network";
  import { isDarkMode, userPublicAddress } from "~/store";
  import { triggerToast, triggerBonusScore } from "~/utils/functions";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { getLinkData } from "~/lib/queryAPI";
  import dayjs from "dayjs";
  import { t } from "~/lib/i18n";

  import Button from "~/components/Button.svelte";
  import Loading from "~/components/Loading.svelte";

  import Diamond from "~/assets/Diamond.png";
  import playIcon from "~/assets/play-icon.svg";

  export let listQuestVerified;
  export let listQuestCompleted;
  export let dataQuestsBoard;

  const queryClient = useQueryClient();

  let selectedQuestId = "";

  let startPlay = false;
  let countdown = 10;
  let countdownInterval: any;

  let userLinkData: any = [];

  $: queryLinkSocial = createQuery({
    queryKey: ["link-socials"],
    queryFn: () => getLinkData(),
    retry: false,
  });

  $: {
    if (
      !$queryLinkSocial.isError &&
      $queryLinkSocial.data !== undefined &&
      queryLinkSocial?.data?.length !== 0
    ) {
      userLinkData = $queryLinkSocial?.data;
    }
  }

  const checkUserFinishedQuest = (campaign: any, completedQuests: any) => {
    return (
      completedQuests &&
      completedQuests?.map((item: any) => item.questId).includes(campaign.id)
    );
  };

  const checkUserVerifyQuest = (campaign: any, verifyQuests: any) => {
    return (
      verifyQuests &&
      verifyQuests?.map((item: any) => item.questId).includes(campaign.id)
    );
  };

  const startCountdown = () => {
    countdown = 10;
    countdownInterval = setInterval(() => {
      countdown--;
      if (countdown === 0) {
        clearInterval(countdownInterval);
        startPlay = false;
      }
    }, 1000);
  };

  let isLoading = false;

  const handleVerifyQuest = async (data: any) => {
    try {
      isLoading = true;
      if (data?.id !== selectedQuestId) {
        triggerToast("Please Play the quest before Check!", "fail");
        isLoading = false;
        return;
      }

      const response: any = await nimbus.get(
        `/v2/quest/${selectedQuestId}/verify`,
      );
      if (response && !response?.data?.success) {
        triggerToast(response?.data?.message, "fail");
        selectedQuestId = "";
        return;
      }

      triggerToast("You can claim your GMs nows!", "success");

      queryClient?.invalidateQueries(["quests-campaign"]);
    } catch (e) {
      console.error(e);
      triggerToast(
        "Something wrong when verify quest. Please try again!",
        "fail",
      );
    } finally {
      isLoading = false;
    }
  };

  const handleClaimReward = async (data: any) => {
    try {
      isLoading = true;
      const response: any = await nimbus.get(`/v2/quest/${data?.id}/claim`);
      if (response && response?.error) {
        triggerToast(
          response?.error ||
            "Something wrong when claim quest reward. Please try again!",
          "fail",
        );
        isLoading = false;
        return;
      }

      selectedQuestId = "";

      triggerBonusScore(data?.point, 2000);
      queryClient?.invalidateQueries(["users-me"]);
      queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);
      queryClient?.invalidateQueries(["quests-campaign"]);
    } catch (e) {
      console.error(e);
      triggerToast(
        "Something wrong when claim quest reward. Please try again!",
        "fail",
      );
    } finally {
      isLoading = false;
    }
  };
</script>

<div
  class={`flex-1 w-full flex flex-col gap-3 rounded-[10px] xl:p-4 py-3 px-2 ${
    $isDarkMode ? "bg-[#222222]" : "bg-[#fff] xl:border border_0000001a"
  }`}
>
  <div class="text-xl font-medium">{$t("Quests")}</div>
  <!-- Desktop -->
  <div
    class={`md:block hidden rounded-[10px] border border_0000000d h-[449px] overflow-y-auto ${
      $isDarkMode ? "bg-[#131313]" : "bg-[#fff]"
    }`}
  >
    <table class="table-auto w-full">
      <thead>
        <tr class="bg_f4f5f8 sticky top-0">
          <th class="pl-3 py-3 rounded-tl-[10px]">
            <div class="text-left text-xs uppercase font-medium">
              {$t("Task")}
            </div>
          </th>

          <th class="py-3">
            <div class="text-left text-xs uppercase font-medium">GM Points</div>
          </th>

          <th class="pr-3 py-3 rounded-tr-[10px]">
            <div class="text-right text-xs uppercase font-medium">
              {$t("Status")}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {#if dataQuestsBoard && dataQuestsBoard?.length === 0}
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
          {#each dataQuestsBoard
            ?.map((item) => {
              return { ...item, createdAtUnix: dayjs(item.createdAt).unix(), isCompleted: checkUserFinishedQuest(item, listQuestCompleted) };
            })
            ?.filter((item) => item.status === "ACTIVE")
            ?.sort((a, b) => {
              if (a.title < b.title) {
                return -1;
              }
              if (a.title > b.title) {
                return 1;
              }
              return 0;
            })
            ?.sort((a, b) => {
              return b.createdAtUnix - a.createdAtUnix;
            })
            ?.sort((a, b) => {
              return a.isCompleted - b.isCompleted;
            }) as data}
            <tr
              class={`group transition-all ${
                $isDarkMode ? "text-gray-400" : "text-[#666666]"
              }`}
            >
              <td
                class={`xl:py-3 py-6 pl-3 flex flex-col gap-1 ${
                  $isDarkMode
                    ? "group-hover:bg-[#000]"
                    : "group-hover:bg-gray-100"
                }`}
              >
                <div
                  class={`text-left text-base font-medium ${data.isRequired ? "text-[#ffb800]" : $isDarkMode ? "text-white" : "text-black"}`}
                >
                  {data?.title}
                </div>
                <div
                  class="text-left text-sm xl:w-[280px] lg:w-[580px] w-[380px]"
                >
                  {@html data?.description}
                </div>
              </td>

              <td
                class={`xl:py-3 py-6 ${
                  $isDarkMode
                    ? "group-hover:bg-[#000]"
                    : "group-hover:bg-gray-100"
                }`}
              >
                <div
                  class="text-left text-sm uppercase font-medium flex justify-start items-center gap-1"
                >
                  <img src={Diamond} alt="" class="w-4 h-4" />
                  {data?.point}
                </div>
              </td>

              <td
                class={`xl:py-3 py-6 pr-3 ${
                  $isDarkMode
                    ? "group-hover:bg-[#000]"
                    : "group-hover:bg-gray-100"
                }`}
              >
                <div
                  class="text-right text-sm uppercase font-medium flex justify-end items-center gap-2"
                >
                  {#if data?.type === "REVIEW"}
                    <div class="w-[50px] xl:h-[34px] h-[43px]">
                      <Button
                        on:click={() => {
                          window.open(data?.url, "_blank");
                        }}
                      >
                        <img src={playIcon} alt="" class="w-4 h-4" />
                      </Button>
                    </div>
                  {/if}

                  {#if data?.type !== "REVIEW"}
                    {#if checkUserFinishedQuest(data, listQuestCompleted)}
                      <div class="w-[90px]">
                        <Button disabled>Done!</Button>
                      </div>
                    {:else}
                      <div class="w-[50px] xl:h-[34px] h-[43px]">
                        <Button
                          on:click={() => {
                            if (
                              data?.type === "DISCORD" &&
                              userLinkData &&
                              userLinkData?.length !== 0 &&
                              !userLinkData.find(
                                (item) => item.type === "discord",
                              )
                            ) {
                              window.location.assign(
                                "https://discord.com/oauth2/authorize?client_id=1236967408204517396&response_type=code&redirect_uri=https%3A%2F%2Fapp.getnimbus.io&scope=identify+guilds+guilds.members.read",
                              );
                            } else {
                              window.open(data?.url, "_blank");
                              selectedQuestId = data?.id;
                              startPlay = true;
                              clearInterval(countdownInterval);
                              startCountdown();
                            }
                          }}
                        >
                          <img src={playIcon} alt="" class="w-4 h-4" />
                        </Button>
                      </div>
                      <div class="w-[90px] xl:h-[34px] h-[43px]">
                        {#if countdown > 0 && countdown < 10 && selectedQuestId === data?.id}
                          <Button disabled>{countdown}s</Button>
                        {:else}
                          <Button
                            variant={isLoading && selectedQuestId === data?.id
                              ? "disabled"
                              : "tertiary"}
                            disabled={isLoading && selectedQuestId === data?.id}
                            on:click={() => {
                              if (!isLoading) {
                                if (
                                  checkUserVerifyQuest(data, listQuestVerified)
                                ) {
                                  handleClaimReward(data);
                                } else {
                                  handleVerifyQuest(data);
                                }
                              }
                            }}
                          >
                            {#if isLoading && selectedQuestId === data?.id}
                              <Loading size={20} />
                            {:else}
                              <div>
                                {#if checkUserVerifyQuest(data, listQuestVerified)}
                                  Claim
                                {:else}
                                  Check
                                {/if}
                              </div>
                            {/if}
                          </Button>
                        {/if}
                      </div>
                    {/if}
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Tablet/Mobile -->
  <div
    class={`md:hidden block rounded-[10px] p-2 overflow-hidden w-full ${
      $isDarkMode ? "bg-[#131313]" : "bg-[#fff] border border_0000000d"
    }`}
  >
    {#if dataQuestsBoard && dataQuestsBoard?.length === 0}
      <div
        class="flex justify-center items-center h-full py-3 px-3 text-lg text-gray-400"
      >
        {$t("Empty")}
      </div>
    {:else}
      {#each dataQuestsBoard
        ?.map((item) => {
          return { ...item, createdAtUnix: dayjs(item.createdAt).unix(), isCompleted: checkUserFinishedQuest(item, listQuestCompleted) };
        })
        ?.filter((item) => item.status === "ACTIVE")
        ?.sort((a, b) => {
          if (a.title < b.title) {
            return -1;
          }
          if (a.title > b.title) {
            return 1;
          }
          return 0;
        })
        ?.sort((a, b) => {
          return b.createdAtUnix - a.createdAtUnix;
        })
        ?.sort((a, b) => {
          return a.isCompleted - b.isCompleted;
        }) as data}
        <div
          class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4"
        >
          <div class="flex flex-col gap-1 justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Task")}
            </div>
            <div
              class="flex flex-col gap-1 items-start justify-end font-medium"
            >
              <div
                class={`text-left text-base font-medium ${data.isRequired ? "text-[#ffb800]" : "text_00000099"}`}
              >
                {data?.title}
              </div>
              <div class="text-left text-sm">
                {@html data?.description}
              </div>
            </div>
          </div>

          <div class="flex justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              GM Points
            </div>
            <div
              class="flex items-center justify-end gap-1 font-medium text-sm text_00000099"
            >
              <img src={Diamond} alt="" class="w-4 h-4" />
              {data?.point}
            </div>
          </div>

          <div class="flex justify-between items-center">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Status")}
            </div>
            <div
              class="flex items-center justify-end gap-2 font-medium text-sm text_00000099"
            >
              {#if data?.type === "REVIEW"}
                <div class="w-[50px] xl:h-[34px] h-[43px]">
                  <Button
                    on:click={() => {
                      window.open(data?.url, "_blank");
                    }}
                  >
                    <img src={playIcon} alt="" class="w-4 h-4" />
                  </Button>
                </div>
              {/if}

              {#if data?.type !== "REVIEW"}
                {#if checkUserFinishedQuest(data, listQuestCompleted)}
                  <div class="w-[90px]">
                    <Button disabled>Done!</Button>
                  </div>
                {:else}
                  <div class="w-[50px] h-[44px]">
                    <Button
                      on:click={() => {
                        if (
                          data?.type === "DISCORD" &&
                          userLinkData &&
                          userLinkData?.length !== 0 &&
                          !userLinkData.find((item) => item.type === "discord")
                        ) {
                          window.location.assign(
                            "https://discord.com/oauth2/authorize?client_id=1236967408204517396&response_type=code&redirect_uri=https%3A%2F%2Fapp.getnimbus.io&scope=identify+guilds+guilds.members.read",
                          );
                        } else {
                          window.open(data?.url, "_blank");
                          selectedQuestId = data?.id;
                          startPlay = true;
                          clearInterval(countdownInterval);
                          startCountdown();
                        }
                      }}
                    >
                      <img src={playIcon} alt="" class="w-4 h-4" />
                    </Button>
                  </div>
                  <div class="w-[90px] h-[44px]">
                    {#if countdown > 0 && countdown < 10 && selectedQuestId === data?.id}
                      <Button disabled>{countdown}s</Button>
                    {:else}
                      <Button
                        variant={isLoading && selectedQuestId === data?.id
                          ? "disabled"
                          : "tertiary"}
                        disabled={isLoading && selectedQuestId === data?.id}
                        on:click={() => {
                          if (!isLoading) {
                            if (checkUserVerifyQuest(data, listQuestVerified)) {
                              handleClaimReward(data);
                            } else {
                              handleVerifyQuest(data);
                            }
                          }
                        }}
                      >
                        {#if isLoading && selectedQuestId === data?.id}
                          <Loading size={20} />
                        {:else}
                          <div>
                            {#if checkUserVerifyQuest(data, listQuestVerified)}
                              Claim
                            {:else}
                              Check
                            {/if}
                          </div>
                        {/if}
                      </Button>
                    {/if}
                  </div>
                {/if}
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
</style>
