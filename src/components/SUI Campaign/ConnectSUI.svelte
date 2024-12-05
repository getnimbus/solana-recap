<script lang="ts">
  import { triggerToast, triggerBonusScore } from "~/utils/functions";
  import {
    suiWalletInstance,
    userPublicAddress,
    openModalSignMsgStashed,
    nonceLogin,
    isDarkMode,
  } from "~/store";
  import type { WalletState } from "nimbus-sui-kit";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { nimbus } from "~/lib/network";
  import { getLinkData, handleValidateAddress } from "~/lib/queryAPI";
  import { onMount } from "svelte";
  import { SuiConnector } from "nimbus-sui-kit";
  import { SUIRPC } from "~/utils/constants";

  import ReactAdapter from "~/components/ReactAdapter.svelte";
  import Copy from "~/components/Copy.svelte";

  import Diamond from "~/assets/Diamond.png";
  import SUI from "~/assets/chains/sui.png";

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
    walletFn: (wallet) => {
      suiWalletInstance.update((n) => (n = wallet));
    },
    onConnectSuccess,
    onConnectError,
  };

  let selectedDataSUILink: any = {};
  let isTrigger = false;

  $: queryLinkSocial = createQuery({
    queryKey: ["link-socials"],
    queryFn: () => getLinkData(),
    retry: false,
  });

  $: {
    if (!$queryLinkSocial?.isError && $queryLinkSocial?.data !== undefined) {
      selectedDataSUILink = $queryLinkSocial?.data?.find(
        (item) => item.kind === "wallet" && item.chain === "MOVE",
      );
    }
  }

  const handleCheckPublicAddress = async (address) => {
    const addressValidate = await handleValidateAddress(address);
    if (addressValidate && addressValidate.type === "MOVE") {
      selectedDataSUILink = {
        uid: address,
      };
    }
  };

  onMount(() => {
    if ($userPublicAddress) {
      handleCheckPublicAddress($userPublicAddress);
    }
  });

  const queryClient = useQueryClient();

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
      if (res && res?.data) {
        nonceLogin.update((n) => (n = res?.data?.nonce));
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

{#if selectedDataSUILink && Object.keys(selectedDataSUILink).length !== 0}
  <div
    class={`flex items-center justify-center gap-2 text-white border cursor-pointer py-3 px-6 h-[48px] rounded-[12px] md:w-[340px] w-full font-medium ${
      $isDarkMode ? "border-white" : "border-[#27326f] text-[#27326f]"
    }`}
  >
    <div class="w-[24px] h-[24px] rounded-full overflow-hidden">
      <img src={SUI} alt="" class="w-full h-full object-contain" />
    </div>
    <Copy
      address={selectedDataSUILink?.uid}
      iconColor={$isDarkMode ? "#fff" : "#27326f"}
      color={$isDarkMode ? "#fff" : "#27326f"}
      isShorten
    />
  </div>
{:else}
  <div
    class={`flex items-center justify-center gap-2 text-white border cursor-pointer py-3 px-6 h-[48px] rounded-[12px] md:w-[340px] w-full font-medium ${
      $isDarkMode
        ? "border-white text-white"
        : "border-[#27326f] text-[#27326f]"
    }`}
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
{/if}

<ReactAdapter
  element={SuiConnector}
  config={widgetConfig}
  autoConnect={false}
  {chains}
  integrator="sui-connector"
/>

<style>
</style>
