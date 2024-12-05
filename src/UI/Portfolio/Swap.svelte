<script lang="ts">
  import mixpanel from "mixpanel-browser";
  import { nimbus } from "~/lib/network";
  import { createQuery } from "@tanstack/svelte-query";
  import { onDestroy } from "svelte";
  import { Address } from "@ton/core";
  import {
    tonConnector,
    selectedTokenDetail,
    isDarkMode,
    typeWallet,
    userPublicAddress,
    wallet,
    chain,
    user,
  } from "~/store";
  import { useQueryClient, QueryCache } from "@tanstack/svelte-query";
  import {
    HiddenUI,
    NimbusSwapWidget,
    type Route,
    type WidgetConfig,
    WidgetEvent,
    widgetEvents,
  } from "nimbus-universal-swap";
  import { triggerBonusScore, triggerToast } from "~/utils/functions";
  import numeral from "numeral";
  import { t } from "~/lib/i18n";
  import { handleValidateAddress } from "~/lib/queryAPI";

  import AppOverlay from "~/components/Overlay.svelte";
  import ReactAdapter from "~/components/ReactAdapter.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";

  const queryCache = new QueryCache();

  enum ChainType {
    EVM = "EVM",
    SVM = "SVM",
    TVM = "TVM",
    MVM = "MVM",
  }

  enum ChainId {
    TON = 2251111081099710,
    MOVE = 3342222192100821,
    SOL = 1151111081099710,
  }

  const queryClient = useQueryClient();

  const triggerFireworkBonus = (score: number) => {
    triggerBonusScore(score, 2000);
  };

  const getTONAddress = (name: string) => {
    return name && Address.parse(name).toRawString();
  };

  const getSwapReward = async () => {
    return await nimbus
      .get(
        `/onchain/rewards?chain=${$typeWallet === "MOVE" ? "SUI" : $typeWallet}`,
      )
      .then((res: any) => res.data);
  };

  const handleFormatBlockChainId = (chain: string) => {
    switch (chain) {
      case "ETH":
        return 1;
      case "ARB":
        return 42161;
      case "OP":
        return 10;
      case "MATIC":
        return 137;
      case "BNB":
        return 56;
      case "ZKSYNC":
        return 324;
      case "BASE":
        return 8453;
      case "AVAX":
        return 43114;
      // case "POLYGON_ZKEVM":
      //   return 1101;
      case "LINEA":
        return 59144;
      // case "XDAI":
      //   return 100;
      case "FANTOM":
        return 250;
      case "MOVR":
        return 1285;
      case "GLMR":
        return 1284;
      // case "AURORA":
      //   return 1313161554;
      case "METIS":
        return 1088;
      default:
        return -1;
    }
  };

  const handleFormatIdBlockChain = (id: number) => {
    switch (id) {
      case 1:
        return "ETH";
      case 42161:
        return "ARB";
      case 10:
        return "OP";
      case 137:
        return "MATIC";
      case 56:
        return "BNB";
      case 324:
        return "ZKSYNC";
      case 8453:
        return "BASE";
      case 43114:
        return "AVAX";
      // case 1101:
      //   return "POLYGON_ZKEVM";
      case 59144:
        return "LINEA";
      // case 100:
      //   return "XDAI";
      case 250:
        return "FANTOM";
      case 1285:
        return "MOVR";
      case 1284:
        return "GLMR";
      // case 1313161554:
      //   return "AURORA";
      case 1088:
        return "METIS";
      case ChainId.SOL:
        return "SOL";
      case ChainId.MOVE:
        return "SUI";
      case ChainId.TON:
        return "TON";
      default:
        return "";
    }
  };

  let swapReward: any = [];
  let isOpenModal = false;

  const forceRefreshHoldingToken = async (
    address: string,
    selectedChain: string,
  ) => {
    try {
      await nimbus.get(
        `/v2/address/${address}/holding?chain=${selectedChain}&force_refresh=${true}`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      );
      if ($chain !== "ALL") {
        queryClient?.invalidateQueries(["token-holding-each-chain"]);
      } else {
        queryClient?.invalidateQueries(["token-holding"]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateBalanceToken = async (data: any) => {
    try {
      const payload = [
        {
          chain: handleFormatIdBlockChain(data.fromChainId),
          owner: $userPublicAddress,
          contract_address: data?.fromAddress || data?.fromToken?.address,
        },
        {
          chain: handleFormatIdBlockChain(data.toChainId),
          owner: $userPublicAddress,
          contract_address: data?.toAddress || data?.toToken?.address,
        },
      ];
      await nimbus.post("/v2/holding-realtime", payload);
    } catch (e) {
      console.error(e);
    }
  };

  $: queryValidate = createQuery({
    queryKey: ["validate", $wallet],
    queryFn: () => handleValidateAddress($wallet),
    retry: false,
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

  const handleSwapBonus = async (data: Route) => {
    const txHash = (data.steps?.[0] as any)?.execution?.process?.[0]?.txHash;
    const volume = Number(data.steps?.[0]?.estimate?.fromAmountUSD || 0);

    mixpanel.track("user_swap_completed", {
      userAddress: $userPublicAddress,
      txHash,
      swapValue: volume,
      from_token_ca: data?.fromAddress || data?.fromToken?.address,
      from_token_chain: data?.fromChainId,
      to_token_ca: data?.toAddress || data?.toToken?.address,
      to_token_chain: data?.toChainId,
    });

    queryCache.clear();
    getSync();
    updateBalanceToken(data);
    forceRefreshHoldingToken($wallet, $selectedTokenDetail?.chain);
    queryClient?.refetchQueries(["token-holding-each-chain"]);
    queryClient?.refetchQueries(["token-holding"]);

    if ($user && Object.keys($user)?.length === 0) {
      return;
    }

    isOpenModal = true;
    try {
      const response: any = await nimbus
        .post(
          `/onchain/${$userPublicAddress}/bonus?chain=${handleFormatIdBlockChain(data?.toChainId)}`,
          {
            volume,
            txHash,
            chain: handleFormatIdBlockChain(data?.toChainId),
            type: "swap",
          },
        )
        .then((res: any) => res.data);

      if (response && response?.message === "Claim bonus successfully") {
        queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);
        queryClient?.invalidateQueries(["rewards-progress"]);
        queryClient?.invalidateQueries(["rewards-status"]);
        triggerFireworkBonus(volume * 5);

        if (response?.data && response?.data?.length !== 0) {
          const formatMsgTokenBonus = response?.data
            ?.map((item: any) => {
              return `${numeral(item?.total).format("0,0.00")} ${item?.symbol}`;
            })
            .join(" and ");

          triggerToast(
            `🎉 ${formatMsgTokenBonus} granted! Check the Rewards section on the homepage.`,
            "success",
          );
        }
      }
    } catch (e: any) {
      triggerToast(
        "Failed when claiming reward. " + e?.response?.data?.error || e.message,
        "fail",
      );
      console.error(e);
    } finally {
      isOpenModal = false;
    }
  };

  $: querySwapReward = createQuery({
    queryKey: ["swap-reward", $selectedTokenDetail, $wallet],
    queryFn: () => getSwapReward(),
    retry: false,
    enabled: Boolean($user && Object.keys($user)?.length !== 0),
  });

  $: {
    if (!$querySwapReward.isError && $querySwapReward.data !== undefined) {
      swapReward = $querySwapReward?.data?.map((item: any) => {
        if (item.type === "GM_POINT") {
          return {
            ...item,
            symbol: "GM POINT",
          };
        }
        return item;
      });
    }
  }

  let widgetConfig: WidgetConfig = {
    appearance: $isDarkMode ? "dark" : "light",
    theme: {
      palette: {
        background: {
          default: $isDarkMode ? "#0f0f0f" : "#fff",
        },
        primary: {
          main: "#1e96fc",
        },
      },
      typography: {
        fontFamily: "Golos Text",
      },
      container: {
        height: "85vh",
        minWidth: "100%",
        padding: "0",
      },
    },
    integrator: "Nimbus",
    hiddenUI: [
      HiddenUI.ToAddress,
      HiddenUI.Language,
      HiddenUI.Appearance,
      HiddenUI.History,
    ],
    commissionBps: {
      [ChainId.MOVE]: 0,
    },
    commissionBpsSDK: {
      [ChainId.MOVE]: 0,
    },
    brandingLogo: "https://getnimbus.io/nimbusFavicon.svg",
    variant: "compact",
    subvariant: "split",
    subvariantOptions: {
      split: "swap",
    },
    hiddenBtnChartCandles: true,
    isUniversalSwap: false,
    mixpanelToken: "d56364b743cd70634fe5bea51e1d7e1c",
  };

  $: {
    if ($selectedTokenDetail) {
      if ($typeWallet === "TON") {
        widgetConfig = {
          ...widgetConfig,
          chains: {
            types: {
              allow: [ChainType.TVM],
              deny: [ChainType.EVM, ChainType.SVM, ChainType.MVM],
            },
          },
          tonConnectUI: $tonConnector!,
          fromChain: ChainId.TON,
          fromToken:
            $selectedTokenDetail?.contractAddress === "TONCOIN"
              ? "0:0000000000000000000000000000000000000000000000000000000000000000"
              : getTONAddress($selectedTokenDetail?.contractAddress),
        };
      }
      if (["MOVE", "SUI"].includes($typeWallet)) {
        widgetConfig = {
          ...widgetConfig,
          chains: {
            types: {
              allow: [ChainType.MVM],
              deny: [ChainType.EVM, ChainType.SVM, ChainType.TVM],
            },
          },
          fromChain: ChainId.MOVE,
          fromToken: $selectedTokenDetail?.contractAddress,
        };
      }
      if ($typeWallet === "EVM") {
        widgetConfig = {
          ...widgetConfig,
          chains: {
            types: {
              allow: [ChainType.EVM],
              deny: [ChainType.TVM, ChainType.SVM, ChainType.MVM],
            },
          },
          fromChain: handleFormatBlockChainId($selectedTokenDetail?.chain),
          fromToken: $selectedTokenDetail?.contractAddress,
          toChain: handleFormatBlockChainId($selectedTokenDetail?.chain),
        };
      }
      if (["ECLIPSE", "SOL"].includes($typeWallet)) {
        widgetConfig = {
          ...widgetConfig,
          chains: {
            types: {
              allow: [ChainType.SVM],
              deny: [ChainType.EVM, ChainType.TVM, ChainType.MVM],
            },
          },
          sdkConfig: {
            rpcUrls: {
              [ChainId.SOL]: [
                "https://rpc-aggregator.service.getnimbus.xyz/solana_das?key=28ad52be-5b89-4c0a-8ce9-e053c053466b",
              ],
            },
          },
          fromChain: ChainId.SOL,
          fromToken: $selectedTokenDetail?.contractAddress,
        };
      }
    }
  }

  onDestroy(() => {
    widgetEvents.off(WidgetEvent.RouteExecutionCompleted);
  });
</script>

{#if $user && Object.keys($user)?.length !== 0 && $querySwapReward?.isLoading}
  <div class="flex items-center justify-center">
    <LoadingPremium />
  </div>
{:else}
  <ReactAdapter
    element={NimbusSwapWidget}
    integrator="nimbus-swap"
    config={{
      ...widgetConfig,
      rewardSwapData: swapReward || [],
      handleSwapBonus,
    }}
  />
{/if}

<!-- Modal loading bonus swap -->
<AppOverlay
  clickOutSideToClose
  isOpen={isOpenModal}
  isShowClose={false}
  on:close={() => {
    isOpenModal = false;
  }}
>
  <div class="flex flex-col items-center gap-4">
    <div class="flex justify-center items-center h-[68px]">
      <LoadingPremium />
    </div>
    <div class="text-sm text-gray-500 text-center">
      {$t("Please wait while we process and this may take a moment.")}<br />
      {$t("Thank you for your patience!")}
    </div>
  </div>
</AppOverlay>

<style></style>
