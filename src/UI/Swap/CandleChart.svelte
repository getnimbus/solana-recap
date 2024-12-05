<script lang="ts">
  import { Address } from "@ton/ton";
  import TradingViewChart from "../TokenDetail/TradingViewChart.svelte";

  export let contractAddress;
  export let chain;
  export let addressParamInfo;

  $: formatCA =
    contractAddress && chain === "TON"
      ? Address.parse(contractAddress).toString({
          urlSafe: true,
          bounceable: true,
        })
      : "TONCOIN";

  let symbol = "";
  let price = 0;

  const handleFormatSelectedTokenChart = (address: string) => {
    if (addressParamInfo && Object.keys(addressParamInfo).length !== 0) {
      if (address === addressParamInfo?.fromToken) {
        symbol = addressParamInfo?.fromTokenInfo?.symbol;
        price = addressParamInfo?.fromTokenInfo?.priceUSD;
      }
      if (address === addressParamInfo?.toToken) {
        symbol = addressParamInfo?.toTokenInfo?.symbol;
        price = addressParamInfo?.toTokenInfo?.priceUSD;
      }
    } else {
      symbol = "TON";
    }
  };

  $: {
    if (chain === "TON") {
      handleFormatSelectedTokenChart(contractAddress);
    }
  }
</script>

<div class="h-[680px] w-full">
  <TradingViewChart
    id={symbol === "USDT" ? "USD₮" : symbol}
    mobile={false}
    contractAddress={formatCA ===
    "0:0000000000000000000000000000000000000000000000000000000000000000"
      ? "TONCOIN"
      : formatCA}
    {price}
    {chain}
    isFromSwapPage={true}
  />
</div>

<style></style>
