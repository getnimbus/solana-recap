<script lang="ts">
  import * as browser from "webextension-polyfill";
  import { useQueryClient } from "@tanstack/svelte-query";
  import {
    isDarkMode,
    tonConnector,
    wallet,
    chain,
    typeWallet,
    tab,
  } from "~/store";
  import mixpanel from "mixpanel-browser";
  import { nimbus } from "~/lib/network";
  import { triggerToast } from "~/utils/functions";
  import { bigGeneration, otherGeneration } from "~/lib/chains";

  import Ton from "~/assets/chains/ton.png";
  import Button from "~/components/Button.svelte";
  import { shorterAddress } from "~/utils";

  export let selectYourWalletsBundle: any;
  export let closeMobileAddAccountModal = () => {};
  export let isFromHero = false;

  const queryClient = useQueryClient();

  const handleTonAuth = async () => {
    mixpanel.track("user_login_ton");

    if ($tonConnector?.connected) {
      $tonConnector.disconnect();
    }

    handleLoginTON();
  };

  const handleLoginTON = async () => {
    try {
      $tonConnector.openModal();

      $tonConnector.onStatusChange((wallet) => {
        handleAddTon(wallet);
      });
    } catch (e) {
      if ($tonConnector?.connected) {
        $tonConnector.disconnect();
      }
    }
  };

  const handleAddTon = async (data: any) => {
    try {
      if (data && data?.account?.address) {
        const dataFormat = {
          id: data?.account?.address,
          label: `TON Wallet ${shorterAddress(data?.account?.address)}`,
          value: data?.account?.address,
        };

        if (selectYourWalletsBundle && selectYourWalletsBundle.length !== 0) {
          await nimbus.put(
            `/address/personalize/bundle?name=${"Your wallets"}`,
            {
              name: "Your wallets",
              addresses: selectYourWalletsBundle?.concat([dataFormat.value]),
            },
          );
          queryClient.invalidateQueries(["list-bundle"]);
        }

        const response: any = await nimbus.post("/accounts", {
          type: "DEX",
          publicAddress: dataFormat.value,
          accountId: dataFormat.value,
          label: dataFormat.label,
        });

        if (response?.error) {
          triggerToast("Can't add new wallet address at this time!", "fail");
          return;
        }

        queryClient.invalidateQueries(["list-address"]);
        wallet.update((n) => (n = dataFormat.value));
        chain.update((n) => (n = "ALL"));
        typeWallet.update((n) => (n = "MOVE"));

        browser.storage.sync.set({ selectedChain: "ALL" });
        browser.storage.sync.set({
          typeWalletAddress: "MOVE",
        });
        browser.storage.sync.set({
          selectedWallet: dataFormat.value,
        });

        if (bigGeneration.includes("MOVE")) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname +
              `?tab=${$tab}&type=${"MOVE"}&chain=ALL&address=${dataFormat.value}`,
          );
        }

        if (otherGeneration.includes("MOVE")) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname +
              `?tab=${$tab}&type=${"MOVE"}&address=${dataFormat.value}`,
          );
        }

        closeMobileAddAccountModal();

        if ($tonConnector?.connected) {
          $tonConnector.disconnect();
        }

        triggerToast("Successfully add TON account!", "success");

        mixpanel.track("user_add_address");
      }
    } catch (e) {
      console.error(e);
    }
  };
</script>

{#if isFromHero}
  <Button on:click={handleTonAuth}>Connect TON</Button>
{:else}
  <div
    class={`flex items-center justify-center gap-3 text-white border cursor-pointer rounded-[12px] w-[219px] h-[46px] ${
      $isDarkMode
        ? "border-white text-white"
        : "border-[#27326f] text-[#27326f]"
    }`}
    style="padding: 9px 21px 11px;"
    on:click={handleTonAuth}
  >
    <img src={Ton} alt="" class="h-[22px] w-[24px]" />
    <div class="font-medium text-base">Connect TON</div>
  </div>
{/if}

<style></style>
