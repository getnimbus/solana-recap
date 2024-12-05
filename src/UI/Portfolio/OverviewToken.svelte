<script lang="ts">
  import {
    isDarkMode,
    typeWallet,
    selectedBundle,
    totalTokens,
    tab,
    chain,
    wallet,
  } from "~/store";
  import {
    formatCurrency,
    formatPercent,
    formatValue,
    handleFormatDataPieChart,
    handleFormatDataTable,
    handleFormatDataTableBundle,
  } from "~/utils";
  import { flatten } from "lodash";
  import { isNimbusVersion, typeList } from "~/utils/constants";
  import { t } from "~/lib/i18n";
  import { chainList, chainMoveList, chainSolList } from "~/lib/chains";
  import { createQuery, createQueries } from "@tanstack/svelte-query";
  import { getHoldingToken, handleValidateAddress } from "~/lib/queryAPI";

  import EChart from "~/components/EChart.svelte";
  import Select from "~/components/Select.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";

  import defaultToken from "~/assets/defaultToken.png";

  export let enabledFetchAllData;
  export let isLoading;
  export let dataPersonalizeTag;
  export let handleSelectedTableTokenHolding = (
    data: any,
    selectDataPieChart: any,
  ) => {};

  let holdingTokenData: any = [];

  $: queryValidate = createQuery({
    queryKey: ["validate", $wallet],
    queryFn: () => handleValidateAddress($wallet),
    retry: false,
    enabled: Boolean($wallet && $wallet?.length !== 0),
  });

  $: chainListQueries =
    $typeWallet?.length !== 0 && $typeWallet === "EVM"
      ? chainList.slice(1)?.map((item) => item.value)
      : $typeWallet?.length !== 0 && ["MOVE", "SUI"].includes($typeWallet)
        ? chainMoveList.slice(1)?.map((item) => item.value)
        : $typeWallet?.length !== 0 && ["ECLIPSE", "SOL"].includes($typeWallet)
          ? chainSolList.slice(1)?.map((item) => item.value)
          : [chainSolList[0]?.value];

  $: queryTokenHolding = createQuery({
    queryKey: ["token-holding-each-chain", $wallet, $chain],
    queryFn: () => getHoldingToken($wallet, $chain, $queryValidate.data),
    enabled: Boolean(
      enabledFetchAllData &&
        $wallet &&
        $wallet?.length !== 0 &&
        !$queryValidate.isFetching &&
        $chain.length !== 0 &&
        $chain !== "ALL" &&
        $tab.length !== 0 &&
        $tab === "token",
    ),
  });

  $: queryAllTokenHolding = createQueries(
    chainListQueries?.map((item: any) => {
      return {
        queryKey: ["token-holding", $wallet, $chain, item],
        queryFn: () => getHoldingToken($wallet, item, $queryValidate.data),
        enabled: Boolean(
          enabledFetchAllData &&
            $wallet &&
            $wallet?.length !== 0 &&
            !$queryValidate.isFetching &&
            $chain.length !== 0 &&
            $chain === "ALL" &&
            $tab.length !== 0 &&
            $tab === "token",
        ),
      };
    }),
  );

  $: {
    if ($wallet || $chain) {
      if (
        $wallet?.length !== 0 &&
        $chain?.length !== 0 &&
        !$queryValidate.isFetching
      ) {
        holdingTokenData = [];
      }
    }
  }

  $: {
    if (!$queryTokenHolding.isError && $queryTokenHolding.data !== undefined) {
      formatDataHoldingToken($queryTokenHolding.data);
    }
  }

  $: {
    if ($queryAllTokenHolding.length !== 0) {
      const allTokens = flatten(
        $queryAllTokenHolding
          ?.filter((item) => Array.isArray(item.data))
          ?.map((item) => item.data),
      );
      if (allTokens && allTokens.length !== 0) {
        formatDataHoldingToken(allTokens);
      }
    }
  }

  const formatDataHoldingToken = (data: any) => {
    holdingTokenData = data
      ?.filter((item: any) => Number(item?.amount) !== 0)
      ?.map((item: any) => {
        return {
          ...item,
          value: Number(item?.amount) * Number(item?.price?.price),
        };
      })
      .sort((a: any, b: any) => {
        if (a.value < b.value) {
          return 1;
        }
        if (a.value > b.value) {
          return -1;
        }
        return 0;
      })
      ?.filter((item: any) => Number(item?.amount) > 0);
  };

  $: isLoadingBreakdownTokens =
    $tab === "token"
      ? $chain === "ALL"
        ? $queryAllTokenHolding.some((item) => item.isLoading === true)
        : $queryTokenHolding.isLoading
      : false;

  let option: any = {
    tooltip: {
      trigger: "item",
      axisPointer: {
        type: "shadow",
      },
      extraCssText: "z-index: 9997",
      formatter: function (params: any) {
        const selectedData = handleFormatTooltip(params) || {};

        const formatParams: any = {
          ...selectedData,
          ratio: params.value,
        };

        return `
            <div style="display: flex; flex-direction: column; gap: 12px; min-width: 220px;">
              <div style="display: flex; align-items: centers; gap: 4px">
                <img src=${formatParams?.logo || defaultToken}
                onerror="this.onerror=null;this.src='${defaultToken}';"
                alt="" width=20 height=20 style="border-radius: 100%" />
                <div style="font-weight: 500; font-size: 16px; line-height: 19px; color: ${
                  $isDarkMode ? "white" : "black"
                }">
                  ${formatParams?.name} ${
                    formatParams?.symbol ? `(${formatParams?.symbol})` : ""
                  }
                </div>
              </div>

              ${
                formatParams?.balance && formatParams?.balance?.length !== 0
                  ? `
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                  $isDarkMode ? "white" : "black"
                }">
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                    ${$t("Balance")}
                  </div>
                  <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                    ${formatCurrency(formatParams?.balance)}
                  </div>
                </div>
              `
                  : ""
              }

              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                $isDarkMode ? "white" : "black"
              }">
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${$t("Value")}
                </div>
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${formatValue(formatParams?.value)}
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: ${
                $isDarkMode ? "white" : "black"
              }">
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${$t("Ratio")}
                </div>
                <div style="grid-template-columns: repeat(1, minmax(0, 1fr)); font-weight: 500; font-size: 14px; line-height: 17px;">
                  ${formatPercent(formatParams?.ratio)}%
                </div>
              </div>
            </div>`;
      },
    },
    legend: {
      type: "scroll",
      top: "10%",
      left: "center",
    },
    grid: {
      left: "-1%",
      right: "0%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      show: false,
    },
    yAxis: {
      type: "category",
      data: [""],
      show: false,
    },
    series: [],
  };

  let dataPieChartToken: any = [];

  const formatTokenBreakdown = (data: any) => {
    const formatData = data
      ?.map((item: any) => {
        return {
          ...item,
          value: Number(item?.amount || 0) * Number(item?.price?.price || 0),
        };
      })
      ?.filter((item: any) => Number(item.value) > 0)
      ?.sort((a: any, b: any) => {
        if (a.value < b.value) {
          return 1;
        }
        if (a.value > b.value) {
          return -1;
        }
        return 0;
      });

    const sumToken = (formatData || []).reduce(
      (prev: any, item: any) => prev + Number(item?.value),
      0,
    );

    const formatChartData = formatData.map((item: any) => {
      return {
        name: item.symbol,
        type: "bar",
        stack: "total",
        label: {
          show: false,
        },
        emphasis: {
          focus: "series",
        },
        data: [(item.value / sumToken) * 100],
        barMinWidth: "120%",
      };
    });

    let topData = [];
    let otherData = [];
    let total = 0;

    for (let i = 0; i < formatChartData.length; i++) {
      let value = formatChartData[i].data[0];
      if (total <= 90) {
        topData.push(formatChartData[i]);
        total += value;
      } else {
        otherData.push(formatChartData[i]);
      }
    }

    const formatOtherData = otherData.map((item) => {
      const selectedData = formatData.find(
        (eachData: any) => eachData.symbol === item.name,
      );
      return {
        ...selectedData,
        ...item,
      };
    });

    const sumOrderBreakdownToken = formatOtherData.reduce(
      (prev: any, item: any) => prev + Number(item.value),
      0,
    );

    dataPieChartToken =
      sumOrderBreakdownToken > 0
        ? topData.concat([
            {
              name: "Other",
              type: "bar",
              stack: "total",
              label: {
                show: false,
              },
              emphasis: {
                focus: "series",
              },
              data: [100 - total],
              barMinWidth: "120%",
            },
          ])
        : topData;
  };

  $: typeListCategory =
    $typeWallet === "BUNDLE"
      ? [
          {
            label: "All",
            value: "All",
          },
          {
            label: "Account",
            value: "Account",
          },
          {
            label: "Chain",
            value: "Chain",
          },
          ...typeList,
        ]
      : [
          {
            label: "All",
            value: "All",
          },
          {
            label: "Chain",
            value: "Chain",
          },
          ...typeList,
        ];

  let selectedType = {
    label: "All",
    value: "All",
  };

  let tokenDataCustomCategory: any = [];

  let tokenDataHolding = {
    value: "",
    data: [],
    dataPie: [],
    dataTable: {
      data: {
        name: "All",
        data: [],
      },
      select: [],
    },
  };

  let tokenDataChain: any = {
    value: "",
    data: [],
    dataPie: [],
    dataTable: {
      data: [],
      select: [],
    },
  };

  let tokenDataRank: any = {
    value: "",
    data: [],
    dataPie: [],
    dataTable: {
      data: [],
      select: [],
    },
  };

  let tokenDataCategory: any = {
    value: "",
    data: [],
    dataPie: [],
    dataTable: {
      data: [],
      select: [],
    },
  };

  let tokenDataSector: any = {
    value: "",
    data: [],
    dataPie: [],
    dataTable: {
      data: [],
      select: [],
    },
  };

  let dataAccounts: any = {
    value: "",
    data: [],
    dataPie: [],
    dataTable: {
      data: {
        name: "All",
        data: [],
      },
      select: [],
    },
  };

  const handleFormatData = (data: any) => {
    const formatChartData = data.map((item: any) => {
      return {
        name: item.name,
        type: "bar",
        stack: "total",
        label: {
          show: false,
        },
        emphasis: {
          focus: "series",
        },
        data: [item.value],
        barMinWidth: "120%",
      };
    });

    let topData = [];
    let otherData = [];
    let total = 0;

    for (let i = 0; i < formatChartData.length; i++) {
      let value = formatChartData[i].data[0];
      if (total <= 90) {
        topData.push(formatChartData[i]);
        total += value;
      } else {
        otherData.push(formatChartData[i]);
      }
    }

    const formatOtherData = otherData.map((item) => {
      const selectedData = data.find(
        (eachData: any) => eachData.name === item.name,
      );
      return {
        ...selectedData,
        ...item,
      };
    });

    const sumOrderBreakdownToken = formatOtherData.reduce(
      (prev: any, item: any) => prev + Number(item.value),
      0,
    );

    return sumOrderBreakdownToken > 0
      ? topData.concat([
          {
            name: "Other",
            type: "bar",
            stack: "total",
            label: {
              show: false,
            },
            emphasis: {
              focus: "series",
            },
            data: [100 - total],
            barMinWidth: "120%",
          },
        ])
      : topData;
  };

  const formatDataOverviewBundlePieChart = () => {
    const dataTable = handleFormatDataTableBundle(
      holdingTokenData || [],
      $selectedBundle?.accounts || [],
    );

    const formatDataTable = dataTable?.data?.map((item: any) => {
      return {
        ...item,
        networth: (item?.data || []).reduce(
          (prev: any, item: any) => prev + Number(item.value),
          0,
        ),
      };
    });

    const totalNetworth = (formatDataTable || []).reduce(
      (prev: any, item: any) => prev + Number(item.networth),
      0,
    );

    const dataOverviewBundlePieChart = formatDataTable
      ?.map((item: any) => {
        const selectedAccount = $selectedBundle?.accounts?.find(
          (data: any) =>
            data?.value?.toLowerCase() === item?.name?.toLowerCase(),
        );

        return {
          logo: selectedAccount?.logo,
          label: selectedAccount?.label,
          type: selectedAccount?.type,
          value: item?.networth || 0,
        };
      })
      ?.map((item: any) => {
        return {
          logo: item?.logo,
          name: item?.label,
          name_balance: "",
          name_ratio: "Ratio",
          name_value: "Value",
          symbol: item?.type,
          value: (Number(item?.value || 0) / Number(totalNetworth || 0)) * 100,
          value_balance: 0,
          value_value: Number(item?.value || 0),
        };
      })
      ?.sort((a: any, b: any) => {
        if (a.value_value < b.value_value) {
          return 1;
        }
        if (a.value_value > b.value_value) {
          return -1;
        }
        return 0;
      });

    dataAccounts = {
      value: "Account",
      data: dataOverviewBundlePieChart,
      dataPie: handleFormatData(dataOverviewBundlePieChart),
      dataTable,
    };
  };

  $: {
    if (holdingTokenData) {
      formatTokenBreakdown(holdingTokenData);
    }
  }

  $: {
    if (holdingTokenData && $typeWallet === "BUNDLE") {
      formatDataOverviewBundlePieChart();
    }
  }

  $: {
    if (dataPersonalizeTag && holdingTokenData && dataPieChartToken) {
      const listCategory = dataPersonalizeTag?.map((item: any) => {
        return {
          label: item.category,
          value: item.category,
        };
      });

      const tokenDataEachCategory = dataPersonalizeTag?.map((item: any) => {
        return {
          category: item.category,
          dataTokens: flatten(
            item.dataTag
              ?.filter((item: any) => item.name !== "Other")
              ?.map((item: any) => item.tokens),
          ),
        };
      });

      const formatTokenDataEachCategory = tokenDataEachCategory?.map(
        (item: any) => {
          const formatDataTokens = holdingTokenData?.map(
            (tokenHolding: any) => {
              const isSelected = item.dataTokens.some(
                (selectedToken: any) =>
                  selectedToken.contractAddress ===
                  tokenHolding.contractAddress,
              );

              const selected = item.dataTokens.filter(
                (selectedToken: any) =>
                  selectedToken.contractAddress ===
                  tokenHolding.contractAddress,
              );

              return {
                ...tokenHolding,
                [item.category]: isSelected ? selected[0].tag : "Other",
              };
            },
          );

          return {
            category: item.category,
            dataTokens: formatDataTokens,
          };
        },
      );

      tokenDataCustomCategory = formatTokenDataEachCategory?.map(
        (item: any) => {
          return {
            value: item.category,
            data: handleFormatDataPieChart(item.dataTokens, item.category),
            dataPie: handleFormatData(
              handleFormatDataPieChart(item.dataTokens, item.category),
            ),
            dataTable: handleFormatDataTable(item.dataTokens, item.category),
          };
        },
      );

      tokenDataHolding = {
        value: "All",
        data: holdingTokenData,
        dataPie: dataPieChartToken,
        dataTable: {
          data: {
            name: "All",
            data: holdingTokenData,
          },
          select: [],
        },
      };

      tokenDataChain = {
        value: "Chain",
        data: handleFormatDataPieChart(holdingTokenData, "chain"),
        dataPie: handleFormatData(
          handleFormatDataPieChart(holdingTokenData, "chain"),
        ),
        dataTable: handleFormatDataTable(holdingTokenData, "chain"),
      };

      tokenDataRank = {
        value: "rank",
        data: handleFormatDataPieChart(holdingTokenData, "rank"),
        dataPie: handleFormatData(
          handleFormatDataPieChart(holdingTokenData, "rank"),
        ),
        dataTable: handleFormatDataTable(holdingTokenData, "rank"),
      };

      tokenDataCategory = {
        value: "category",
        data: handleFormatDataPieChart(holdingTokenData, "category"),
        dataPie: handleFormatData(
          handleFormatDataPieChart(holdingTokenData, "category"),
        ),
        dataTable: handleFormatDataTable(holdingTokenData, "category"),
      };

      tokenDataSector = {
        value: "sector",
        data: handleFormatDataPieChart(holdingTokenData, "sector"),
        dataPie: handleFormatData(
          handleFormatDataPieChart(holdingTokenData, "sector"),
        ),
        dataTable: handleFormatDataTable(holdingTokenData, "sector"),
      };

      if (listCategory.length !== 0) {
        typeListCategory = [...typeListCategory, ...listCategory].reduce(
          (unique, o) => {
            if (
              !unique.some(
                (obj: any) => obj.label === o.label && obj.value === o.value,
              )
            ) {
              unique.push(o);
            }
            return unique;
          },
          [],
        );
      }
    }
  }

  const handleSetOptionChart = (
    data: any,
    dataTable: any,
    originalData: any,
  ) => {
    let formatSeriesData = data.map((item: any, index: number) => {
      if (data.length === 1) {
        return {
          ...item,
          itemStyle: {
            borderRadius: [10, 10, 10, 10],
          },
        };
      }

      if (index === 0) {
        return {
          ...item,
          itemStyle: {
            borderRadius: [10, 0, 0, 10],
          },
        };
      }

      if (index === data.length - 1) {
        return {
          ...item,
          itemStyle: {
            borderRadius: [0, 10, 10, 0],
          },
        };
      }

      return item;
    });

    const otherItem = formatSeriesData.find(
      (item: any) => item.name === "Other",
    );

    const indexOfOtherItem = formatSeriesData.indexOf(otherItem);

    if (otherItem && otherItem.data[0] < 0.5) {
      formatSeriesData = formatSeriesData
        .map((item: any, index: number) => {
          if (index === indexOfOtherItem - 1) {
            return {
              ...item,
              data: [item.data[0] + otherItem.data[0]],
            };
          }
          return item;
        })
        .filter((item: any) => item.name !== "Other");

      formatSeriesData = formatSeriesData.map((item: any, index: number) => {
        if (formatSeriesData.length === 1) {
          return {
            ...item,
            itemStyle: {
              borderRadius: [10, 10, 10, 10],
            },
          };
        }

        if (index === 0) {
          return {
            ...item,
            itemStyle: {
              borderRadius: [10, 0, 0, 10],
            },
          };
        }

        if (index === formatSeriesData.length - 1) {
          return {
            ...item,
            itemStyle: {
              borderRadius: [0, 10, 10, 0],
            },
          };
        }

        return item;
      });
    }

    option = {
      ...option,
      series: formatSeriesData,
    };

    handleSelectedTableTokenHolding(dataTable, originalData);
  };

  const handleFormatTooltip = (data: any) => {
    if (selectedType.value === "sector") {
      const selectedData = tokenDataSector.data.find(
        (item: any) => item.name === data.seriesName,
      );

      const selectedDataOther = tokenDataSector.dataPie.find(
        (item: any) => item?.name === "Other",
      );

      return selectedData
        ? {
            ...selectedData,
            value: selectedData.value_value,
          }
        : selectedDataOther
          ? {
              name: "Other",
              value: ($totalTokens * selectedDataOther?.data[0]) / 100,
            }
          : {};
    } else if (selectedType.value === "rank") {
      const selectedData = tokenDataRank.data.find(
        (item: any) => item.name === data.seriesName,
      );

      const selectedDataOther = tokenDataRank.dataPie.find(
        (item: any) => item?.name === "Other",
      );

      return selectedData
        ? {
            ...selectedData,
            value: selectedData.value_value,
          }
        : selectedDataOther
          ? {
              name: "Other",
              value: ($totalTokens * selectedDataOther?.data[0]) / 100,
            }
          : {};
    } else if (selectedType.value === "category") {
      const selectedData = tokenDataCategory.data.find(
        (item: any) => item.name === data.seriesName,
      );

      const selectedDataOther = tokenDataCategory.dataPie.find(
        (item: any) => item?.name === "Other",
      );

      return selectedData
        ? {
            ...selectedData,
            value: selectedData.value_value,
          }
        : selectedDataOther
          ? {
              name: "Other",
              value: ($totalTokens * selectedDataOther?.data[0]) / 100,
            }
          : {};
    } else if (selectedType.value === "All") {
      const selectedData = tokenDataHolding.data.find(
        (item: any) => item.symbol === data.seriesName,
      );

      const selectedDataOther: any = tokenDataHolding.dataPie.find(
        (item: any) => item?.name === "Other",
      );

      return selectedData
        ? selectedData
        : selectedDataOther
          ? {
              name: "Other",
              value: ($totalTokens * selectedDataOther?.data[0]) / 100,
            }
          : {};
    } else if (selectedType.value === "Account") {
      const selectedData = dataAccounts.data.find(
        (item: any) => item.name === data.seriesName,
      );

      const selectedDataOther = dataAccounts.dataPie.find(
        (item: any) => item?.name === "Other",
      );

      return selectedData
        ? {
            ...selectedData,
            value: selectedData.value_value,
          }
        : selectedDataOther
          ? {
              name: "Other",
              value: ($totalTokens * selectedDataOther?.data[0]) / 100,
            }
          : {};
    } else if (selectedType.value === "Chain") {
      const selectedData = tokenDataChain.data.find(
        (item: any) => item.name === data.seriesName,
      );

      const selectedDataOther = tokenDataChain.dataPie.find(
        (item: any) => item?.name === "Other",
      );

      return selectedData
        ? {
            ...selectedData,
            value: selectedData.value_value,
          }
        : selectedDataOther
          ? {
              name: "Other",
              value: ($totalTokens * selectedDataOther?.data[0]) / 100,
            }
          : {};
    }
  };

  $: {
    if (selectedType) {
      if (selectedType.value === "sector") {
        handleSetOptionChart(
          tokenDataSector.dataPie,
          tokenDataSector.dataTable,
          tokenDataSector.data,
        );
      } else if (selectedType.value === "rank") {
        handleSetOptionChart(
          tokenDataRank.dataPie,
          tokenDataRank.dataTable,
          tokenDataRank.data,
        );
      } else if (selectedType.value === "category") {
        handleSetOptionChart(
          tokenDataCategory.dataPie,
          tokenDataCategory.dataTable,
          tokenDataCategory.data,
        );
      } else if (selectedType.value === "All") {
        handleSetOptionChart(
          tokenDataHolding.dataPie,
          tokenDataHolding.dataTable,
          tokenDataHolding.data,
        );
      } else if (selectedType.value === "Account") {
        handleSetOptionChart(
          dataAccounts.dataPie,
          dataAccounts.dataTable,
          dataAccounts.data,
        );
      } else if (selectedType.value === "Chain") {
        handleSetOptionChart(
          tokenDataChain.dataPie,
          tokenDataChain.dataTable,
          tokenDataChain.data,
        );
      } else {
        const indexOfType = tokenDataCustomCategory
          ?.map((item: any) => item.value)
          ?.indexOf(selectedType.value);
        const selectedData = tokenDataCustomCategory[indexOfType];
        if (selectedData !== undefined) {
          handleSetOptionChart(
            selectedData.dataPie,
            selectedData.dataTable,
            selectedData.data,
          );
        }
      }
    }
  }

  $: theme = $isDarkMode ? "dark" : "white";
</script>

{#if $typeWallet !== "BTC" && $typeWallet === "BUNDLE"}
  <div class="flex md:justify-end justify-start mb-1">
    <div class="md:block hidden">
      <Select
        type="lang"
        positionSelectList="right-0"
        listSelect={typeListCategory}
        bind:selected={selectedType}
        isDisabledSelectWallet={false}
        indexWalletDisabled={-1}
      />
    </div>
    <div class="md:hidden block">
      <Select
        type="lang"
        positionSelectList="left-0"
        listSelect={typeListCategory}
        bind:selected={selectedType}
        isDisabledSelectWallet={false}
        indexWalletDisabled={-1}
      />
    </div>
  </div>
{/if}

{#if isLoading || isLoadingBreakdownTokens}
  <div class="flex justify-center items-center h-[68px]">
    {#if isNimbusVersion}
      <LoadingPremium />
    {:else}
      <Loading />
    {/if}
  </div>
{:else}
  <div>
    {#if holdingTokenData && holdingTokenData?.length === 0}
      <div
        class="h-[68px] flex justify-center items-center text-base text-gray-400"
      >
        {$t("Empty")}
      </div>
    {:else}
      <EChart
        id="tokens-overview"
        {theme}
        notMerge={true}
        {option}
        height={68}
      />
    {/if}
  </div>
{/if}

<style></style>
