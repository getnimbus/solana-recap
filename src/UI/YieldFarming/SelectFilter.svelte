<script lang="ts">
  import { triggerClickOutside } from "~/utils/functions";
  import { isDarkMode } from "~/store";

  let showPopover = false;

  export let options;
  export let selected;
  export let handleSelected;

  $: selectedOption = options.find((item: any) => item.value === selected);
</script>

<div class="relative">
  <div
    class="button"
    on:click={() => {
      showPopover = true;
    }}
  >
    <div class="text-base font-medium flex items-center justify-between w-full">
      <div
        class={`flex items-center gap-2 text-sm ${selectedOption?.logo ? "uppercase" : ""}`}
      >
        {#if selectedOption?.logo}
          <img src={selectedOption?.logo} alt="" class="w-4 h-4 rounded-full" />
        {/if}
        {selectedOption?.label}
      </div>

      <div class="transform rotate-180 w-3 h-3" class:rotate-0={showPopover}>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 8.36365L6 4.00001L2 8.36365"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>
  </div>

  {#if showPopover}
    <div
      class="select_content mt-2 absolute right-0 z-8 flex flex-col p-2 text-sm transform rounded-lg top-9 w-full xl:max-h-[310px] max-h-[380px]"
      style="box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.15); overflow-y: overlay;"
      use:triggerClickOutside
      on:click_outside={() => {
        if (showPopover) {
          showPopover = false;
        }
      }}
    >
      {#each options as item}
        <div
          class="cursor-pointer"
          on:click={() => {
            handleSelected(item);
            showPopover = false;
          }}
        >
          <div
            class={`flex items-center gap-2 text-sm font-medium p-2 rounded-lg ${
              $isDarkMode
                ? selected === item.value
                  ? "bg-[#000] text-[#1e96fc]"
                  : "hover:bg-[#000]"
                : selected === item.value
                  ? "bg-gray-100 text-[#1e96fc]"
                  : "hover:bg-gray-100"
            }`}
          >
            {#if item?.logo}
              <img src={item?.logo} alt="" class="w-4 h-4 rounded-full" />
            {/if}

            <div class={`${item?.logo ? "uppercase" : ""}`}>
              {item.label}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .button {
    min-width: 160px;
    border-radius: 1000px;
    padding: 9px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  :global(body) .button {
    background: #fafafbff;
  }
  :global(body.dark) .button {
    background: #cdcdcd59;
  }

  :global(body) .select_content {
    background: #ffffff;
    border: 0.5px solid transparent;
  }
  :global(body.dark) .select_content {
    background: #131313;
    border: 0.5px solid #cdcdcd59;
  }
</style>
