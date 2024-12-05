<script lang="ts">
  import { onMount } from "svelte";
  import { useNavigate } from "svelte-navigator";
  import { getTooltipContent } from "~/utils/index";
  import { createQuery } from "@tanstack/svelte-query";
  import { isDarkMode, triggerConnectWallet, user } from "~/store";
  import { getUserInfo, getPackagePrice } from "~/lib/queryAPI";
  import { nimbus } from "~/lib/network";
  import { triggerToast } from "~/utils/functions";
  import tooltip from "~/lib/tooltip";
  import { t } from "~/lib/i18n";

  import Button from "~/components/Button.svelte";
  import { priceTable } from "~/UI/PricePackage/DataTable";
  import CompareTable from "~/UI/PricePackage/CompareTable.svelte";

  import Coinbase from "~/assets/coinbase.png";

  export let selectedPackage = (item) => {};

  const navigate = useNavigate();

  let selectedPricePackage = "Free";
  let buyPackage = "Free";
  let interval = "month";
  let endDatePackage: any;
  let checkedTypePackage = true;

  let packagePrice: any = [];

  const dateDiffInDays = (a: any, b: any) => {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
  };

  $: queryGetPackagePrice = createQuery({
    queryKey: ["package-price"],
    queryFn: () => getPackagePrice("USD"),
    retry: false,
  });

  $: {
    if (
      !$queryGetPackagePrice.isError &&
      $queryGetPackagePrice &&
      $queryGetPackagePrice.data !== undefined
    ) {
      packagePrice = $queryGetPackagePrice.data;
    }
  }

  const handleFormatDataPrice = (type: string) => {
    const formatPackagePrice = packagePrice.map((item: any) => {
      return {
        ...item,
        type: item.month === 12 ? "year" : "month",
      };
    });

    const selectedPackage = formatPackagePrice.find(
      (item: any) => item.plan === type && item.type === selectedTypePackage,
    );

    return selectedPackage
      ? selectedTypePackage === "year"
        ? selectedPackage?.price / selectedPackage?.month
        : selectedPackage?.price
      : "-";
  };

  $: queryUserInfo = createQuery({
    queryKey: ["users-me"],
    queryFn: () => getUserInfo(),
    retry: false,
  });

  $: {
    if (
      !$queryUserInfo.isError &&
      $queryUserInfo &&
      $queryUserInfo.data !== undefined
    ) {
      selectedPricePackage = $queryUserInfo.data.plan?.tier;
      buyPackage = $queryUserInfo.data.plan?.tier;
      interval = $queryUserInfo.data.plan?.interval;
      endDatePackage = $queryUserInfo.data.plan?.endDate;
    }
  }

  const compareResult = (item: any) => {
    if (item.state === "available") {
      return "✅";
    } else if (item.state === "unavailable") {
      return "⛔";
    } else {
      return "⚠️";
    }
  };

  $: detailPackage = (item: any) => {
    const contentData =
      selectedPricePackage === "Free"
        ? item.content.free
        : selectedPricePackage === "Explorer"
          ? item.content.explorer
          : item.content.alpha;

    return `
      <div class="text-xl flex items-start justify-end gap-2">
        <div class="text-right text-base">
          ${contentData.description}
        </div>
        <div class="w-4 h-4">
          ${compareResult(contentData)}
        </div>
      </div>
    `;
  };

  $: selectedTypePackage = checkedTypePackage ? "year" : "month";

  let isLoadingSubmitCoupleCode = false;
  let code = "";

  onMount(() => {
    if ($user && Object.keys($user).length === 0) {
      handleTriggerConnectWallet();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const codeParams = urlParams.get("code");

    if (codeParams) {
      code = codeParams;
    }
  });

  const handleTriggerConnectWallet = async () => {
    triggerConnectWallet.update((n) => (n = true));
    window.scrollTo({
      left: 0,
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  const submitTrial = async (code: any) => {
    try {
      await nimbus.post("/v2/payments/redeem-code", {
        code,
        plan: "Explorer",
      });
      navigate(`/payments/success?isTrial=${true}`);
    } catch (e) {
      console.error(e);
    }
  };

  const onSubmitCoupleCode = async (e) => {
    isLoadingSubmitCoupleCode = true;
    const formData = new FormData(e.target);
    const data: any = {};
    for (let field of formData) {
      const [key, value] = field;
      data[key] = value;
    }
    try {
      const response: any = await nimbus.post("/v3/payments/check-coupon", {
        code: data.code,
      });
      if (response?.error) {
        triggerToast(response?.error, "fail");
      } else {
        if (response?.data?.status === 1) {
          if (response?.data?.type === "Free Trial") {
            triggerToast(response?.data?.message, "success");
            await submitTrial(data.code);
          } else {
            triggerToast("Invalid coupon code. Please try again!", "fail");
          }
        }

        if (response?.data?.status === 0) {
          triggerToast(response?.data?.message, "fail");
        }
      }

      isLoadingSubmitCoupleCode = false;
      code = "";
    } catch (e) {
      console.error(e);
      isLoadingSubmitCoupleCode = false;
      triggerToast(
        "There are some error when apply your coupon code. Please try again!",
        "fail",
      );
    }
  };
</script>

<div class="flex flex-col xl:gap-4 gap-8">
  <div class="p-4 text-green-600 rounded-lg text-base bg-green-50" role="alert">
    <span class="mr-2 xl:mr-1">⭐️</span> We're giving 1000 coupon codes
    <span class="sm:font-bold font-semibold">EARLY-BIRD</span>
    which get <span class="sm:font-bold font-semibold">30%</span> off for the first-time
    payment.
  </div>

  <div class="flex flex-col gap-10 mt-4">
    <!-- Pricing Table PC -->
    <div class="xl:block hidden rounded-[10px] border border_0000000d">
      <table class="table-auto w-full">
        <thead>
          <tr class="bg_f4f5f8">
            <th class="py-3 pl-3 rounded-tl-[10px] w-[420px]">
              <div class="flex flex-col items-start">
                <div class="text-left text-lg uppercase font-medium">Plans</div>
                <div class="text-center text-base font-medium text-[#1e96fc]">
                  {#if buyPackage !== "Free"}
                    Your <span class="uppercase"
                      >{buyPackage === "Professional"
                        ? "Alpha"
                        : buyPackage}</span
                    >
                    plan has
                    <span class="font-medium"
                      >{dateDiffInDays(new Date(), new Date(endDatePackage))} days
                      left</span
                    >
                  {:else}
                    Your plan is Free
                  {/if}
                </div>
              </div>
            </th>

            <th class="py-3 pr-3 h-full">
              <div class="text-left text-lg uppercase font-medium pb-6">
                Free
              </div>
            </th>

            <th class="py-3 pr-3">
              <div class="flex items-center gap-2 pb-6">
                <div class="text-lg uppercase font-medium">Explorer</div>
                {#if selectedTypePackage === "year"}
                  <div
                    class="text-white font-normal text-sm px-2 py-1 bg-[#10b981] rounded-lg"
                  >
                    Save 1.75 USD
                  </div>
                {:else}
                  <div class="h-[28px]" />
                {/if}
              </div>
            </th>

            <th class="py-3 px-3 rounded-tr-[10px]">
              <div class="flex items-center gap-2 pb-6">
                <div class="text-lg uppercase font-medium">Alpha</div>
                {#if selectedTypePackage === "year"}
                  <div
                    class="text-white font-normal text-sm px-2 py-1 bg-[#10b981] rounded-lg"
                  >
                    Save 17.5 USD
                  </div>
                {:else}
                  <div class="h-[28px]" />
                {/if}
              </div>
            </th>
          </tr>

          <tr class="bg_f4f5f8">
            <td class="py-3 pl-3 w-[420px]">
              <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3">
                  <label class="switch" for="switch">
                    <input
                      type="checkbox"
                      id="switch"
                      bind:checked={checkedTypePackage}
                    />
                    <span class="slider" />
                  </label>
                  <div class="text-base font-medium">
                    {$t("Annual Billing")}
                    <span class="text-green-500">(Save 17%)</span>
                  </div>
                </div>
                <div class=" min-h-[30px]"></div>
              </div>
            </td>

            <!-- Free -->
            <td class="py-3 pr-3">
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <div class="text-3xl font-semibold">0 USD</div>
                  <div class="text-base font-medium">
                    {$t("For those who starting to invest")}
                  </div>
                </div>

                <div class=" min-h-[30px]"></div>
              </div>
            </td>

            <!-- Explorer -->
            <td class="py-3 pr-3">
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-1 text-3xl font-semibold">
                    {packagePrice
                      ? checkedTypePackage
                        ? handleFormatDataPrice("Explorer")
                        : handleFormatDataPrice("Explorer")
                      : "-"} USD
                    <div class="text-base font-medium text-[#6b7380]">
                      /month
                    </div>
                  </div>
                  <div class="text-base font-medium">
                    {$t("Boost your return and reduce your risk")}
                  </div>
                </div>

                {#if $user && Object.keys($user)?.length !== 0}
                  <div class="w-max flex items-center min-h-[30px]">
                    {#if selectedTypePackage === "month"}
                      <div class="font-medium text-lg">
                        {#if buyPackage === "Free"}
                          <div
                            class="flex items-center gap-2 cursor-pointer text-[#1E96FC]"
                            on:click={() => {
                              selectedPackage({
                                plan: "Explorer",
                                selectedTypePackage,
                                price: 9.99,
                              });
                            }}
                          >
                            Upgrade
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="#1E96FC"
                              xmlns="http://www.w3.org/2000/svg"
                              ><path
                                d="M10.4767 6.17348L6.00668 1.70348L7.18501 0.525146L13.6667 7.00681L7.18501 13.4885L6.00668 12.3101L10.4767 7.84015H0.333344V6.17348H10.4767Z"
                                fill=""
                              /></svg
                            >
                          </div>
                        {/if}
                      </div>
                    {/if}

                    {#if selectedTypePackage === "year"}
                      <div class="font-medium text-lg">
                        {#if buyPackage === "Free"}
                          <div
                            class="flex items-center gap-2 cursor-pointer text-[#1E96FC]"
                            on:click={() => {
                              selectedPackage({
                                plan: "Explorer",
                                selectedTypePackage,
                                price: 8.25,
                              });
                            }}
                          >
                            Upgrade
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="#1E96FC"
                              xmlns="http://www.w3.org/2000/svg"
                              ><path
                                d="M10.4767 6.17348L6.00668 1.70348L7.18501 0.525146L13.6667 7.00681L7.18501 13.4885L6.00668 12.3101L10.4767 7.84015H0.333344V6.17348H10.4767Z"
                                fill=""
                              /></svg
                            >
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </td>

            <!-- Professional -->
            <td class="py-3 px-3">
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-1 text-3xl font-semibold">
                    {packagePrice
                      ? checkedTypePackage
                        ? handleFormatDataPrice("Professional")
                        : handleFormatDataPrice("Professional")
                      : "-"} USD
                    <div class="text-base font-medium text-[#6b7380]">
                      /month
                    </div>
                  </div>
                  <div class="text-base font-medium">
                    {$t("Enjoy all the features without any limitation")}
                  </div>
                </div>

                {#if $user && Object.keys($user)?.length !== 0}
                  <div class="w-max flex items-center min-h-[30px]">
                    {#if selectedTypePackage === "month"}
                      <div class="font-medium text-lg">
                        {#if buyPackage === "Free"}
                          <div
                            class="flex items-center gap-2 cursor-pointer text-[#1E96FC]"
                            on:click={() => {
                              selectedPackage({
                                plan: "Professional",
                                selectedTypePackage,
                                price: 99.99,
                              });
                            }}
                          >
                            Upgrade
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="#1E96FC"
                              xmlns="http://www.w3.org/2000/svg"
                              ><path
                                d="M10.4767 6.17348L6.00668 1.70348L7.18501 0.525146L13.6667 7.00681L7.18501 13.4885L6.00668 12.3101L10.4767 7.84015H0.333344V6.17348H10.4767Z"
                                fill=""
                              /></svg
                            >
                          </div>
                        {/if}
                      </div>
                    {/if}

                    {#if selectedTypePackage === "year"}
                      <div class="font-medium text-lg">
                        {#if buyPackage === "Free"}
                          <div
                            class="flex items-center gap-2 cursor-pointer text-[#1E96FC]"
                            on:click={() => {
                              selectedPackage({
                                plan: "Professional",
                                selectedTypePackage,
                                price: 82.5,
                              });
                            }}
                          >
                            Upgrade
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="#1E96FC"
                              xmlns="http://www.w3.org/2000/svg"
                              ><path
                                d="M10.4767 6.17348L6.00668 1.70348L7.18501 0.525146L13.6667 7.00681L7.18501 13.4885L6.00668 12.3101L10.4767 7.84015H0.333344V6.17348H10.4767Z"
                                fill=""
                              /></svg
                            >
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </td>
          </tr>
        </thead>

        <tbody>
          {#each priceTable as item}
            {#if item.featureStatus === "main"}
              <tr class={`${$isDarkMode ? "bg-[#1C1C1C]" : "bg-gray-50"}`}>
                <th colspan="8" class="py-3 pl-3">
                  <div class="text-lg text-left font-medium">
                    {item.title}
                  </div>
                </th>
              </tr>
            {/if}
            {#if item.featureStatus === "part"}
              <tr class="group transition-all">
                <td
                  class={`py-3 pl-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                >
                  <div class="md:block hidden text-base w-max">
                    {#if item.tippy.used}
                      <div
                        use:tooltip={{
                          content: getTooltipContent(
                            item.tippy.title,
                            item.tippy.content,
                            false,
                            $isDarkMode,
                          ),
                          allowHTML: true,
                          placement: "top",
                          interactive: true,
                        }}
                        class="underline-dashed"
                      >
                        {item.title}
                      </div>
                    {:else}
                      {item.title}
                    {/if}
                  </div>
                  <div class="md:hidden block text-base w-max">
                    {item.title}
                  </div>
                </td>

                <td
                  class={`py-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                >
                  <div class="text-base">
                    <span class="w-4 h-4 mr-1">
                      {compareResult(item.content.free)}
                    </span>{" "}
                    {item.content.free.description}
                  </div>
                </td>

                <td
                  class={`py-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                >
                  <div class="text-base">
                    <span class="w-4 h-4 mr-1">
                      {compareResult(item.content.explorer)}
                    </span>{" "}
                    {item.content.explorer.description}
                  </div>
                </td>

                <td
                  class={`py-3 pr-3 ${
                    $isDarkMode
                      ? "group-hover:bg-[#000]"
                      : "group-hover:bg-gray-100"
                  }`}
                >
                  <div class="text-base">
                    <span class="w-4 h-4 mr-1">
                      {compareResult(item.content.alpha)}
                    </span>{" "}
                    {item.content.alpha.description}
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pricing Table Tablet/Mobile -->
    <div class="xl:hidden flex flex-col items-center gap-8">
      <div class="flex flex-col gap-8">
        <div class="text-center text-xl font-medium text-[#1e96fc]">
          {#if buyPackage !== "Free"}
            Your <span class="uppercase"
              >{buyPackage === "Professional" ? "Alpha" : buyPackage}</span
            >
            plan has
            <span class="font-medium"
              >{dateDiffInDays(new Date(), new Date(endDatePackage))} days left</span
            >
          {:else}
            Your plan is Free
          {/if}
        </div>

        <div class="flex items-center justify-center gap-3">
          <label class="switch" for="switch">
            <input
              type="checkbox"
              id="switch"
              bind:checked={checkedTypePackage}
            />
            <span class="slider" />
          </label>
          <div class="text-xl font-medium">
            {$t("Annual Billing")}
            <span class="text-green-500">(Save 17%)</span>
          </div>
        </div>

        <div class="flex justify-center gap-5">
          <div
            class={`uppercase py-3 px-4 text-lg font-medium rounded-2xl cursor-pointer ${
              selectedPricePackage === "Free" && !$isDarkMode
                ? "bg-blue-100 text-primary"
                : selectedPricePackage === "Free" && $isDarkMode
                  ? "bg-gray-500 text-white"
                  : $isDarkMode
                    ? "text-white"
                    : "text-black"
            }`}
            on:click={() => {
              selectedPricePackage = "Free";
            }}
          >
            Free
          </div>

          <div
            class={`uppercase py-3 px-4 text-lg font-medium rounded-2xl cursor-pointer ${
              selectedPricePackage === "Explorer" && !$isDarkMode
                ? "bg-blue-100 text-primary"
                : selectedPricePackage === "Explorer" && $isDarkMode
                  ? "bg-gray-500 text-white"
                  : $isDarkMode
                    ? "text-white"
                    : "text-black"
            }`}
            on:click={() => {
              selectedPricePackage = "Explorer";
            }}
          >
            Explorer
          </div>

          <div
            class={`uppercase py-3 px-4 text-lg font-medium rounded-2xl cursor-pointer ${
              selectedPricePackage === "Professional" && !$isDarkMode
                ? "bg-blue-100 text-primary"
                : selectedPricePackage === "Professional" && $isDarkMode
                  ? "bg-gray-500 text-white"
                  : $isDarkMode
                    ? "text-white"
                    : "text-black"
            }`}
            on:click={() => {
              selectedPricePackage = "Professional";
            }}
          >
            Alpha
          </div>
        </div>

        <div class="flex items-center justify-center">
          {#if selectedPricePackage === "Free"}
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2 justify-center items-center">
                <div class="text-lg font-medium uppercase">Free</div>
                <span class="text-2xl font-semibold">0 USD</span>
                <div class="text-lg text-center">
                  {$t("For those who starting to invest")}
                </div>
              </div>
              <div class=" min-h-[30px]"></div>
            </div>
          {/if}

          {#if selectedPricePackage === "Explorer"}
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2 justify-center items-center">
                <div class="text-lg font-medium uppercase">
                  Explorer{" "}
                  {#if selectedTypePackage === "year"}
                    <span
                      class="text-white px-2 py-1 font-normal ml-3 bg-[#10b981] rounded-lg"
                    >
                      Save 1.75 USD
                    </span>
                  {/if}
                </div>
                <div class="text-2xl font-medium">
                  {packagePrice
                    ? checkedTypePackage
                      ? handleFormatDataPrice("Explorer")
                      : handleFormatDataPrice("Explorer")
                    : "-"} USD{" "}
                  <span class="text-[#6b7380] text-lg font-medium">
                    /month
                  </span>
                </div>
                <div class="text-lg text-center">
                  {$t("Boost your return and reduce your risk")}
                </div>
              </div>

              <div class="flex justify-center min-h-[30px]">
                {#if selectedTypePackage === "month"}
                  <div class="font-medium text-xl">
                    {#if buyPackage === "Free"}
                      <div
                        class="flex items-center gap-2 cursor-pointer text-[#1E96FC]"
                        on:click={() => {
                          selectedPackage({
                            plan: "Explorer",
                            selectedTypePackage,
                            price: 9.99,
                          });
                        }}
                      >
                        Upgrade
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 14 14"
                          fill="#1E96FC"
                          xmlns="http://www.w3.org/2000/svg"
                          ><path
                            d="M10.4767 6.17348L6.00668 1.70348L7.18501 0.525146L13.6667 7.00681L7.18501 13.4885L6.00668 12.3101L10.4767 7.84015H0.333344V6.17348H10.4767Z"
                            fill=""
                          /></svg
                        >
                      </div>
                    {/if}
                  </div>
                {/if}

                {#if selectedTypePackage === "year"}
                  <div class="font-medium text-xl">
                    {#if buyPackage === "Free"}
                      <div
                        class="flex items-center gap-2 cursor-pointer text-[#1E96FC]"
                        on:click={() => {
                          selectedPackage({
                            plan: "Explorer",
                            selectedTypePackage,
                            price: 8.25,
                          });
                        }}
                      >
                        Upgrade
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 14 14"
                          fill="#1E96FC"
                          xmlns="http://www.w3.org/2000/svg"
                          ><path
                            d="M10.4767 6.17348L6.00668 1.70348L7.18501 0.525146L13.6667 7.00681L7.18501 13.4885L6.00668 12.3101L10.4767 7.84015H0.333344V6.17348H10.4767Z"
                            fill=""
                          /></svg
                        >
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          {#if selectedPricePackage === "Professional"}
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2 justify-center items-center">
                <div class="text-lg font-medium uppercase">
                  Alpha{" "}
                  {#if selectedTypePackage === "year"}
                    <span
                      class="text-white px-2 py-1 font-normal ml-3 bg-[#10b981] rounded-lg"
                    >
                      Save 17.5 USD
                    </span>
                  {/if}
                </div>
                <div class="text-2xl font-medium">
                  {packagePrice
                    ? checkedTypePackage
                      ? handleFormatDataPrice("Professional")
                      : handleFormatDataPrice("Professional")
                    : "-"} USD{" "}
                  <span class="text-[#6b7380] text-lg font-medium">
                    /month
                  </span>
                </div>
                <div class="text-lg text-center">
                  {$t("Enjoy all the features without any limitation")}
                </div>
              </div>

              <div class="flex justify-center min-h-[30px]">
                {#if selectedTypePackage === "month"}
                  <div class="font-medium text-xl w-max">
                    {#if buyPackage === "Free"}
                      <div
                        class="flex items-center gap-2 cursor-pointer text-[#1E96FC]"
                        on:click={() => {
                          selectedPackage({
                            plan: "Professional",
                            selectedTypePackage,
                            price: 99.99,
                          });
                        }}
                      >
                        Upgrade
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 14 14"
                          fill="#1E96FC"
                          xmlns="http://www.w3.org/2000/svg"
                          ><path
                            d="M10.4767 6.17348L6.00668 1.70348L7.18501 0.525146L13.6667 7.00681L7.18501 13.4885L6.00668 12.3101L10.4767 7.84015H0.333344V6.17348H10.4767Z"
                            fill=""
                          /></svg
                        >
                      </div>
                    {/if}
                  </div>
                {/if}

                {#if selectedTypePackage === "year"}
                  <div class="font-medium text-xl w-max">
                    {#if buyPackage === "Free"}
                      <div
                        class="flex items-center gap-2 cursor-pointer text-[#1E96FC]"
                        on:click={() => {
                          selectedPackage({
                            plan: "Professional",
                            selectedTypePackage,
                            price: 82.5,
                          });
                        }}
                      >
                        Upgrade
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 14 14"
                          fill="#1E96FC"
                          xmlns="http://www.w3.org/2000/svg"
                          ><path
                            d="M10.4767 6.17348L6.00668 1.70348L7.18501 0.525146L13.6667 7.00681L7.18501 13.4885L6.00668 12.3101L10.4767 7.84015H0.333344V6.17348H10.4767Z"
                            fill=""
                          /></svg
                        >
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>

      <div class="w-full rounded-[10px] border border_0000000d">
        <table class="w-full table-auto">
          <tbody>
            {#each priceTable as item}
              {#if item.featureStatus === "main"}
                <tr class={`${$isDarkMode ? "bg-[#1C1C1C]" : "bg-gray-50"}`}>
                  <td colspan="8" class="py-4 px-3">
                    <div class="text-lg text-left font-medium">
                      {item.title}
                    </div>
                  </td>
                </tr>
              {/if}
              {#if item.featureStatus === "part"}
                <tr class="group transition-all">
                  <td
                    class={`py-4 px-3 ${
                      $isDarkMode
                        ? "group-hover:bg-[#000]"
                        : "group-hover:bg-gray-100"
                    }`}
                  >
                    <div class="md:block hidden w-max w-[180px]">
                      {#if item.tippy.used}
                        <div
                          use:tooltip={{
                            content: getTooltipContent(
                              item.tippy.title,
                              item.tippy.content,
                              false,
                              $isDarkMode,
                            ),
                            allowHTML: true,
                            placement: "top",
                            interactive: true,
                          }}
                          class="underline-dashed"
                        >
                          {item.title}
                        </div>
                      {:else}
                        {item.title}
                      {/if}
                    </div>
                    <div class="md:hidden block text-base w-auto">
                      {item.title}
                    </div>
                  </td>

                  <td
                    class={`py-4 pr-3 flex justify-end items-center h-full min-h-[80px] ${
                      $isDarkMode
                        ? "group-hover:bg-[#000]"
                        : "group-hover:bg-gray-100"
                    }`}
                  >
                    {@html detailPackage(item)}
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <CompareTable />
  </div>

  <div class="flex flex-col justify-center items-center">
    <div class="text-base">Promo code / coupon</div>
    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-3 justify-center items-center mt-2">
        <form
          on:submit|preventDefault={onSubmitCoupleCode}
          class="flex items-center gap-3"
        >
          <div
            class={`input-2 input-border w-full xl:py-[4px] py-3 px-3 ${
              code && !$isDarkMode ? "bg-[#F0F2F7]" : "bg_fafafbff"
            }`}
          >
            <input
              type="text"
              id="code"
              name="code"
              required
              placeholder="Enter your code"
              bind:value={code}
              class={`p-0 border-none focus:outline-none focus:ring-0 text-sm font-normal ${
                code && !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
              } ${
                $isDarkMode
                  ? "text-white"
                  : "text-[#5E656B] placeholder-[#5E656B]"
              }`}
              on:change={(event) => {
                code = event?.target?.value;
              }}
            />
          </div>
          <div class="w-[120px]">
            <Button
              type="submit"
              isLoading={isLoadingSubmitCoupleCode}
              disabled={isLoadingSubmitCoupleCode}
            >
              Apply
            </Button>
          </div>
        </form>
      </div>
      <div
        class={`flex items-center gap-1 text-sm ${$isDarkMode ? "text-white/70" : "text-black/70"}`}
      >
        (Only apply for <span class="flex items-center gap-1">
          <img src={Coinbase} alt="coinbase" class="w-5 h-5 rounded-full" />
          Coinbase
        </span> payment method)
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) .bg_fafafbff {
    background: #fafafbff;
  }
  :global(body.dark) .bg_fafafbff {
    background: #212121;
  }

  .underline-dashed {
    text-decoration: underline 1.5px dotted;
    text-underline-offset: 3px;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    border-radius: 34px;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 2px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    border-radius: 50%;
  }
  input:checked + .slider {
    background-color: #2196f3;
  }
  input:checked + .slider {
    box-shadow: 0 0 1px #2196f3;
  }
  input:checked + .slider:before {
    -webkit-transform: translateX(16px);
    -ms-transform: translateX(16px);
    transform: translateX(16px);
  }

  @media screen and (max-width: 1280px) {
    .switch {
      width: 60px;
      height: 30px;
    }

    .slider {
      border-radius: 44px;
    }

    .slider:before {
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 2px;
    }

    input:checked + .slider:before {
      -webkit-transform: translateX(26px);
      -ms-transform: translateX(26px);
      transform: translateX(26px);
    }
  }
</style>
