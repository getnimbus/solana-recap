<script lang="ts">
  import { currentLang, isDarkMode } from "~/store";
  import { setLang } from "~/lib/i18n";

  import English from "~/assets/locales/english.svg";
  import Russian from "~/assets/locales/russia.svg";
  import Japanese from "~/assets/locales/japan.svg";
  import Chinese from "~/assets/locales/chinese.svg";
  import Korean from "~/assets/locales/korean.svg";

  const languages = [
    { code: "en", name: "English", icon: English },
    { code: "ru", name: "Русский", icon: Russian },
    { code: "ja", name: "日本語", icon: Japanese },
    { code: "zh", name: "中文", icon: Chinese },
    { code: "ko", name: "한국어", icon: Korean },
  ];

  const handleChangeLang = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    setLang(select.value);
  };

  let currentLangIcon;

  $: currentLangIcon = languages.find(
    (lang) => lang.code === $currentLang,
  )?.icon;
</script>

<div class="cursor-pointer w-auto flex items-center">
  <img src={currentLangIcon} alt="" class="w-6 h-6" />
  <select
    on:change={handleChangeLang}
    bind:value={$currentLang}
    class={`cursor-pointer bg-transparent border-none outline-none w-full font-medium xl:text-base text-xl text-gray-300 ${$isDarkMode ? "xl:text-[#cdcdcd]" : "xl:text-[#00000099]"}`}
  >
    {#each languages as { code, name }}
      <option value={code}>{name}</option>
    {/each}
  </select>
</div>

<style>
</style>
