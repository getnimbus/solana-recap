<script lang="ts">
  import mixpanel from "mixpanel-browser";
  import { useQueryClient } from "@tanstack/svelte-query";
  import type { WalletState } from "nimbus-sui-kit";
  import {
    isDarkMode,
    suiWalletInstance,
    userPublicAddress,
    openModalSignMsgStashed,
    nonceLogin,
  } from "~/store";
  import { nimbus } from "~/lib/network";
  import { t } from "~/lib/i18n";
  import { triggerToast, triggerBonusScore } from "~/utils/functions";
  import { SuiConnector } from "nimbus-sui-kit";
  import { SUIRPC } from "~/utils/constants";

  import ReactAdapter from "~/components/ReactAdapter.svelte";

  import SUI from "~/assets/chains/sui.png";
  import Diamond from "~/assets/Diamond.png";

  export let data;
  export let isPrimaryLogin;

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
      ($suiWalletInstance as WalletState)?.toggleSelect();
    }
  };

  const onConnectError = (msg: any) => {
    console.error("Error connect", msg);
    if ($suiWalletInstance) {
      ($suiWalletInstance as WalletState)?.toggleSelect();
    }
  };

  const widgetConfig = {
    walletFn: (wallet) => {
      suiWalletInstance.update((n) => (n = wallet));
    },
    onConnectSuccess,
    onConnectError,
  };

  const queryClient = useQueryClient();

  const handleSUIAuth = async () => {
    try {
      ($suiWalletInstance as WalletState)?.toggleSelect();
    } catch (e) {
      console.log("error: ", e);
    }
  };

  $: {
    if (
      ($suiWalletInstance as WalletState) &&
      ($suiWalletInstance as WalletState).connected
    ) {
      handleGetNonce(($suiWalletInstance as WalletState)?.account?.address);
    }
  }

  const handleGetNonce = async (address: string) => {
    try {
      mixpanel.track("user_login_sui");
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
        id: isPrimaryLogin ? data?.uid : $userPublicAddress,
        kind: "wallet",
        type: null,
        userPublicAddress: payload?.publicAddress,
        signature: payload?.signature,
      };
      const res: any = await nimbus.post("/accounts/link", params);
      if (res && res?.error) {
        triggerToast(res?.error, "fail");
        return;
      }

      triggerToast("Your are successfully connect your SUI wallet!", "success");
      triggerBonusScore(1000, 2000);
      queryClient?.invalidateQueries(["link-socials"]);
      queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);
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
    }
  };
</script>

<div
  class={`flex items-center justify-center gap-2 text-white border cursor-pointer py-3 px-6 rounded-[12px] md:w-[340px] w-full ${
    $isDarkMode ? "border-white text-white" : "border-[#27326f] text-[#27326f]"
  }`}
  on:click={handleSUIAuth}
>
  <img src={SUI} alt="" class="h-[24px] w-[24px]" />
  <div class="font-semibold text-[15px]">
    {$t("Connect _ Wallet", { name: "Sui" })}
  </div>

  <div
    class="flex items-center gap-1 text-sm font-medium bg-[#27326F] py-1 px-2 text-white rounded-[10px]"
  >
    1000
    <img src={Diamond} alt="" class="w-6 h-6" />
  </div>
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
