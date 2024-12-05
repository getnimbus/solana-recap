<script>
  import { isDarkMode } from "~/store";
  let stopAnimation = false;
</script>

<div
  class={`relative sticky top-0 left-0 gap-x-6 py-1 w-full z-10 ${
    $isDarkMode
      ? "bg-[#444444] border-[#5a5a5a]"
      : "bg-[#F8F9FF] border-[#f0f2fb]"
  }`}
  on:mouseenter={() => {
    stopAnimation = true;
  }}
  on:mouseleave={() => {
    stopAnimation = false;
  }}
>
  <div class="max-w-[1600px] m-auto isolate w-[95%]">
    <div class="marquee flex flex-wrap items-center gap-x-4 xl:gap-y-2 gap-y-1">
      <div
        class="marqueeAnimation text-sm xl:leading-6 flex xl:gap-0 gap-2"
        class:stopped={stopAnimation}
      >
        <slot name="title" />
        <slot name="content" />
      </div>
    </div>
  </div>
</div>

<style>
  .marquee {
    height: 36px;
    overflow: hidden;
    position: relative;
  }

  .marqueeAnimation {
    position: absolute;
    height: 100%;
    /* -moz-transform: translateX(100%);
    -webkit-transform: translateX(100%);
    transform: translateX(100%);
    -moz-animation: scroll-left 2s linear infinite;
    -webkit-animation: scroll-left 2s linear infinite;
    animation: scroll-left 20s linear infinite; */
  }

  .marqueeAnimation.stopped {
    animation-play-state: paused;
  }

  @-moz-keyframes scroll-left {
    0% {
      -moz-transform: translateX(200%);
    }
    100% {
      -moz-transform: translateX(-100%);
    }
  }

  @-webkit-keyframes scroll-left {
    0% {
      -webkit-transform: translateX(200%);
    }
    100% {
      -webkit-transform: translateX(-100%);
    }
  }

  @keyframes scroll-left {
    0% {
      -moz-transform: translateX(200%);
      -webkit-transform: translateX(200%);
      transform: translateX(200%);
    }
    100% {
      -moz-transform: translateX(-100%);
      -webkit-transform: translateX(-100%);
      transform: translateX(-100%);
    }
  }
</style>
