<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import { userPublicAddress, user, triggerConnectWallet } from "~/store";
  import { createQuery } from "@tanstack/svelte-query";
  import { getVirtualPortfolioPerformance } from "~/lib/queryAPI";

  export let wallet;
  export let listTokenHistoryChanges;
  export let listVirtualPortfolio;
  export let listTokenHolding;
  export let isLoading;
  export let isQuery;
  export let virtualPortfolioId;

  $: selectedVirtual = listVirtualPortfolio?.find(
    (item: any) => item?.id === virtualPortfolioId,
  );

  import Button from "~/components/Button.svelte";
  import Allocation from "./Allocation.svelte";
  import Performance from "./Performance.svelte";
  import Holding from "./Holding.svelte";
  import HoldingHistoryChange from "./HoldingHistoryChange.svelte";
  import Summary from "./Summary.svelte";

  $: queryVirtualPortfolioPerformance = createQuery({
    queryKey: ["virtual-portfolio-performance", wallet, virtualPortfolioId],
    queryFn: () =>
      getVirtualPortfolioPerformance(
        wallet,
        virtualPortfolioId,
        $userPublicAddress,
      ),
    retry: false,
    enabled: Boolean(
      wallet &&
        wallet?.length !== 0 &&
        isQuery &&
        virtualPortfolioId &&
        virtualPortfolioId?.length !== 0,
    ),
  });

  let dataVirtualPortfolioPerformance = {};

  $: {
    if (
      !$queryVirtualPortfolioPerformance.isError &&
      $queryVirtualPortfolioPerformance.data !== undefined
    ) {
      if (
        $queryVirtualPortfolioPerformance?.data?.data &&
        $queryVirtualPortfolioPerformance?.data?.data?.status !== "PRIVATE"
      ) {
        dataVirtualPortfolioPerformance =
          $queryVirtualPortfolioPerformance.data?.data;
      }
    }
  }
</script>

{#if listVirtualPortfolio && listVirtualPortfolio?.length === 0}
  {#if !isLoading && $user && Object.keys($user).length === 0}
    <div class="min-h-screen flex flex-col items-center gap-4">
      <div class="text-center text-base font-medium">
        Add your paper trade to easily customize and change your investments to
        your optimal level.
      </div>
      <div class="w-max">
        <Button
          variant="secondary"
          on:click={() => {
            triggerConnectWallet.update((n) => (n = true));
          }}
        >
          {#if isNimbusVersion}
            Connect Wallet
          {:else}
            Login
          {/if} to create Paper Trade
        </Button>
      </div>
    </div>
  {/if}
{:else}
  <div class="flex flex-col gap-6 w-full h-full">
    <Summary
      {virtualPortfolioId}
      {wallet}
      {isLoading}
      {listTokenHolding}
      {listTokenHistoryChanges}
    />
    <div class="grid xl:grid-cols-2 grid-cols-1 gap-6">
      <Allocation {isLoading} {listTokenHolding} />
      <Performance
        {selectedVirtual}
        isLoading={isLoading || $queryVirtualPortfolioPerformance.isFetching}
        {dataVirtualPortfolioPerformance}
      />
    </div>
    <Holding {isLoading} {listTokenHolding} />
    <HoldingHistoryChange {isLoading} {listTokenHistoryChanges} />
  </div>
{/if}

<style></style>
