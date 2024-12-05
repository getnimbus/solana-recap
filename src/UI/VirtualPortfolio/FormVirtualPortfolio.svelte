<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import { onMount } from "svelte";
  import numeral from "numeral";
  import dayjs from "dayjs";
  import { DateInput } from "date-picker-svelte";
  import { isDarkMode, userPublicAddress } from "~/store";
  import {
    getVirtualPortfolio,
    handleMarketTokens,
    getVirtualPortfolioPerformance,
  } from "~/lib/queryAPI";
  import { createQuery } from "@tanstack/svelte-query";
  import { isNaN } from "lodash";
  import { triggerToast } from "~/utils/functions";
  import { t } from "~/lib/i18n";

  import Loading from "~/components/Loading.svelte";
  import Button from "~/components/Button.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";

  export let handleSubmit = (
    data: any,
    type: any,
    virtualPortfolioNetworth: any,
  ) => {};
  export let handleCancel = (id: any) => {};
  export let isLoading;
  export let wallet;
  export let listVirtualPortfolio;
  export let virtualPortfolioId;
  export let type;

  let searchValue = "";
  let timerDebounce: any;
  const debounceSearch = (value: any) => {
    clearTimeout(timerDebounce);
    timerDebounce = setTimeout(() => {
      searchValue = value;
    }, 300);
  };

  let virtualPortfolioName = "";
  let virtualPortfolioNetworth: any;
  let time = new Date();
  let rebalanceTime: any = null;
  let listToken: any = [];

  let defaultData = {
    defaultSelectedTokenList: [],
    defaultName: "",
  };
  let dataVirtualPortfolioPerformance: any = {};

  let selectedTokenList: any = [];
  let listTokenLocked: any = [];
  let selectedTokenRemove: any = {};

  let checkedStatus = true;

  let searchDataResult: any = [];

  $: queryVirtualPortfolioPerformance = createQuery({
    queryKey: ["virtual-portfolio-performance", wallet, virtualPortfolioId],
    queryFn: () =>
      getVirtualPortfolioPerformance(
        wallet,
        virtualPortfolioId,
        $userPublicAddress,
      ),
    retry: false,
    enabled: Boolean(
      wallet &&
        wallet?.length !== 0 &&
        virtualPortfolioId &&
        virtualPortfolioId?.length !== 0,
    ),
  });

  $: {
    if (
      !$queryVirtualPortfolioPerformance.isError &&
      $queryVirtualPortfolioPerformance.data !== undefined
    ) {
      dataVirtualPortfolioPerformance =
        $queryVirtualPortfolioPerformance.data?.data;
    }
  }

  onMount(() => {
    if (type === "add") {
      virtualPortfolioNetworth = 1000;
    }
  });

  const handleRecalculateNetWorth = (date: any) => {
    const formatDate = dayjs(date).format("YYYY-MM-DD");

    const formatDataPortfolio = dataVirtualPortfolioPerformance?.portfolio?.map(
      (item: any) => {
        const time = dayjs(item.time).unix();
        return {
          value: item.performance,
          time: dayjs(time * 1000).format("YYYY-MM-DD"),
        };
      },
    );

    const selectedDataPerformance = formatDataPortfolio.find(
      (item: any) => item.time === formatDate,
    );

    if (selectedDataPerformance) {
      const selectedPortfolioProfile = listVirtualPortfolio.find(
        (item: any) => item?.id === virtualPortfolioId,
      );

      return (
        selectedPortfolioProfile?.initial_networth *
          (selectedDataPerformance?.value / 100) +
        selectedPortfolioProfile.initial_networth
      );
    }

    return 0;
  };

  $: queryVirtualPortfolio = createQuery({
    queryKey: [
      "virtual-portfolio",
      virtualPortfolioId,
      wallet,
      $userPublicAddress,
    ],
    queryFn: () =>
      getVirtualPortfolio(wallet, virtualPortfolioId, $userPublicAddress),
    retry: false,
    enabled: Boolean(
      wallet &&
        wallet.length !== 0 &&
        virtualPortfolioId &&
        virtualPortfolioId?.length !== 0 &&
        listVirtualPortfolio.length !== 0,
    ),
  });

  $: {
    if (
      !$queryVirtualPortfolio.isError &&
      $queryVirtualPortfolio.data !== undefined
    ) {
      formatDataVirtualPortfolio($queryVirtualPortfolio?.data?.data);
    }
  }

  const formatDataVirtualPortfolio = (data: any) => {
    const selectedPortfolioProfile = listVirtualPortfolio.find(
      (item: any) => item?.id === virtualPortfolioId,
    );

    const virtualPortfolioNameList = data && Object.getOwnPropertyNames(data);

    const formatDataVirtualPortfolio =
      virtualPortfolioNameList &&
      virtualPortfolioNameList?.map((item) => {
        return {
          portfolioName: selectedPortfolioProfile?.name,
          coins: data[item]?.tokens?.map((coin) => {
            return {
              ...coin,
              percent: Number(coin?.percent),
            };
          }),
          history: data[item]?.history?.map((coin) => {
            return {
              ...coin,
              percent: Number(coin?.percent),
            };
          }),
          updatedTime: selectedPortfolioProfile?.startedAt,
        };
      });

    const dataVirtualPortfolio = virtualPortfolioNameList?.reduce(
      (acc: any, key: any, index: any) => {
        acc[key] = formatDataVirtualPortfolio[index];
        return acc;
      },
      {},
    );

    const selectedData = {
      ...dataVirtualPortfolio[virtualPortfolioId],
      status: selectedPortfolioProfile?.status,
      networth: selectedPortfolioProfile?.networth || 0,
      initial_networth: selectedPortfolioProfile?.initial_networth || 0,
      startedAt: selectedPortfolioProfile?.startedAt,
    };

    if (type === "edit" && selectedData) {
      if (selectedData.status === "PRIVATE") {
        checkedStatus = false;
      }

      virtualPortfolioName = selectedData.portfolioName;

      virtualPortfolioNetworth = selectedData?.initial_networth;

      time = dayjs(selectedData.startedAt).toDate();

      selectedTokenList = selectedData?.coins?.map((item: any) => {
        return {
          id: item?.coinId,
          logo: item?.logo,
          name: item?.name,
          percent: Number(numeral(item?.percent).format("0,0.00")),
          symbol: item?.symbol,
        };
      });

      defaultData.defaultSelectedTokenList = selectedTokenList;
      defaultData.defaultName = virtualPortfolioName;
    }
  };

  // get search token
  $: queryListSearchToken = createQuery({
    queryKey: ["list-search-token", searchValue],
    queryFn: () => handleMarketTokens(searchValue ? searchValue : ""),
  });

  $: {
    if (!$queryListSearchToken.isError && $queryListSearchToken?.data) {
      formatListSearchToken($queryListSearchToken?.data);
    }
  }

  const formatListSearchToken = (data: any) => {
    listToken = data?.map((item: any) => {
      return {
        id: item?.id,
        name: item?.name,
        symbol: item?.symbol,
        logo: item?.large || item?.thumb,
        percent: 0,
      };
    });
    searchDataResult = listToken;
  };

  $: {
    if (selectedTokenList) {
      searchDataResult = searchDataResult?.map((item: any) => {
        return {
          ...item,
          percent:
            selectedTokenRemove &&
            Object.keys(selectedTokenRemove).length !== 0 &&
            selectedTokenRemove?.id === item.id
              ? 0
              : item.percent,
        };
      });

      listToken = listToken?.map((item: any) => {
        return {
          ...item,
          percent:
            selectedTokenRemove &&
            Object.keys(selectedTokenRemove).length !== 0 &&
            selectedTokenRemove?.id === item.id
              ? 0
              : item.percent,
        };
      });

      if (selectedTokenList.length === 0) {
        selectedTokenRemove = {};
      }
    }
  }

  $: remaining = selectedTokenList?.reduce(
    (prev: any, item: any) => prev + Number(item.percent),
    0,
  );

  const handleAutoAllocate = () => {
    if (isLoading) {
      return;
    }
    if (listTokenLocked && listTokenLocked.length !== 0) {
      const totalPercent = listTokenLocked.reduce(
        (prev: any, item: any) => prev + Number(item.percent),
        0,
      );

      const orderSelectedTokenList = selectedTokenList.filter((token) =>
        listTokenLocked.every((lockedToken) => lockedToken.id !== token.id),
      );

      selectedTokenList = selectedTokenList.map((item) => {
        if (item?.locked) {
          return item;
        }

        return {
          ...item,
          percent: (100 - totalPercent) / orderSelectedTokenList.length,
        };
      });
    } else {
      selectedTokenList = selectedTokenList.map((item) => {
        return {
          ...item,
          percent: 100 / selectedTokenList.length,
        };
      });
    }
  };

  const handleClearAllTokenAllocation = () => {
    if (isLoading) {
      return;
    }
    selectedTokenList = [];
    remaining = 0;
    selectedTokenRemove = {};
    listToken = listToken?.map((item) => {
      return {
        ...item,
        percent: 0,
      };
    });
  };

  const handleRemoveTokenAllocation = (data: any) => {
    if (isLoading) {
      return;
    }
    if (
      listTokenLocked.length !== 0 &&
      listTokenLocked.find((item) => item.id === data.id)
    ) {
      listTokenLocked = listTokenLocked.filter((item) => item.id !== data.id);
    }
    selectedTokenList = selectedTokenList.filter((item) => item.id !== data.id);
    selectedTokenRemove = data;
  };

  const handleDecreaseTokenAllocation = (data: any) => {
    if (data?.locked || isLoading) {
      return;
    }
    if (data.percent > 0) {
      data.percent -= 1;
      selectedTokenList = selectedTokenList?.map((item) => {
        if (item.id === data.id) {
          return data;
        }
        return item;
      });
    }
  };

  const handleIncreaseTokenAllocation = (data: any) => {
    if (data?.locked || isLoading) {
      return;
    }
    if (data.percent < 100) {
      data.percent += 1;
      selectedTokenList = selectedTokenList?.map((item) => {
        if (item.id === data.id) {
          return data;
        }
        return item;
      });
    }
  };

  const handleLockTokenAllocation = (data: any) => {
    if (isLoading) {
      return;
    }
    if (
      listTokenLocked.length !== 0 &&
      listTokenLocked.find((item) => item.id === data.id)
    ) {
      listTokenLocked = listTokenLocked.filter((item) => item.id !== data.id);

      selectedTokenList = selectedTokenList.map((item) => {
        if (item.id === data.id) {
          return {
            ...item,
            locked: false,
          };
        }
        return item;
      });
    } else {
      listTokenLocked = [...listTokenLocked, data];
      selectedTokenList = selectedTokenList.map((item) => {
        if (item.id === data.id) {
          return {
            ...item,
            locked: true,
          };
        }
        return item;
      });
    }
  };

  const handleChangeTokenAllocation = (event: any, data: any) => {
    if (data?.locked || isLoading) {
      return;
    }

    let value = parseFloat(event?.target?.value);

    if (isNaN(value) || value < 0) {
      value = 0;
    }
    if (value < 0) {
      value = 0;
    }
    if (value > 100) {
      value = 100;
    }

    selectedTokenList = selectedTokenList?.map((item) => {
      if (item.id === data.id) {
        return {
          ...item,
          percent: Number(numeral(value).format("0,0.00")),
        };
      }
      return item;
    });
  };

  const handleSelectToken = (data: any) => {
    if (isLoading) {
      return;
    }
    const isIncludes =
      selectedTokenList &&
      selectedTokenList?.find((item) => item.id === data.id);
    if (!isIncludes) {
      selectedTokenList = [
        ...selectedTokenList,
        listToken.filter((item) => item.id === data.id)[0],
      ];
    }
  };

  const handleChangeNetworth = (event: any) => {
    if (isLoading) {
      return;
    }
    let value = parseFloat(event?.target?.value);
    if (isNaN(value)) {
      value = 0;
    }
    if (value < 0) {
      value = 0;
    }
    virtualPortfolioNetworth = value;
  };

  const handleSelectTimeRebalance = (value: any) => {
    rebalanceTime = value.detail;
  };

  const handleCancelRebalance = () => {
    if (isLoading) {
      return;
    }
    handleCancel(virtualPortfolioId);
  };

  const handleSubmitRebalance = () => {
    if ($queryListSearchToken.isFetching) {
      return;
    }

    if (virtualPortfolioName.length === 0) {
      triggerToast("Missing virtual portfolio name!", "fail");
      return;
    }

    if (
      type === "add" &&
      (Number(virtualPortfolioNetworth) === 0 ||
        !virtualPortfolioNetworth ||
        Number(virtualPortfolioNetworth) < 100)
    ) {
      triggerToast(
        "Your virtual portfolio networth is lower than $100!",
        "fail",
      );
      return;
    }

    if (remaining !== 100) {
      triggerToast("Complete your virtual portfolio to 100%!", "fail");
      return;
    }

    if (selectedTokenList.find((item: any) => item.percent === 0)) {
      triggerToast(
        "One of all token you have been selected and percent input is not valid!",
        "fail",
      );
      return;
    }

    handleSubmit(
      {
        initialTime: dayjs(
          type === "edit"
            ? rebalanceTime === time || rebalanceTime === null
              ? dayjs(time).add(1, "day").toDate()
              : rebalanceTime
            : time,
        ).format(),
        portfolioName: virtualPortfolioName,
        coins: selectedTokenList?.map((item: any) => {
          return {
            coin: item.id.toString(),
            percent: Number(item.percent),
            logo: item.logo,
            name: item.name,
            symbol: item.symbol,
          };
        }),
        status: checkedStatus ? "PUBLIC" : "PRIVATE",
      },
      type,
      type === "edit"
        ? handleRecalculateNetWorth(
            rebalanceTime === time || rebalanceTime === null
              ? dayjs(time).add(1, "day").toDate()
              : rebalanceTime,
          )
        : Number(virtualPortfolioNetworth),
    );
  };
</script>

<div class="flex items-center justify-start gap-2 mb-6">
  <div class="text-base">{$t("Is it Public?")}</div>
  <label class="switch" for="switch">
    <input
      type="checkbox"
      id="switch"
      bind:checked={checkedStatus}
      disabled={isLoading}
    />
    <span class="slider" />
  </label>
</div>

<div class="flex flex-col gap-6">
  <div class="flex flex-col gap-6">
    <div class="flex-1 flex flex-col gap-1">
      <div class="text-base font-medium">
        {$t("Name")} <span class="text-red-500">*</span>
      </div>
      <input
        disabled={isLoading}
        type="text"
        placeholder={$t("Your portfolio name")}
        class={`py-[6px] px-3 rounded-lg focus:outline-none focus:ring-0 text-sm font-normal bg-transparent ${
          $isDarkMode ? "text-white" : "text-[#5E656B] placeholder-[#5E656B]"
        }`}
        style="border: 1px solid rgba(103, 113, 137, 0.3)"
        value={virtualPortfolioName}
        on:change={(event) => {
          if (isLoading) {
            return;
          }
          virtualPortfolioName = event?.target.value;
        }}
      />
    </div>

    <div class="flex-1 flex flex-col gap-1">
      <div class="flex flex-col">
        <div class="text-base font-medium">
          {$t("Initial Investment")} <span class="text-red-500">*</span>
        </div>
        <div class="text-xs font-normal text-gray-500 italic">
          ({$t("Minium is $100")})
        </div>
      </div>
      <div
        class={`py-[6px] px-3 rounded-lg text-sm font-normal flex items-center gap-1 bg-transparent ${
          $isDarkMode ? "text-white" : "text-[#5E656B] placeholder-[#5E656B]"
        }`}
        style="border: 1px solid rgba(103, 113, 137, 0.3)"
      >
        $
        <input
          type="number"
          min="100"
          step="0.01"
          placeholder="0"
          disabled={type === "edit" || isLoading}
          class="text-sm p-0 border-none focus:outline-none focus:ring-0 flex-1 bg-transparent"
          value={virtualPortfolioNetworth}
          on:change={(event) => {
            handleChangeNetworth(event);
          }}
        />
      </div>
    </div>

    <div
      class={`flex-1 flex flex-col gap-1 ${
        $isDarkMode ? "dark-date-picker" : "light-date-picker"
      }`}
    >
      <div class="text-base font-medium">
        {#if type === "edit"}
          {$t("Rebalance Time")}
        {:else}
          {$t("Begin Time")}
        {/if}
        <span class="text-red-500">*</span>
      </div>
      {#if type === "edit"}
        <DateInput
          format="yyyy-MM-dd"
          value={dayjs(time).add(1, "day").toDate()}
          min={dayjs(time).add(1, "day").toDate()}
          max={new Date()}
          on:select={handleSelectTimeRebalance}
          disabled={isLoading}
        />
      {/if}
      {#if type === "add"}
        <DateInput
          format="yyyy-MM-dd"
          bind:value={time}
          max={new Date()}
          disabled={isLoading}
        />
      {/if}
    </div>
  </div>

  <div class="flex xl:flex-row flex-col justify-between gap-6">
    <div
      class={`flex-1 w-full flex flex-col gap-4 rounded-lg p-4 relative ${
        $isDarkMode ? "bg-[#0f0f0f]" : "bg-[#fff]"
      }`}
      style="border: 1px solid rgba(103, 113, 137, 0.3)"
    >
      <div class="flex md:flex-row flex-col justify-between md:items-end gap-4">
        <div class="flex flex-col gap-1">
          <div class="text-xl font-medium">1. {$t("Choose coins")}</div>
          <div class="text-base font-normal text-gray-500">
            {$t("Choose one or more to start")}
          </div>
        </div>
        <input
          disabled={isLoading}
          value={searchValue}
          on:keyup={({ target: { value } }) => {
            if (!isLoading) {
              debounceSearch(value);
            }
          }}
          placeholder={$t("Find by token name")}
          type="text"
          class={`py-1 px-[6px] rounded-lg focus:outline-none focus:ring-0 text-sm font-normal ${
            searchValue && !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
          } ${
            $isDarkMode ? "text-white" : "text-[#5E656B] placeholder-[#5E656B]"
          }`}
          style="border: 1px solid rgba(103, 113, 137, 0.3)"
        />
      </div>

      <div
        class="border border_0000000d rounded-[10px] overflow-y-auto h-[550px]"
      >
        <table
          class={`table-auto w-full ${
            $queryListSearchToken.isFetching ||
            (searchDataResult && searchDataResult.length === 0)
              ? "h-full"
              : ""
          }`}
        >
          {#if $queryListSearchToken.isFetching}
            <tbody>
              <tr>
                <td colspan={2}>
                  <div
                    class="flex justify-center items-center py-3 px-3 h-full"
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
              {#if searchDataResult && searchDataResult.length === 0}
                <tr>
                  <td colspan={2}>
                    <div
                      class="flex justify-center items-center py-3 px-3 text-base text-gray-400"
                    >
                      {#if searchValue && searchValue.length !== 0}
                        No result
                      {:else}
                        Empty
                      {/if}
                    </div>
                  </td>
                </tr>
              {:else}
                {#each searchDataResult as data}
                  <tr
                    class="group transition-all cursor-pointer"
                    on:click={() => {
                      handleSelectToken(data);
                    }}
                  >
                    <td
                      class={`py-3 pl-3 ${
                        $isDarkMode
                          ? "group-hover:bg-[#000]"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      <div class="text-left flex items-center gap-3">
                        <img
                          src={data?.logo}
                          alt=""
                          width="30"
                          height="30"
                          class="rounded-full"
                        />
                        <div class="flex flex-col gap-1">
                          <div class="text-sm font-medium relative">
                            {#if data?.name === undefined}
                              N/A
                            {:else}
                              {data?.name}
                            {/if}
                          </div>
                          <div
                            class="text_00000080 text-xs font-medium relative"
                          >
                            {#if data?.symbol === undefined}
                              N/A
                            {:else}
                              {data?.symbol}
                            {/if}
                          </div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          {#if data?.suggest && data.suggest.length}
                            {#each data?.suggest as item}
                              <a
                                href={item.url}
                                target="_blank"
                                class="flex items-center justyfy-center px-2 py-1 text_27326F text-[10px] font-medium bg-[#1e96fc33] rounded-[1000px]"
                              >
                                {item.tile}
                              </a>
                            {/each}
                          {/if}
                        </div>
                      </div>
                    </td>
                    <td
                      class={`py-3 w-10 ${isLoading ? "opacity-40" : "opacity-100"} ${
                        $isDarkMode
                          ? "group-hover:bg-[#000]"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      <div class="flex justify-center">
                        <div class="text-3xl text_00000080">&rsaquo;</div>
                      </div>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          {/if}
        </table>
      </div>
    </div>

    <div
      class={`flex-1 w-full flex flex-col gap-4 rounded-lg p-4 relative ${
        $isDarkMode ? "bg-[#0f0f0f]" : "bg-[#fff]"
      }`}
      style="border: 1px solid rgba(103, 113, 137, 0.3)"
    >
      <div
        class="flex md:flex-row flex-col justify-between md:items-end items-start gap-4"
      >
        <div class="flex flex-col gap-1">
          <div class="text-xl font-medium">2. {$t("Coin Allocation")}</div>
          <div class="text-base font-normal text-gray-500">
            {$t("Result")}:
            <span
              class={`${remaining === 100 ? "text-gray-500" : "text-red-500"}`}
              >{remaining === 0
                ? 0
                : remaining === 100
                  ? 100
                  : numeral(remaining).format("0,0.00")}%</span
            >/100%
          </div>
        </div>
        {#if selectedTokenList && selectedTokenList.length !== 0}
          <div class="flex items-center justify-end gap-4">
            <div
              class="md:order-1 order-2 text-sm text-red-500 cursor-pointer font-medium hover:underline transition-all"
              on:click={() => {
                handleClearAllTokenAllocation();
              }}
            >
              {$t("Clear All")}
            </div>
            <div class="md:order-2 order-1 w-max">
              <Button
                variant="tertiary"
                on:click={() => {
                  handleAutoAllocate();
                }}
              >
                {$t("Auto Allocate")}
              </Button>
            </div>
          </div>
        {/if}
      </div>

      <div
        class="border border_0000000d rounded-[10px] overflow-y-auto h-[550px]"
      >
        {#each selectedTokenList || [] as data}
          <div id={data.id} class="grid grid-cols-2 gap-2 my-2 mx-2">
            <div
              class="py-2 pl-2 col-span-1 border border_0000000d rounded-[10px]"
            >
              <div class="text-left flex items-center gap-3">
                <img
                  src={data?.logo}
                  alt=""
                  width="30"
                  height="30"
                  class="rounded-full"
                />
                <div class="flex flex-col gap-1">
                  <div class="text-sm font-medium relative">
                    {#if data.name === undefined}
                      N/A
                    {:else}
                      {data.name}
                    {/if}
                  </div>
                  <div class="text_00000080 text-xs font-medium relative">
                    {#if data.symbol === undefined}
                      N/A
                    {:else}
                      {data.symbol}
                    {/if}
                  </div>
                </div>
              </div>
            </div>
            <div class="col-span-1 flex items-center gap-6">
              <div
                class={`flex-1 border border_0000000d rounded-[10px] h-full flex justify-between items-center px-2 ${
                  data?.locked || isLoading
                    ? "bg-[#f3f4f64d]"
                    : "bg-transparent"
                }`}
              >
                <div
                  class="flex-1 flex justify-center items-center text-3xl text-gray-500 mb-1"
                >
                  <div
                    class={`cursor-pointer ${data?.locked || isLoading ? "opacity-40" : "opacity-100"}`}
                    on:click={() => {
                      handleDecreaseTokenAllocation(data);
                    }}
                  >
                    -
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={data.percent}
                  disabled={data?.locked || isLoading}
                  on:change={(event) => {
                    handleChangeTokenAllocation(event, data);
                  }}
                  class={`w-max border-none focus:outline-none focus:ring-0 text-xl font-normal text-center bg-transparent ${
                    $isDarkMode
                      ? "text-white"
                      : "text-[#5E656B] placeholder-[#5E656B]"
                  }`}
                />
                <div
                  class="flex-1 flex justify-center items-center text-3xl text-gray-500"
                >
                  <div
                    class={`cursor-pointer ${data?.locked || isLoading ? "opacity-40" : "opacity-100"}`}
                    on:click={() => {
                      handleIncreaseTokenAllocation(data);
                    }}
                  >
                    +
                  </div>
                </div>
              </div>

              <div
                class="cursor-pointer"
                on:click={() => {
                  handleLockTokenAllocation(data);
                }}
              >
                {#if data.locked}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="16"
                      r="2"
                      stroke="#6b7280"
                      stroke-width="1.5"
                    />
                    <path
                      d="M6 10V8C6 7.65929 6.0284 7.32521 6.08296 7M18 10V8C18 4.68629 15.3137 2 12 2C10.208 2 8.59942 2.78563 7.5 4.03126"
                      stroke="#6b7280"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                    <path
                      d="M11 22H8C5.17157 22 3.75736 22 2.87868 21.1213C2 20.2426 2 18.8284 2 16C2 13.1716 2 11.7574 2.87868 10.8787C3.75736 10 5.17157 10 8 10H16C18.8284 10 20.2426 10 21.1213 10.8787C22 11.7574 22 13.1716 22 16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H15"
                      stroke="#6b7280"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                {:else}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="16"
                      r="2"
                      stroke="#1e96fc"
                      stroke-width="1.5"
                    />
                    <path
                      d="M11 22H8C5.17157 22 3.75736 22 2.87868 21.1213C2 20.2426 2 18.8284 2 16C2 13.1716 2 11.7574 2.87868 10.8787C3.75736 10 5.17157 10 8 10H16C18.8284 10 20.2426 10 21.1213 10.8787C22 11.7574 22 13.1716 22 16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H15"
                      stroke="#1e96fc"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                    <path
                      d="M6 10V8C6 7.65929 6.0284 7.32521 6.08296 7M17.811 6.5C17.1449 3.91216 14.7958 2 12 2C10.223 2 8.62643 2.7725 7.52779 4"
                      stroke="#1e96fc"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                {/if}
              </div>

              <div
                class="text-3xl text-gray-500 cursor-pointer text-center"
                on:click={() => {
                  handleRemoveTokenAllocation(data);
                }}
              >
                &times;
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="flex items-center justify-end gap-4">
    <div class="md:w-[120px] w-full">
      <Button
        disabled={isLoading}
        variant="secondary"
        on:click={() => {
          handleCancelRebalance();
        }}
      >
        {$t("Cancel")}
      </Button>
    </div>
    <div class="md:w-[120px] w-full">
      <Button
        {isLoading}
        disabled={isLoading}
        on:click={() => {
          handleSubmitRebalance();
        }}
      >
        {type === "edit" ? $t("Rebalance") : $t("Create")}
      </Button>
    </div>
  </div>
</div>

<style>
  :global(body) .bg_fafafbff {
    background: #fafafbff;
  }
  :global(body.dark) .bg_fafafbff {
    background: #212121;
  }

  :global input.svelte-1wkmxmo {
    font-size: 14px !important;
    padding: 6px 12px !important;
    border-radius: 8px !important;
  }

  .light-date-picker {
    --date-input-width: 100%;
    --date-picker-background: white;
    --date-picker-foreground: #5e656b;
    --date-picker-selected-color: black;
    --date-picker-highlight-border: transparent;
  }

  .dark-date-picker {
    --date-input-width: 100%;
    --date-picker-background: #0f0f0f;
    --date-picker-foreground: #fff;
    --date-picker-selected-color: black;
    --date-picker-highlight-border: transparent;
  }

  input.svelte-1wkmxmo {
    border-radius: 8px !important;
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
</style>
