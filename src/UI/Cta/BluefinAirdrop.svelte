<script lang="ts">
  import { isDarkMode } from "~/store";
  import { t } from "~/lib/i18n";
  import { createQuery } from "@tanstack/svelte-query";
  import { handleGetAirdrops } from "~/lib/queryAPI";
  import { typeWallet, wallet } from "~/store";

  import TooltipNumber from "~/components/TooltipNumber.svelte";
  import Button from "~/components/Button.svelte";

  let totalTokenBluefin = 0;

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
        $queryAirdrops?.data?.data?.bluefinAirdrops &&
        $queryAirdrops?.data?.data?.bluefinAirdrops?.amount &&
        Number($queryAirdrops?.data?.data?.bluefinAirdrops?.amount) !== 0
      ) {
        totalTokenBluefin = Number(
          $queryAirdrops?.data?.data?.bluefinAirdrops?.amount,
        );
      }
    }
  }
</script>

{#if totalTokenBluefin !== 0}
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
        <span class="text_00000099">Your</span> $BLUE
        <span class="text_00000099">allocation</span>
        <div class="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 20 16"
            ><path
              d="M20 7.99999C20 8.91636 19.6434 9.74773 19.0641 10.3575L14.4843 15.0313C14.2251 15.2907 13.9244 15.5071 13.5933 15.6691C13.1596 15.8812 12.6737 16 12.1607 16C11.6475 16 11.1838 15.8633 10.75 15.6511C10.4096 15.4845 10.0748 15.2742 9.81073 15.005L6.04755 11.1645C6.41219 10.6927 6.97736 10.3898 7.61186 10.3898C8.0843 10.3898 8.51832 10.5577 8.85973 10.8383L11.2533 13.281C11.4909 13.5092 11.8085 13.6465 12.1604 13.6465C12.5125 13.6465 12.8325 13.5067 13.0701 13.2785L17.3447 8.91602C17.5617 8.67486 17.6941 8.35322 17.6941 8C17.6941 7.64687 17.5618 7.32529 17.3449 7.08414L13.0583 2.70952C12.822 2.4881 12.5068 2.35293 12.1607 2.35293C11.8147 2.35293 11.4995 2.48807 11.2632 2.70947L0.564413 13.6281C0.434771 13.7599 0.224966 13.7597 0.0955065 13.6276C0.0392793 13.5702 0.00744497 13.4974 4.05125e-06 13.4225V11.2877C4.05125e-06 11.1105 0.0667167 10.9491 0.175916 10.8284L2.0435 8.92243C2.26264 8.68083 2.39657 8.35756 2.39657 8.00238C2.39657 7.62837 2.25035 7.28937 2.01023 7.04422L0.189467 5.18604C0.177786 5.17386 0.166553 5.16121 0.155791 5.14813C0.0590412 5.0305 0.000563528 4.87781 4.05125e-06 4.71265L0 4.71026L4.05125e-06 4.70786V2.57838C0.00744497 2.50348 0.0392793 2.43064 0.0955065 2.37325C0.225113 2.24098 0.435531 2.24098 0.565137 2.37325L3.58632 5.4565C3.82559 5.69481 4.15226 5.83912 4.51299 5.83912C4.87366 5.83912 5.20096 5.69416 5.44021 5.45594L9.84382 0.961875C10.1014 0.705556 10.3996 0.491614 10.7277 0.331087C11.1615 0.118864 11.6475 0 12.1606 0C12.6739 0 13.1599 0.118885 13.5937 0.331142C13.9246 0.493079 14.2252 0.709365 14.4843 0.96867L19.0641 5.64252C19.3123 5.90372 19.5195 6.2056 19.6754 6.53742C19.8835 6.98016 20 7.47619 20 7.99999Z"
              fill="#2f68c5"
            ></path></svg
          >
          <TooltipNumber number={totalTokenBluefin} type="amount" />
        </div>
      </div>

      <a
        class="w-max min-w-[140px] cursor-pointer"
        href="https://trade.bluefin.io/airdrop"
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
