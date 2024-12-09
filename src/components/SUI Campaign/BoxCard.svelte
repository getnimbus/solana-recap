<script lang="ts">
  import { isDarkMode, suiWalletInstance, userPublicAddress } from "~/store";
  import { useQueryClient } from "@tanstack/svelte-query";
  import { nimbus } from "~/lib/network";
  import type { WalletState } from "nimbus-sui-kit";
  import { triggerToast, triggerFirework } from "~/utils/functions";
  import { SuiConnector } from "nimbus-sui-kit";
  import { SUIRPC } from "~/utils/constants";

  import ReactAdapter from "~/components/ReactAdapter.svelte";

  export let isClaimable = false;
  export let isRedeem = false;
  export let data;
  export let handleRedeemBox = (value) => {};
  export let isLoadingRedeem;
  export let totalPoint;
  export let triggerClaimSuccess = (data) => {};

  import Copy from "~/components/Copy.svelte";
  import Button from "~/components/Button.svelte";

  import Diamond from "~/assets/Diamond.png";
  import Crown from "~/assets/crown.svg";

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
      ($suiWalletInstance as WalletState)?.toggleSelect();
    }
  };

  const widgetConfig = {
    walletFn: (wallet) => {
      suiWalletInstance.update((n) => (n = wallet));
    },
    onConnectSuccess,
    onConnectError,
  };

  const queryClient = useQueryClient();

  let isLoadingClaim = false;
  let isClickClaim = false;
  let selectedData;

  const handleClaim = async () => {
    if (
      ($suiWalletInstance as WalletState) &&
      ($suiWalletInstance as WalletState)?.connected &&
      isClickClaim
    ) {
      isLoadingClaim = true;
      try {
        const { signature } = await handleSignAddressMessage(
          `I am confirming that I want to claim the reward with id ${data.id} to address ${$suiWalletInstance.account?.address}`,
        );

        if (signature) {
          const res: any = await nimbus.post(
            `/v2/rewards/${data.id}/token-claim`,
            {
              publicAddress: $suiWalletInstance.account?.address,
              signature,
            },
          );

          if (res && res?.error) {
            triggerToast(
              res?.error ||
                "Something went wrong while claiming prize. Please try again!",
              "fail",
            );
            return;
          }

          triggerClaimSuccess(res?.data);
          isLoadingClaim = false;
          isClickClaim = false;
          triggerFirework();

          queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);
          queryClient?.invalidateQueries([$userPublicAddress, "rewards"]);
        }
      } catch (e) {
        console.error(e);
        if (
          ($suiWalletInstance as WalletState) &&
          ($suiWalletInstance as WalletState)?.connected
        ) {
          ($suiWalletInstance as WalletState)?.disconnect();
        }
        isLoadingClaim = false;
        isClickClaim = false;
      }
    } else {
      ($suiWalletInstance as WalletState)?.toggleSelect();
    }
  };

  $: {
    if (
      ($suiWalletInstance as WalletState) &&
      ($suiWalletInstance as WalletState)?.connected &&
      isClickClaim
    ) {
      handleClaim();
    }
  }

  const handleSignAddressMessage = async (msg: string) => {
    return await ($suiWalletInstance as WalletState)?.signPersonalMessage({
      message: new TextEncoder().encode(msg),
    });
  };
</script>

<div
  class={`py-4 max-w-[438px] w-full min-h-[280px] rounded-[16px] border border_0000000d flex flex-col justify-between gap-4 mx-auto ${
    $isDarkMode ? "bg-[#212121]" : "bg-white"
  }`}
>
  <div
    class="px-[16px] flex md:flex-row flex-col items-center h-full gap-[27px]"
  >
    <div
      class={`relative md:w-[135px] w-full rounded-2xl p-2 flex flex-col gap-5 items-center h-full justify-center ${
        $isDarkMode ? "" : "bg-white"
      }`}
    >
      <div class="w-20 h-20">
        <img
          src={data.logo}
          alt=""
          class="w-full h-full object-contain block"
        />
      </div>

      {#if ["FLX", "SUI", "USDC"].includes(data?.code)}
        <div
          class="md:absolute -bottom-2 w-full text-center whitespace-nowrap left-timee italic text-sm"
        >
          {data?.value + " " + data?.code}
        </div>
      {/if}
    </div>

    <div class="flex-1 flex flex-col md:items-start items-center gap-2">
      <div class="flex items-center gap-2">
        <img src={Crown} alt="" class="w-[26px] h-[26px] block" />
        <div class="text-[#FFB800] text-lg font-medium uppercase">
          NIMBUS ON SUI
        </div>
      </div>

      <div class="text-3xl font-normal md:text-left text-center">
        {#if isRedeem}
          {data.title}
        {:else}
          {data?.code}
        {/if}
      </div>

      <div class="text-sm font-normal md:text-left text-center">
        {data?.description}
      </div>
    </div>
  </div>

  <div class="flex flex-col gap-5 pb-1">
    <div class="relative border-b-2 border-dashed">
      <div
        class={`w-4 h-10 rounded-l-none rounded-full absolute -left-[1px] -bottom-5 border-r border-t border-b border_0000000d ${
          $isDarkMode ? "bg-[#161616]" : "bg-[#fff]"
        }`}
      />
      <div
        class={`w-4 h-10 rounded-r-none rounded-full absolute -right-[1px] -bottom-5 border-l border-t border-b border_0000000d ${
          $isDarkMode ? "bg-[#161616]" : "bg-[#fff]"
        }`}
      />
    </div>

    <div class="px-[16px]">
      <div
        class="flex items-center md:justify-start justify-between gap-[40px]"
      >
        {#if !isClaimable && isRedeem}
          <div class="w-[220px] text-base font-normal text-center">
            {#if data.body !== "WL_FLOWX_BOX"}
              {#if Number(data.cap) - Number(data.sold) > 0}
                {Number(data.cap) - Number(data.sold)} lefts
              {:else}
                Out of stock
              {/if}
            {/if}
          </div>
        {/if}

        {#if isClaimable && ["FLX", "SUI", "USDC"].includes(data.code)}
          <div class="w-full flex justify-end">
            <div class="md:w-[238.7px] w-full h-[45px]">
              <Button
                on:click={() => {
                  if (!isLoadingClaim) {
                    selectedData = data;
                    isClickClaim = true;
                    handleClaim();
                  }
                }}
                variant={`${isLoadingClaim && selectedData?.body === data?.body ? "disabled" : "tertiary"}`}
                disabled={isLoadingClaim && selectedData?.body === data?.body}
              >
                <div class="text-white text-smxs">Claim</div>
              </Button>
            </div>
          </div>
        {:else if !isClaimable && totalPoint >= data.cost && isRedeem && Number(data.cap) - Number(data.sold) > 0}
          <Button
            on:click={() => {
              if (!isLoadingRedeem) {
                selectedData = data;
                handleRedeemBox(data);
              }
            }}
            variant={`${isLoadingRedeem && selectedData?.body === data?.body ? "disabled" : "tertiary"}`}
            disabled={isLoadingRedeem && selectedData?.body === data?.body}
          >
            <div class="flex items-center gap-1">
              <img src={Diamond} alt="" class="w-[28px] h-[28px] block" />
              <div class="text-white sm:text-lg text-smxs font-medium">
                {data?.cost}
              </div>
            </div>
            <div class="text-white text-smxs">Redeem</div>
          </Button>
        {:else}
          <div class="w-full">
            {#if !isClaimable && (data?.code === "SUI" || data?.code === "FLX" || data?.code === "USDC" || data?.code === "PREMIUM_CODE")}
              <div
                class="flex items-center justify-between p-[12px] bg-[#EEEEEE] rounded-[12px] w-full"
              >
                {#if ["FLX", "SUI", "USDC"].includes(data?.code)}
                  <div class="text-[#131313] text-sm">Your Trx hash</div>
                  <Copy
                    address={data?.tx}
                    iconColor="#000"
                    iconSize={20}
                    color="#000"
                    isShorten
                    isLink
                    link={`https://suiscan.xyz/testnet/tx/${data?.tx}`}
                    textTooltip="Copy tx link"
                  />
                {/if}

                {#if data?.code === "PREMIUM_CODE"}
                  <div class="text-[#131313] text-sm">Your Premium Code</div>
                  <Copy
                    address={data?.value}
                    iconColor="#000"
                    iconSize={20}
                    color="#000"
                    textTooltip="Copy Premium Code"
                  />
                {/if}
              </div>
            {:else}
              <Button disabled>
                <div class="flex items-center gap-1">
                  <img src={Diamond} alt="" class="w-[28px] h-[28px] block" />
                  <div class="text-white sm:text-lg text-smxs font-medium">
                    {data?.cost}
                  </div>
                </div>
                <div class="text-white text-smxs">Redeem</div>
              </Button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <ReactAdapter
    element={SuiConnector}
    config={widgetConfig}
    autoConnect={false}
    {chains}
    integrator="sui-connector"
  />
</div>

<style>
  @media (max-width: 320) {
    .text-smxs {
      font-size: 14px;
      line-height: 20px;
    }

    .gap-320-sx {
      grid-gap: 10px !important;
      gap: 10px !important;
    }
  }
</style>
