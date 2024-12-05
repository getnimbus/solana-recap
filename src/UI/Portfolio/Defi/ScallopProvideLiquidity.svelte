<script lang="ts">
  import { triggerBonusScore } from "~/utils/functions";
  import { useQueryClient, QueryCache } from "@tanstack/svelte-query";
  import { onMount } from "svelte";
  import {
    isDarkMode,
    selectedTokenDetail,
    showScallopDeFiFarmModal,
    userPublicAddress,
    wallet,
    chain,
    suiWalletInstance,
    showModalBridge,
    user,
  } from "~/store";
  import mixpanel from "mixpanel-browser";
  import { handleValidateAddress } from "~/lib/queryAPI";
  import { createQuery } from "@tanstack/svelte-query";
  import tooltip from "~/lib/tooltip";
  import type { WalletState } from "nimbus-sui-kit";
  import { SuiConnector } from "nimbus-sui-kit";
  import { shorterAddress } from "~/utils";
  import { nimbus } from "~/lib/network";
  import {
    ScallopBuilder,
    ScallopQuery,
    ScallopClient,
  } from "@scallop-io/sui-scallop-sdk";
  import { isNimbusVersion, SUIRPC } from "~/utils/constants";
  import { t } from "~/lib/i18n";

  import Loading from "~/components/Loading.svelte";
  import ReactAdapter from "~/components/ReactAdapter.svelte";
  import Button from "~/components/Button.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Image from "~/components/Image.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import StatusModalUi from "~/components/StatusModalUI.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let holdingTokenData = [];

  const queryCache = new QueryCache();
  const queryClient = useQueryClient();

  const chains = [
    {
      id: "sui:mainnet",
      name: "Mainnet",
      rpcUrl: SUIRPC,
    },
  ];

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

  const scallopQuery = new ScallopQuery({
    networkType: "mainnet",
  });

  const scallopClient = new ScallopClient({
    networkType: "mainnet",
  });

  let isLoading = false;

  let isTrigger = false;

  let percent = 0;
  let amount = "";

  let checkStackSCoin = true;
  let dataInfo = {};
  let coinDecimal = 0;
  let maxSuppliedCoin = 0;
  let isLoadingDataInfo = false;

  let statusData: any = {};

  let publicAddress =
    ($suiWalletInstance as WalletState) &&
    ($suiWalletInstance as WalletState)?.connected
      ? ($suiWalletInstance as WalletState)?.account?.address
      : $userPublicAddress;

  $: selectedTokenSymbol =
    $selectedTokenDetail?.symbol?.toLowerCase() ||
    holdingTokenData
      ?.find(
        (eachHolding) =>
          eachHolding?.name?.toLowerCase() ===
            $selectedTokenDetail?.name?.toLowerCase() ||
          eachHolding?.symbol?.toLowerCase() ===
            $selectedTokenDetail?.symbol?.toLowerCase(),
      )
      ?.symbol?.toLowerCase();

  $: selectedTokenPrice =
    $selectedTokenDetail?.market_price ||
    holdingTokenData?.find(
      (eachHolding) =>
        eachHolding?.name?.toLowerCase() ===
          $selectedTokenDetail?.name?.toLowerCase() ||
        eachHolding?.symbol?.toLowerCase() ===
          $selectedTokenDetail?.symbol?.toLowerCase(),
    )?.market_price;

  $: selectedTokenAmount =
    $selectedTokenDetail?.amount ||
    holdingTokenData?.find(
      (eachHolding) =>
        eachHolding?.name?.toLowerCase() ===
          $selectedTokenDetail?.name?.toLowerCase() ||
        eachHolding?.symbol?.toLowerCase() ===
          $selectedTokenDetail?.symbol?.toLowerCase(),
    )?.amount;

  $: queryValidate = createQuery({
    queryKey: ["validate", publicAddress],
    queryFn: () => handleValidateAddress(publicAddress || ""),
    retry: false,
  });

  const initScallop = async () => {
    await scallopQuery.init();
    await scallopClient.init();
  };

  const getDataSupplied = async (address: any) => {
    try {
      await scallopQuery.init();
      const res: any = await scallopQuery.getLendings(
        [selectedTokenSymbol],
        address,
      );
      if (res) {
        coinDecimal = res[selectedTokenSymbol]?.coinDecimal || 0;
        maxSuppliedCoin = res[selectedTokenSymbol]?.availableSupplyCoin || 0;
      }
    } catch (e) {
      console.error(e);
    }
  };

  $: {
    if (!$queryValidate.isError && $queryValidate.data !== undefined) {
      if ($queryValidate?.data?.type === "MOVE") {
        getDataSupplied($queryValidate?.data.address);
      }
    }
  }

  const getDataFarmInfo = async () => {
    try {
      isLoadingDataInfo = true;
      const res: any = await scallopClient.queryMarket();
      if (res && res?.pools) {
        dataInfo = res?.pools[selectedTokenSymbol];
      }
    } catch (e) {
      console.error(e);
    } finally {
      isLoadingDataInfo = false;
    }
  };

  onMount(() => {
    initScallop();
    getDataFarmInfo();
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

  const handleSUIAuth = async () => {
    mixpanel.track("user_login_sui");
    mixpanel.track("user_login_sui_Scallop_farm");
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
        getDataFarmInfo();
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
      amount = (percent * Number(selectedTokenAmount)) / 100;
    }
  }

  $: value = amount * Number(selectedTokenPrice) || 0;

  const handleOnChainBonus = async (data: any) => {
    try {
      const response = await nimbus
        .post(`/onchain/${publicAddress}/bonus?chain=SUI`, {
          volume: data?.volume,
          txHash: data?.txHash,
          chain: $chain,
          type: data?.type,
        })
        .then((res: any) => res.data);

      if (response && response?.message === "Claim bonus successfully") {
        queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);
        triggerBonusScore(data?.volume * 5, 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSupply = async () => {
    try {
      const scallopBuilder = new ScallopBuilder({
        walletAddress: publicAddress,
        networkType: "mainnet",
      });
      await scallopBuilder.init();

      mixpanel.track(`user_Supply_Scallop`, {
        address: publicAddress,
      });

      // if (checkStackSCoin) {
      //   handleSupplyLendingAndStake();
      // } else {
      //   handleSupplyLending();
      // }

      handleSupplyLending();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSupplyLending = async () => {
    isLoading = true;
    try {
      const obligationAddress =
        await scallopQuery.getObligations(publicAddress);

      const amountValue = percent === 100 ? maxSuppliedCoin : Number(amount);

      let txBlock = null;

      if (obligationAddress.length !== 0) {
        const obligationId = obligationAddress[0].id;
        txBlock = await scallopClient.depositCollateral(
          selectedTokenSymbol,
          Math.round(amountValue * 10 ** coinDecimal),
          false,
          obligationId,
          publicAddress,
        );
      } else {
        txBlock = await scallopClient.deposit(
          selectedTokenSymbol,
          Math.round(amountValue * 10 ** coinDecimal),
          false,
          publicAddress,
        );
      }

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

      if (res && res?.digest) {
        getDataSupplied(publicAddress);
        getDataFarmInfo();

        queryCache.clear();
        getSync();
        forceRefreshHoldingToken($wallet, $chain);
        forceRefreshPosition($wallet);
        queryClient?.refetchQueries(["position-list", $wallet]);
        queryClient?.refetchQueries(["positions"]);
        queryClient?.refetchQueries(["position-history"]);

        // if ($chain !== "ALL") {
        //   queryClient?.refetchQueries(["token-holding-each-chain"]);
        // } else {
        //   queryClient?.refetchQueries(["token-holding"]);
        // }

        queryClient?.refetchQueries(["token-holding-each-chain"]);
        queryClient?.refetchQueries(["token-holding"]);

        statusData = {
          status: "success",
          tx: res?.digest,
          type: "Lending",
        };

        mixpanel.track(`user_Lending_Scallop`, {
          address: publicAddress,
          tx: res?.digest,
          amount: Number(amountValue),
          value: Number(amountValue) * Number(selectedTokenPrice),
        });

        handleOnChainBonus({
          volume: Math.floor(Number(amountValue) * Number(selectedTokenPrice)),
          txHash: res.digest,
          chain: $chain,
          type: "lending",
        });
      } else {
        mixpanel.track("user_Lending_Scallop_fail", {
          res,
        });
        statusData = {
          status: "fail",
          type: "Lending",
        };
      }
    } catch (e) {
      console.error(e);
      statusData = {
        status: "fail",
        type: "Lending",
      };
      mixpanel.track("user_Lending_Scallop_fail", {
        e,
      });
    } finally {
      isLoading = false;
    }
  };

  // const handleSupplyLendingAndStake = async () => {
  //   isLoading = true;
  //   try {
  //     const sStakeCoin = "s" + selectedTokenSymbol;

  //     const stakeAccountsData = await scallopClient.getStakeAccounts(
  //       sStakeCoin,
  //       publicAddress,
  //     );

  //     const amountValue = percent === 100 ? maxSuppliedCoin : Number(amount);

  //     let txBlock = null;

  //     if (stakeAccountsData.length !== 0) {
  //       const stakeAccountId = stakeAccountsData[0].id;
  //       txBlock = await scallopClient.depositAndStake(
  //         selectedTokenSymbol,
  //         Math.round(amountValue * 10 ** coinDecimal),
  //         false,
  //         stakeAccountId,
  //         publicAddress,
  //       );
  //     } else {
  //       const txBlockCreateStakeAccount =
  //         await scallopClient.createStakeAccount(
  //           sStakeCoin,
  //           false,
  //           publicAddress,
  //         );
  //       const res = await (
  //         $suiWalletInstance as WalletState
  //       ).signAndExecuteTransactionBlock({
  //         transactionBlock: txBlockCreateStakeAccount,
  //         options: {
  //           showInput: true,
  //           showEffects: true,
  //           showEvents: true,
  //           showObjectChanges: true,
  //           showBalanceChanges: true,
  //         },
  //       });
  //       if (res.digest) {
  //         const stakeAccountsData = await scallopClient.getStakeAccounts(
  //           sStakeCoin,
  //           publicAddress,
  //         );
  //         if (stakeAccountsData.length !== 0) {
  //           const stakeAccountId = stakeAccountsData[0].id;
  //           txBlock = await scallopClient.depositAndStake(
  //             sStakeCoin,
  //             Math.round(amountValue * 10 ** coinDecimal),
  //             false,
  //             stakeAccountId,
  //             publicAddress,
  //           );
  //         }
  //       }
  //     }

  //     const res = await (
  //       $suiWalletInstance as WalletState
  //     ).signAndExecuteTransactionBlock({
  //       transactionBlock: txBlock,
  //       options: {
  //         showInput: true,
  //         showEffects: true,
  //         showEvents: true,
  //         showObjectChanges: true,
  //         showBalanceChanges: true,
  //       },
  //     });

  //     if (res && res?.digest) {
  //       getDataSupplied(publicAddress);
  //       getDataFarmInfo();

  //       queryCache.clear();
  //       getSync();
  //       forceRefreshHoldingToken($wallet, $chain);
  //       forceRefreshPosition($wallet);
  //       queryClient.refetchQueries(["positions"]);
  //       if ($chain !== "ALL") {
  //         queryClient?.refetchQueries(["token-holding-each-chain"]);
  //       } else {
  //         queryClient.refetchQueries(["token-holding"]);
  //       }
  //       queryClient.refetchQueries(["position-history"]);

  //       statusData = {
  //         status: "success",
  //         tx: res?.digest,
  //         type: "Stake",
  //       };

  //       mixpanel.track(`user_Lending_Stake_Scallop`, {
  //         address: publicAddress,
  //         tx: res?.digest,
  //         amount: Number(amountValue),
  //         value: Number(amountValue) * Number(selectedTokenPrice),
  //       });

  //       handleOnChainBonus({
  //         volume:
  //           Math.floor(Number(amountValue) * Number(selectedTokenPrice)) * 2,
  //         txHash: res.digest,
  //         chain: $chain,
  //         type: "staking",
  //       });
  //     } else {
  //       mixpanel.track("user_Lending_Stake_Scallop_fail", {
  //         res,
  //       });
  //       statusData = {
  //         status: "fail",
  //         type: "Stake",
  //       };
  //     }
  //   } catch (e) {
  //     console.error(e);
  //     mixpanel.track("user_Lending_Stake_Scallop_fail", {
  //       e,
  //     });
  //     statusData = {
  //       status: "fail",
  //       type: "Stake",
  //     };
  //   } finally {
  //     isLoading = false;
  //   }
  // };

  $: isEnable = Boolean(
    $selectedTokenDetail &&
      ($suiWalletInstance as WalletState) &&
      ($suiWalletInstance as WalletState)?.connected &&
      ($user && Object.keys($user).length !== 0
        ? publicAddress === $wallet
        : true) &&
      $queryValidate?.data &&
      $queryValidate?.data?.type === "MOVE",
  );
</script>

{#if statusData && Object.keys(statusData).length !== 0}
  <StatusModalUi
    type={statusData?.status}
    title={statusData?.status === "success" ? "Success" : "Fail"}
  >
    <span slot="msg">
      {#if statusData?.status === "fail"}
        Something wrong when try to {statusData?.type}. Please try again!
      {:else}
        You have successfully provide <span class="font-medium"
          >{statusData?.type}</span
        >
        on <span class="font-medium">Scallop</span> with tx
        <span class="underline font-medium">
          <a href={`https://suiscan.xyz/tx/${statusData?.tx}`} target="_blank">
            {shorterAddress(statusData?.tx)}
          </a>
        </span>
      {/if}
    </span>
  </StatusModalUi>
{:else}
  <div class="flex flex-col gap-4">
    <div class="font-medium text-2xl">
      {$t("Provide Liquidity on")} Scallop
    </div>

    <div class="flex flex-col gap-1">
      <div class="flex justify-between">
        <div class="text-gray-500 text-sm px-1">
          <TooltipNumber
            number={Number(selectedTokenAmount || 0)}
            type="balance"
          />
          {$selectedTokenDetail?.symbol} in wallet
        </div>
        <div
          class="underline text-sm cursor-pointer hover:text-[#1e96fc] transition-all"
          on:click={() => {
            if (isLoading) {
              return;
            }

            showModalBridge.update((n) => (n = true));
          }}
        >
          {$t("Bridge Tokens")}
        </div>
      </div>

      <div
        class={`flex flex-col gap-3 border border_0000000d p-4 rounded-[10px] ${Number(amount) !== 0 && Number(amount) > Number(selectedTokenAmount) ? "border-red-500" : "border_0000000d"}`}
      >
        <div class="flex items-start gap-4">
          <div class="rounded-full w-[46px] h-[46px] overflow-hidden">
            <Image
              logo={$selectedTokenDetail?.logo}
              defaultLogo={defaultToken}
            />
          </div>

          <div class="flex-1 flex flex-col">
            <input
              type="text"
              placeholder="0"
              autocomplete="off"
              inputmode="decimal"
              class="text-xl p-0 border-none focus:outline-none focus:ring-0 flex-1 bg-transparent"
              value={amount}
              disabled={isLoading}
              on:change={(event) => {
                amount = event?.target?.value;
                if (percent) {
                  const amountWithPercent =
                    (percent * Number(selectedTokenAmount)) / 100;

                  if (amountWithPercent !== amount) {
                    percent = 0;
                  }
                }
              }}
            />
            <div class="text-gray-500 text-sm">≈ ${value?.toFixed(4) || 0}</div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div
            class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percent === 25 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
            on:click={() => {
              if (isLoading) {
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
              if (isLoading) {
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
              if (isLoading) {
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
              if (isLoading) {
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

    {#if isLoadingDataInfo}
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
          <div class="text_00000099 text-sm">
            {$t("Max Supply")}
          </div>
          <div class="text-sm">
            <TooltipNumber
              number={Number(selectedTokenAmount || 0)}
              type="balance"
            />
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div class="text_00000099 text-sm">{$t("Supply APR")}</div>
          <div class="text-sm">
            <TooltipNumber
              number={Number(dataInfo?.supplyApr || 0) * 100}
              type="percent"
            />%
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div class="text_00000099 text-sm">{$t("Market Price")}</div>
          <div class="text-sm">
            <TooltipNumber number={selectedTokenPrice || 0} />
          </div>
        </div>
      </div>
    {/if}

    <!-- {#if selectedTokenSymbol !== "sca"}
      <div class="flex items-center justify-start gap-2 text-[#666666] mt-3">
        <label class="switch" for="switch">
          <input
            type="checkbox"
            bind:checked={checkStackSCoin}
            class="cursor-pointer relative w-5 h-5 appearance-none rounded-[0.25rem] border outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
          />
          <span class="slider" />
        </label>
        <div class="text-sm font-regular text-gray-500 mt-1">
          Stake s{$selectedTokenDetail?.symbol} into sCoin Pools
        </div>
      </div>
    {/if} -->

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
              <div class="text-white">{$t("Supply")}</div>
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
          {#if Number(amount) > 0 && Number(selectedTokenAmount) > 0}
            <Button
              variant="tertiary"
              on:click={handleSupply}
              {isLoading}
              disabled={isLoading}
            >
              <div class="text-white">{$t("Supply")}</div>
            </Button>
          {:else}
            <div
              use:tooltip={{
                content: `<tooltip-detail text=${Number(amount) < Number(selectedTokenAmount) ? "Insuficinet balance!" : "Invalid amount!"}/>`,
                allowHTML: true,
                placement: "top",
                interactive: true,
              }}
            >
              <Button variant="disabled" disabled>
                <div class="text-white">{$t("Supply")}</div>
              </Button>
            </div>
          {/if}
        </div>
      {/if}
      <div class="w-[120px]">
        <Button
          variant="secondary"
          disabled={isLoading}
          on:click={() => {
            showScallopDeFiFarmModal.update((n) => (n = false));
          }}
        >
          {$t("Cancel")}
        </Button>
      </div>
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
