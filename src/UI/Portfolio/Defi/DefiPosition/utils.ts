import { groupBy, flatten } from "lodash";
import { filterDuplicates } from "~/utils/index";

export const formatDataProtocol = (data: any) => {
  const formatData = data
    ?.filter((item: any) => !item?.error || item !== null)
    ?.map((item: any) => {
      return {
        ...item,
        protocol: item?.meta?.protocol?.name || "",
      };
    });
  const groupProtocol = groupBy(formatData, "protocol");
  const protocolList = Object.getOwnPropertyNames(groupProtocol);

  const formatPositionsData = protocolList.map((item) => {
    const groupType = groupBy(groupProtocol[item], "type");
    const typeList = Object.getOwnPropertyNames(groupType);

    return {
      chain: groupProtocol[item][0].chain || "",
      protocol: item,
      data: typeList.map((type) => {
        if (type === "Borrow") {
          const borrowData = groupType[type].filter((eachData) => {
            return eachData.input.find((inputItem: any) => !inputItem.type);
          });

          const borrowLendingStakingData = groupType[type].filter(
            (eachData) => {
              return eachData.input.find((inputItem: any) => inputItem.type);
            },
          );

          return {
            type,
            data: [
              {
                type,
                data: borrowData,
              },
              {
                type: "BorrowLendingStaking",
                data: borrowLendingStakingData,
              },
            ],
          };
        }
        return {
          type,
          data: groupType[type],
        };
      }),
    };
  });

  const positionsData = formatPositionsData
    .map((item) => {
      const protocolMeta = item.data.map((eachItem) => {
        return eachItem.data.map((eachProtocolData) => {
          if (eachProtocolData.data) {
            return eachProtocolData.data.map((data: any) => {
              return (
                data?.meta?.protocol || {
                  logo: "",
                  name: "",
                  url: "",
                }
              );
            });
          }

          return (
            eachProtocolData?.meta?.protocol || {
              logo: "",
              name: "",
              url: "",
            }
          );
        });
      });

      return {
        ...item,
        meta: filterDuplicates(flatten(flatten(protocolMeta)))[0],
        sum: handleCalculateTotalProtocol(item.data).totalProtocol,
        sumYield: handleCalculateTotalProtocol(item.data).totalYield,
      };
    })
    .sort((a, b) => {
      if (a.sum < b.sum) {
        return 1;
      }
      if (a.sum > b.sum) {
        return -1;
      }
      return 0;
    });

  return positionsData;
};

const handleCalculateTotalProtocol = (data: any) => {
  const formatData = data.map((item: any) => {
    return item.data.map((eachItem: any) => {
      if (eachItem.type === "Borrow") {
        const listCurrentTokens: any = flatten(
          eachItem.data.map((item: any) => {
            return item.current.tokens;
          }),
        );

        const listCurrentYield: any = flatten(
          eachItem.data.map((item: any) => {
            return item.current.yield;
          }),
        );

        const valueCurrent =
          (listCurrentTokens?.reduce(
            (prev: any, item: any) => prev + Number(item.value),
            0,
          ) || 0) +
          (listCurrentYield?.reduce(
            (prev: any, item: any) => prev + Number(item.value),
            0,
          ) || 0);

        const listInput: any = flatten(
          eachItem.data.map((item: any) => {
            return item.input;
          }),
        );

        const valueInput =
          listInput?.reduce(
            (prev: any, item: any) => prev + Number(item.value),
            0,
          ) || 0;

        return {
          totalInputValue: valueInput - valueCurrent,
          totalYieldCollected: 0,
        };
      }

      if (eachItem.type === "BorrowLendingStaking") {
        const listCurrentTokens: any = flatten(
          eachItem.data.map((item: any) => {
            return item.current.tokens;
          }),
        );

        const listCurrentYield: any = flatten(
          eachItem.data.map((item: any) => {
            return item.current.yield;
          }),
        );

        const valueCurrent =
          (listCurrentTokens?.reduce(
            (prev: any, item: any) => prev + Number(item.value),
            0,
          ) || 0) +
          (listCurrentYield?.reduce(
            (prev: any, item: any) => prev + Number(item.value),
            0,
          ) || 0);

        const listInputTokens: any = flatten(
          flatten(
            eachItem.data.map((item: any) => {
              return item.input.map((eachInput: any) => {
                return eachInput.current.tokens;
              });
            }),
          ),
        );

        const listInputYield: any = flatten(
          flatten(
            eachItem.data.map((item: any) => {
              return item.input.map((eachInput: any) => {
                return eachInput.current.yield;
              });
            }),
          ),
        );

        const valueInput =
          (listInputTokens?.reduce(
            (prev: any, item: any) => prev + Number(item.value),
            0,
          ) || 0) +
          (listInputYield?.reduce(
            (prev: any, item: any) => prev + Number(item.value),
            0,
          ) || 0);

        return {
          totalInputValue: valueInput - valueCurrent,
          totalYieldCollected: 0,
        };
      }

      return {
        totalInputValue:
          eachItem?.current?.tokens?.reduce(
            (prev: any, item: any) => prev + Number(item.value),
            0,
          ) || 0,
        totalYieldCollected:
          eachItem?.current?.yield?.reduce(
            (prev: any, item: any) => prev + Number(item.value),
            0,
          ) || 0,
      };
    });
  });
  const flattenData: any = flatten(formatData);

  const totalProtocolInput = flattenData.reduce(
    (prev: any, item: any) => prev + Number(item.totalInputValue),
    0,
  );

  const totalProtocolYieldCollected = flattenData.reduce(
    (prev: any, item: any) => prev + Number(item.totalYieldCollected),
    0,
  );

  return {
    totalProtocol: totalProtocolInput + totalProtocolYieldCollected,
    totalYield: totalProtocolYieldCollected,
  };
};

export const DEFIChainSupported = ["EVM", "MOVE", "TON", "SOL"];

export const DEFIPositionHistorySupported = ["EVM", "MOVE", "BUNDLE", "TON"];

export const positionHistorySupported = [
  // SUI
  "AftermathFinance",
  "BlueMove",
  "CETUS",
  "FlowX",
  "Kriya",
  "Navi",
  "Scallop",
  "Native Staking",
  "Suilend",
  "SuiSwap",
  "TubosFinance",
  "Typus",

  // TON
  "STON.fi",

  // EVM
  // "Shimmer",
  // "AerodromeV3",
  // "AerodromeLock",
  // "AerodromeV2",
  // "VFAT-AERODROME_BASE",
  // "QuickswapV3",
  // "Uniswap V2",
  "Uniswap V3",
  "Aerodrome Finance",
  "Velodrome Finance",
];
