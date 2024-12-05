<script lang="ts">
  import { useNavigate } from "svelte-navigator";
  import {
    chain,
    wallet,
    isShowHeaderMobile,
    isDarkMode,
    typeWallet,
    userPublicAddress,
    isTWA,
  } from "~/store";
  import { useQueryClient } from "@tanstack/svelte-query";
  import { t } from "~/lib/i18n";

  import Crown from "~/assets/crown.svg";

  export let navActive;
  export let handleUpdateNavActive = (value) => {};

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const MorePage = [
    "/virtual-portfolio",
    "/analytic",
    "/portfolio",
    "/swap",
    "/whales",
    "/yields",
  ];
</script>

<div
  class={`flex justify-between gap-0 md:justify-center md:gap-12 items-center px-6 pt-4 h-[91px] ${$isTWA ? "pb-4" : "pb-8"}`}
>
  <div
    class={`flex items-center gap-3 cursor-pointer hover:opacity-100 transition transition-all ${
      $isDarkMode
        ? navActive === "/portfolio"
          ? "opacity-100 bg-[#ffffff1a] text-[#fff] rounded-full py-2 px-4"
          : "opacity-40"
        : navActive === "/portfolio"
          ? "opacity-100 bg-[#0000001a] text-[#000] rounded-full py-2 px-4"
          : "opacity-40"
    }`}
    on:click={() => {
      handleUpdateNavActive("/portfolio");
      queryClient?.invalidateQueries(["users-me"]);
      if ($wallet) {
        navigate(`/?type=${$typeWallet}&chain=${$chain}&address=${$wallet}`);
      } else {
        navigate("/");
      }
    }}
  >
    <svg
      width="28"
      height="28"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 10.8333L7.5 5.83333L13.3333 10L18.3333 2.5"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M1.66666 17.5L3.53832 13.7567"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M1.66666 10.8334H4.99999L13.3333 15L18.3333 11.6667"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    {#if navActive === "/portfolio"}
      <span class="font-medium text-base">{$t("Portfolio")}</span>
    {/if}
  </div>

  <!-- <div
    class={`flex items-center gap-3 cursor-pointer hover:opacity-100 transition transition-all ${
      $isDarkMode
        ? navActive === "/analytic"
          ? "opacity-100 bg-[#ffffff1a] text-[#fff] rounded-full py-2 px-4"
          : "opacity-40"
        : navActive === "/analytic"
          ? "opacity-100 bg-[#0000001a] text-[#000] rounded-full py-2 px-4"
          : "opacity-40"
    }`}
    on:click={() => {
      handleUpdateNavActive("/analytic");
      queryClient?.invalidateQueries(["users-me"]);
      if ($wallet) {
        navigate(
          `/analytic?type=${$typeWallet}&chain=${$chain}&address=${$wallet}`,
        );
      } else {
        navigate("/");
      }
    }}
  >
    <svg
      width="27"
      height="27"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_101_68)">
        <path
          d="M0.833328 10H5.83333L8.33333 5.83337L11.6667 14.1667L14.1667 10H19.1667"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M10 19.1667C15.0626 19.1667 19.1667 15.0627 19.1667 10C19.1667 4.93743 15.0626 0.833374 10 0.833374C4.93738 0.833374 0.833328 4.93743 0.833328 10C0.833328 15.0627 4.93738 19.1667 10 19.1667Z"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_101_68">
          <rect width="20" height="20" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>

    {#if navActive === "/analytic"}
      <span class="flex gap-[1px]">
        <span class="font-medium text-base">{$t("Analytics")}</span>
        <span class="flex items-center gap-[1px] -mt-2">
          <img src={Crown} alt="" width="16" height="17" />
        </span>
      </span>
    {/if}
  </div> -->

  <div
    class={`flex items-center gap-3 cursor-pointer hover:opacity-100 transition transition-all ${
      $isDarkMode
        ? navActive === "/swap"
          ? "opacity-100 bg-[#ffffff1a] text-[#fff] rounded-full py-2 px-4"
          : "opacity-40"
        : navActive === "/swap"
          ? "opacity-100 bg-[#0000001a] text-[#000] rounded-full py-2 px-4"
          : "opacity-40"
    }`}
    on:click={() => {
      handleUpdateNavActive("/swap");
      queryClient?.invalidateQueries(["users-me"]);
      navigate("/swap");
    }}
  >
    <svg
      width="27"
      height="27"
      viewBox="0 0 134 179"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M84.0701 13.1084C82.714 11.7043 81.9637 9.82385 81.9806 7.87194C81.9976 5.92003 82.7805 4.05288 84.1608 2.67262C85.5411 1.29235 87.4082 0.50943 89.3601 0.492469C91.312 0.475507 93.1925 1.22587 94.5966 2.58193L131.819 39.8042C133.214 41.2002 133.998 43.0934 133.998 45.0674C133.998 47.0414 133.214 48.9346 131.819 50.3306L94.5966 87.5528C93.1925 88.9089 91.312 89.6592 89.3601 89.6423C87.4082 89.6253 85.5411 88.8424 84.1608 87.4621C82.7805 86.0819 81.9976 84.2147 81.9806 82.2628C81.9637 80.3109 82.714 78.4304 84.0701 77.0264L108.585 52.5118H7.44444C5.47006 52.5118 3.57653 51.7275 2.18043 50.3314C0.784325 48.9353 0 47.0418 0 45.0674C0 43.093 0.784325 41.1995 2.18043 39.8034C3.57653 38.4073 5.47006 37.6229 7.44444 37.6229H108.585L84.0701 13.1084ZM49.9299 102.442C51.286 101.038 52.0363 99.1572 52.0194 97.2053C52.0024 95.2534 51.2195 93.3862 49.8392 92.0059C48.4589 90.6257 46.5918 89.8428 44.6399 89.8258C42.688 89.8088 40.8075 90.5592 39.4034 91.9153L2.18122 129.137C0.785606 130.534 0.0015903 132.427 0.0015903 134.401C0.0015903 136.375 0.785606 138.268 2.18122 139.664L39.4034 176.886C40.8075 178.242 42.688 178.993 44.6399 178.976C46.5918 178.959 48.4589 178.176 49.8392 176.795C51.2195 175.415 52.0024 173.548 52.0194 171.596C52.0363 169.644 51.286 167.764 49.9299 166.36L25.4153 141.845H126.556C128.53 141.845 130.423 141.061 131.82 139.665C133.216 138.269 134 136.375 134 134.401C134 132.426 133.216 130.533 131.82 129.137C130.423 127.741 128.53 126.956 126.556 126.956H25.4153L49.9299 102.442Z"
        fill="currentColor"
      />
    </svg>

    {#if navActive === "/swap"}
      <span class="font-medium text-base">{$t("Swap")}</span>
    {/if}
  </div>

  <div
    class={`flex items-center gap-3 cursor-pointer hover:opacity-100 transition transition-all ${
      $isDarkMode
        ? navActive === "/yields"
          ? "opacity-100 bg-[#ffffff1a] text-[#fff] rounded-full py-2 px-4"
          : "opacity-40"
        : navActive === "/yields"
          ? "opacity-100 bg-[#0000001a] text-[#000] rounded-full py-2 px-4"
          : "opacity-40"
    }`}
    on:click={() => {
      handleUpdateNavActive("/yields");
      navigate("/yields");
    }}
  >
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 9L12 4L21 9V20H3V9Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M12 4V20"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M8 12L12 8L16 12"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    {#if navActive === "/yields"}
      <span class="font-medium text-base">{$t("Yields")}</span>
    {/if}
  </div>

  <div
    class={`flex items-center gap-3 cursor-pointer hover:opacity-100 transition transition-all ${
      $isDarkMode
        ? navActive === "/whales"
          ? "opacity-100 bg-[#ffffff1a] text-[#fff] rounded-full py-2 px-4"
          : "opacity-40"
        : navActive === "/whales"
          ? "opacity-100 bg-[#0000001a] text-[#000] rounded-full py-2 px-4"
          : "opacity-40"
    }`}
    on:click={() => {
      handleUpdateNavActive("/whales");
      queryClient?.invalidateQueries(["users-me"]);
      navigate("/whales");
    }}
  >
    <svg
      width="27"
      height="27"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M31.238 26.684c0-1.062-.836-1.917-1.867-1.917s-1.865.855-1.865 1.917c0 .452.159.864.416 1.193c.975-.339 2.396-.775 3.275-.796c.027-.128.041-.261.041-.397m-1.867 1.936c.799.235 1.994.212 2.242 1.913c.473-1.344-.115-2.687-2.242-1.913"
      />
      <path
        fill="currentColor"
        d="M59.639 7c-.947 0-1.622.537-2.404 1.159c-1.077.856-2.553 2.029-4.65 2.029c-1.164 0-2.439-.834-3.465-1.504c-.978-.64-1.822-1.191-2.814-1.191c-.924 0-2.123.553-2.461 2.112c-.459 2.115.977 4.295 1.872 5.406c.347.431.75.868 1.193 1.281c-4.957 1.642-16.24 4.134-39.056 4.134c-4.005 0-5.453 3.882-5.664 5.959c-.043.359-.411 3.573.012 6.266C3.664 42.004 11.051 52 27.398 52c.623 0 1.213-.006 1.781-.017c.952 1.877 2.227 3.214 3.41 2.947c1.01-.229 1.75-1.584 2.17-3.326a23.886 23.886 0 0 0 1.537-.262C37.664 54.383 39.783 57 42.41 57c.281 0 .561-.031.833-.093c3.888-.878 5.198-7.426 4.77-12.405c6.587-6.497 8.327-21.283 8.707-25.76c4.649-2.179 5.28-5.747 5.28-8.684C62 7.221 60.193 7 59.639 7M27.398 50C11.166 50 5.357 39.887 4.177 32.341c-.4-2.548 0-5.734 0-5.734v-.002c.443-.01.886-.021 1.328-.029c.026 3.039.545 6.152 1.669 9.002c1.126 2.904 2.897 5.549 5.153 7.639c2.246 2.105 4.93 3.657 7.749 4.725c2.824 1.076 5.783 1.704 8.753 2.047c-.463.005-.929.011-1.431.011m1.432-.013c-2.951-.489-5.861-1.26-8.588-2.456c-2.725-1.188-5.256-2.831-7.306-4.95a19.537 19.537 0 0 1-4.531-7.463c-.929-2.752-1.273-5.645-1.156-8.569a77.605 77.605 0 0 1 3.014.028c-.117 3.452.689 6.883 2.222 9.906a21.276 21.276 0 0 0 6.703 7.739c2.789 1.98 5.996 3.272 9.289 3.943c2.264.47 4.566.633 6.862.602c.067.225.141.45.217.676c-1.743.323-3.879.501-6.726.544M17.884 36.615c1.736 2.972 4.233 5.43 7.118 7.173c2.885 1.748 6.17 2.786 9.496 2.983c.117.007.234.003.353.008c.114.596.263 1.217.447 1.85c-2.272-.072-4.532-.337-6.726-.894c-3.211-.804-6.273-2.207-8.866-4.226c-2.597-2.009-4.697-4.638-6.041-7.606c-1.314-2.898-1.91-6.113-1.665-9.244c1.116.069 2.227.172 3.33.322a18.558 18.558 0 0 0 2.554 9.634m-.827-9.349c.18.033.361.06.54.098c.9.178 1.78.423 2.649.703c.014 4.618 2.783 9.595 7.238 12.994a20.029 20.029 0 0 0 7.099 3.473c.022.479.063.979.142 1.518c.014.097.035.199.051.298c-.08-.008-.162-.009-.243-.018a20.165 20.165 0 0 1-9.065-3.291c-2.689-1.795-4.945-4.238-6.439-7.075a16.992 16.992 0 0 1-1.972-8.7m37.757-9.898c-.086 2.465-1.46 17.51-7.213 24.599v-.001a11.977 11.977 0 0 1-1.691 1.727c.668 4.582-.564 10.689-3.106 11.264c-.13.028-.261.043-.394.043c-2.439 0-5.072-4.892-5.707-9.239c-.1-.679-.139-1.301-.135-1.879c-.422-.041-.799-.1-1.132-.164a19.064 19.064 0 0 1-7.346-3.452c-4.101-3.13-6.685-7.639-6.831-11.855c.908.332 1.808.701 2.696 1.114c1.036.444 2.081 1.023 3.298 1.133c1.236.076 2.331-.546 3.188-1.277c-.973.576-2.068 1.059-3.141.846c-1.065-.173-2.041-.785-3.049-1.313a22.98 22.98 0 0 0-6.479-2.413a30.648 30.648 0 0 0-6.868-.582c-2.261.048-4.511.27-6.727.675c.017-.158.468-4.165 3.674-4.165c35.545 0 43.586-5.932 43.586-5.932c-2.357 0-6.121-4.254-5.642-6.465c.083-.383.257-.537.507-.537c1.049 0 3.449 2.695 6.279 2.695c4.045 0 6.248-3.188 7.055-3.188c.249-.002.364.292.364 1.057c0 3.237-.863 5.736-5.186 7.309"
      />
    </svg>

    {#if navActive === "/whales"}
      <span class="font-medium text-base">
        {$t("Whale")}
      </span>
    {/if}
  </div>

  <!-- <div
    class={`flex items-center gap-3 cursor-pointer hover:opacity-100 transition transition-all ${
      $isDarkMode
        ? navActive === "/virtual-portfolio"
          ? "opacity-100 bg-[#ffffff1a] text-[#fff] rounded-full py-2 px-4"
          : "opacity-40"
        : navActive === "/virtual-portfolio"
          ? "opacity-100 bg-[#0000001a] text-[#000] rounded-full py-2 px-4"
          : "opacity-40"
    }`}
    on:click={() => {
      handleUpdateNavActive("/virtual-portfolio");
      queryClient?.invalidateQueries(["users-me"]);
      navigate(`/virtual-portfolio?type=main&address=${$userPublicAddress}`);
    }}
  >
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width="27"
      height="27"
      viewBox="0 0 512.000000 512.000000"
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
        fill="currentColor"
        stroke="none"
      >
        <path
          d="M78 4789 c-23 -12 -46 -35 -58 -59 -20 -39 -20 -56 -20 -1720 0
-1665 0 -1681 20 -1720 13 -26 34 -47 60 -60 38 -20 57 -20 885 -20 l845 0 0
-300 0 -300 -90 0 c-71 0 -99 -4 -130 -20 -45 -23 -80 -80 -80 -130 0 -50 35
-107 80 -130 38 -20 57 -20 970 -20 913 0 932 0 970 20 45 23 80 80 80 130 0
50 -35 107 -80 130 -31 16 -59 20 -130 20 l-90 0 0 300 0 300 845 0 c828 0
847 0 885 20 26 13 47 34 60 60 20 39 20 55 20 1720 0 1665 0 1681 -20 1720
-13 26 -34 47 -60 60 -39 20 -53 20 -2482 20 -2413 -1 -2443 -1 -2480 -21z
m4742 -1779 l0 -1500 -2260 0 -2260 0 0 1500 0 1500 2260 0 2260 0 0 -1500z
m-1810 -2100 l0 -300 -450 0 -450 0 0 300 0 300 450 0 450 0 0 -300z"
        />
        <path
          d="M1546 4100 c-237 -38 -443 -140 -611 -305 -166 -162 -272 -356 -316
-580 -20 -99 -18 -330 4 -427 93 -430 425 -762 855 -855 97 -22 328 -24 427
-4 224 44 418 150 580 316 420 431 420 1099 0 1530 -158 162 -341 264 -560
311 -85 19 -298 26 -379 14z m4 -715 c0 -387 1 -408 20 -445 13 -26 34 -47 60
-60 37 -19 58 -20 445 -20 l405 0 0 -22 c-1 -42 -65 -193 -112 -263 -323 -485
-1020 -484 -1339 3 -204 312 -159 731 108 996 32 32 89 79 128 104 70 47 221
111 263 112 l22 0 0 -405z m421 375 c221 -81 398 -258 479 -479 49 -134 80
-121 -285 -121 l-315 0 0 315 c0 365 -13 334 121 285z"
        />
        <path
          d="M3939 3507 c-47 -31 -71 -81 -66 -136 6 -53 32 -90 83 -116 21 -11
41 -21 44 -23 2 -1 -77 -84 -175 -182 l-180 -180 -161 161 c-128 128 -168 162
-197 169 -108 24 -203 -67 -183 -177 7 -33 38 -69 234 -266 243 -243 261 -257
339 -243 33 7 71 40 289 258 l252 250 11 -34 c33 -99 152 -132 236 -66 49 39
55 69 55 290 0 228 -6 253 -69 295 -33 22 -42 23 -256 23 -214 0 -223 -1 -256
-23z"
        />
        <path
          d="M3178 2189 c-43 -22 -78 -81 -78 -129 0 -50 35 -107 80 -130 38 -19
58 -20 630 -20 572 0 592 1 630 20 45 23 80 80 80 130 0 50 -35 107 -80 130
-38 19 -57 20 -632 20 -571 -1 -594 -2 -630 -21z"
        />
      </g>
    </svg>

    {#if navActive === "/virtual-portfolio"}
      <span class="font-medium text-base">Paper Trade</span>
    {/if}
  </div> -->

  <div
    class={`flex items-center gap-3 cursor-pointer hover:opacity-100 transition transition-all
          ${
            $isDarkMode
              ? !MorePage.includes(navActive)
                ? "opacity-100 bg-[#ffffff1a] text-[#fff] rounded-full py-2 px-4"
                : "opacity-40"
              : !MorePage.includes(navActive)
                ? "opacity-100 bg-[#0000001a] text-[#000] rounded-full py-2 px-4"
                : "opacity-40"
          }
          `}
    on:click={() => {
      isShowHeaderMobile.update((n) => (n = true));
    }}
  >
    <svg
      width="31"
      height="31"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.0038 21.7929C17.4124 21.7929 21.7968 17.4084 21.7968 11.9999C21.7968 6.59144 17.4124 2.20703 12.0038 2.20703C6.59535 2.20703 2.21094 6.59144 2.21094 11.9999C2.21094 17.4084 6.59535 21.7929 12.0038 21.7929Z"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <circle cx="16.6196" cy="12.0025" r="1.40871" fill="currentColor" />
      <circle cx="12.0025" cy="12.0025" r="1.40871" fill="currentColor" />
      <circle cx="7.38527" cy="12.0025" r="1.40871" fill="currentColor" />
    </svg>

    {#if !MorePage.includes(navActive)}
      <span class="font-medium text-base">{$t("More")}</span>
    {/if}
  </div>
</div>

<style></style>
