<script lang="ts">
  import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
  } from "@solana/wallet-adapter-wallets";
  import { walletStore } from "@aztemi/svelte-on-solana-wallet-adapter-core";
  import { WalletProvider } from "@aztemi/svelte-on-solana-wallet-adapter-ui";
  import { createQuery } from "@tanstack/svelte-query";
  import mixpanel from "mixpanel-browser";
  import { onMount } from "svelte";
  import { nimbus } from "~/lib/network";
  import { userPublicAddress } from "~/store";
  import { inview } from "svelte-inview";

  import ErrorBoundary from "~/components/ErrorBoundary.svelte";
  import CardNftRecap from "~/components/CardNFTRecap.svelte";
  import Airdrop from "~/UI/Recap/Airdrop.svelte";
  import MintNft from "~/UI/Recap/MintNFT.svelte";
  import NftHolding from "~/UI/Recap/NFTHolding.svelte";
  import Promote from "~/UI/Recap/Promote.svelte";
  import TokenHolding from "~/UI/Recap/TokenHolding.svelte";
  import WalletModal from "~/UI/SolanaCustomWalletBtn/WalletModal.svelte";

  import Logo from "~/assets/logo-1.svg";
  import Arrow from "~/assets/recap/hero/arrow-right.svg";
  import SvgOne from "~/assets/recap/hero/svgOne.svg";
  import SvgTwo from "~/assets/recap/hero/svgTwo.svg";
  import SuperteamLogo from "~/assets/superteamvn.png";

  const NFTOne = {
    solHolding: 5.5,
    summaryLabel: "Bonk Friend",
    tag: "Top 10",
  };

  const NFTTwo = {
    solHolding: 68.78,
    summaryLabel: "True Holder",
    tag: "Top 8",
  };

  const handleValidateAddress = async (address: string) => {
    try {
      const response = await nimbus.get(`/v2/address/${address}/validate`);
      if (response?.data) {
        userPublicAddressChain = response?.data?.type;
      }
    } catch (e) {
      console.error(e);
      return undefined;
    }
  };

  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  let userPublicAddressChain = "EVM";
  let userAddress = $userPublicAddress;

  // let data;
  let inputAddress = "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz";

  onMount(() => {
    $walletStore.disconnect();
  });

  // trigger Solana wallet
  let modalVisible = false;
  const maxNumberOfWallets = 5;
  const openModal = () => {
    modalVisible = true;
  };

  const closeModal = () => (modalVisible = false);

  const connectWallet = async (event) => {
    closeModal();
    try {
      localStorage.removeItem("walletAdapter");
      await walletStore.resetWallet();
      await walletStore.setConnecting(false);
      await $walletStore.disconnect();
      await $walletStore.select(event.detail);
      await $walletStore.connect();
    } catch (error) {
      console.log(error);
    }
  };

  $: solanaPublicAddress = $walletStore?.publicKey?.toBase58();

  $: {
    if (solanaPublicAddress) {
      userAddress = solanaPublicAddress;
    } else {
      userAddress = $userPublicAddress;
    }
  }

  $: {
    if (userAddress) {
      handleValidateAddress(userAddress);
    }
  }

  const getRecapData = async (address: string) => {
    const response: any = await nimbus.get(`/recap?address=${address}`);
    return response?.data;
  };

  $: query = createQuery({
    queryKey: ["recap", userAddress],
    queryFn: () => getRecapData(userAddress),
    retry: false,
    enabled: Boolean(!!userAddress),
  });

  // $: {
  //   if (
  //     !$query.isError &&
  //     $query.data !== undefined &&
  //     Object.keys($query.data).length !== 0
  //   ) {
  //     data = $query.data;
  //   }
  // }

  let data = {
    tokens: {
      stats: {
        total_holding: 52,
        total_txs: 49,
        total_gas_fee: 0.001150754,
        price: 233.15,
        rank_by_fee: "Top 10",
        rank_by_txs: "Top 10",
      },
      holding: [
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Jupiter",
          symbol: "JUP",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN&chain=SOL",
          amount: "1756.734417",
          amountRaw: "1756734417",
          balance: "1756.734417",
          contractAddress: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
          contractDecimals: 6,
          rate: 1.2975497168586279,
          price: {
            price: 1.2975497168586279,
            symbol: "JUP",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
            realizedProfit: -3.0005043812844017,
            averageCost: 1.386105883223327,
            cost: 59.585322296368716,
            totalBought: 42.987569,
            avgSold: 0.7848024,
            totalGain: 3.916163976,
            totalSold: 4.99,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -59.585322296368716,
          last_transferred_at: null,
          positionId: "SOL-JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Solana",
          symbol: "SOL",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=So11111111111111111111111111111111111111112&chain=SOL",
          amount: "2.112505049",
          amountRaw: "2112505049",
          balance: "2.112505049",
          contractAddress: "So11111111111111111111111111111111111111112",
          contractDecimals: 9,
          rate: 233.2826612178066,
          price: {
            price: 233.2826612178066,
            symbol: "SOL",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-So11111111111111111111111111111111111111112",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Zeus Network",
          symbol: "ZEUS",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq&chain=SOL",
          amount: "122.273641",
          amountRaw: "122273641",
          balance: "122.273641",
          contractAddress: "ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq",
          contractDecimals: 6,
          rate: 0.61491576370825,
          price: {
            price: 0.61491576370825,
            symbol: "ZEUS",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq",
            realizedProfit: 0,
            averageCost: 1.055559437042992,
            cost: 59.5597639011654,
            totalBought: 56.424832,
            avgSold: 0.7239811279849558,
            totalGain: 598.3159820661376,
            totalSold: 826.424832,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -59.5597639011654,
          last_transferred_at: null,
          positionId: "SOL-ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "BlazeStake Staked SOL",
          symbol: "BSOL",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1&chain=SOL",
          amount: "0.013312485",
          amountRaw: "13312485",
          balance: "0.013312485",
          contractAddress: "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
          contractDecimals: 9,
          rate: 273.9904331909648,
          price: {
            price: 273.9904331909648,
            symbol: "BSOL",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
            realizedProfit: 0,
            averageCost: 150.09457508912953,
            cost: 604.1348304585833,
            totalBought: 4.025027754,
            avgSold: 123.8827188317407,
            totalGain: 495.5308753269628,
            totalSold: 4,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -604.1348304585833,
          last_transferred_at: null,
          positionId: "SOL-bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "MY DOG IS THE DEV",
          symbol: "DEV",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=ASNoTS4cYopuUbmDMWM4AU9xdCQnb5zPe3gBWfTUsLTE&chain=SOL",
          amount: "1914.198846777",
          amountRaw: "1914198846777",
          balance: "1914.198846777",
          contractAddress: "ASNoTS4cYopuUbmDMWM4AU9xdCQnb5zPe3gBWfTUsLTE",
          contractDecimals: 9,
          rate: 0.0007123047546035876,
          price: {
            price: 0.0007123047546035876,
            symbol: "DEV",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "ASNoTS4cYopuUbmDMWM4AU9xdCQnb5zPe3gBWfTUsLTE",
            realizedProfit: 0,
            averageCost: 0,
            cost: 0,
            totalBought: 1914.198846777,
            avgSold: 0,
            totalGain: 0,
            totalSold: 0,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-ASNoTS4cYopuUbmDMWM4AU9xdCQnb5zPe3gBWfTUsLTE",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "USDC",
          symbol: "USDC",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&chain=SOL",
          amount: "1.15776",
          amountRaw: "1157760",
          balance: "1.15776",
          contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          contractDecimals: 6,
          rate: 0.99989943,
          price: {
            price: 0.99989943,
            symbol: "USDC",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            realizedProfit: 0.0884503370143548,
            averageCost: 0.9999469803290948,
            cost: 3056.7353183061796,
            totalBought: 3056.8973940000005,
            avgSold: 1.0000138450693277,
            totalGain: 1144.84644625897,
            totalSold: 1144.830596,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -3056.7353183061796,
          last_transferred_at: null,
          positionId: "SOL-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Blaze",
          symbol: "BLZE",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=BLZEEuZUBVqFhj8adcCFPJvPVCiCyVmh3hkJMrU8KuJA&chain=SOL",
          amount: "412.031923144",
          amountRaw: "412031923144",
          balance: "412.031923144",
          contractAddress: "BLZEEuZUBVqFhj8adcCFPJvPVCiCyVmh3hkJMrU8KuJA",
          contractDecimals: 9,
          rate: 0.0004576579355507418,
          price: {
            price: 0.0004576579355507418,
            symbol: "BLZE",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-BLZEEuZUBVqFhj8adcCFPJvPVCiCyVmh3hkJMrU8KuJA",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Marinade Staked SOL",
          symbol: "MSOL",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So&chain=SOL",
          amount: "0.000640682",
          amountRaw: "640682",
          balance: "0.000640682",
          contractAddress: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
          contractDecimals: 9,
          rate: 289.9400816746391,
          price: {
            price: 289.9400816746391,
            symbol: "MSOL",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            realizedProfit: 0,
            averageCost: 98.50029657765265,
            cost: 0.8481589662486081,
            totalBought: 0.008610725,
            avgSold: 0,
            totalGain: 0,
            totalSold: 0,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -0.8481589662486081,
          last_transferred_at: null,
          positionId: "SOL-mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "UpRock",
          symbol: "UPT",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=UPTx1d24aBWuRgwxVnFmX4gNraj3QGFzL3QqBgxtWQG&chain=SOL",
          amount: "10",
          amountRaw: "10000000000",
          balance: "10",
          contractAddress: "UPTx1d24aBWuRgwxVnFmX4gNraj3QGFzL3QqBgxtWQG",
          contractDecimals: 9,
          rate: 0.017695686692466604,
          price: {
            price: 0.017695686692466604,
            symbol: "UPT",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-UPTx1d24aBWuRgwxVnFmX4gNraj3QGFzL3QqBgxtWQG",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Lamas Finance",
          symbol: "LMF",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=LMFzmYL6y1FX8HsEmZ6yNKNzercBmtmpg2ZoLwuUboU&chain=SOL",
          amount: "9",
          amountRaw: "9000000000",
          balance: "9",
          contractAddress: "LMFzmYL6y1FX8HsEmZ6yNKNzercBmtmpg2ZoLwuUboU",
          contractDecimals: 9,
          rate: 0.01865081934486396,
          price: {
            price: 0.01865081934486396,
            symbol: "LMF",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-LMFzmYL6y1FX8HsEmZ6yNKNzercBmtmpg2ZoLwuUboU",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Smog",
          symbol: "SMOG",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=FS66v5XYtJAFo14LiPz5HT93EUMAHmYipCfQhLpU4ss8&chain=SOL",
          amount: "6.249477",
          amountRaw: "6249477",
          balance: "6.249477",
          contractAddress: "FS66v5XYtJAFo14LiPz5HT93EUMAHmYipCfQhLpU4ss8",
          contractDecimals: 6,
          rate: 0.02272049389681122,
          price: {
            price: 0.02272049389681122,
            symbol: "SMOG",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-FS66v5XYtJAFo14LiPz5HT93EUMAHmYipCfQhLpU4ss8",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Save",
          symbol: "SLND",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp&chain=SOL",
          amount: "0.043815",
          amountRaw: "43815",
          balance: "0.043815",
          contractAddress: "SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp",
          contractDecimals: 6,
          rate: 1.077579868198486,
          price: {
            price: 1.077579868198486,
            symbol: "SLND",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "sealwifhat",
          symbol: "SI",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=Fxgdfsy1Z5Mvh53o69s2Ev6TGxtAJ1RQ5RJ5moCpKmQZ&chain=SOL",
          amount: "50",
          amountRaw: "50000000000",
          balance: "50",
          contractAddress: "Fxgdfsy1Z5Mvh53o69s2Ev6TGxtAJ1RQ5RJ5moCpKmQZ",
          contractDecimals: 9,
          rate: 0.00027970540459066104,
          price: {
            price: 0.00027970540459066104,
            symbol: "SI",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-Fxgdfsy1Z5Mvh53o69s2Ev6TGxtAJ1RQ5RJ5moCpKmQZ",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Bonk Staked SOL",
          symbol: "BONKSOL",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs",
          contractDecimals: 9,
          rate: 0,
          price: {
            price: 0,
            symbol: "BONKSOL",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs",
            realizedProfit: 2.3104905188890204,
            averageCost: 135.5723937337943,
            cost: 133.27481082363465,
            totalBought: 0.983052723,
            avgSold: 137.9227158119816,
            totalGain: 135.58530134252365,
            totalSold: 0.983052723,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -133.27481082363465,
          last_transferred_at: null,
          positionId: "SOL-BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "cat in a pokémon world",
          symbol: "MEWMEGA",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=B4jwnd1PxSmcSrDytimxYuRzQDfpxf28oAFXmBZFiNgB&chain=SOL",
          amount: "40",
          amountRaw: "40000000",
          balance: "40",
          contractAddress: "B4jwnd1PxSmcSrDytimxYuRzQDfpxf28oAFXmBZFiNgB",
          contractDecimals: 6,
          rate: 0.01199585750478261,
          price: {
            price: 0.01199585750478261,
            symbol: "MEWMEGA",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-B4jwnd1PxSmcSrDytimxYuRzQDfpxf28oAFXmBZFiNgB",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=DivT2KJndZdPx6rM6uftx8SxbfjPwnM5cHShDDcJqEcM&chain=SOL",
          amount: "9972527698.838880256",
          amountRaw: "9972527698838880567",
          balance: "9972527698.838880256",
          contractAddress: "DivT2KJndZdPx6rM6uftx8SxbfjPwnM5cHShDDcJqEcM",
          contractDecimals: 9,
          rate: 0,
          price: {
            price: 0,
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-DivT2KJndZdPx6rM6uftx8SxbfjPwnM5cHShDDcJqEcM",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Neiro",
          symbol: "NEIRO",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=CTJf74cTo3cw8acFP1YXF3QpsQUUBGBjh2k2e8xsZ6UL&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "CTJf74cTo3cw8acFP1YXF3QpsQUUBGBjh2k2e8xsZ6UL",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "NEIRO",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "CTJf74cTo3cw8acFP1YXF3QpsQUUBGBjh2k2e8xsZ6UL",
            realizedProfit: 0,
            averageCost: 0.03672514852610843,
            cost: 195.38459973593655,
            totalBought: 5320.18542,
            avgSold: 0,
            totalGain: 0,
            totalSold: 0,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -195.38459973593655,
          last_transferred_at: null,
          positionId: "SOL-CTJf74cTo3cw8acFP1YXF3QpsQUUBGBjh2k2e8xsZ6UL",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=Dee3eo7xTKdfN3piE9Zjk9LYWnPaRR63SwkJHs9v1U4E&chain=SOL",
          amount: "795802692.790938",
          amountRaw: "795802692790938",
          balance: "795802692.790938",
          contractAddress: "Dee3eo7xTKdfN3piE9Zjk9LYWnPaRR63SwkJHs9v1U4E",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-Dee3eo7xTKdfN3piE9Zjk9LYWnPaRR63SwkJHs9v1U4E",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Orca",
          symbol: "ORCA",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "ORCA",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Lifinity",
          symbol: "LFNTY",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=LFNTYraetVioAPnGJht4yNg2aUZFXR776cMeN9VMjXp&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "LFNTYraetVioAPnGJht4yNg2aUZFXR776cMeN9VMjXp",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "LFNTY",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-LFNTYraetVioAPnGJht4yNg2aUZFXR776cMeN9VMjXp",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "MODI",
          symbol: "MODI",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=2Y7WgQvdDo7dQub3eqznsF367K5JDCxrE7raYVwQP4GB&chain=SOL",
          amount: "1000000",
          amountRaw: "1000000000000000",
          balance: "1000000",
          contractAddress: "2Y7WgQvdDo7dQub3eqznsF367K5JDCxrE7raYVwQP4GB",
          contractDecimals: 9,
          rate: 0.000004715239595827857,
          price: {
            price: 0.000004715239595827857,
            symbol: "MODI",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "2Y7WgQvdDo7dQub3eqznsF367K5JDCxrE7raYVwQP4GB",
            realizedProfit: -137.48683004526993,
            averageCost: 0.00010621700757276128,
            cost: 291.7928754023608,
            totalBought: 2747138.9193719793,
            avgSold: 0.000027524449974255904,
            totalGain: 48.089037784329555,
            totalSold: 1747138.919371979,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -291.7928754023608,
          last_transferred_at: null,
          positionId: "SOL-2Y7WgQvdDo7dQub3eqznsF367K5JDCxrE7raYVwQP4GB",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=3vF3opy7AnxhxDsGKa55DVsQeVsoQrDuU5agyB1tS2Gx&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "3vF3opy7AnxhxDsGKa55DVsQeVsoQrDuU5agyB1tS2Gx",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-3vF3opy7AnxhxDsGKa55DVsQeVsoQrDuU5agyB1tS2Gx",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=2UywZrUdyqs5vDchy7fKQJKau2RVyuzBev2XKGPDSiX1&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "2UywZrUdyqs5vDchy7fKQJKau2RVyuzBev2XKGPDSiX1",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-2UywZrUdyqs5vDchy7fKQJKau2RVyuzBev2XKGPDSiX1",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=8otGo2J4Et8kXALWKU5QTd7aX2QMQ93BgX6H1MtZXw3z&chain=SOL",
          amount: "400",
          amountRaw: "400000000",
          balance: "400",
          contractAddress: "8otGo2J4Et8kXALWKU5QTd7aX2QMQ93BgX6H1MtZXw3z",
          contractDecimals: 6,
          rate: 1.4517407985684217e-7,
          price: {
            price: 1.4517407985684217e-7,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-8otGo2J4Et8kXALWKU5QTd7aX2QMQ93BgX6H1MtZXw3z",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Billy",
          symbol: "BILLY",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=3B5wuUrMEi5yATD7on46hKfej3pfmd7t1RKgrsN3pump&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "3B5wuUrMEi5yATD7on46hKfej3pfmd7t1RKgrsN3pump",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "BILLY",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "3B5wuUrMEi5yATD7on46hKfej3pfmd7t1RKgrsN3pump",
            realizedProfit: 30.622182055192788,
            averageCost: 0.05862771820805639,
            cost: 26.457539010092322,
            totalBought: 451.280381,
            avgSold: 0.1264839409566203,
            totalGain: 57.07972106528511,
            totalSold: 451.280381,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -26.457539010092322,
          last_transferred_at: null,
          positionId: "SOL-3B5wuUrMEi5yATD7on46hKfej3pfmd7t1RKgrsN3pump",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=5CKqxRxmggzPz9nJr3BLiZbnTB4YH2zvuQyRWw4R19DF&chain=SOL",
          amount: "961418126.232586",
          amountRaw: "961418126232586",
          balance: "961418126.232586",
          contractAddress: "5CKqxRxmggzPz9nJr3BLiZbnTB4YH2zvuQyRWw4R19DF",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-5CKqxRxmggzPz9nJr3BLiZbnTB4YH2zvuQyRWw4R19DF",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "MAGA",
          symbol: "MAGA",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=sfYDFZJguyF4YLZjje7qwwh41NRymFfZ3QXZbVm7Eyg&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "sfYDFZJguyF4YLZjje7qwwh41NRymFfZ3QXZbVm7Eyg",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "MAGA",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-sfYDFZJguyF4YLZjje7qwwh41NRymFfZ3QXZbVm7Eyg",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "WATER Coin",
          symbol: "WATER",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=B6h248NJkAcBAkaCnji889a26tCiGXGN8cxhEJ4dX391&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "B6h248NJkAcBAkaCnji889a26tCiGXGN8cxhEJ4dX391",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "WATER",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "B6h248NJkAcBAkaCnji889a26tCiGXGN8cxhEJ4dX391",
            realizedProfit: 0,
            averageCost: 0.0009384268799119193,
            cost: 134.43129253729333,
            totalBought: 143251.749726,
            avgSold: 0,
            totalGain: 0,
            totalSold: 0,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -134.43129253729333,
          last_transferred_at: null,
          positionId: "SOL-B6h248NJkAcBAkaCnji889a26tCiGXGN8cxhEJ4dX391",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Cloud",
          symbol: "CLOUD",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=CLoUDKc4Ane7HeQcPpE3YHnznRxhMimJ4MyaUqyHFzAu&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "CLoUDKc4Ane7HeQcPpE3YHnznRxhMimJ4MyaUqyHFzAu",
          contractDecimals: 9,
          rate: 0,
          price: {
            price: 0,
            symbol: "CLOUD",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "CLoUDKc4Ane7HeQcPpE3YHnznRxhMimJ4MyaUqyHFzAu",
            realizedProfit: 0,
            averageCost: null,
            cost: 0,
            totalBought: 0,
            avgSold: 0.3055567835117096,
            totalGain: 45.903981865990524,
            totalSold: 150.230609638,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-CLoUDKc4Ane7HeQcPpE3YHnznRxhMimJ4MyaUqyHFzAu",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Sanctum Infinity",
          symbol: "INF",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm",
          contractDecimals: 9,
          rate: 0,
          price: {
            price: 0,
            symbol: "INF",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm",
            realizedProfit: 8.065804538832555,
            averageCost: 175.4122564799451,
            cost: 1388.792868192387,
            totalBought: 7.917308038,
            avgSold: 188.54486037442956,
            totalGain: 115.80079646050453,
            totalSold: 0.614181666,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -1388.792868192387,
          last_transferred_at: null,
          positionId: "SOL-5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Wormhole",
          symbol: "W",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "W",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=DT2atPgXeJyGGZHp4VPqUQoDhqR7wRrbDsmu5MvDcGps&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "DT2atPgXeJyGGZHp4VPqUQoDhqR7wRrbDsmu5MvDcGps",
          contractDecimals: 9,
          rate: 0,
          price: {
            price: 0,
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-DT2atPgXeJyGGZHp4VPqUQoDhqR7wRrbDsmu5MvDcGps",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=DwNmcpEQmwvYo2fuwr2koTALWcigPgT4R8bMoDHAzdsf&chain=SOL",
          amount: "22",
          amountRaw: "22000000",
          balance: "22",
          contractAddress: "DwNmcpEQmwvYo2fuwr2koTALWcigPgT4R8bMoDHAzdsf",
          contractDecimals: 6,
          rate: 0.00046335433234619995,
          price: {
            price: 0.00046335433234619995,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-DwNmcpEQmwvYo2fuwr2koTALWcigPgT4R8bMoDHAzdsf",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=3Hx8bJkdg5WbXhMwvVSV4AcsFgSPr6X92SM8ou7fQX4Q&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "3Hx8bJkdg5WbXhMwvVSV4AcsFgSPr6X92SM8ou7fQX4Q",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-3Hx8bJkdg5WbXhMwvVSV4AcsFgSPr6X92SM8ou7fQX4Q",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=6MpatBz5bnN6Uq2YWhvFeLrL4thZMTf41J5ge7V5kRvE&chain=SOL",
          amount: "1364.655616",
          amountRaw: "1364655616",
          balance: "1364.655616",
          contractAddress: "6MpatBz5bnN6Uq2YWhvFeLrL4thZMTf41J5ge7V5kRvE",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-6MpatBz5bnN6Uq2YWhvFeLrL4thZMTf41J5ge7V5kRvE",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Goatseus Maximus",
          symbol: "GOAT",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "GOAT",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump",
            realizedProfit: 3.3779367602638604,
            averageCost: 0.35361073456451403,
            cost: 30.535844938542276,
            totalBought: 86.354406,
            avgSold: 0.431845,
            totalGain: 18.645859229535,
            totalSold: 43.177203,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -30.535844938542276,
          last_transferred_at: null,
          positionId: "SOL-CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Cecil The Lion",
          symbol: "CECIL",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=GPzvszRyF6Dr3EwiQMokd7d8mKWykfv8SCWrB9hQjb6y&chain=SOL",
          amount: "500",
          amountRaw: "500000000000",
          balance: "500",
          contractAddress: "GPzvszRyF6Dr3EwiQMokd7d8mKWykfv8SCWrB9hQjb6y",
          contractDecimals: 9,
          rate: 0.0000695616822783895,
          price: {
            price: 0.0000695616822783895,
            symbol: "CECIL",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-GPzvszRyF6Dr3EwiQMokd7d8mKWykfv8SCWrB9hQjb6y",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=7pLEN6qXL77vTQyEJ4yXZNURtXn79yfuACAYT1j3h5P8&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "7pLEN6qXL77vTQyEJ4yXZNURtXn79yfuACAYT1j3h5P8",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-7pLEN6qXL77vTQyEJ4yXZNURtXn79yfuACAYT1j3h5P8",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=6b96LgovGReru4CyiayHJNVwDhF8vrcnkuCDEhaabsgp&chain=SOL",
          amount: "997232888.637672",
          amountRaw: "997232888637672",
          balance: "997232888.637672",
          contractAddress: "6b96LgovGReru4CyiayHJNVwDhF8vrcnkuCDEhaabsgp",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-6b96LgovGReru4CyiayHJNVwDhF8vrcnkuCDEhaabsgp",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "MUMU THE BULL",
          symbol: "MUMU",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=5LafQUrVco6o7KMz42eqVEJ9LW31StPyGjeeu5sKoMtA&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "5LafQUrVco6o7KMz42eqVEJ9LW31StPyGjeeu5sKoMtA",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "MUMU",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "5LafQUrVco6o7KMz42eqVEJ9LW31StPyGjeeu5sKoMtA",
            realizedProfit: 0,
            averageCost: null,
            cost: 0,
            totalBought: 0,
            avgSold: 0.000007361821455167522,
            totalGain: 37.43653067622186,
            totalSold: 5085226.652698,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-5LafQUrVco6o7KMz42eqVEJ9LW31StPyGjeeu5sKoMtA",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Suprint",
          symbol: "SUP",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=FN24MXrfZJeftXuZepTbsTgMo3stYvb2yES2QBuiZHP9&chain=SOL",
          amount: "5000",
          amountRaw: "5000000000000",
          balance: "5000",
          contractAddress: "FN24MXrfZJeftXuZepTbsTgMo3stYvb2yES2QBuiZHP9",
          contractDecimals: 9,
          rate: 0.000003189872058654414,
          price: {
            price: 0.000003189872058654414,
            symbol: "SUP",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-FN24MXrfZJeftXuZepTbsTgMo3stYvb2yES2QBuiZHP9",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Raydium",
          symbol: "RAY",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R&chain=SOL",
          amount: "0.000002",
          amountRaw: "2",
          balance: "0.000002",
          contractAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
          contractDecimals: 6,
          rate: 4.9463828920642126,
          price: {
            price: 4.9463828920642126,
            symbol: "RAY",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=5u2pFEnhosLZm9sHA58AY2ZeeZkL827jB9QtSCXwmmzE&chain=SOL",
          amount: "328200",
          amountRaw: "328200000000",
          balance: "328200",
          contractAddress: "5u2pFEnhosLZm9sHA58AY2ZeeZkL827jB9QtSCXwmmzE",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-5u2pFEnhosLZm9sHA58AY2ZeeZkL827jB9QtSCXwmmzE",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Solend SOL",
          symbol: "CSOL",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=5h6ssFpeDeRbzsEHDbTQNH7nVGgsKrZydxdSTnLm6QdV&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "5h6ssFpeDeRbzsEHDbTQNH7nVGgsKrZydxdSTnLm6QdV",
          contractDecimals: 9,
          rate: 0,
          price: {
            price: 0,
            symbol: "CSOL",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-5h6ssFpeDeRbzsEHDbTQNH7nVGgsKrZydxdSTnLm6QdV",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Luce",
          symbol: "LUCE",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=CBdCxKo9QavR9hfShgpEBG3zekorAeD7W1jfq2o3pump&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "CBdCxKo9QavR9hfShgpEBG3zekorAeD7W1jfq2o3pump",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "LUCE",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-CBdCxKo9QavR9hfShgpEBG3zekorAeD7W1jfq2o3pump",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Moutai",
          symbol: "MOUTAI",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "MOUTAI",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX",
            realizedProfit: 1999.8874802963173,
            averageCost: 0.005446760314593188,
            cost: 1155.5683660270663,
            totalBought: 212157.00697,
            avgSold: 0.013484570185117449,
            totalGain: 2860.8460507514164,
            totalSold: 212157.00697,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -1155.5683660270663,
          last_transferred_at: null,
          positionId: "SOL-45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=9nLW4x8P321BQTJA1e4x4RrUXQxyFn21ErGCU8ZZHVCG&chain=SOL",
          amount: "575000",
          amountRaw: "575000000000",
          balance: "575000",
          contractAddress: "9nLW4x8P321BQTJA1e4x4RrUXQxyFn21ErGCU8ZZHVCG",
          contractDecimals: 6,
          rate: 0.000006761995905604406,
          price: {
            price: 0.000006761995905604406,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-9nLW4x8P321BQTJA1e4x4RrUXQxyFn21ErGCU8ZZHVCG",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Kamino",
          symbol: "KMNO",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "KMNO",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Bridged USD Coin (Wormhole Ethereum)",
          symbol: "USDCET",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "USDCET",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
            realizedProfit: 0,
            averageCost: null,
            cost: 0,
            totalBought: 0,
            avgSold: 0.9996510991526811,
            totalGain: 1849.856036396581,
            totalSold: 1850.501678,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "dogwifhat",
          symbol: "WIF",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "WIF",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
            realizedProfit: 41.65152665418462,
            averageCost: 1.850490407584362,
            cost: 129.96120891057893,
            totalBought: 70.230685,
            avgSold: 2.435231754016516,
            totalGain: 173.4632259723479,
            totalSold: 71.230685,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -129.96120891057893,
          last_transferred_at: null,
          positionId: "SOL-EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Bonk",
          symbol: "BONK",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
          contractDecimals: 5,
          rate: 0,
          price: {
            price: 0,
            symbol: "BONK",
            decimal: 5,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
            realizedProfit: 0,
            averageCost: 0.00001073179858877911,
            cost: 37.80978039890133,
            totalBought: 3523154.11868,
            avgSold: 0,
            totalGain: 0,
            totalSold: 0,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -37.80978039890133,
          last_transferred_at: null,
          positionId: "SOL-DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "N/A",
          symbol: "N/A",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=J9WPrQ7JsuxK26ds8ZaioYM4ee2kEayhsiTENurCWEKX&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "J9WPrQ7JsuxK26ds8ZaioYM4ee2kEayhsiTENurCWEKX",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-J9WPrQ7JsuxK26ds8ZaioYM4ee2kEayhsiTENurCWEKX",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
        },
      ],
      top_gainer: [
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Moutai",
          symbol: "MOUTAI",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "MOUTAI",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX",
            realizedProfit: 1999.8874802963173,
            averageCost: 0.005446760314593188,
            cost: 1155.5683660270663,
            totalBought: 212157.00697,
            avgSold: 0.013484570185117449,
            totalGain: 2860.8460507514164,
            totalSold: 212157.00697,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -1155.5683660270663,
          last_transferred_at: null,
          positionId: "SOL-45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
          value: 0,
          networth_change: 1999.8874802963173,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "Solana",
          symbol: "SOL",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=So11111111111111111111111111111111111111112&chain=SOL",
          amount: "2.112505049",
          amountRaw: "2112505049",
          balance: "2.112505049",
          contractAddress: "So11111111111111111111111111111111111111112",
          contractDecimals: 9,
          rate: 233.2826612178066,
          price: {
            price: 233.2826612178066,
            symbol: "SOL",
            decimal: 9,
            source: "C",
          },
          last_24h_price: null,
          avgCost: 0,
          last_transferred_at: null,
          positionId: "SOL-So11111111111111111111111111111111111111112",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "ERC_20",
          chain: "SOL",
          is_spam: false,
          value: 492.810799666773,
          networth_change: 492.810799666773,
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          name: "dogwifhat",
          symbol: "WIF",
          logo: "https://token-logo.service.getnimbus.io/api/v1/logo?address=EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm&chain=SOL",
          amount: "0",
          amountRaw: "0",
          balance: "0",
          contractAddress: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
          contractDecimals: 6,
          rate: 0,
          price: {
            price: 0,
            symbol: "WIF",
            decimal: 6,
            source: "C",
          },
          last_24h_price: null,
          profit: {
            address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
            realizedProfit: 41.65152665418462,
            averageCost: 1.850490407584362,
            cost: 129.96120891057893,
            totalBought: 70.230685,
            avgSold: 2.435231754016516,
            totalGain: 173.4632259723479,
            totalSold: 71.230685,
            chain: "SOL",
            type: "TOKEN",
          },
          avgCost: -129.96120891057893,
          last_transferred_at: null,
          positionId: "SOL-EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
          category: "Other",
          sector: "Other",
          rank: "No rank yet",
          positionType: "dust",
          chain: "SOL",
          is_spam: false,
          value: 0,
          networth_change: 41.65152665418462,
        },
      ],
    },
    nfts: {
      stats: {
        total_collection: 53,
        total_holding: 56,
        total_trades: 16,
        networth: 800.19411476685,
        amount: 3.432099999,
      },
      top_holding: [
        {
          attributes: [
            {
              trait_type: "Core Attributes",
              value: "3",
            },
            {
              trait_type: "Species",
              value: "Orange",
            },
            {
              trait_type: "Clothes",
              value: "Blue Tracksuit",
            },
            {
              trait_type: "Back",
              value: "White Wings",
            },
            {
              trait_type: "Hat",
              value: "Blue Cap",
            },
            {
              trait_type: "Eyewear",
              value: "Blue Sunglasses",
            },
            {
              trait_type: "Eyes",
              value: "Classic",
            },
            {
              trait_type: "Background",
              value: "Yellow",
            },
            {
              trait_type: "Mouth",
              value: "Classic",
            },
          ],
          royalty: 0,
          imageUrl:
            "https://lh3.googleusercontent.com/7wCG7zfXjSf_d_6hmU87ogmrNdzIO6FOfIntj_eGh4j3dVRFEwJEgybK0MsSR6kCBZHJwSQY4pcjYnzMQ89eFJZMfAN7FoV1sZ0=s250",
          tokenId: 5895,
          contractAddress: "F3SestbUg6nMm8S8vtjyN5FnaUCPFK9tuhv4vERKNsM1",
          name: "SMB Gen3 #5895",
          rarityScore: 0,
          rank: "N/A",
          price: 4.84,
          cost: 493.7768,
          collection: {
            description:
              "SMB Gen3 is a collection of 15,000 visually stunning pixel art Monke NFTs crafted with love and passion. Express your unique web3 identity and join the thriving MonkeDAO community. Showcase your status as a true builder in web3 and be a part of the revolution with Solana Monke Business.",
            externalUrl: "https://solanamonkey.business",
            id: "8Rt3Ayqth4DAiPnW9MDFi63TiQJHmohfTWLMQFHi4KZH",
            imageUrl:
              "https://lh3.googleusercontent.com/emXujWiRSEk3BskFFxXv8fZKgaMaHNvQKDoHZ3MXNT6WVGo6Rm0jKCt_NZBTnHOu2jeOSoMkz4KZAr2mMVeu467Lg457ny9aRw",
            name: "SMB Gen3",
            totalItems: 7925,
            chain: "SOL",
          },
          collectionId: "8Rt3Ayqth4DAiPnW9MDFi63TiQJHmohfTWLMQFHi4KZH",
          floorPrice: 2.5498,
          marketPrice: 233.15,
        },
        {
          attributes: [
            {
              trait_type: "background",
              value: "solanacircle",
            },
            {
              trait_type: "body",
              value: "common-beige-halffold",
            },
            {
              trait_type: "clothes",
              value: "hoodie-black",
            },
            {
              trait_type: "lowerhead",
              value: "cigarette",
            },
            {
              trait_type: "accessory",
              value: "cash",
            },
            {
              trait_type: "upperhead",
              value: "punkhair-yellow",
            },
            {
              trait_type: "tattoo",
              value: "none",
            },
            {
              trait_type: "genesis",
              value: "none",
            },
          ],
          royalty: 0,
          imageUrl:
            "https://lh3.googleusercontent.com/tGLubefDwy9iAiGp04KdTPx7sAlRHkuEj-nQmgYhU8TJZV8e-BZyTMuqiUPne5s4MQMve19JjY8f9YFflh_IKawONxqJLJyQqw=s250",
          tokenId: 4212,
          contractAddress: "4SwEAVjCGSvuNvNNKFAyV2LoZRSPyJnFhvNLWinge6Ce",
          name: "Dappie Gang #4212",
          rarityScore: 0,
          rank: "N/A",
          price: 0,
          cost: 0,
          listing: {
            price: 6,
            marketplace: "magic_eden",
          },
          collection: {
            description:
              "Dappie Gang is a collection of 6,666 Rabbit NFTs — unique rabbit GameFi characters with DeFi utilities in Solana blockchain. Dappie Gang is your key to access members-only benefits, the first of which is access to DAPPIO, Solana Wonderland. Exclusive benefits and perks can be unlocked by the community through roadmap activation.",
            externalUrl: "https://gang.dappio.xyz",
            id: "DAPG6V6L5vGETBawLgNDjgLWQQnEeJ1iiy32G2B6yfx5",
            imageUrl:
              "https://lh3.googleusercontent.com/iK8zKHjiVBsidiqYHiGxv9r-T_cU-XLxfzufaQi8pX9aVy8fERXW6Ezob_v4guLvOl2rGSa3FCX_vOva0JQOF-my4l4dvXzq-II1",
            name: "Dappie Gang",
            totalItems: 6665,
            chain: "SOL",
          },
          collectionId: "DAPG6V6L5vGETBawLgNDjgLWQQnEeJ1iiy32G2B6yfx5",
          floorPrice: 0.703999999,
          marketPrice: 233.15,
        },
        {
          attributes: [
            {
              trait_type: "category",
              value: "image",
            },
          ],
          royalty: 0,
          imageUrl:
            "https://lh3.googleusercontent.com/2Avzd6qcH18D2W_oUZzNCigNPFDA7hZuiK14P5CdDzZXvQHBvgK3B2odrIomYrSvQSAAtrviRHeJy7b5IHHPh7XtqW4jHkxyNjU=s250",
          tokenId: 1235,
          contractAddress: "9eW6xGnFciehWMQwf9G7ZdScFpThvvqP6VjbjRuXYpFD",
          name: "Lava Rock Alpha #1235",
          rarityScore: 0,
          rank: "N/A",
          price: 0,
          cost: 0,
          collection: {
            description:
              "Possessors of the Lava Rock are bestowed with volcanic power to trade and earn more in the DeFi universe. With great power comes great responsibilities. Treasure it, and let’s #LavaToTheMoon",
            externalUrl: "https://lavarage.xyz",
            id: "3HeEvzCyUK3M7Q2xkvMeZojAnVYmn3yHGHHJHmRktUVw",
            imageUrl:
              "https://lh3.googleusercontent.com/2Avzd6qcH18D2W_oUZzNCigNPFDA7hZuiK14P5CdDzZXvQHBvgK3B2odrIomYrSvQSAAtrviRHeJy7b5IHHPh7XtqW4jHkxyNjU",
            name: "Lava Rock Alpha Series",
            totalItems: 1940,
            chain: "SOL",
          },
          collectionId: "3HeEvzCyUK3M7Q2xkvMeZojAnVYmn3yHGHHJHmRktUVw",
          floorPrice: 0.08,
          marketPrice: 233.15,
        },
      ],
      top_collection: [
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          nativeToken: {
            name: "Solana",
            cmcId: 5426,
            cmc_slug: "solana",
            cgId: "solana",
            symbol: "SOL",
            decimals: 9,
          },
          collection: {
            description:
              "SMB Gen3 is a collection of 15,000 visually stunning pixel art Monke NFTs crafted with love and passion. Express your unique web3 identity and join the thriving MonkeDAO community. Showcase your status as a true builder in web3 and be a part of the revolution with Solana Monke Business.",
            externalUrl: "https://solanamonkey.business",
            id: "8Rt3Ayqth4DAiPnW9MDFi63TiQJHmohfTWLMQFHi4KZH",
            imageUrl:
              "https://lh3.googleusercontent.com/emXujWiRSEk3BskFFxXv8fZKgaMaHNvQKDoHZ3MXNT6WVGo6Rm0jKCt_NZBTnHOu2jeOSoMkz4KZAr2mMVeu467Lg457ny9aRw",
            name: "SMB Gen3",
            totalItems: 7925,
            chain: "SOL",
          },
          collectionId: "8Rt3Ayqth4DAiPnW9MDFi63TiQJHmohfTWLMQFHi4KZH",
          tokens: [
            {
              attributes: [
                {
                  trait_type: "Core Attributes",
                  value: "3",
                },
                {
                  trait_type: "Species",
                  value: "Orange",
                },
                {
                  trait_type: "Clothes",
                  value: "Blue Tracksuit",
                },
                {
                  trait_type: "Back",
                  value: "White Wings",
                },
                {
                  trait_type: "Hat",
                  value: "Blue Cap",
                },
                {
                  trait_type: "Eyewear",
                  value: "Blue Sunglasses",
                },
                {
                  trait_type: "Eyes",
                  value: "Classic",
                },
                {
                  trait_type: "Background",
                  value: "Yellow",
                },
                {
                  trait_type: "Mouth",
                  value: "Classic",
                },
              ],
              royalty: 0,
              imageUrl:
                "https://lh3.googleusercontent.com/7wCG7zfXjSf_d_6hmU87ogmrNdzIO6FOfIntj_eGh4j3dVRFEwJEgybK0MsSR6kCBZHJwSQY4pcjYnzMQ89eFJZMfAN7FoV1sZ0=s250",
              tokenId: 5895,
              contractAddress: "F3SestbUg6nMm8S8vtjyN5FnaUCPFK9tuhv4vERKNsM1",
              name: "SMB Gen3 #5895",
              rarityScore: 0,
              rank: "N/A",
              price: 4.84,
              cost: 493.7768,
            },
          ],
          floorPrice: 2.5498,
          marketPrice: 233.15,
          profit: {
            realizedPnL: 0,
            unrealizedPnL: 100.70907,
          },
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          nativeToken: {
            name: "Solana",
            cmcId: 5426,
            cmc_slug: "solana",
            cgId: "solana",
            symbol: "SOL",
            decimals: 9,
          },
          collection: {
            description:
              "Dappie Gang is a collection of 6,666 Rabbit NFTs — unique rabbit GameFi characters with DeFi utilities in Solana blockchain. Dappie Gang is your key to access members-only benefits, the first of which is access to DAPPIO, Solana Wonderland. Exclusive benefits and perks can be unlocked by the community through roadmap activation.",
            externalUrl: "https://gang.dappio.xyz",
            id: "DAPG6V6L5vGETBawLgNDjgLWQQnEeJ1iiy32G2B6yfx5",
            imageUrl:
              "https://lh3.googleusercontent.com/iK8zKHjiVBsidiqYHiGxv9r-T_cU-XLxfzufaQi8pX9aVy8fERXW6Ezob_v4guLvOl2rGSa3FCX_vOva0JQOF-my4l4dvXzq-II1",
            name: "Dappie Gang",
            totalItems: 6665,
            chain: "SOL",
          },
          collectionId: "DAPG6V6L5vGETBawLgNDjgLWQQnEeJ1iiy32G2B6yfx5",
          tokens: [
            {
              attributes: [
                {
                  trait_type: "background",
                  value: "solanacircle",
                },
                {
                  trait_type: "body",
                  value: "common-beige-halffold",
                },
                {
                  trait_type: "clothes",
                  value: "hoodie-black",
                },
                {
                  trait_type: "lowerhead",
                  value: "cigarette",
                },
                {
                  trait_type: "accessory",
                  value: "cash",
                },
                {
                  trait_type: "upperhead",
                  value: "punkhair-yellow",
                },
                {
                  trait_type: "tattoo",
                  value: "none",
                },
                {
                  trait_type: "genesis",
                  value: "none",
                },
              ],
              royalty: 0,
              imageUrl:
                "https://lh3.googleusercontent.com/tGLubefDwy9iAiGp04KdTPx7sAlRHkuEj-nQmgYhU8TJZV8e-BZyTMuqiUPne5s4MQMve19JjY8f9YFflh_IKawONxqJLJyQqw=s250",
              tokenId: 4212,
              contractAddress: "4SwEAVjCGSvuNvNNKFAyV2LoZRSPyJnFhvNLWinge6Ce",
              name: "Dappie Gang #4212",
              rarityScore: 0,
              rank: "N/A",
              price: 0,
              cost: 0,
              listing: {
                price: 6,
                marketplace: "magic_eden",
              },
            },
          ],
          floorPrice: 0.703999999,
          marketPrice: 233.15,
          profit: {
            realizedPnL: 0,
            unrealizedPnL: 164.13759976685,
          },
        },
        {
          owner: "GeY8NPRFeeCUPpgmh5Jm3ACin755QQ3P5W3JV3nxnmzz",
          nativeToken: {
            name: "Solana",
            cmcId: 5426,
            cmc_slug: "solana",
            cgId: "solana",
            symbol: "SOL",
            decimals: 9,
          },
          collection: {
            description:
              "Possessors of the Lava Rock are bestowed with volcanic power to trade and earn more in the DeFi universe. With great power comes great responsibilities. Treasure it, and let’s #LavaToTheMoon",
            externalUrl: "https://lavarage.xyz",
            id: "3HeEvzCyUK3M7Q2xkvMeZojAnVYmn3yHGHHJHmRktUVw",
            imageUrl:
              "https://lh3.googleusercontent.com/2Avzd6qcH18D2W_oUZzNCigNPFDA7hZuiK14P5CdDzZXvQHBvgK3B2odrIomYrSvQSAAtrviRHeJy7b5IHHPh7XtqW4jHkxyNjU",
            name: "Lava Rock Alpha Series",
            totalItems: 1940,
            chain: "SOL",
          },
          collectionId: "3HeEvzCyUK3M7Q2xkvMeZojAnVYmn3yHGHHJHmRktUVw",
          tokens: [
            {
              attributes: [
                {
                  trait_type: "category",
                  value: "image",
                },
              ],
              royalty: 0,
              imageUrl:
                "https://lh3.googleusercontent.com/2Avzd6qcH18D2W_oUZzNCigNPFDA7hZuiK14P5CdDzZXvQHBvgK3B2odrIomYrSvQSAAtrviRHeJy7b5IHHPh7XtqW4jHkxyNjU=s250",
              tokenId: 1235,
              contractAddress: "9eW6xGnFciehWMQwf9G7ZdScFpThvvqP6VjbjRuXYpFD",
              name: "Lava Rock Alpha #1235",
              rarityScore: 0,
              rank: "N/A",
              price: 0,
              cost: 0,
            },
          ],
          floorPrice: 0.08,
          marketPrice: 233.15,
          profit: {
            realizedPnL: 0,
            unrealizedPnL: 18.652,
          },
        },
      ],
    },
    airdrops: [
      {
        name: "WEN",
        token: "WEN",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Jito",
        token: "JTO",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/28541.png",
      },
      {
        name: "Hxro",
        token: "HXRO",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3748.png",
      },
      {
        name: "Pyth",
        token: "PYTH",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/28177.png",
      },
      {
        name: "Jupiter",
        token: "JUP",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: true,
        logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/28853.png",
      },
      {
        name: "Less Fees and Gas",
        token: "LFG",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Bonk",
        token: "BONK",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png",
      },
      {
        name: "Fomo",
        token: "FOMO",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/28579.png",
      },
      {
        name: "RKT",
        token: "RKT",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/6512.png",
      },
      {
        name: "Ponk",
        token: "PONK",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://dd.dexscreener.com/ds-data/tokens/solana/heqccmjmuv5s25j49yijyt6bd5qwlkp88ypajbysniav.png?size=lg",
      },
      {
        name: "BSKT",
        token: "BSKT",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Wormhole",
        token: "W",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "NIM",
        token: "NIM",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "ether.fi",
        token: "ETHFI",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Banx",
        token: "BANX",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Polyhedra",
        token: "ZK",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Saros",
        token: "SAROS",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "ZEUS",
        token: "ZEUS",
        eligible: true,
        amount: 1540,
        value: 946.5332799999999,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Kamino",
        token: "KMNO",
        eligible: true,
        amount: 2089.95774,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Tensor",
        token: "TNSR",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Sharky.fi",
        token: "SHARK",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Parcl",
        token: "PARCL",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Drift",
        token: "DRIFT",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Uprock",
        token: "UPT",
        eligible: true,
        amount: 10,
        value: 0.15453701,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "ZKSync",
        token: "ZK",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "LayerZero",
        token: "ZRO",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Zeta",
        token: "ZEX",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "Pool Party",
        token: "PARTY",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
      {
        name: "ART",
        token: "ART",
        eligible: 0,
        amount: 0,
        value: 0,
        upcoming: false,
        logo: "https://raw.githubusercontent.com/getnimbus/assets/main/token.png",
      },
    ],
    mintNFT: {
      solHolding: 2.112505049,
      summaryLabel: "SOL Explorer",
      totalNFTs: 56,
      tag: "Top 10",
      solChange: 10,
      nftChange: 20,
    },
  };
</script>

<svelte:head>
  <title>Your Solana 2023 Recap</title>
  <meta
    name="description"
    content="Recap your journey with Solana in 2023, mint your momemnt"
  />
  <meta property="twitter:image" content="/assets/logo/logoN.png" />
</svelte:head>

<ErrorBoundary>
  <div class="recap-wrapper" id="recap-wrapper">
    <div
      class="recap-container"
      use:inview={{
        threshold: 0.1,
      }}
      on:inview_change={(event) => {
        const { inView, entry, scrollDirection, observer, node } = event.detail;
        if (inView) {
          document
            .getElementById("recap-wrapper")
            ?.classList.add("recap-wrapper");
        }
      }}
    >
      <div class="bg-[#EBFDFF] min-h-screen overflow-hidden py-10 flex">
        <div class="flex 1 flex flex-col gap-20 h-full max-w-[1400px] m-auto">
          <img
            src={Logo}
            alt="logo"
            loading="lazy"
            decoding="async"
            class="xl:w-[177px] w-[220px] xl:h-[75px] h-[100px] transform translate-x-2"
          />
          <div
            class="flex-1 h-full flex xl:flex-row flex-col items-center item_start xl:justify-between justify-center gap-20 px-[35px]"
          >
            <div class="flex flex-col gap-10">
              <div
                class="text-[#202025] text-[100px] text_title_lg_view font-bold mt-3"
              >
                2023 Solana Recap
              </div>
              <div class="flex flex-col gap-6">
                <div class="space-y-4">
                  <div class="w-max">
                    <input
                      type="text"
                      name="address"
                      class="block w-full rounded-full border-0 py-4 px-6 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-3xl"
                      placeholder="Your wallet address"
                      bind:value={inputAddress}
                    />
                  </div>
                  <div
                    class="w-max flex items-center justify-center gap-2 cursor-pointer p-[20px] rounded-[32px] min-w-[250px] bg-[#A7EB50] text-black text-2xl font-semibold"
                    on:click={() => {
                      userAddress = inputAddress;
                      try {
                        mixpanel.track("recap_input_wallet", inputAddress);
                      } catch (error) {
                        console.log(error);
                      }

                      window.scrollTo({
                        top: 800,
                        left: 0,
                        behavior: "smooth",
                      });
                    }}
                  >
                    View my Recap
                    <img src={Arrow} alt="" />
                  </div>
                </div>
                <div class="text-base mt-[-12px] text-black">
                  <div>1021+ users viewed their Solana Recap 2023</div>
                  <div class="mt-3">
                    Made with ❤️ from <img
                      src={SuperteamLogo}
                      width="24"
                      height="24"
                      class="rounded-full"
                    /> Superteam Vietnam
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <div class="text-black font-normal text-base">
                2023 has proven to be a challenging year for every holder, but
                we've managed to weather the storm and emerge from the bottom.
                This resilience is a significant achievement, and now let's
                reflect on the moments we've overcome together.
              </div>

              <div class="flex justify-center gap-10 py-10 px-16">
                <div class="relative">
                  <div class="absolute top-[-80px] left-[-160px]">
                    <img
                      src={SvgOne}
                      alt=""
                      class="w-full h-full object-contain"
                    />
                  </div>
                  <CardNftRecap data={NFTOne} />
                </div>
                <div class="relative">
                  <div class="absolute bottom-[-130px] right-[-150px]">
                    <img
                      src={SvgTwo}
                      alt=""
                      class="w-full h-full object-contain"
                    />
                  </div>
                  <CardNftRecap data={NFTTwo} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {#if true}
      <div
        class="recap-container"
        id="recap-holding"
        use:inview={{
          threshold: 0.1,
        }}
        on:inview_change={(event) => {
          const { inView, entry, scrollDirection, observer, node } =
            event.detail;
          if (inView) {
            document
              .getElementById("recap-wrapper")
              ?.classList.add("recap-wrapper");
          }
        }}
      >
        <TokenHolding
          data={data?.tokens}
          summary={data?.mintNFT}
          loading={false}
        />
      </div>

      <div
        class="recap-container"
        use:inview={{
          threshold: 0.1,
        }}
        on:inview_change={(event) => {
          const { inView, entry, scrollDirection, observer, node } =
            event.detail;
          if (inView) {
            document
              .getElementById("recap-wrapper")
              ?.classList.add("recap-wrapper");
          }
        }}
      >
        <NftHolding data={data?.nfts} loading={false} />
      </div>

      <div
        class="recap-container"
        use:inview={{
          threshold: 0.1,
        }}
        on:inview_change={(event) => {
          const { inView, entry, scrollDirection, observer, node } =
            event.detail;
          if (inView) {
            document
              .getElementById("recap-wrapper")
              ?.classList.add("recap-wrapper");
          }
        }}
      >
        <Airdrop data={data?.airdrops} loading={false} />
      </div>

      <div
        class="recap-container"
        use:inview={{
          threshold: 0.1,
        }}
        on:inview_change={(event) => {
          const { inView, entry, scrollDirection, observer, node } =
            event.detail;
          if (inView) {
            document
              .getElementById("recap-wrapper")
              ?.classList.remove("recap-wrapper");
          }
        }}
      >
        <MintNft
          data={data?.mintNFT}
          on:connect={() => {
            openModal();
          }}
        />
      </div>
    {/if}

    <div
      class="no-snap"
      use:inview={{
        threshold: 0.1,
      }}
      on:inview_change={(event) => {
        const { inView, entry, scrollDirection, observer, node } = event.detail;
        if (inView) {
          document
            .getElementById("recap-wrapper")
            ?.classList.remove("recap-wrapper");
        }
      }}
    >
      <Promote />
    </div>
  </div>
</ErrorBoundary>

<WalletProvider
  localStorageKey="walletAdapter"
  {wallets}
  autoConnect
  onError={console.log}
/>

{#if modalVisible}
  <WalletModal
    on:close={closeModal}
    on:connect={connectWallet}
    {maxNumberOfWallets}
  />
{/if}

<style>
  @media (min-width: 1024px) {
    @media not all and (min-width: 1280px) {
      .text_title_lg_view {
        font-size: 60px;
      }
      .item_start {
        -webkit-box-align: start;
        -ms-flex-align: start;
        -webkit-align-items: flex-start;
        align-items: flex-start;
      }
    }
  }

  :global(img) {
    display: inline-block;
  }

  :global(.recap-wrapper) {
    scroll-snap-type: y mandatory;
  }

  :global(#recap-wrapper) {
    position: relative;
    width: 100%;
    min-height: 100vh;
    scroll-behavior: smooth;
    overflow: auto;
  }

  :global(.recap-container) {
    width: 100%;
    min-height: 100vh;
    background-size: cover;
    scroll-snap-align: start;
  }
</style>
