<script lang="ts">
  import mixpanel from "mixpanel-browser";
  import { isDarkMode, user, triggerConnectWallet } from "~/store";
  import { triggerToast } from "~/utils/functions";
  import { getAddress, signMessage } from "@orangecrypto/orange-connect";
  import { onMount } from "svelte";
  import { nimbus } from "~/lib/network";
  import { useQueryClient } from "@tanstack/svelte-query";

  import User from "~/assets/user.png";
  import BTC from "~/assets/chains/bitcoin.png";

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
          handleGetBTCToken(payload);
        },
        onCancel: () => alert("Signature request canceled"),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleGetBTCToken = async (data: any) => {
    try {
      const res: any = await nimbus.post("/auth/btc", data);
      if (res?.data?.result) {
        triggerConnectWallet.update((n) => (n = false));
        localStorage.setItem("token", res?.data?.result);
        user.update(
          (n) =>
            (n = {
              picture: User,
            }),
        );

        triggerToast("Login with BTC successfully!", "success");
        queryClient.invalidateQueries(["users-me"]);
        queryClient.invalidateQueries(["list-address"]);
      } else {
        triggerToast(res?.error, "fail");
      }
    } catch (e) {
      console.error("error: ", e);
      triggerToast(
        "There are some problem when login BTC account. Please try again!",
        "fail",
      );
    }
  };
</script>

<div
  class={`flex items-center justify-center gap-3 text-white border cursor-pointer rounded-[12px] w-[219px] h-[44px] ${
    $isDarkMode ? "border-white text-white" : "border-[#27326f] text-[#27326f]"
  }`}
  style="padding: 9px 21px 11px;"
  on:click={handleBTCAuth}
>
  <img src={BTC} alt="" class="h-[22px] w-[22px]" />
  <div class="font-normal text-[15px]">Log in with BTC</div>
</div>

<style></style>
