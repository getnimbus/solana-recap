<script lang="ts">
  import { isNimbusVersion } from "~/utils/constants";
  import axios from "axios";
  import { wallet, typeWallet } from "~/store";
  import tooltip from "~/lib/tooltip";
  import { t } from "~/lib/i18n";

  let data = {
    isHolder: false,
    score: 0,
  };

  const handleGetNomisPointCheck = async () => {
    try {
      const res = await axios.get(
        `https://nomis.cc/api/ton/holder?address=${$wallet}`,
      );
      if (res && res?.data) {
        data = {
          isHolder: res?.data?.isHolder,
          score: res?.data?.score || 0,
        };
      }
    } catch (e) {
      console.error(e);
    }
  };

  $: {
    if ($wallet && $wallet?.length !== 0 && $typeWallet === "TON") {
      handleGetNomisPointCheck();
    }
  }
</script>

{#if $typeWallet === "TON"}
  <div
    use:tooltip={{
      content: `<tooltip-detail text="Nomis Score" />`,
      allowHTML: true,
      placement: "top",
      interactive: true,
    }}
    class={`flex items-center gap-1 cursor-pointer py-2 px-3 rounded-[1000px] text-white ${
      isNimbusVersion ? "button" : "button-whitelabel"
    }`}
  >
    <img
      src="https://nomis.cc/_next/static/media/logo.79f54f24.svg"
      alt=""
      class="w-6 h-6"
    />
    <a
      href="https://nomis.cc/ton?ref=9VjyOYYmDp%26referrerAddress=UQCsHbGZjIHmm2iCA--ml6SV6PkjVwzFY86mhXsIet1uSUkL"
      target="_blank"
    >
      {#if data?.isHolder}
        {data?.score || 0}
      {:else}
        {$t("Get Score from Nomis")}
      {/if}
    </a>
  </div>
{/if}

<style>
  :global(body) .button {
    background: #525b8c;
  }
  :global(body.dark) .button {
    background: #212121;
  }

  :global(body) .button-whitelabel {
    background: #3bda32;
  }
  :global(body.dark) .button-whitelabel {
    background: #cdcdcd59;
  }
</style>
