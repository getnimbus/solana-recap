<script>
  import { isNimbusVersion } from "~/utils/constants";

  import Button from "~/components/Button.svelte";
</script>

<div class="h-[95vh] flex justify-center items-center">
  <div class="flex flex-col items-center gap-10">
    <div class="flex-1">
      <div class="flex flex-col items-center gap-6">
        <div class="text-5xl font-normal">You are ready to enjoy</div>
        <div class="text-lg text_00000099 font-normal">
          {#if isNimbusVersion}Join us on Discord and build Nimbus together.{/if}
          WAGMI 🙌
        </div>
      </div>
    </div>
    <div class="w-[140px]">
      <Button
        on:click={() => {
          window.open(`https://discord.gg/u5b9dTrSTr`, "_blank");
          window.close();
        }}
      >
        Join Discord
      </Button>
    </div>
  </div>
</div>

<style>
</style>
