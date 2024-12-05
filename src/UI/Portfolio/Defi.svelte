<script lang="ts">
  import { t } from "~/lib/i18n";
  import { isDarkMode, typeWallet } from "~/store";
  import { DEFIChainSupported } from "./Defi/DefiPosition/utils";

  import ErrorBoundary from "~/components/ErrorBoundary.svelte";
  import DefiPositionBundles from "./DefiPositionBundles.svelte";
  import DefiPosition from "./DefiPosition.svelte";
</script>

<ErrorBoundary>
  {#if DEFIChainSupported.includes($typeWallet)}
    <DefiPosition />
  {/if}

  {#if !DEFIChainSupported.includes($typeWallet)}
    {#if $typeWallet === "BUNDLE"}
      <DefiPositionBundles />
    {:else}
      <div
        class={`rounded-[20px] xl:p-6 py-4 lg:px-3 text-lg min-h-[300px] flex flex-col items-center justify-center ${
          $isDarkMode
            ? "lg:bg-[#222222]"
            : "bg-[#fff] xl:border border_0000001a"
        }`}
      >
        {$t("Coming soon 🚀")}
      </div>
    {/if}
  {/if}
</ErrorBoundary>

<style></style>
