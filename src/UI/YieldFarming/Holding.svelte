<script lang="ts">
  import { nimbus } from "~/lib/network";
  import { onMount } from "svelte";
  import { createQuery } from "@tanstack/svelte-query";
  import { detectedGeneration } from "~/lib/chains";
  import {
    getHoldingToken,
    getListAddress,
    handleValidateAddress,
  } from "~/lib/queryAPI";
  import { Address } from "@ton/ton";
  import type { WalletState } from "nimbus-sui-kit";
  import {
    isDarkMode,
    user,
    tonConnector,
    suiWalletInstance,
    wallet,
    typeWallet,
  } from "~/store";
  import {
    getChangePercent,
    shorterAddress,
    shorterName,
    wait,
  } from "~/utils/index";
  import { t } from "~/lib/i18n";
  import tooltip from "~/lib/tooltip";
  import { isNimbusVersion } from "~/utils/constants";
  import dayjs from "dayjs";
  import { triggerClickOutside } from "~/utils/functions";
  import { debounce } from "lodash";

  import Image from "~/components/Image.svelte";
  import Tooltip from "~/components/Tooltip.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";

  import defaultToken from "~/assets/defaultToken.png";
  import SUI from "~/assets/chains/sui.png";
  import Ton from "~/assets/chains/ton.png";

  export let selectedChain;
  export let handleSelectedToken;
  export let handleSelectedAddress;
  export let selectedToken;
  export let handleGetHoldingTokenData;

  let searchValue = "";
  let holdingTokenData: any = [];
  let selectedItemIndex = -1;
  let isShowTooltipName = false;
  let isShowTooltipSymbol = false;
  let isShowCMC = false;
  let isShowCoingecko = false;

  let showPopover = false;
  let selectedAddress = "";
  let listAddress: any = [];
  let filteredListAddress: any = [];

  let selectedTokenList: any = [];

  let dataVaults: any = [];

  const handleQueryListToken = async (chain: string, search: string) => {
    return await nimbus
      .get(`/onchain/coins?chain=${chain}&filterSpam=${false}&q=${search}`)
      .then((res: any) => res?.data);
  };

  const handleGetVaults = async (chain: string) => {
    let params: any = {
      chain,
    };

    const response = await nimbus
      .get(`/v2/farming/vaults`, {
        params,
      })
      .then((res: any) => res.data);
    return response;
  };

  $: queryListVaults = createQuery({
    queryKey: ["query-list-vaults", selectedChain],
    queryFn: () => handleGetVaults(selectedChain),
    retry: false,
    enabled: Boolean(selectedChain && selectedChain?.length !== 0),
  });

  $: {
    if (
      !$queryListVaults.isError &&
      $queryListVaults.data !== undefined &&
      $queryListVaults.data.length !== 0
    ) {
      dataVaults =
        selectedChain === "TON"
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

  $: queryListToken = createQuery({
    queryKey: ["query-list-token-by-chain", selectedChain, searchValue],
    queryFn: () => handleQueryListToken(selectedChain, searchValue),
    retry: false,
    enabled: Boolean(selectedChain && selectedChain?.length !== 0),
  });

  $: {
    if (!$queryListToken.isError && $queryListToken.data !== undefined) {
      selectedTokenList = $queryListToken.data;
    }
  }

  $: formatSelectedTokenList = (selectedTokenList || [])?.map((item: any) => {
    if (selectedChain === "TON") {
      return {
        ...item,
        address:
          item.symbol === "USDT"
            ? "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
            : item.address,
      };
    }

    return item;
  });

  const handleCheckWithinLast24Hours = (data: any) => {
    return dayjs().diff(dayjs(data?.last_transferred_at), "hour");
  };

  const handleCalculateValue = (data: any, price: any) => {
    return Number(data?.amount) * Number(price);
  };

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const addressParams = urlParams.get("address");

    if (addressParams) {
      selectedAddress = addressParams;
    }
  });

  $: {
    if (
      selectedChain &&
      selectedChain.length !== 0 &&
      selectedAddress &&
      selectedAddress.length !== 0
    ) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname +
          `?address=${selectedAddress}&chain=${selectedChain}`,
      );
    }
  }

  $: {
    $tonConnector?.onStatusChange((wallet) => {
      if (wallet && $user && Object.keys($user).length === 0) {
        const parserAddress = Address.parse(wallet?.account?.address).toString({
          urlSafe: true,
          bounceable: true,
        });

        selectedAddress = parserAddress;
      }
    });
  }

  $: {
    if ($user && Object.keys($user)?.length === 0) {
      if (selectedChain === "TON") {
        if ($tonConnector?.connected) {
          selectedAddress = Address.parse(
            $tonConnector?.account.address,
          ).toString({
            urlSafe: true,
            bounceable: true,
          });
        } else {
          selectedAddress = "";
        }
      }
      if (selectedChain === "SUI") {
        if (
          ($suiWalletInstance as WalletState) &&
          ($suiWalletInstance as WalletState)?.connected
        ) {
          selectedAddress =
            ($suiWalletInstance as WalletState)?.account?.address || "";
        } else {
          selectedAddress = "";
        }
      }
    } else {
    }
  }

  const formatDataListAddress = async (data: any) => {
    listAddress = data
      ?.map((item: any) => {
        return {
          id: item.id,
          type: item.type,
          label: item.label,
          value: item.accountId,
          logo: detectedGeneration(item.type),
        };
      })
      ?.filter((item: any) => item.type !== "BUNDLE");

    await wait(200);
    if (
      selectedAddress.length === 0 &&
      listAddress &&
      listAddress.length !== 0
    ) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname +
          `?address=${listAddress[0].value}&chain=${selectedChain}`,
      );

      if ($typeWallet !== "BUNDLE") {
        if (filteredListAddress.length !== 0) {
          if (selectedChain === "TON") {
            selectedAddress = filteredListAddress[0].value;
          }
          if (selectedChain === "SUI") {
            selectedAddress = filteredListAddress[0].value;
          }
        } else {
          selectedAddress = $wallet;
        }
      } else {
        selectedAddress = "";
      }
    }
  };

  // query list address
  $: query = createQuery({
    queryKey: ["list-address"],
    queryFn: () => getListAddress(),
    enabled: Boolean($user && Object.keys($user)?.length !== 0),
  });

  $: {
    if (
      !$query.isError &&
      $query.data !== undefined &&
      $query.data.length !== 0
    ) {
      formatDataListAddress($query.data);
    }
  }

  $: formatSelectedWalletInfoType =
    selectedWalletInfo?.type === "MOVE" ? "SUI" : selectedWalletInfo?.type;

  $: queryValidate = createQuery({
    queryKey: ["validate", selectedAddress, selectedChain, selectedWalletInfo],
    queryFn: () => handleValidateAddress(selectedAddress),
    retry: false,
    enabled: Boolean(
      selectedAddress &&
        selectedAddress?.length !== 0 &&
        selectedChain === formatSelectedWalletInfoType,
    ),
  });

  $: queryTokenHolding = createQuery({
    queryKey: [
      "token-holding-each-chain",
      selectedChain,
      selectedAddress,
      selectedWalletInfo,
    ],
    queryFn: () =>
      getHoldingToken(selectedAddress, selectedChain, $queryValidate.data),
    enabled: Boolean(
      selectedChain &&
        selectedChain?.length !== 0 &&
        selectedAddress &&
        selectedAddress?.length !== 0 &&
        !$queryValidate.isFetching &&
        selectedChain === formatSelectedWalletInfoType,
    ),
  });

  $: {
    if (!$queryTokenHolding.isError && $queryTokenHolding.data !== undefined) {
      formatDataHoldingToken($queryTokenHolding.data);
    } else {
      formatDataHoldingToken([]);
    }
  }

  const formatDataHoldingToken = (data: any) => {
    holdingTokenData = data
      ?.filter((item: any) => Number(item?.amount) !== 0)
      ?.map((item: any) => {
        return {
          ...item,
          market_price: item?.price?.price || 0,
          value: Number(item?.amount) * Number(item?.price?.price),
          percent_24h_price_change:
            item?.last_24h_price && item?.last_24h_price?.price !== 0
              ? getChangePercent(
                  Number(item?.price?.price),
                  Number(item?.last_24h_price?.price),
                )
              : null,
        };
      })
      ?.sort((a: any, b: any) => {
        if (a.value < b.value) {
          return 1;
        }
        if (a.value > b.value) {
          return -1;
        }
        return 0;
      });
    handleGetHoldingTokenData(holdingTokenData);
  };

  $: isLoading = $queryTokenHolding.isFetching || $queryListToken.isFetching;

  $: selectedWalletInfo =
    $user && Object.keys($user)?.length !== 0
      ? selectedAddress &&
        listAddress &&
        listAddress.find((item: any) => item.value === selectedAddress)
        ? listAddress.find((item: any) => item.value === selectedAddress)
        : {
            type: selectedChain,
            value: selectedAddress
              ? selectedAddress
              : filteredListAddress.length !== 0
                ? filteredListAddress[0].value
                : listAddress.length !== 0
                  ? listAddress[0].value
                  : $wallet,
          }
      : {
          type: selectedChain,
          value: selectedAddress
            ? selectedAddress
            : filteredListAddress.length !== 0
              ? filteredListAddress[0].value
              : listAddress.length !== 0
                ? listAddress[0].value
                : $wallet,
        };

  let formatDataHolding: any = [];

  $: {
    if (selectedWalletInfo || selectedChain) {
      if (selectedChain === formatSelectedWalletInfoType) {
        formatDataHolding = formatSelectedTokenList
          .map((item: any) => {
            const selectedItem = holdingTokenData.find((eachHolding: any) => {
              return selectedChain === "TON"
                ? eachHolding?.contractAddress === item?.address ||
                    (eachHolding?.symbol === item?.symbol &&
                      eachHolding?.name === item?.name)
                : eachHolding?.contractAddress === item?.address;
            });

            if (selectedItem) {
              return {
                ...selectedItem,
                logoURI: item?.logoURI,
                isVerified: item.isVerified,
              };
            }

            return {
              ...item,
              value: null,
              logoURI: item?.logoURI,
              isVerified: item.isVerified,
            };
          })
          ?.sort((a, b) => b.isVerified - a.isVerified)
          ?.sort((a, b) => b.value - a.value);
      } else {
        formatDataHolding = formatSelectedTokenList
          .map((item: any) => {
            return {
              ...item,
              value: null,
              logoURI: item?.logoURI,
              isVerified: item.isVerified,
            };
          })
          ?.sort((a, b) => b.isVerified - a.isVerified);
      }
    }
  }

  const handleCheckVault = (data: any) => {
    if (data && data?.length !== 0) {
      return data?.reduce(
        (maxObject: any, currentObject: any) => {
          return currentObject.apy > maxObject.apy ? currentObject : maxObject;
        },
        { apy: -Infinity },
      );
    }
    return undefined;
  };

  $: formatDataTokenHoldingWithVault =
    dataVaults && dataVaults.length !== 0
      ? formatDataHolding?.map((item: any) => {
          try {
            const regex = new RegExp(
              `(^|\b)(${item?.symbol}-.+|.+-${item?.symbol})($|\b)`,
            );

            const regex2 = new RegExp(
              `(^|\b)(${item?.name}-.+|.+-${item?.name})($|\b)`,
            );

            const regex3 = new RegExp(
              `(^|\b)(${item?.symbol.toUpperCase()}-.+|.+-${item?.name.toUpperCase()})($|\b)`,
            );

            const filteredVaults = dataVaults?.filter(
              (data: any) =>
                data.name.match(regex) ||
                data.name.match(regex2) ||
                data.name.match(regex3) ||
                data.name === item?.symbol,
            );

            if (filteredVaults.length !== 0) {
              return {
                ...item,
                apy: handleCheckVault(filteredVaults),
              };
            }

            return {
              ...item,
              apy: undefined,
            };
          } catch (error) {
            return {
              ...item,
              apy: undefined,
            };
          }
        })
      : formatDataHolding;

  $: {
    if (selectedAddress) {
      handleSelectedAddress({
        ...selectedWalletInfo,
        type:
          selectedWalletInfo?.type === "MOVE"
            ? "SUI"
            : selectedWalletInfo?.type,
      });
    }
  }

  $: {
    if (selectedChain) {
      if (listAddress.length !== 0) {
        if (selectedChain === "TON") {
          filteredListAddress = listAddress.filter(
            (item: any) => item.type === "TON",
          );
          if (filteredListAddress.length !== 0) {
            selectedAddress = filteredListAddress[0].value;
          } else {
            selectedAddress = listAddress[0].value;
          }
        }
        if (selectedChain === "SUI") {
          filteredListAddress = listAddress.filter(
            (item: any) => item.type === "MOVE",
          );
          if (filteredListAddress.length !== 0) {
            selectedAddress = filteredListAddress[0].value;
          } else {
            selectedAddress = listAddress[0].value;
          }
        }
      }
    }
  }
</script>

<div class="flex flex-col gap-4 col-span-1 xl:h-[80vh] h-[40vh]">
  {#if $user && Object.keys($user).length !== 0}
    <div class="relative">
      <div
        class="button"
        on:click={() => {
          showPopover = true;
        }}
      >
        <div
          class="text-base font-medium flex items-center justify-between gap-5 w-full"
        >
          <div class="flex items-center gap-2 flex-1">
            {#if selectedWalletInfo.logo}
              <img
                src={selectedWalletInfo?.logo}
                alt=""
                class="w-5 h-5 rounded-full"
              />
            {/if}

            {#if !selectedWalletInfo.logo}
              {#if selectedWalletInfo.type === "SUI"}
                <img src={SUI} alt="" class="w-5 h-5 rounded-full" />
              {/if}
              {#if selectedWalletInfo.type === "TON"}
                <img src={Ton} alt="" class="w-5 h-5 rounded-full" />
              {/if}
            {/if}

            <div class="text-sm font-medium">
              {selectedWalletInfo?.label ||
                shorterAddress(selectedWalletInfo?.value)}
            </div>
          </div>

          <div
            class="transform rotate-180 w-3 h-3"
            class:rotate-0={showPopover}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 8.36365L6 4.00001L2 8.36365"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {#if showPopover}
        <div
          class="select_content mt-2 absolute right-0 z-8 flex flex-col p-2 text-sm transform rounded-lg top-9 w-full xl:max-h-[310px] max-h-[380px]"
          style="box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.15); overflow-y: overlay;"
          use:triggerClickOutside
          on:click_outside={() => {
            showPopover = false;
          }}
        >
          {#if filteredListAddress.length !== 0}
            {#each filteredListAddress as item}
              <div
                class={`cursor-pointer p-2 rounded-lg ${
                  $isDarkMode
                    ? selectedAddress === item.value
                      ? "bg-[#000] text-[#1e96fc]"
                      : "hover:bg-[#000]"
                    : selectedAddress === item.value
                      ? "bg-gray-100 text-[#1e96fc]"
                      : "hover:bg-gray-100"
                }`}
                on:click={() => {
                  window.history.replaceState(
                    null,
                    "",
                    window.location.pathname +
                      `?address=${item.value}&chain=${selectedChain}`,
                  );
                  selectedAddress = item.value;
                  showPopover = false;
                }}
              >
                <div class="flex items-center gap-3">
                  <img src={item.logo} alt="" class="w-7 h-7 rounded-full" />
                  <div class="flex flex-col">
                    <div class="text-xs font-medium text_00000099">
                      {item.label}
                    </div>
                    <div class="text-sm">
                      {shorterAddress(item?.value)}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          {:else}
            <div
              class="flex justify-center items-center min-h-[200px] py-4 px-3 text-base text-gray-400"
            >
              Empty
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <div
    class={`border border_0000001a focus:outline-none w-full py-[6px] px-3 rounded-lg ${
      searchValue && !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
    }`}
  >
    <input
      bind:value={searchValue}
      on:change={(event) => {
        debounce(() => {
          searchValue = event?.target?.value;
        }, 1000);
      }}
      placeholder={$t("Filter by token symbol. Eg: SUI, TON,...")}
      type="text"
      class={`w-full p-0 border-none focus:outline-none focus:ring-0 text-sm font-normal ${
        searchValue && !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
      } ${$isDarkMode ? "text-white" : "text-[#5E656B] placeholder-[#5E656B]"}`}
    />
  </div>

  <div class="overflow-hidden h-full flex-1">
    <div
      class={`border border_0000001a w-full h-full rounded-[10px] overflow-y-auto ${
        $isDarkMode ? "bg-[#222222]" : "bg-[#fff]"
      }`}
    >
      <div class="grid grid-cols-3 sticky top-0 left-0 z-2">
        <div class="col-spans-2 pl-3 py-3 bg_f4f5f8 h-max">
          <div class="text-left text-xs uppercase font-medium">
            {$t("Assets")}
          </div>
        </div>

        <div class="col-spans-1 py-3 pr-3 bg_f4f5f8 h-max">
          <div class="text-right text-xs uppercase font-medium">
            {$t("Value")}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3">
        {#if !isLoading}
          {#if formatSelectedTokenList?.length === 0 || formatDataHolding?.slice(0, 500)?.length === 0}
            <div
              class="col-span-full flex justify-center items-center h-[50vh] py-3 px-3 text-base text-gray-400"
            >
              {$t("Empty")}
            </div>
          {:else}
            <div class="col-span-full w-full h-full overflow-y-auto">
              {#each formatDataTokenHoldingWithVault?.slice(0, 500) || [] as item, index}
                <div
                  class="w-full grid grid-cols-3 cursor-pointer group"
                  on:click={() => {
                    if (selectedToken === item) {
                      handleSelectedToken({});
                    } else {
                      handleSelectedToken(item);
                    }
                  }}
                >
                  <div
                    class={`col-spans-2 pl-3 py-2 ${
                      $isDarkMode
                        ? selectedToken === item
                          ? "bg-[#000]"
                          : "group-hover:bg-[#000]"
                        : selectedToken === item
                          ? "bg-gray-100"
                          : "group-hover:bg-gray-100"
                    }`}
                  >
                    <div class="relative flex items-center justify-start gap-3">
                      <div class="w-[30px] h-[30px] relative">
                        <div class="w-full h-full overflow-hidden rounded-full">
                          <Image
                            logo={item?.logoURI}
                            defaultLogo={defaultToken}
                          />
                        </div>
                        {#if item?.isVerified}
                          <div class="absolute bottom-[-2px] right-[-4px] z-1">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 22 22"
                              fill="#1890ff"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g id="CircleWavyCheck">
                                <path
                                  id="Vector"
                                  d="M4.68023 17.3198C3.88926 16.5288 4.41388 14.8682 4.01128 13.8952C3.59394 12.8865 2.0625 12.0746 2.0625 11C2.0625 9.92531 3.59395 9.1135 4.01129 8.10483C4.41389 7.1318 3.88927 5.4712 4.68023 4.68023C5.4712 3.88926 7.13181 4.41388 8.10484 4.01128C9.11353 3.59394 9.92536 2.0625 11 2.0625C12.0747 2.0625 12.8865 3.59395 13.8952 4.01129C14.8682 4.41389 16.5288 3.88927 17.3198 4.68023C18.1107 5.4712 17.5861 7.13181 17.9887 8.10484C18.4061 9.11353 19.9375 9.92536 19.9375 11C19.9375 12.0747 18.4061 12.8865 17.9887 13.8952C17.5861 14.8682 18.1107 16.5288 17.3198 17.3198C16.5288 18.1107 14.8682 17.5861 13.8952 17.9887C12.8865 18.4061 12.0746 19.9375 11 19.9375C9.92531 19.9375 9.1135 18.4061 8.10483 17.9887C7.1318 17.5861 5.4712 18.1107 4.68023 17.3198Z"
                                  fill="#1890ff"
                                  stroke="#1890ff"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></path>
                                <path
                                  id="Vector_2"
                                  d="M14.7812 8.9375L9.73955 13.75L7.21875 11.3438"
                                  stroke="#fff"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></path>
                              </g>
                            </svg>
                          </div>
                        {/if}
                      </div>

                      <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2">
                          <div
                            class="relative font-medium text-sm"
                            on:mouseover={() => {
                              if (index > 0) {
                                selectedItemIndex = index - 1;
                                isShowTooltipName = true;
                              }
                            }}
                            on:mouseleave={() => {
                              if (index > 0) {
                                selectedItemIndex = -1;
                                isShowTooltipName = false;
                              }
                            }}
                          >
                            {#if !item?.name || item?.name === "N/A"}
                              <span>
                                {shorterAddress(item?.contractAddress)}
                              </span>
                            {:else}
                              <span>
                                <span
                                  class="xl:block lg:hidden md:hidden block"
                                >
                                  {#if item?.name?.length > (item?.apy !== undefined && item?.apy?.apy && Number(item?.apy?.apy || 0) * 100 > 0.1 && isNimbusVersion ? 5 : 24)}
                                    {shorterName(
                                      item?.name,
                                      item?.apy !== undefined &&
                                        item?.apy?.apy &&
                                        isNimbusVersion
                                        ? 5
                                        : 24,
                                    )}
                                  {:else}
                                    {item?.name}
                                  {/if}
                                </span>
                                <span
                                  class="xl:hidden lg:block md:block hidden"
                                >
                                  {item?.name}
                                </span>
                              </span>
                            {/if}

                            {#if isShowTooltipName && selectedItemIndex === index - 1 && item?.name?.length > (item?.apy !== undefined && item?.apy?.apy && Number(item?.apy?.apy || 0) * 100 > 0.1 && isNimbusVersion ? 5 : 24)}
                              <div
                                class="xl:block lg:hidden md:hidden block absolute left-0 -top-8"
                                style="z-index: 2147483648;"
                              >
                                <Tooltip text={item.name} />
                              </div>
                            {/if}
                          </div>

                          {#if item?.apy !== undefined && item?.apy?.apy && Number(item?.apy?.apy || 0) * 100 > 0.1 && isNimbusVersion}
                            <div
                              class="w-max flex items-center justyfy-center px-2 py-1 text_27326F text-[10px] font-medium bg-[#1e96fc33] rounded-[1000px]"
                            >
                              <div class="flex gap-1">
                                Up to
                                <span class="flex items-center">
                                  <TooltipNumber
                                    number={Number(item?.apy?.apy || 0) * 100}
                                    type="amount"
                                  />%
                                </span>
                                APY
                              </div>
                            </div>
                          {/if}
                        </div>

                        <div class="flex items-center gap-2 min-h-[20px]">
                          <div
                            class="relative font-medium text_00000080 text-xs"
                            on:mouseover={() => {
                              if (index > 0) {
                                selectedItemIndex = index - 1;
                                isShowTooltipSymbol = true;
                              }
                            }}
                            on:mouseleave={() => {
                              if (index > 0) {
                                selectedItemIndex = -1;
                                isShowTooltipSymbol = false;
                              }
                            }}
                          >
                            {#if item?.symbol === undefined}
                              N/A
                            {:else}
                              {shorterName(item?.symbol, 12)}
                            {/if}
                            {#if isShowTooltipSymbol && selectedItemIndex === index - 1 && item.symbol.length > 12}
                              <div
                                class="absolute left-0 -top-8"
                                style="z-index: 2147483648;"
                              >
                                <Tooltip text={item?.symbol} />
                              </div>
                            {/if}
                          </div>

                          {#if item?.positionType === "ERC_404"}
                            <span
                              class="inline-flex items-center gap-x-1.5 rounded-full bg-yellow-100 px-1 py-0.5 text-[10px] font-medium text-yellow-800"
                            >
                              <svg
                                class="h-1.5 w-1.5 fill-yellow-500"
                                viewBox="0 0 6 6"
                                aria-hidden="true"
                              >
                                <circle cx={3} cy={3} r={3} />
                              </svg>
                              ERC 404
                            </span>
                          {/if}

                          {#if isShowCMC && selectedItemIndex === index - 1}
                            <a
                              href={`https://coinmarketcap.com/currencies/${item?.cmc_slug}`}
                              on:click={(e) => {
                                if (index > 0) {
                                  e.stopPropagation();
                                }
                              }}
                              target="_blank"
                              class="w-[20px] h-[20px] cursor-pointer"
                            >
                              <svg
                                viewBox="0 0 76.52 77.67"
                                xmlns="http://www.w3.org/2000/svg"
                                class="object-contain w-full h-full rounded-full"
                              >
                                <path
                                  d="m66.54 46.41a4.09 4.09 0 0 1 -4.17.28c-1.54-.87-2.37-2.91-2.37-5.69v-8.52c0-4.09-1.62-7-4.33-7.79-4.58-1.34-8 4.27-9.32 6.38l-8.1 13.11v-16c-.09-3.69-1.29-5.9-3.56-6.56-1.5-.44-3.75-.26-5.94 3.08l-18.11 29.07a32 32 0 0 1 -3.64-14.94c0-17.52 14-31.77 31.25-31.77s31.3 14.25 31.3 31.77v.09s0 .06 0 .09c.17 3.39-.93 6.09-3 7.4zm10-7.57v-.17c-.14-21.35-17.26-38.67-38.29-38.67s-38.25 17.42-38.25 38.83 17.16 38.84 38.25 38.84a37.81 37.81 0 0 0 26-10.36 3.56 3.56 0 0 0 .18-5 3.43 3.43 0 0 0 -4.86-.23 30.93 30.93 0 0 1 -44.57-2.08l16.3-26.2v12.09c0 5.81 2.25 7.69 4.14 8.24s4.78.17 7.81-4.75l9-14.57c.28-.47.55-.87.79-1.22v7.41c0 5.43 2.18 9.77 6 11.91a11 11 0 0 0 11.21-.45c4.2-2.73 6.49-7.67 6.25-13.62z"
                                  fill={`${$isDarkMode ? "#d1d5db" : "#17181b"}`}
                                />
                              </svg>
                            </a>
                          {/if}

                          {#if isShowCoingecko && selectedItemIndex === index - 1}
                            <a
                              href={`https://www.coingecko.com/en/coins/${item?.cg_id}`}
                              on:click={(e) => {
                                if (index > 0) {
                                  e.stopPropagation();
                                }
                              }}
                              target="_blank"
                              class="w-[20px] h-[20px] cursor-pointer"
                            >
                              <svg
                                version="1.1"
                                id="Layer_1"
                                xmlns="http://www.w3.org/2000/svg"
                                xmlns:xlink="http://www.w3.org/1999/xlink"
                                x="0px"
                                y="0px"
                                class="object-contain w-full h-full rounded-full"
                                viewBox="0 0 130 130"
                                enable-background="new 0 0 130 130"
                                xml:space="preserve"
                              >
                                <path
                                  fill="#8CC640"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M131.000000,57.000000 
                      C131.000000,63.021152 131.000000,69.042305 130.672409,75.726242 
                      C126.245422,96.442734 115.971336,112.377365 97.906433,122.312782 
                      C90.821442,126.209435 82.667252,128.162033 75.000000,131.000000 
                      C68.978851,131.000000 62.957695,131.000000 56.274689,130.671448 
                      C26.738447,123.925354 8.627264,106.579208 1.978957,77.565338 
                      C1.849081,76.998550 1.334888,76.519814 1.000000,76.000000 
                      C1.000000,69.645599 1.000000,63.291203 1.327633,56.273994 
                      C7.883286,27.381535 24.726683,9.368647 52.947453,2.288438 
                      C54.319679,1.944165 55.650108,1.433293 57.000000,1.000000 
                      C62.688042,1.000000 68.376083,1.000000 74.741592,1.327464 
                      C96.446571,5.317031 112.630692,16.197533 122.822418,34.953358 
                      C126.526794,41.770519 128.329590,49.620987 131.000000,57.000000 
                    M67.669617,34.593678 
                      C72.853539,36.328110 78.037468,38.062542 83.988960,39.800339 
                      C91.320595,42.477032 98.943100,44.560196 105.912613,47.975792 
                      C115.309883,52.581173 116.758698,60.664780 110.240662,68.973640 
                      C107.172386,72.884933 103.662323,76.491829 100.067467,79.939499 
                      C91.340828,88.308846 83.506844,97.323128 78.944870,108.687225 
                      C76.923164,113.723396 75.289993,118.956802 76.719704,124.519165 
                      C99.219704,123.777618 121.628136,100.428284 125.708771,73.910149 
                      C129.903824,46.648495 112.813217,18.713875 86.159439,9.266678 
                      C58.672554,-0.475806 28.585316,10.712248 13.686728,36.168118 
                      C0.647401,58.447243 5.632729,87.567360 16.799000,99.079071 
                      C21.500576,87.592857 23.501854,75.702583 23.929556,63.478218 
                      C24.379354,50.622173 30.065470,41.486504 42.244755,36.285854 
                      C50.463642,32.776325 58.658878,32.550331 67.669617,34.593678 
                    M46.378696,47.004932 
                      C46.153244,48.472221 45.722897,49.941711 45.738663,51.406406 
                      C45.799110,57.022385 52.580402,64.181587 57.331547,63.782600 
                      C64.207664,63.205166 69.441216,57.424793 69.158218,50.720249 
                      C68.941345,45.582127 65.791763,41.742584 60.648354,40.346165 
                      C54.984890,38.808552 50.460312,40.761738 46.378696,47.004932 
                    M70.502975,77.108353 
                      C70.182304,77.152718 69.855530,77.173737 69.544479,77.254951 
                      C69.444435,77.281075 69.385818,77.465889 69.308258,77.578117 
                      C70.492355,78.370712 71.577995,79.583702 72.876495,79.887817 
                      C81.442947,81.894165 89.345863,79.361977 96.649796,76.835396 
                      C88.453735,76.963951 79.822350,77.099335 70.502975,77.108353 
                    z"
                                />
                                <path
                                  fill="#FEFEFD"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M131.000000,56.531342 
                      C128.329590,49.620987 126.526794,41.770519 122.822418,34.953358 
                      C112.630692,16.197533 96.446571,5.317031 75.209534,1.327464 
                      C93.593452,1.000000 112.186913,1.000000 131.000000,1.000000 
                      C131.000000,19.353643 131.000000,37.708164 131.000000,56.531342 
                    z"
                                />
                                <path
                                  fill="#FEFEFD"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M56.531342,1.000000 
                      C55.650108,1.433293 54.319679,1.944165 52.947453,2.288438 
                      C24.726683,9.368647 7.883286,27.381535 1.327633,55.805592 
                      C1.000000,37.739223 1.000000,19.478447 1.000000,1.000000 
                      C19.353655,1.000000 37.708168,1.000000 56.531342,1.000000 
                    z"
                                />
                                <path
                                  fill="#FEFEFD"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M75.468658,131.000000 
                      C82.667252,128.162033 90.821442,126.209435 97.906433,122.312782 
                      C115.971336,112.377365 126.245422,96.442734 130.672409,76.194504 
                      C131.000000,94.260780 131.000000,112.521553 131.000000,131.000000 
                      C112.646347,131.000000 94.291832,131.000000 75.468658,131.000000 
                    z"
                                />
                                <path
                                  fill="#FEFEFD"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M1.000000,76.468658 
                      C1.334888,76.519814 1.849081,76.998550 1.978957,77.565338 
                      C8.627264,106.579208 26.738447,123.925354 55.806419,130.671448 
                      C37.739883,131.000000 19.479769,131.000000 1.000000,131.000000 
                      C1.000000,112.979698 1.000000,94.958511 1.000000,76.468658 
                    z"
                                />
                                <path
                                  fill="#F8E987"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M67.161728,34.130535 
                      C58.658878,32.550331 50.463642,32.776325 42.244755,36.285854 
                      C30.065470,41.486504 24.379354,50.622173 23.929556,63.478218 
                      C23.501854,75.702583 21.500576,87.592857 16.799000,99.079071 
                      C5.632729,87.567360 0.647401,58.447243 13.686728,36.168118 
                      C28.585316,10.712248 58.672554,-0.475806 86.159439,9.266678 
                      C112.813217,18.713875 129.903824,46.648495 125.708771,73.910149 
                      C121.628136,100.428284 99.219704,123.777618 76.719704,124.519165 
                      C75.289993,118.956802 76.923164,113.723396 78.944870,108.687225 
                      C83.506844,97.323128 91.340828,88.308846 100.067467,79.939499 
                      C103.662323,76.491829 107.172386,72.884933 110.240662,68.973640 
                      C116.758698,60.664780 115.309883,52.581173 105.912613,47.975792 
                      C98.943100,44.560196 91.320595,42.477032 83.481522,39.486412 
                      C79.000679,33.218479 75.050224,31.958828 67.161728,34.130535 
                    M122.741554,62.952946 
                      C121.931564,49.456993 117.821663,37.472195 107.482773,27.581638 
                      C112.618309,40.665421 117.481361,53.054993 122.356270,65.474770 
                      C122.471214,64.915009 122.599434,64.290619 122.741554,62.952946 
                    M74.766914,11.836439 
                      C80.884399,13.444856 87.001877,15.053272 93.647499,16.800549 
                      C88.945778,11.339518 75.633400,7.880075 68.937065,10.319439 
                      C70.920326,10.843212 72.457603,11.249201 74.766914,11.836439 
                    z"
                                />
                                <path
                                  fill="#F5F7F2"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M46.557922,46.678169 
                      C50.460312,40.761738 54.984890,38.808552 60.648354,40.346165 
                      C65.791763,41.742584 68.941345,45.582127 69.158218,50.720249 
                      C69.441216,57.424793 64.207664,63.205166 57.331547,63.782600 
                      C52.580402,64.181587 45.799110,57.022385 45.738663,51.406406 
                      C45.722897,49.941711 46.153244,48.472221 46.557922,46.678169 
                    M59.129066,43.321339 
                      C52.905285,43.682343 50.128323,45.922436 49.880501,50.781902 
                      C49.652809,55.246601 51.976357,58.415615 56.005619,59.135765 
                      C60.652447,59.966290 64.273163,58.019295 65.559769,53.998142 
                      C67.025444,49.417343 65.020790,45.732014 59.129066,43.321339 
                    z"
                                />
                                <path
                                  fill="#5E6658"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M70.846970,77.171539 
                      C79.822350,77.099335 88.453735,76.963951 96.649796,76.835396 
                      C89.345863,79.361977 81.442947,81.894165 72.876495,79.887817 
                      C71.577995,79.583702 70.492355,78.370712 69.308258,77.578117 
                      C69.385818,77.465889 69.444435,77.281075 69.544479,77.254951 
                      C69.855530,77.173737 70.182304,77.152718 70.846970,77.171539 
                    z"
                                />
                                <path
                                  fill="#249B48"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M67.415672,34.362106 
                      C75.050224,31.958828 79.000679,33.218479 83.097733,39.484730 
                      C78.037468,38.062542 72.853539,36.328110 67.415672,34.362106 
                    z"
                                />
                                <path
                                  fill="#FDFDF4"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M122.734604,63.309586 
                      C122.599434,64.290619 122.471214,64.915009 122.356270,65.474770 
                      C117.481361,53.054993 112.618309,40.665421 107.482773,27.581638 
                      C117.821663,37.472195 121.931564,49.456993 122.734604,63.309586 
                    z"
                                />
                                <path
                                  fill="#FCFBEE"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M74.380898,11.745815 
                      C72.457603,11.249201 70.920326,10.843212 68.937065,10.319439 
                      C75.633400,7.880075 88.945778,11.339518 93.647499,16.800549 
                      C87.001877,15.053272 80.884399,13.444856 74.380898,11.745815 
                    z"
                                />
                                <path
                                  fill="#5B5C5E"
                                  opacity="1.000000"
                                  stroke="none"
                                  d="
                    M59.497826,43.426590 
                      C65.020790,45.732014 67.025444,49.417343 65.559769,53.998142 
                      C64.273163,58.019295 60.652447,59.966290 56.005619,59.135765 
                      C51.976357,58.415615 49.652809,55.246601 49.880501,50.781902 
                      C50.128323,45.922436 52.905285,43.682343 59.497826,43.426590 
                    z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    class={`col-spans-1 pr-3 py-2 ${
                      $isDarkMode
                        ? selectedToken === item
                          ? "bg-[#000]"
                          : "group-hover:bg-[#000]"
                        : selectedToken === item
                          ? "bg-gray-100"
                          : "group-hover:bg-gray-100"
                    }`}
                  >
                    {#if item?.value !== null}
                      <div
                        class="flex flex-col gap-1 justify-end items-end text-sm font-medium"
                      >
                        <div class="flex items-center gap-1">
                          {#if handleCheckWithinLast24Hours(item) < 24 && handleCheckWithinLast24Hours(item) > 0}
                            <span
                              use:tooltip={{
                                content: `<tooltip-detail text="Changed ${handleCheckWithinLast24Hours(item)} hrs ago" />`,
                                allowHTML: true,
                                placement: "top",
                                interactive: true,
                              }}
                              class="cursor-pointer"
                            >
                              <div class="w-2 h-2 bg-indigo-500 rounded-full" />
                            </span>
                          {/if}
                          <TooltipNumber
                            number={item?.amount || 0}
                            type="balance"
                            personalValue
                          />
                          <div
                            class="relative"
                            on:mouseover={() => {
                              if (index > 0) {
                                selectedItemIndex = index - 1;
                                isShowTooltipSymbol = true;
                              }
                            }}
                            on:mouseleave={() => {
                              if (index > 0) {
                                selectedItemIndex = -1;
                                isShowTooltipSymbol = false;
                              }
                            }}
                          >
                            {#if item?.symbol === undefined}
                              N/A
                            {:else}
                              {shorterName(item?.symbol, 12)}
                            {/if}
                            {#if isShowTooltipSymbol && selectedItemIndex === index - 1 && item.symbol.length > 12}
                              <div
                                class="absolute left-0 -top-8"
                                style="z-index: 2147483648;"
                              >
                                <Tooltip text={item?.symbol} />
                              </div>
                            {/if}
                          </div>
                        </div>

                        <div class="font-medium text_00000080 text-xs">
                          <TooltipNumber
                            number={handleCalculateValue(
                              item,
                              Number(item.market_price),
                            )}
                            type="value"
                            personalValue
                          />
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}

        {#if isLoading}
          <div
            class="col-span-full flex justify-center items-center h-[50vh] py-3 px-3"
          >
            {#if isNimbusVersion}
              <LoadingPremium />
            {:else}
              <Loading />
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .button {
    width: 100%;
    border-radius: 1000px;
    padding: 9px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  :global(body) .button {
    background: #fafafbff;
  }
  :global(body.dark) .button {
    background: #cdcdcd59;
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
