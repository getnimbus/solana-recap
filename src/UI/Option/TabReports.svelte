<script>
  import { onMount } from "svelte";
  import mixpanel from "mixpanel-browser";
  import { t } from "~/lib/i18n";

  import Tokens from "../Reports/Tokens.svelte";
  import NFTs from "../Reports/NFTs.svelte";

  onMount(() => {
    mixpanel.track("accounts_page");
  });
</script>

<div class="flex flex-col gap-4">
  <div class="flex flex-col gap-1 border-b-[1.5px] border_0000000d pb-4">
    <div class="xl:title-3 title-1">{$t("Report Settings")}</div>
    <div class="text-base text-gray-500">
      {$t("Management your report")}
    </div>
  </div>

  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <div class="text-base font-medium">{$t("Token List")}</div>
      <Tokens />
    </div>
    <div class="flex flex-col gap-2">
      <div class="text-base font-medium">{$t("NFT Collection List")}</div>
      <NFTs />
    </div>
  </div>
</div>

<style>
</style>
