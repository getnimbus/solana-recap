<script lang="ts">
  import { onMount } from "svelte";
  import { isDarkMode, user } from "~/store";
  import { shorterAddress } from "~/utils/index";
  import { triggerToast } from "~/utils/functions";
  import mixpanel from "mixpanel-browser";
  import html2canvas from "html2canvas-pro";
  import { isNimbusVersion } from "~/utils/constants";
  import { t } from "~/lib/i18n";

  import RandomAvatar from "~/components/RandomAvatar.svelte";
  import InviterQr from "~/UI/Profile/InviterQR.svelte";
  import ClosedPositionChart from "~/UI/Profile/ClosedPositionChart.svelte";
  import TopProfitAndLoss from "~/UI/Profile/TopProfitAndLoss.svelte";
  import ProfitData from "~/UI/Profile/ProfitData.svelte";
  import TokenHoldingTable from "~/UI/Profile/TokenHoldingTable/TokenHoldingTable.svelte";
  import RecentActivitiesTable from "~/UI/Profile/RecentActivitiesTable/RecentActivitiesTable.svelte";
  import SyncData from "~/components/SyncData.svelte";
  import Loading from "~/components/Loading.svelte";

  let isLoading = false;

  const downloadPage = async () => {
    const targetElement = document.getElementById("target-performance-summary");
    const shareBtn = document.getElementById("btn-share-summary");
    if (targetElement && shareBtn) {
      try {
        isLoading = true;
        await html2canvas(targetElement, {
          ignoreElements: (el) => {
            return (
              el.id === "btn-share-summary" || el.id === "recent-trade-summary"
            );
          },
          proxy: "https://htmlcanvas-proxy.getnimbus.io",
          logging: true,
          scale: 2,
        }).then((canvas) => {
          const ctx: any = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          const img = canvas
            .toDataURL("image/png")
            .replace("image/png", "image/octet-stream");
          const a = document.createElement("a");
          a.href = img;

          a.download = `UserPerformanceSummary.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          triggerToast("Successfully downloaded!", "success");
        });
      } catch (error) {
        console.error("Error capturing screenshot:", error);
        triggerToast(
          "Something wrong when download. Please try again!",
          "fail",
        );
      } finally {
        isLoading = false;
      }
    }
  };

  onMount(() => {
    mixpanel.track("summary_page");
  });
</script>

<SyncData let:address let:enabledFetchAllData>
  <div
    class={`flex flex-col gap-9 ${$isDarkMode ? "bg-[#0f0f0f]" : "bg-white"}`}
  >
    <div
      class="w-full xl:grid grid-cols-4 flex flex-col xl:py-10 py-4 xl:px-6 px-0 gap-9 rounded-[20px] xl:border border_0000001a"
      id="target-performance-summary"
    >
      <div class="w-full flex flex-col gap-5 justify-between col-span-1">
        <div class="flex flex-col gap-2">
          <div class="flex flex-col gap-3 items-center justify-start">
            <RandomAvatar size={80} />

            <div
              class={`text-base font-medium flex items-center gap-2 ${
                $isDarkMode ? "text-white" : "text-black"
              }`}
            >
              {shorterAddress(address)}
            </div>
          </div>

          {#if Object.keys($user).length !== 0}
            <InviterQr />
          {/if}
        </div>

        {#if isNimbusVersion}
          <a
            class={`hover:underline text-center ${
              $isDarkMode ? "text-white" : "text-[#27326f]"
            }`}
            href="https://getnimbus.io/"
            target="_blank"
          >
            https://getnimbus.io/
          </a>
        {/if}
      </div>

      <div class="flex-1 flex flex-col gap-4 col-span-3">
        <div class="flex justify-between items-center gap-4">
          <div class="text-3xl font-medium">{$t("Performance Summary")}</div>
          {#if isNimbusVersion}
            <div class="xl:flex hidden items-center justify-end">
              <button
                id="btn-share-summary"
                class={`flex items-center justify-center gap-2 text-base font-medium text-white px-[9px] py-[7px] min-w-[93px] min-h-[38px] rounded-xl ${isLoading ? "bg-[#dddddd]" : "bg-[#1e96fc]"}`}
                on:click={downloadPage}
                disabled={isLoading}
              >
                {#if isLoading}
                  <div class="flex items-center justify-center">
                    <Loading size={20} />
                  </div>
                {:else}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 16 16"
                    class="m-auto"
                  >
                    <rect width="16" height="16" fill="none" />
                    <path
                      fill="currentColor"
                      d="M10.307 2.105A.5.5 0 0 0 9.5 2.5v1.993a5.372 5.372 0 0 0-1.679.344a4.693 4.693 0 0 0-2.095 1.574c-.623.826-1.081 1.972-1.224 3.544a.5.5 0 0 0 .852.399c1.188-1.19 2.369-1.776 3.242-2.067c.36-.12.668-.19.904-.23V10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0-.025-.769zm-.364 3.392h.003A.502.502 0 0 0 10.5 5V3.522l3.219 2.504l-3.219 2.86V7.5A.5.5 0 0 0 10 7h-.045a4.775 4.775 0 0 0-.456.043c-.3.044-.72.128-1.22.295a8.895 8.895 0 0 0-2.547 1.36c.194-.716.476-1.264.793-1.685a3.693 3.693 0 0 1 1.654-1.242A4.373 4.373 0 0 1 9.82 5.49c.045.001.079.003.1.005zM4.5 3A2.5 2.5 0 0 0 2 5.5v6A2.5 2.5 0 0 0 4.5 14h6a2.5 2.5 0 0 0 2.5-2.5v-1a.5.5 0 0 0-1 0v1a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3 11.5v-6A1.5 1.5 0 0 1 4.5 4h2a.5.5 0 0 0 0-1z"
                    />
                  </svg>
                  {$t("Share")}
                {/if}
              </button>
            </div>
          {/if}
        </div>
        <div class="grid xl:grid-cols-4 grid-cols-2 gap-6">
          <ProfitData
            selectedAddress={address}
            isSync={true}
            {enabledFetchAllData}
          />

          <TopProfitAndLoss
            selectedAddress={address}
            isSync={true}
            {enabledFetchAllData}
          />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-9">
      <ClosedPositionChart
        selectedAddress={address}
        isSync={true}
        {enabledFetchAllData}
      />
      <TokenHoldingTable
        selectedAddress={address}
        isSync={true}
        {enabledFetchAllData}
      />
      <RecentActivitiesTable selectedAddress={address} />
    </div>
  </div>
</SyncData>

<style>
  :global(img) {
    display: inline-block;
  }
</style>
