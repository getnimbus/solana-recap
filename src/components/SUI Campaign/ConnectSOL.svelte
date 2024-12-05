<script lang="ts">
  import mixpanel from "mixpanel-browser";
  import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
  } from "@solana/wallet-adapter-wallets";
  import { walletStore } from "@aztemi/svelte-on-solana-wallet-adapter-core";
  import { WalletProvider } from "@aztemi/svelte-on-solana-wallet-adapter-ui";
  import { useQueryClient, createQuery } from "@tanstack/svelte-query";
  import { nimbus } from "~/lib/network";
  import { t } from "~/lib/i18n";
  import { isDarkMode, userPublicAddress } from "~/store";
  import bs58 from "bs58";
  import { triggerBonusScore, triggerToast } from "~/utils/functions";
  import { getLinkData, handleValidateAddress } from "~/lib/queryAPI";
  import { onMount } from "svelte";
  import Copy from "../Copy.svelte";
  import WalletModal from "~/UI/SolanaCustomWalletBtn/WalletModal.svelte";

  import Solana from "~/assets/chains/solana.png";
  import Diamond from "~/assets/Diamond.png";

  const queryClient = useQueryClient();

  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  let selectedDataSOLLink: any = {};

  $: queryLinkSocial = createQuery({
    queryKey: ["link-socials"],
    queryFn: () => getLinkData(),
    retry: false,
  });

  $: {
    if (!$queryLinkSocial?.isError && $queryLinkSocial?.data !== undefined) {
      selectedDataSOLLink = $queryLinkSocial?.data?.find(
        (item) => item.kind === "wallet" && item.chain === "SOL",
      );
    }
  }

  const handleCheckPublicAddress = async (address: string) => {
    const addressValidate = await handleValidateAddress(address);
    if (addressValidate && addressValidate.type === "SOL") {
      selectedDataSOLLink = {
        uid: address,
      };
    }
  };

  onMount(() => {
    if ($userPublicAddress) {
      handleCheckPublicAddress($userPublicAddress);
    }
  });

  let modalVisible = false;
  const maxNumberOfWallets = 5;
  const openModal = () => {
    modalVisible = true;
  };

  const closeModal = () => (modalVisible = false);

  const connectWallet = async (event) => {
    closeModal();
    try {
      localStorage.removeItem("walletAdapter");
      await walletStore.resetWallet();
      await walletStore.setConnecting(false);
      await $walletStore.disconnect();
      await $walletStore.select(event.detail);
      await $walletStore.connect();
    } catch (error) {
      console.log(error);
    }
  };

  $: solanaPublicAddress = $walletStore?.publicKey?.toBase58();

  $: {
    if (solanaPublicAddress) {
      handleGetSolanaNonce(solanaPublicAddress);
    }
  }

  const handleSignSolanaAddressMessage = async (signatureString) => {
    if ($walletStore.connected) {
      const res = await $walletStore?.signMessage(
        Uint8Array.from(
          Array.from(`I am signing my one-time nonce: ${signatureString}`).map(
            (letter) => letter.charCodeAt(0),
          ),
        ),
      );
      if (res) {
        return bs58.encode(res);
      } else {
        return "";
      }
    }
  };

  const handleGetSolanaNonce = async (address: string) => {
    try {
      mixpanel.track("user_login_solana");
      const res: any = await nimbus.post("/users/nonce?verified=true", {
        publicAddress: address,
        referrer: undefined,
      });
      if (res && res.data) {
        const signatureString = await handleSignSolanaAddressMessage(
          res?.data?.nonce,
        );
        if (signatureString) {
          const payload = {
            signature: signatureString,
            publicAddress: address,
          };
          handleUpdatePublicAddress(payload);
        }
      }
    } catch (e) {
      console.error("error: ", e);
      $walletStore.disconnect();
    }
  };

  const handleUpdatePublicAddress = async (payload: any) => {
    try {
      const params: any = {
        id: $userPublicAddress,
        kind: "wallet",
        type: null,
        userPublicAddress: payload?.publicAddress,
        signature: payload?.signature,
      };
      const res: any = await nimbus.post("/accounts/link", params);
      if (res && res?.error) {
        triggerToast(res?.error, "fail");
        return;
      }

      queryClient?.invalidateQueries(["link-socials"]);
      queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);

      triggerToast(
        "Your are successfully connect your Solana wallet!",
        "success",
      );
      triggerBonusScore(1000, 2000);
    } catch (e) {
      console.log(e);
      triggerToast(
        "Something wrong when connect your Solana wallet. Please try again!",
        "fail",
      );
    } finally {
      $walletStore.disconnect();
    }
  };
</script>

{#if selectedDataSOLLink && Object.keys(selectedDataSOLLink).length !== 0}
  <div
    class={`flex items-center justify-center gap-2 text-white border cursor-pointer py-3 px-6 h-[48px] rounded-[12px] md:w-[340px] w-full font-medium ${
      $isDarkMode ? "border-white" : "border-[#27326f]"
    }`}
  >
    <div class="w-[24px] h-[24px] rounded-full overflow-hidden">
      <img src={Solana} alt="" class="w-full h-full object-contain" />
    </div>
    <Copy
      address={selectedDataSOLLink?.uid}
      iconColor={$isDarkMode ? "#fff" : "#27326f"}
      color={$isDarkMode ? "#fff" : "#27326f"}
      isShorten
    />
  </div>
{:else}
  <div
    class={`flex items-center justify-center gap-2 text-white border cursor-pointer py-3 px-6 h-[48px] rounded-[12px] md:w-[340px] w-full font-medium ${
      $isDarkMode
        ? "border-white text-white"
        : "border-[#27326f] text-[#27326f]"
    }`}
    on:click={() => {
      openModal();
    }}
  >
    <img src={Solana} alt="" class="rounded-full h-[24px] w-[24px]" />
    <div class="font-semibold text-[15px]">
      {$t("Connect _ Wallet", { name: "Solana" })}
    </div>

    <div
      class="flex items-center gap-1 text-sm font-medium bg-[#27326F] py-1 px-2 text-white rounded-[10px]"
    >
      1000
      <img src={Diamond} alt="" class="w-6 h-6" />
    </div>
  </div>
{/if}

<WalletProvider
  localStorageKey="walletAdapter"
  {wallets}
  autoConnect
  onError={console.log}
/>

{#if modalVisible}
  <WalletModal
    on:close={closeModal}
    on:connect={connectWallet}
    {maxNumberOfWallets}
  />
{/if}

<style>
</style>
