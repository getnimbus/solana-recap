<script lang="ts">
  import { onMount } from "svelte";
  import { nimbus } from "~/lib/network";

  import FlipCoin from "~/components/SUI Campaign/FlipCoinGame/FlipCoin.svelte";
  import History from "~/components/SUI Campaign/FlipCoinGame/History.svelte";
  import QnA from "~/components/SUI Campaign/FlipCoinGame/QnA.svelte";

  let flipHistoryData: any = [];
  let totalReward = 0;
  let dataFlipCheck = {};

  const getFlipCheck = async () => {
    try {
      const response: any = await nimbus.get(`/v2/games/flip/check`);
      if (response && response?.data) {
        flipHistoryData = response?.data?.history;
        totalReward = flipHistoryData.reduce(
          (prev: any, item: any) => prev + Number(item.point),
          0,
        );
        dataFlipCheck = response.data;
      }
    } catch (e) {
      console.error(e);
    }
  };

  onMount(() => {
    getFlipCheck();
  });
</script>

<div class="flex flex-col gap-3">
  <FlipCoin {dataFlipCheck} {getFlipCheck} />
  <div class="grid lg:grid-cols-2 grid-cols-1 gap-6">
    <QnA />
    <History {flipHistoryData} {totalReward} />
  </div>
</div>

<style></style>
