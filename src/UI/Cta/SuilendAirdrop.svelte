<script lang="ts">
  import { handleGetAirdrops } from "~/lib/queryAPI";
  import { createQuery } from "@tanstack/svelte-query";
  import { typeWallet, wallet } from "~/store";
  import { isDarkMode } from "~/store";
  import { t } from "~/lib/i18n";

  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Button from "~/components/Button.svelte";

  let totalTokenSuilend = 0;

  $: queryAirdrops = createQuery({
    queryKey: ["onchain-airdrops", $wallet],
    queryFn: () => handleGetAirdrops($wallet, "SUI"),
    retry: false,
    enabled: Boolean(
      $wallet && $wallet?.length !== 0 && ["MOVE", "SUI"].includes($typeWallet),
    ),
  });

  $: {
    if (!$queryAirdrops.isError && $queryAirdrops.data !== undefined) {
      if (
        $queryAirdrops?.data?.data?.suilendAirdrops &&
        $queryAirdrops?.data?.data?.suilendAirdrops?.amount &&
        Number($queryAirdrops?.data?.data?.suilendAirdrops?.amount) !== 0
      ) {
        totalTokenSuilend = Number(
          $queryAirdrops?.data?.data?.suilendAirdrops?.amount,
        );
      }
    }
  }
</script>

{#if totalTokenSuilend !== 0}
  <swiper-slide>
    <div
      class={`border px-6 py-7 rounded-[20px] flex md:flex-row flex-col justify-between md:gap-10 gap-6 ${
        $isDarkMode
          ? "bg-[#444444] border-[#5a5a5a]"
          : "bg-[#F8F9FF] border-[#f0f2fb]"
      }`}
    >
      <div
        class="lg:text-xl md:text-lg text-xl font-medium flex md:flex-row flex-col md:items-center items-start gap-2"
      >
        <span class="text_00000099">Your</span> $SEND
        <span class="text_00000099">allocation</span>
        <div class="flex items-center gap-1">
          <img
            src="data:image/png;base64,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"
            alt=""
            class="w-6 h-6 rounded-full"
          />
          <TooltipNumber number={totalTokenSuilend} type="amount" />
        </div>
      </div>

      <a
        class="w-max min-w-[140px] cursor-pointer"
        href="https://suilend.fi/send"
        target="_blank"
      >
        <Button>
          {$t("Claim")}
        </Button>
      </a>
    </div>
  </swiper-slide>
{/if}

<style></style>
