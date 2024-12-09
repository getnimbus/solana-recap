<script lang="ts">
  import { nimbus } from "~/lib/network";
  import { t } from "~/lib/i18n";
  import { userPublicAddress, user, isDarkMode } from "~/store";
  import { TwitterAuthProvider, signInWithPopup } from "firebase/auth";
  import { auth } from "~/lib/firebase";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { triggerToast, triggerBonusScore } from "~/utils/functions";
  import { handleGetDataDailyCheckin } from "~/lib/queryAPI";
  import { isNimbusVersion } from "~/utils/constants";

  export let data: any;
  export let selectedDisplayName;
  export let handleUpdateSelectedDisplayName = (name) => {};

  const queryClient = useQueryClient();
  const twitterProvider = new TwitterAuthProvider();

  let checked = false;

  let dataCheckinHistory = [];

  $: queryDailyCheckin = createQuery({
    queryKey: [$userPublicAddress, "daily-checkin"],
    queryFn: () => handleGetDataDailyCheckin(),
    enabled: Boolean(
      $user &&
        Object.keys($user)?.length !== 0 &&
        $userPublicAddress &&
        $userPublicAddress?.length !== 0,
    ),
  });

  $: {
    if (!$queryDailyCheckin.isError && $queryDailyCheckin.data !== undefined) {
      dataCheckinHistory = $queryDailyCheckin?.data?.checkinLogs;
    }
  }

  $: {
    if (selectedDisplayName === data?.name) {
      checked = true;
    } else {
      checked = false;
    }
  }

  const handleTwitterAuth = async () => {
    try {
      const res: any = await signInWithPopup(auth, twitterProvider).then(
        (result) => result.user,
      );
      if (res) {
        handleAddTwitter(
          res.uid,
          res?.reloadUserInfo?.providerUserInfo[0]?.rawId,
          res?.reloadUserInfo?.screenName,
          res?.reloadUserInfo?.screenName,
        );
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleAddTwitter = async (id, externalId, info, displayName) => {
    try {
      let params: any = {
        kind: "social",
        id,
        externalId,
        type: "twitter",
        info,
        displayName,
      };

      if (data && Object.keys(data)?.length === 0) {
        params = {
          ...params,
          userPublicAddress: $userPublicAddress,
        };
      }

      const response: any = await nimbus.post("/accounts/link", params);
      if (response && response?.error) {
        triggerToast(response?.error, "fail");
      } else {
        const quest = dataCheckinHistory?.find(
          (item) => item.type === "QUEST" && item.note === "link-x",
        );
        if (!quest) {
          handleAddBonusQuest();
        }

        queryClient?.invalidateQueries(["link-socials"]);

        triggerToast("Successfully link X account!", "success");
      }
    } catch (e) {
      console.log(e);
      triggerToast(
        "There are some problem when link X account. Please try again!",
        "fail",
      );
    }
  };

  const handleAddBonusQuest = async () => {
    try {
      const res: any = await nimbus.post(`/v2/checkin/quest/link-twitter`, {});
      if (res && res?.data === null) {
        triggerToast("You are already finished this quest", "fail");
      }
      if (res?.data?.bonus !== undefined) {
        triggerBonusScore(res?.data?.bonus, 2000);
        queryClient?.invalidateQueries([$userPublicAddress, "daily-checkin"]);
        queryClient?.invalidateQueries(["users-me"]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisplayName = async () => {
    try {
      checked = !checked;
      handleUpdateSelectedDisplayName(checked ? data?.name : "");
      await nimbus.put(
        `/users/displayName?name=${checked ? data?.name : ""}`,
        {},
      );
      queryClient.invalidateQueries(["users-me"]);
      triggerToast(
        `Successfully ${checked ? "set" : "unset"} display X account!`,
        "success",
      );
    } catch (e) {
      console.log(e);
      triggerToast(
        "There are some problem when set display X account. Please try again!",
        "fail",
      );
    }
  };
</script>

<div
  id="x"
  class="max-w-[350px] md:w-[350px] w-full bg_f4f5f8 rounded-[10px] px-4 py-5 flex flex-col"
>
  <div class="flex flex-col gap-3">
    <div
      class={`p-4 rounded-[10px] shadow-sm bg-black w-max ${$isDarkMode ? "border border-white" : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="26"
        height="26"
        fill="none"
        viewBox="0 0 512 512"
        id="twitter"
        ><script xmlns=""></script>
        <g clip-path="url(#clip0_84_15697)">
          <rect width="512" height="512" fill="#000" rx="60" />
          <path
            fill="#fff"
            d="M355.904 100H408.832L293.2 232.16L429.232 412H322.72L239.296 302.928L143.84 412H90.8805L214.56 270.64L84.0645 100H193.28L268.688 199.696L355.904 100ZM337.328 380.32H366.656L177.344 130.016H145.872L337.328 380.32Z"
          >
          </path>
        </g>
        <defs>
          <clipPath id="clip0_84_15697">
            <rect width="512" height="512" fill="#fff" />
          </clipPath>
        </defs>
        <script xmlns=""></script></svg
      >
    </div>
    <div class="text-lg">X</div>
  </div>

  <div class="flex flex-col gap-3">
    {#if data && Object.keys(data)?.length !== 0}
      <div class="text-base text-gray-400">@{data?.name}</div>
      <div class="flex items-center justify-start gap-2">
        <input
          type="checkbox"
          bind:checked
          on:change={handleDisplayName}
          class="cursor-pointer relative w-5 h-5 appearance-none rounded-[0.25rem] border outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
        />
        <div class="text-sm">
          {$t("Display on")}
          {#if isNimbusVersion}Nimbus{:else}App{/if}
        </div>
      </div>
    {:else}
      <div class="text-base text-gray-400">@username</div>
      <div
        class="flex items-center justify-center gap-2 text-white py-3 px-6 rounded-[12px] w-full bg-[#1e96fc] cursor-pointer"
        on:click={() => {
          handleTwitterAuth();
        }}
      >
        <div class="font-semibold text-[15px]">{$t("Connect")}</div>
      </div>
    {/if}
  </div>
</div>

<style>
</style>
