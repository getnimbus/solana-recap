<script lang="ts">
  import { isDarkMode } from "~/store";
  import WormholeConnect from "../../node_modules/@wormhole-foundation/wormhole-connect";

  import ReactAdapter from "~/components/ReactAdapter.svelte";
  import ErrorBoundary from "~/components/ErrorBoundary.svelte";

  const config = {
    chains: [
      "Sui",
      "Solana",
      "Ethereum",
      "Polygon",
      "Arbitrum",
      "Base",
      "BSC",
      "Optimism",
      "Fantom",
      "Avalanche",
      "Moonbeam",
      "Scroll",
      "Mantle",
      "Aptos",
      "Blast",
    ],
    rpcs: {
      Ethereum: "https://rpc.ankr.com/eth",
      Solana: "https://rpc.ankr.com/solana",
    },
    ui: {
      showHamburgerMenu: false,
    },
  };

  let theme = {
    mode: $isDarkMode ? "dark" : "light",
    input: $isDarkMode ? "#0f0f0f" : "#fff",
    primary: "#1e96fc",
    text: $isDarkMode ? "#ffffff" : "#000",
    error: "#F04438",
    success: "#12B76A",
    badge: $isDarkMode ? "#ffffff" : "#010101",
    font: '"Golos Text"',
  };

  $: {
    if ($isDarkMode) {
      theme = {
        ...theme,
        mode: "dark",
        input: "#0f0f0f",
        text: "#ffffff",
        badge: "#ffffff",
      };
    } else {
      theme = {
        ...theme,
        mode: "light",
        input: "#fff",
        text: "#000",
        badge: "#010101",
      };
    }
  }
</script>

<ErrorBoundary>
  {#if $isDarkMode}
    <ReactAdapter
      element={WormholeConnect}
      integrator="wormhole-bridge"
      {config}
      {theme}
    />
  {:else}
    <ReactAdapter
      element={WormholeConnect}
      integrator="wormhole-bridge"
      {config}
      {theme}
    />
  {/if}
</ErrorBoundary>

<style>
</style>
