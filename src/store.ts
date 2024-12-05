import { writable } from "svelte/store";
export const langList = ["ru", "ja", "zh", "ko"];
export const currentLang = writable(
  langList.includes(navigator.language) ? navigator.language : "en",
);
export const isSaveAddressLabel = writable(false);
// export const isOpenReport = writable(false);
export const user: any = writable({});
export const wallet = writable("");
export const chain = writable("ALL");
export const typeWallet = writable("");
export const selectedPackage = writable("PROFESSIONAL"); // Todo: back to FREE later
export const tab = writable("token");
export const isDarkMode = writable(false);
export const isAutoDarkMode = writable(false);
export const isShowHeaderMobile = writable(false);
export const selectedBundle: any = writable({});
export const isHidePortfolio = writable(false);
export const triggerConnectWallet = writable(false);
export const triggerModalAddAddress = writable(false);
export const triggerSync = writable(false);
export const userId = writable("");
export const userPublicAddress = writable("");
export const triggerUpdateBundle = writable(false);
export const detectParams = writable(window.location.pathname);
export const realtimePrice: any = writable({});
export const totalPositions = writable(0);
export const totalTokens = writable(0);
export const totalNfts = writable(0);
export const totalAirdrops = writable(0);
export const unrealizedProfit = writable(0);
export const realizedProfit = writable(0);
export const pastProfit = writable(0);
export const suiWalletInstance = writable(null);
export const tonConnector = writable(null);
export const safeInfoData = writable({});
export const openModalSignMsgStashed = writable(false);
export const nonceLogin = writable("");
export const showScallopDeFiFarmModal = writable(false);
export const showStonfiDeFiFarmModal = writable(false);
export const showModalBridge = writable(false);
export const selectedTokenDetail = writable({});
export const isTWA = writable(false);
export const showPopoverSearch = writable(false);
export const isOpenModalRewardSwap = writable(false);

export let showToast = writable(false);
export let isSuccessToast = writable(false);
export let toastMsg = writable("");

export let bonusScore = writable(0);
export let openScreenBonusScore = writable(false);
