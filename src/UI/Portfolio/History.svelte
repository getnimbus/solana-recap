<script lang="ts">
  import { onMount } from "svelte";
  import mixpanel from "mixpanel-browser";
  import dayjs from "dayjs";
  import "dayjs/locale/en";
  import "dayjs/locale/vi";
  import relativeTime from "dayjs/plugin/relativeTime";
  dayjs.extend(relativeTime);
  import { nimbus } from "~/lib/network";
  import { chain, typeWallet, wallet, isDarkMode, tab } from "~/store";
  import { handleValidateAddress } from "~/lib/queryAPI";
  import { t } from "~/lib/i18n";

  import ErrorBoundary from "~/components/ErrorBoundary.svelte";
  import HistoricalTransactions from "~/UI/Transaction/HistoricalTransactions.svelte";
  import CoinSelector from "~/components/CoinSelector.svelte";
  import Select from "~/components/Select.svelte";

  import All from "~/assets/all.svg";

  const types = [
    {
      label: "All",
      value: "all",
    },
    {
      label: "Buy",
      value: "buy",
    },
    {
      label: "Swap",
      value: "swap",
    },
    {
      label: "Sell",
      value: "sell",
    },
    {
      label: "Unknown",
      value: "unknown",
    },
  ];

  const conditionPageBaseOnChain = ["MOVE", "TON"].includes($typeWallet);

  let data: any = [];
  let pageToken = conditionPageBaseOnChain ? "" : 1;
  let paginate = conditionPageBaseOnChain ? "" : 1;

  let selectedType = {
    label: "All",
    value: "all",
  };

  let selectedCoin = {
    name: "All",
    logo: All,
    symbol: "all",
  };

  let selectedTypeValue = "all";
  let selectedCoinValue = "all";
  let isLoading = false;

  let isLoadingValidate = false;
  let walletType = "";

  const getListTransactions = async (
    type: string,
    coin: string,
    chain: string,
  ) => {
    try {
      isLoading = true;
      const response: any = await nimbus.get(
        `/v2/address/${$wallet}/history?chain=${chain}&pageToken=${paginate}${
          type !== "all" ? `&type=${type}` : ""
        }${coin !== "all" ? `&coin=${coin}` : ""}`,
      );

      if (
        response &&
        response?.data?.data &&
        response?.data?.data?.length !== 0
      ) {
        data = [...data, ...response?.data?.data];
        pageToken = response?.data?.pageToken;
      } else {
        pageToken = "";
      }
    } catch (e) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  };

  $: {
    if (paginate || selectedTypeValue || selectedCoinValue || $chain) {
      if (!isLoadingValidate && walletType && walletType.length !== 0) {
        getListTransactions(
          selectedTypeValue,
          selectedCoinValue,
          walletType === "EVM" ? $chain : $typeWallet,
        );
      }
    }
  }

  const handleLoadMore = (page: any) => {
    paginate = page;
  };

  $: {
    if (selectedType) {
      pageToken = conditionPageBaseOnChain ? "" : 1;
      selectedTypeValue = selectedType?.value;
    }
  }

  $: {
    if (selectedCoin) {
      pageToken = conditionPageBaseOnChain ? "" : 1;
      selectedCoinValue = selectedCoin?.symbol;
    }
  }

  $: {
    if (selectedTypeValue || selectedCoinValue || $chain) {
      data = [];
    }
  }

  $: {
    if ($wallet || $chain) {
      if ($wallet?.length !== 0 && $chain?.length !== 0) {
        data = [];
        pageToken = conditionPageBaseOnChain ? "" : 1;
      }
    }
  }

  onMount(() => {
    mixpanel.track("transaction_page");
    const urlParams = new URLSearchParams(window.location.search);
    const addressParams = urlParams.get("address");
    if (addressParams) {
      handleCheckAddressFromParams(addressParams);
    }
  });

  const handleCheckAddressFromParams = async (address: string) => {
    isLoadingValidate = true;
    const validateAccount = await handleValidateAddress(address);
    if (validateAccount && validateAccount.address) {
      typeWallet.update((n) => (n = validateAccount.type));
      walletType = validateAccount.type;
      if (validateAccount.type === "EVM" || validateAccount.type === "BUNDLE") {
        tab.update((n) => (n = "token"));
        if (validateAccount.type === "EVM") {
          window.history.replaceState(
            null,
            "",
            window.location.pathname +
              `?tab=token&type=${$typeWallet}&chain=${$chain}&address=${$wallet}`,
          );
        } else {
          window.history.replaceState(
            null,
            "",
            window.location.pathname +
              `?tab=token&type=${$typeWallet}&address=${$wallet}`,
          );
        }
      } else {
        window.history.replaceState(
          null,
          "",
          window.location.pathname +
            `?tab=${$tab}&type=${$typeWallet}&address=${$wallet}`,
        );
      }
    }
    isLoadingValidate = false;
  };
</script>

<ErrorBoundary>
  <div class="trx_container rounded-[20px] relative">
    <div
      class={`rounded-[20px] xl:p-6 py-4 lg:px-3 flex flex-col gap-4 xl:border border_0000001a ${
        $isDarkMode ? "lg:bg-[#222222]" : "bg-[#fff]"
      }`}
    >
      <div class="flex flex-col justify-between gap-4 xl:flex-row">
        <div class="text-2xl font-medium">{$t("Historical Transactions")}</div>
        {#if $typeWallet === "EVM"}
          <div class="xl:flex hidden items-center gap-4">
            <CoinSelector
              bind:selected={selectedCoin}
              positionSelectList="right-0"
            />
            <Select
              type="lang"
              bind:selected={selectedType}
              listSelect={types}
              positionSelectList="right-0"
              isDisabledSelectWallet={false}
              indexWalletDisabled={-1}
            />
          </div>

          <div class="xl:hidden flex items-center gap-4">
            <CoinSelector
              bind:selected={selectedCoin}
              positionSelectList="left-0"
            />
            <Select
              type="lang"
              bind:selected={selectedType}
              listSelect={types}
              positionSelectList="left-0"
              isDisabledSelectWallet={false}
              indexWalletDisabled={-1}
            />
          </div>
        {/if}
      </div>

      <HistoricalTransactions
        {isLoading}
        {pageToken}
        data={data || []}
        loadMore={handleLoadMore}
      />
    </div>

    {#if ["NEAR", "ALGO", "AURA", "INJ"].includes($typeWallet) || $typeWallet === "BUNDLE"}
      <div
        class={`absolute top-0 left-0 rounded-[20px] w-full h-full flex flex-col items-center gap-3 justify-center z-7 backdrop-blur-md ${
          $isDarkMode ? "bg-black/90" : "bg-white/95"
        }`}
      >
        <div class="text-lg">{$t("Coming soon 🚀")}</div>
      </div>
    {/if}
  </div>
</ErrorBoundary>

<style>
  :global(body) .trx_container {
    background: #fff;
  }
  :global(body.dark) .trx_container {
    background: #0f0f0f;
  }
</style>
