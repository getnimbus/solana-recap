<script lang="ts">
  import { register } from "swiper/element/bundle";
  register();

  import LoadingPremium from "~/components/LoadingPremium.svelte";
  import ErrorBoundary from "~/components/ErrorBoundary.svelte";
  import SlideOne from "./SlideOne.svelte";
  import SlideTwo from "./SlideTwo.svelte";
  import SlideThree from "./SlideThree.svelte";
  import SlideFour from "./SlideFour.svelte";
</script>

<ErrorBoundary>
  <div class="flex flex-col items-center gap-5">
    <LoadingPremium />
    <div class="mx-auto xl:max-w-2xl md:max-w-xl max-w-xs mt-5">
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
          <SlideOne />
        </swiper-slide>
        <swiper-slide>
          <SlideTwo />
        </swiper-slide>
        <swiper-slide>
          <SlideThree />
        </swiper-slide>
        <swiper-slide>
          <SlideFour />
        </swiper-slide>
      </swiper-container>
    </div>
  </div>
</ErrorBoundary>

<style></style>
