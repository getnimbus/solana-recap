<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { isDarkMode } from "~/store";
  import dayjs from "dayjs";
  import isBetween from "dayjs/plugin/isBetween";
  import duration from "dayjs/plugin/duration";
  dayjs.extend(isBetween);
  dayjs.extend(duration);
  import { triggerToast } from "~/utils/functions";
  import { shorterAddress } from "~/utils";

  import Button from "~/components/Button.svelte";

  import Diamond from "~/assets/Diamond.png";
  import Crown from "~/assets/crown.svg";

  export let isRedeem = false;
  export let data;
  export let handleRedeemTicket = (value) => {};
  export let isLoadingRedeem;
  export let totalPoint;

  let timeCountDown = "";
  let intervalId = null;
  let interval: ReturnType<typeof setInterval>;

  const checkTicketValidate = () => {
    const today = dayjs().format("YYYY-MM-DD");
    return dayjs(today).isBetween(data?.fromDate, data?.toDate, "day", "[)");
  };

  const updateCountdown = () => {
    const now = dayjs();
    const targetDate = dayjs(data?.toDate);
    let days = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    if (now.isAfter(targetDate)) {
      clearInterval(interval);
    } else {
      const duration = dayjs.duration(targetDate.diff(now));
      days = duration.days();
      hours = duration.hours();
      minutes = duration.minutes();
      seconds = duration.seconds();
      timeCountDown =
        days + "d " + hours + "h " + minutes + "m " + seconds + "s ";
    }
  };

  onMount(() => {
    updateCountdown(); // Initial update
    interval = setInterval(updateCountdown, 1000);
  });

  onDestroy(() => {
    clearInterval(intervalId);
    clearInterval(interval);
  });

  let selectedData;
</script>

<div
  class={`py-4 max-w-[438px] w-full min-h-[280px] rounded-[16px] border border_0000000d flex flex-col justify-between gap-4 mx-auto ${
    $isDarkMode ? "bg-[#212121]" : "bg-white"
  }`}
>
  <div
    class="px-[16px] flex md:flex-row flex-col items-center h-full gap-[27px]"
  >
    <div
      class={`relative md:w-[135px] w-full relative rounded-2xl p-2 flex flex-col gap-5 items-center h-full justify-center ${
        $isDarkMode ? "" : "bg-white"
      }`}
    >
      <div class="w-20 h-20">
        <img
          src={data?.logo}
          alt=""
          class="w-full h-full object-contain block"
        />
      </div>

      <!-- {#if isRedeem}
        <div
          class="md:absolute -bottom-2 w-full text-center whitespace-nowrap left-timee italic text-sm"
        >
           {timeCountDown} 
        </div>
      {/if} -->
    </div>

    <div class="flex-1 flex flex-col md:items-start items-center gap-2">
      <div class="flex items-center gap-2">
        <img src={Crown} alt="" class="w-[26px] h-[26px] block" />
        <div class="text-[#FFB800] text-lg font-medium uppercase">
          NIMBUS ON SUI
        </div>
      </div>
      <div class="text-3xl font-normal md:text-left text-center">
        {data?.title}
      </div>
      <div class="text-sm font-normal md:text-left text-center">
        {data?.description}
      </div>
    </div>
  </div>

  <div class="flex flex-col gap-5 pb-1">
    <div class="relative border-b-2 border-dashed">
      <div
        class={`w-4 h-10 rounded-l-none rounded-full absolute -left-[1px] -bottom-5 border-r border-t border-b border_0000000d ${
          $isDarkMode ? "bg-[#161616]" : "bg-[#fff]"
        }`}
      />
      <div
        class={`w-4 h-10 rounded-r-none rounded-full absolute -right-[1px] -bottom-5 border-l border-t border-b border_0000000d ${
          $isDarkMode ? "bg-[#161616]" : "bg-[#fff]"
        }`}
      />
    </div>

    <div class="px-[16px]">
      {#if isRedeem}
        <div
          class="flex items-center md:justify-start justify-between gap-[40px]"
        >
          <div class="w-[220px] text-base font-normal text-center">
            <!-- {#if checkTicketValidate()}
              Unlimited
            {:else}
              Out of stock
            {/if} -->
            Out of stock
          </div>

          {#if checkTicketValidate() && totalPoint >= data.cost}
            <Button
              on:click={() => {
                if (!isLoadingRedeem) {
                  selectedData = data;
                  handleRedeemTicket(data);
                }
              }}
              variant="disabled"
              disabled={true}
            >
              <!-- `${isLoadingRedeem && selectedData?.body === data?.body ? "disabled" : "tertiary"}` -->
              <!--  isLoadingRedeem && selectedData?.body === data?.body -->
              <div class="flex items-center gap-1">
                <img src={Diamond} alt="" class="w-[28px] h-[28px] block" />
                <div class="text-white sm:text-lg text-smxs font-medium">
                  {data?.cost}
                </div>
              </div>
              <div class="text-white text-smxs">Redeem</div>
            </Button>
          {:else}
            <Button
              disabled
              variant="disabled"
              on:click={() => {
                if (totalPoint < data.cost) {
                  triggerToast(
                    "You are not enough GM Points to Redeem",
                    "fail",
                  );
                } else {
                  triggerToast("There are not available now", "fail");
                }
              }}
            >
              <div class="flex items-center gap-1">
                <img src={Diamond} alt="" class="w-[28px] h-[28px] block" />
                <div class="text-white sm:text-lg text-smxs font-medium">
                  {data?.cost}
                </div>
              </div>
              <div class="text-white text-smxs">Redeem</div>
            </Button>
          {/if}
        </div>
      {:else}
        <div
          class="flex items-center justify-between p-[12px] bg-[#EEEEEE] rounded-[12px] text-[#131313]"
        >
          <div class="text-sm">Owned</div>
          <span
            class="text-white bg-[#1e96fc] text-xs font-medium me-2 px-2.5 py-1 rounded-md"
          >
            {data?.value}
          </span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  @media (max-width: 320) {
    .text-smxs {
      font-size: 14px;
      line-height: 20px;
    }

    .gap-320-sx {
      grid-gap: 10px !important;
      gap: 10px !important;
    }
  }
</style>
