<script lang="ts">
  import { onMount } from "svelte";
  import { wallet } from "~/store";
  import { wait } from "~/utils/index";
  import { nimbus } from "~/lib/network";
  import { createQuery } from "@tanstack/svelte-query";
  import { handleValidateAddress } from "~/lib/queryAPI";
  import { isNimbusVersion } from "~/utils/constants";

  import ErrorBoundary from "~/components/ErrorBoundary.svelte";
  import Testimonial from "~/UI/Testimonial/Testimonial.svelte";
  import Loading from "~/components/Loading.svelte";

  let address = "";
  let isLoadingSync = false;
  let syncMsg = "";
  let enabledFetchAllData = false;

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const addressParams = urlParams.get("address");
    if (addressParams && addressParams !== $wallet) {
      address = addressParams;
      handleGetAllData();
    }
  });

  $: queryValidate = createQuery({
    queryKey: ["validate", $wallet],
    queryFn: () => handleValidateAddress($wallet),
    retry: false,
    enabled: Boolean($wallet && $wallet?.length !== 0),
  });

  const getSync = async () => {
    try {
      const validateAccount = $queryValidate.data;
      await nimbus
        .get(
          `/v2/address/${address}/sync?chain=${
            validateAccount?.type === "BUNDLE" ? "" : validateAccount?.type
          }`,
        )
        .then((response) => response);
    } catch (e) {
      console.error("e: ", e);
    }
  };

  const getSyncStatus = async () => {
    try {
      const validateAccount = $queryValidate.data;
      const response = await nimbus
        .get(
          `/v2/address/${address}/sync-status?chain=${
            validateAccount?.type === "BUNDLE" ? "" : validateAccount?.type
          }`,
        )
        .then((response) => response);
      return response;
    } catch (e) {
      console.error("e: ", e);
    }
  };

  const handleSync = async () => {
    console.log("Going to full sync");
    await getSync();
  };

  const handleGetAllData = async () => {
    isLoadingSync = false;
    enabledFetchAllData = false;

    try {
      let syncStatus: any = await getSyncStatus();
      // already sync data from db
      if (syncStatus?.data?.lastSync) {
        console.log("start load data (already sync)");
        enabledFetchAllData = true;
        syncMsg = "";
        isLoadingSync = false;
        return;
      }

      // sync data again and check data from db
      if (!syncStatus?.data?.lastSync) {
        await handleSync();

        if (syncStatus?.data?.canWait) {
          syncMsg = syncStatus?.data?.error;
          isLoadingSync = true;
          // keep call api /sync-status until we can not wait
          while (true) {
            if (syncStatus?.data?.lastSync) {
              console.log("start load data (newest sync)");
              enabledFetchAllData = true;
              syncMsg = "";
              isLoadingSync = false;
              break;
            } else {
              isLoadingSync = true;
              await wait(5000);
              syncStatus = await getSyncStatus();
            }
          }
        }

        if (!syncStatus?.data?.canWait) {
          // Cut call when we can not wait
          syncMsg = syncStatus?.data?.error;
          isLoadingSync = false;
        }
      }
    } catch (e) {
      console.error("error: ", e);
      isLoadingSync = false;
    }
  };

  $: {
    if ($wallet && !$queryValidate.isFetching && !$queryValidate?.isError) {
      address = $wallet;
      handleGetAllData();
    }
  }
</script>

<ErrorBoundary>
  {#if isLoadingSync}
    <div
      class="sync_container text-xl font-medium flex flex-col gap-5 justify-center items-center rounded-[20px] p-6 h-screen"
    >
      {syncMsg}
      {#if syncMsg !== "Invalid address"}
        {#if isNimbusVersion}
          <Testimonial />
        {:else}
          <Loading />
        {/if}
      {/if}
    </div>
  {:else}
    <div>
      {#if syncMsg}
        <div class="flex flex-col justify-center items-center gap-2">
          {syncMsg}
        </div>
      {:else}
        <slot {address} {enabledFetchAllData} />
      {/if}
    </div>
  {/if}
</ErrorBoundary>

<style>
  :global(body) .sync_container {
    background: #fff;
    box-shadow: 0px 0px 40px 0px rgba(0, 0, 0, 0.1);
  }
  :global(body.dark) .sync_container {
    background: #0f0f0f;
    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 1);
  }
</style>
