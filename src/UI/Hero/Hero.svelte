<script lang="ts">
  import { nimbus } from "~/lib/network";
  import { useNavigate } from "svelte-navigator";
  import mixpanel from "mixpanel-browser";
  import * as browser from "webextension-polyfill";
  import { t } from "~/lib/i18n";

  import {
    tab,
    chain,
    isDarkMode,
    triggerConnectWallet,
    triggerSync,
    typeWallet,
    wallet,
    user,
    triggerModalAddAddress,
    isTWA,
  } from "~/store";
  import { bigGeneration, otherGeneration } from "~/lib/chains";
  import { handleValidateAddress } from "~/lib/queryAPI";
  import { DemoAddress, isNimbusVersion } from "~/utils/constants";
  import { useQueryClient } from "@tanstack/svelte-query";

  import Button from "~/components/Button.svelte";
  import TmaTonAuth from "../Auth/TMATonAuth.svelte";

  import Plus from "~/assets/plus.svg";
  import checkMark from "~/assets/check.svg";
  import heroImage from "~/assets/recap/hero/heroimage.png";
  import WhitePaperHero from "~/assets/white-paper-version/hero-whitelabel.png";
  import User from "~/assets/user.png";

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  let search = "";

  const handleSearch = (event: any) => {
    search = event.target.value;
  };

  const handleSearchAddress = async (value: string) => {
    if (value) {
      mixpanel.track("user_search");
      const validateAccount = await handleValidateAddress(value);

      if (!isNimbusVersion) {
        handleWhiteLabelAuth(validateAccount?.address);
      }

      chain.update((n) => (n = "ALL"));
      wallet.update((n) => (n = validateAccount?.address));
      typeWallet.update((n) => (n = validateAccount?.type));

      browser.storage.sync.set({
        selectedWallet: validateAccount?.address,
      });
      browser.storage.sync.set({ selectedChain: "ALL" });
      browser.storage.sync.set({
        typeWalletAddress: validateAccount?.type,
      });

      if (bigGeneration.includes(validateAccount?.type)) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname +
            `?tab=${$tab}&type=${validateAccount?.type}&chain=ALL&address=${validateAccount?.address}`,
        );
      }

      if (otherGeneration.includes(validateAccount?.type)) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname +
            `?tab=${$tab}&type=${validateAccount?.type}&address=${validateAccount?.address}`,
        );
      }

      search = "";
    }
  };

  const closeMobileAddAccountModal = () => {
    triggerModalAddAddress.update((n) => (n = false));
  };

  const handleWhiteLabelAuth = async (address: string) => {
    try {
      const response: any = await nimbus.post("/auth/whitelabel", {
        publicAddress: address,
      });
      if (response?.data?.result) {
        localStorage.setItem("token", response?.data?.result);
        user.update(
          (n) =>
            (n = {
              picture: User,
            }),
        );

        queryClient.invalidateQueries(["users-me"]);
        queryClient.invalidateQueries(["list-address"]);
      } else {
        console.log("error: ", response?.error?.error);
      }
    } catch (e) {
      console.error("error: ", e);
    }
  };
</script>

<div class="flex xl:flex-row flex-col xl:gap-0 gap-10 lg:px-0 px-5">
  <div
    class="xl:order-1 order-2 xl:flex-[0.7] flex-1 flex flex-col items-start gap-6"
  >
    <div class="flex flex-col gap-4">
      <div class="font-bold text-4xl">
        {$t("Your Personalized portfolio")}
      </div>
      <div class="flex flex-col gap-2">
        <div class="text-lg">
          {$t("Track your")}
        </div>
        <div class="grid md:grid-cols-2 grid-cols-1 grid-rows-2 text-base">
          <div class="flex gap-1 items-center">
            <img src={checkMark} alt="" class="w-max h-max" />
            {$t("Token & NFT")}
          </div>
          <div class="flex gap-1 items-center">
            <img src={checkMark} alt="" class="w-max h-max" />
            {$t("Profit and Loss")}
          </div>
          <div class="flex gap-1 items-center">
            <img src={checkMark} alt="" class="w-max h-max" />
            {$t("Risk Analysis")}
          </div>
          {#if isNimbusVersion}
            <div class="flex gap-1 items-center">
              <img src={checkMark} alt="" class="w-max h-max" />
              {$t("Whales list")}
            </div>
          {/if}
          <div class="flex gap-1 items-center">
            <img src={checkMark} alt="" class="w-max h-max" />
            {$t("DeFi position tracking")}
          </div>
          {#if isNimbusVersion}
            <div class="flex gap-1 items-center">
              <img src={checkMark} alt="" class="w-max h-max" />
              {$t("Yield farming suggestion")}
            </div>
          {/if}
        </div>
      </div>
    </div>

    {#if Object.keys($user).length !== 0}
      {#if $isTWA}
        <div class="w-full flex gap-4 justify-start">
          <div class="w-max">
            <TmaTonAuth
              selectYourWalletsBundle={[]}
              {closeMobileAddAccountModal}
              isFromHero={true}
            />
          </div>
          <div class="xl:hidden block w-max">
            <Button
              on:click={() => {
                triggerModalAddAddress.update((n) => (n = true));
              }}
              variant="secondary"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_127_3836)">
                  <path
                    d="M6 1V11"
                    stroke="#27326f"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M1 6H11"
                    stroke="#27326f"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_127_3836">
                    <rect width="12" height="12" fill="#27326f" />
                  </clipPath>
                </defs>
              </svg>
              <div>{$t("Add Wallet")}</div>
            </Button>
          </div>
        </div>
      {:else}
        <div class="w-max">
          <Button
            variant="tertiary"
            on:click={() => {
              triggerModalAddAddress.update((n) => (n = true));
            }}
          >
            <img src={Plus} alt="" class="w-3 h-3" />
            <div class="text-white">{$t("Add Wallet")}</div>
          </Button>
        </div>
      {/if}
    {:else}
      <div class="flex flex-col justify-center items-start gap-5 w-full">
        <div class="w-full flex flex-col items-start xl:gap-1 gap-2">
          <div class="relative flex-1 w-full">
            <input
              type="text"
              placeholder={$t("Input your wallet to see demo")}
              autofocus
              on:change={(event) => {
                handleSearch(event);
              }}
              on:keydown={(event) => {
                if (
                  search &&
                  search?.length !== 0 &&
                  (event.which == 13 || event.keyCode == 13)
                ) {
                  handleSearchAddress(search);
                }
              }}
              bind:value={search}
              class={`xl:px-5 xl:py-3 px-6 py-4 border border-gray-300 focus:ring-0 text-sm font-normal rounded-xl w-full ${
                !$isDarkMode ? "bg-[#F0F2F7]" : "bg-transparent"
              } ${
                $isDarkMode
                  ? "text-white"
                  : "text-[#5E656B] placeholder-[#5E656B]"
              }`}
            />
            {#if search.length !== 0}
              <div
                class="absolute h-full w-10 top-0 right-0 z-10 flex justify-center items-center"
              >
                <div
                  class="p-1 rounded-full bg-white/85 cursor-pointer text-black"
                  on:click={() => {
                    if (search && search?.length !== 0) {
                      handleSearchAddress(search);
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                  >
                    <path
                      fill="currentColor"
                      d="M8.293 2.293a1 1 0 0 1 1.414 0l4.5 4.5a1 1 0 0 1 0 1.414l-4.5 4.5a1 1 0 0 1-1.414-1.414L11 8.5H1.5a1 1 0 0 1 0-2H11L8.293 3.707a1 1 0 0 1 0-1.414"
                    />
                  </svg>
                </div>
              </div>
            {/if}
          </div>

          <div
            class="hover:underline text-[#1E96FC] text-base cursor-pointer"
            on:click={() => {
              mixpanel.track("user_search");
              chain.update((n) => (n = "ALL"));
              wallet.update((n) => (n = DemoAddress));
              typeWallet.update((n) => (n = "MOVE"));
              navigate(
                `/?tab=token&type=MOVE&chain=ALL&address=${DemoAddress}`,
              );
            }}
          >
            {$t("or try")}
          </div>
        </div>

        {#if isNimbusVersion}
          <div class="w-full flex gap-4 justify-start">
            <div class="w-max">
              <Button
                on:click={() => {
                  triggerConnectWallet.update((n) => (n = true));
                }}
              >
                {#if isNimbusVersion}
                  {$t("Connect Wallet")}
                {:else}
                  Login
                {/if}
              </Button>
            </div>
            <div class="xl:hidden block w-max">
              <Button
                on:click={() => {
                  triggerSync.update((n) => (n = true));
                }}
                variant="secondary"
              >
                {$t("Sync from Desktop")}
              </Button>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    {#if isNimbusVersion}
      <div class="flex items-center gap-3">
        <div class="text-base">{$t("Community")}</div>
        <a
          target="_blank"
          href="https://discord.gg/u5b9dTrSTr"
          aria-label="Learn more about GetNimbus"
        >
          <img
            alt="link Discord"
            loading="lazy"
            decoding="async"
            data-nimg="1"
            style="color:transparent"
            src="https://getnimbus.io/logoSocialMedia/discord.svg"
            class="w-[30px] h-[30px]"
          />
        </a>
        <a
          target="_blank"
          href="https://t.me/getnimbus"
          aria-label="Learn more about GetNimbus"
        >
          <img
            alt="link Telegram"
            loading="lazy"
            decoding="async"
            data-nimg="1"
            style="color:transparent"
            src="https://getnimbus.io/logoSocialMedia/telegram.svg"
            class="w-[30px] h-[30px]"
          />
        </a>
        <a
          target="_blank"
          href="https://twitter.com/get_nimbus"
          aria-label="Learn more about GetNimbus"
        >
          <img
            alt="link Twitter"
            loading="lazy"
            decoding="async"
            data-nimg="1"
            style="color:transparent"
            src="https://getnimbus.io/logoSocialMedia/twitterX1.svg"
            class="w-[26px] h-[26px]"
          />
        </a>
      </div>
    {/if}
  </div>

  <div class="xl:order-2 order-1 flex-1 xl:ml-0 -ml-5">
    <img
      src={isNimbusVersion ? heroImage : WhitePaperHero}
      alt=""
      loading="lazy"
      decoding="async"
      sizes="(max-width: 320px) 280px, 
                (max-width: 640px) 640px, 
                960px"
      class="object-cover w-full h-full"
    />
  </div>
</div>

<style></style>
