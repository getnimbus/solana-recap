<script lang="ts">
  import { Transaction } from "@mysten/sui/transactions";
  import { bcs } from "@mysten/bcs";
  import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
  import axios from "axios";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import type { WalletState } from "nimbus-sui-kit";
  import {
    suiWalletInstance,
    userPublicAddress,
    openModalSignMsgStashed,
    nonceLogin,
  } from "~/store";
  import { isDarkMode } from "~/store";
  import { shorterAddress, wait } from "~/utils/index";
  import {
    triggerToast,
    triggerFirework,
    triggerBonusScore,
  } from "~/utils/functions";
  import { nimbus } from "~/lib/network";
  import { getLinkData } from "~/lib/queryAPI";
  import tooltip from "~/lib/tooltip";
  import { SuiConnector } from "nimbus-sui-kit";
  import { SUIRPC } from "~/utils/constants";

  import ReactAdapter from "~/components/ReactAdapter.svelte";
  import Button from "~/components/Button.svelte";
  import Loading from "~/components/Loading.svelte";

  import suiBackground from "~/assets/campaign/sui-background-img.png";
  import betterLuck from "~/assets/campaign/better-luck.png";
  import coin from "~/assets/campaign/coin.png";
  import Diamond from "~/assets/Diamond.png";

  export let dataFlipCheck;
  export let getFlipCheck = () => {};

  const chains = [
    {
      id: "sui:mainnet",
      name: "Mainnet",
      rpcUrl: SUIRPC,
    },
  ];

  const onConnectSuccess = (msg: any) => {
    console.log("Success connect: ", msg);
    if ($suiWalletInstance) {
      ($suiWalletInstance as WalletState).toggleSelect();
    }
  };

  const onConnectError = (msg: any) => {
    console.error("Error connect", msg);
    if ($suiWalletInstance) {
      ($suiWalletInstance as WalletState).toggleSelect();
    }
  };

  const widgetConfig = {
    walletFn: (wallet: any) => {
      suiWalletInstance.update((n) => (n = wallet));
    },
    onConnectSuccess,
    onConnectError,
  };

  const queryClient = useQueryClient();

  let isTrigger = false;

  let isLoadingFlip = false;
  let flipCount = dataFlipCheck.playNum;

  let isUserWin = false;
  let openScreenResult = false;
  let startFlip = false;
  let linkedSuiWallet = false;
  let onSelectCoin: "head" | "tail" | null = null;

  $: queryLinkSocial = createQuery({
    queryKey: ["link-socials"],
    queryFn: () => getLinkData(),
    retry: false,
  });

  const client = new SuiClient({ url: getFullnodeUrl("mainnet") });

  const getRound = async () => {
    const round = await client
      .getObject({
        id: "0xfc94a9e689692098ad6c81cfe12b6ece40f3b8a354dd79a1a4ba47110408efcd",
        options: {
          showContent: true,
        },
      })
      .then((res: any) => res?.data?.content?.fields?.round)
      .catch((err) => {
        console.log(err);
      });

    return round;
  };

  const getSignature = async (round: any) => {
    const signature = await axios
      .get(
        `https://drand.cloudflare.com/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971/public/${round}`,
      )
      .then((res) => res?.data?.signature)
      .catch((err) => {
        console.log("signature error: ", err);
      });

    return signature;
  };

  const getVerifyFlipPoint = async (txDigest: any) => {
    const res = await nimbus.post(`/v2/games/flip/verify-point`, {
      tx_hash: txDigest,
    });
  };

  const triggerFlipResult = async (type: number) => {
    if (
      ($suiWalletInstance as WalletState) &&
      ($suiWalletInstance as WalletState).connected
    ) {
      isLoadingFlip = true;
      try {
        const tx = new Transaction();
        tx.setGasBudget(50000000);
        const round = await getRound();
        const signature = await getSignature(round);

        // call flip function
        tx.moveCall({
          target:
            "0x5d20579940a0c071a8849bece0361c24a0c5296c1051c1648ec64a4f0b3975b8::coin_flip::flip", // mainnet
          typeArguments: [],
          arguments: [
            tx.object(
              "0xfc94a9e689692098ad6c81cfe12b6ece40f3b8a354dd79a1a4ba47110408efcd",
            ), // mainnet
            tx.pure(type, "u64"),
            tx.pure(bcs.string().serialize(signature).toBytes()),
          ],
        });

        const res: any = await (
          $suiWalletInstance as WalletState
        ).signAndExecuteTransactionBlock({
          transactionBlock: tx,
          options: {
            showInput: true,
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
            showBalanceChanges: true,
          },
        });

        await wait(3000);

        if (Number(res.events[0]?.parsedJson?.result) === type) {
          isUserWin = true;
          triggerFirework();
          openScreenResult = true;
        } else {
          isUserWin = false;
          openScreenResult = true;
        }

        if (res.events[0]?.id.txDigest) {
          await getVerifyFlipPoint(res.events[0]?.id?.txDigest);
        }
        flipCount = flipCount + 1;

        getFlipCheck();
        queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);

        isLoadingFlip = false;
      } catch (error) {
        console.log("err: ", error);
        isLoadingFlip = false;
      }
      onSelectCoin = null;
    }
  };

  const handleStartFlip = async () => {
    if (!dataFlipCheck.canPlay) {
      triggerToast(
        "Your flipping capacity has reached its limit! You can only flip 5 times a day.",
        "fail",
      );
      return;
    }

    if ($suiWalletInstance as WalletState) {
      if (($suiWalletInstance as WalletState).connected) {
        startFlip = true;
      } else {
        handleSUIAuth();
      }
    }
  };

  let selectedDataSUILink: any = {};

  $: {
    if (!$queryLinkSocial.isError && $queryLinkSocial.data !== undefined) {
      selectedDataSUILink =
        $queryLinkSocial?.data.find(
          (item) => item?.kind === "wallet" && item?.chain === "MOVE",
        ) || {};

      if (
        selectedDataSUILink &&
        Object.keys(selectedDataSUILink)?.length !== 0 &&
        ($suiWalletInstance as WalletState)?.address !== undefined
      ) {
        if (
          selectedDataSUILink?.uid !==
          ($suiWalletInstance as WalletState)?.address
        ) {
          linkedSuiWallet = false;
          triggerToast(
            `Please connect to wallet ${shorterAddress(selectedDataSUILink?.uid)} to flip`,
            "fail",
          );
          ($suiWalletInstance as WalletState)?.disconnect();
        } else {
          linkedSuiWallet = true;
        }
      }
    }
  }

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
            if (
              selectedDataSUILink &&
              Object.keys(selectedDataSUILink)?.length === 0
            ) {
              handleUpdatePublicAddress(payload);
            } else {
              startFlip = true;
            }
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

  const handleUpdatePublicAddress = async (payload: any) => {
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

      startFlip = true;
    } catch (e) {
      console.log(e);
      triggerToast(
        "Something wrong when connect your Sui wallet. Please try again!",
        "fail",
      );
    } finally {
      isTrigger = false;
      if (
        ($suiWalletInstance as WalletState) &&
        ($suiWalletInstance as WalletState).connected
      ) {
        ($suiWalletInstance as WalletState).disconnect();
      }
    }
  };
</script>

<div
  class={`flex flex-col items-center gap-10 relative rounded-[10px] py-10 px-8 overflow-hidden ${$isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff] border border_0000001a"}`}
>
  <img
    src={suiBackground}
    alt=""
    class="absolute right-[-21px] top-[50%] -translate-y-1/2 object-contain h-full z-1 block"
  />

  <div class="font-semibold text-5xl uppercase">Flip The GM</div>

  <div class="relative z-2 h-[110px]">
    <img src={coin} alt="" class="h-full h-full object-contain block" />
  </div>

  <div class="text-amber-400 font-medium text-center relative z-2">
    No Loss: Pay Gas > Flip GM Points > Get Rewards
  </div>

  <div
    class="bg-[#424C81] text-white rounded-xl flex flex-col items-center justify-center py-2 px-20 relative z-2"
  >
    <div class="text-2xl">Rewards</div>
    <div class="flex items-center gap-2 py-2">
      <div class="p-2 rounded-[10px] bg-[#27326F]">
        <img src={Diamond} alt="" class="h-7 w-7 block" />
      </div>
      <div class="text-2xl font-medium">1000</div>
    </div>
  </div>

  <div class="relative z-2 w-full">
    {#if selectedDataSUILink && Object.keys(selectedDataSUILink)?.length === 0}
      <div
        class="flex justify-center items-center gap-3 text-white bg-[#1e96fc] py-1 px-2 rounded-[10px] cursor-pointer xl:w-[280px] w-max mx-auto"
        on:click={handleSUIAuth}
      >
        Connect SUI Wallet
        <div
          class="flex items-center gap-1 text-sm font-medium bg-[#27326F] py-1 px-2 text-white rounded-[10px]"
        >
          1000
          <img src={Diamond} alt="" class="w-6 h-6 block" />
        </div>
      </div>
    {:else}
      <div>
        {#if startFlip && dataFlipCheck?.canPlay && linkedSuiWallet}
          <div class="flex justify-center items-center gap-4">
            <!-- <button
              class={`rounded-xl text-white w-full py-4 px-5 font-medium text-lg max-w-[140px] flex items-center justify-center ${onSelectCoin === "tail" ? "bg-gray-300" : "bg-[#FFB800]"}`}
              on:click={() => {
                if (!isLoadingFlip) {
                  triggerFlipResult(1);
                  onSelectCoin = "head";
                }
              }}
              disabled={onSelectCoin === "tail" && flipCount < 5}
            >
              {#if isLoadingFlip && onSelectCoin === "head"}
                <Loading size={32} />
              {:else}
                Head
              {/if}
            </button>

            <button
              class={`rounded-xl text-white w-full py-4 px-5 font-medium text-lg max-w-[138px] flex items-center justify-center  ${onSelectCoin === "head" ? "bg-gray-300" : "bg-[#FFB800]"}`}
              on:click={() => {
                if (!isLoadingFlip) {
                  triggerFlipResult(0);
                  onSelectCoin = "tail";
                }
              }}
              disabled={onSelectCoin === "head" && flipCount < 5}
            >
              {#if isLoadingFlip && onSelectCoin === "tail"}
                <Loading size={32} />
              {:else}
                Tail
              {/if}
            </button> -->
          </div>
        {:else}
          <div class="w-max mx-auto">
            {#if dataFlipCheck.canPlay}
              <Button variant="tertiary" on:click={handleStartFlip}>
                <div class="font-medium text-lg py-4 px-5">Flip Now 👑</div>
              </Button>
            {:else}
              <div
                use:tooltip={{
                  content: `<tooltip-detail text="Your flipping capacity has reached its limit! You can only flip 5 times a day." />`,
                  allowHTML: true,
                  placement: "top",
                }}
              >
                <Button disabled>
                  <div class="font-medium text-lg py-4 px-5">Flip Now 👑</div>
                </Button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
  <div class="text-sm font-medium italic">Max 5 Flips/day</div>
</div>

<ReactAdapter
  element={SuiConnector}
  config={widgetConfig}
  autoConnect={false}
  {chains}
  integrator="sui-connector"
/>

{#if openScreenResult}
  <div
    class="fixed h-screen w-screen top-0 left-0 z-10 flex items-center justify-center bg-[#000000cc]"
    on:click={() => {
      setTimeout(() => {
        openScreenResult = false;
      }, 500);
    }}
  >
    <div class="flex flex-col items-center justify-center gap-10">
      {#if isUserWin}
        <div class="text-4xl text-[#FFD569] font-medium">Stonk Stonk</div>
        <img src={Diamond} alt="" class="w-40 h-40 block" />
        <div class="text-[34px] text-white font-medium">+1000 GMs</div>
      {:else}
        <div class="text-4xl text-[#FFD569] font-medium">
          ohh... it's stink stink
        </div>
        <img src={betterLuck} alt="" class="w-40 h-40 object-contain block" />
        <div class="text-[34px] text-white font-medium">Try again...</div>
      {/if}
    </div>
  </div>
{/if}

<style>
</style>
