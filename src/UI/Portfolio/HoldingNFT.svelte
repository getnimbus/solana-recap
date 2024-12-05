<script lang="ts">
  import { onMount } from "svelte";
  import VirtualList from "svelte-tiny-virtual-list";
  import { shorterName } from "~/utils/index";
  import { triggerToast } from "~/utils/functions";
  import { detectedChain } from "~/lib/chains";
  import { wallet, typeWallet, isDarkMode, user, realtimePrice } from "~/store";
  import mixpanel from "mixpanel-browser";
  import { nimbus } from "~/lib/network";
  import { isNimbusVersion } from "~/utils/constants";
  import { t } from "~/lib/i18n";

  import Table from "~/components/Table.svelte";
  import TooltipTitle from "~/components/TooltipTitle.svelte";
  import Tooltip from "~/components/Tooltip.svelte";
  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import OverlaySidebar from "~/components/OverlaySidebar.svelte";
  import Copy from "~/components/Copy.svelte";
  import Image from "~/components/Image.svelte";
  import AppOverlay from "~/components/Overlay.svelte";
  import Button from "~/components/Button.svelte";
  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import Loading from "~/components/Loading.svelte";
  import NftDetailSidebar from "~/UI/NFTDetail/NFTDetailSidebar.svelte";

  import TrendUp from "~/assets/trend-up.svg";
  import TrendDown from "~/assets/trend-down.svg";
  import GreenTick from "~/assets/green-tick.svg";

  export let checkScam;
  export let filterNFTType;
  export let dataNftHolding;
  export let defaultData;
  export let isLoading = false;
  export let handleUpdateTotalNftHolding = (data) => {};

  let data = dataNftHolding;

  let selectedItemIndex = -1;

  let showTooltipListNFT = false;
  let isShowTooltipName = false;

  let showSideNftDetail = false;

  let selectedNft: any;
  let selectedNftCollectionId: any;
  let selectedNftCollectionChain: any;

  let isShowTooltipReport = false;
  let isShowReport = false;
  let isShowReportTable = false;
  let isOldNFT = false;
  let reportReasonList = [];
  let isLoadingReportTrashNFT = false;

  let listTrashNFT: any = [];

  const reasonReport = [
    {
      id: "trash",
      content: "This NFT Collection is trash 🗑️",
    },
    {
      id: "scam",
      content: "This NFT Collection is the scam 🤬",
    },
    {
      id: "hate",
      content: "I hate this NFT Collection 😠",
    },
  ];

  const closeSideNFTDetail = (event) => {
    if (event.key === "Escape") {
      showSideNftDetail = false;
    }
  };

  const handleReportTrashNFT = async () => {
    isLoadingReportTrashNFT = true;
    try {
      let reason = "";

      if (document.getElementById("trash").checked) {
        reason += "Trash NFT Collection, ";
      }

      if (document.getElementById("hate").checked) {
        reason += "Hate NFT Collection, ";
      }

      if (document.getElementById("scam").checked) {
        reason += "Scam NFT Collection, ";
      }

      if (document.getElementById("outdated").checked) {
        reason += document.getElementById("reason").value;
      }
      const formData = {
        chain: document.getElementById("chain").value,
        contractAddress: document.getElementById("contract_address").value,
        reason: reason,
        contractName: selectedNft?.collection?.name,
        type: "nft",
      };
      await nimbus.post("/holding-nft/trash/report", formData);
      isLoadingReportTrashNFT = false;
      triggerToast("We will update after 2 minutes.", "success");

      listTrashNFT = [
        ...listTrashNFT,
        {
          chain: formData.chain,
          ca: formData.contractAddress,
        },
      ];
      localStorage.setItem("listTrashNFT", JSON.stringify(listTrashNFT));
    } catch (error) {
      isLoadingReportTrashNFT = false;
      triggerToast(
        "Something wrong when report NFT. Please try again!",
        "fail",
      );
      console.error("error:", error);
    } finally {
      selectedNft = {};
      isShowReportTable = false;
    }
  };

  const handleCalculateTotalNativeTokenPrice = (data) => {
    return data?.tokens?.reduce((prev, item) => prev + Number(item.price), 0);
  };

  const handleCalculateTotalCost = (data) => {
    return data?.tokens?.reduce((prev, item) => prev + Number(item.cost), 0);
  };

  const handleCalculateProfitAndLoss = (data) => {
    const totalNativeTokenPrice = handleCalculateTotalNativeTokenPrice(data);
    return totalNativeTokenPrice === 0
      ? 0
      : data?.current_native_token - (totalNativeTokenPrice || 0);
  };

  const handleCalculatePnlPercent = (data) => {
    const pnl = handleCalculateProfitAndLoss(data);
    const totalCostNativeToken = handleCalculateTotalNativeTokenPrice(data);
    return totalCostNativeToken === 0
      ? 0
      : pnl / Math.abs(totalCostNativeToken);
  };

  $: {
    if (!showSideNftDetail) {
      selectedNft = undefined;
      selectedNftCollectionId = undefined;
      selectedNftCollectionChain = undefined;
    }
  }

  $: {
    if (checkScam) {
      if (filterNFTType.value === 0) {
        data = dataNftHolding?.filter(
          (item: any) => item?.verify?.classification === "ham",
        );
      } else {
        data = dataNftHolding?.filter(
          (item: any) =>
            Number(item?.current_native_token) * item?.marketPrice >
              filterNFTType.value && item?.verify?.classification === "ham",
        );
      }
    } else {
      if (filterNFTType.value === 0) {
        data = dataNftHolding;
      } else {
        data = dataNftHolding?.filter(
          (item: any) =>
            Number(item?.current_native_token) * item?.marketPrice >
            filterNFTType.value,
        );
      }
    }
  }

  // check market price and update price real-time
  $: {
    if ($realtimePrice) {
      if (!isLoading) {
        if (data && data?.length !== 0) {
          data = data
            ?.map((item: any) => {
              const pnl = handleCalculateProfitAndLoss(item);
              const totalCostNativeToken =
                handleCalculateTotalNativeTokenPrice(item);

              const marketPrice = $realtimePrice[item?.nativeToken?.cmcId]
                ? Number($realtimePrice[item?.nativeToken?.cmcId]?.price)
                : Number(item?.marketPrice);

              return {
                ...item,
                pnl: totalCostNativeToken === 0 ? 0 : pnl * marketPrice,
                marketPrice,
                current_native_token: item?.floorPrice * item?.tokens?.length,
                current_value:
                  item?.floorPrice * marketPrice * item?.tokens?.length,
              };
            })
            ?.sort((a: any, b: any) => {
              if (a.current_native_token < b.current_native_token) {
                return 1;
              }
              if (a.current_native_token > b.current_native_token) {
                return -1;
              }
              return 0;
            });

          handleUpdateTotalNftHolding({
            totalSumNFT: data.reduce(
              (prev: any, item: any) => prev + item.current_value,
              0,
            ),
            totalSumPnL: data.reduce(
              (prev: any, item: any) => prev + item.pnl,
              0,
            ),
          });
        } else {
          handleUpdateTotalNftHolding({
            totalSumNFT: 0,
            totalSumPnL: 0,
          });
        }
      }
    }
  }

  $: {
    if (listTrashNFT) {
      data = data.filter(
        (item: any) =>
          !listTrashNFT.some(
            (trashItem: any) =>
              trashItem.ca.toLowerCase() === item.collectionId.toLowerCase(),
          ),
      );
    }
  }

  onMount(() => {
    const listTrashNFTStorage = localStorage.getItem("listTrashNFT");
    if (listTrashNFTStorage) {
      listTrashNFT = JSON.parse(listTrashNFTStorage);
    }
  });
</script>

<svelte:window on:keydown={closeSideNFTDetail} />

<Table>
  <span slot="desktop">
    {#if data && data.length === 0 && !isLoading}
      <div class="bg_f4f5f8 grid grid-cols-8">
        <div class="col-spans-2 pl-3 py-3 rounded-tl-[10px]">
          <div class="text-left text-xs uppercase font-medium">
            {$t("Collection")}
          </div>
        </div>

        <div class="col-spans-2 py-3">
          <div class="text-left text-xs uppercase font-medium">
            {$t("Balance")}
          </div>
        </div>

        <div class="py-3">
          <div class="text-right text-xs uppercase font-medium">
            <TooltipTitle
              tooltipText={false
                ? "The Floor price from Magic Eden marketplace. "
                : "The Floor price of last 24h, if there is no volume, the floor price is 0"}
              link={false ? "https://magiceden.io/ordinals" : ""}
            >
              {$t("Floor Price")}
            </TooltipTitle>
          </div>
        </div>

        <div class="py-3">
          <div class="text-right text-xs uppercase font-medium">
            {$t("Cost")}
          </div>
        </div>

        <div class="py-3">
          <div class="text-right text-xs uppercase font-medium">
            {$t("Current Value")}
          </div>
        </div>

        <div class="py-3 pr-3 rounded-tr-[10px]">
          <div class="text-right text-xs uppercase font-medium">
            <TooltipTitle
              tooltipText="Price NFTs now - Price NFTs at time you spent"
            >
              PnL
            </TooltipTitle>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-8">
        <div
          class="col-span-full flex justify-center items-center h-[465px] py-3 px-3 text-base text-gray-400"
        >
          {#if defaultData && defaultData.length === 0}
            {$t("Empty")}
          {:else}
            {$t("All NFT Collection less than")} ${filterNFTType.value}
          {/if}
        </div>
      </div>
    {:else}
      <VirtualList
        scrollDirection="vertical"
        width="100%"
        height={data.length < 10 ? data.length * 85 + 1 + 40 : 851}
        itemCount={data.length + 1}
        itemSize={(index) => {
          return index > 0 ? 85 : 40;
        }}
        stickyIndices={[0]}
      >
        <div
          class={`grid grid-cols-8 group transition-all ${index > 0 ? "cursor-pointer" : ""}`}
          slot="item"
          let:index
          let:style
          {style}
          on:mouseover={() => {
            if (index > 0) {
              if ($user && Object.keys($user).length !== 0) {
                selectedItemIndex = index - 1;
                isShowReport = true;
              }
            }
          }}
          on:mouseleave={() => {
            if (index > 0) {
              if ($user && Object.keys($user).length !== 0) {
                selectedItemIndex = -1;
                isShowReport = false;
              }
            }
          }}
          on:click={() => {
            if (index > 0) {
              showSideNftDetail = true;
              selectedNft = data[index - 1];
              selectedNftCollectionId = data[index - 1]?.collectionId;
              selectedNftCollectionChain = data[index - 1]?.nativeToken?.symbol;
              mixpanel.track("nft_detail_page", {
                address: $wallet,
                collection_type: data[index - 1].collectionId,
              });
            }
          }}
        >
          {#if index === 0}
            <div class="bg_f4f5f8 col-spans-2 pl-3 py-3 rounded-tl-[10px]">
              <div class="text-left text-xs uppercase font-medium">
                {$t("Collection")}
              </div>
            </div>

            <div class="bg_f4f5f8 col-spans-2 py-3">
              <div class="text-left text-xs uppercase font-medium">
                {$t("Balance")}
              </div>
            </div>

            <div class="bg_f4f5f8 py-3">
              <div class="text-right text-xs uppercase font-medium">
                <TooltipTitle
                  tooltipText={false
                    ? "The Floor price from Magic Eden marketplace. "
                    : "The Floor price of last 24h, if there is no volume, the floor price is 0"}
                  link={false ? "https://magiceden.io/ordinals" : ""}
                >
                  {$t("Floor Price")}
                </TooltipTitle>
              </div>
            </div>

            <div class="bg_f4f5f8 py-3">
              <div class="text-right text-xs uppercase font-medium">
                {$t("Cost")}
              </div>
            </div>

            <div class="bg_f4f5f8 py-3">
              <div class="text-right text-xs uppercase font-medium">
                {$t("Current Value")}
              </div>
            </div>

            <div class="bg_f4f5f8 py-3 pr-3 rounded-tr-[10px]">
              <div class="text-right text-xs uppercase font-medium">
                <TooltipTitle
                  tooltipText="Price NFTs now - Price NFTs at time you spent"
                >
                  PnL
                </TooltipTitle>
              </div>
            </div>
          {:else}
            <div
              class={`col-spans-2 pl-3 py-3 ${
                $isDarkMode
                  ? "bg-[#131313] group-hover:bg-[#000]"
                  : "bg-white group-hover:bg-gray-100"
              }`}
              style={`${data.length - 1 === index - 1 ? "border-bottom-left-radius: 10px;" : ""}`}
            >
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <div
                    class="text-sm font-medium flex justify-start relative"
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
                    {data[index - 1]?.collection?.name
                      ? data[index - 1]?.collection?.name.length > 24
                        ? shorterName(data[index - 1]?.collection?.name, 20)
                        : data[index - 1]?.collection?.name
                      : "N/A"}

                    {#if isShowTooltipName && selectedItemIndex === index - 1 && data[index - 1]?.collection?.name?.length > 24}
                      <div
                        class="absolute -top-8 left-0"
                        style="z-index: 2147483648;"
                      >
                        <Tooltip text={data[index - 1]?.collection?.name} />
                      </div>
                    {/if}
                  </div>

                  {#if data[index - 1]?.collection?.verified}
                    <img
                      src={GreenTick}
                      alt=""
                      class="w-[18px] h-[18px] block"
                    />
                  {/if}

                  {#if isShowReport && selectedItemIndex === index - 1}
                    <div
                      class="relative w-5 cursor-pointer"
                      on:click={(e) => {
                        e.stopPropagation();
                        isShowReportTable = true;
                        selectedNft = data[index - 1];
                      }}
                      on:mouseover={() => {
                        if (index > 0) {
                          selectedItemIndex = index - 1;
                          isShowTooltipReport = true;
                        }
                      }}
                      on:mouseleave={() => {
                        if (index > 0) {
                          selectedItemIndex = -1;
                          isShowTooltipReport = false;
                        }
                      }}
                    >
                      <div class="xl:w-[16px] xl:h-[16px] w-[26px] h-[26px]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <g
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                          >
                            <path d="M0 0h24v24H0z" />
                            <path
                              fill="currentColor"
                              d="M19 4c.852 0 1.297.986.783 1.623l-.076.084L15.915 9.5l3.792 3.793c.603.602.22 1.614-.593 1.701L19 15H6v6a1 1 0 0 1-.883.993L5 22a1 1 0 0 1-.993-.883L4 21V5a1 1 0 0 1 .883-.993L5 4h14z"
                            />
                          </g>
                        </svg>
                        {#if isShowTooltipReport && selectedItemIndex === index - 1}
                          <div
                            class="absolute -top-8 left-1/2 transform -translate-x-1/2"
                            style="z-index: 2147483648;"
                          >
                            <Tooltip text="Report" />
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>

                {#if ["EVM", "BUNDLE"].includes($typeWallet)}
                  <img
                    src={detectedChain(data[index - 1]?.nativeToken?.symbol)
                      ?.logo}
                    alt=""
                    width="20"
                    height="20"
                    class="rounded-full"
                  />
                {/if}
              </div>

              {#if data[index - 1]?.verify?.classification === "scam"}
                <div
                  class="text-[10px] rounded-[30px] px-2 py-1 w-max mt-1"
                  style="background-color: #FF5733; color: #FFD3B6;"
                >
                  SCAM
                </div>
              {/if}
            </div>

            <div
              class={`col-spans-2 py-3 ${
                $isDarkMode
                  ? "bg-[#131313] group-hover:bg-[#000]"
                  : "bg-white group-hover:bg-gray-100"
              }`}
            >
              <div class="relative">
                <div
                  class="flex justify-start w-max"
                  on:mouseenter={() => {
                    if (index > 0) {
                      selectedItemIndex = index - 1;
                      showTooltipListNFT = true;
                    }
                  }}
                  on:mouseleave={() => {
                    if (index > 0) {
                      selectedItemIndex = -1;
                      showTooltipListNFT = false;
                    }
                  }}
                >
                  {#if data[index - 1]?.tokens?.length > 5}
                    {#each data[index - 1]?.tokens.slice(0, 4) as token, index}
                      <div
                        class={`xl:w-9 xl:h-9 w-12 h-12 rounded-md border-2 border-white overflow-hidden ${
                          index > 0 && "-ml-2"
                        }`}
                      >
                        <Image
                          logo={token?.imageUrl}
                          defaultLogo="https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384"
                        />
                      </div>
                    {/each}
                    <div class="relative xl:w-9 xl:h-9 w-12 h-12">
                      <div
                        class="xl:w-9 xl:h-9 w-12 h-12 rounded-md border-2 border-white overflow-hidden -ml-2"
                      >
                        <Image
                          logo={data[index - 1]?.tokens[4].imageUrl}
                          defaultLogo="https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384"
                        />
                      </div>
                      <div
                        class="absolute top-0 -left-2 w-full h-full bg-[#00000066] text-white text-center flex justify-center items-center pb-2 rounded-md"
                      >
                        ...
                      </div>
                    </div>
                    {#if showTooltipListNFT && selectedItemIndex === index - 1 && data[index - 1]?.tokens?.length > 5}
                      <div
                        class="absolute -top-7 left-0"
                        style="z-index: 2147483648;"
                      >
                        <Tooltip
                          text={`${data[index - 1]?.tokens?.length} NFTs on collection ${data[index - 1]?.collection?.name}`}
                        />
                      </div>
                    {/if}
                  {:else}
                    {#each data[index - 1]?.tokens as token, index}
                      <div
                        class={`xl:w-9 xl:h-9 w-12 h-12 rounded-md border-2 border-white overflow-hidden ${
                          index > 0 && "-ml-2"
                        }`}
                      >
                        <Image
                          logo={token?.imageUrl}
                          defaultLogo="https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384"
                        />
                      </div>
                    {/each}
                  {/if}
                </div>
              </div>
            </div>

            <div
              class={`py-3 ${
                $isDarkMode
                  ? "bg-[#131313] group-hover:bg-[#000]"
                  : "bg-white group-hover:bg-gray-100"
              }`}
            >
              <div
                class="text-sm text_00000099 font-medium flex flex-col items-end gap-1"
              >
                <div class="w-max flex items-center gap-1">
                  <TooltipNumber
                    number={Number(data[index - 1]?.floorPrice)}
                    type="balance"
                  />
                  <div>{data[index - 1]?.nativeToken?.symbol || ""}</div>
                </div>
                <div class="w-max">
                  <TooltipNumber
                    number={Number(data[index - 1]?.floorPrice) *
                      data[index - 1]?.marketPrice}
                    type="value"
                  />
                </div>
              </div>
            </div>

            <div
              class={`py-3 ${
                $isDarkMode
                  ? "bg-[#131313] group-hover:bg-[#000]"
                  : "bg-white group-hover:bg-gray-100"
              }`}
            >
              <div
                class="text-sm text_00000099 font-medium flex flex-col items-end gap-1"
              >
                <div class="w-max flex items-center gap-1">
                  <TooltipNumber
                    number={handleCalculateTotalNativeTokenPrice(
                      data[index - 1],
                    )}
                    type="balance"
                    personalValue
                  />
                  <div>
                    {data[index - 1]?.nativeToken?.symbol || ""}
                  </div>
                </div>
                <div class="w-max">
                  <TooltipNumber
                    number={handleCalculateTotalCost(data[index - 1])}
                    type="value"
                    personalValue
                  />
                </div>
              </div>
            </div>

            <div
              class={`py-3 ${
                $isDarkMode
                  ? "bg-[#131313] group-hover:bg-[#000]"
                  : "bg-white group-hover:bg-gray-100"
              }`}
            >
              <div
                class="text-sm text_00000099 font-medium flex flex-col items-end gap-1"
              >
                <div class="w-max flex items-center gap-1">
                  <TooltipNumber
                    number={Number(data[index - 1]?.current_native_token)}
                    type="balance"
                  />
                  <div>
                    {data[index - 1]?.nativeToken?.symbol || ""}
                  </div>
                </div>
                <TooltipNumber
                  number={Number(data[index - 1]?.current_native_token) *
                    data[index - 1]?.marketPrice}
                  type="value"
                />
              </div>
            </div>

            <div
              class={`py-3 pr-3 ${
                $isDarkMode
                  ? "bg-[#131313] group-hover:bg-[#000]"
                  : "bg-white group-hover:bg-gray-100"
              }`}
            >
              <div
                class="flex items-center justify-end gap-1 text-sm font-medium"
              >
                <div class="flex flex-col">
                  <div
                    class={`flex justify-end gap-1 ${
                      handleCalculateProfitAndLoss(data[index - 1]) !== 0
                        ? handleCalculateProfitAndLoss(data[index - 1]) >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                        : "text_00000099"
                    }`}
                  >
                    <TooltipNumber
                      number={Math.abs(
                        handleCalculateProfitAndLoss(data[index - 1]),
                      )}
                      type="balance"
                      personalValue
                    />
                    <div>
                      {data[index - 1]?.nativeToken?.symbol || ""}
                    </div>
                  </div>

                  <div
                    class={`flex justify-end ${
                      handleCalculateProfitAndLoss(data[index - 1]) !== 0
                        ? handleCalculateProfitAndLoss(data[index - 1]) >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                        : "text_00000099"
                    }`}
                  >
                    <TooltipNumber
                      number={Math.abs(
                        handleCalculateProfitAndLoss(data[index - 1]),
                      ) * data[index - 1]?.marketPrice}
                      type="value"
                      personalValue
                    />
                  </div>

                  <div class="flex items-center justify-end gap-1">
                    <div
                      class={`flex items-center ${
                        handleCalculatePnlPercent(data[index - 1]) !== 0
                          ? handleCalculatePnlPercent(data[index - 1]) >= 0
                            ? "text-[#00A878]"
                            : "text-red-500"
                          : "text_00000099"
                      }`}
                    >
                      <TooltipNumber
                        number={Math.abs(
                          handleCalculatePnlPercent(data[index - 1]),
                        ) * 100}
                        type={Math.abs(
                          Number(handleCalculatePnlPercent(data[index - 1])),
                        ) > 100
                          ? "balance"
                          : "percent"}
                      />
                      <span>%</span>
                    </div>
                    {#if handleCalculatePnlPercent(data[index - 1]) !== 0}
                      <img
                        src={handleCalculatePnlPercent(data[index - 1]) >= 0
                          ? TrendUp
                          : TrendDown}
                        alt="trend"
                        class="mb-1"
                      />
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </VirtualList>
    {/if}

    {#if isLoading}
      <div
        class={`w-full h-full grid grid-cols-8 ${
          $isDarkMode ? "bg-[#131313]" : "bg-white"
        }`}
      >
        <div
          class="col-span-full flex justify-center items-center h-full py-3 px-3"
        >
          {#if isNimbusVersion}
            <LoadingPremium />
          {:else}
            <Loading />
          {/if}
        </div>
      </div>
    {/if}
  </span>
  <span slot="mobile">
    {#if data && data.length === 0 && !isLoading}
      <div
        class="flex justify-center items-center h-full py-3 px-3 text-base text-gray-400"
      >
        {#if defaultData && defaultData.length === 0}
          {$t("Empty")}
        {:else}
          {$t("All NFT Collection less than")} ${filterNFTType.value}
        {/if}
      </div>
    {:else}
      <VirtualList
        scrollDirection="vertical"
        width="100%"
        height={data.length < 10 ? data.length * 450 : 940}
        itemCount={data.length}
        itemSize={450}
      >
        <div
          class="flex flex-col gap-4 border-b-[1px] border_0000000d last:border-none py-4"
          slot="item"
          let:index
          let:style
          {style}
        >
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <div
                  class="text-lg font-medium flex justify-start relative"
                  on:mouseover={() => {
                    selectedItemIndex = index;
                    isShowTooltipName = true;
                  }}
                  on:mouseleave={() => {
                    selectedItemIndex = -1;
                    isShowTooltipName = false;
                  }}
                >
                  {data[index]?.collection?.name
                    ? data[index]?.collection?.name.length > 24
                      ? shorterName(data[index]?.collection?.name, 20)
                      : data[index]?.collection?.name
                    : "N/A"}

                  {#if isShowTooltipName && selectedItemIndex === index && data[index]?.collection?.name?.length > 24}
                    <div
                      class="absolute -top-8 left-0"
                      style="z-index: 2147483648;"
                    >
                      <Tooltip text={data[index]?.collection?.name} />
                    </div>
                  {/if}
                </div>

                {#if data[index]?.collection?.verified}
                  <img src={GreenTick} alt="" class="w-[18px] h-[18px] block" />
                {/if}
              </div>

              {#if ["EVM", "BUNDLE"].includes($typeWallet)}
                <img
                  src={detectedChain(data[index]?.nativeToken?.symbol)?.logo}
                  alt=""
                  width="20"
                  height="20"
                  class="rounded-full"
                />
              {/if}
            </div>

            {#if data[index]?.verify?.classification === "scam"}
              <div
                class="text-xs rounded-[30px] px-2 py-1 w-max"
                style="background-color: #FF5733; color: #FFD3B6;"
              >
                SCAM
              </div>
            {/if}
          </div>

          <div class="relative">
            <div
              class="flex justify-start w-max"
              on:mouseenter={() => {
                selectedItemIndex = index;
                showTooltipListNFT = true;
              }}
              on:mouseleave={() => {
                selectedItemIndex = -1;
                showTooltipListNFT = false;
              }}
            >
              {#if data[index]?.tokens?.length > 5}
                {#each data[index]?.tokens.slice(0, 4) as token, index}
                  <div
                    class={`xl:w-9 xl:h-9 w-12 h-12 rounded-md border-2 border-white overflow-hidden ${
                      index > 0 && "-ml-2"
                    }`}
                  >
                    <Image
                      logo={token?.imageUrl}
                      defaultLogo="https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384"
                    />
                  </div>
                {/each}
                <div class="relative xl:w-9 xl:h-9 w-12 h-12">
                  <div
                    class="xl:w-9 xl:h-9 w-12 h-12 rounded-md border-2 border-white overflow-hidden -ml-2"
                  >
                    <Image
                      logo={data[index]?.tokens[4].imageUrl}
                      defaultLogo="https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384"
                    />
                  </div>
                  <div
                    class="absolute top-0 -left-2 w-full h-full bg-[#00000066] text-white text-center flex justify-center items-center pb-2 rounded-md"
                  >
                    ...
                  </div>
                </div>
                {#if showTooltipListNFT && selectedItemIndex === index && data[index]?.tokens?.length > 5}
                  <div
                    class="absolute -top-7 left-0"
                    style="z-index: 2147483648;"
                  >
                    <Tooltip
                      text={`${data[index]?.tokens?.length} NFTs on collection ${data[index]?.collection?.name}`}
                    />
                  </div>
                {/if}
              {:else}
                {#each data[index]?.tokens as token, index}
                  <div
                    class={`xl:w-9 xl:h-9 w-12 h-12 rounded-md border-2 border-white overflow-hidden ${
                      index > 0 && "-ml-2"
                    }`}
                  >
                    <Image
                      logo={token?.imageUrl}
                      defaultLogo="https://i.seadn.io/gae/TLlpInyXo6n9rzaWHeuXxM6SDoFr0cFA0TWNpFQpv5-oNpXlYKzxsVUynd0XUIYBW2G8eso4-4DSQuDR3LC_2pmzfHCCrLBPcBdU?auto=format&dpr=1&w=384"
                    />
                  </div>
                {/each}
              {/if}
            </div>
          </div>

          <div class="flex justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              <TooltipTitle
                tooltipText={false
                  ? "The Floor price from Magic Eden marketplace. "
                  : "The Floor price of last 24h, if there is no volume, the floor price is 0"}
                link={false ? "https://magiceden.io/ordinals" : ""}
              >
                {$t("Floor Price")}
              </TooltipTitle>
            </div>
            <div
              class="text-sm text_00000099 font-medium flex flex-col items-end gap-1"
            >
              <div class="w-max flex items-center gap-1">
                <TooltipNumber
                  number={Number(data[index]?.floorPrice)}
                  type="balance"
                />
                <div>{data[index]?.nativeToken?.symbol || ""}</div>
              </div>
              <div class="w-max">
                <TooltipNumber
                  number={Number(data[index]?.floorPrice) *
                    data[index]?.marketPrice}
                  type="value"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Cost")}
            </div>
            <div
              class="text-sm text_00000099 font-medium flex flex-col items-end gap-1"
            >
              <div class="w-max flex items-center gap-1">
                <TooltipNumber
                  number={handleCalculateTotalNativeTokenPrice(data[index])}
                  type="balance"
                  personalValue
                />
                <div>
                  {data[index]?.nativeToken?.symbol || ""}
                </div>
              </div>
              <div class="w-max">
                <TooltipNumber
                  number={handleCalculateTotalCost(data[index])}
                  type="value"
                  personalValue
                />
              </div>
            </div>
          </div>

          <div class="flex justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Current Value")}
            </div>
            <div
              class="text-sm text_00000099 font-medium flex flex-col items-end gap-1"
            >
              <div class="w-max flex items-center gap-1">
                <TooltipNumber
                  number={Number(data[index]?.current_native_token)}
                  type="balance"
                />
                <div>
                  {data[index]?.nativeToken?.symbol || ""}
                </div>
              </div>
              <TooltipNumber
                number={Number(data[index]?.current_native_token) *
                  data[index]?.marketPrice}
                type="value"
              />
            </div>
          </div>

          <div class="flex justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              <TooltipTitle
                tooltipText="Price NFTs now - Price NFTs at time you spent"
              >
                PnL
              </TooltipTitle>
            </div>
            <div
              class="flex items-center justify-end gap-1 text-sm font-medium"
            >
              <div class="flex flex-col">
                <div
                  class={`flex justify-end gap-1 ${
                    handleCalculateProfitAndLoss(data[index]) !== 0
                      ? handleCalculateProfitAndLoss(data[index]) >= 0
                        ? "text-[#00A878]"
                        : "text-red-500"
                      : "text_00000099"
                  }`}
                >
                  <TooltipNumber
                    number={Math.abs(handleCalculateProfitAndLoss(data[index]))}
                    type="balance"
                    personalValue
                  />
                  <div>
                    {data[index]?.nativeToken?.symbol || ""}
                  </div>
                </div>

                <div
                  class={`flex justify-end ${
                    handleCalculateProfitAndLoss(data[index]) !== 0
                      ? handleCalculateProfitAndLoss(data[index]) >= 0
                        ? "text-[#00A878]"
                        : "text-red-500"
                      : "text_00000099"
                  }`}
                >
                  <TooltipNumber
                    number={Math.abs(
                      handleCalculateProfitAndLoss(data[index]),
                    ) * data[index]?.marketPrice}
                    type="value"
                    personalValue
                  />
                </div>

                <div class="flex items-center justify-end gap-1">
                  <div
                    class={`flex items-center ${
                      handleCalculatePnlPercent(data[index]) !== 0
                        ? handleCalculatePnlPercent(data[index]) >= 0
                          ? "text-[#00A878]"
                          : "text-red-500"
                        : "text_00000099"
                    }`}
                  >
                    <TooltipNumber
                      number={Math.abs(handleCalculatePnlPercent(data[index])) *
                        100}
                      type={Math.abs(
                        Number(handleCalculatePnlPercent(data[index])),
                      ) > 100
                        ? "balance"
                        : "percent"}
                    />
                    <span>%</span>
                  </div>
                  {#if handleCalculatePnlPercent(data[index]) !== 0}
                    <img
                      src={handleCalculatePnlPercent(data[index]) >= 0
                        ? TrendUp
                        : TrendDown}
                      alt="trend"
                      class="mb-1"
                    />
                  {/if}
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-start">
            <div class="text-right text-sm uppercase font-medium">
              {$t("Action")}
            </div>
            <div
              class="cursor-pointer"
              on:click={() => {
                showSideNftDetail = true;
                selectedNft = data[index];
                selectedNftCollectionId = data[index]?.collectionId;
                selectedNftCollectionChain = data[index]?.nativeToken?.symbol;
                mixpanel.track("nft_detail_page", {
                  address: $wallet,
                  collection_type: data[index].collectionId,
                });
              }}
            >
              <div class="w-[20px] h-[20px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  version="1.1"
                  viewBox="0 0 256 256"
                  xml:space="preserve"
                >
                  <defs />
                  <g
                    style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                    fill={$isDarkMode ? "white" : "#00000080"}
                    transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
                  >
                    <path
                      d="M 87.994 0 H 69.342 c -1.787 0 -2.682 2.16 -1.418 3.424 l 5.795 5.795 l -33.82 33.82 L 28.056 31.196 l -3.174 -3.174 c -1.074 -1.074 -2.815 -1.074 -3.889 0 L 0.805 48.209 c -1.074 1.074 -1.074 2.815 0 3.889 l 3.174 3.174 c 1.074 1.074 2.815 1.074 3.889 0 l 15.069 -15.069 l 14.994 14.994 c 1.074 1.074 2.815 1.074 3.889 0 l 1.614 -1.614 c 0.083 -0.066 0.17 -0.125 0.247 -0.202 l 37.1 -37.1 l 5.795 5.795 C 87.84 23.34 90 22.445 90 20.658 V 2.006 C 90 0.898 89.102 0 87.994 0 z"
                      style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                      transform=" matrix(1 0 0 1 0 0) "
                      fill={$isDarkMode ? "white" : "#00000080"}
                      stroke-linecap="round"
                    />
                    <path
                      d="M 65.626 37.8 v 49.45 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 23.518 L 65.626 37.8 z"
                      style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                      fill={$isDarkMode ? "white" : "#00000080"}
                      transform=" matrix(1 0 0 1 0 0) "
                      stroke-linecap="round"
                    />
                    <path
                      d="M 47.115 56.312 V 87.25 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 42.03 L 47.115 56.312 z"
                      style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                      fill={$isDarkMode ? "white" : "#00000080"}
                      transform=" matrix(1 0 0 1 0 0) "
                      stroke-linecap="round"
                    />
                    <path
                      d="M 39.876 60.503 c -1.937 0 -3.757 -0.754 -5.127 -2.124 l -6.146 -6.145 V 87.25 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 59.844 C 41.952 60.271 40.933 60.503 39.876 60.503 z"
                      style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                      fill={$isDarkMode ? "white" : "#00000080"}
                      transform=" matrix(1 0 0 1 0 0) "
                      stroke-linecap="round"
                    />
                    <path
                      d="M 22.937 46.567 L 11.051 58.453 c -0.298 0.298 -0.621 0.562 -0.959 0.8 V 87.25 c 0 1.519 1.231 2.75 2.75 2.75 h 8.782 c 1.519 0 2.75 -1.231 2.75 -2.75 V 48.004 L 22.937 46.567 z"
                      style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;"
                      fill={$isDarkMode ? "white" : "#00000080"}
                      transform=" matrix(1 0 0 1 0 0) "
                      stroke-linecap="round"
                    />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </VirtualList>
    {/if}

    {#if isLoading}
      <div class="flex justify-center items-center h-full py-3 px-3">
        {#if isNimbusVersion}
          <LoadingPremium />
        {:else}
          <Loading />
        {/if}
      </div>
    {/if}
  </span>
</Table>

<!-- Modal report spam/trash nft  -->
<AppOverlay
  clickOutSideToClose
  isOpen={isShowReportTable}
  on:close={() => {
    isShowReportTable = false;
    isOldNFT = false;
    selectedNft = {};
  }}
>
  <div class="flex flex-col gap-4 xl:mt-0 mt-4">
    <div class="font-medium title-3">{$t("Blacklist NFT Collection")}</div>
    <form
      on:submit|preventDefault={handleReportTrashNFT}
      class="flex flex-col xl:gap-3 gap-6"
    >
      <div class="flex flex-col gap-6 xl:gap-3">
        <div
          class={`flex flex-col gap-1 input-2 input-border w-full py-[6px] px-3 ${
            !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
          }`}
        >
          <div
            class={`text-base font-medium ${
              $isDarkMode ? "text-gray-400" : "text-[#666666]"
            }`}
          >
            {$t("Chain")}
          </div>
          <input
            type="text"
            id="chain"
            name="chain"
            value={selectedNft?.nativeToken?.symbol}
            class={`p-0 border-none focus:outline-none focus:ring-0 text-sm font-normal ${
              !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
            } ${
              $isDarkMode
                ? "text-white"
                : "text-[#5E656B] placeholder-[#5E656B]"
            }`}
            disabled
          />
        </div>

        <div
          class={`flex flex-col gap-1 input-2 input-border w-full py-[6px] px-3 ${
            !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
          }`}
        >
          <div
            class={`text-base font-medium ${
              $isDarkMode ? "text-gray-400" : "text-[#666666]"
            }`}
          >
            {$t("Collection ID")}
          </div>
          <input
            type="text"
            id="contract_address"
            name="contract_address"
            value={selectedNft?.collectionId}
            class={`p-0 border-none focus:outline-none focus:ring-0 text-sm font-normal ${
              !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
            } ${
              $isDarkMode
                ? "text-white"
                : "text-[#5E656B] placeholder-[#5E656B]"
            }`}
            disabled
          />
        </div>

        <div
          class={`flex flex-col gap-3 input-2 input-border w-full py-[8px] px-3 ${
            (reportReasonList.length !== 0 || isOldNFT) && !$isDarkMode
              ? "bg-[#F0F2F7]"
              : "bg_fafafbff"
          }`}
        >
          <div class="text-base text-[#666666] font-medium">{$t("Reason")}</div>
          {#each reasonReport as item}
            <div class="flex items-center gap-2 cursor-pointer w-max">
              <input
                type="checkbox"
                name={item.id}
                id={item.id}
                value={item.id}
                bind:group={reportReasonList}
                class="cursor-pointer relative w-5 h-5 appearance-none rounded-[0.25rem] border outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
              />
              <label
                for={item.id}
                class="text-sm font-normal text-[#5E656B] cursor-pointer"
              >
                {$t(item.content)}
              </label>
            </div>
          {/each}

          <div class="flex items-center gap-2 cursor-pointer w-max">
            <input
              type="checkbox"
              name="outdated"
              id="outdated"
              on:change={(event) => {
                isOldNFT = event.target.checked;
              }}
              class="cursor-pointer relative w-5 h-5 appearance-none rounded-[0.25rem] border outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
            />
            <label
              for="outdated"
              class="text-sm font-normal text-[#5E656B] cursor-pointer"
            >
              {$t("The NFT Collection is outdate")}
            </label>
          </div>

          {#if isOldNFT}
            <textarea
              placeholder="Please type info about that NFT"
              rows="5"
              id="reason"
              name="reason"
              class={`mb-2 p-0 input-2 input-border w-full py-[6px] px-3 focus:outline-none focus:ring-0 text-sm font-normal ${
                !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
              } ${
                $isDarkMode
                  ? "text-white"
                  : "text-[#5E656B] placeholder-[#5E656B]"
              }`}
            />
          {/if}
        </div>

        <div class="flex justify-end gap-4">
          <div class="w-[120px]">
            <Button
              variant="secondary"
              on:click={() => {
                selectedNft = {};
                isShowReportTable = false;
                isOldNFT = false;
              }}
            >
              {$t("Cancel")}
            </Button>
          </div>
          <div class="w-[120px]">
            <Button
              type="submit"
              variant="tertiary"
              isLoading={isLoadingReportTrashNFT}
              disabled={isLoadingReportTrashNFT}
            >
              {$t("Report")}
            </Button>
          </div>
        </div>
      </div>
    </form>
  </div>
</AppOverlay>

<!-- Sidebar NFT Detail -->
<OverlaySidebar isOpen={showSideNftDetail}>
  <div class="flex justify-between items-start">
    <div
      class="text-5xl text-gray-500 cursor-pointer"
      on:click|stopPropagation={() => {
        showSideNftDetail = false;
      }}
    >
      &times;
    </div>
    <div class="flex flex-col items-end">
      {#if selectedNft?.verify?.classification === "scam"}
        <div
          class="text-xs rounded-[30px] px-2 py-1 w-max"
          style="background-color: #FF5733; color: #FFD3B6;"
        >
          SCAM
        </div>
      {/if}
      <div class="flex items-center gap-2">
        <div class="text-xl font-semibold">
          {selectedNft?.collection?.name || "N/A"}
        </div>
        {#if selectedNft?.collection?.verified}
          <img src={GreenTick} alt="" class="w-[22px] h-[22px] block" />
        {/if}
      </div>
      <div class="text-base">
        <Copy
          address={selectedNft &&
            selectedNft?.tokens &&
            selectedNft?.tokens?.length !== 0 &&
            selectedNft?.tokens[0]?.contractAddress}
          isShorten
          iconColor={`${$isDarkMode ? "#fff" : "#000"}`}
          color={`${$isDarkMode ? "#fff" : "#000"}`}
        />
      </div>
    </div>
  </div>

  {#if showSideNftDetail}
    <NftDetailSidebar
      {selectedNft}
      {selectedNftCollectionId}
      {selectedNftCollectionChain}
    />
  {/if}
</OverlaySidebar>

<style>
  :global(body) .bg_fafafbff {
    background: #fafafbff;
  }
  :global(body.dark) .bg_fafafbff {
    background: #212121;
  }
</style>
