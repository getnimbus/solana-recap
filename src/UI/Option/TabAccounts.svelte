<script lang="ts">
  import { onMount } from "svelte";
  import { dndzone } from "svelte-dnd-action";
  import { generationLogo, detectedGeneration } from "~/lib/chains";
  import { triggerToast } from "~/utils/functions";
  import {
    wallet,
    chain,
    typeWallet,
    selectedPackage,
    isDarkMode,
    user,
    triggerUpdateBundle,
    userPublicAddress,
    tonConnector,
    isTWA,
  } from "~/store";
  import mixpanel from "mixpanel-browser";
  import { API_URL, nimbus } from "~/lib/network";
  import { t } from "~/lib/i18n";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { AnimateSharedLayout, Motion } from "svelte-motion";
  import { wait } from "~/utils/index";
  import * as browser from "webextension-polyfill";
  import { getListAddress, handleValidateAddress } from "~/lib/queryAPI";
  import { useNavigate } from "svelte-navigator";
  import tooltip from "~/lib/tooltip";
  import { isNimbusVersion } from "~/utils/constants";

  import Tooltip from "~/components/Tooltip.svelte";
  import AppOverlay from "~/components/Overlay.svelte";
  import Button from "~/components/Button.svelte";
  import Copy from "~/components/Copy.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";
  import TmaTonAuth from "../Auth/TMATonAuth.svelte";

  import Logo from "~/assets/logo-2.png";
  import LogoWhite from "~/assets/logo-white.svg";
  import Plus from "~/assets/plus.svg";
  import PlusBlack from "~/assets/plus-black.svg";
  import User from "~/assets/user.png";
  import Success from "~/assets/shield-done.svg";

  const navigate = useNavigate();

  let errors: any = {};
  let errorsEdit: any = {};
  let listAddress: any = [];
  let listAddressWithoutBundle: any = [];
  let selectedItemEdit: any = {};
  let isOpenEditModal = false;
  let isOpenAddModal = false;
  let isOpenConfirmDelete = false;
  let selectedWallet = {};
  let address = "";
  let label = "";
  let isLoadingAddDEX = false;
  let isLoadingDelete = false;
  let isLoadingEditDEX = false;
  let isLoadingConnectCEX = false;
  let isLoadingDeleteBundles = false;
  let isOpenConfirmDeleteBundles = false;

  let isOpenModal = false;
  let isLoadingSendMail = false;
  let email = "";

  let isDisabled = false;
  let tooltipDisableAddBtn = "";

  let groupedToBundles = true;
  let selectYourWalletsBundle: any = [];

  let scrollContainer: any;
  let isScrollStart = true;
  let isScrollEnd = false;
  let container;

  const handleScroll = () => {
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
    isScrollStart = scrollLeft === 0;
    isScrollEnd = scrollLeft + clientWidth >= scrollWidth - 1;
  };

  let checkAll = false;
  let selectedAddresses: any = [];
  let nameBundle = "";
  let listBundle: any = [];
  let selectedBundle = {};
  let isAddBundle = false;
  let isLoadingBundle = false;

  let timerDebounceSort;

  const queryClient = useQueryClient();

  const isRequiredFieldValid = (value) => {
    return value !== null && value !== "";
  };

  const validateForm = async (data) => {
    const isDuplicatedAddress = listAddress.some((item) => {
      return item.address.toLowerCase() === data.address.toLowerCase();
    });

    if (!isRequiredFieldValid(data.address)) {
      errors["address"] = {
        ...errors["address"],
        required: true,
        msg: "Account is required",
      };
    } else {
      const addressValidate = await handleValidateAddress(data.address);

      if (data.address && addressValidate === undefined) {
        errors["address"] = {
          ...errors["address"],
          required: true,
          msg: "Please enter your account again!",
        };
      } else if (isDuplicatedAddress) {
        errors["address"] = {
          ...errors["address"],
          required: true,
          msg: "This account is duplicated!",
        };
        return;
      } else {
        errors["address"] = { ...errors["address"], required: false };
      }
    }

    if (!isRequiredFieldValid(data.label)) {
      errors["label"] = {
        ...errors["label"],
        required: true,
        msg: "Label is required",
      };
    } else {
      errors["label"] = { ...errors["label"], required: false };
    }
  };

  const validateFormEdit = (data) => {
    if (!isRequiredFieldValid(data.label)) {
      errorsEdit["label"] = {
        ...errorsEdit["label"],
        required: true,
        msg: "Label is required",
      };
    } else {
      errorsEdit["label"] = { ...errorsEdit["label"], required: false };
    }
  };

  const formatDataListAddress = (data) => {
    const structWalletData = data.map((item) => {
      return {
        position: item.position,
        id: item.id,
        type: item.type,
        label: item.label,
        logo: detectedGeneration(item.type),
        address: item.accountId,
        accounts:
          item?.accounts?.map((account) => {
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
    listAddressWithoutBundle = structWalletData.filter(
      (item) => item.type !== "BUNDLE",
    );

    const selectYourBundle = structWalletData?.find(
      (item) => item.type === "BUNDLE" && item.label === "Your wallets",
    );
    selectYourWalletsBundle = selectYourBundle?.accounts?.map(
      (item) => item.value,
    );

    if (listAddressWithoutBundle && listAddressWithoutBundle?.length === 1) {
      browser.storage.sync.set({
        selectedWallet: listAddressWithoutBundle[0]?.address,
      });
      browser.storage.sync.set({ selectedChain: "ALL" });
      browser.storage.sync.set({
        typeWalletAddress: "EVM",
      });
      chain.update((n) => (n = "ALL"));
      typeWallet.update((n) => (n = "EVM"));
      wallet.update((n) => (n = listAddressWithoutBundle[0]?.address));
    }
  };

  $: query = createQuery({
    queryKey: ["list-address"],
    queryFn: () => getListAddress(),
    retry: false,
    enabled: Boolean($user && Object.keys($user)?.length !== 0),
  });

  $: {
    if (!$query.isError && $query.data !== undefined) {
      formatDataListAddress($query.data);
    }
  }

  // Add DEX address account
  const onSubmit = async (e: any) => {
    isLoadingAddDEX = true;
    try {
      const formData = new FormData(e.target);

      const data: any = {};
      for (let field of formData) {
        const [key, value] = field;
        data[key] = value;
      }

      await validateForm(data);

      if (
        !Object.keys(errors).some((inputName) => errors[inputName]["required"])
      ) {
        Object.assign(data, { id: data.address });

        const validateAccount = await handleValidateAddress(data.address);

        if (groupedToBundles) {
          await nimbus.put(
            `/address/personalize/bundle?name=${"Your wallets"}`,
            {
              name: "Your wallets",
              addresses: selectYourWalletsBundle?.concat([
                validateAccount?.address,
              ]),
            },
          );
          queryClient.invalidateQueries(["list-bundle"]);
        }

        const response: any = await nimbus.post("/accounts", {
          type: "DEX",
          publicAddress: validateAccount?.address,
          accountId: validateAccount?.address,
          label: data.label,
        });

        if (response?.error) {
          triggerToast("Can't add new wallet address at this time!", "fail");
          isLoadingAddDEX = true;
          return;
        }

        e.target.reset();
        isLoadingAddDEX = false;
        isOpenAddModal = false;
        queryClient.refetchQueries(["list-address"]);

        browser.storage.sync.set({ selectedChain: "ALL" });
        browser.storage.sync.set({
          typeWalletAddress: validateAccount?.type,
        });
        browser.storage.sync.set({
          selectedWallet: validateAccount?.address,
        });

        chain.update((n) => (n = "ALL"));
        typeWallet.update((n) => (n = validateAccount?.type));
        wallet.update((n) => (n = validateAccount?.address));

        triggerToast($t("Successfully add On-chain account!"), "success");
        mixpanel.track("user_add_address");

        errors["address"] = {
          ...errors["address"],
          required: false,
          msg: "",
        };
        errors["label"] = { ...errors["label"], required: false, msg: "" };

        address = "";
        label = "";
      } else {
        console.error("Invalid Form");
        isLoadingAddDEX = false;
      }
    } catch (e) {
      console.error(e);
      isLoadingAddDEX = false;
      triggerToast(
        $t("Something wrong when add DEX account. Please try again!"),
        "fail",
      );
    }
  };

  // Edit account
  const onSubmitEdit = async (e) => {
    isLoadingEditDEX = true;
    try {
      const formData = new FormData(e.target);

      const data: any = {};
      for (let field of formData) {
        const [key, value] = field;
        data[key] = value;
      }

      await validateFormEdit(data);
      if (
        !Object.keys(errorsEdit).some(
          (inputName) => errorsEdit[inputName]["required"],
        )
      ) {
        Object.assign(data, { id: data.address });

        await nimbus.put(`/accounts/${selectedItemEdit.id}`, {
          accountId: selectedItemEdit.address,
          label: data.label,
        });

        queryClient.refetchQueries(["list-address"]);
        e.target.reset();
        isOpenEditModal = false;
        isLoadingEditDEX = false;
        triggerToast($t("Successfully edit your wallet!"), "success");
        mixpanel.track("user_edit_address");
      } else {
        await validateFormEdit(data);
        if (
          !Object.keys(errorsEdit).some(
            (inputName) => errorsEdit[inputName]["required"],
          )
        ) {
          Object.assign(data, { id: data.address });

          await nimbus.put(`/accounts/${selectedItemEdit.id}`, {
            accountId: selectedItemEdit.address,
            label: data.label,
          });

          queryClient.refetchQueries(["list-address"]);
          e.target.reset();
          isOpenEditModal = false;
          isLoadingEditDEX = false;
          triggerToast($t("Successfully edit your wallet!"), "success");
          mixpanel.track("user_edit_address");
        } else {
          console.error("Invalid Form");
          isLoadingEditDEX = false;
        }
      }
    } catch (e) {
      console.error(e);
      isLoadingEditDEX = false;
      triggerToast(
        $t("Something wrong when edit your wallet. Please try again!"),
        "fail",
      );
    }
  };

  // Delete account
  const handleDelete = async (item) => {
    isLoadingDelete = true;
    try {
      await nimbus.delete(`/accounts/${item.id}`, {});
      queryClient.refetchQueries(["list-address"]);
      isLoadingDelete = false;
      isOpenConfirmDelete = false;
      triggerToast($t("Successfully delete your account!"), "success");
    } catch (e) {
      console.error("e: ", e);
      isLoadingDelete = false;
      isOpenConfirmDelete = false;
      triggerToast(
        $t("Something wrong when delete your account. Please try again!"),
        "fail",
      );
    }
  };

  const debounceSort = (listAddress) => {
    clearTimeout(timerDebounceSort);
    timerDebounceSort = setTimeout(() => {
      handleSortListAddress(listAddress);
    }, 300);
  };

  // Sort list address
  const handleSortListAddress = async (listAddress) => {
    try {
      const formatListAddress = listAddress.map((item, index) => {
        return {
          id: item.id,
          publicAddress: item.address,
          position: index,
        };
      });
      await nimbus.post(`/accounts/sorting`, formatListAddress);
      queryClient.refetchQueries(["list-address"]);
    } catch (e) {
      console.error("e: ", e);
    }
  };

  const handleSelectedEdit = (item) => {
    selectedItemEdit = item;
    address = item.address;
    label = item.label;
    isOpenEditModal = true;
  };

  $: {
    if (
      address &&
      errors.address &&
      errors.address.msg === "Account is required"
    ) {
      errors["address"] = { ...errors["address"], required: false, msg: "" };
    }
    if (
      address &&
      errorsEdit.address &&
      errorsEdit.address.msg === "Account is required"
    ) {
      errorsEdit["address"] = {
        ...errors["address"],
        required: false,
        msg: "",
      };
    }
    if (label && errors.label && errors.label.msg === "Label is required") {
      errors["label"] = { ...errors["label"], required: false, msg: "" };
    }
    if (
      label &&
      errorsEdit.label &&
      errorsEdit.label.msg === "Label is required"
    ) {
      errorsEdit["label"] = { ...errors["label"], required: false, msg: "" };
    }
  }

  $: {
    if (listAddress && listAddress?.length === 0) {
      wallet.update((n) => (n = ""));
      chain.update((n) => (n = ""));
      typeWallet.update((n) => (n = ""));
    }
  }

  $: {
    if (
      $selectedPackage === "FREE" &&
      listAddress.filter((item) => item.type !== "BUNDLE")?.length > 2
    ) {
      isDisabled = true;
    } else if (
      $selectedPackage === "EXPLORER" &&
      listAddress.filter((item) => item.type !== "BUNDLE")?.length > 6
    ) {
      isDisabled = true;
    } else {
      isDisabled = false;
    }
  }

  $: {
    if ($user && Object.keys($user)?.length === 0) {
      tooltipDisableAddBtn = `${$t("Connect wallet to track portfolio")}`;
    }
    if (isDisabled) {
      if ($selectedPackage === "FREE") {
        tooltipDisableAddBtn =
          "You've reached the maximum number of wallets. Upgrade to the EXPLORER Plan to add more";
      }
      if ($selectedPackage === "EXPLORER") {
        tooltipDisableAddBtn =
          "You've reached the maximum number of wallets. Upgrade to the ALPHA Plan to add more";
      }
    }
  }

  onMount(() => {
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

  const getListBundle = async () => {
    const response: any = await nimbus.get("/address/personalize/bundle");
    return response.data;
  };

  $: queryListBundle = createQuery({
    queryKey: ["list-bundle"],
    queryFn: () => getListBundle(),
    enabled: Boolean($user && Object.keys($user)?.length !== 0),
  });

  $: {
    if (
      !$queryListBundle.isError &&
      $queryListBundle.data &&
      $queryListBundle?.data?.length !== 0
    ) {
      listBundle = $queryListBundle?.data.map((item) => {
        return {
          name: item?.name,
          addresses: item?.accounts?.map((eachAccount) => eachAccount.address),
        };
      });
      if (listBundle?.length === listAddressWithoutBundle?.length) {
        checkAll = true;
      }
    }
  }

  onMount(() => {
    mixpanel.track("accounts_page");
  });

  const handleResetBundleState = () => {
    nameBundle = "";
    selectedBundle = {};
  };

  // handle submit (create and edit) bundle
  const onSubmitBundle = async () => {
    if (selectedAddresses && selectedAddresses?.length > 100) {
      triggerToast(
        "You can create your bundle with maximum is 100 addresses. Please try again!",
        "fail",
      );
      isLoadingBundle = false;
      return;
    }

    if (selectedAddresses && selectedAddresses?.length === 0) {
      triggerToast($t("Please select addresses to bundle!"), "fail");
      isLoadingBundle = false;
      return;
    }

    if (
      listBundle?.find((item) => item.name === nameBundle) &&
      selectedBundle &&
      Object.keys(selectedBundle)?.length === 0
    ) {
      triggerToast($t("Bundle already existed!"), "fail");
      isLoadingBundle = false;
      return;
    }

    isLoadingBundle = true;
    try {
      const formData = {
        name: nameBundle,
        addresses: selectedAddresses,
      };

      if (selectedBundle && Object.keys(selectedBundle)?.length !== 0) {
        await nimbus.put(
          `/address/personalize/bundle?name=${selectedBundle?.name}`,
          formData,
        );

        queryClient.invalidateQueries(["list-bundle"]);
        queryClient.invalidateQueries(["list-address"]);

        triggerToast($t("Successfully edit your bundle!"), "success");
      } else {
        const response = await nimbus.post(
          "/address/personalize/bundle",
          formData,
        );

        queryClient.refetchQueries(["list-bundle"]);
        queryClient.invalidateQueries(["list-address"]);

        listBundle = response?.data?.map((item) => {
          return {
            name: item?.name,
            addresses: item?.accounts?.map(
              (eachAccount) => eachAccount.address,
            ),
          };
        });

        selectedBundle = listBundle[listBundle?.length - 1];
        selectedAddresses = listBundle[listBundle?.length - 1].addresses;
        nameBundle = listBundle[listBundle?.length - 1].name;

        triggerToast($t("Successfully create your bundle!"), "success");
      }

      triggerUpdateBundle.update((n) => (n = true));
      isLoadingBundle = false;
    } catch (e) {
      console.error("e: ", e);
      triggerToast(
        `Something wrong when ${
          selectedBundle && Object.keys(selectedBundle)?.length !== 0
            ? "edit"
            : "create"
        } your bundle. Please try again!`,
        "fail",
      );
      isLoadingBundle = false;
    }
  };

  // handle delete bundle
  const handleDeleteBundle = async () => {
    isLoadingDeleteBundles = true;
    try {
      await nimbus.delete(
        `/address/personalize/bundle?name=${selectedBundle?.name}`,
        selectedBundle,
      );
      triggerToast($t("Successfully delete your bundle!"), "success");
      listBundle = listBundle.filter(
        (item) => item.name !== selectedBundle?.name,
      );
      queryClient.refetchQueries(["list-bundle"]);
      queryClient.invalidateQueries(["list-address"]);
      handleResetBundleState();
      selectedAddresses = [];
      isAddBundle = false;
      isLoadingDeleteBundles = false;
      isOpenConfirmDeleteBundles = false;
    } catch (e) {
      triggerToast(
        "Something wrong when delete your bundle. Please try again!",
        "fail",
      );
      isLoadingDeleteBundles = false;
      isOpenConfirmDeleteBundles = false;
      console.error("e: ", e);
    }
  };

  const handleToggleCheckAll = (e) => {
    if (isDisabled) {
      return;
    }
    if (e.target.checked) {
      selectedAddresses = listAddressWithoutBundle.map((item) => item.address);
      checkAll = true;
    } else {
      selectedAddresses = [];
      checkAll = false;
    }
  };

  const closeMobileAddAccountModal = () => {
    isOpenAddModal = false;
  };
</script>

<div class="flex flex-col gap-4">
  {#if (listAddress && listAddress?.length === 0) || $query.isError}
    <div class="flex md:flex-row flex-col items-start justify-between">
      <div class="flex flex-col gap-1">
        <div class="xl:title-3 title-2">{$t("Account Settings")}</div>
        <div class="text-base text-gray-500">
          {$t("Management your")}
        </div>
      </div>
      <div class="relative xl:w-max w-[200px]">
        {#if $user && Object.keys($user)?.length !== 0}
          <Button variant="tertiary" on:click={() => (isOpenAddModal = true)}>
            <img src={Plus} alt="" class="w-3 h-3" />
            <div class="text-white">{$t("Add wallet")}</div>
          </Button>
        {:else}
          <div
            use:tooltip={{
              content: `<tooltip-detail text="${$t("Connect wallet to track portfolio")}" />`,
              allowHTML: true,
              placement: "top",
            }}
          >
            <Button variant="disabled">
              <img
                src={$isDarkMode ? PlusBlack : Plus}
                alt=""
                class="w-3 h-3"
              />
              <div class={`${$isDarkMode ? "text-gray-400" : "text-white"}`}>
                {$t("Add wallet")}
              </div>
            </Button>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <div class="xl:title-3 title-2">{$t("Account Settings")}</div>
        <div class="text-base text-gray-500">
          {$t("Management your")}
        </div>
      </div>

      {#if !$query.isError}
        <div
          class="flex lg:flex-row flex-col lg:items-center items-start justify-between lg:gap-10 gap-5"
        >
          {#if listBundle && listBundle?.length === 0}
            <div class="text-base">
              {$t("Create bundle 7")}
            </div>
          {:else}
            <div
              class="relative flex items-center justify-between w-full gap-3 overflow-hidden"
              bind:this={container}
            >
              <div
                class={`text-white absolute left-0 py-2 rounded-tl-lg rounded-bl-lg ${
                  isScrollStart ? "hidden" : "block"
                }`}
                style="background-image: linear-gradient(to right, rgba(156, 163, 175, 0.5) 0%, rgba(255,255,255,0) 100% );"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  height="24px"
                  width="24px"
                  viewBox="0 0 24 24"
                  class="sc-aef7b723-0 fKbUaI"
                >
                  <path
                    d="M15 6L9 12L15 18"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <div
                class="flex gap-3 px-2 overflow-x-auto w-max whitespace-nowrap"
                bind:this={scrollContainer}
                on:scroll={handleScroll}
              >
                <AnimateSharedLayout>
                  {#each listBundle.sort((a, b) => {
                    if (a.name === "Your wallets") return -1;
                    if (b.name === "Your wallets") return 1;
                    return 0;
                  }) as item}
                    <div
                      class="relative cursor-pointer text-base font-medium py-1 px-3 rounded-[100px] transition-all"
                      on:click={() => {
                        selectedBundle = item;
                        selectedAddresses = item.addresses;
                        nameBundle = item.name;
                      }}
                    >
                      <div
                        class={`relative z-1 ${
                          selectedBundle === item && "text-white"
                        }`}
                      >
                        {item.name}
                      </div>
                      {#if selectedBundle === item}
                        <Motion
                          let:motion
                          layoutId="active-pill"
                          transition={{ type: "spring", duration: 0.6 }}
                        >
                          <div
                            class="absolute inset-0 z-0 rounded-full bg-[#1E96FC]"
                            use:motion
                          />
                        </Motion>
                      {/if}
                    </div>
                  {/each}
                </AnimateSharedLayout>
              </div>
              {#if scrollContainer?.scrollWidth >= container?.offsetWidth}
                <div
                  class={`text-white absolute right-0 py-2 rounded-tr-lg rounded-br-lg ${
                    isScrollEnd ? "hidden" : "block"
                  }`}
                  style="background-image: linear-gradient(to left,rgba(156, 163, 175, 0.5) 0%, rgba(255,255,255,0) 100%);"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    height="24px"
                    width="24px"
                    viewBox="0 0 24 24"
                    class="sc-aef7b723-0 fKbUaI"
                  >
                    <path
                      d="M9 6L15 12L9 18"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-miterlimit="10"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              {/if}
            </div>
          {/if}

          <div
            class="flex md:flex-row flex-col md:items-center items-start justify-end flex-1 gap-4"
          >
            {#if listBundle && listBundle?.length !== 0 && selectedBundle && Object.keys(selectedBundle)?.length !== 0 && selectedBundle?.name !== "Your wallets"}
              <div
                class="font-semibold text-red-500 cursor-pointer w-max text-base"
                on:click={() => (isOpenConfirmDeleteBundles = true)}
              >
                {$t("Delete")}
              </div>
            {/if}

            <div class="flex items-center gap-4">
              <!-- add bundle -->
              {#if $user && Object.keys($user)?.length === 0}
                <div class="w-max">
                  <Button variant="disabled" disabled>
                    <img
                      src={$isDarkMode ? PlusBlack : Plus}
                      alt=""
                      class="w-3 h-3"
                    />
                    <div
                      class={`${$isDarkMode ? "text-gray-400" : "text-white"}`}
                    >
                      {$t("Add bundle")}
                    </div>
                  </Button>
                </div>
              {:else}
                <div class="w-max">
                  {#if isDisabled || ($user && Object.keys($user)?.length === 0)}
                    <Button
                      variant="tertiary"
                      on:click={() => {
                        isOpenModal = true;
                      }}
                    >
                      <img
                        src={$isDarkMode ? PlusBlack : Plus}
                        alt=""
                        class="w-3 h-3"
                      />
                      <div
                        class={`${$isDarkMode ? "text-gray-400" : "text-white"}`}
                      >
                        {$t("Add bundle")}
                      </div>
                    </Button>
                  {:else}
                    <Button
                      variant="tertiary"
                      on:click={() => {
                        isAddBundle = true;
                        handleResetBundleState();
                        selectedAddresses = [];
                      }}
                    >
                      <img src={Plus} alt="" class="w-3 h-3" />
                      <div class="text-white">{$t("Add bundle")}</div>
                    </Button>
                  {/if}
                </div>
              {/if}

              <!-- add wallet -->
              {#if $user && Object.keys($user)?.length === 0}
                <div class="w-max">
                  <Button variant="disabled" disabled>
                    <img src={Plus} alt="" class="w-3 h-3" />
                    <div class="text-white">{$t("Add wallet")}</div>
                  </Button>
                </div>
              {:else}
                <div class="w-max">
                  {#if isDisabled}
                    <Button
                      variant="tertiary"
                      on:click={() => {
                        isOpenModal = true;
                      }}
                    >
                      <img src={Plus} alt="" class="w-3 h-3" />
                      <div class="text-white">{$t("Add wallet")}</div>
                    </Button>
                  {:else}
                    <Button
                      variant="tertiary"
                      on:click={() => {
                        isOpenAddModal = true;
                      }}
                    >
                      <img src={Plus} alt="" class="w-3 h-3" />
                      <div class="text-white">{$t("Add wallet")}</div>
                    </Button>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <div class="border-t-[1.5px] border_0000000d pt-4">
    {#if isAddBundle || (selectedBundle && selectedBundle !== null && Object.keys(selectedBundle)?.length !== 0)}
      <form
        on:submit|preventDefault={onSubmitBundle}
        class="flex flex-col gap-4"
      >
        <div
          class={`flex flex-col gap-1 input-2 w-full py-[6px] px-3 ${
            nameBundle && !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
          }`}
        >
          <div
            class={`text-base font-medium ${
              $isDarkMode ? "text-gray-400" : "text-[#666666]"
            }`}
          >
            {$t("Bundle")}
          </div>
          <input
            type="text"
            placeholder={$t("Your bundle name")}
            class={`p-0 border-none focus:outline-none focus:ring-0 text-sm font-normal ${
              nameBundle && !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
            } ${
              $isDarkMode
                ? "text-white"
                : "text-[#5E656B] placeholder-[#5E656B]"
            }`}
            required
            disabled={selectedBundle?.name === "Your wallets" || isDisabled
              ? true
              : false}
            bind:value={nameBundle}
          />
        </div>

        <!-- Desktop View -->
        <div
          class={`xl:block hidden border border_0000000d rounded-[10px] xl:overflow-hidden overflow-x-auto h-full ${
            $isDarkMode ? "bg-[#131313]" : "bg-[#fff]"
          }`}
        >
          <table class="table-auto xl:w-full w-[1800px] h-full">
            <thead>
              <tr class="bg_f4f5f8">
                <th class="flex items-center justify-start gap-6 py-3 pl-3">
                  <input
                    type="checkbox"
                    on:change={handleToggleCheckAll}
                    bind:checked={checkAll}
                    disabled={isDisabled}
                    class={`cursor-pointer relative w-5 h-5 appearance-none rounded-[0.25rem] border outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] ${isDisabled ? "opacity-50" : "opacity-100"}`}
                  />
                  <div class="font-medium uppercase text-xs">{$t("Label")}</div>
                </th>
                <th class="py-3">
                  <div class="font-medium text-left uppercase text-xs">
                    {$t("Account")}
                  </div>
                </th>
                <th class="py-3 pr-3">
                  <div class="font-medium text-right uppercase text-xs">
                    {$t("Action")}
                  </div>
                </th>
              </tr>
            </thead>
            {#if $query.isLoading}
              <tbody>
                <tr>
                  <td colspan="3">
                    <div
                      class="flex items-center justify-center h-full px-3 py-4"
                    >
                      {#if isNimbusVersion}
                        <LoadingPremium />
                      {:else}
                        <Loading />
                      {/if}
                    </div>
                  </td>
                </tr>
              </tbody>
            {:else}
              <tbody>
                {#if listAddress && listAddress?.length === 0}
                  <tr>
                    <td colspan="3">
                      <div
                        class="flex items-center justify-center h-full px-3 py-4"
                      >
                        {$t("No address")}
                      </div>
                    </td>
                  </tr>
                {:else}
                  {#each listAddressWithoutBundle as item (item.id)}
                    <tr class="transition-all group">
                      <td
                        class={`pl-3 py-3 ${
                          $isDarkMode
                            ? "group-hover:bg-[#000]"
                            : "group-hover:bg-gray-100"
                        }`}
                      >
                        <div
                          class="flex items-center gap-6 text-left text-base"
                        >
                          <div class="flex justify-center">
                            <input
                              type="checkbox"
                              value={item.address}
                              bind:group={selectedAddresses}
                              disabled={isDisabled}
                              class={`cursor-pointer relative w-5 h-5 appearance-none rounded-[0.25rem] border outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] ${isDisabled ? "opacity-50" : "opacity-100"}`}
                            />
                          </div>
                          <div class="flex items-center gap-2">
                            <img
                              src={item.logo}
                              alt=""
                              class="w-5 h-5 xl:w-4 xl:h-4 rounded-full"
                            />
                            {item.label}
                          </div>
                        </div>
                      </td>

                      <td
                        class={`py-3  ${
                          $isDarkMode
                            ? "group-hover:bg-[#000]"
                            : "group-hover:bg-gray-100"
                        }`}
                      >
                        <div
                          class="bg-[#6AC7F533] text_27326F w-max px-3 py-1 rounded-[5px] text-base"
                        >
                          <Copy
                            address={item.address}
                            iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                            color={`${$isDarkMode ? "#fff" : "#000"}`}
                            displayNameService={""}
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
                        <div class="flex justify-end gap-6">
                          {#if item.label !== "My address" || item.address !== $userPublicAddress}
                            <div
                              class="font-semibold text-red-600 transition-all cursor-pointer hover:underline text-base"
                              on:click={() => {
                                isOpenConfirmDelete = true;
                                selectedWallet = item;
                              }}
                            >
                              {$t("Delete")}
                            </div>
                          {/if}
                          <div
                            class="font-semibold text-blue-600 transition-all cursor-pointer hover:underline text-base"
                            on:click={() => handleSelectedEdit(item)}
                          >
                            {$t("Edit")}
                          </div>
                        </div>
                      </td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            {/if}
          </table>
        </div>

        <!-- Mobile view -->
        <div class="xl:hidden block">
          <div class="flex items-center justify-start gap-4">
            <input
              type="checkbox"
              on:change={handleToggleCheckAll}
              bind:checked={checkAll}
              disabled={isDisabled}
              class={`cursor-pointer relative w-5 h-5 appearance-none rounded-[0.25rem] border outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] ${isDisabled ? "opacity-50" : "opacity-100"}`}
            />
            <div class="uppercase">All</div>
          </div>

          <div class="flex flex-col gap-4 mt-4">
            {#each listAddress as item}
              <div class="flex flex-col gap-2 pb-3 border-b last:border-none">
                <div class="flex justify-between gap-2">
                  <div class="flex items-center gap-4 text-base text-left">
                    <div class="flex justify-center">
                      <input
                        type="checkbox"
                        value={item.address}
                        bind:group={selectedAddresses}
                        disabled={isDisabled}
                        class={`cursor-pointer relative w-5 h-5 appearance-none rounded-[0.25rem] border outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] ${isDisabled ? "opacity-50" : "opacity-100"}`}
                      />
                    </div>
                    <div class="flex items-center gap-2">
                      <img
                        src={item.logo}
                        alt=""
                        class="w-6 h-6 rounded-full"
                      />
                      {item.label}
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <div
                      class="text-base font-semibold text-blue-600 transition-all cursor-pointer hover:underline"
                      on:click={() => handleSelectedEdit(item)}
                    >
                      {$t("Edit")}
                    </div>
                    <div
                      class="text-base font-semibold text-red-600 transition-all cursor-pointer hover:underline"
                      on:click={() => {
                        isOpenConfirmDelete = true;
                        selectedWallet = item;
                      }}
                    >
                      {$t("Delete")}
                    </div>
                  </div>
                </div>
                <div
                  class="bg-[#6AC7F533] text_27326F w-max px-3 py-1 rounded-[5px] text-base"
                >
                  <Copy
                    address={item.address}
                    iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                    color={`${$isDarkMode ? "#fff" : "#000"}`}
                    isShorten
                    displayNameService={""}
                  />
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="flex justify-end gap-4">
          <div class="w-[120px]">
            <Button
              variant="secondary"
              on:click={() => {
                selectedAddresses = selectedBundle.addresses;
                isAddBundle = false;
                handleResetBundleState();
              }}
              disabled={isDisabled}
            >
              {$t("Cancel")}
            </Button>
          </div>
          <div class="w-[120px]">
            <Button
              type="submit"
              variant="tertiary"
              isLoading={isLoadingBundle}
              disabled={isDisabled}
            >
              {#if selectedBundle && Object.keys(selectedBundle)?.length !== 0}
                {$t("Save")}
              {:else}
                {$t("Add")}
              {/if}
            </Button>
          </div>
        </div>
      </form>
    {:else}
      <!-- Desktop View -->
      <div
        class={`xl:block hidden border border_0000000d rounded-[10px] xl:overflow-hidden overflow-x-auto h-full ${
          $isDarkMode ? "bg-[#131313]" : "bg-[#fff]"
        }`}
      >
        <table class="table-auto xl:w-full w-[1800px] h-full">
          <thead>
            <tr class="bg_f4f5f8">
              <th class="py-3 pl-3">
                <div class="font-medium text-left uppercase text-xs">
                  {$t("Label")}
                </div>
              </th>
              <th class="py-3">
                <div class="font-medium text-left uppercase text-xs">
                  {$t("Account")}
                </div>
              </th>
              <th class="py-3 pr-3">
                <div class="font-medium text-right uppercase text-xs">
                  {$t("Action")}
                </div>
              </th>
            </tr>
          </thead>
          {#if $query.isError}
            <tbody>
              <tr>
                <td colspan="3">
                  <div
                    class="flex items-center justify-center h-full px-3 py-4"
                  >
                    Please connect wallet
                  </div>
                </td>
              </tr>
            </tbody>
          {:else if $query.isLoading}
            <tbody>
              <tr>
                <td colspan="3">
                  <div
                    class="flex items-center justify-center h-full px-3 py-4"
                  >
                    {#if isNimbusVersion}
                      <LoadingPremium />
                    {:else}
                      <Loading />
                    {/if}
                  </div>
                </td>
              </tr>
            </tbody>
          {:else if isDisabled}
            <tbody>
              {#if (listAddressWithoutBundle && listAddressWithoutBundle?.length === 0) || $query.isError}
                <tr>
                  <td colspan="3">
                    <div
                      class="flex items-center justify-center h-full px-3 py-4 text-base"
                    >
                      {$t("No address")}
                    </div>
                  </td>
                </tr>
              {:else}
                {#each listAddressWithoutBundle as item (item.id)}
                  <tr class="transition-all group">
                    <td
                      class={`pl-3 py-3 ${
                        $isDarkMode
                          ? "group-hover:bg-[#000]"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      <div class="flex items-center gap-3 text-left text-base">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          class="opacity-50"
                        >
                          <path
                            d="M21 7.75H3C2.59 7.75 2.25 7.41 2.25 7C2.25 6.59 2.59 6.25 3 6.25H21C21.41 6.25 21.75 6.59 21.75 7C21.75 7.41 21.41 7.75 21 7.75ZM21 12.75H3C2.59 12.75 2.25 12.41 2.25 12C2.25 11.59 2.59 11.25 3 11.25H21C21.41 11.25 21.75 11.59 21.75 12C21.75 12.41 21.41 12.75 21 12.75ZM21 17.75H3C2.59 17.75 2.25 17.41 2.25 17C2.25 16.59 2.59 16.25 3 16.25H21C21.41 16.25 21.75 16.59 21.75 17C21.75 17.41 21.41 17.75 21 17.75Z"
                            fill="#9ca3af"
                          />
                        </svg>
                        <div class="flex items-center gap-2">
                          <img
                            src={item.logo}
                            alt=""
                            class="w-5 h-5 xl:w-4 xl:h-4 rounded-full"
                          />
                          {item.label}
                        </div>
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
                        class="bg-[#6AC7F533] text_27326F w-max px-3 py-1 rounded-[5px] text-base"
                      >
                        <Copy
                          address={item.address}
                          iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                          color={`${$isDarkMode ? "#fff" : "#000"}`}
                          displayNameService={""}
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
                      <div class="flex justify-end gap-6">
                        {#if item.label !== "My address" || item.address !== $userPublicAddress}
                          <div
                            class="font-semibold text-red-600 transition-all cursor-pointer hover:underline text-base"
                            on:click={() => {
                              isOpenConfirmDelete = true;
                              selectedWallet = item;
                            }}
                          >
                            {$t("Delete")}
                          </div>
                        {/if}
                        <div
                          class="font-semibold text-blue-600 transition-all cursor-pointer hover:underline text-base"
                          on:click={() => handleSelectedEdit(item)}
                        >
                          {$t("Edit")}
                        </div>
                      </div>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          {:else}
            <tbody
              use:dndzone={{
                items: listAddressWithoutBundle,
                flipDurationMs: 300,
                dropTargetStyle: { outline: "none" },
                transformDraggedElement: (draggedEl, data, index) => {
                  draggedEl.classList.add("myStyle");
                },
              }}
              on:consider={(e) => {
                listAddressWithoutBundle = e.detail.items;
              }}
              on:finalize={(e) => {
                listAddressWithoutBundle = e.detail.items;
                debounceSort(e.detail.items);
              }}
            >
              {#if (listAddressWithoutBundle && listAddressWithoutBundle?.length === 0) || $query.isError}
                <tr>
                  <td colspan="3">
                    <div
                      class="flex items-center justify-center h-full px-3 py-4 text-base"
                    >
                      {$t("No address")}
                    </div>
                  </td>
                </tr>
              {:else}
                {#each listAddressWithoutBundle as item (item.id)}
                  <tr class="transition-all group">
                    <td
                      class={`pl-3 py-3 ${
                        $isDarkMode
                          ? "group-hover:bg-[#000]"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      <div class="flex items-center gap-3 text-left text-base">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M21 7.75H3C2.59 7.75 2.25 7.41 2.25 7C2.25 6.59 2.59 6.25 3 6.25H21C21.41 6.25 21.75 6.59 21.75 7C21.75 7.41 21.41 7.75 21 7.75ZM21 12.75H3C2.59 12.75 2.25 12.41 2.25 12C2.25 11.59 2.59 11.25 3 11.25H21C21.41 11.25 21.75 11.59 21.75 12C21.75 12.41 21.41 12.75 21 12.75ZM21 17.75H3C2.59 17.75 2.25 17.41 2.25 17C2.25 16.59 2.59 16.25 3 16.25H21C21.41 16.25 21.75 16.59 21.75 17C21.75 17.41 21.41 17.75 21 17.75Z"
                            fill="#9ca3af"
                          />
                        </svg>
                        <div class="flex items-center gap-2">
                          <img
                            src={item.logo}
                            alt=""
                            class="w-5 h-5 xl:w-4 xl:h-4 rounded-full"
                          />
                          {item.label}
                        </div>
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
                        class="bg-[#6AC7F533] text_27326F w-max px-3 py-1 rounded-[5px] text-base"
                      >
                        <Copy
                          address={item.address}
                          iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                          color={`${$isDarkMode ? "#fff" : "#000"}`}
                          displayNameService={""}
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
                      <div class="flex justify-end gap-6">
                        {#if item.label !== "My address" || item.address !== $userPublicAddress}
                          <div
                            class="font-semibold text-red-600 transition-all cursor-pointer hover:underline text-base"
                            on:click={() => {
                              isOpenConfirmDelete = true;
                              selectedWallet = item;
                            }}
                          >
                            {$t("Delete")}
                          </div>
                        {/if}
                        <div
                          class="font-semibold text-blue-600 transition-all cursor-pointer hover:underline text-base"
                          on:click={() => handleSelectedEdit(item)}
                        >
                          {$t("Edit")}
                        </div>
                      </div>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          {/if}
        </table>
      </div>

      <!-- Mobile view -->
      <div class="xl:hidden block">
        {#if $query.isError}
          <div class="flex items-center justify-center h-full px-3 py-4">
            Please connect wallet
          </div>
        {:else if $query.isLoading}
          <div class="flex items-center justify-center h-full px-3 py-4">
            {#if isNimbusVersion}
              <LoadingPremium />
            {:else}
              <Loading />
            {/if}
          </div>
        {:else}
          <div>
            {#if (listAddressWithoutBundle && listAddressWithoutBundle?.length === 0) || $query.isError}
              <div
                class="flex items-center justify-center h-full px-3 py-4 text-base"
              >
                {$t("No address")}
              </div>
            {:else}
              <div class="flex flex-col gap-4">
                {#each listAddressWithoutBundle as item}
                  <div
                    class="flex flex-col gap-2 pb-3 border-b last:border-none"
                  >
                    <div class="flex items-start justify-between gap-6">
                      <div class="flex items-center gap-3 text-base text-left">
                        <div class="flex items-center gap-2">
                          <img
                            src={item.logo}
                            alt=""
                            class="w-6 h-6 rounded-full"
                          />
                          {item.label}
                        </div>
                      </div>
                      <div class="flex items-center gap-4">
                        <div
                          class="text-base font-semibold text-blue-600 transition-all cursor-pointer hover:underline"
                          on:click={() => handleSelectedEdit(item)}
                        >
                          {$t("Edit")}
                        </div>
                        <div
                          class="text-base font-semibold text-red-600 transition-all cursor-pointer hover:underline"
                          on:click={() => {
                            isOpenConfirmDelete = true;
                            selectedWallet = item;
                          }}
                        >
                          {$t("Delete")}
                        </div>
                      </div>
                    </div>
                    <div
                      class="bg-[#6AC7F533] text_27326F w-max px-3 py-1 rounded-[5px] text-base"
                    >
                      <Copy
                        address={item.address}
                        iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
                        color={`${$isDarkMode ? "#fff" : "#000"}`}
                        isShorten
                        displayNameService={""}
                      />
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Modal add DEX account -->
<div class="lg:block hidden">
  <AppOverlay
    clickOutSideToClose
    isOpen={isOpenAddModal}
    on:close={() => (isOpenAddModal = false)}
  >
    <div class="flex flex-col gap-4">
      <div class="font-semibold title-3">{$t("Add your account")}</div>
      <div class="flex flex-col gap-7">
        <!-- <div class="flex flex-col gap-3">
        <div class="flex justify-center">
          <div class="w-max">
            <Button
              variant="tertiary"
              isLoading={isLoadingConnectCEX}
              disabled={isLoadingConnectCEX}
              on:click={onSubmitCEX}
            >
              <div class="text-white">Connect Exchange</div>
            </Button>
          </div>
        </div>
        <div class="flex items-center justify-center gap-1 text-base">
          <img src={Success} alt="success-icon" width="22" height="22" />
          Bank-level security/encryption.
          <a
            href="https://vezgo.com/security"
            class="text-blue-500 hover:underline cursor-pointer"
            target="_blank"
          >
            More detail
          </a>
        </div>
        <div class="flex items-center justify-center gap-6 my-3">
          {#each listLogoCEX as logo}
            <img
              src={logo}
              alt=""
              class="xl:w-8 xl:h-8 w-10 h-10 rounded-full"
            />
          {/each}
          <a
            href="https://getnimbus.io/supported-chains"
            target="_blank"
            class="text-blue-500 hover:underline cursor-pointer text-base"
          >
            More exchanges
          </a>
        </div>
      </div>
      <div class="border-t-[1px] relative">
        <div
          class={`absolute top-[-10px] left-1/2 transform -translate-x-1/2 text-gray-400 text-sm px-2 ${
            $isDarkMode ? "bg-[#0f0f0f]" : "bg-white"
          }`}
        >
          Or
        </div>
      </div> -->
        <form
          on:submit|preventDefault={onSubmit}
          class="flex flex-col gap-3 mt-2"
        >
          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <div
                class={`flex flex-col gap-1 input-2 input-border w-full py-[6px] px-3 ${
                  address && !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
                }`}
                class:input-border-error={errors.address &&
                  errors.address.required}
              >
                <div
                  class={`text-base font-medium ${
                    $isDarkMode ? "text-gray-400" : "text-[#666666]"
                  }`}
                >
                  {$t("Address")}
                </div>
                <input
                  type="text"
                  id="address"
                  name="address"
                  placeholder={$t("Your wallet address")}
                  bind:value={address}
                  class={`p-0 border-none focus:outline-none focus:ring-0 text-sm font-normal ${
                    address && !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
                  } ${
                    $isDarkMode
                      ? "text-white"
                      : "text-[#5E656B] placeholder-[#5E656B]"
                  }
              `}
                  on:change={(event) => {
                    address = event?.target.value;
                  }}
                />
              </div>
              {#if errors.address && errors.address.required}
                <div class="text-red-500">
                  {errors.address.msg}
                </div>
              {/if}
            </div>
            <div class="flex flex-col gap-1">
              <div
                class={`flex flex-col gap-1 input-2 input-border w-full py-[6px] px-3 ${
                  label && !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
                }`}
                class:input-border-error={errors.label && errors.label.required}
              >
                <div
                  class={`text-base font-medium ${
                    $isDarkMode ? "text-gray-400" : "text-[#666666]"
                  }`}
                >
                  {$t("Label")}
                </div>
                <input
                  type="text"
                  id="label"
                  name="label"
                  placeholder={$t("Label")}
                  bind:value={label}
                  class={`p-0 border-none focus:outline-none focus:ring-0 text-sm font-normal ${
                    label && !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
                  } ${
                    $isDarkMode
                      ? "text-white"
                      : "text-[#5E656B] placeholder-[#5E656B]"
                  }
              `}
                  on:change={(event) => {
                    label = event?.target.value;
                  }}
                />
              </div>
              {#if errors.label && errors.label.required}
                <div class="text-red-500">
                  {errors.label.msg}
                </div>
              {/if}
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 text-[#666666]">
            <div class="text-sm">{$t("Is it your wallet")}?</div>
            <label class="switch" for="switch">
              <input
                type="checkbox"
                id="switch"
                bind:checked={groupedToBundles}
              />
              <span class="slider" />
            </label>
          </div>
          <div class="flex items-center justify-center gap-6 my-3">
            {#each generationLogo as item}
              <img
                src={item.logo}
                loading="lazy"
                decoding="async"
                alt="logo"
                class="w-8 h-8 overflow-hidden rounded-full"
              />
            {/each}
            <a
              href="https://getnimbus.io/supported-chains"
              target="_blank"
              class="text-blue-500 hover:underline cursor-pointer text-base"
              >{$t("More chains")}</a
            >
          </div>
          <div class="flex justify-end gap-4">
            <div class="w-[120px]">
              <Button
                variant="secondary"
                on:click={() => {
                  errors = {};
                  isOpenAddModal = false;
                }}
              >
                {$t("Cancel")}
              </Button>
            </div>
            <div class="w-[120px]">
              <Button
                type="submit"
                variant="tertiary"
                isLoading={isLoadingAddDEX}
                disabled={isLoadingAddDEX}
              >
                {$t("Add")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </AppOverlay>
</div>

<!-- Add DEX account Mobile -->
<div class="lg:hidden block">
  <div
    class={`fixed inset-0 w-full mobile mobile-container ${
      isOpenAddModal
        ? "opacity-100 transform translate-x-[0px]"
        : "opacity-0 transform translate-x-[-100vw]"
    }`}
  >
    <div
      class="max-w-[100vw] m-auto w-[94%] h-full flex flex-col gap-8 relative"
    >
      <div class="flex items-center justify-end py-2 border-b-[1px]">
        <div
          class="-mr-1 text-5xl"
          on:click={() => {
            isOpenAddModal = false;
          }}
        >
          &times;
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <div class="font-medium title-2">{$t("Add your account")}</div>
        <div class="flex flex-col gap-7">
          <!-- <div class="flex flex-col gap-3">
            <div class="flex justify-center">
              <div class="w-max">
                <Button
                  variant="tertiary"
                  isLoading={isLoadingConnectCEX}
                  disabled={isLoadingConnectCEX}
                  on:click={onSubmitCEX}
                >
                  <div class="text-white">Connect Exchange</div>
                </Button>
              </div>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-1">
              <img src={Success} alt="" />
              Bank-level security/encryption.
              <a
                href="https://vezgo.com/security"
                class="text-blue-500 cursor-pointer"
                target="_blank"
              >
                More detail
              </a>
            </div>
            <div class="flex items-center justify-center gap-6 my-2">
              {#each listLogoCEX.slice(0, 3) as logo}
                <img
                  src={logo}
                  alt="logo"
                  loading="lazy"
                  decoding="async"
                  class="w-8 h-8 rounded-full"
                />
              {/each}
              <a
                href="https://getnimbus.io/supported-chains"
                target="_blank"
                class="text-blue-500 hover:underline cursor-pointer text-sm"
              >
                More exchanges
              </a>
            </div>
          </div>
          <div class="border-t-[1px] relative">
            <div
              class={`absolute top-[-14px] left-1/2 transform -translate-x-1/2 text-gray-400 ${
                $isDarkMode ? "bg-[#0f0f0f]" : "bg-white"
              } text-lg px-2`}
            >
              Or
            </div>
          </div> -->
          <form
            on:submit|preventDefault={onSubmit}
            class="flex flex-col gap-3 mt-2"
          >
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-1">
                <div
                  class={`flex flex-col gap-1 input-2 input-border w-full py-[6px] px-3 ${
                    address && !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
                  }`}
                  class:input-border-error={errors.address &&
                    errors.address.required}
                >
                  <div
                    class={`text-lg font-medium ${
                      $isDarkMode ? "text-gray-400" : "text-[#666666]"
                    }`}
                  >
                    {$t("Address")}
                  </div>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder={$t("Your wallet address")}
                    bind:value={address}
                    class={`p-0 border-none focus:outline-none focus:ring-0 text-base font-normal ${
                      address && !$isDarkMode
                        ? "bg-[#F0F2F7]"
                        : "bg-transparent"
                    } ${
                      $isDarkMode
                        ? "text-white"
                        : "text-[#5E656B] placeholder-[#5E656B]"
                    }`}
                    on:change={(event) => {
                      address = event?.target.value;
                    }}
                  />
                </div>
                {#if errors.address && errors.address.required}
                  <div class="text-red-500">
                    {errors.address.msg}
                  </div>
                {/if}
              </div>

              <div class="flex flex-col gap-1">
                <div
                  class={`flex flex-col gap-1 input-2 input-border w-full py-[6px] px-3 ${
                    label && !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
                  }`}
                  class:input-border-error={errors.label &&
                    errors.label.required}
                >
                  <div
                    class={`text-lg font-medium ${
                      $isDarkMode ? "text-gray-400" : "text-[#666666]"
                    }`}
                  >
                    {$t("Label")}
                  </div>
                  <input
                    type="text"
                    id="label"
                    name="label"
                    placeholder={$t("Label")}
                    bind:value={label}
                    class={`p-0 border-none focus:outline-none focus:ring-0 text-base font-normal ${
                      label && !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
                    } ${
                      $isDarkMode
                        ? "text-white"
                        : "text-[#5E656B] placeholder-[#5E656B]"
                    }
              `}
                    on:change={(event) => {
                      label = event?.target.value;
                    }}
                  />
                </div>
                {#if errors.label && errors.label.required}
                  <div class="text-red-500">
                    {errors.label.msg}
                  </div>
                {/if}
              </div>
            </div>
            <div
              class="flex items-center justify-end gap-2 text-[#666666] mt-2"
            >
              <div class="text-base">{$t("Is it your wallet")}?</div>
              <label class="switch" for="switch">
                <input
                  type="checkbox"
                  id="switch"
                  bind:checked={groupedToBundles}
                />
                <span class="slider" />
              </label>
            </div>
            <div class="flex items-center justify-center gap-6 my-2">
              {#each generationLogo.slice(0, 4) as item}
                <img
                  src={item.logo}
                  loading="lazy"
                  decoding="async"
                  alt="logo"
                  class="w-8 h-8 overflow-hidden rounded-full"
                />
              {/each}
              <a
                href="https://getnimbus.io/supported-chains"
                target="_blank"
                class="text-blue-500 hover:underline cursor-pointer text-sm"
                >{$t("More chains")}</a
              >
            </div>

            <div class="flex justify-end gap-4">
              <div class="w-[120px]">
                <Button
                  variant="secondary"
                  on:click={() => {
                    errors = {};
                    isOpenAddModal = false;
                  }}
                >
                  {$t("Cancel")}
                </Button>
              </div>
              <div class="w-[120px]">
                <Button
                  type="submit"
                  variant="tertiary"
                  isLoading={isLoadingAddDEX}
                  disabled={isLoadingAddDEX}
                >
                  <div class="text-white">{$t("Add")}</div>
                </Button>
              </div>
            </div>
          </form>

          {#if $isTWA}
            <div class="border-t-[1px] relative">
              <div
                class={`absolute top-[-10px] left-1/2 transform -translate-x-1/2 text-gray-400 text-sm px-2 ${
                  $isDarkMode ? "bg-[#0f0f0f]" : "bg-white"
                }`}
              >
                {$t("Or")}
              </div>
            </div>

            <div class="flex items-center justify-center">
              <TmaTonAuth
                {selectYourWalletsBundle}
                {closeMobileAddAccountModal}
              />
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Modal edit account -->
<AppOverlay
  clickOutSideToClose
  isOpen={isOpenEditModal}
  on:close={() => (isOpenEditModal = false)}
>
  <div class="flex flex-col gap-4 xl:mt-0 mt-4">
    <div class="font-semibold title-3">{$t("Edit your account")}</div>
    <form on:submit|preventDefault={onSubmitEdit} class="flex flex-col gap-3">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1 opacity-50">
          <div
            class={`flex flex-col gap-1 input-2 input-border w-full py-[6px] px-3 ${
              address && !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
            }`}
          >
            <div
              class={`text-base font-semibold ${
                $isDarkMode ? "text-gray-400" : "text-[#666666]"
              }`}
            >
              {$t("Account")}
            </div>
            <input
              disabled={true}
              type="text"
              id="address"
              name="address"
              placeholder="Account"
              value={address}
              class={`p-0 border-none focus:outline-none focus:ring-0 text-sm font-normal ${
                address && !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
              } ${
                $isDarkMode
                  ? "text-white"
                  : "text-[#5E656B] placeholder-[#5E656B]"
              }`}
            />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <div
            class={`flex flex-col gap-1 input-2 input-border w-full py-[6px] px-3 ${
              label && !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
            }`}
            class:input-border-error={errorsEdit.label &&
              errorsEdit.label.required}
          >
            <div
              class={`text-base font-semibold ${
                $isDarkMode ? "text-gray-400" : "text-[#666666]"
              }`}
            >
              {$t("Label")}
            </div>
            <input
              type="text"
              id="label"
              name="label"
              placeholder={$t("Label")}
              bind:value={label}
              class={`p-0 border-none focus:outline-none focus:ring-0 text-sm font-normal ${
                label && !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
              } ${
                $isDarkMode
                  ? "text-white"
                  : "text-[#5E656B] placeholder-[#5E656B]"
              }`}
              on:change={(event) => {
                label = event?.target.value;
              }}
            />
          </div>
          {#if errorsEdit.label && errorsEdit.label.required}
            <div class="text-red-500">
              {errorsEdit.label.msg}
            </div>
          {/if}
        </div>
      </div>
      <div class="flex justify-end gap-4">
        <div class="w-[120px]">
          <Button
            variant="secondary"
            on:click={() => {
              errorsEdit = {};
              isOpenEditModal = false;
            }}
          >
            {$t("Cancel")}
          </Button>
        </div>
        <div class="w-[120px]">
          <Button
            type="submit"
            variant="tertiary"
            isLoading={isLoadingEditDEX}
            disabled={isLoadingEditDEX}
          >
            {$t("Edit")}
          </Button>
        </div>
      </div>
    </form>
  </div>
</AppOverlay>

<!-- Modal confirm delete account -->
<AppOverlay
  clickOutSideToClose
  isOpen={isOpenConfirmDelete}
  on:close={() => (isOpenConfirmDelete = false)}
>
  <div class="flex flex-col gap-4 xl:mt-0 mt-4">
    <div class="flex flex-col items-start gap-1">
      <div class="font-semibold title-3">{$t("Are you sure?")}</div>
      <div class="text-gray-500 text-sm">
        {$t("Do you really want", { name: "account" })}
      </div>
    </div>
    <div class="flex justify-end gap-4">
      <div class="w-[120px]">
        <Button
          variant="secondary"
          on:click={() => {
            isOpenConfirmDelete = false;
            selectedWallet = {};
          }}
        >
          {$t("Cancel")}
        </Button>
      </div>
      <div class="w-[120px]">
        <Button
          variant="delete"
          isLoading={isLoadingDelete}
          disabled={isLoadingDelete}
          on:click={() => {
            handleDelete(selectedWallet);
          }}
        >
          {$t("Delete")}
        </Button>
      </div>
    </div>
  </div>
</AppOverlay>

<!-- Modal confirm delete bundles -->
<AppOverlay
  clickOutSideToClose
  isOpen={isOpenConfirmDeleteBundles}
  on:close={() => (isOpenConfirmDeleteBundles = false)}
>
  <div class="flex flex-col gap-4 xl:mt-0 mt-4">
    <div class="flex flex-col items-start gap-1">
      <div class="font-semibold title-3">{$t("Are you sure?")}</div>
      <div class="text-gray-500 text-sm">
        {$t("Do you really want", { name: "bundle" })}
      </div>
    </div>
    <div class="flex justify-end gap-4">
      <div class="w-[120px]">
        <Button
          variant="secondary"
          on:click={() => {
            isOpenConfirmDeleteBundles = false;
          }}
        >
          {$t("Cancel")}
        </Button>
      </div>
      <div class="w-[120px]">
        <Button
          variant="delete"
          isLoading={isLoadingDeleteBundles}
          disabled={isLoadingDeleteBundles}
          on:click={handleDeleteBundle}
        >
          {$t("Delete")}
        </Button>
      </div>
    </div>
  </div>
</AppOverlay>

<!-- Modal navigate to Upgrade page -->
<AppOverlay
  clickOutSideToClose
  isOpen={isOpenModal}
  on:close={() => {
    isOpenModal = false;
  }}
>
  <div class="flex flex-col gap-4 xl:mt-0 mt-4">
    <div class="flex flex-col gap-1 items-start">
      <div class="title-3 font-semibold">{$t("Let's upgrade your Plan!")}</div>
      <div class="text-sm text-gray-500">
        {$t(tooltipDisableAddBtn)}
      </div>
    </div>
    <div class="flex justify-start">
      <div class="w-max">
        <Button
          variant="premium"
          on:click={() => {
            navigate("/upgrade");
          }}
        >
          {$t("Upgrade Plan")}
        </Button>
      </div>
    </div>
  </div>
</AppOverlay>

<style>
  :global(body) .bg_fafafbff {
    background: #fafafbff;
  }
  :global(body.dark) .bg_fafafbff {
    background: #212121;
  }

  :global(body) .bg_f4f5f8 {
    background: #f4f5f8;
  }
  :global(body.dark) .bg_f4f5f8 {
    background: #131313;
  }

  .input-border {
    border: 0.5px solid rgb(229, 231, 235);
  }
  .input-border-error {
    border: 0.5px solid red;
  }
  .form-item-translate {
    margin-top: 10px;
  }
  .table-border {
    border: 0.5px solid rgb(229, 231, 235);
  }

  :global(body) .myStyle {
    display: flex !important;
    justify-content: space-between !important;
    background: #f3f4f6 !important;
  }

  :global(body.dark) .myStyle {
    display: flex !important;
    justify-content: space-between !important;
    background: black !important;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    border-radius: 34px;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 2px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    border-radius: 50%;
  }
  input:checked + .slider {
    background-color: #2196f3;
  }
  input:checked + .slider {
    box-shadow: 0 0 1px #2196f3;
  }
  input:checked + .slider:before {
    -webkit-transform: translateX(16px);
    -ms-transform: translateX(16px);
    transform: translateX(16px);
  }

  @media screen and (max-width: 1280px) {
    .switch {
      width: 60px;
      height: 30px;
    }

    .slider {
      border-radius: 44px;
    }

    .slider:before {
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 2px;
    }

    input:checked + .slider:before {
      -webkit-transform: translateX(26px);
      -ms-transform: translateX(26px);
      transform: translateX(26px);
    }
  }

  .mobile {
    height: 100vh;
    z-index: 10;

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

  @media (min-width: 1536px) {
    :global(body) .absolute-center {
      /* position: absolute; */
      left: 49.5%;
      transform: translate(-50%, -50%);
    }
  }

  @supports (height: 100dvh) {
    .mobile {
      height: 100dvh;
    }
  }

  :global(body) .mobile-container {
    background: white;
  }
  :global(body.dark) .mobile-container {
    background: black;
  }
</style>
