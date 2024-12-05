<script lang="ts">
  import { retry } from "~/utils/functions";
  import { nimbus } from "~/lib/network";
  import mixpanel from "mixpanel-browser";
  import {
    tonConnector,
    wallet,
    userPublicAddress,
    isDarkMode,
    chain,
  } from "~/store";
  import { TonClient, Address, Cell, beginCell, storeMessage } from "@ton/ton";
  import { DEX } from "../../../../node_modules/@ston-fi/sdk";
  import { StonApiClient } from "@ston-fi/api";
  import {
    createQuery,
    useQueryClient,
    QueryCache,
  } from "@tanstack/svelte-query";
  import { handleValidateAddress } from "~/lib/queryAPI";
  import tooltip from "~/lib/tooltip";
  import { formatUnits } from "viem";
  import { t } from "~/lib/i18n";

  import Button from "~/components/Button.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Image from "~/components/Image.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let handleShowStatusModal = (data) => {};
  export let selectedPosition;

  const queryCache = new QueryCache();
  const queryClient = useQueryClient();

  const stonApi = new StonApiClient({});

  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: "40a68ff3af6b3ec4d7e4bda8cc7aeeb345f0d8b4e7892eb7dfc191a0ba0665ce",
  });

  const handleCalculateValue = (data: any) => {
    const totalInputValue =
      data?.current?.tokens?.reduce(
        (prev: any, item: any) => prev + Number(item.value),
        0,
      ) || 0;
    const totalYieldCollected =
      data?.current?.yield?.reduce(
        (prev: any, item: any) => prev + Number(item.value),
        0,
      ) || 0;

    return totalInputValue + totalYieldCollected;
  };

  let publicAddress = $tonConnector?.connected
    ? Address.parse($tonConnector?.account.address).toString({
        urlSafe: true,
        bounceable: true,
      })
    : $userPublicAddress;

  let percent = 0;
  let amount: any = "";

  let availableWithdraw = 0;
  let suppliedCoinSymbol = "";

  $: queryValidate = createQuery({
    queryKey: ["validate", publicAddress],
    queryFn: () => handleValidateAddress(publicAddress),
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
        }
      });
    }
  };

  let selectedProtocolRouter: any = {};
  let pool: any = {};

  $: {
    if (selectedPosition && Object.keys(selectedPosition).length !== 0) {
      suppliedCoinSymbol =
        selectedPosition.input[1].token.symbol +
        "-" +
        selectedPosition.input[0].token.symbol;
    }
  }

  $: {
    if (
      $tonConnector &&
      $tonConnector?.connected &&
      publicAddress === $wallet &&
      selectedPosition &&
      Object.keys(selectedPosition).length !== 0
    ) {
      handleGetDataSupplied();
    }
  }

  $: {
    if (percent) {
      amount =
        percent === 100
          ? Number(availableWithdraw)
          : (percent * Number(availableWithdraw)) / 100;
    }
  }

  let isLoadingSubmit = false;
  let isLoadingGetDataSupplied = false;

  const valueConvert = (input: any, decimals = 18) => {
    try {
      if (!input) {
        return "0";
      }
      if (!decimals) {
        return input?.toString();
      }

      if (typeof input === "bigint") {
        return formatUnits(input, decimals);
      }
      return formatUnits(BigInt(Math.trunc(input)), decimals);
    } catch (error) {
      return Number(input)?.toString();
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

  $: isPoolTONJetton = suppliedCoinSymbol?.startsWith("TON-");

  const handleGetDataSupplied = async () => {
    try {
      isLoadingGetDataSupplied = true;
      const protocolInfo = await stonApi.getPool(selectedPosition?.positionId);

      const router = await stonApi.getRouter(protocolInfo?.routerAddress);

      if (router.address && router.ptonMasterAddress) {
        selectedProtocolRouter = router;

        const routerContract =
          selectedPosition.meta.version === 2
            ? client.open(DEX.v2_2.Router.create(router.address))
            : client.open(new DEX.v1.Router(router.address));

        const poolInfo = isPoolTONJetton
          ? {
              token0: selectedPosition.current.tokens[0].token.contract_address,
              token1: router.ptonMasterAddress,
            }
          : {
              token0: selectedPosition.current.tokens[0].token.contract_address,
              token1: selectedPosition.current.tokens[1].token.contract_address,
            };

        pool = client.open(await routerContract.getPool(poolInfo));

        const lpWallet = client.open(
          await pool.getJettonWallet({
            ownerAddress: publicAddress,
          }),
        );

        const lpWalletData = await lpWallet.getWalletData();

        availableWithdraw = Number(valueConvert(lpWalletData.balance, 9));
      }
    } catch (e) {
      console.error(e);
    } finally {
      isLoadingGetDataSupplied = false;
    }
  };

  const handleWithdraw = async () => {
    try {
      if (
        selectedProtocolRouter &&
        Object.keys(selectedProtocolRouter).length !== 0 &&
        pool &&
        Object.keys(pool).length !== 0
      ) {
        isLoadingSubmit = true;

        const formatAmount =
          amount !== 0 &&
          BigInt(Math.floor(parseFloat(amount?.toString()) * 1e9));

        const paramsBurn =
          selectedPosition.meta.version === 2
            ? {
                amount: formatAmount,
                userWalletAddress: publicAddress,
                queryId: 12345,
              }
            : {
                amount: formatAmount,
                responseAddress: publicAddress,
                queryId: 12345,
              };

        const txParams = await pool?.getBurnTxParams(paramsBurn);

        if (txParams !== undefined) {
          const result = await $tonConnector.sendTransaction({
            validUntil: Date.now() + 1000000,
            messages: [
              {
                address: txParams.to?.toString(),
                amount: txParams.value?.toString(),
                payload: txParams.body?.toBoc().toString("base64"),
              },
            ],
          });

          const trxHash = await getTxByBOC(result.boc, publicAddress);

          if (trxHash) {
            availableWithdraw = availableWithdraw - amount;
            percent = 0;
            amount = "";

            queryCache.clear();
            getSync();
            forceRefreshHoldingToken(publicAddress, $chain);
            forceRefreshPosition(publicAddress);
            handleGetDataSupplied();

            queryClient?.refetchQueries(["position-list", $wallet]);
            queryClient?.refetchQueries(["positions"]);
            queryClient?.refetchQueries(["position-history"]);
            queryClient?.refetchQueries(["token-holding-each-chain"]);
            queryClient?.refetchQueries(["token-holding"]);

            handleShowStatusModal({
              status: "success",
              tx: trxHash,
              type: "Withdraw",
            });

            mixpanel.track(`user_Withdraw_${selectedPosition?.type}_Stonfi`, {
              address: publicAddress,
              tx: trxHash,
              amount: Number(amount),
              value: handleCalculateValue(selectedPosition),
            });
          } else {
            mixpanel.track("user_Withdraw_Stonfi_fail", {
              res: result,
            });
            handleShowStatusModal({
              status: "fail",
              type: "Withdraw",
            });
          }
        } else {
          mixpanel.track("user_Withdraw_Stonfi_fail", {
            res: result,
          });
          handleShowStatusModal({
            status: "fail",
            type: "Withdraw",
          });
        }
      }
    } catch (e) {
      console.error(e);
      mixpanel.track("user_Withdraw_Stonfi_fail", {
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

  $: isEnable = Boolean(
    $tonConnector &&
      $tonConnector?.connected &&
      publicAddress === $wallet &&
      $queryValidate?.data &&
      $queryValidate?.data?.type === "TON" &&
      !isLoadingGetDataSupplied,
  );
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
      class={`flex flex-col gap-3 border p-4 rounded-[10px] ${(Number(amount) !== 0 && Number(amount) > Number(availableWithdraw)) || Number(amount) < 0 ? "border-red-500" : "border_0000000d"}`}
    >
      <div class="flex items-center gap-4">
        {#if selectedPosition && Object.keys(selectedPosition).length !== 0}
          <div class="w-[46px] h-[46px] relative">
            {#each selectedPosition?.input as item, index}
              <div
                class={`rounded-full w-[33px] h-[33px] overflow-hidden border ${index === 1 ? "absolute bottom-0 right-0" : ""}`}
              >
                <Image logo={item?.token?.logo} defaultLogo={defaultToken} />
              </div>
            {/each}
          </div>
        {/if}

        <div class="flex-1">
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
                  (percent * Number(availableWithdraw)) / 100;

                if (amountWithPercent !== amount) {
                  percent = 0;
                }
              }
            }}
          />
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

  <div class="flex justify-start gap-2">
    {#if !isEnable}
      {#if publicAddress !== $wallet && $queryValidate?.data && $queryValidate?.data?.type === "MOVE"}
        <div
          use:tooltip={{
            content: `<tooltip-detail text="Your TON connected wallet is not matches with selected wallet" />`,
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
          <Button variant="tertiary" on:click={handleTONAuth}>
            <div class="text-white">Connect TON</div>
          </Button>
        </div>
      {/if}
    {:else}
      <div class="w-[120px]">
        {#if Number(amount) <= Number(availableWithdraw) && Number(amount) > 0}
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
              content: `<tooltip-detail text=${Number(amount) !== 0 && Number(amount) > Number(availableWithdraw) ? "Invalid amount!" : "Amount not available"} />`,
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

<style></style>
