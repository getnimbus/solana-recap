<script lang="ts">
  import { t } from "~/lib/i18n";
  import { getLinkData } from "~/lib/queryAPI";
  import { createQuery } from "@tanstack/svelte-query";

  import AppOverlay from "~/components/Overlay.svelte";
  import ConnectSui from "./ConnectSUI.svelte";
  import ConnectTon from "./ConnectTON.svelte";
  import ConnectSol from "./ConnectSOL.svelte";

  import Diamond from "~/assets/Diamond.png";

  let isOpenModal = false;
  let listSocialConnected: any = [1, 2, 3];

  $: queryLinkSocial = createQuery({
    queryKey: ["link-socials"],
    queryFn: () => getLinkData(),
    retry: false,
  });

  $: {
    if (!$queryLinkSocial?.isError && $queryLinkSocial?.data !== undefined) {
      listSocialConnected = $queryLinkSocial?.data?.filter(
        (item: any) =>
          item.kind === "wallet" && ["SOL", "TON", "MOVE"].includes(item.chain),
      );
    }
  }
</script>

<div
  class="flex justify-center items-center gap-3 text-white bg-[#1e96fc] py-3 px-2 h-[48px] rounded-[10px] cursor-pointer xl:w-[280px] w-max"
  on:click={() => (isOpenModal = true)}
>
  {$t("Link your wallets")}
  {#if listSocialConnected.length < 3}
    <div
      class="flex items-center gap-1 text-sm font-medium bg-[#27326F] py-1 px-2 text-white rounded-[10px]"
    >
      {(3 - listSocialConnected.length) * 1000}
      <img src={Diamond} alt="" class="w-6 h-6 block" />
    </div>
  {/if}
</div>

<!-- Modal Link Wallet -->
<AppOverlay
  clickOutSideToClose
  isOpen={isOpenModal}
  on:close={() => {
    isOpenModal = false;
  }}
>
  <div class="flex flex-col justify-center items-center gap-4 xl:mt-0 mt-4">
    <div class="title-3 font-semibold">{$t("Link your wallets")}</div>

    <div class="flex flex-col gap-4">
      <ConnectSui />
      <div class="-mt-4 flex flex-col gap-4">
        <ConnectSol />
        <ConnectTon />
      </div>
    </div>
  </div>
</AppOverlay>

<style></style>
