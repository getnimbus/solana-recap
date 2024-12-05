<script lang="ts">
  import LendingStake from "./LendingStake.svelte";
  import TokenStatePosition from "./TokenStatePosition.svelte";

  export let protocolInfo;
  export let data;

  $: dataBorrowLendingStaking = data.find(
    (item: any) => item.type === "BorrowLendingStaking",
  );

  $: dataBorrow = data.find((item: any) => item.type === "Borrow");
</script>

{#if dataBorrowLendingStaking !== undefined && dataBorrowLendingStaking && dataBorrowLendingStaking?.data.length !== 0}
  <div class="flex flex-col">
    {#each dataBorrowLendingStaking?.data as itemRow}
      <LendingStake data={itemRow?.input} {protocolInfo} />
      <TokenStatePosition
        dataRow={itemRow}
        data={itemRow?.current?.tokens}
        type="borrow"
        {protocolInfo}
        yields={itemRow?.current?.yield}
      />
    {/each}
  </div>
{/if}

{#if dataBorrow !== undefined && dataBorrow && dataBorrow?.data.length !== 0}
  <div class="flex flex-col">
    {#each dataBorrow?.data as itemRow}
      <TokenStatePosition
        dataRow={itemRow}
        data={itemRow?.input}
        type="supplied"
        {protocolInfo}
      />
      {#if itemRow?.current?.tokens && itemRow?.current?.tokens?.length !== 0}
        <TokenStatePosition
          dataRow={itemRow}
          data={itemRow?.current?.tokens}
          type="borrow"
          {protocolInfo}
          yields={itemRow?.current?.yield}
        />
      {/if}
    {/each}
  </div>
{/if}

<style></style>
