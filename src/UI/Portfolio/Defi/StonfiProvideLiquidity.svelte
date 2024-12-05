<script lang="ts">
  import { retry, triggerBonusScore } from "~/utils/functions";
  import { nimbus } from "~/lib/network";
  import axios from "axios";
  import mixpanel from "mixpanel-browser";
  import {
    createQuery,
    useQueryClient,
    QueryCache,
  } from "@tanstack/svelte-query";
  import { handleValidateAddress } from "~/lib/queryAPI";
  import tooltip from "~/lib/tooltip";
  import {
    tonConnector,
    wallet,
    userPublicAddress,
    showStonfiDeFiFarmModal,
    showModalBridge,
    isDarkMode,
    chain,
    user,
  } from "~/store";
  import { TonClient, Address, Cell, beginCell, storeMessage } from "@ton/ton";
  import { pTON, dexFactory } from "../../../../node_modules/@ston-fi/sdk";
  import { StonApiClient } from "../../../../node_modules/@ston-fi/api";
  import { isNimbusVersion } from "~/utils/constants";
  import { shorterAddress } from "~/utils";
  import { t } from "~/lib/i18n";

  import StatusModalUi from "~/components/StatusModalUI.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Image from "~/components/Image.svelte";
  import Button from "~/components/Button.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let selectedProtocol;
  export let listTONToken;
  export let isLoading;
  export let poolName;
  export let holdingTokenData;

  const queryCache = new QueryCache();
  const queryClient = useQueryClient();

  const STONFIRPCURL = "https://rpc.ston.fi";

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
          `/v2/address/${address}/positions?protocol=STON.fi&force_refresh=${true}`,
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

  const getTxByBOC = async (exBoc: any, address: any) => {
    const myAddress = Address.parse(address);

    return retry(
      async () => {
        const transactions = await client.getTransactions(myAddress, {
          limit: 5,
        });
        for (const tx of transactions) {
          const inMsg = tx.inMessage;
          if (inMsg?.info.type === "external-in") {
            const inBOC = inMsg?.body;
            if (typeof inBOC === "undefined") {
              throw new Error("Invalid external");
              continue;
            }
            const extHash = Cell.fromBase64(exBoc).hash().toString("hex");
            const inHash = beginCell()
              .store(storeMessage(inMsg))
              .endCell()
              .hash()
              .toString("hex");

            console.log(" hash BOC", extHash);
            console.log("inMsg hash", inHash);
            console.log("checking the tx", tx, tx.hash().toString("hex"));

            // Assuming `inBOC.hash()` is synchronous and returns a hash object with a `toString` method
            if (extHash === inHash) {
              console.log("Tx match");
              const txHash = tx.hash().toString("hex");
              console.log(`Transaction Hash: ${txHash}`);
              console.log(`Transaction LT: ${tx.lt}`);
              return txHash;
            }
          }
        }
        throw new Error("Transaction not found");
      },
      { retries: 30, delay: 1000 },
    );
  };

  const handleOnChainBonus = async (data: any) => {
    try {
      const response = await nimbus
        .post(`/onchain/${publicAddress}/bonus?chain=TON`, {
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

  let statusData: any = {};

  $: formatSelectedProtocol = {
    ...selectedProtocol,
    pairs: selectedProtocol?.coins?.map((item: string) => {
      const info = listTONToken.find(
        (eachToken: any) => eachToken?.contract_address === item,
      );

      const selectedTokenHoldingInfo = holdingTokenData.find(
        (eachToken: any) =>
          (eachToken?.contractAddress === "TONCOIN"
            ? "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
            : eachToken?.contractAddress) === item,
      );

      return {
        ca: item,
        symbol: info?.symbol || "",
        decimals: info?.decimals || 0,
        name: info?.display_name || "",
        logo: info?.image_url || "",
        amount: selectedTokenHoldingInfo ? selectedTokenHoldingInfo?.amount : 0,
        amountRaw: selectedTokenHoldingInfo
          ? selectedTokenHoldingInfo.amountRaw
          : 0,
        price: info?.dex_price_usd || 0,
      };
    }),
  };

  $: isPoolTONJetton = formatSelectedProtocol?.name?.startsWith("TON-");

  $: selectedTokenPrice0 = formatSelectedProtocol.pairs[0]?.price;

  $: selectedTokenPrice1 = formatSelectedProtocol.pairs[1]?.price;

  $: selectedTokenAmount0 = formatSelectedProtocol.pairs[0]?.amount;

  $: selectedTokenAmount1 = formatSelectedProtocol.pairs[1]?.amount;

  $: JETTON_0 = formatSelectedProtocol.pairs.find(
    (item: any) => item.symbol === poolName[1],
  );

  $: JETTON_1 = formatSelectedProtocol.pairs.find(
    (item: any) => item.symbol === poolName[0],
  );

  const stonApi = new StonApiClient();

  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: "40a68ff3af6b3ec4d7e4bda8cc7aeeb345f0d8b4e7892eb7dfc191a0ba0665ce",
  });

  let publicAddress = $tonConnector?.connected
    ? Address.parse($tonConnector?.account.address).toString({
        urlSafe: true,
        bounceable: true,
      })
    : $userPublicAddress;

  $: queryValidate = createQuery({
    queryKey: ["validate", publicAddress],
    queryFn: () => handleValidateAddress(publicAddress),
    retry: false,
  });

  let selectedPoolData: any = {};

  const getSelectedPool = async (address: string) => {
    try {
      const response = await axios
        .post(STONFIRPCURL, {
          jsonrpc: "2.0",
          id: 179,
          method: "pool.find",
          params: {
            token_a: JETTON_1.ca,
            token_b: JETTON_0.ca,
            wallet_address: address,
          },
        })
        .then((res: any) => res.data);

      if (response && response?.result?.pools?.length !== 0) {
        selectedPoolData = response?.result?.pools.find(
          (item: any) => item.address === selectedProtocol.id,
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTONAuth = async () => {
    mixpanel.track("user_login_ton");
    if ($tonConnector?.connected) {
      $tonConnector?.disconnect();
    } else {
      $tonConnector?.setConnectRequestParameters({
        state: "ready",
      });

      $tonConnector?.openModal();

      $tonConnector?.onStatusChange((wallet) => {
        if (wallet) {
          const parserAddress = Address.parse(
            wallet?.account?.address,
          ).toString({ urlSafe: true, bounceable: true });

          publicAddress = parserAddress;

          queryCache.clear();

          getSelectedPool(publicAddress);

          window.history.replaceState(
            null,
            "",
            window.location.pathname + `?address=${publicAddress}&chain=TON`,
          );
        }
      });
    }
  };

  $: isEnable = Boolean(
    $tonConnector &&
      $tonConnector?.connected &&
      ($user && Object.keys($user).length !== 0
        ? publicAddress === $wallet
        : true) &&
      $queryValidate?.data &&
      $queryValidate?.data?.type === "TON",
  );

  $: {
    if (isEnable) {
      getSelectedPool(publicAddress);
    }
  }

  let isLoadingSupplyTONJettonV2 = false;
  let isLoadingSupplyJettonJettonV2 = false;

  let percentToken0 = 0;
  let amountToken0 = "";

  let percentToken1 = 0;
  let amountToken1 = "";

  let dataMintAmountInput = {};

  let minAmountToken0Cal = "";
  let minAmountToken1Cal = "";

  $: value1 = amountToken1 * Number(selectedTokenPrice1) || 0;

  $: value0 = amountToken0 * Number(selectedTokenPrice0) || 0;

  const getMinUnitAmount = async (tokenAInput: any, tokenBInput: any) => {
    try {
      const response = await axios
        .post(STONFIRPCURL, {
          jsonrpc: "2.0",
          id: 43,
          method: "dex.simulate_liquidity_provision",
          params: {
            provision_type: "Balanced",
            router_address: selectedPoolData.router_address,
            wallet_address: publicAddress,
            slippage_tolerance: "0.01",
            token_a: isPoolTONJetton ? JETTON_1.ca : JETTON_0.ca,
            token_b: isPoolTONJetton ? JETTON_0.ca : JETTON_1.ca,
            token_a_units: isPoolTONJetton
              ? Math.round(tokenAInput * 10 ** JETTON_1.decimals).toString()
              : Math.round(tokenAInput * 10 ** JETTON_0.decimals).toString(),
            token_b_units: isPoolTONJetton
              ? Math.round(tokenBInput * 10 ** JETTON_0.decimals).toString()
              : Math.round(tokenBInput * 10 ** JETTON_1.decimals).toString(),
          },
        })
        .then((res: any) => res.data);

      if (response && response?.result) {
        dataMintAmountInput = response?.result;

        if (isPoolTONJetton) {
          minAmountToken0Cal =
            dataMintAmountInput?.token_a_min_units / 10 ** JETTON_1.decimals;

          minAmountToken1Cal =
            dataMintAmountInput?.token_b_min_units / 10 ** JETTON_0.decimals;
        } else {
          minAmountToken0Cal =
            dataMintAmountInput?.token_a_min_units / 10 ** JETTON_0.decimals;

          minAmountToken1Cal =
            dataMintAmountInput?.token_b_min_units / 10 ** JETTON_1.decimals;
        }
      } else {
        dataMintAmountInput = {};
      }
    } catch (e) {
      console.error(e);
    }
  };

  // handle supply (two sides) TON/Jetton
  const handleSupplyTONJettonTwoSide = async () => {
    try {
      isLoadingSupplyTONJettonV2 = true;

      const pool = await stonApi.getPool(selectedProtocol.id);
      const router = await stonApi.getRouter(pool.routerAddress);

      if (router.address && router.ptonMasterAddress) {
        const dexContracts = dexFactory(router);

        const routerContract = client.open(
          dexContracts.Router.create(router.address),
        );

        const proxyTon = pTON.v2_1.create(router.ptonMasterAddress);

        const txParams = await Promise.all([
          // TON to JETTON
          routerContract.getProvideLiquidityTonTxParams({
            proxyTon,
            sendAmount: Math.floor(
              (Number(minAmountToken0Cal) === Number(amountToken1)
                ? Number(minAmountToken0Cal)
                : Number(amountToken1)) *
                10 ** JETTON_1.decimals,
            ),
            otherTokenAddress: JETTON_0.ca,
            queryId: 12345,
            minLpOut: 1,
            userWalletAddress: publicAddress,
          }),
          // JETTON to TON
          routerContract.getProvideLiquidityJettonTxParams({
            sendTokenAddress: JETTON_0.ca,
            sendAmount: Math.floor(
              (Number(minAmountToken1Cal) === Number(amountToken0)
                ? Number(minAmountToken1Cal)
                : Number(amountToken0)) *
                10 ** JETTON_0.decimals,
            ),
            otherTokenAddress: router.ptonMasterAddress,
            queryId: 123456,
            minLpOut: 1,
            userWalletAddress: publicAddress,
          }),
        ]);

        const formatTxsParams = txParams.map((param) => {
          return {
            address: param.to.toString(),
            amount: param.value.toString(),
            payload: param.body?.toBoc().toString("base64"),
          };
        });

        const result = await $tonConnector.sendTransaction({
          validUntil: Date.now() + 1000000,
          messages: formatTxsParams,
        });

        const trxHash = await getTxByBOC(result.boc, publicAddress);

        if (trxHash) {
          queryCache.clear();
          getSync();
          forceRefreshHoldingToken(publicAddress, $chain);
          forceRefreshPosition(publicAddress);

          queryClient?.refetchQueries(["position-list", $wallet]);
          queryClient?.refetchQueries(["positions"]);
          queryClient?.refetchQueries(["position-history"]);
          queryClient?.refetchQueries(["token-holding-each-chain"]);
          queryClient?.refetchQueries(["token-holding"]);

          statusData = {
            status: "success",
            tx: trxHash,
            type: "Add Liquidity",
          };

          mixpanel.track(`user_Add_Liquidity_Stonfi`, {
            address: publicAddress,
            tx: trxHash,
            amount0:
              Number(minAmountToken1Cal) === Number(amountToken0)
                ? Number(minAmountToken1Cal) / 10 ** JETTON_0.decimals
                : Number(amountToken0),
            value0:
              (Number(minAmountToken1Cal) === Number(amountToken0)
                ? Number(minAmountToken1Cal) / 10 ** JETTON_0.decimals
                : Number(amountToken0)) * Number(JETTON_0.price),
            amount1:
              Number(minAmountToken0Cal) === Number(amountToken1)
                ? Number(minAmountToken0Cal) / 10 ** JETTON_1.decimals
                : Number(amountToken1),
            value1:
              (Number(minAmountToken0Cal) === Number(amountToken1)
                ? Number(minAmountToken0Cal) / 10 ** JETTON_1.decimals
                : Number(amountToken1)) * Number(JETTON_1.price),
          });

          const volume =
            Math.floor(
              (Number(minAmountToken1Cal) === Number(amountToken0)
                ? Number(minAmountToken1Cal) / 10 ** JETTON_0.decimals
                : Number(amountToken0)) * Number(JETTON_0.price),
            ) +
            Math.floor(
              (Number(minAmountToken0Cal) === Number(amountToken1)
                ? Number(minAmountToken0Cal) / 10 ** JETTON_1.decimals
                : Number(amountToken1)) * Number(JETTON_1.price),
            );

          if (volume !== 0) {
            handleOnChainBonus({
              volume,
              txHash: trxHash,
              chain: $chain,
              type: "addLiquidity",
            });
          }
        } else {
          mixpanel.track("user_Add_Liquidity_Stonfi_fail", {
            res: result,
          });
          statusData = {
            status: "fail",
            type: "Add Liquidity",
          };
        }
      }
    } catch (e) {
      console.error(e);
      statusData = {
        status: "fail",
        type: "Add Liquidity",
      };
      mixpanel.track("user_Add_Liquidity_Stonfi_fail", {
        e,
      });
    } finally {
      isLoadingSupplyTONJettonV2 = false;
    }
  };

  // handle supply (two sides) Jetton/Jetton
  const handleSupplyJettonJettonTwoSide = async () => {
    try {
      isLoadingSupplyJettonJettonV2 = true;

      const pool = await stonApi.getPool(selectedProtocol.id);
      const router = await stonApi.getRouter(pool.routerAddress);

      if (router.address) {
        const dexContracts = dexFactory(router);

        const routerContract = client.open(
          dexContracts.Router.create(router.address),
        );

        const sharedTxArgs = {
          queryId: 12345,
          userWalletAddress: publicAddress,
          minLpOut: 1n,
        } as const;

        const txParams = await Promise.all([
          routerContract.getProvideLiquidityJettonTxParams({
            ...sharedTxArgs,
            sendTokenAddress: JETTON_1.ca,
            sendAmount: Math.floor(
              (Number(minAmountToken1Cal) === Number(amountToken0)
                ? Number(minAmountToken1Cal)
                : Number(amountToken0)) *
                10 ** JETTON_0.decimals,
            ),
            otherTokenAddress: JETTON_0.ca,
          }),
          routerContract.getProvideLiquidityJettonTxParams({
            ...sharedTxArgs,
            sendTokenAddress: JETTON_0.ca,
            sendAmount: Math.floor(
              (Number(minAmountToken0Cal) === Number(amountToken1)
                ? Number(minAmountToken0Cal)
                : Number(amountToken1)) *
                10 ** JETTON_1.decimals,
            ),
            otherTokenAddress: JETTON_1.ca,
          }),
        ]);

        const formatTxsParams = txParams.map((param) => {
          return {
            address: param.to.toString(),
            amount: param.value.toString(),
            payload: param.body?.toBoc().toString("base64"),
          };
        });

        const result = await $tonConnector.sendTransaction({
          validUntil: Date.now() + 1000000,
          messages: formatTxsParams,
        });

        const trxHash = await getTxByBOC(result.boc, publicAddress);

        if (trxHash) {
          queryCache.clear();
          getSync();
          forceRefreshHoldingToken(publicAddress, $chain);
          forceRefreshPosition(publicAddress);

          queryClient?.refetchQueries(["position-list", $wallet]);
          queryClient?.refetchQueries(["positions"]);
          queryClient?.refetchQueries(["position-history"]);
          queryClient?.refetchQueries(["token-holding-each-chain"]);
          queryClient?.refetchQueries(["token-holding"]);

          statusData = {
            status: "success",
            tx: trxHash,
            type: "Add Liquidity",
          };

          mixpanel.track(`user_Add_Liquidity_Stonfi`, {
            address: publicAddress,
            tx: trxHash,
            amount0:
              Number(minAmountToken1Cal) === Number(amountToken0)
                ? Number(minAmountToken1Cal) / 10 ** JETTON_0.decimals
                : Number(amountToken0),
            value0:
              Number(minAmountToken1Cal) === Number(amountToken0)
                ? Number(minAmountToken1Cal) / 10 ** JETTON_0.decimals
                : Number(amountToken0) * Number(JETTON_1.price),

            amount1:
              Number(minAmountToken0Cal) === Number(amountToken1)
                ? Number(minAmountToken0Cal) / 10 ** JETTON_1.decimals
                : Number(amountToken1),
            value1:
              Number(minAmountToken0Cal) === Number(amountToken1)
                ? Number(minAmountToken0Cal) / 10 ** JETTON_1.decimals
                : Number(amountToken1) * Number(JETTON_0.price),
          });

          const volume =
            Math.floor(
              Number(minAmountToken1Cal) === Number(amountToken0)
                ? Number(minAmountToken1Cal) / 10 ** JETTON_0.decimals
                : Number(amountToken0) * Number(JETTON_1.price),
            ) +
            Math.floor(
              Number(minAmountToken0Cal) === Number(amountToken1)
                ? Number(minAmountToken0Cal) / 10 ** JETTON_1.decimals
                : Number(amountToken1) * Number(JETTON_0.price),
            );

          if (volume !== 0) {
            handleOnChainBonus({
              volume,
              txHash: trxHash,
              chain: $chain,
              type: "addLiquidity",
            });
          }
        } else {
          mixpanel.track("user_Add_Liquidity_Stonfi_fail", {
            res: result,
          });
          statusData = {
            status: "fail",
            type: "Add Liquidity",
          };
        }
      }
    } catch (e) {
      console.error(e);
      statusData = {
        status: "fail",
        type: "Add Liquidity",
      };
      mixpanel.track("user_Add_Liquidity_Stonfi_fail", {
        e,
      });
    } finally {
      isLoadingSupplyJettonJettonV2 = false;
    }
  };
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
        on <span class="font-medium">STON.fi</span> with tx
        <span class="font-medium underline">
          <a href={`https://tonscan.org/tx/${statusData?.tx}`} target="_blank">
            {shorterAddress(statusData?.tx)}
          </a>
        </span>
      {/if}
    </span>
  </StatusModalUi>
{:else}
  <div class="flex flex-col gap-4">
    <div class="font-medium text-2xl">
      {$t("Provide Liquidity on")} STON.fi
    </div>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <div class="flex justify-between">
          <div class="text-gray-500 text-sm px-1">
            <TooltipNumber
              number={Number(selectedTokenAmount1 || 0)}
              type="balance"
            />
            {formatSelectedProtocol.pairs[1].symbol} in wallet
          </div>
          <div
            class="underline text-sm cursor-pointer hover:text-[#1e96fc] transition-all"
            on:click={() => {
              if (isLoadingSupplyJettonJettonV2 || isLoadingSupplyTONJettonV2) {
                return;
              }
              showModalBridge.update((n) => (n = true));
            }}
          >
            {$t("Bridge Tokens")}
          </div>
        </div>

        <div
          class={`flex flex-col gap-3 border border_0000000d p-4 rounded-[10px] ${Number(amountToken1) < 0 || (Number(amountToken1) !== 0 && Number(amountToken1) > Number(selectedTokenAmount1)) ? "border-red-500" : "border_0000000d"}`}
        >
          <div class="flex items-start gap-4">
            <div class="rounded-full w-[46px] h-[46px] overflow-hidden">
              <Image
                logo={formatSelectedProtocol.pairs[1].logo}
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
                value={amountToken1}
                disabled={isLoadingSupplyJettonJettonV2 ||
                  isLoadingSupplyTONJettonV2}
                on:change={async (event) => {
                  if (event?.target?.value) {
                    amountToken1 = event?.target?.value;

                    if (percentToken1) {
                      const amountWithPercent =
                        (percentToken1 * Number(selectedTokenAmount1)) / 100;

                      if (amountWithPercent !== amountToken1) {
                        percentToken1 = 0;
                      }
                    }

                    await getMinUnitAmount(amountToken1, amountToken0);

                    amountToken0 =
                      dataMintAmountInput &&
                      Object.keys(dataMintAmountInput).length !== 0
                        ? dataMintAmountInput?.token_b_min_units /
                          10 ** JETTON_0.decimals
                        : "";
                  } else {
                    amountToken1 = "";
                    amountToken0 = "";
                  }
                }}
              />
              <div class="text-gray-500 text-sm">
                ≈ ${value1?.toFixed(4) || 0}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div
              class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percentToken1 === 25 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
              on:click={async () => {
                if (
                  isLoadingSupplyJettonJettonV2 ||
                  isLoadingSupplyTONJettonV2
                ) {
                  return;
                }

                if (percentToken1 === 25) {
                  percentToken1 = 0;
                  amountToken1 = "";
                  amountToken0 = "";
                } else {
                  percentToken1 = 25;

                  amountToken1 =
                    (percentToken1 * Number(selectedTokenAmount1)) / 100;

                  await getMinUnitAmount(amountToken1, amountToken0);

                  amountToken0 =
                    dataMintAmountInput &&
                    Object.keys(dataMintAmountInput).length !== 0
                      ? dataMintAmountInput?.token_b_min_units /
                        10 ** JETTON_0.decimals
                      : "";
                }
              }}
            >
              25%
            </div>
            <div
              class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percentToken1 === 50 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
              on:click={async () => {
                if (
                  isLoadingSupplyJettonJettonV2 ||
                  isLoadingSupplyTONJettonV2
                ) {
                  return;
                }

                if (percentToken1 === 50) {
                  percentToken1 = 0;
                  amountToken1 = "";
                  amountToken0 = "";
                } else {
                  percentToken1 = 50;

                  amountToken1 =
                    (percentToken1 * Number(selectedTokenAmount1)) / 100;

                  await getMinUnitAmount(amountToken1, amountToken0);

                  amountToken0 =
                    dataMintAmountInput &&
                    Object.keys(dataMintAmountInput).length !== 0
                      ? dataMintAmountInput?.token_b_min_units /
                        10 ** JETTON_0.decimals
                      : "";
                }
              }}
            >
              50%
            </div>
            <div
              class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percentToken1 === 75 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
              on:click={async () => {
                if (
                  isLoadingSupplyJettonJettonV2 ||
                  isLoadingSupplyTONJettonV2
                ) {
                  return;
                }

                if (percentToken1 === 75) {
                  percentToken1 = 0;
                  amountToken1 = "";
                  amountToken0 = "";
                } else {
                  percentToken1 = 75;

                  amountToken1 =
                    (percentToken1 * Number(selectedTokenAmount1)) / 100;

                  await getMinUnitAmount(amountToken1, amountToken0);

                  amountToken0 =
                    dataMintAmountInput &&
                    Object.keys(dataMintAmountInput).length !== 0
                      ? dataMintAmountInput?.token_b_min_units /
                        10 ** JETTON_0.decimals
                      : "";
                }
              }}
            >
              75%
            </div>
            <div
              class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percentToken1 === 100 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
              on:click={async () => {
                if (
                  isLoadingSupplyJettonJettonV2 ||
                  isLoadingSupplyTONJettonV2
                ) {
                  return;
                }

                if (percentToken1 === 100) {
                  percentToken1 = 0;
                  amountToken1 = "";
                  amountToken0 = "";
                } else {
                  percentToken1 = 100;

                  amountToken1 =
                    (percentToken1 * Number(selectedTokenAmount1)) / 100;

                  await getMinUnitAmount(amountToken1, amountToken0);

                  amountToken0 =
                    dataMintAmountInput &&
                    Object.keys(dataMintAmountInput).length !== 0
                      ? dataMintAmountInput?.token_b_min_units /
                        10 ** JETTON_0.decimals
                      : "";
                }
              }}
            >
              100%
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex justify-between">
          <div class="text-gray-500 text-sm px-1">
            <TooltipNumber
              number={Number(selectedTokenAmount0 || 0)}
              type="balance"
            />
            {formatSelectedProtocol.pairs[0].symbol} in wallet
          </div>
          <div
            class="underline text-sm cursor-pointer hover:text-[#1e96fc] transition-all"
            on:click={() => {
              if (isLoadingSupplyJettonJettonV2 || isLoadingSupplyTONJettonV2) {
                return;
              }

              showModalBridge.update((n) => (n = true));
            }}
          >
            {$t("Bridge Tokens")}
          </div>
        </div>

        <div
          class={`flex flex-col gap-3 border p-4 rounded-[10px] ${Number(amountToken0) < 0 || (Number(amountToken0) !== 0 && Number(amountToken0) > Number(selectedTokenAmount0)) ? "border-red-500" : "border_0000000d"}`}
        >
          <div class="flex items-start gap-4">
            <div class="rounded-full w-[46px] h-[46px] overflow-hidden">
              <Image
                logo={formatSelectedProtocol.pairs[0].logo}
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
                value={amountToken0}
                disabled={isLoadingSupplyJettonJettonV2 ||
                  isLoadingSupplyTONJettonV2}
                on:change={async (event) => {
                  if (event?.target?.value) {
                    amountToken0 = event?.target?.value;

                    if (percentToken0) {
                      const amountWithPercent =
                        (percentToken0 * Number(selectedTokenAmount0)) / 100;

                      if (amountWithPercent !== amountToken0) {
                        percentToken0 = 0;
                      }
                    }

                    await getMinUnitAmount(amountToken1, amountToken0);

                    amountToken1 =
                      dataMintAmountInput &&
                      Object.keys(dataMintAmountInput).length !== 0
                        ? dataMintAmountInput?.token_a_min_units /
                          10 ** JETTON_1.decimals
                        : "";
                  } else {
                    amountToken1 = "";
                    amountToken0 = "";
                  }
                }}
              />
              <div class="text-gray-500 text-sm">
                ≈ ${value0?.toFixed(4) || 0}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div
              class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percentToken0 === 25 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
              on:click={async () => {
                if (
                  isLoadingSupplyJettonJettonV2 ||
                  isLoadingSupplyTONJettonV2
                ) {
                  return;
                }

                if (percentToken0 === 25) {
                  percentToken0 = 0;
                  amountToken1 = "";
                  amountToken0 = "";
                } else {
                  percentToken0 = 25;

                  amountToken0 =
                    (percentToken0 * Number(selectedTokenAmount0)) / 100;

                  await getMinUnitAmount(amountToken1, amountToken0);

                  amountToken1 =
                    dataMintAmountInput &&
                    Object.keys(dataMintAmountInput).length !== 0
                      ? dataMintAmountInput?.token_a_min_units /
                        10 ** JETTON_1.decimals
                      : "";
                }
              }}
            >
              25%
            </div>
            <div
              class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percentToken0 === 50 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
              on:click={async () => {
                if (
                  isLoadingSupplyJettonJettonV2 ||
                  isLoadingSupplyTONJettonV2
                ) {
                  return;
                }

                if (percentToken0 === 50) {
                  percentToken0 = 0;
                  amountToken1 = "";
                  amountToken0 = "";
                } else {
                  percentToken0 = 50;

                  amountToken0 =
                    (percentToken0 * Number(selectedTokenAmount0)) / 100;

                  await getMinUnitAmount(amountToken1, amountToken0);

                  amountToken1 =
                    dataMintAmountInput &&
                    Object.keys(dataMintAmountInput).length !== 0
                      ? dataMintAmountInput?.token_a_min_units /
                        10 ** JETTON_1.decimals
                      : "";
                }
              }}
            >
              50%
            </div>
            <div
              class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percentToken0 === 75 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
              on:click={async () => {
                if (
                  isLoadingSupplyJettonJettonV2 ||
                  isLoadingSupplyTONJettonV2
                ) {
                  return;
                }

                if (percentToken0 === 75) {
                  percentToken0 = 0;
                  amountToken1 = "";
                  amountToken0 = "";
                } else {
                  percentToken0 = 75;

                  amountToken0 =
                    (percentToken0 * Number(selectedTokenAmount0)) / 100;

                  await getMinUnitAmount(amountToken1, amountToken0);

                  amountToken1 =
                    dataMintAmountInput &&
                    Object.keys(dataMintAmountInput).length !== 0
                      ? dataMintAmountInput?.token_a_min_units /
                        10 ** JETTON_1.decimals
                      : "";
                }
              }}
            >
              75%
            </div>
            <div
              class={`cursor-pointer text-sm rounded-[10px] p-2 border ${percentToken0 === 100 ? "border-[#1e96fc] text-[#1e96fc]" : "border_0000000d"} ${$isDarkMode ? "text-white" : "text-black"}`}
              on:click={async () => {
                if (
                  isLoadingSupplyJettonJettonV2 ||
                  isLoadingSupplyTONJettonV2
                ) {
                  return;
                }

                if (percentToken0 === 100) {
                  percentToken0 = 0;
                  amountToken1 = "";
                  amountToken0 = "";
                } else {
                  percentToken0 = 100;

                  amountToken0 =
                    (percentToken0 * Number(selectedTokenAmount0)) / 100;

                  await getMinUnitAmount(amountToken1, amountToken0);

                  amountToken1 =
                    dataMintAmountInput &&
                    Object.keys(dataMintAmountInput).length !== 0
                      ? dataMintAmountInput?.token_a_min_units /
                        10 ** JETTON_1.decimals
                      : "";
                }
              }}
            >
              100%
            </div>
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
          <div class="text_00000099 text-sm">
            {$t("Supply TVL")}
          </div>
          <div class="text-sm">
            <TooltipNumber
              number={Number(selectedProtocol?.tvl || 0)}
              type="value"
            />
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div class="text_00000099 text-sm">{$t("Supply APY")}</div>
          <div class="text-sm">
            <TooltipNumber
              number={Number(selectedProtocol?.apy || 0)}
              type="percent"
            />%
          </div>
        </div>
      </div>
    {/if}

    <div class="flex justify-start gap-2">
      {#if !isEnable || (selectedPoolData && Object.keys(selectedPoolData)?.length === 0)}
        {#if (($user && Object.keys($user).length !== 0 ? publicAddress === $wallet : true) || (selectedPoolData && Object.keys(selectedPoolData)?.length === 0)) && $queryValidate?.data && $queryValidate?.data?.type === "TON"}
          <div
            use:tooltip={{
              content: `<tooltip-detail text="${selectedPoolData && Object.keys(selectedPoolData)?.length === 0 && publicAddress === $wallet ? "Missing pool data!" : "Your TON connected wallet is not matches with selected wallet"}" />`,
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
            <Button variant="tertiary" on:click={handleTONAuth}>
              <div class="text-white">Connect TON</div>
            </Button>
          </div>
        {/if}
      {:else}
        <div class="w-[120px]">
          {#if isPoolTONJetton}
            {#if Number(amountToken0) > 0 && Number(amountToken1) > 0 && Number(selectedTokenAmount0) > 0 && Number(selectedTokenAmount1) > 0 && Number(amountToken1) <= Number(selectedTokenAmount1) && Number(amountToken0) <= Number(selectedTokenAmount0)}
              <Button
                variant="tertiary"
                on:click={handleSupplyTONJettonTwoSide}
                isLoading={isLoadingSupplyTONJettonV2}
                disabled={isLoadingSupplyTONJettonV2}
              >
                <div class="text-white">{$t("Supply")}</div>
              </Button>
            {:else}
              <div
                use:tooltip={{
                  content: `<tooltip-detail text="${Number(amountToken1) > Number(selectedTokenAmount1) || Number(amountToken1) < 0 || Number(amountToken0) > Number(selectedTokenAmount0) || Number(amountToken0) < 0 ? "Insuficinet balance!" : "Invalid amount!"}" />`,
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
          {/if}

          {#if !isPoolTONJetton}
            {#if Number(amountToken0) > 0 && Number(amountToken1) > 0 && Number(selectedTokenAmount0) > 0 && Number(selectedTokenAmount1) > 0 && Number(amountToken1) <= Number(selectedTokenAmount1) && Number(amountToken0) <= Number(selectedTokenAmount0)}
              <Button
                variant="tertiary"
                on:click={handleSupplyJettonJettonTwoSide}
                isLoading={isLoadingSupplyJettonJettonV2}
                disabled={isLoadingSupplyJettonJettonV2}
              >
                <div class="text-white">{$t("Supply")}</div>
              </Button>
            {:else}
              <div
                use:tooltip={{
                  content: `<tooltip-detail text="${Number(amountToken1) > Number(selectedTokenAmount1) || Number(amountToken1) < 0 || Number(amountToken0) > Number(selectedTokenAmount0) || Number(amountToken0) < 0 ? "Insuficinet balance!" : "Invalid amount!"}" />`,
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
          {/if}
        </div>
      {/if}
      <div class="w-[120px]">
        <Button
          variant="secondary"
          disabled={isLoadingSupplyJettonJettonV2 || isLoadingSupplyTONJettonV2}
          on:click={() => {
            showStonfiDeFiFarmModal.update((n) => (n = false));
          }}
        >
          {$t("Cancel")}
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
</style>
