<script lang="ts">
  import { Icon } from "flowbite-svelte-icons";
  import { isDarkMode, isAutoDarkMode } from "~/store";
  import { t } from "~/lib/i18n";

  let darkMode = false;
  isDarkMode.subscribe((value) => {
    darkMode = value;
  });

  let auto = false;
  isAutoDarkMode.subscribe((value) => {
    auto = value;
  });

  const handleSwitchDarkMode = () => {
    darkMode = !darkMode;
    isDarkMode.update((n) => (n = darkMode));
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    darkMode
      ? window.document.body.classList.add("dark")
      : window.document.body.classList.remove("dark");

    auto = false;
    isAutoDarkMode.update((n) => (n = false));
    localStorage.setItem("auto_theme", "false");
  };

  const handleToggleAuto = () => {
    auto = !auto;
    isAutoDarkMode.update((n) => (n = auto));
    localStorage.setItem("auto_theme", auto ? "true" : "false");
    if (auto) {
      checkSystemTheme();
    }
  };

  const checkSystemTheme = () => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) {
      window.document.body.classList.add("dark");
      isDarkMode.update((n) => (n = true));
      localStorage.setItem("theme", "dark");
      selectedTypeMode = "dark";
    } else {
      window.document.body.classList.remove("dark");
      isDarkMode.update((n) => (n = false));
      localStorage.setItem("theme", "light");
      selectedTypeMode = "light";
    }
  };

  $: selectedTypeMode = darkMode ? "dark" : "light";
</script>

<div class="w-max flex items-center xl:gap-1 gap-2">
  <input
    checked={darkMode}
    on:click={handleSwitchDarkMode}
    type="checkbox"
    id="theme-toggle"
    class="hidden"
  />
  <div
    class={`cursor-pointer font-medium xl:text-base text-xl ${auto ? "text-[#3b82f6]" : "text-gray-300"}`}
    on:click={handleToggleAuto}
  >
    {$t("Auto")}
  </div>
  <div class="text-gray-300 mb-1 xl:text-base text-xl">/</div>
  <label
    for="theme-toggle"
    class={`cursor-pointer ${auto ? "opacity-40" : "opacity-100"}`}
  >
    <div class="flex items-center justify-between xl:gap-1 gap-2">
      <div
        class={`${
          selectedTypeMode === "light" ? "text-[#3b82f6]" : "text-gray-300"
        }`}
      >
        <Icon
          size="lg"
          name="sun-solid"
          role="img"
          class="select-none border-none focus:outline-none focus:ring-0"
        />
      </div>
      <div class="text-gray-300 mb-1 xl:text-base text-xl">/</div>
      <div
        class={`${
          selectedTypeMode === "dark" ? "text-[#3b82f6]" : "text-gray-300"
        }`}
      >
        <Icon
          size="md"
          name="moon-solid"
          role="img"
          class="select-none border-none focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  </label>
</div>

<style></style>
