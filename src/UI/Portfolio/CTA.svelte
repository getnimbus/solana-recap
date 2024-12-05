<script lang="ts">
  import { register } from "swiper/element/bundle";
  register();

  import SuilendAirdrop from "../Cta/SuilendAirdrop.svelte";
  import Farm from "../Cta/Farm.svelte";
  import BluefinAirdrop from "../Cta/BluefinAirdrop.svelte";
</script>

<section class="overflow-hidden">
  <div class="mx-auto max-w-c-1390">
    <swiper-container
      css-mode={true}
      speed={2000}
      slides-per-view={1}
      space-between={50}
      centered-slides={true}
      autoplay={{
        delay: 7000,
        pauseOnMouseEnter: true,
      }}
      pagination={{
        clickable: true,
        dynamicBullets: true,
      }}
    >
      <swiper-slide>
        <Farm />
      </swiper-slide>

      <SuilendAirdrop />

      <BluefinAirdrop />
    </swiper-container>
  </div>
</section>

<style></style>
