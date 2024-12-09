<script lang="ts">
  import { onMount } from "svelte";
  import { nimbus } from "~/lib/network";
  import { SuiConnector } from "nimbus-sui-kit";
  import {
    isDarkMode,
    userPublicAddress,
    suiWalletInstance,
    openModalSignMsgStashed,
    nonceLogin,
  } from "~/store";
  import type { WalletState } from "nimbus-sui-kit";
  import { triggerToast, triggerBonusScore } from "~/utils/functions";
  import {
    getLinkData,
    getCampaignPartnerDetail,
    handleValidateAddress,
  } from "~/lib/queryAPI";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import mixpanel from "mixpanel-browser";
  import { wait } from "~/utils";
  import { SUIRPC } from "~/utils/constants";

  import ReactAdapter from "~/components/ReactAdapter.svelte";
  import Button from "~/components/Button.svelte";
  import Loading from "~/components/Loading.svelte";

  import Diamond from "~/assets/Diamond.png";
  import playIcon from "~/assets/play-icon.svg";

  export let dataQuestsBoard;
  export let id;

  const queryClient = useQueryClient();

  let listQuestCompleted: any = [];
  let listQuestVerified: any = [];

  let selectedQuestId = "";

  let startPlay = false;
  let countdown = 10;
  let countdownInterval: any;

  let userLinkData: any = [];
  let selectedDataSUILink: any = {};

  onMount(() => {
    if ($userPublicAddress) {
      handleCheckPublicAddress($userPublicAddress);
    }
  });

  const handleCheckPublicAddress = async (address: any) => {
    const addressValidate = await handleValidateAddress(address);
    if (addressValidate && addressValidate.type === "MOVE") {
      selectedDataSUILink = {
        uid: address,
      };
    }
  };

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
      selectedDataSUILink = $queryLinkSocial?.data?.find(
        (item: any) => item.kind === "wallet" && item.chain === "MOVE",
      );
    }
  }

  $: queryCampaignPartnerDetail = createQuery({
    queryKey: ["partners-detail-campaign", id],
    queryFn: () => getCampaignPartnerDetail(id),
    retry: false,
    enabled: Boolean(id && id.length !== 0),
  });

  $: {
    if (
      !$queryCampaignPartnerDetail.isError &&
      $queryCampaignPartnerDetail &&
      $queryCampaignPartnerDetail?.data !== undefined
    ) {
      listQuestCompleted =
        $queryCampaignPartnerDetail?.data?.completedQuests.filter(
          (item: any) => item.type === "QUEST",
        );
      listQuestVerified =
        $queryCampaignPartnerDetail?.data?.completedQuests.filter(
          (item: any) => item.type === "QUEST_VERIFIED",
        );
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
      if (data?.id !== selectedQuestId && data?.type !== "ONCHAIN") {
        triggerToast("Please Play the quest before Check!", "fail");
        isLoading = false;
        return;
      }
      const response: any = await nimbus.get(
        `/v2/quest/${selectedQuestId}/verify`,
      );
      if (response && response?.error) {
        triggerToast(
          response?.error ||
            "Something wrong when verify quest. Please try again!",
          "fail",
        );
        clearInterval(countdownInterval);
        startCountdown();
        await wait(10);
        selectedQuestId = "";
        return;
      }
      queryClient?.invalidateQueries(["partners-detail-campaign"]);
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
      const response: any = await nimbus.get(
        `/v2/quest/${data?.id || selectedQuestId}/claim`,
      );
      if (response && !response?.data?.success) {
        triggerToast(response?.data?.message, "fail");
        isLoading = false;
        return;
      }

      selectedQuestId = "";
      triggerBonusScore(data?.point, 2000);
      queryClient?.invalidateQueries(["users-me"]);
      queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);
      queryClient?.invalidateQueries(["partners-detail-campaign"]);
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

  let selectedQuest = {};

  const handlePlay = (data: any) => {
    selectedQuestId = data?.id;
    window.open(data?.url, "_blank");
    if (data?.type !== "ONCHAIN") {
      startPlay = true;
      clearInterval(countdownInterval);
      startCountdown();
    }
  };

  let isTrigger = false;

  const chains = [
    {
      id: "sui:mainnet",
      name: "Mainnet",
      rpcUrl: SUIRPC,
    },
  ];

  const onConnectSuccess = (msg) => {
    console.log("Success connect: ", msg);
    if ($suiWalletInstance) {
      ($suiWalletInstance as WalletState).toggleSelect();
    }
  };

  const onConnectError = (msg) => {
    console.error("Error connect", msg);
    if ($suiWalletInstance) {
      ($suiWalletInstance as WalletState).toggleSelect();
    }
  };

  const widgetConfig = {
    walletFn: (wallet) => {
      suiWalletInstance.update((n) => (n = wallet));
    },
    onConnectSuccess,
    onConnectError,
  };

  const handleSUIAuth = async () => {
    try {
      isTrigger = true;
      ($suiWalletInstance as WalletState).toggleSelect();
    } catch (e) {
      console.log("error: ", e);
    }
  };

  $: {
    if (
      ($suiWalletInstance as WalletState) &&
      ($suiWalletInstance as WalletState).connected &&
      isTrigger
    ) {
      handleGetNonce(($suiWalletInstance as WalletState)?.account?.address);
    }
  }

  const handleGetNonce = async (address: string) => {
    try {
      const res: any = await nimbus.post("/users/nonce?verified=true", {
        publicAddress: address,
        referrer: undefined,
      });
      if (res && res.data) {
        nonceLogin.update((n) => (n = res.data.nonce));
        if (
          ($suiWalletInstance as WalletState) &&
          ($suiWalletInstance as WalletState).name === "Stashed"
        ) {
          openModalSignMsgStashed.update((n) => (n = true));
        } else {
          const signature = await handleSignAddressMessage(res?.data?.nonce);
          if (signature) {
            const payload = {
              signature: signature.signature,
              publicAddress: address?.toLowerCase(),
            };
            handleUpdatePublicAddress(payload);
          }
        }
      }
    } catch (e) {
      console.error("error: ", e);
      if (
        ($suiWalletInstance as WalletState) &&
        ($suiWalletInstance as WalletState).connected
      ) {
        ($suiWalletInstance as WalletState).disconnect();
      }
      isTrigger = false;
    }
  };

  const handleSignAddressMessage = async (nonce: string) => {
    const msg = await ($suiWalletInstance as WalletState).signPersonalMessage({
      message: new TextEncoder().encode(
        `I am signing my one-time nonce: ${nonce}`,
      ),
    });
    return msg;
  };

  const handleUpdatePublicAddress = async (payload) => {
    try {
      const params: any = {
        id: $userPublicAddress,
        kind: "wallet",
        type: null,
        userPublicAddress: payload?.publicAddress,
        signature: payload?.signature,
      };
      const res: any = await nimbus.post("/accounts/link", params);
      if (res && res?.error) {
        triggerToast(
          res?.error ||
            "Something wrong when connect your Sui wallet. Please try again!",
          "fail",
        );
        return;
      }

      queryClient?.invalidateQueries(["link-socials"]);
      queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);

      triggerBonusScore(1000, 2000);
      triggerToast("Your are successfully connect your Sui wallet!", "success");

      handlePlay(selectedQuest);
    } catch (e) {
      console.log(e);
      triggerToast(
        "Something wrong when connect your Sui wallet. Please try again!",
        "fail",
      );
    } finally {
      if (
        ($suiWalletInstance as WalletState) &&
        ($suiWalletInstance as WalletState).connected
      ) {
        ($suiWalletInstance as WalletState).disconnect();
      }
      isTrigger = false;
    }
  };
</script>

<!-- Desktop -->
<div
  class={`lg:block hidden rounded-[10px] border border_0000000d overflow-hidden ${
    $isDarkMode ? "bg-[#131313]" : "bg-[#fff]"
  }`}
>
  <table class="table-auto w-full h-full">
    <thead>
      <tr class="bg_f4f5f8">
        <th class="pl-3 py-3 rounded-tl-[10px] bg_f4f5f8">
          <div class="text-left text-xs uppercase font-medium">Task</div>
        </th>

        <th class="py-3">
          <div class="text-left text-xs uppercase font-medium">GM Points</div>
        </th>

        <th class="py-3">
          <div class="text-left text-xs uppercase font-medium">Repetition</div>
        </th>

        <th class="pr-3 py-3 rounded-tr-[10px]">
          <div class="text-right text-xs uppercase font-medium">Status</div>
        </th>
      </tr>
    </thead>

    <tbody>
      {#if dataQuestsBoard && dataQuestsBoard?.length === 0}
        <tr>
          <td colspan="4">
            <div
              class="flex justify-center items-center h-full py-4 px-3 text-lg text-gray-400"
            >
              Empty
            </div>
          </td>
        </tr>
      {:else}
        {#each dataQuestsBoard
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
                class={`flex items-center gap-2 text-left text-base font-medium ${data.type === "ONCHAIN" ? "text-[#ffb800]" : $isDarkMode ? "text-white" : "text-black"}`}
              >
                {data?.title}
                {#if data?.type === "ONCHAIN"}
                  <div
                    class="text-xs rounded-full px-1 py-[2px] bg-[#ffb8004d]"
                  >
                    On-chain
                  </div>
                {/if}
              </div>
              <div class="text-left text-sm w-[400px]">
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
                <img src={Diamond} alt="" class="w-4 h-4 block" />
                {data?.point}
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
                class="text-left text-sm uppercase font-medium flex justify-start items-center"
              >
                {data?.recurringType}
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
                {#if checkUserFinishedQuest(data, listQuestCompleted)}
                  <div class="w-[90px]">
                    <Button disabled>Done!</Button>
                  </div>
                {:else}
                  <div class="w-[50px] xl:h-[33px] h-[43px]">
                    <Button
                      on:click={() => {
                        mixpanel.track("user_play_partner_quest", data);
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
                          if (
                            selectedDataSUILink &&
                            Object.keys(selectedDataSUILink).length === 0
                          ) {
                            selectedQuest = data;
                            handleSUIAuth();
                          } else {
                            handlePlay(data);
                          }
                        }
                      }}
                    >
                      <img src={playIcon} alt="" class="w-4 h-4 block" />
                    </Button>
                  </div>
                  <div class="w-[90px] xl:h-[33px] h-[43px]">
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
                            mixpanel.track("user_check_partner_quest", data);
                            if (checkUserVerifyQuest(data, listQuestVerified)) {
                              handleClaimReward(data);
                            } else {
                              if (data?.type === "ONCHAIN") {
                                selectedQuestId = data?.id;
                              }
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
  class={`lg:hidden block rounded-[10px] p-2 overflow-hidden w-full ${
    $isDarkMode ? "bg-[#131313]" : "bg-[#fff] border border_0000000d"
  }`}
>
  {#if dataQuestsBoard && dataQuestsBoard?.length === 0}
    <div
      class="flex justify-center items-center h-full py-3 px-3 text-lg text-gray-400"
    >
      Empty
    </div>
  {:else}
    {#each dataQuestsBoard
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
          <div class="text-right text-sm uppercase font-medium">Task</div>
          <div class="flex flex-col gap-1 items-start justify-end font-medium">
            <div
              class={`text-base ${data.type === "ONCHAIN" ? "text-[#ffb800]" : $isDarkMode ? "text-white" : "text-black"}`}
            >
              {data?.title}
            </div>
            <div class="text-left text-sm">
              {@html data?.description}
            </div>
          </div>
        </div>

        <div class="flex justify-between items-start">
          <div class="text-right text-sm uppercase font-medium">GM Points</div>
          <div
            class="flex items-center justify-end gap-1 font-medium text-sm text_00000099"
          >
            <img src={Diamond} alt="" class="w-4 h-4 block" />
            {data?.point}
          </div>
        </div>

        <div class="flex justify-between items-start">
          <div class="text-right text-sm uppercase font-medium">Repetition</div>
          <div
            class="flex items-center justify-end gap-1 font-medium text-sm text_00000099"
          >
            {data?.recurringType}
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div class="text-right text-sm uppercase font-medium">Status</div>
          <div
            class="flex items-center justify-end gap-2 font-medium text-sm text_00000099"
          >
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
                      if (
                        selectedDataSUILink &&
                        Object.keys(selectedDataSUILink).length === 0
                      ) {
                        selectedQuest = data;
                        handleSUIAuth();
                      } else {
                        handlePlay(data);
                      }
                    }
                  }}
                >
                  <img src={playIcon} alt="" class="w-4 h-4 block" />
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
                          if (data?.type === "ONCHAIN") {
                            selectedQuestId = data?.id;
                          }
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
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>

<div class="text-sm font-medium italic -mt-1">
  Note: On-chain task might take 1 - 2 minutes to verify, if you get failed to
  verify, please try again in 2 minutes
</div>

<ReactAdapter
  element={SuiConnector}
  config={widgetConfig}
  autoConnect={false}
  {chains}
  integrator="sui-connector"
/>

<style>
</style>
