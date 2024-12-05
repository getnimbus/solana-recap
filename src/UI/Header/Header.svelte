<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { useNavigate, useMatch } from "svelte-navigator";
  import {
    tab,
    chain,
    wallet,
    selectedPackage,
    isDarkMode,
    user,
    typeWallet,
    isShowHeaderMobile,
    userId,
    userPublicAddress,
    triggerSync,
    triggerModalAddAddress,
    triggerConnectWallet,
    totalTokens,
    totalAirdrops,
    totalNfts,
    totalPositions,
    unrealizedProfit,
    realizedProfit,
    pastProfit,
    tonConnector,
    suiWalletInstance,
    safeInfoData,
    isTWA,
    showPopoverSearch,
    isOpenModalRewardSwap,
  } from "~/store";
  import { shorterAddress } from "~/utils/index";
  import mixpanel from "mixpanel-browser";
  import { Motion } from "svelte-motion";
  import {
    showChangeLogAnimationVariants,
    isNimbusVersion,
  } from "~/utils/constants";
  import { nimbus } from "~/lib/network";
  import { t } from "~/lib/i18n";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import * as browser from "webextension-polyfill";
  import Mousetrap from "mousetrap";
  import addGlobalBinds from "bind-mousetrap-global";
  addGlobalBinds(Mousetrap);
  import {
    bigGeneration,
    detectedGeneration,
    otherGeneration,
  } from "~/lib/chains";
  import onboard from "~/lib/web3-onboard";
  import { walletStore } from "@aztemi/svelte-on-solana-wallet-adapter-core";
  import type { WalletState } from "nimbus-sui-kit";
  import {
    getListAddress,
    getUserInfo,
    handleValidateAddress,
  } from "~/lib/queryAPI";
  import { triggerToast } from "~/utils/functions";

  import tooltip from "~/lib/tooltip";

  import Languages from "~/components/Languages.svelte";
  import Auth from "~/UI/Auth/Auth.svelte";
  import Copy from "~/components/Copy.svelte";
  import AppOverlay from "~/components/Overlay.svelte";
  import Button from "~/components/Button.svelte";
  import DarkModeFooter from "../Footer/DarkModeFooter.svelte";
  import Banner from "~/UI/Banner/Banner.svelte";

  import Gift from "~/assets/gift.png";
  import Logo from "~/assets/logo-white.svg";
  import LogoBlack from "~/assets/logo-2.png";
  import PortfolioIcon from "~/assets/portfolio.svg";
  import VirtualPortfolioIcon from "~/assets/virtual_portfolio.svg";
  import WhaleIcon from "~/assets/whale.svg";
  import AnalyticIcon from "~/assets/analytic.svg";
  import SettingsIcon from "~/assets/settings.svg";
  import Search from "~/assets/search.svg";
  import SearchBlack from "~/assets/search-black.svg";
  import Crown from "~/assets/crown.svg";
  import Chat from "~/assets/chat.svg";
  import User from "~/assets/user.png";
  import Diamond from "~/assets/Diamond.png";
  import Bell from "~/assets/bell.svg";
  import ChangeLogIcon from "~/assets/change-log.svg";

  export let safeAppsSdk;
  export let navActive;
  export let handleUpdateNavActive = (value: any) => {};

  let safeInfo = {};
  let safeChain = {};

  const handleGetSafeAppInfo = async () => {
    safeInfo = await safeAppsSdk.safe.getInfo();
    safeChain = await safeAppsSdk.safe.getChainInfo();
    safeInfoData.update((n) => (n = safeInfo));
    console.log("HELLO WORLD: ", safeInfo);
    console.log("HI WORLD: ", safeChain);
  };

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  let userID = "";

  let search = "";
  let listAddress: any = [];
  let suggestList: any = [];
  let selectedIndexAddress = 0;
  let listAddressElement: any;
  let indexSelectedAddressResult = -1;

  // query list address
  $: query = createQuery({
    queryKey: ["list-address"],
    queryFn: () => getListAddress(),
    enabled: Boolean($user && Object.keys($user).length !== 0),
  });

  $: {
    if (
      !$query.isError &&
      $query?.data !== undefined &&
      $query?.data.length !== 0
    ) {
      formatDataListAddress($query?.data);
    }
  }

  const formatDataListAddress = (data: any) => {
    const structWalletData = data.map((item: any) => {
      return {
        id: item.id,
        type: item.type,
        label: item.label,
        value: item.accountId,
        logo: detectedGeneration(item.type),
        accounts:
          item?.accounts?.map((account: any) => {
            return {
              id: account?.id,
              type: account?.type,
              label: account?.label,
              value: account?.accountId,
              logo: detectedGeneration(account?.type),
            };
          }) || [],
      };
    });
    listAddress = structWalletData;
  };

  $: listBundle = listAddress.filter((item: any) => item.type === "BUNDLE");
  $: listAddressWithoutBundle = listAddress.filter(
    (item: any) => item.type !== "BUNDLE",
  );

  let isDisabled = false;

  $: {
    if ($selectedPackage === "FREE" && listAddressWithoutBundle?.length > 3) {
      isDisabled = true;
    } else if (
      $selectedPackage === "EXPLORER" &&
      listAddressWithoutBundle?.length > 7
    ) {
      isDisabled = true;
    } else {
      isDisabled = false;
    }
  }

  const getSuggestList = async () => {
    const suggestListRes = localStorage.getItem("SearchSuggestList");
    if (suggestListRes) {
      suggestList = JSON.parse(suggestListRes);
    }
  };

  const handleSaveSuggest = (value: string) => {
    if (!suggestList.includes(value)) {
      if (suggestList.length < 3) {
        suggestList = [...suggestList, value];
      } else {
        suggestList = [...suggestList.slice(1), value];
      }
    }
  };

  $: {
    if (suggestList.length !== 0) {
      localStorage.setItem("SearchSuggestList", JSON.stringify(suggestList));
    }
  }

  const handleSearchAddress = async (value: string, isFromProfile = false) => {
    if (value) {
      totalTokens.update((n) => (n = 0));
      totalAirdrops.update((n) => (n = 0));
      totalNfts.update((n) => (n = 0));
      totalPositions.update((n) => (n = 0));
      unrealizedProfit.update((n) => (n = 0));
      realizedProfit.update((n) => (n = 0));
      pastProfit.update((n) => (n = 0));

      mixpanel.track("user_search");
      const validateAccount = await handleValidateAddress(value);

      if (validateAccount.address.length === 0) {
        if (isFromProfile) {
          navigate("/");
        }
        triggerToast("Invalid address", "fail");
        return;
      }

      if (!isNimbusVersion && !isFromProfile) {
        handleWhiteLabelAuth(validateAccount?.address);
      }

      chain.update((n) => (n = "ALL"));
      wallet.update((n) => (n = validateAccount?.address));
      typeWallet.update((n) => (n = validateAccount?.type));

      browser.storage.sync.set({
        selectedWallet: validateAccount?.address,
      });
      browser.storage.sync.set({ selectedChain: "ALL" });
      browser.storage.sync.set({
        typeWalletAddress: validateAccount?.type,
      });

      if (isFromProfile) {
        if (bigGeneration.includes(validateAccount?.type)) {
          navigate(
            `/?tab=${$tab}&type=${validateAccount?.type}&chain=ALL&address=${validateAccount?.address}`,
          );
        }
        if (otherGeneration.includes(validateAccount?.type)) {
          navigate(
            `/?tab=${$tab}&type=${validateAccount?.type}&address=${validateAccount?.address}`,
          );
        }
      }

      if (!isFromProfile) {
        if (window.location.pathname === "/whales") {
          if (bigGeneration.includes(validateAccount?.type)) {
            navigate(
              `/?tab=${$tab}&type=${validateAccount?.type}&chain=ALL&address=${validateAccount?.address}`,
            );
          }
          if (otherGeneration.includes(validateAccount?.type)) {
            navigate(
              `/?tab=${$tab}&type=${validateAccount?.type}&address=${validateAccount?.address}`,
            );
          }
        } else {
          if (bigGeneration.includes(validateAccount?.type)) {
            window.history.replaceState(
              null,
              "",
              window.location.pathname +
                `?tab=${$tab}&type=${validateAccount?.type}&chain=ALL&address=${validateAccount?.address}`,
            );
          }
          if (otherGeneration.includes(validateAccount?.type)) {
            window.history.replaceState(
              null,
              "",
              window.location.pathname +
                `?tab=${$tab}&type=${validateAccount?.type}&address=${validateAccount?.address}`,
            );
          }
        }
      }

      handleSaveSuggest(validateAccount?.address);

      showPopoverSearch.update((n) => (n = false));
      search = "";
    }
  };

  const absoluteMatch = useMatch("/profile/:address");

  $: $absoluteMatch
    ? handleSearchAddress($absoluteMatch.params.address, true)
    : null;

  const handleSearch = (event: any) => {
    search = event.target.value;
  };

  const handleWhiteLabelAuth = async (address: string) => {
    try {
      const response: any = await nimbus.post("/auth/whitelabel", {
        publicAddress: address,
      });
      if (response?.data?.result) {
        localStorage.setItem("token", response?.data?.result);
        user.update(
          (n) =>
            (n = {
              picture: User,
            }),
        );

        queryClient.invalidateQueries(["users-me"]);
        queryClient.invalidateQueries(["list-address"]);
      } else {
        console.error("error: ", response.error);
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

  const handleSignOut = () => {
    mixpanel.track("user_logout");
    try {
      user.update((n) => (n = {}));
      wallet.update((n) => (n = ""));
      chain.update((n) => (n = ""));
      typeWallet.update((n) => (n = ""));
      userPublicAddress.update((n) => (n = ""));
      // selectedPackage.update((n) => (n = "FREE"));

      localStorage.removeItem("public_address");
      localStorage.removeItem("token");

      disconnect($wallets$?.[0]);

      $walletStore.disconnect();

      if ($tonConnector?.connected) {
        $tonConnector.disconnect();
      }

      if (
        ($suiWalletInstance as WalletState) &&
        ($suiWalletInstance as WalletState).connected
      ) {
        ($suiWalletInstance as WalletState).disconnect();
      }

      localStorage.removeItem("isSkipInviteCodeCampaign");

      navigate("/");
      handleUpdateNavActive("/portfolio");

      queryClient?.invalidateQueries(["list-address"]);
      queryClient?.invalidateQueries(["users-me"]);
      queryClient?.invalidateQueries(["link-socials"]);

      mixpanel.reset();
    } catch (error) {
      console.log(error);
    }
  };

  let displayName = "";
  let publicAddress = "";
  let buyPackage = "Free";

  let isOpenModalSync = false;
  let code = "";
  let isLoadingSyncMobile = false;
  let errors: any = {};

  // Handle mobile sign in
  const handleMobileSignIn = async (code: any) => {
    isLoadingSyncMobile = true;
    try {
      const res: any = await nimbus.post("/auth/access-code", {
        code: code,
      });
      if (res?.data?.result) {
        localStorage.setItem("token", res?.data?.result);
        user.update(
          (n) =>
            (n = {
              picture: User,
            }),
        );
        code = "";
        queryClient?.invalidateQueries(["users-me"]);
        isOpenModalSync = false;
      }
      errors["code"] = {
        ...errors["code"],
        required: true,
        msg: "Your code is expired",
      };
      isLoadingSyncMobile = false;
    } catch (e) {
      isLoadingSyncMobile = false;
      errors["code"] = {
        ...errors["code"],
        required: true,
        msg: "Your code is expired",
      };
      console.error(e);
    }
  };

  const onSubmitGetCode = async (e) => {
    const formData = new FormData(e.target);
    const data: any = {};
    for (let field of formData) {
      const [key, value] = field;
      data[key] = value;
    }
    if (data.code.length !== 6) {
      errors["code"] = {
        ...errors["code"],
        required: true,
        msg: "Invalid code",
      };
      return;
    }
    handleMobileSignIn(data.code);
  };

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const syncCodeParams = urlParams.get("code");

    if (syncCodeParams) {
      handleMobileSignIn(syncCodeParams);
    }

    getSuggestList();

    handleGetSafeAppInfo();

    Mousetrap.bindGlobal(["up", "down"], (event) => {
      if (searchListAddressResult.length !== 0) {
        if (event.key === "ArrowUp" && selectedIndexAddress > 0) {
          selectedIndexAddress -= 1;
        }
        if (event.key === "ArrowDown") {
          if (
            searchListAddressResult.length === listAddress.length &&
            selectedIndexAddress < listAddress.length - 1
          ) {
            selectedIndexAddress += 1;
          }
          if (
            searchListAddressResult.length < listAddress.length &&
            selectedIndexAddress < searchListAddressResult.length - 1
          ) {
            selectedIndexAddress += 1;
          }
        }
        const itemElement = listAddressElement.querySelector(
          `div:nth-child(${selectedIndexAddress + 1})`,
        );
        if (itemElement) {
          itemElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    });

    Mousetrap.bindGlobal(["/"], function () {
      if (!$triggerModalAddAddress && !$triggerConnectWallet) {
        showPopoverSearch.update((n) => (n = true));
      }
    });

    Mousetrap.bindGlobal(["esc"], function () {
      showPopoverSearch.update((n) => (n = false));
      search = "";
    });

    Mousetrap.bindGlobal(["enter"], async function () {
      if ($showPopoverSearch) {
        if (selectedIndexAddress !== -1) {
          if (
            isDisabled &&
            ($selectedPackage === "FREE"
              ? selectedIndexAddress > 2 + listBundle.length
              : selectedIndexAddress > 6 + listBundle.length)
          ) {
            return;
          }
          let selectedAddress;
          if (indexSelectedAddressResult === -1) {
            selectedAddress = listAddress[selectedIndexAddress]?.value;
          } else {
            selectedAddress = listAddress[indexSelectedAddressResult]?.value;
          }
          handleSearchAddress(selectedAddress);
          indexSelectedAddressResult = -1;
          searchListAddressResult = listAddress;
        } else {
          searchListAddressResult = listAddress;
        }
      }
    });
  });

  onDestroy(() => {
    Mousetrap.reset();
  });

  $: queryUserInfo = createQuery({
    queryKey: ["users-me"],
    queryFn: () => getUserInfo(),
    retry: false,
    onSuccess(data) {
      if (data) {
        handleSetUserData(data);
      }
    },
    onError(error: any) {
      if (
        error?.message &&
        (error?.message?.toString()?.includes("Token expired") ||
          error?.message?.toString()?.includes("Unauthorized access"))
      ) {
        // selectedPackage.update((n) => (n = "FREE"));
        user.update((n) => (n = {}));
        wallet.update((n) => (n = ""));
        chain.update((n) => (n = "ALL"));
        typeWallet.update((n) => (n = ""));
        localStorage.removeItem("public_address");
        localStorage.removeItem("token");
        localStorage.removeItem("isSkipInviteCodeCampaign");
        mixpanel.reset();
      }
    },
  });

  $: {
    if (
      !$queryUserInfo.isError &&
      $queryUserInfo &&
      $queryUserInfo?.data !== undefined
    ) {
      handleSetUserData($queryUserInfo?.data);
    }
  }

  const handleSetUserData = (data: any) => {
    mixpanel.identify(data?.id);
    localStorage.setItem("public_address", data?.publicAddress);
    userPublicAddress.update((n) => (n = data?.publicAddress));
    userId.update((n) => (n = data?.id));
    userID = data?.id;
    // selectedPackage.update((n) => (n = data?.plan?.tier.toUpperCase()));
    buyPackage = data.plan?.tier;
    displayName = data?.displayName;
    publicAddress = data?.publicAddress;
    mixpanel.identify(data.publicAddress);
  };

  // Prevent layout flick
  $: if ($isShowHeaderMobile) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "unset";
  }

  $: {
    if (
      search &&
      search?.length !== 0 &&
      searchListAddressResult.length === 0
    ) {
      selectedIndexAddress = -1;
    } else {
      selectedIndexAddress = 0;
    }
  }

  $: {
    if (
      searchListAddressResult.length !== 0 &&
      searchListAddressResult?.length < listAddress?.length
    ) {
      const addressResult = searchListAddressResult[selectedIndexAddress];
      indexSelectedAddressResult = listAddress.indexOf(addressResult);
    }
  }

  $: searchListAddressResult = search
    ? listAddress?.filter(
        (item) =>
          item.label.toLowerCase() === search.toLowerCase() ||
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.value.toLowerCase().includes(search.toLowerCase()),
      )
    : listAddress;

  $: {
    if ($triggerSync) {
      isOpenModalSync = true;
      isShowHeaderMobile.update((n) => (n = false));
      mixpanel.track("user_connect_wallet");
      triggerSync.update((n) => (n = false));
    }
  }

  const homePageMatch = useMatch("/");
  $: $homePageMatch ? handleUpdateNavActive("/portfolio") : null;

  const analyticPageMatch = useMatch("/analytic");
  $: $analyticPageMatch ? handleUpdateNavActive("/analytic") : null;

  const paperTradePageMatch = useMatch("/virtual-portfolio");
  $: $paperTradePageMatch ? handleUpdateNavActive("/virtual-portfolio") : null;

  const whalesPageMatch = useMatch("/whales");
  $: $whalesPageMatch ? handleUpdateNavActive("/whales") : null;
</script>

<div
  class={`border-b-[1px] border-[#ffffff1a] ${isNimbusVersion ? "py-1 mobile-header-container" : "py-3 whitelabel-header-container"}`}
>
  <div
    class="flex items-center justify-between gap-2 max-w-[1600px] m-auto xl:w-[94%] w-[90%]"
  >
    {#if isNimbusVersion}
      <a href="/">
        <img
          src={Logo}
          alt="logo"
          loading="lazy"
          decoding="async"
          class="-ml-7 w-[177px] h-[60px] cursor-pointer"
          on:click={() => {
            handleUpdateNavActive("/portfolio");
            if ($user && Object.keys($user)?.length === 0) {
              user.update((n) => (n = {}));
              wallet.update((n) => (n = ""));
              chain.update((n) => (n = ""));
              typeWallet.update((n) => (n = ""));
              queryClient.invalidateQueries(["list-address"]);
              navigate("/");
            } else {
              if ($wallet) {
                navigate(
                  `/?tab=${$tab}&type=${$typeWallet}&chain=${$chain}&address=${$wallet}`,
                );
              } else {
                navigate("/");
              }
            }
          }}
        />
      </a>
    {:else}
      <a
        class="xl:-ml-7 -ml-2 w-[177px] h-[60px] cursor-pointer relative overflow-hidden"
        href="/"
      >
        <img
          alt=""
          data-srcset="https://cryptotaxprep.io/wp-content/uploads/2023/09/logo-2.png 645w, https://cryptotaxprep.io/wp-content/uploads/2023/09/logo-2-300x56.png 300w"
          data-src="https://cryptotaxprep.io/wp-content/uploads/2023/09/logo-2.png"
          data-sizes="(max-width: 645px) 100vw, 645px"
          class="absolute top-1/2 left-0 transform -translate-y-1/2"
          src="https://cryptotaxprep.io/wp-content/uploads/2023/09/logo-2.png"
          sizes="(max-width: 645px) 100vw, 645px"
          srcset="https://cryptotaxprep.io/wp-content/uploads/2023/09/logo-2.png 645w, https://cryptotaxprep.io/wp-content/uploads/2023/09/logo-2-300x56.png 300w"
        />
      </a>
    {/if}

    <div class="xl:flex hidden items-center justify-between gap-1">
      {#if isNimbusVersion}
        <div
          class={`flex items-center gap-2 cursor-pointer py-2 xl:px-4 px-2 rounded-[1000px] hover:opacity-100 transition-all ${
            $isDarkMode
              ? navActive === "/portfolio"
                ? "bg-[#212121] opacity-100"
                : "opacity-70 hover:bg-[#212121]"
              : navActive === "/portfolio"
                ? "bg-[#525B8C] opacity-100"
                : "opacity-70 hover:bg-[#525B8C]"
          }`}
          on:click={() => {
            handleUpdateNavActive("/portfolio");
            queryClient?.invalidateQueries(["users-me"]);
            if ($wallet) {
              navigate(
                `/?tab=${$tab}&type=${$typeWallet}&chain=${$chain}&address=${$wallet}`,
              );
            } else {
              navigate("/");
            }
          }}
        >
          <img src={PortfolioIcon} alt="" width="20" height="20" />
          <span class="font-medium text-white text-base">{$t("Portfolio")}</span
          >
        </div>

        <div
          class={`flex items-center gap-2 cursor-pointer py-2 xl:px-4 px-2 rounded-[1000px] hover:opacity-100 transition-all ${
            $isDarkMode
              ? navActive === "/swap"
                ? "bg-[#212121] opacity-100"
                : "opacity-70 hover:bg-[#212121]"
              : navActive === "/swap"
                ? "bg-[#525B8C] opacity-100"
                : "opacity-70 hover:bg-[#525B8C]"
          }`}
          on:click={() => {
            handleUpdateNavActive("/swap");
            queryClient?.invalidateQueries(["users-me"]);
            navigate("/swap");
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 134 179"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M84.0701 13.1084C82.714 11.7043 81.9637 9.82385 81.9806 7.87194C81.9976 5.92003 82.7805 4.05288 84.1608 2.67262C85.5411 1.29235 87.4082 0.50943 89.3601 0.492469C91.312 0.475507 93.1925 1.22587 94.5966 2.58193L131.819 39.8042C133.214 41.2002 133.998 43.0934 133.998 45.0674C133.998 47.0414 133.214 48.9346 131.819 50.3306L94.5966 87.5528C93.1925 88.9089 91.312 89.6592 89.3601 89.6423C87.4082 89.6253 85.5411 88.8424 84.1608 87.4621C82.7805 86.0819 81.9976 84.2147 81.9806 82.2628C81.9637 80.3109 82.714 78.4304 84.0701 77.0264L108.585 52.5118H7.44444C5.47006 52.5118 3.57653 51.7275 2.18043 50.3314C0.784325 48.9353 0 47.0418 0 45.0674C0 43.093 0.784325 41.1995 2.18043 39.8034C3.57653 38.4073 5.47006 37.6229 7.44444 37.6229H108.585L84.0701 13.1084ZM49.9299 102.442C51.286 101.038 52.0363 99.1572 52.0194 97.2053C52.0024 95.2534 51.2195 93.3862 49.8392 92.0059C48.4589 90.6257 46.5918 89.8428 44.6399 89.8258C42.688 89.8088 40.8075 90.5592 39.4034 91.9153L2.18122 129.137C0.785606 130.534 0.0015903 132.427 0.0015903 134.401C0.0015903 136.375 0.785606 138.268 2.18122 139.664L39.4034 176.886C40.8075 178.242 42.688 178.993 44.6399 178.976C46.5918 178.959 48.4589 178.176 49.8392 176.795C51.2195 175.415 52.0024 173.548 52.0194 171.596C52.0363 169.644 51.286 167.764 49.9299 166.36L25.4153 141.845H126.556C128.53 141.845 130.423 141.061 131.82 139.665C133.216 138.269 134 136.375 134 134.401C134 132.426 133.216 130.533 131.82 129.137C130.423 127.741 128.53 126.956 126.556 126.956H25.4153L49.9299 102.442Z"
              fill="white"
            />
          </svg>
          <span class="font-medium text-white text-base">{$t("Swap")}</span>
        </div>

        <div
          class={`flex items-center gap-2 cursor-pointer py-2 xl:px-4 px-2 rounded-[1000px] hover:opacity-100 transition-all ${
            $isDarkMode
              ? navActive === "/bridge"
                ? "bg-[#212121] opacity-100"
                : "opacity-70 hover:bg-[#212121]"
              : navActive === "/bridge"
                ? "bg-[#525B8C] opacity-100"
                : "opacity-70 hover:bg-[#525B8C]"
          }`}
          on:click={() => {
            handleUpdateNavActive("/bridge");
            queryClient?.invalidateQueries(["users-me"]);
            navigate("/bridge");
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M5.99995 7.5572V4H3.99995V7.58579L2.29285 9.29289L3.70706 10.7071L3.99995 10.4142V16H2.99995V18H3.99995V20H5.99995V18H18V20H20V18H21V16H20V10.4142L20.2928 10.7071L21.7071 9.29289L20 7.58579V4H18V7.5572C17.9509 7.59921 17.896 7.64529 17.8355 7.69479C17.5214 7.95173 17.0611 8.29713 16.4855 8.64251C15.3241 9.33934 13.7541 10 12 10C10.2458 10 8.67584 9.33934 7.51445 8.64251C6.93882 8.29713 6.47848 7.95173 6.16444 7.69479C6.10394 7.64529 6.04904 7.59921 5.99995 7.5572ZM5.99995 10.052V16H18V10.052C17.8471 10.1527 17.6851 10.2551 17.5144 10.3575C16.1758 11.1607 14.2458 12 12 12C9.75407 12 7.82407 11.1607 6.48546 10.3575C6.31483 10.2551 6.15282 10.1527 5.99995 10.052Z"
              fill="white"
            />
          </svg>
          <span class="font-medium text-white text-base">{$t("Bridge")}</span>
        </div>

        <div
          class={`flex items-center gap-2 cursor-pointer py-2 xl:px-4 px-2 rounded-[1000px] hover:opacity-100 transition-all
          ${
            $isDarkMode
              ? navActive === "/yields"
                ? "bg-[#212121] opacity-100"
                : "opacity-70 hover:bg-[#212121]"
              : navActive === "/yields"
                ? "bg-[#525B8C] opacity-100"
                : "opacity-70 hover:bg-[#525B8C]"
          }
          `}
          on:click={() => {
            handleUpdateNavActive("/yields");
            navigate("/yields");
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 9L12 4L21 9V20H3V9Z"
              stroke="#fff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12 4V20"
              stroke="#fff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8 12L12 8L16 12"
              stroke="#fff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="font-medium text-white text-base">{$t("Yields")}</span>
        </div>

        <!-- <div
          class={`flex items-center gap-2 cursor-pointer py-2 xl:px-4 px-2 rounded-[1000px] hover:opacity-100 transition-all
          ${
            $isDarkMode
              ? navActive === "/analytic"
                ? "bg-[#212121] opacity-100"
                : "opacity-70 hover:bg-[#212121]"
              : navActive === "/analytic"
                ? "bg-[#525B8C] opacity-100"
                : "opacity-70 hover:bg-[#525B8C]"
          }
          `}
          on:click={() => {
            handleUpdateNavActive("/analytic");
            queryClient?.invalidateQueries(["users-me"]);
            if ($wallet) {
              navigate(
                `/analytic?type=${$typeWallet}&chain=${$chain}&address=${$wallet}`,
              );
            } else {
              navigate("/");
            }
          }}
        >
          <img src={AnalyticIcon} alt="" width="20" height="20" />
          <span class="flex gap-[1px]">
            <span class="font-medium text-white text-base">{$t("Analytics")}</span>
            <span class="flex items-center gap-[1px] -mt-2">
              <img src={Crown} alt="" width="13" height="12" />
              <span class="text-xs font-medium text-[#FFB800] -mt-[1px]"
                >Pro</span
              >
            </span>
          </span>
        </div> -->

        <!-- <div
          class={`flex items-center gap-2 cursor-pointer py-2 xl:px-4 px-2 rounded-[1000px] hover:opacity-100 transition-all ${
            $isDarkMode
              ? navActive === "/virtual-portfolio"
                ? "bg-[#212121] opacity-100"
                : "opacity-70 hover:bg-[#212121]"
              : navActive === "/virtual-portfolio"
                ? "bg-[#525B8C] opacity-100"
                : "opacity-70 hover:bg-[#525B8C]"
          }`}
          on:click={() => {
            handleUpdateNavActive("/virtual-portfolio");
            queryClient?.invalidateQueries(["users-me"]);
            navigate(
              `/virtual-portfolio?type=main&address=${$userPublicAddress}`,
            );
          }}
        >
          <img src={VirtualPortfolioIcon} alt="" width="20" height="20" />
          <span class="font-medium text-white text-base">Paper Trade</span>
        </div> -->

        <div
          class={`flex items-center gap-2 cursor-pointer py-2 xl:px-4 px-2 rounded-[1000px] hover:opacity-100 transition-all
          ${
            $isDarkMode
              ? navActive === "/whales"
                ? "bg-[#212121] opacity-100"
                : "opacity-70 hover:bg-[#212121]"
              : navActive === "/whales"
                ? "bg-[#525B8C] opacity-100"
                : "opacity-70 hover:bg-[#525B8C]"
          }
          `}
          on:click={() => {
            handleUpdateNavActive("/whales");
            navigate("/whales");
          }}
        >
          <img
            src={WhaleIcon}
            alt=""
            loading="lazy"
            decoding="async"
            width="20"
            height="20"
          />
          <span class="font-medium text-white text-base">{$t("Whale")}</span>
        </div>
      {/if}
    </div>

    <div class="w-max flex items-center justify-end xl:gap-2 gap-4">
      <!-- Search -->
      <div
        class="xl:hidden block"
        on:click={() => {
          showPopoverSearch.update((n) => (n = true));
          search = "";
        }}
      >
        <img src={Search} alt="" class="xl:w-5 xl:h-5 w-7 h-7" />
      </div>

      <div
        class={`px-4 xl:w-[220px] md:w-[400px] w-full xl:flex hidden items-center gap-4 rounded-[1000px] cursor-pointer ${
          isNimbusVersion
            ? $isDarkMode
              ? "bg-[#212121]"
              : "bg-[#525B8C]"
            : "bg-[#f0f0f0]"
        }`}
      >
        <img
          src={isNimbusVersion ? Search : SearchBlack}
          alt=""
          class="xl:w-[19px] xl:h-[19px] w-7 h-7"
        />
        <div
          on:click={() => {
            showPopoverSearch.update((n) => (n = true));
            search = "";
          }}
          class={`flex-1 xl:py-2 py-3 rounded-r-[1000px] text-sm bg-transparent ${
            isNimbusVersion ? "text-[#ffffff80]" : "text-black"
          }`}
        >
          {$t("Search address")}
        </div>
        <div
          class="xl:flex hidden rounded-md w-[24px] h-[24px] p-2 justify-center items-center bg-[#a6b0c3] text-white text-sm"
          use:tooltip={{
            content: `<tooltip-detail text="Use to trigger search" />`,
            allowHTML: true,
            placement: "bottom",
            interactive: true,
          }}
        >
          /
        </div>
      </div>

      {#if !isNimbusVersion}
        <div
          class="xl:hidden block text-white ml-2"
          on:click={() => {
            isShowHeaderMobile.update((n) => (n = true));
          }}
        >
          <img src={SettingsIcon} alt="" width="26" height="26" />
        </div>
      {/if}

      <!-- <div class="xl:w-10 xl:h-10 w-12 h-12 relative xl:block hidden">
        <div
          class={`rounded-full flex justify-center items-center w-full h-full ${
            $isDarkMode ? "bg-[#212121]" : "bg-[#525B8C]"
          }`}
        >
          <img src={ChangeLogIcon} alt="" class="w-[26px] h-[26px]" />
        </div>
        <button
          data-featurebase-changelog
          class="w-full h-full absolute inset-0 z-10"
        />
      </div> -->

      <!-- <div
        class={`cursor-pointer rounded-full flex justify-center items-center xl:w-10 xl:h-10 w-12 h-12 ${
          $isDarkMode ? "bg-[#212121]" : "bg-[#525B8C]"
        }`}
      >
        <img src={Bell} alt="" class="xl:w-5 xl:h-5 w-7 h-7" />
      </div> -->

      {#if isNimbusVersion}
        <div
          class={`flex items-center gap-1 cursor-pointer py-2 px-3 rounded-[1000px] ${
            $isDarkMode
              ? "bg-[#212121] opacity-100"
              : "bg-[#525B8C] opacity-100"
          }`}
          on:click={() => {
            handleUpdateNavActive("/daily-checkin");
            navigate("/daily-checkin");
          }}
        >
          <img src={Diamond} alt="" class="xl:w-[20px] xl:h-[20px] w-7 h-7" />
          <span class="font-semibold text-white xl:text-sm text-base">
            {$t("Quests")}
          </span>
        </div>
      {/if}

      <Auth
        {safeInfo}
        {displayName}
        {publicAddress}
        {buyPackage}
        {navActive}
        {handleUpdateNavActive}
        {handleSignOut}
        isShowSyncSession={false}
      />
    </div>
  </div>
</div>

<!-- {#if !$isTWA && isNimbusVersion}
  <Banner>
    <span
      slot="title"
      class="flex items-center tracking-widest whitespace-nowrap"
    >
      <strong class="font-semibold flex items-center gap-1">
        Vote For Nimbus on U2U
      </strong>
      <svg
        viewBox="0 0 2 2"
        class="mx-2 inline h-0.5 w-0.5 fill-current"
        aria-hidden="true"
      >
        <circle cx="1" cy="1" r="1" />
      </svg>
    </span>
    <span
      slot="content"
      class="flex items-center gap-1 tracking-widest whitespace-nowrap"
    >
      Connect Your MetaMask, Change to U2U mainnet and Vote For Nimbus (You can
      click twice) for <img src={Diamond} alt="" class="w-[18px] h-[18px]" />
      1000 GM Points

      <a
        href="https://startupshowcase.depinalliance.xyz/?code=NIMBUS"
        target="_blank"
        class="bg-[#1e96fc] text-white py-[2px] px-3 rounded-full flex items-center justify-center tracking-normal"
      >
        Vote now!
      </a>
    </span>
  </Banner>
{/if} -->

<!-- Mobile header -->
<div
  class={`fixed inset-0 w-full mobile ${
    $isShowHeaderMobile
      ? "opacity-100 transform translate-x-[0px]"
      : "opacity-0 transform translate-x-[-100vw]"
  } ${isNimbusVersion ? "mobile-container" : "whitelabel-header-container"}`}
>
  <div class="max-w-[100vw] m-auto w-[90%] h-full flex flex-col gap-8 relative">
    <div class="flex items-center justify-between py-3 border-b-[1px]">
      {#if isNimbusVersion}
        <img
          src={Logo}
          alt=""
          loading="lazy"
          decoding="async"
          class="-ml-6 w-[177px] h-[60px]"
        />
      {:else}
        <div class="-ml-6 w-[177px] h-[60px]"></div>
      {/if}
      <div
        class="-mr-1 text-5xl text-white"
        on:click={() => {
          isShowHeaderMobile.update((n) => (n = false));
        }}
      >
        &times;
      </div>
    </div>

    <div class="flex flex-col gap-4 justify-between h-full">
      <div class="flex flex-col gap-4">
        {#if !$isTWA}
          {#if $user && Object.keys($user).length !== 0}
            <div class="flex justify-between items-center px-4">
              <div class="text-xl flex items-center gap-1 text-white">
                GM 👋,
                {#if displayName}
                  {displayName}
                {:else}
                  <Copy
                    address={publicAddress ||
                      localStorage.getItem("public_address")}
                    iconColor="#fff"
                    color="#fff"
                    isShorten
                    textTooltip="Copy"
                  />
                {/if}
              </div>
            </div>
          {/if}
        {/if}

        <div
          class="flex flex-col gap-3 overflow-y-auto list-nav customScrollDiv"
        >
          {#if isNimbusVersion}
            {#if $user && Object.keys($user).length !== 0}
              <div
                class={`flex items-center gap-3 text-white px-5 py-3
            ${
              $isDarkMode
                ? navActive === "/profile"
                  ? isNimbusVersion
                    ? "bg-[#212121] rounded-[1000px] opacity-100"
                    : "bg-[#cdcdcd59] rounded-[1000px] opacity-100"
                  : "opacity-70"
                : navActive === "/profile"
                  ? isNimbusVersion
                    ? "bg-[#525B8C] rounded-[1000px] opacity-100"
                    : "bg-[#3bda32] rounded-[1000px] opacity-100"
                  : "opacity-70"
            }
          `}
                on:click={() => {
                  handleUpdateNavActive("/profile");
                  queryClient?.invalidateQueries(["users-me"]);
                  isShowHeaderMobile.update((n) => (n = false));
                  navigate(`profile?id=${userID}`);
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M7.5 6a4.5 4.5 0 1 1 9 0a4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0a.75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-xl font-medium">{$t("My Profile")}</span>
              </div>

              {#if $isTWA}
                <div
                  class="flex items-center gap-3 text-white px-5 py-3 opacity-70"
                  on:click={() => {
                    const link = `https://t.me/GetNimbusBot/NimbusApp?startapp=${userID}`;
                    window.Telegram.WebApp.openTelegramLink(
                      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${"Your personalized assistant to manage your investments. Join us on Telegram!"}`,
                    );
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    ><path
                      fill="currentColor"
                      d="M19 17v2H7v-2s0-4 6-4s6 4 6 4m-3-9a3 3 0 1 0-3 3a3 3 0 0 0 3-3m3.2 5.06A5.6 5.6 0 0 1 21 17v2h3v-2s0-3.45-4.8-3.94M18 5a2.91 2.91 0 0 0-.89.14a5 5 0 0 1 0 5.72A2.91 2.91 0 0 0 18 11a3 3 0 0 0 0-6M8 10H5V7H3v3H0v2h3v3h2v-3h3Z"
                    /></svg
                  >
                  <span class="text-xl font-medium">{$t("Invite")}</span>
                </div>
              {:else}
                <div
                  class={`flex items-center gap-3 text-white px-5 py-3
                ${
                  $isDarkMode
                    ? navActive === "/invitation"
                      ? isNimbusVersion
                        ? "bg-[#212121] rounded-[1000px] opacity-100"
                        : "bg-[#cdcdcd59] rounded-[1000px] opacity-100"
                      : "opacity-70"
                    : navActive === "/invitation"
                      ? isNimbusVersion
                        ? "bg-[#525B8C] rounded-[1000px] opacity-100"
                        : "bg-[#3bda32] rounded-[1000px] opacity-100"
                      : "opacity-70"
                }
              `}
                  on:click={() => {
                    handleUpdateNavActive("/invitation");
                    queryClient?.invalidateQueries(["users-me"]);
                    isShowHeaderMobile.update((n) => (n = false));
                    navigate("/invitation");
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    ><path
                      fill="currentColor"
                      d="M19 17v2H7v-2s0-4 6-4s6 4 6 4m-3-9a3 3 0 1 0-3 3a3 3 0 0 0 3-3m3.2 5.06A5.6 5.6 0 0 1 21 17v2h3v-2s0-3.45-4.8-3.94M18 5a2.91 2.91 0 0 0-.89.14a5 5 0 0 1 0 5.72A2.91 2.91 0 0 0 18 11a3 3 0 0 0 0-6M8 10H5V7H3v3H0v2h3v3h2v-3h3Z"
                    /></svg
                  >
                  <span class="text-xl font-medium">{$t("Invite")}</span>
                </div>
              {/if}
            {/if}

            <!-- <div
              class={`flex items-center gap-3 text-white px-5 py-3
            ${
              $isDarkMode
                ? navActive === "/upgrade"
                  ? isNimbusVersion
                    ? "bg-[#212121] rounded-[1000px] opacity-100"
                    : "bg-[#cdcdcd59] rounded-[1000px] opacity-100"
                  : "opacity-70"
                : navActive === "/upgrade"
                  ? isNimbusVersion
                    ? "bg-[#525B8C] rounded-[1000px] opacity-100"
                    : "bg-[#3bda32] rounded-[1000px] opacity-100"
                  : "opacity-70"
            }
          `}
              on:click={() => {
                handleUpdateNavActive("/upgrade");
                queryClient?.invalidateQueries(["users-me"]);
                isShowHeaderMobile.update((n) => (n = false));
                navigate("/upgrade");
              }}
            >
              <div class="flex items-center gap-3 ml-1">
                <svg
                  width="26"
                  height="26"
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
                <span class="text-xl font-medium text-yellow-400">
                  {$t("Upgrade")}
                </span>
              </div>
            </div> -->

            {#if isNimbusVersion}
              <div
                class={`px-5 py-3 text-white opacity-70 ${
                  $isDarkMode
                    ? $isOpenModalRewardSwap
                      ? "bg-[#cdcdcd59] rounded-[1000px] opacity-100"
                      : "opacity-70"
                    : $isOpenModalRewardSwap
                      ? "bg-[#3bda32] rounded-[1000px] opacity-100"
                      : "opacity-70"
                }`}
                on:click={() => {
                  isOpenModalRewardSwap.update((n) => (n = true));
                }}
              >
                <div class="flex items-center gap-3 ml-1">
                  <div class="w-[25px] h-[25px] flex items-center">
                    <img
                      src={Gift}
                      alt="gift"
                      class="w-full h-full object-cover"
                      style="transform: scale(2);"
                    />
                  </div>
                  <div class="text-xl font-medium">
                    {$t("Rewards")}
                  </div>
                </div>
              </div>

              <div
                class={`flex items-center gap-3 text-white px-5 py-3
            ${
              $isDarkMode
                ? navActive === "/bridge"
                  ? isNimbusVersion
                    ? "bg-[#212121] rounded-[1000px] opacity-100"
                    : "bg-[#cdcdcd59] rounded-[1000px] opacity-100"
                  : "opacity-70"
                : navActive === "/bridge"
                  ? isNimbusVersion
                    ? "bg-[#525B8C] rounded-[1000px] opacity-100"
                    : "bg-[#3bda32] rounded-[1000px] opacity-100"
                  : "opacity-70"
            }
          `}
                on:click={() => {
                  handleUpdateNavActive("/bridge");
                  isShowHeaderMobile.update((n) => (n = false));
                  navigate("/bridge");
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M5.99995 7.5572V4H3.99995V7.58579L2.29285 9.29289L3.70706 10.7071L3.99995 10.4142V16H2.99995V18H3.99995V20H5.99995V18H18V20H20V18H21V16H20V10.4142L20.2928 10.7071L21.7071 9.29289L20 7.58579V4H18V7.5572C17.9509 7.59921 17.896 7.64529 17.8355 7.69479C17.5214 7.95173 17.0611 8.29713 16.4855 8.64251C15.3241 9.33934 13.7541 10 12 10C10.2458 10 8.67584 9.33934 7.51445 8.64251C6.93882 8.29713 6.47848 7.95173 6.16444 7.69479C6.10394 7.64529 6.04904 7.59921 5.99995 7.5572ZM5.99995 10.052V16H18V10.052C17.8471 10.1527 17.6851 10.2551 17.5144 10.3575C16.1758 11.1607 14.2458 12 12 12C9.75407 12 7.82407 11.1607 6.48546 10.3575C6.31483 10.2551 6.15282 10.1527 5.99995 10.052Z"
                    fill="white"
                  />
                </svg>
                <span class="text-xl font-medium">Bridge</span>
              </div>

              <div
                class={`flex items-center gap-3 text-white px-5 py-3
            ${
              $isDarkMode
                ? navActive === "/virtual-portfolio"
                  ? isNimbusVersion
                    ? "bg-[#212121] rounded-[1000px] opacity-100"
                    : "bg-[#cdcdcd59] rounded-[1000px] opacity-100"
                  : "opacity-70"
                : navActive === "/virtual-portfolio"
                  ? isNimbusVersion
                    ? "bg-[#525B8C] rounded-[1000px] opacity-100"
                    : "bg-[#3bda32] rounded-[1000px] opacity-100"
                  : "opacity-70"
            }
          `}
                on:click={() => {
                  handleUpdateNavActive("/virtual-portfolio");
                  queryClient?.invalidateQueries(["users-me"]);
                  isShowHeaderMobile.update((n) => (n = false));
                  navigate(
                    `/virtual-portfolio?type=main&address=${$userPublicAddress}`,
                  );
                }}
              >
                <img src={VirtualPortfolioIcon} alt="" width="26" height="26" />
                <span class="text-xl font-medium">Paper Trade</span>
              </div>
            {/if}

            <div
              on:click={() => {
                isShowHeaderMobile.update((n) => (n = false));
              }}
            >
              <a
                href="https://nimbus.featurebase.app/"
                target="_blank"
                class="flex items-center gap-3 text-white px-5 py-3 opacity-70"
              >
                <img
                  src={Chat}
                  loading="lazy"
                  decoding="async"
                  alt=""
                  width="26"
                  height="26"
                />
                <span class="text-xl font-medium">{$t("Feedback")}</span>
              </a>
            </div>
          {/if}

          {#if $user && Object.keys($user).length !== 0}
            <div
              class={`flex items-center gap-3 text-white px-5 py-3
            ${
              $isDarkMode
                ? navActive === "/settings"
                  ? isNimbusVersion
                    ? "bg-[#212121] rounded-[1000px] opacity-100"
                    : "bg-[#cdcdcd59] rounded-[1000px] opacity-100"
                  : "opacity-70"
                : navActive === "/settings"
                  ? isNimbusVersion
                    ? "bg-[#525B8C] rounded-[1000px] opacity-100"
                    : "bg-[#3bda32] rounded-[1000px] opacity-100"
                  : "opacity-70"
            }
          `}
              on:click={() => {
                handleUpdateNavActive("/settings");
                isShowHeaderMobile.update((n) => (n = false));
                navigate("/settings");
              }}
            >
              <img src={SettingsIcon} alt="" width="26" height="26" />
              <span class="text-xl font-medium">{$t("Settings")}</span>
            </div>
          {/if}
        </div>
      </div>

      <div class="flex flex-col gap-12 w-full pb-12 mt-2">
        <div class="flex flex-col gap-5 px-5">
          {#if isNimbusVersion}
            <Languages />
          {/if}

          <DarkModeFooter />

          {#if $user && Object.keys($user).length !== 0}
            <Auth
              {safeInfo}
              {displayName}
              {publicAddress}
              {buyPackage}
              {navActive}
              {handleUpdateNavActive}
              {handleSignOut}
              isShowSyncSession={true}
            />
          {/if}

          <div class="w-max">
            {#if Object.keys($user).length === 0}
              <div class="flex flex-col gap-5">
                {#if isNimbusVersion}
                  <div
                    class="text-xl font-semibold text-white cursor-pointer"
                    on:click={() => {
                      isOpenModalSync = true;
                      isShowHeaderMobile.update((n) => (n = false));
                    }}
                  >
                    {$t("Sync from Desktop")}
                  </div>

                  <div
                    class="text-xl font-semibold text-white cursor-pointer"
                    on:click={() => {
                      triggerConnectWallet.update((n) => (n = true));
                      isShowHeaderMobile.update((n) => (n = false));
                    }}
                  >
                    {$t("Connect Wallet")}
                  </div>
                {/if}
              </div>
            {:else}
              <div>
                {#if !$isTWA}
                  <div
                    class={`text-xl font-medium text-red-500 cursor-pointer ${
                      $isDarkMode ? "hover:bg-[#222222]" : "hover:bg-[#eff0f4]"
                    }`}
                    on:click={handleSignOut}
                  >
                    {$t("Log out")}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        {#if isNimbusVersion}
          <div class="w-full flex justify-center gap-10 text-white hide-social">
            <a
              href="https://github.com/getnimbus"
              target="_blank"
              aria-label="Learn more about GetNimbus"
              class="hover:text-[#3b82f6] transition-all w-10 h-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"
                />
              </svg>
            </a>

            <a
              href="https://twitter.com/get_nimbus"
              target="_blank"
              aria-label="Learn more about GetNimbus"
              class="hover:text-[#3b82f6] transition-all w-9 h-9"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path
                  fill="currentColor"
                  d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07l-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"
                />
              </svg>
            </a>

            <a
              href="https://discord.gg/u5b9dTrSTr"
              target="_blank"
              aria-label="Learn more about GetNimbus"
              class="hover:text-[#3b82f6] transition-all w-9 h-9"
            >
              <svg viewBox="0 0 24 24">
                <title>media/discord</title><desc>Created with Sketch.</desc>
                <g
                  id="media/discord"
                  stroke="none"
                  stroke-width="1"
                  fill="none"
                  fill-rule="evenodd"
                >
                  <path
                    d="M19.3738284,1.30000067 C20.6047838,1.30000067 21.6093118,2.26441332 21.6296842,3.46693408 L21.6299997,3.50420056 L21.6299997,22.6999997 L19.2637712,20.6669997 L17.9320799,19.4685998 L16.5233485,18.1952999 L17.1066513,20.1747998 L4.62617192,20.1747998 C3.39521653,20.1747998 2.39068845,19.2103871 2.37031605,18.0078664 L2.3700006,17.9705999 L2.3700006,3.50420056 C2.3700006,2.29684756 3.36196791,1.32011497 4.58817416,1.30030737 L4.62617192,1.30000067 L19.3738284,1.30000067 Z M10.4261831,6.41460042 L10.3161259,6.28611151 L10.253462,6.28683614 C9.95314869,6.29553045 8.61816442,6.39277243 7.22352037,7.40970038 L7.17914533,7.49134137 C6.92240404,7.97476735 5.63869759,10.5469402 5.63869759,13.6478001 L5.66158768,13.683294 C5.81731702,13.9151096 6.78208119,15.206041 8.99544029,15.2742 L9.31958577,14.8876236 C9.44785509,14.7336464 9.59687017,14.5535236 9.73282311,14.3861 C8.4498449,14.0128802 7.89942129,13.2610193 7.81769324,13.1400854 L7.8068232,13.1235001 L7.8520928,13.1528415 C7.90174748,13.1841892 7.99116891,13.2385251 8.11498319,13.3054001 C8.1259889,13.3161001 8.13699461,13.3268001 8.15900604,13.3375001 C8.19202318,13.3589001 8.22504032,13.3696001 8.25805746,13.3910001 C8.53320031,13.5408001 8.80834315,13.6585001 9.06147457,13.7548001 C9.51270883,13.9260001 10.0519888,14.0972001 10.6793145,14.2149001 C11.4811594,14.36042 12.4180196,14.4150643 13.43945,14.2415094 L13.5297944,14.2256001 C14.0470629,14.1400001 14.5753372,13.9902001 15.1256229,13.7655001 C15.5108228,13.6264001 15.9400457,13.4231001 16.3912799,13.1342001 L16.3732355,13.1608643 C16.2678877,13.3105783 15.6918478,14.0525552 14.3992457,14.4075 L14.5812611,14.6292689 C14.8592141,14.9648288 15.1256229,15.2742 15.1256229,15.2742 C17.5578856,15.1993 18.4933713,13.6478001 18.4933713,13.6478001 C18.4933713,10.2024002 16.9085485,7.40970038 16.9085485,7.40970038 C15.5456009,6.41588442 14.2396321,6.30042559 13.9006746,6.2875759 L13.8159429,6.28611151 L13.6618629,6.45740042 C15.3210186,6.95080946 16.1925853,7.63774998 16.3686631,7.78696529 L16.4022856,7.81630036 C15.2576914,7.20640039 14.1351086,6.9068004 13.0895658,6.78910041 C12.2971544,6.70350041 11.5377602,6.72490041 10.8664116,6.81050041 C10.8003773,6.81050041 10.7453488,6.82120041 10.6793145,6.8319004 L10.6174459,6.83755 C10.1999606,6.8788199 9.29974827,7.0282454 8.18101747,7.50600037 L8.02110602,7.5784953 C7.82117927,7.670492 7.67550736,7.74276561 7.59730018,7.78247321 L7.53168036,7.81630036 C7.53168036,7.81630036 8.42697646,6.98782187 10.3670723,6.43137796 L10.4261831,6.41460042 Z M10.007966,10.2773002 C10.6352916,10.2773002 11.1415545,10.8123002 11.1305488,11.4650002 C11.1305488,12.1177002 10.6352916,12.6527001 10.007966,12.6527001 C9.39164598,12.6527001 8.88538315,12.1177002 8.88538315,11.4650002 C8.88538315,10.8123002 9.38064027,10.2773002 10.007966,10.2773002 Z M14.0250515,10.2773002 C14.6523772,10.2773002 15.1476343,10.8123002 15.1476343,11.4650002 C15.1476343,12.1177002 14.6523772,12.6527001 14.0250515,12.6527001 C13.4087315,12.6527001 12.9024687,12.1177002 12.9024687,11.4650002 C12.9024687,10.8123002 13.3977258,10.2773002 14.0250515,10.2773002 Z"
                    id="Shape"
                    fill="currentColor"
                  />
                </g>
              </svg>
            </a>

            <a
              href="https://t.me/getnimbus"
              target="_blank"
              aria-label="Learn more about GetNimbus"
              class="transition-all w-[32px] h-[32px]"
            >
              <svg
                fill="#fff"
                viewBox="0 0 20 20"
                class="hover:fill-[#3b82f6]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10,0 C15.5228475,0 20,4.4771525 20,10 C20,15.5228475 15.5228475,20 10,20 C4.4771525,20 0,15.5228475 0,10 C0,4.4771525 4.4771525,0 10,0 Z M14.4415206,6 C14.060553,6.00676048 13.476055,6.20741135 10.663148,7.36249773 C9.67796175,7.7670526 7.70897661,8.60437935 4.75619264,9.87447795 C4.27670659,10.0627254 4.02553067,10.2468857 4.00266485,10.4269588 C3.95876487,10.7726802 4.46291296,10.8803081 5.09723696,11.0838761 C5.61440201,11.2498453 6.31007997,11.4440124 6.67173438,11.4517262 C6.99978943,11.4587234 7.36593635,11.3251987 7.77017511,11.051152 C10.5290529,9.21254679 11.9531977,8.28322679 12.0426094,8.26319203 C12.1056879,8.24905787 12.1930992,8.23128593 12.2523244,8.28325656 C12.3115496,8.33522719 12.3057275,8.43364956 12.299454,8.46005377 C12.2492926,8.67117474 9.65764825,10.998457 9.50849738,11.1513987 L9.43697409,11.2233057 C8.88741493,11.7661123 8.33196049,12.1205055 9.290333,12.7440164 C10.155665,13.3069957 10.6592923,13.6661378 11.5507686,14.2430701 C12.1204738,14.6117635 12.5671299,15.0489784 13.1553348,14.9955401 C13.4259939,14.9709508 13.705567,14.7196888 13.8475521,13.9703127 C14.1831052,12.1993135 14.8426779,8.36209709 14.9951103,6.78087197 C15.0084653,6.64233621 14.9916649,6.46503787 14.9781732,6.38720805 C14.9646815,6.30937823 14.9364876,6.19848702 14.8340164,6.11639754 C14.7126597,6.01917896 14.5253109,5.99867765 14.4415206,6 Z"
                />
              </svg>
            </a>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Modal sync user from desktop -->
<AppOverlay
  clickOutSideToClose
  isOpen={isOpenModalSync}
  on:close={() => {
    isOpenModalSync = false;
  }}
>
  <div class="flex flex-col gap-4 xl:mt-0 mt-4">
    <div class="flex flex-col gap-1 items-start">
      <div class="title-3 font-semibold">Input your code from desktop</div>
      <div class="text-sm text-gray-500">
        Investment in crypto more convenience {#if isNimbusVersion}with Nimbus{/if}
        anywhere, anytime
      </div>
    </div>

    <form
      on:submit|preventDefault={onSubmitGetCode}
      class="flex flex-col xl:gap-3 gap-10"
    >
      <div class="flex flex-col gap-1">
        <div
          class={`flex flex-col gap-1 input-2 input-border w-full py-[6px] px-3 ${
            code && !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
          }`}
          class:input-border-error={errors.code && errors.code.required}
        >
          <div
            class={`text-base font-medium ${
              $isDarkMode ? "text-gray-400" : "text-[#666666]"
            }`}
          >
            Code
          </div>
          <input
            type="number"
            id="code"
            name="code"
            required
            placeholder="Your code"
            bind:value={code}
            class={`p-0 border-none focus:outline-none focus:ring-0 text-sm font-normal ${
              code && !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
            } ${
              $isDarkMode
                ? "text-white"
                : "text-[#5E656B] placeholder-[#5E656B]"
            }`}
            on:change={(event) => {
              code = event?.target?.value;
            }}
          />
        </div>
        {#if errors.code && errors.code.required}
          <div class="text-red-500">
            {errors.code.msg}
          </div>
        {/if}
      </div>
      <div class="flex justify-end gap-4">
        <div class="w-[120px]">
          <Button
            variant="secondary"
            on:click={() => {
              isOpenModalSync = false;
            }}
          >
            Cancel
          </Button>
        </div>
        <div class="w-[120px]">
          <Button
            type="submit"
            isLoading={isLoadingSyncMobile}
            disabled={isLoadingSyncMobile}
          >
            Submit
          </Button>
        </div>
      </div>
    </form>
  </div>
</AppOverlay>

<!-- Modal search -->
<div class="lg:block hidden">
  <AppOverlay
    clickOutSideToClose
    isOpen={$showPopoverSearch}
    on:close={() => {
      search = "";
      showPopoverSearch.update((n) => (n = false));
    }}
  >
    <div class="-mt-6 flex flex-col gap-3">
      <div class="flex items-center">
        <img src={$isDarkMode ? Search : SearchBlack} alt="" class="w-5 h-5" />
        <input
          on:change={(event) => {
            handleSearch(event);
          }}
          on:keydown={(event) => {
            if (
              search &&
              search?.length !== 0 &&
              (event.which == 13 || event.keyCode == 13) &&
              selectedIndexAddress === -1
            ) {
              handleSearchAddress(search);
            }
          }}
          bind:value={search}
          placeholder={$t("Search address")}
          type="text"
          class={`flex-1 py-2 text-sm border-none focus:outline-none focus:ring-0 ${
            $isDarkMode ? "bg-[#0f0f0f]" : "bg-[#fff]"
          }`}
        />
      </div>
      {#if Object.keys($user).length !== 0}
        <div class="flex flex-col gap-2 mb-2">
          <div
            class={`text-xs ${$isDarkMode ? "text-gray-200" : "text-gray-400"}`}
          >
            {$t("List addresses")}
          </div>
          <div
            class="max-h-[310px] h-[310px] w-full flex flex-col gap-2 overflow-y-auto"
            bind:this={listAddressElement}
          >
            {#each searchListAddressResult as item, index}
              <div
                id={item.value}
                class={`relative text-sm flex items-center gap-3 cursor-pointer p-2 rounded-md ${
                  $isDarkMode ? "hover:bg-[#343434]" : "hover:bg-[#eff0f4]"
                }`}
                class:selected={index === selectedIndexAddress}
                on:click={() => {
                  if (selectedIndexAddress !== -1) {
                    if (
                      isDisabled &&
                      ($selectedPackage === "FREE"
                        ? index > 2 + listBundle.length
                        : index > 6 + listBundle.length)
                    ) {
                      return;
                    }
                    if ($wallet !== item.value) {
                      handleSearchAddress(item.value);
                    }
                  }
                }}
              >
                <img
                  src={item.logo}
                  alt=""
                  class={`w-6 h-6 ${
                    item.type !== "BUNDLE" ? "rounded-full" : ""
                  }`}
                />
                <div class="flex-1 flex justify-between items-center">
                  <div
                    class={`hover:underline ${isDisabled && ($selectedPackage === "FREE" ? index > 2 + listBundle.length : index > 6 + listBundle.length) ? ($isDarkMode ? "text-gray-600" : "text-gray-300") : ""}`}
                  >
                    {item.label}
                  </div>
                  <div
                    class={`text-sm flex items-center gap-2 ${
                      $isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {#if index === selectedIndexAddress}
                      <div class="text-[#a6b0c3]">{$t("Select")}</div>
                      <div
                        class="rounded-md w-[24px] h-[24px] p-2 flex justify-center items-center bg-[#a6b0c3] text-white text-sm"
                      >
                        ↵
                      </div>
                    {:else}
                      {shorterAddress(item.value)}
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      <div class="flex flex-col gap-2">
        <div
          class={`text-xs ${$isDarkMode ? "text-gray-200" : "text-gray-400"}`}
        >
          {$t("Recent searches")}
        </div>
        {#if suggestList && suggestList?.length !== 0}
          <div class="flex flex-col gap-2">
            {#each suggestList as suggest}
              <div
                class="text-sm cursor-pointer py-1 w-max"
                on:click={() => {
                  handleSearchAddress(suggest);
                }}
              >
                {suggest && suggest?.length > 9
                  ? shorterAddress(suggest)
                  : suggest}
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-sm text-gray-400">{$t("Empty")}</div>
        {/if}
      </div>
      <div class="border-t-[1px] pt-4 border-gray-200 flex justify-between">
        <div class="flex items-center gap-1">
          <div
            class="rounded-md w-[24px] h-[24px] p-2 flex justify-center items-center bg-[#a6b0c3] text-white text-sm"
          >
            ↑
          </div>
          <div
            class="rounded-md w-[24px] h-[24px] p-2 flex justify-center items-center bg-[#a6b0c3] text-white text-sm"
          >
            ↓
          </div>
          <div class="text-sm text-gray-500">{$t("To Navigate")}</div>
        </div>
        <div class="flex items-center gap-1">
          <div
            class="rounded-md p-1 flex justify-center items-center bg-[#a6b0c3] text-white text-xs"
          >
            ESC
          </div>
          <div class="text-sm text-gray-500">{$t("To Cancel")}</div>
        </div>
        <div class="flex items-center gap-1">
          <div
            class="rounded-md w-[24px] h-[24px] p-2 flex justify-center items-center bg-[#a6b0c3] text-white text-sm"
          >
            ↵
          </div>
          <div class="text-sm text-gray-500">{$t("To Select")}</div>
        </div>
      </div>
    </div>
  </AppOverlay>
</div>

<!-- Search Mobile -->
<div class="lg:hidden block">
  <div
    class={`fixed inset-0 w-full search-mobile search-mobile-container ${
      $showPopoverSearch
        ? "opacity-100 transform translate-x-[0px]"
        : "opacity-0 transform translate-x-[-100vw]"
    }`}
  >
    <div
      class="max-w-[100vw] m-auto w-[90%] h-full flex flex-col gap-4 relative"
    >
      <div class="flex justify-end py-2 border-b-[1px]">
        <div
          class="-mr-1 text-5xl"
          on:click={() => {
            showPopoverSearch.update((n) => (n = false));
          }}
        >
          &times;
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <div
          class={`px-4 w-full flex items-center gap-1 rounded-[1000px] cursor-pointer ${
            $isDarkMode ? "bg-[#343434]" : "bg-[#eff0f4]"
          }`}
        >
          <img
            src={$isDarkMode ? Search : SearchBlack}
            alt=""
            class="w-7 h-7"
          />
          <input
            on:change={(event) => {
              handleSearch(event);
            }}
            on:keydown={(event) => {
              if (
                search &&
                search?.length !== 0 &&
                (event.which == 13 || event.keyCode == 13) &&
                selectedIndexAddress === -1
              ) {
                handleSearchAddress(search);
              }
            }}
            bind:value={search}
            autofocus={true}
            placeholder={$t("Search address")}
            type="text"
            class="flex-1 py-3 text-base border-none focus:outline-none focus:ring-0 bg-transparent"
          />
        </div>
        {#if Object.keys($user).length !== 0}
          <div class="flex flex-col gap-2">
            <div
              class={`text-base ${
                $isDarkMode ? "text-gray-200" : "text-gray-400"
              }`}
            >
              {$t("List addresses")}
            </div>
            <div
              class="h-[74vh] w-full flex flex-col gap-2 overflow-y-auto"
              bind:this={listAddressElement}
            >
              {#each searchListAddressResult as item, index}
                <div
                  id={item.value}
                  class={`relative flex items-center gap-3 cursor-pointer p-2 rounded-md ${
                    $isDarkMode ? "hover:bg-[#343434]" : "hover:bg-[#eff0f4]"
                  }`}
                  class:selected={index === selectedIndexAddress}
                  on:click={() => {
                    if (selectedIndexAddress !== -1) {
                      if (
                        isDisabled &&
                        ($selectedPackage === "FREE"
                          ? index > 2 + listBundle.length
                          : index > 6 + listBundle.length)
                      ) {
                        return;
                      }
                      if ($wallet !== item.value) {
                        handleSearchAddress(item.value);
                      }
                    }
                  }}
                >
                  <img
                    src={item.logo}
                    alt=""
                    class={`w-6 h-6 ${
                      item.type !== "BUNDLE" ? "rounded-full" : ""
                    }`}
                  />
                  <div
                    class={`flex-1 flex justify-between items-center ${isDisabled && ($selectedPackage === "FREE" ? index > 2 + listBundle.length : index > 6 + listBundle.length) ? ($isDarkMode ? "text-gray-600" : "text-gray-300") : ""}`}
                  >
                    <div class="hover:underline text-base">{item.label}</div>
                    <div
                      class={`text-base ${isDisabled && ($selectedPackage === "FREE" ? index > 2 + listBundle.length : index > 6 + listBundle.length) ? ($isDarkMode ? "text-gray-600" : "text-gray-300") : $isDarkMode ? "text-gray-300" : "text-gray-500"}`}
                    >
                      {shorterAddress(item.value)}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .customScrollDiv::-webkit-scrollbar {
    width: 3px;
    background: #27326f;
  }

  .customScrollDiv::-webkit-scrollbar-thumb {
    background: gray;
  }

  @media screen and (max-width: 500px) {
    @media screen and (max-height: 670px) {
      .list-nav {
        height: 35vh !important;
      }
      .hide-social {
        display: none !important;
      }
      /* hide social */
    }
    /* @media screen and (max-height: 470px) {
      .list-nav {
        height: 40vh;
      }
    } */

    .list-nav {
      height: 50vh;
    }
  }

  .search-mobile {
    height: 100vh;
    z-index: 2147483649;

    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 250ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

    --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
      0 8px 10px -6px rgb(0 0 0 / 0.1);
    --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color),
      0 8px 10px -6px var(--tw-shadow-color);
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
      var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  }

  .mobile {
    height: 100vh;
    z-index: 2147483649;
    backdrop-filter: blur(12px);

    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 250ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

    --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
      0 8px 10px -6px rgb(0 0 0 / 0.1);
    --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color),
      0 8px 10px -6px var(--tw-shadow-color);
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
      var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  }

  :global(body) .selected {
    background: #eff0f4;
  }
  :global(body.dark) .selected {
    background: #343434;
  }

  :global(body) .bg_fafafbff {
    background: #fafafbff;
  }
  :global(body.dark) .bg_fafafbff {
    background: #212121;
  }

  /* old code before hide transactions */
  /* @media (min-width: 1536px) {
    :global(body) .absolute-center {
      left: 49.5%;
      transform: translate(-50%, -50%);
    }
  } */

  :global(body) .absolute-center {
    /* position: absolute; */
    left: 49.5%;
    transform: translate(-50%, -50%);
  }

  @supports (height: 100dvh) {
    .mobile {
      height: 100dvh;
    }
    .search-mobile {
      height: 100dvh;
    }
  }

  .input-border-error {
    border: 1px solid red;
  }

  :global(body) .mobile-container {
    background: rgba(39, 50, 111, 0.98);
  }
  :global(body.dark) .mobile-container {
    background: rgba(8, 8, 8, 0.98);
  }

  :global(body) .whitelabel-header-container {
    background-image: linear-gradient(130deg, #167e0a 0%, #3fd681 100%);
  }
  :global(body.dark) .whitelabel-header-container {
    background-image: linear-gradient(130deg, #072b03 0%, #167e0a 100%);
  }

  :global(body) .mobile-header-container {
    background-color: #27326f;
  }
  :global(body.dark) .mobile-header-container {
    background: #080808;
  }

  :global(body) .search-mobile-container {
    background: white;
  }
  :global(body.dark) .search-mobile-container {
    background: black;
  }

  :global(body) .select_content {
    background: #ffffff;
    border: 0.5px solid transparent;
  }
  :global(body.dark) .select_content {
    background: #131313;
    border: 0.5px solid #cdcdcd59;
  }
</style>
