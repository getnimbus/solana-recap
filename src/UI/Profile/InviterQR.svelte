<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import QRCode from "qrcode-generator";
  import { getUserInfo } from "~/lib/queryAPI";
  import { t } from "~/lib/i18n";
  import { isNimbusVersion } from "~/utils/constants";

  let qrImageDataUrl: any = undefined;
  let userAddress = "";
  let link = "";

  const qrcode = QRCode(0, "L");

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
      userAddress = $queryUserInfo.data?.publicAddress;
      link = `https://app.getnimbus.io/?invitation=${$queryUserInfo?.data.id}`;
      qrcode.addData(link);
      qrcode.make();
      qrImageDataUrl = qrcode.createDataURL(6, 0);
    }
  }
</script>

<div class="flex flex-col justify-center items-center gap-3">
  <div class="text-base text-center">
    {$t("Track your portfolio and make wise decision")}
    {#if isNimbusVersion}{$t("at")}
      Nimbus{/if}
  </div>
  <div class="w-32 h-32">
    <img
      src={qrImageDataUrl}
      alt="Invite QR Code"
      class="w-full h-full block"
    />
  </div>
</div>

<style></style>
