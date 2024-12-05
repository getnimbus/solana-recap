<script lang="ts">
  import { onMount } from "svelte";
  import jwt_decode from "jwt-decode";
  import { nimbus } from "~/lib/network";
  import { wallet } from "~/store";
  import { isNimbusVersion } from "~/utils/constants";

  import NftCard from "~/components/NFTCard.svelte";
  import Button from "~/components/Button.svelte";

  let userInfo = {};
  let listNft = [];
  let isLoading = false;

  const handleGetNft = async () => {
    try {
      isLoading = true;
      const res: any = await nimbus
        .get(`/nft/${$wallet}`)
        .then((response) => response);
      if (res) {
        listNft = res?.data?.result;
      }
    } catch (e) {
      console.error("error: ", e);
    } finally {
      isLoading = false;
    }
  };

  const handleBuy = async () => {
    const res = await nimbus
      .get("/payments/create-session")
      .then((response) => response);
    if (res) {
      window.location.replace(res.data.payment_url);
    }
  };

  $: {
    if (Object.keys(userInfo).length !== 0) {
      handleGetNft();
    } else {
      listNft = [];
    }
  }
</script>

<div class="flex flex-col gap-2">
  <div class="flex justify-between items-center mb-2">
    <div class="xl:title-3 title-1 text-gray-500 flex flex-col">My NFT</div>
  </div>

  {#if Object.keys(userInfo).length === 0}
    <div class="xl:title-5 title-3">
      Please <a
        href="https://app.getnimbus.io"
        target="_blank"
        class="text-blue-500">login</a
      > to see your dashboard
    </div>
  {:else}
    <div>
      {#if listNft && listNft.length !== 0}
        <div class="w-[350px]">
          <NftCard data={{}} marketPrice={0} />
        </div>
      {:else}
        <div class="flex flex-col gap-4">
          <div class="xl:title-5 title-3">
            You need {#if isNimbusVersion}Nimbus{/if}
            NFT to unlock this feature
          </div>
          <Button variant="secondary" on:click={() => handleBuy()}>Buy</Button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
</style>
