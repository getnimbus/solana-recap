<script lang="ts">
  import { onMount } from "svelte";
  import dayjs from "dayjs";
  import { useNavigate } from "svelte-navigator";
  import onboard from "~/lib/web3-onboard";
  import { ethers } from "ethers";
  import {
    user,
    isDarkMode,
    isShowHeaderMobile,
    triggerConnectWallet,
    userId,
    userPublicAddress,
    openModalSignMsgStashed,
    suiWalletInstance,
    nonceLogin,
    isTWA,
    isOpenModalRewardSwap,
    typeWallet,
    wallet,
  } from "~/store";
  import { nimbus } from "~/lib/network";
  import { t } from "~/lib/i18n";
  import mixpanel from "mixpanel-browser";
  import {
    triggerToast,
    triggerClickOutside,
    triggerBonusScore,
  } from "~/utils/functions";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import QRCode from "qrcode-generator";
  import CopyToClipboard from "svelte-copy-to-clipboard";
  import { wait } from "~/utils/index";
  import { WalletProvider } from "@aztemi/svelte-on-solana-wallet-adapter-ui";
  import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
  } from "@solana/wallet-adapter-wallets";
  import bs58 from "bs58";
  import { walletStore } from "@aztemi/svelte-on-solana-wallet-adapter-core";
  import { handleGetDataDailyCheckin } from "~/lib/queryAPI";
  import type { WalletState } from "nimbus-sui-kit";
  import { isNimbusVersion } from "~/utils/constants";
  import { AnimateSharedLayout, Motion } from "svelte-motion";
  import numeral from "numeral";

  import Languages from "~/components/Languages.svelte";
  import Percent from "~/components/Percent.svelte";
  import RandomAvatar from "~/components/RandomAvatar.svelte";
  import Tooltip from "~/components/Tooltip.svelte";
  import Copy from "~/components/Copy.svelte";
  import DarkMode from "~/components/DarkMode.svelte";
  import AppOverlay from "~/components/Overlay.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";
  import Button from "~/components/Button.svelte";
  import GoogleAuth from "./GoogleAuth.svelte";
  import TwitterAuth from "./TwitterAuth.svelte";
  import DiscordAuth from "./DiscordAuth.svelte";
  import TelegramAuth from "./TelegramAuth.svelte";
  import SuiAuth from "./SUIAuth.svelte";
  import SolanaAuth from "./SolanaAuth.svelte";
  import TonAuth from "./TonAuth.svelte";
  import BtcAuth from "./BTCAuth.svelte";

  import Gift from "~/assets/gift.png";
  import User from "~/assets/user.png";
  import Logo from "~/assets/logo-1.svg";
  import Reload from "~/assets/reload-black.svg";
  import ReloadWhite from "~/assets/reload-white.svg";
  import Evm from "~/assets/chains/evm.png";
  import TooltipNumber from "~/components/TooltipNumber.svelte";

  export let safeInfo;
  export let displayName;
  export let publicAddress;
  export let buyPackage = "Free";
  export let navActive;
  export let handleUpdateNavActive = (value: any) => {};
  export let handleSignOut = () => {};
  export let isShowSyncSession;

  const navigate = useNavigate();

  const linkRedirect = " https://app.getnimbus.io/settings?tab=links";

  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  let showPopover = false;
  let invitation = "";

  const queryClient = useQueryClient();

  let isOpenModalSync = false;
  let isCopied = false;
  let timer: any = null;
  let syncMobileCode: any;
  let qrImageDataUrl = "";

  let timeCountdown = 59;
  let timerCountdown: any;
  let loading = false;
  let isShowTooltipCopy = false;

  let discordCode = "";

  let teleUserData: any = {};

  $: {
    if (teleUserData && Object.keys(teleUserData).length !== 0) {
      if (localStorage.getItem("token")) {
        handleLinkTelegram(
          teleUserData?.id,
          teleUserData?.username,
          teleUserData?.first_name + teleUserData?.last_name,
        );
      } else {
        handleTelegramAuth(teleUserData);
      }
    }
  }

  $: {
    if (discordCode) {
      if (localStorage.getItem("token")) {
        handleDiscordAuthLink(discordCode);
      } else {
        handleDiscordAuth(discordCode);
      }
    }
  }

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invitationParams = urlParams.get("invitation");
    if (invitationParams) {
      invitation = invitationParams;
    }

    const codeParams = urlParams.get("code");
    if (codeParams) {
      discordCode = codeParams;
    }

    const teleIdParam = urlParams.get("id");
    const teleFirstNameParam = urlParams.get("first_name");
    const teleLastNameParam = urlParams.get("last_name");
    const teleUsernameParam = urlParams.get("username");
    const telePhotoUrlParam = urlParams.get("photo_url");
    const teleAuthDateParam = urlParams.get("auth_date");
    const teleHashParam = urlParams.get("hash");
    if (
      teleIdParam &&
      teleFirstNameParam &&
      teleLastNameParam &&
      teleUsernameParam &&
      telePhotoUrlParam &&
      teleAuthDateParam &&
      teleHashParam
    ) {
      teleUserData = {
        id: teleIdParam,
        first_name: teleFirstNameParam,
        last_name: teleLastNameParam,
        username: teleUsernameParam,
        photo_url: telePhotoUrlParam,
        auth_date: teleAuthDateParam,
        hash: teleHashParam,
      };
    }

    const token = localStorage.getItem("token");
    if (token) {
      user.update(
        (n) =>
          (n = {
            picture: User,
          }),
      );
    }
  });

  const handleGetCodeSyncMobile = async () => {
    loading = true;
    try {
      const res: any = await nimbus.get("/users/cross-login");
      if (res?.data) {
        syncMobileCode = res?.data?.code;
        const expiredAt = dayjs.unix(res?.data?.expiredAt);
        const currentTime = dayjs();

        // Check if the time difference is more than 1 minute
        if (currentTime.diff(expiredAt, "second") > 60) {
          // Make another API call to get a new sync code
          const newResponse = await nimbus.get("/users/cross-login");
          if (newResponse) {
            syncMobileCode = res?.data?.code;
          }
        } else {
          // Schedule the next check after 1 minute
          timer = setTimeout(handleGetCodeSyncMobile, 60000);

          timerCountdown = setInterval(() => {
            timeCountdown -= 1;
            if (timeCountdown < 0) {
              timeCountdown = 59;
              clearInterval(timerCountdown);
            }
          }, 1000);
        }
      }
    } catch (e) {
      syncMobileCode = undefined;
      timeCountdown = 59;
      clearTimeout(timer);
      clearInterval(timerCountdown);
      console.error("error: ", e);
    } finally {
      loading = false;
    }
  };

  // handle link Discord social
  const handleDiscordAuthLink = async (code: string) => {
    mixpanel.track("user_login_discord");
    try {
      const res: any = await nimbus.get(
        `/auth/discord/redirect?code=${code}&isWhiteLabel=${!Boolean(isNimbusVersion)}`,
      );
      if (res && res?.data) {
        handleLinkDiscord(
          res?.data?.userInfo?.id,
          res?.data?.userInfo?.email || null,
          res?.data?.userInfo?.global_name || "",
        );
      }
    } catch (e) {
      console.log("error: ", e);
    }
  };

  const handleLinkDiscord = async (id: any, info: any, displayName: any) => {
    try {
      let params: any = {
        kind: "social",
        id,
        type: "discord",
        info,
        displayName,
      };

      if (
        ($userPublicAddress && $userPublicAddress.length === 0) ||
        localStorage.getItem("public_address")
      ) {
        params = {
          ...params,
          userPublicAddress:
            $userPublicAddress || localStorage.getItem("public_address"),
        };
      }

      const response: any = await nimbus.post("/accounts/link", params);
      if (response && response?.error) {
        triggerToast(response?.error, "fail");
      } else {
        queryClient?.invalidateQueries(["link-socials"]);

        triggerToast("Successfully link Discord account!", "success");

        window.location.assign(linkRedirect);
      }
    } catch (e) {
      console.log(e);
      triggerToast(
        "There are some problem when link Discord account. Please try again!",
        "fail",
      );
    }
  };

  // handle link Telegram social
  const handleLinkTelegram = async (id: any, info: any, displayName: any) => {
    try {
      let params: any = {
        kind: "social",
        id,
        type: "telegram",
        info,
        displayName,
      };

      if (
        ($userPublicAddress && $userPublicAddress.length === 0) ||
        localStorage.getItem("public_address")
      ) {
        params = {
          ...params,
          userPublicAddress:
            $userPublicAddress || localStorage.getItem("public_address"),
        };
      }

      const response: any = await nimbus.post("/accounts/link", params);
      if (response && response?.error) {
        triggerToast(response?.error, "fail");
      } else {
        queryClient?.invalidateQueries(["link-socials"]);

        triggerToast("Successfully link Telegram account!", "success");

        window.location.assign(linkRedirect);
      }
    } catch (e) {
      console.log(e);
      triggerToast(
        "There are some problem when link Telegram account. Please try again!",
        "fail",
      );
    }
  };

  // handle Telegram login
  const handleTelegramAuth = async (data: any) => {
    if (localStorage.getItem("token")) {
      teleUserData = {};
      return;
    }

    mixpanel.track("user_login_telegram");
    try {
      const res: any = await nimbus.post("/auth/telegram", data);
      if (res?.data?.result) {
        triggerConnectWallet.update((n) => (n = false));
        localStorage.setItem("token", res?.data?.result);
        user.update(
          (n) =>
            (n = {
              picture: User,
            }),
        );

        triggerToast("Login with Telegram successfully!", "success");
        queryClient?.invalidateQueries(["users-me"]);
        queryClient.invalidateQueries(["list-address"]);
        queryClient?.invalidateQueries(["link-socials"]);
        window.history.replaceState(null, "", window.location.pathname);
      } else {
        triggerToast(res?.error, "fail");
      }
    } catch (e) {
      console.error("error: ", e);
      triggerToast(
        "There are some problem when login Telegram account. Please try again!",
        "fail",
      );
    }
  };

  // handle Discord login
  const handleDiscordAuth = async (code: string) => {
    mixpanel.track("user_login_discord");
    try {
      const res: any = await nimbus.get(
        `/auth/discord/redirect?code=${code}&isWhiteLabel=${!Boolean(isNimbusVersion)}`,
      );
      if (res && res?.data) {
        handleGetDiscordToken(
          res?.data?.userInfo?.id,
          res?.data?.userInfo?.username,
          res?.data?.userInfo?.global_name || "",
          res?.data?.userInfo?.email || null,
        );
      }
    } catch (e) {
      console.log("error: ", e);
    }
  };

  const handleGetDiscordToken = async (
    id: any,
    username: any,
    global_name: any,
    email: any,
  ) => {
    try {
      const res: any = await nimbus.post("/auth/discord", {
        id,
        username,
        global_name,
        email,
      });
      if (res?.data?.result) {
        triggerConnectWallet.update((n) => (n = false));
        localStorage.setItem("token", res?.data?.result);
        user.update(
          (n) =>
            (n = {
              picture: User,
            }),
        );

        triggerToast("Login with Discord successfully!", "success");
        queryClient?.invalidateQueries(["users-me"]);
        queryClient.invalidateQueries(["list-address"]);
        queryClient?.invalidateQueries(["link-socials"]);
        window.history.replaceState(null, "", window.location.pathname);
      } else {
        triggerToast(res?.error, "fail");
      }
    } catch (e) {
      console.error("error: ", e);
      triggerToast(
        "There are some problem when login Discord account. Please try again!",
        "fail",
      );
    }
  };

  // handle EVM login
  const connect = async () => {
    try {
      const res = await onboard.connectWallet();
      if (res && res.length !== 0) {
        handleGetNonce(res?.[0]?.provider, res?.[0]?.accounts[0]?.address);
      }
    } catch (e) {
      console.error("error: ", e);
    }
  };

  const handleSignAddressMessage = async (
    provider: any,
    signatureString: any,
  ) => {
    try {
      if (provider) {
        const ethersProvider = new ethers.BrowserProvider(provider, "any");
        const signer = await ethersProvider?.getSigner();
        const signature = await signer.signMessage(
          `I am signing my one-time nonce: ${signatureString}`,
        );
        if (signature) {
          return signature;
        } else {
          return "";
        }
      }
    } catch (e) {
      console.error("error: ", e);
    }
  };

  const wallets$ = onboard.state.select("wallets");

  const disconnect = (value: any) => {
    if (value && Object.keys(value).length !== 0) {
      onboard.disconnectWallet({ label: value.label });
    }
  };

  const handleGetNonce = async (provider: any, address: any) => {
    try {
      const res: any = await nimbus.post("/users/nonce", {
        publicAddress: address,
        referrer: invitation.length !== 0 ? invitation : undefined,
      });
      if (res && res.data) {
        const signatureString = await handleSignAddressMessage(
          provider,
          res.data.nonce,
        );
        if (signatureString) {
          const payload = {
            signature: signatureString,
            publicAddress: address?.toLowerCase(),
          };
          handleGetEVMToken(payload);
        }
      }
    } catch (e) {
      disconnect($wallets$?.[0]);
      console.error("error: ", e);
    }
  };

  const handleGetEVMToken = async (data: any) => {
    try {
      const res: any = await nimbus.post("/auth/evm", data);
      if (res?.data?.result) {
        triggerConnectWallet.update((n) => (n = false));
        localStorage.setItem("token", res?.data?.result);
        user.update(
          (n) =>
            (n = {
              picture: User,
            }),
        );

        triggerToast("Login with EVM successfully!", "success");
        queryClient?.invalidateQueries(["users-me"]);
        queryClient?.invalidateQueries(["list-address"]);
        queryClient?.invalidateQueries(["link-socials"]);
      } else {
        triggerToast(res?.error, "fail");
      }
    } catch (e) {
      console.error("error: ", e);
      triggerToast(
        "There are some problem when login EVM account. Please try again!",
        "fail",
      );
    }
  };

  // handle Solana login
  $: solanaPublicAddress = $walletStore?.publicKey?.toBase58();

  $: {
    if (solanaPublicAddress) {
      const token = localStorage.getItem("token");
      if (!token) {
        triggerConnectWallet.update((n) => (n = false));
        if ($user && Object.keys($user).length === 0) {
          handleGetSolanaNonce(solanaPublicAddress);
        }
      }
    }
  }

  const handleSignSolanaAddressMessage = async (signatureString: any) => {
    if ($walletStore.connected) {
      const res = await $walletStore?.signMessage(
        Uint8Array.from(
          Array.from(`I am signing my one-time nonce: ${signatureString}`).map(
            (letter) => letter.charCodeAt(0),
          ),
        ),
      );
      if (res) {
        return bs58.encode(res);
      } else {
        return "";
      }
    }
  };

  const handleGetSolanaNonce = async (address: any) => {
    try {
      const res: any = await nimbus.post("/users/nonce", {
        publicAddress: address,
        referrer: invitation.length !== 0 ? invitation : undefined,
      });
      if (res && res.data) {
        const signatureString = await handleSignSolanaAddressMessage(
          res?.data?.nonce,
        );
        if (signatureString) {
          const payload = {
            signature: signatureString,
            publicAddress: address,
          };
          handleGetSolanaToken(payload);
        }
      }
    } catch (e) {
      $walletStore.disconnect();
      console.error("error: ", e);
    }
  };

  const handleGetSolanaToken = async (data: any) => {
    try {
      const res: any = await nimbus.post("/auth/solana", data);
      if (res?.data?.result) {
        triggerConnectWallet.update((n) => (n = false));
        localStorage.setItem("token", res?.data?.result);
        user.update(
          (n) =>
            (n = {
              picture: User,
            }),
        );

        triggerToast("Login with Solana successfully!", "success");
        queryClient?.invalidateQueries(["users-me"]);
        queryClient?.invalidateQueries(["list-address"]);
        queryClient?.invalidateQueries(["link-socials"]);
      } else {
        triggerToast(res?.error, "fail");
      }
    } catch (e) {
      console.error("error: ", e);
      triggerToast(
        "There are some problem when login Solana account. Please try again!",
        "fail",
      );
    }
  };

  $: {
    if (syncMobileCode) {
      const qrcode = QRCode(0, "L");
      qrcode.addData(`https://app.getnimbus.io/?code=${syncMobileCode}`);
      qrcode.make();
      qrImageDataUrl = qrcode.createDataURL(7);
    }
  }

  $: {
    if ($triggerConnectWallet) {
      mixpanel.track("user_connect_wallet");
    }
  }

  const handleSignMsgFromStashed = async () => {
    const address = ($suiWalletInstance as WalletState)?.account?.address;
    const signature = await handleSignSUIAddressMessage($nonceLogin);
    if (signature) {
      const payload = {
        signature: signature.signature,
        publicAddress: address?.toLowerCase(),
      };
      handleGetSUIToken(payload);
    }
  };

  const handleSignSUIAddressMessage = async (nonce: string) => {
    const msg = await ($suiWalletInstance as WalletState).signPersonalMessage({
      message: new TextEncoder().encode(
        `I am signing my one-time nonce: ${nonce}`,
      ),
    });
    return msg;
  };

  const handleGetSUIToken = async (data: any) => {
    try {
      const res: any = await nimbus.post("/auth/sui", data);
      if (res?.data?.result) {
        triggerConnectWallet.update((n) => (n = false));
        localStorage.setItem("token", res?.data?.result);
        user.update(
          (n) =>
            (n = {
              picture: User,
            }),
        );

        triggerToast("Login with Sui successfully!", "success");
        queryClient.invalidateQueries(["users-me"]);
        queryClient.invalidateQueries(["list-address"]);
      } else {
        triggerToast(res?.error, "fail");
      }
    } catch (e) {
      console.error("error: ", e);
      triggerToast(
        "There are some problem when login Sui account. Please try again!",
        "fail",
      );
    } finally {
      openModalSignMsgStashed.update((n) => (n = false));
      if (
        ($suiWalletInstance as WalletState) &&
        ($suiWalletInstance as WalletState).connected
      ) {
        ($suiWalletInstance as WalletState).disconnect();
      }
    }
  };

  const tabModalReward = [
    {
      label: "Progress",
      value: "progress",
    },
    {
      label: "Rewards",
      value: "rewards",
    },
  ];

  const getRewardsProgress = async () => {
    return await nimbus
      .get(
        `/onchain/rewards/progress?chain=${$typeWallet === "MOVE" ? "SUI" : $typeWallet}`,
      )
      .then((res: any) => res?.data);
  };

  const handleRewardStatus = async () => {
    return await nimbus
      .get(
        `/onchain/rewards/claim-progress?chain=${$typeWallet === "MOVE" ? "SUI" : $typeWallet}`,
      )
      .then((res: any) => res?.data);
  };

  let swapRewards: any = [];
  let tabSelectedModalReward = "progress";
  let selectedReward: any;
  let isOpenConfirmReward = false;
  let isLoadingReward = false;

  let dataRewardStatus: any = [];

  $: querySwapRewardStatus = createQuery({
    queryKey: [
      "rewards-status",
      $isOpenModalRewardSwap,
      $wallet,
      tabSelectedModalReward,
    ],
    queryFn: () => handleRewardStatus(),
    enabled: Boolean(
      $user &&
        Object.keys($user)?.length !== 0 &&
        $wallet &&
        $isOpenModalRewardSwap &&
        tabSelectedModalReward === "rewards",
    ),
  });

  $: {
    if (
      !$querySwapRewardStatus.isError &&
      $querySwapRewardStatus.data !== undefined
    ) {
      dataRewardStatus = $querySwapRewardStatus?.data?.map((item: any) => {
        return {
          status: item?.log?.status,
          name: item?.log?.name,
          logo: item?.log?.logo,
          amount: item?.log?.max,
        };
      });
    }
  }

  $: querySwapRewardProgress = createQuery({
    queryKey: [
      "rewards-progress",
      $isOpenModalRewardSwap,
      $wallet,
      tabSelectedModalReward,
    ],
    queryFn: () => getRewardsProgress(),
    enabled: Boolean(
      $user &&
        Object.keys($user)?.length !== 0 &&
        $wallet &&
        $isOpenModalRewardSwap &&
        tabSelectedModalReward === "progress",
    ),
  });

  $: {
    if (
      !$querySwapRewardProgress.isError &&
      $querySwapRewardProgress.data !== undefined
    ) {
      swapRewards = $querySwapRewardProgress?.data?.swapRewards.filter(
        (item: any) => (item: any) => item.type !== "GM_POINT",
      );
    }
  }

  const handleReward = async (data: any) => {
    try {
      const response: any = await nimbus.post("/onchain/rewards/exchange", {
        token: data?.name,
      });

      if (response === undefined || response?.error) {
        return;
      }

      queryClient?.invalidateQueries(["rewards-progress"]);
      triggerToast("Exchange successfully!", "success");
      isOpenConfirmReward = false;
      selectedReward = {};
    } catch (e) {
      console.error(e);
    }
  };
</script>

{#if !isShowSyncSession}
  <div class="xl:block hidden">
    {#if $user && Object.keys($user).length !== 0}
      <div class="relative">
        <div
          class="xl:flex hidden flex-col gap-1 items-center py-1 relative xl:h-[50px] w-[50px]"
        >
          <div
            class="xl:w-[40px] xl:h-[40px] w-16 h-16 rounded-full overflow-hidden cursor-pointer mx-auto"
            on:click={() => (showPopover = !showPopover)}
          >
            <RandomAvatar />
          </div>
          {#if buyPackage !== "Free"}
            <div
              class="cursor-pointer flex items-center gap-1 absolute -bottom-1 left-1/2 transform -translate-x-1/2 z-9 rounded px-1 bg-[#ffb800]"
            >
              <div class="text-white text-xs">
                {#if buyPackage === "Explorer"}
                  Explorer
                {/if}
                {#if buyPackage === "Professional"}
                  Alpha
                {/if}
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="#fff"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M14.6629 3.5843C14.7217 3.57771 14.7811 3.58901 14.8339 3.61685C14.8867 3.64495 14.9305 3.68852 14.9599 3.74223C14.9893 3.79594 15.0031 3.85745 14.9994 3.91919L14.4836 12.7921H1.51642L1.00059 3.91919C0.996892 3.85745 1.01055 3.79592 1.0399 3.74216C1.06924 3.68841 1.11299 3.64476 1.16578 3.6166C1.21856 3.58843 1.27808 3.57697 1.33702 3.58362C1.39596 3.59026 1.45175 3.61473 1.49755 3.65401L4.60499 6.30708L7.76082 2.11502C7.79036 2.07895 7.82704 2.04999 7.86833 2.03014C7.90962 2.01028 7.95455 2 8.00001 2C8.04548 2 8.0904 2.01028 8.1317 2.03014C8.17299 2.04999 8.20967 2.07895 8.23921 2.11502L11.395 6.30708L14.5025 3.65401C14.5484 3.61511 14.6041 3.5909 14.6629 3.5843ZM1.55334 13.4273L1.55781 13.5041C1.577 13.827 1.71333 14.1301 1.93906 14.3518C2.1648 14.5735 2.46298 14.6971 2.77297 14.6976H13.2271C13.537 14.6971 13.8352 14.5735 14.061 14.3518C14.2867 14.1301 14.423 13.827 14.4422 13.5041L14.4467 13.4273H1.55334Z"
                  fill="#fff"
                />
              </svg>
            </div>
          {/if}
        </div>

        <div class="xl:hidden block">
          <div
            class="text-2xl font-medium text-white"
            on:click={() => {
              handleSignOut();
              showPopover = false;
              isShowHeaderMobile.update((n) => (n = false));
            }}
          >
            {$t("Log out")}
          </div>
        </div>

        {#if showPopover}
          <div
            class="select_content absolute top-15 right-0 z-50 flex flex-col gap-1 px-3 xl:py-2 py-3 text-sm transform rounded-lg w-max"
            style="box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.15);"
            use:triggerClickOutside
            on:click_outside={() => (showPopover = false)}
          >
            <div
              class="flex flex-col gap-3 mx-2 pt-1 pb-2 border-b-[1px] border_0000001a"
            >
              <div class="text-base flex items-center gap-1">
                GM 👋,
                {#if displayName}
                  {displayName}
                {:else}
                  <Copy
                    address={localStorage.getItem("public_address") ||
                      publicAddress}
                    iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                    color={`${$isDarkMode ? "#fff" : "#000"}`}
                    isShorten
                    textTooltip="Copy"
                  />
                {/if}
              </div>
              <div class="flex flex-col gap-2">
                <DarkMode />
                {#if isNimbusVersion}
                  <Languages />
                {/if}
              </div>
            </div>

            {#if isNimbusVersion}
              <!-- <div
                class={`flex items-center gap-1 cursor-pointer rounded-md transition-all px-2 py-1 ${
                  $isDarkMode
                    ? navActive === "/upgrade"
                      ? "bg-[#222222]"
                      : "hover:bg-[#222222]"
                    : navActive === "/upgrade"
                      ? "bg-[#eff0f4]"
                      : "hover:bg-[#eff0f4]"
                }`}
                on:click={() => {
                  showPopover = false;
                  navigate("/upgrade");
                  handleUpdateNavActive("/upgrade");
                }}
              >
                <div class="font-medium text-yellow-400 text-base">
                  {$t("Upgrade")}
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="#ffb800"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M14.6629 3.5843C14.7217 3.57771 14.7811 3.58901 14.8339 3.61685C14.8867 3.64495 14.9305 3.68852 14.9599 3.74223C14.9893 3.79594 15.0031 3.85745 14.9994 3.91919L14.4836 12.7921H1.51642L1.00059 3.91919C0.996892 3.85745 1.01055 3.79592 1.0399 3.74216C1.06924 3.68841 1.11299 3.64476 1.16578 3.6166C1.21856 3.58843 1.27808 3.57697 1.33702 3.58362C1.39596 3.59026 1.45175 3.61473 1.49755 3.65401L4.60499 6.30708L7.76082 2.11502C7.79036 2.07895 7.82704 2.04999 7.86833 2.03014C7.90962 2.01028 7.95455 2 8.00001 2C8.04548 2 8.0904 2.01028 8.1317 2.03014C8.17299 2.04999 8.20967 2.07895 8.23921 2.11502L11.395 6.30708L14.5025 3.65401C14.5484 3.61511 14.6041 3.5909 14.6629 3.5843ZM1.55334 13.4273L1.55781 13.5041C1.577 13.827 1.71333 14.1301 1.93906 14.3518C2.1648 14.5735 2.46298 14.6971 2.77297 14.6976H13.2271C13.537 14.6971 13.8352 14.5735 14.061 14.3518C14.2867 14.1301 14.423 13.827 14.4422 13.5041L14.4467 13.4273H1.55334Z"
                    fill="#ffb800"
                  />
                </svg>
              </div> -->

              <div
                class={`flex items-center gap-1 cursor-pointer rounded-md transition-all px-2 py-1 ${
                  $isDarkMode ? "hover:bg-[#222222]" : "hover:bg-[#eff0f4]"
                }`}
                on:click={() => {
                  showPopover = false;
                  isOpenModalRewardSwap.update((n) => (n = true));
                }}
              >
                <div class="text_00000066 text-base">
                  {$t("Rewards")}
                </div>
                <div class="w-[16px] h-[16px] flex items-center">
                  <img
                    src={Gift}
                    alt="gift"
                    class="w-full h-full object-cover"
                    style="transform: scale(2);"
                  />
                </div>
              </div>

              <div
                class={`text_00000066 cursor-pointer text-base rounded-md transition-all px-2 py-1 ${
                  $isDarkMode
                    ? navActive === "/profile"
                      ? "bg-[#222222]"
                      : "hover:bg-[#222222]"
                    : navActive === "/profile"
                      ? "bg-[#eff0f4]"
                      : "hover:bg-[#eff0f4]"
                }`}
                on:click={() => {
                  showPopover = false;
                  navigate(`/profile?id=${$userId}`);
                  handleUpdateNavActive("/profile");
                }}
              >
                {$t("My Profile")}
              </div>

              <div
                class={`text_00000066 cursor-pointer text-base rounded-md transition-all px-2 py-1 ${
                  $isDarkMode ? "hover:bg-[#222222]" : "hover:bg-[#eff0f4]"
                }`}
                on:click={() => {
                  showPopover = false;
                  isOpenModalSync = true;
                  handleGetCodeSyncMobile();
                }}
              >
                {$t("View on Mobile")}
              </div>

              <div
                class={`text_00000066 cursor-pointer text-base rounded-md transition-all px-2 py-1 ${
                  $isDarkMode
                    ? navActive === "/invitation"
                      ? "bg-[#222222]"
                      : "hover:bg-[#222222]"
                    : navActive === "/invitation"
                      ? "bg-[#eff0f4]"
                      : "hover:bg-[#eff0f4]"
                }`}
                on:click={() => {
                  showPopover = false;
                  navigate("/invitation");
                  handleUpdateNavActive("/invitation");
                }}
              >
                {$t("Invite")}
              </div>

              <div
                class={`text_00000066 cursor-pointer text-base rounded-md transition-all px-2 py-1 ${
                  $isDarkMode
                    ? navActive === "/virtual-portfolio"
                      ? "bg-[#222222]"
                      : "hover:bg-[#222222]"
                    : navActive === "/virtual-portfolio"
                      ? "bg-[#eff0f4]"
                      : "hover:bg-[#eff0f4]"
                }`}
                on:click={() => {
                  showPopover = false;
                  navigate(
                    `/virtual-portfolio?type=main&address=${$userPublicAddress}`,
                  );
                  handleUpdateNavActive("/virtual-portfolio");
                }}
              >
                Paper Trade
              </div>
            {/if}

            <div
              class={`text_00000066 cursor-pointer text-base rounded-md transition-all px-2 py-1 ${
                $isDarkMode
                  ? navActive === "/settings"
                    ? "bg-[#222222]"
                    : "hover:bg-[#222222]"
                  : navActive === "/settings"
                    ? "bg-[#eff0f4]"
                    : "hover:bg-[#eff0f4]"
              }`}
              on:click={() => {
                showPopover = false;
                navigate("/settings");
                handleUpdateNavActive("/settings");
              }}
            >
              {$t("Settings")}
            </div>

            <div
              class={`font-medium text-red-500 cursor-pointer text-base rounded-md transition-all px-2 py-1 ${
                $isDarkMode ? "hover:bg-[#222222]" : "hover:bg-[#eff0f4]"
              }`}
              on:click={() => {
                handleSignOut();
                showPopover = false;
              }}
            >
              {$t("Log out")}
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div>
        {#if isNimbusVersion}
          <Button
            on:click={() => {
              triggerConnectWallet.update((n) => (n = true));
              mixpanel.track("user_connect_wallet");
              isShowHeaderMobile.update((n) => (n = false));
            }}
            variant="tertiary"
          >
            <div
              class="text-sm font-semibold text-white cursor-pointer w-full py-[1px]"
            >
              {$t("Connect Wallet")}
            </div>
          </Button>
        {/if}
      </div>
    {/if}
  </div>
{/if}

{#if isNimbusVersion}
  {#if isShowSyncSession && !$isTWA}
    <div class="xl:hidden block">
      <div
        class="text-xl font-medium text-gray-300 cursor-pointer"
        on:click={() => {
          isOpenModalSync = true;
          handleGetCodeSyncMobile();
        }}
      >
        {$t("View on Mobile")}
      </div>
    </div>
  {/if}
{/if}

<WalletProvider localStorageKey="walletAdapter" {wallets} autoConnect />

<!-- Modal rewards swap -->
<AppOverlay
  clickOutSideToClose
  isOpen={$isOpenModalRewardSwap}
  on:close={() => {
    isOpenModalRewardSwap.update((n) => (n = false));
  }}
>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1 items-start">
      <div class="title-3 font-semibold">
        {$t("My Swap Rewards")}
      </div>
      <div class="text-sm text-gray-500">
        {$t(
          "Hit the threshold and tokens will be available to claim to your wallet",
        )}
      </div>
    </div>

    <div class="flex flex-wrap items-center xl:gap-2 gap-y-2 gap-x-1">
      <AnimateSharedLayout>
        {#each tabModalReward as type}
          <div
            class="relative cursor-pointer text-base font-medium py-1 px-3 rounded-[100px] transition-all"
            id={type.value}
            on:click={() => {
              tabSelectedModalReward = type.value;
            }}
          >
            <div
              class={`relative z-1 ${tabSelectedModalReward === type.value && "text-white"}`}
            >
              {$t(type.label)}
            </div>

            {#if type.value === tabSelectedModalReward}
              <Motion
                let:motion
                layoutId="active-pill"
                transition={{ type: "spring", duration: 0.6 }}
              >
                <div
                  class="absolute inset-0 rounded-full bg-[#1E96FC] z-0"
                  use:motion
                />
              </Motion>
            {/if}
          </div>
        {/each}
      </AnimateSharedLayout>
    </div>

    {#if tabSelectedModalReward === "progress"}
      {#if swapRewards.length !== 0}
        <div class="flex flex-col gap-4">
          {#each swapRewards || [] as item}
            <div
              class="flex justify-between gap-6 cursor-pointer"
              on:click={() => {
                if (Number(item?.amount || 0) < Number(item?.cost || 0)) {
                  return;
                }
                selectedReward = item;
                isOpenConfirmReward = true;
              }}
            >
              <div class="flex-[0.7] flex items-center gap-2">
                <div class="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={item?.logo}
                    alt=""
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="font-medium text-sm">{item?.name}</div>
              </div>

              <div class="flex-1 opacity-100">
                <Percent
                  percent={Number(item?.amount || 0)}
                  max={Number(item?.cost || 0)}
                />
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div
          class="flex justify-center items-center h-full py-4 px-3 text-lg text-gray-400"
        >
          {$t("Empty")}
        </div>
      {/if}
    {/if}

    {#if tabSelectedModalReward === "rewards"}
      <div
        class={`rounded-[10px] border border_0000000d overflow-hidden ${
          $isDarkMode ? "bg-[#131313]" : "bg-[#fff]"
        }`}
      >
        <table class="table-auto w-full h-full">
          <thead>
            <tr class="bg_f4f5f8">
              <th class="pl-3 py-3 rounded-tl-[10px]">
                <div class="text-left text-xs uppercase font-medium">
                  {$t("Assets")}
                </div>
              </th>

              <th class="py-3">
                <div class="text-left text-xs uppercase font-medium">
                  {$t("Amount")}
                </div>
              </th>

              <th class="pr-3 py-3 rounded-tr-[10px]">
                <div class="text-left text-xs uppercase font-medium">
                  {$t("Status")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {#if dataRewardStatus && dataRewardStatus?.length === 0}
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
              {#each dataRewardStatus || [] as item}
                <tr
                  class={`cursor-pointer group transition-all ${
                    $isDarkMode ? "text-gray-400" : "text-[#666666]"
                  }`}
                >
                  <td
                    class={`py-3 pl-3 ${
                      $isDarkMode
                        ? "group-hover:bg-[#000]"
                        : "group-hover:bg-gray-100"
                    }`}
                  >
                    <div
                      class="flex items-center justify-start gap-1 text-sm font-medium"
                    >
                      <div class="w-8 h-8 rounded-full overflow-hidden">
                        <img
                          src={item?.logo}
                          alt=""
                          class="w-full h-full object-cover"
                        />
                      </div>
                      <div class="font-medium text-sm">{item?.name}</div>
                    </div>
                  </td>

                  <td
                    class={`py-3 ${
                      $isDarkMode
                        ? "group-hover:bg-[#000]"
                        : "group-hover:bg-gray-100"
                    }`}
                  >
                    <div
                      class="flex items-center justify-start gap-1 text-sm font-medium"
                    >
                      <TooltipNumber
                        number={item?.amount || 0}
                        type="balance"
                      />
                    </div>
                  </td>

                  <td
                    class={`py-3 pr-3 ${
                      $isDarkMode
                        ? "group-hover:bg-[#000]"
                        : "group-hover:bg-gray-100"
                    }`}
                  >
                    <div
                      class="text-left text-sm uppercase font-medium text-[#00A878]"
                    >
                      {item?.status}
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</AppOverlay>

<!-- Modal confirm rewards -->
<AppOverlay
  clickOutSideToClose
  isOpen={isOpenConfirmReward}
  on:close={() => (isOpenConfirmReward = false)}
>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col items-start gap-1">
      <div class="font-semibold title-3">Are you sure?</div>
      <div class="text-gray-500 text-sm">
        Do you really want to reward this token? This process cannot revert
      </div>
    </div>

    <div class="flex justify-end gap-4">
      <div class="w-[120px]">
        <Button
          variant="secondary"
          on:click={() => {
            isOpenConfirmReward = false;
            selectedReward = {};
          }}
        >
          Cancel
        </Button>
      </div>

      <div class="w-[120px]">
        <Button
          on:click={() => {
            handleReward(selectedReward);
          }}
          type="submit"
          variant="tertiary"
          isLoading={isLoadingReward}
          disabled={isLoadingReward}
        >
          Confirm
        </Button>
      </div>
    </div>
  </div>
</AppOverlay>

<!-- Modal sync user to mobile -->
<AppOverlay
  clickOutSideToClose
  isOpen={isOpenModalSync}
  on:close={() => {
    isOpenModalSync = false;
    timeCountdown = 59;
    clearTimeout(timer);
    clearInterval(timerCountdown);
  }}
>
  <div class="flex flex-col gap-4 xl:py-0 py-6">
    <div class="flex flex-col gap-1 items-start">
      <div class="title-3 font-semibold">{$t("View on Mobile")}</div>
      <div class="text-sm text-gray-500">
        {$t("More convenience")}
      </div>
    </div>
    <div class="flex flex-col gap-1 justify-center items-center">
      <div class="text-sm">
        {$t("The code is expired in")}
        {timeCountdown}s
      </div>
      <div class="flex items-center gap-2">
        <div
          class="cursor-pointer"
          class:loading
          on:click={() => {
            syncMobileCode = undefined;
            timeCountdown = 59;
            clearTimeout(timer);
            clearInterval(timerCountdown);
            handleGetCodeSyncMobile();
          }}
        >
          <img
            src={$isDarkMode ? ReloadWhite : Reload}
            alt=""
            class="w-4 h-4 xl:w-3 xl:h-3"
          />
        </div>
        <div class="text-sm">{$t("Generate new code")}</div>
      </div>
    </div>
    <div class="flex justify-center items-center -mt-2">
      <div
        class="border rounded-xl overflow-hidden bg-white md:w-[57%] w-[77%]"
      >
        <div class="bg-[#f3f4f6] py-2 px-4">
          <img
            src={Logo}
            alt="Logo"
            loading="lazy"
            decoding="async"
            class="h-12 w-auto -ml-3"
          />
        </div>
        {#if loading}
          <div class="flex justify-center items-center h-60">
            {#if isNimbusVersion}
              <LoadingPremium />
            {:else}
              <Loading />
            {/if}
          </div>
        {:else}
          <div class="flex justify-center">
            {#if qrImageDataUrl !== undefined}
              <img src={qrImageDataUrl} alt="QR Code" />
            {:else}
              <div class="flex flex-col items-center gap-1 text-sm py-30">
                <div>{$t("Something wrong when generate QR code.")}</div>
                <div
                  class="text-blue-500 cursor-pointer"
                  on:click={() => {
                    handleGetCodeSyncMobile();
                  }}
                >
                  {$t("Try again")}
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <div class="text-xs text-center font-medium text-[#9ca3af] px-4 pb-3">
          {$t("Investment in crypto more convenience")}
          {#if isNimbusVersion}{$t("with")}
            Nimbus{/if}
        </div>
      </div>
    </div>
    <div class="flex flex-col items-center mt-2 gap-4">
      <div class="md:w-[57%] w-[77%]">
        <CopyToClipboard
          text={syncMobileCode}
          let:copy
          on:copy={async () => {
            isCopied = true;
            await wait(1000);
            isCopied = false;
          }}
        >
          <div class="flex items-center gap-2">
            <div class="flex-1 border rounded-lg py-2 px-3 text-base">
              {#if loading}
                -
              {:else}
                {syncMobileCode}
              {/if}
            </div>
            <div
              class="cursor-pointer border w-max p-2 rounded-lg relative"
              on:click={copy}
              on:mouseover={() => {
                isShowTooltipCopy = true;
              }}
              on:mouseleave={() => (isShowTooltipCopy = false)}
            >
              {#if isCopied}
                <svg
                  width={21}
                  height={21}
                  id="Layer_1"
                  data-name="Layer 1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 122.88 74.46"
                  fill={$isDarkMode ? "#fff" : "#000"}
                  ><path
                    fill-rule="evenodd"
                    d="M1.87,47.2a6.33,6.33,0,1,1,8.92-9c8.88,8.85,17.53,17.66,26.53,26.45l-3.76,4.45-.35.37a6.33,6.33,0,0,1-8.95,0L1.87,47.2ZM30,43.55a6.33,6.33,0,1,1,8.82-9.07l25,24.38L111.64,2.29c5.37-6.35,15,1.84,9.66,8.18L69.07,72.22l-.3.33a6.33,6.33,0,0,1-8.95.12L30,43.55Zm28.76-4.21-.31.33-9.07-8.85L71.67,4.42c5.37-6.35,15,1.83,9.67,8.18L58.74,39.34Z"
                  /></svg
                >
              {:else}
                <svg
                  width={21}
                  height={21}
                  viewBox="0 0 12 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.1875 3.3125H10.6875V10.1875H3.8125V7.6875"
                    stroke={$isDarkMode ? "#fff" : "#000"}
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M8.1875 0.8125H1.3125V7.6875H8.1875V0.8125Z"
                    stroke={$isDarkMode ? "#fff" : "#000"}
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              {/if}
              {#if isShowTooltipCopy}
                <div
                  class="absolute left-1/2 transform -translate-x-1/2 -top-8"
                  style="z-index: 2147483648;"
                >
                  <Tooltip text={$t("Copy code")} />
                </div>
              {/if}
            </div>
          </div>
        </CopyToClipboard>
      </div>
    </div>
    <div class="flex flex-col items-center mt-2 gap-4">
      <div class="border-t-[1px] relative md:w-[57%] w-[77%]">
        <div
          class={`absolute top-[-10px] left-1/2 transform -translate-x-1/2 text-gray-400 text-xs px-2 ${
            $isDarkMode ? "bg-[#0f0f0f]" : "bg-white"
          }`}
        >
          {$t("Or open Telegram")}
        </div>
      </div>
      <div class="md:w-[57%] w-[77%]">
        <a
          href={`https://t.me/GetNimbusBot?start=sync-${syncMobileCode}`}
          target="_blank"
        >
          <Button variant="primary">{$t("Sync to Telegram")}</Button>
        </a>
      </div>
    </div>
  </div>
</AppOverlay>

<!-- Modal connect wallet -->
<AppOverlay
  clickOutSideToClose
  isOpen={$triggerConnectWallet}
  on:close={() => {
    triggerConnectWallet.update((n) => (n = false));
  }}
>
  <div class="flex flex-col gap-4 mt-10">
    <div class="title-3 font-medium text-center">
      {$t("Login to enjoy more features")}
    </div>
    <div class="flex flex-col items-center justify-center gap-4">
      {#if isNimbusVersion}
        <div
          class={`flex items-center justify-center gap-3 text-white border cursor-pointer rounded-[12px] w-[219px] h-[42px] ${
            $isDarkMode
              ? "border-white text-white"
              : "border-[#27326f] text-[#27326f]"
          }`}
          on:click={() => {
            connect();
            mixpanel.track("user_login_evm");
          }}
        >
          <img src={Evm} alt="" width="24" height="24" />
          <div class="font-normal text-[15px]">Log in with EVM</div>
        </div>
        {#if safeInfo && Object.keys(safeInfo).length === 0}
          <BtcAuth />
          <SolanaAuth text="Log in with Solana" />
        {/if}
        <TonAuth />
        {#if safeInfo && Object.keys(safeInfo).length === 0}
          <SuiAuth />
        {/if}
      {/if}

      <GoogleAuth />
      <TwitterAuth />
      <DiscordAuth />

      {#if isNimbusVersion}
        {#if safeInfo && Object.keys(safeInfo).length === 0}
          <TelegramAuth />
        {/if}
      {/if}
    </div>
  </div>
</AppOverlay>

<!-- Modal sign msg from Stashed -->
<AppOverlay
  clickOutSideToClose
  isOpen={$openModalSignMsgStashed}
  on:close={() => {
    openModalSignMsgStashed.update((n) => (n = false));
  }}
>
  <div class="flex flex-col gap-4 mt-10">
    <div class="title-3 font-medium text-center">
      {$t("Sign your Stashed Wallet to connect")}
      {#if isNimbusVersion}Nimbus{/if}
    </div>
    <div class="flex justify-center gap-2">
      <div class="w-[120px]">
        <Button
          variant="secondary"
          on:click={() => {
            openModalSignMsgStashed.update((n) => (n = false));
            if ($suiWalletInstance && $suiWalletInstance?.connected) {
              $suiWalletInstance?.disconnect();
            }
          }}
        >
          {$t("Cancel")}
        </Button>
      </div>
      <div class="w-[120px]">
        <Button
          type="submit"
          variant="tertiary"
          on:click={() => {
            handleSignMsgFromStashed();
          }}
        >
          {$t("Submit")}
        </Button>
      </div>
    </div>
  </div>
</AppOverlay>

<style>
  :global(body) .select_content {
    background: #ffffff;
    border: 0.5px solid transparent;
  }
  :global(body.dark) .select_content {
    background: #131313;
    border: 0.5px solid #cdcdcd59;
  }

  .loading {
    animation-name: loading;
    animation-duration: 1.4s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  }

  @keyframes loading {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
