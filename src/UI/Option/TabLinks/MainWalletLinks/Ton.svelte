<script lang="ts">
  import mixpanel from "mixpanel-browser";
  import { isDarkMode, tonConnector, userPublicAddress } from "~/store";
  import { nimbus } from "~/lib/network";
  import { t } from "~/lib/i18n";
  import { useQueryClient } from "@tanstack/svelte-query";
  import { triggerBonusScore, triggerToast } from "~/utils/functions";
  import { v4 as uuidv4 } from "uuid";

  import Ton from "~/assets/chains/ton.png";
  import Diamond from "~/assets/Diamond.png";

  export let data;
  export let isPrimaryLogin;

  const queryClient = useQueryClient();

  const handleTonAuth = async () => {
    const uuid = uuidv4();
    if ($tonConnector?.connected) {
      $tonConnector.disconnect();
    }
    handleGetNonce(uuid);
  };

  const handleGetNonce = async (id: string) => {
    try {
      mixpanel.track("user_login_ton");
      const res: any = await nimbus.post("/users/nonce?verified=true", {
        publicAddress: id,
        referrer: undefined,
      });

      if (res && res.data) {
        const msg = `${res.data.nonce}`;

        $tonConnector.setConnectRequestParameters({
          state: "ready",
          value: { tonProof: msg },
        });

        $tonConnector.openModal();

        $tonConnector.onStatusChange((wallet) => {
          if (
            wallet &&
            wallet.connectItems?.tonProof &&
            "proof" in wallet.connectItems.tonProof
          ) {
            handleUpdatePublicAddress(wallet, id);
          }
        });
      }
    } catch (e) {
      if ($tonConnector?.connected) {
        $tonConnector.disconnect();
      }
    }
  };

  const handleUpdatePublicAddress = async (payload: any, id: any) => {
    try {
      const formatData = {
        account: {
          address: payload?.account?.address,
          chain: payload?.account?.chain,
          walletStateInit: payload?.account?.walletStateInit,
        },
        connectItems: {
          tonProof: {
            name: payload?.connectItems?.tonProof?.name,
            proof: {
              timestamp: payload?.connectItems?.tonProof?.proof?.timestamp,
              domain: {
                lengthBytes:
                  payload?.connectItems?.tonProof?.proof?.domain?.lengthBytes,
                value: payload?.connectItems?.tonProof?.proof?.domain?.value,
              },
              signature: payload?.connectItems?.tonProof?.proof?.signature,
            },
          },
        },
      };

      const params: any = {
        id: isPrimaryLogin ? data?.uid : $userPublicAddress,
        kind: "wallet",
        type: null,
        userPublicAddress: formatData?.account?.address,
        signature: formatData?.connectItems?.tonProof?.proof?.signature,
      };
      const res: any = await nimbus.post(
        `/accounts/link?loginId=${id}`,
        params,
      );
      if (res && res?.error) {
        triggerToast(res?.error, "fail");
        return;
      }

      triggerToast("Your are successfully connect your Ton wallet!", "success");
      triggerBonusScore(1000, 2000);
      queryClient.invalidateQueries(["link-socials"]);
      queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);
    } catch (e) {
      console.log(e);
      triggerToast(
        "Something wrong when connect your Ton wallet. Please try again!",
        "fail",
      );
    } finally {
      if ($tonConnector?.connected) {
        $tonConnector.disconnect();
      }
    }
  };
</script>

<div
  class={`flex items-center justify-center gap-2 text-white border cursor-pointer py-3 px-6 rounded-[12px] md:w-[340px] w-full ${
    $isDarkMode ? "border-white text-white" : "border-[#27326f] text-[#27326f]"
  }`}
  on:click={handleTonAuth}
>
  <img src={Ton} alt="" class="h-[24px] w-[24px]" />
  <div class="font-semibold text-[15px]">
    {$t("Connect _ Wallet", { name: "Ton" })}
  </div>

  <div
    class="flex items-center gap-1 text-sm font-medium bg-[#27326F] py-1 px-2 text-white rounded-[10px]"
  >
    1000
    <img src={Diamond} alt="" class="w-6 h-6" />
  </div>
</div>

<style>
</style>
