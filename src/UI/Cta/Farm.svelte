<script lang="ts">
  import { isDarkMode, detectParams, wallet, typeWallet } from "~/store";
  import { useNavigate } from "svelte-navigator";
  import { chainList, chainMoveList, chainSolList } from "~/lib/chains";
  import { createQueries, createQuery } from "@tanstack/svelte-query";
  import { getHoldingToken, handleValidateAddress } from "~/lib/queryAPI";
  import { flatten } from "lodash";
  import { nimbus } from "~/lib/network";
  import { t } from "~/lib/i18n";

  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Button from "~/components/Button.svelte";

  const navigate = useNavigate();

  let dataVaults: any = [];
  let holdingTokenData: any = [];
  let profit = 0;

  const handleFormatCaNativeToken = (ca: string) => {
    let contractAddress = ca;

    switch (ca) {
      case "TONCOIN":
        contractAddress = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
        break;
      case "0x2::sui::SUI":
        contractAddress =
          "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI";
        break;
      default:
        contractAddress = ca;
        break;
    }

    return contractAddress;
  };

  $: chainListQueries =
    $typeWallet?.length !== 0 && $typeWallet === "EVM"
      ? chainList.slice(1)?.map((item) => item.value)
      : $typeWallet?.length !== 0 && ["MOVE", "SUI"].includes($typeWallet)
        ? chainMoveList.slice(1)?.map((item) => item.value)
        : $typeWallet?.length !== 0 && ["ECLIPSE", "SOL"].includes($typeWallet)
          ? chainSolList.slice(1)?.map((item) => item.value)
          : [chainSolList[0]?.value];

  $: queryValidate = createQuery({
    queryKey: ["validate", $wallet],
    queryFn: () => handleValidateAddress($wallet),
    retry: false,
    enabled: Boolean($wallet && $wallet?.length !== 0),
  });

  $: queryAllTokenHolding = createQueries(
    chainListQueries?.map((item: any) => {
      return {
        queryKey: ["token-holding", $wallet, "ALL", item],
        queryFn: () => getHoldingToken($wallet, item, $queryValidate.data),
        enabled: Boolean(
          $wallet && $wallet?.length !== 0 && !$queryValidate.isFetching,
        ),
      };
    }),
  );

  $: {
    if ($queryAllTokenHolding.length !== 0) {
      const allTokens =
        flatten(
          $queryAllTokenHolding
            ?.filter((item) => Array.isArray(item.data))
            ?.map((item) => item.data),
        ) || [];
      if (allTokens && allTokens.length !== 0) {
        formatDataHoldingToken(allTokens);
      }
    }
  }

  const formatDataHoldingToken = (data: any) => {
    try {
      holdingTokenData = data
        ?.filter((item: any) => Number(item?.amount) !== 0)
        ?.map((item: any) => {
          return {
            ...item,
            market_price: item?.price?.price || 0,
            value: Number(item?.amount || 0) * Number(item?.price?.price),
            contractAddress: handleFormatCaNativeToken(item.contractAddress),
          };
        })
        ?.filter((item: any) => Number(item.value) > 10)
        ?.sort((a: any, b: any) => {
          if (a.value < b.value) {
            return 1;
          }
          if (a.value > b.value) {
            return -1;
          }
          return 0;
        });
    } catch (e) {
      console.error(e);
    }
  };

  const handleGetVaults = async (chain: string, orderBy: string) => {
    const orderKey = orderBy.split(":")[0];
    const orderType = orderBy.split(":")[1];

    let params: any = {
      chain: chain === "MOVE" ? "SUI" : chain,
      order: orderKey,
      sort: orderType,
    };

    const response = await nimbus
      .get(`/v2/farming/vaults`, {
        params,
      })
      .then((res: any) => res.data);
    return response;
  };

  $: queryListVaults = createQuery({
    queryKey: ["query-list-vaults", $typeWallet],
    queryFn: () => handleGetVaults($typeWallet, "apy:desc"),
    retry: false,
    enabled: Boolean($typeWallet && $typeWallet?.length !== 0),
  });

  $: {
    if (
      !$queryListVaults.isError &&
      $queryListVaults.data !== undefined &&
      $queryListVaults.data.length !== 0
    ) {
      dataVaults =
        $typeWallet === "TON"
          ? $queryListVaults.data.filter((item: any) => {
              if (item.protocol === "STON.fi" && item.rewards.version === 2) {
                return item;
              }
              if (item.protocol !== "STON.fi") {
                return item;
              }
            })
          : $queryListVaults.data;
    } else {
      dataVaults = [];
    }
  }

  $: {
    if (
      dataVaults &&
      dataVaults.length !== 0 &&
      holdingTokenData &&
      holdingTokenData.length !== 0
    ) {
      const formatHoldingTokenData = holdingTokenData
        ?.map((item: any) => {
          const listVaults = dataVaults.filter(
            (vault: any) =>
              vault.coins.includes(item.contractAddress) &&
              Number(vault.tvl) > 1000,
          );

          return {
            ...item,
            vault:
              listVaults.length !== 0
                ? listVaults.reduce(
                    (prev: any, current: any) => {
                      return prev.apy > current.apy ? prev : current;
                    },
                    { apy: 0 },
                  )
                : {
                    apy: 0,
                  },
          };
        })
        ?.map((item: any) => {
          return {
            ...item,
            profitBaseOnVault: Number(item.value) * Number(item.vault.apy),
          };
        });

      const totalNetworth = (formatHoldingTokenData || [])?.reduce(
        (prev: any, item: any) => prev + item.value,
        0,
      );

      const totalProfitBaseOnVault = (formatHoldingTokenData || [])?.reduce(
        (prev: any, item: any) => prev + item.profitBaseOnVault,
        0,
      );

      profit = (totalProfitBaseOnVault / totalNetworth) * 100;
    }
  }
</script>

<div
  class={`border px-6 py-7 rounded-[20px] flex md:flex-row md:items-center items-start flex-col justify-between md:gap-10 gap-6 ${
    $isDarkMode
      ? "bg-[#444444] border-[#5a5a5a]"
      : "bg-[#F8F9FF] border-[#f0f2fb]"
  }`}
>
  <div class="lg:text-xl md:text-lg text-xl font-medium">
    {#if profit > 0}
      <span class="text_00000099">{$t("Earn with your token up to")}</span>
      <TooltipNumber number={profit} type="percent" />%/{$t("month")} 🚀
    {:else}
      <span>{$t("Explore yield farming opportunities")}</span>
    {/if}
  </div>
  <div class="w-max min-w-[140px]">
    <Button
      on:click={() => {
        navigate("/yields");
        detectParams.update((n) => (n = "/yields"));
      }}
    >
      {#if profit > 0}
        {$t("Farm now!")}
      {:else}
        {$t("Explore")}
      {/if}
    </Button>
  </div>
</div>

<style></style>
