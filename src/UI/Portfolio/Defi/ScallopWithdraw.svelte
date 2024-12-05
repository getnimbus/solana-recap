<script lang="ts">
  import { onMount } from "svelte";
  import {
    isDarkMode,
    userPublicAddress,
    wallet,
    chain,
    suiWalletInstance,
  } from "~/store";
  import mixpanel from "mixpanel-browser";
  import { handleValidateAddress } from "~/lib/queryAPI";
  import tooltip from "~/lib/tooltip";
  import type { WalletState } from "nimbus-sui-kit";
  import { SuiConnector } from "nimbus-sui-kit";
  import { nimbus } from "~/lib/network";
  import {
    createQuery,
    useQueryClient,
    QueryCache,
  } from "@tanstack/svelte-query";
  import {
    ScallopBuilder,
    ScallopQuery,
    ScallopClient,
  } from "@scallop-io/sui-scallop-sdk";
  import { isNimbusVersion, SUIRPC } from "~/utils/constants";
  import { t } from "~/lib/i18n";

  import Loading from "~/components/Loading.svelte";
  import Image from "~/components/Image.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Button from "~/components/Button.svelte";
  import ReactAdapter from "~/components/ReactAdapter.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let handleShowStatusModal = (data) => {};
  export let selectedPosition;

  const queryCache = new QueryCache();
  const queryClient = useQueryClient();

  const chains = [
    {
      id: "sui:mainnet",
      name: "Mainnet",
      rpcUrl: SUIRPC,
    },
  ];

  const scallopQuery = new ScallopQuery({
    networkType: "mainnet",
  });

  const scallopClient = new ScallopClient({
    networkType: "mainnet",
  });

  const initScallop = async () => {
    await scallopQuery.init();
    await scallopClient.init();
  };

  let isLoadingSubmit = false;

  let publicAddress =
    (($suiWalletInstance as WalletState) &&
    ($suiWalletInstance as WalletState)?.connected
      ? ($suiWalletInstance as WalletState)?.account?.address
      : $userPublicAddress) || "";

  let data = {};
  let isTrigger = false;

  $: marketPrice = data?.token?.price || 0;

  let maxWithdraw = 0;
  let maxWithdrawStake = 0;
  let maxWithdrawLending = 0;
  let percent = 0;
  let amount: any = "";

  let isLoading = false;
  let conversionRate = 0;
  let coinDecimal = 0;
  let availableWithdraw = 0;
  let suppliedCoinSymbol = "";

  $: queryValidate = createQuery({
    queryKey: ["validate", publicAddress],
    queryFn: () => handleValidateAddress(publicAddress),
    retry: false,
  });

  const getDataSupplied = async (address: any) => {
    try {
      isLoading = true;
      await scallopQuery.init();
      const response: any = await scallopQuery
        .getLendings([data?.token?.symbol?.toLowerCase()], address)
        .then((res) => {
          return res[data?.token?.symbol?.toLowerCase()];
        });
      if (response) {
        coinDecimal = response?.coinDecimal || 0;
        availableWithdraw = response?.availableWithdrawCoin || 0;
        suppliedCoinSymbol = response?.symbol || "";
        conversionRate = response?.conversionRate || 0;

        maxWithdrawStake = response?.availableUnstakeCoin;

        maxWithdrawLending = response?.availableStakeCoin;

        maxWithdraw =
          selectedPosition?.type === "Lending"
            ? maxWithdrawLending * conversionRate
            : maxWithdrawStake * conversionRate;
      }
    } catch (e) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  };

  $: {
    if (!$queryValidate?.isError && $queryValidate?.data !== undefined) {
      if ($queryValidate?.data?.type === "MOVE") {
        getDataSupplied($queryValidate?.data.address);
      }
    }
  }

  $: {
    if (selectedPosition) {
      data = selectedPosition?.current?.tokens[0];
    }
  }

  onMount(() => {
    initScallop();
  });

  const getSync = async () => {
    try {
      const validateAccount = $queryValidate.data;
      await nimbus.get(
        `/v2/address/${$wallet}/sync?chain=${
          validateAccount?.type === "BUNDLE" ? "" : validateAccount?.type
        }`,
      );
    } catch (e) {
      console.error("e: ", e);
    }
  };

  const forceRefreshPosition = async (address: string) => {
    try {
      await nimbus
        .get(
          `/v2/address/${address}/positions?protocol=Scallop&force_refresh=${true}`,
          {
            headers: {
              "Cache-Control": "no-cache",
            },
          },
        )
        .then((res) => res?.data);
    } catch (e) {
      console.error(e);
    }
  };

  const forceRefreshHoldingToken = async (address: any, chain: any) => {
    try {
      await nimbus.get(
        `/v2/address/${address}/holding?chain=${chain}&force_refresh=${true}`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      );
    } catch (e) {
      console.error(e);
    }
  };

  const onConnectSuccess = (msg) => {
    console.log("Success connect: ", msg);
    if ($suiWalletInstance) {
      ($suiWalletInstance as WalletState).toggleSelect();
    }
  };

  const onConnectError = (msg) => {
    console.error("Error connect", msg);
    if ($suiWalletInstance) {
      ($suiWalletInstance as WalletState).toggleSelect();
    }
  };

  const widgetConfig = {
    walletFn: (wallet) => {
      if (
        ($suiWalletInstance as WalletState) &&
        ($suiWalletInstance as WalletState)?.connected
      ) {
        return;
      }
      suiWalletInstance.update((n) => (n = wallet));
    },
    onConnectSuccess,
    onConnectError,
  };

  const handleSUIAuth = async () => {
    mixpanel.track("user_login_sui");
    mixpanel.track("user_login_sui_Scallop_withdraw");
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
      if (($suiWalletInstance as WalletState)?.account?.address) {
        publicAddress = (
          $suiWalletInstance as WalletState
        )?.account?.address?.toLowerCase();
        getDataSupplied(publicAddress);
      } else {
        if (
          ($suiWalletInstance as WalletState) &&
          ($suiWalletInstance as WalletState)?.connected
        ) {
          ($suiWalletInstance as WalletState).disconnect();
        }
        isTrigger = false;
        publicAddress = $userPublicAddress;
      }
    }
  }

  $: {
    if (percent) {
      amount =
        maxWithdraw !== 0
          ? percent === 100
            ? Number(maxWithdraw)
            : (percent * Number(maxWithdraw)) / 100
          : percent === 100
            ? Number(availableWithdraw)
            : (percent * Number(availableWithdraw)) / 100;
    }
  }

  $: value = amount * Number(marketPrice);

  const handleWithdraw = async () => {
    isLoadingSubmit = true;
    try {
      const scallopBuilder = new ScallopBuilder({
        walletAddress: publicAddress,
        networkType: "mainnet",
      });
      await scallopBuilder.init();

      mixpanel.track(
        `user_connect_wallet_Withdraw_${selectedPosition?.type}_Scallop`,
        {
          address: publicAddress,
        },
      );

      const amountValue =
        percent === 100
          ? maxWithdraw !== 0
            ? selectedPosition?.type === "Lending"
              ? maxWithdrawLending
              : maxWithdrawStake
            : availableWithdraw
          : Number(amount);

      const txBlock = await scallopClient.withdraw(
        data?.token?.symbol?.toLowerCase(),
        Math.round(amountValue * 10 ** coinDecimal),
        false,
        publicAddress,
      );

      const res = await (
        $suiWalletInstance as WalletState
      ).signAndExecuteTransactionBlock({
        transactionBlock: txBlock,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      if (res && res.digest) {
        percent = 0;
        amount = "";
        getDataSupplied(publicAddress);

        queryCache.clear();
        getSync();
        forceRefreshHoldingToken($wallet, $chain);
        forceRefreshPosition($wallet);
        queryClient?.refetchQueries(["position-list", $wallet]);
        queryClient?.refetchQueries(["positions"]);
        queryClient?.refetchQueries(["position-history"]);
        queryClient?.refetchQueries(["token-holding-each-chain"]);
        queryClient?.refetchQueries(["token-holding"]);

        handleShowStatusModal({
          status: "success",
          tx: res.digest,
          type: "Withdraw",
        });

        mixpanel.track(`user_Withdraw_${selectedPosition?.type}_Scallop`, {
          address: publicAddress,
          tx: res.digest,
          amount: Number(amountValue),
          value: Number(amountValue) * Number(marketPrice),
        });
      } else {
        mixpanel.track("user_Withdraw_Scallop_fail", {
          res,
        });
        handleShowStatusModal({
          status: "fail",
          type: "Withdraw",
        });
      }
    } catch (e) {
      console.error(e);
      mixpanel.track("user_Withdraw_Scallop_fail", {
        e,
      });
      handleShowStatusModal({
        status: "fail",
        type: "Withdraw",
      });
    } finally {
      isLoadingSubmit = false;
    }
  };

  $: isEnable =
    (selectedPosition &&
      ($suiWalletInstance as WalletState) &&
      ($suiWalletInstance as WalletState)?.connected &&
      publicAddress === $wallet &&
      $queryValidate?.data &&
      $queryValidate?.data?.type === "MOVE") ||
    false;
</script>

<div class="flex flex-col gap-4">
  <div class="font-medium text-2xl">
    Withdraw {selectedPosition?.type} Position
  </div>

  <div class="flex flex-col gap-1">
    <div class="text-gray-500 text-sm px-1">
      {#if publicAddress === $wallet}
        <TooltipNumber number={Number(availableWithdraw || 0)} type="balance" />
      {:else}
        0
      {/if}
      {suppliedCoinSymbol} supplied
    </div>

    <div
      class={`flex flex-col gap-3 border border_0000000d p-4 rounded-[10px] ${(Number(amount) !== 0 && Number(amount) > (Number(maxWithdraw) || Number(availableWithdraw))) || Number(amount) < 0 ? "border-red-500" : "border_0000000d"}`}
    >
      <div class="flex items-start gap-4">
        <div class="rounded-full w-[46px] h-[46px] overflow-hidden">
          <Image logo={data?.token?.logo} defaultLogo={defaultToken} />
        </div>

        <div class="flex-1 flex flex-col">
          <input
            type="text"
            placeholder="0"
            autocomplete="off"
            inputmode="decimal"
            class="text-xl p-0 border-none focus:outline-none focus:ring-0 flex-1 bg-transparent"
            value={amount}
            disabled={isLoadingSubmit}
            on:change={(event) => {
              amount = event?.target?.value;
              if (percent) {
                const amountWithPercent =
                  maxWithdraw !== 0
                    ? (percent * Number(maxWithdraw)) / 100
                    : (percent * Number(availableWithdraw)) / 100;

                if (amountWithPercent !== amount) {
                  percent = 0;
                }
              }
            }}
          />
          <div class="text-gray-500 text-sm">≈ ${value.toFixed(4)}</div>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div
          class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percent === 25 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
          on:click={() => {
            if (isLoadingSubmit) {
              return;
            }

            if (percent === 25) {
              percent = 0;
            } else {
              percent = 25;
            }
          }}
        >
          25%
        </div>
        <div
          class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percent === 50 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
          on:click={() => {
            if (isLoadingSubmit) {
              return;
            }

            if (percent === 50) {
              percent = 0;
            } else {
              percent = 50;
            }
          }}
        >
          50%
        </div>
        <div
          class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percent === 75 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
          on:click={() => {
            if (isLoadingSubmit) {
              return;
            }

            if (percent === 75) {
              percent = 0;
            } else {
              percent = 75;
            }
          }}
        >
          75%
        </div>
        <div
          class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percent === 100 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
          on:click={() => {
            if (isLoadingSubmit) {
              return;
            }

            if (percent === 100) {
              percent = 0;
            } else {
              percent = 100;
            }
          }}
        >
          100%
        </div>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="flex justify-center items-center">
      {#if isNimbusVersion}
        <LoadingPremium />
      {:else}
        <Loading />
      {/if}
    </div>
  {:else}
    <div class="flex flex-col gap-2">
      <div class="flex justify-between items-center">
        <div class="text_00000099 text-sm">{$t("Max Withdraw")}</div>
        <div class="text-sm">
          <TooltipNumber number={maxWithdraw || availableWithdraw} />
        </div>
      </div>

      <div class="flex justify-between items-center">
        <div class="text_00000099 text-sm">{$t("Market Price")}</div>
        <div class="text-sm">
          <TooltipNumber number={marketPrice} />
        </div>
      </div>
    </div>
  {/if}

  <div class="flex justify-start gap-2">
    {#if !isEnable}
      {#if publicAddress !== $wallet && $queryValidate?.data && $queryValidate?.data?.type === "MOVE"}
        <div
          use:tooltip={{
            content: `<tooltip-detail text="Your SUI connected wallet is not matches with selected wallet" />`,
            allowHTML: true,
            placement: "top",
            interactive: true,
          }}
          class="w-[120px]"
        >
          <Button variant="disabled" disabled>
            <div class="text-white">{$t("Withdraw")}</div>
          </Button>
        </div>
      {:else}
        <div class="w-[120px]">
          <Button variant="tertiary" on:click={handleSUIAuth}>
            <div class="text-white">Connect SUI</div>
          </Button>
        </div>
      {/if}
    {:else}
      <div class="w-[120px]">
        {#if Number(amount) !== 0 && Number(amount) > 0 && (Number(maxWithdraw) > 0 || Number(availableWithdraw) > 0) && Number(amount) <= (Number(maxWithdraw) || Number(availableWithdraw))}
          <Button
            variant="tertiary"
            on:click={handleWithdraw}
            isLoading={isLoadingSubmit}
            disabled={isLoadingSubmit}
          >
            <div class="text-white">{$t("Withdraw")}</div>
          </Button>
        {:else}
          <div
            use:tooltip={{
              content: `<tooltip-detail text=${Number(amount) !== 0 && Number(amount) > (Number(maxWithdraw) || Number(availableWithdraw)) ? "Invalid amount!" : "Amount not available"} />`,
              allowHTML: true,
              placement: "top",
              interactive: true,
            }}
          >
            <Button variant="disabled" disabled>
              <div class="text-white">{$t("Withdraw")}</div>
            </Button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<ReactAdapter
  element={SuiConnector}
  config={widgetConfig}
  autoConnect={false}
  {chains}
  integrator="svelte-example"
/>

<style></style>
