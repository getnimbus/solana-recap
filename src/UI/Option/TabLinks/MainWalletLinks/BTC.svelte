<script lang="ts">
  import mixpanel from "mixpanel-browser";
  import { isDarkMode, userPublicAddress } from "~/store";
  import { triggerToast } from "~/utils/functions";
  import { getAddress, signMessage } from "@orangecrypto/orange-connect";
  import { onMount } from "svelte";
  import { nimbus } from "~/lib/network";
  import { t } from "~/lib/i18n";
  import { useQueryClient } from "@tanstack/svelte-query";

  import BTC from "~/assets/chains/bitcoin.png";

  export let data;
  export let isPrimaryLogin;

  const queryClient = useQueryClient();

  const getAddressOptions: any = {
    payload: {
      purposes: ["ordinals"],
      message: "Address for receiving Ordinals",
      network: {
        type: "Mainnet",
      },
    },
    onFinish: (response: any) => {
      handleSignMessage(response?.addresses[0]?.address);
    },
    onCancel: () => console.log("Request canceled"),
  };

  let invitation = "";

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invitationParams = urlParams.get("invitation");
    if (invitationParams) {
      invitation = invitationParams;
    }
  });

  const handleBTCAuth = async () => {
    try {
      mixpanel.track("user_login_btc");
      await getAddress(getAddressOptions);
    } catch (e) {
      console.error(e);
      if (e?.message === "No Orange Bitcoin wallet installed") {
        triggerToast("No Orange Bitcoin wallet installed!", "fail");
        window.open(
          "https://chromewebstore.google.com/detail/orange-wallet/glmhbknppefdmpemdmjnjlinpbclokhn?hl=en&authuser=0",
          "_blank",
        );
      }
    }
  };

  const handleGetNonce = async (address: string) => {
    try {
      const res: any = await nimbus.post("/users/nonce", {
        publicAddress: address,
        referrer: invitation.length !== 0 ? invitation : undefined,
      });
      if (res && res.data) {
        return `I am signing my one-time nonce: ${res.data.nonce as string}`;
      }
      return "";
    } catch (e) {
      console.error("error: ", e);
      return "";
    }
  };

  const handleSignMessage = async (address: string) => {
    try {
      const nonceMsg = await handleGetNonce(address);
      if (!nonceMsg) return;

      await signMessage({
        payload: {
          network: {
            type: "Mainnet",
          },
          address,
          message: nonceMsg,
        },
        onFinish: (response: any) => {
          const payload = {
            signature: response,
            publicAddress: address?.toLowerCase(),
          };
          handleUpdatePublicAddress(payload);
        },
        onCancel: () => alert("Signature request canceled"),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePublicAddress = async (payload: any) => {
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

      queryClient.invalidateQueries(["link-socials"]);
      triggerToast("Your are successfully connect your BTC wallet!", "success");
    } catch (e) {
      console.log(e);
      triggerToast(
        "Something wrong when connect your BTC wallet. Please try again!",
        "fail",
      );
    }
  };
</script>

<div
  class={`flex items-center justify-center gap-2 text-white border cursor-pointer py-3 px-6 rounded-[12px] md:w-[340px] w-full ${
    $isDarkMode ? "border-white text-white" : "border-[#27326f] text-[#27326f]"
  }`}
  on:click={handleBTCAuth}
>
  <img src={BTC} alt="" class="h-[24px] w-[24px]" />
  <div class="font-semibold text-[15px]">
    {$t("Connect _ Wallet", { name: "BTC" })}
  </div>
</div>

<style></style>
