import All from "~/assets/all.svg";
import Bundles from "~/assets/bundles.png";

import Bitcoin from "~/assets/chains/bitcoin.png";
import Aura from "~/assets/chains/aura.png";
import Near from "~/assets/chains/near.png";
import Ton from "~/assets/chains/ton.png";
import Injective from "~/assets/chains/injective.png";
// import Algorand from "~/assets/chains/algorand.png";

// MOVE
// import Move from "~/assets/chains/move.png";
import Sui from "~/assets/chains/sui.png";
// import Aptos from "~/assets/chains/aptos.png";

// SOL
import Eclipse from "~/assets/chains/eclipse.png";
import Solana from "~/assets/chains/solana.png";

// EVM
import EVM from "~/assets/chains/evm.png";
import Ethereum from "~/assets/chains/ethereum.png";
import Bnb from "~/assets/chains/bnb.png";
import Matic from "~/assets/chains/matic.png";
import Optimism from "~/assets/chains/optimism.png";
import Avax from "~/assets/chains/avax.png";
import Arbitrum from "~/assets/chains/arbitrum.png";
import Base from "~/assets/chains/base.svg";
import Scroll from "~/assets/chains/scroll.png";
import ZkSync from "~/assets/chains/zksync.png";
import Linea from "~/assets/chains/linea.png";
import Exzo from "~/assets/chains/exzo.png";
import Moonbeam from "~/assets/chains/moonbeam.png";
import Evmos from "~/assets/chains/evmos.png";
import Fantom from "~/assets/chains/fantom.png";
import Harmony from "~/assets/chains/harmony.png";
import Metis from "~/assets/chains/metis.png";
import Ronin from "~/assets/chains/ronin.png";
import opBNB from "~/assets/chains/opbnb.png";
import Moonriver from "~/assets/chains/moonriver.png";
import Canto from "~/assets/chains/canto.png";
import Oasis from "~/assets/chains/oasis.png";
import Blast from "~/assets/chains/blast.png";
import Shimmer from "~/assets/chains/shimmer.png";
import U2U from "~/assets/chains/u2u.png";
// import inEVM from "~/assets/chains/injective.png";
// import Manta from "~/assets/chains/manta.png";
// import Klaytn from "~/assets/chains/klaytn.png";
// import Zeta from "~/assets/chains/zeta.png";
// import zkEVM from "~/assets/chains/zkEVM.png";
// import Aurora from "~/assets/chains/aurora.png";
// import Cronos from "~/assets/chains/cronos.png";
// import Mantle from "~/assets/chains/mantle.png";
// import Viction from "~/assets/chains/viction.png";
// import Gnosis from "~/assets/chains/gnosis.png";

export const listNotSupportHistoricalBalances = [
  "ROSE",
  "CANTO",
  "MOVR",
  "MANTA",
  "LINEA",
  "ZKSYNC",
  "ARB",
  "AVAX",
  "OP",
  "BASE",
  "SCROLL",
  "XZO",
  "RON",
  "FANTOM",
  "EVMOS",
  "ONE",
  "GLMR",
  "METIS",
  "OPBNB",
  "SHIMMER",
  "U2U",
  // "VIC",
  // "MANTLE",
  // "CRONOS",
  // "XDAI",
  // "ZETA",
  // "AURORA",
  // "POLYGON_ZKEVM",
  // "inEVM",
  // "KLAY",
];

export const listSupported = [
  "BUNDLE",
  "EVM",
  "MOVE",
  "SUI",
  "SOL",
  "ECLIPSE",
  "TON",
  "NEAR",
  "ALGO",
  "AURA",
  "INJ",
];

export const bigGeneration = ["EVM", "MOVE", "SOL"];
export const otherGeneration = ["BTC", "NEAR", "ALGO", "AURA", "TON", "INJ"];
export const generationLogo = [
  {
    logo: Bitcoin,
  },
  {
    logo: EVM,
  },
  {
    logo: Sui,
  },
  {
    logo: Solana,
  },
  {
    logo: Ton,
  },
  {
    logo: Near,
  },
  {
    logo: Aura,
  },
  {
    logo: Injective,
  },
  // {
  //   logo: Algorand,
  // },
];

export const chainSolList = [
  {
    logo: All,
    label: "All chains",
    value: "ALL",
  },
  {
    logo: Solana,
    label: "Solana",
    value: "SOL",
  },
  {
    logo: Eclipse,
    label: "Eclipse",
    value: "ECLIPSE",
  },
];

export const chainMoveList = [
  {
    logo: All,
    label: "All chains",
    value: "ALL",
  },
  {
    logo: Sui,
    label: "Sui",
    value: "SUI",
  },
  // {
  //   logo: Aptos,
  //   label: "Aptos",
  //   value: "APT",
  // },
];

export const chainList = [
  {
    logo: All,
    label: "All chains",
    value: "ALL",
  },
  {
    logo: Ethereum,
    label: "Ethereum",
    value: "ETH",
  },
  {
    logo: Bnb,
    label: "BNB",
    value: "BNB",
  },
  // {
  //   logo: opBNB,
  //   label: "opBNB",
  //   value: "OPBNB",
  // },
  {
    logo: Matic,
    label: "Polygon",
    value: "MATIC",
  },
  // {
  //   logo: zkEVM,
  //   label: "Polygon zkEVM",
  //   value: "POLYGON_ZKEVM",
  // },
  // {
  //   logo: inEVM,
  //   label: "inEVM",
  //   value: "inEVM",
  // },
  {
    logo: Optimism,
    label: "Optimism",
    value: "OP",
  },
  {
    logo: Avax,
    label: "Avalanche",
    value: "AVAX",
  },
  {
    logo: Arbitrum,
    label: "Arbitrum",
    value: "ARB",
  },
  {
    logo: Base,
    label: "Base",
    value: "BASE",
  },
  {
    logo: Scroll,
    label: "Scroll",
    value: "SCROLL",
  },
  // {
  //   logo: Gnosis,
  //   label: "Gnosis",
  //   value: "XDAI",
  // },
  {
    logo: ZkSync,
    label: "ZkSync",
    value: "ZKSYNC",
  },
  {
    logo: Linea,
    label: "Linea",
    value: "LINEA",
  },
  // {
  //   logo: Cronos,
  //   label: "Cronos",
  //   value: "CRONOS",
  // },
  // {
  //   logo: Mantle,
  //   label: "Mantle",
  //   value: "MANTLE",
  // },
  // {
  //   logo: Exzo,
  //   label: "Exzo",
  //   value: "XZO",
  // },
  // {
  //   logo: Klaytn,
  //   label: "Klaytn",
  //   value: "KLAY",
  // },
  // {
  //   logo: Viction,
  //   label: "Viction",
  //   value: "VIC",
  // },
  // {
  //   logo: Zeta,
  //   label: "Zeta",
  //   value: "ZETA",
  // },
  {
    logo: Fantom,
    label: "Fantom",
    value: "FANTOM",
  },
  // {
  //   logo: Evmos,
  //   label: "Evmos",
  //   value: "EVMOS",
  // },
  // {
  //   logo: Harmony,
  //   label: "Harmony",
  //   value: "ONE",
  // },
  // {
  //   logo: Moonbeam,
  //   label: "Moonbeam",
  //   value: "GLMR",
  // },
  {
    logo: Metis,
    label: "Metis",
    value: "METIS",
  },
  // {
  //   logo: Aurora,
  //   label: "Aurora",
  //   value: "AURORA",
  // },
  {
    logo: Ronin,
    label: "Ronin",
    value: "RON",
  },
  // {
  //   logo: Moonriver,
  //   label: "Moonriver",
  //   value: "MOVR",
  // },
  // {
  //   logo: Canto,
  //   label: "Canto",
  //   value: "CANTO",
  // },
  // {
  //   logo: Oasis,
  //   label: "Oasis",
  //   value: "ROSE",
  // },
  // {
  //   logo: Manta,
  //   label: "Manta",
  //   value: "MANTA",
  // },
  {
    logo: Blast,
    label: "Blast",
    value: "BLAST",
  },
  {
    logo: Shimmer,
    label: "Shimmer",
    value: "SHIMMER",
  },
  {
    logo: U2U,
    label: "U2U",
    value: "U2U",
  },
];

export const detectedGeneration = (type: string) => {
  let logo = All;
  switch (type) {
    case "BUNDLE":
      logo = Bundles;
      break;
    case "EVM":
      logo = EVM;
      break;
    case "MOVE":
      logo = Sui;
      break;
    case "BTC":
      logo = Bitcoin;
      break;
    case "SOL":
      logo = Solana;
      break;
    case "TON":
      logo = Ton;
      break;
    case "NEAR":
      logo = Near;
      break;
    case "AURA":
      logo = Aura;
      break;
    case "INJ":
      logo = Injective;
      break;
    // case "ALGO":
    //   logo = Algorand;
    //   break;
  }
  return logo;
};

export const detectedChain = (type: any) => {
  let chain = {
    logo: All,
    name: "All",
  };
  switch (type) {
    case "BTC":
      chain = {
        logo: Bitcoin,
        name: "Bitcoin",
      };
      break;
    case "AURA":
      chain = {
        logo: Aura,
        name: "Aura",
      };
      break;
    case "SUI":
      chain = {
        logo: Sui,
        name: "Sui",
      };
      break;
    case "SOL":
      chain = {
        logo: Solana,
        name: "Solana",
      };
      break;
    case "ECLIPSE":
      chain = {
        logo: Eclipse,
        name: "Eclipse",
      };
      break;
    case "NEAR":
      chain = {
        logo: Near,
        name: "Near",
      };
      break;
    case "TON":
      chain = {
        logo: Ton,
        name: "Ton",
      };
      break;
    // case "ALGO":
    //   chain = {
    //     logo: Algorand,
    //     name: "Algorand",
    //   };
    //   break;
    case "INJ":
      chain = {
        logo: Injective,
        name: "Injective",
      };
      break;
    case "ETH":
      chain = {
        logo: Ethereum,
        name: "Ethereum",
      };
      break;
    // case "XDAI":
    //   chain = {
    //     logo: Gnosis,
    //     name: "Gnosis",
    //   };
    //   break;
    case "BNB":
      chain = {
        logo: Bnb,
        name: "Binance",
      };
      break;
    case "MATIC":
      chain = {
        logo: Matic,
        name: "Polygon",
      };
      break;
    case "OP":
      chain = {
        logo: Optimism,
        name: "Optimism",
      };
      break;
    case "AVAX":
      chain = {
        logo: Avax,
        name: "Avalanche",
      };
      break;
    case "ARB":
      chain = {
        logo: Arbitrum,
        name: "Arbitrum",
      };
      break;
    case "BASE":
      chain = {
        logo: Base,
        name: "Base",
      };
      break;
    case "SCROLL":
      chain = {
        logo: Scroll,
        name: "Scroll",
      };
      break;
    case "ZKSYNC":
      chain = {
        logo: ZkSync,
        name: "ZkSync",
      };
      break;
    case "LINEA":
      chain = {
        logo: Linea,
        name: "Linea",
      };
      break;
    // case "CRONOS":
    //   chain = {
    //     logo: Cronos,
    //     name: "Cronos",
    //   };
    //   break;
    // case "MANTLE":
    //   chain = {
    //     logo: Mantle,
    //     name: "Mantle",
    //   };
    //   break;
    case "XZO":
      chain = {
        logo: Exzo,
        name: "Exzo",
      };
      break;
    // case "KLAY":
    //   chain = {
    //     logo: Klaytn,
    //     name: "Klaytn",
    //   };
    //   break;
    // case "VIC":
    //   chain = {
    //     logo: Viction,
    //     name: "Viction",
    //   };
    //   break;
    // case "ZETA":
    //   chain = {
    //     logo: Zeta,
    //     name: "Zeta (Testnet)",
    //   };
    //   break;
    case "FANTOM":
      chain = {
        logo: Fantom,
        name: "Fantom",
      };
      break;
    case "EVMOS":
      chain = {
        logo: Evmos,
        name: "Evmos",
      };
      break;
    case "ONE":
      chain = {
        logo: Harmony,
        name: "Harmony",
      };
      break;
    case "GLMR":
      chain = {
        logo: Moonbeam,
        name: "Moonbeam",
      };
      break;
    case "METIS":
      chain = {
        logo: Metis,
        name: "Metis",
      };
      break;
    // case "AURORA":
    //   chain = {
    //     logo: Aurora,
    //     name: "Aurora",
    //   };
    //   break;
    case "RON":
      chain = {
        logo: Ronin,
        name: "Ronin",
      };
      break;
    // case "POLYGON_ZKEVM":
    //   chain = {
    //     logo: zkEVM,
    //     name: "Polygon zkEVM",
    //   };
    //   break;
    case "OPBNB":
      chain = {
        logo: opBNB,
        name: "opBNB",
      };
      break;
    case "MOVR":
      chain = {
        logo: Moonriver,
        name: "Moonriver",
      };
      break;
    case "CANTO":
      chain = {
        logo: Canto,
        name: "Canto",
      };
      break;
    case "BLAST":
      chain = {
        logo: Blast,
        name: "Blast",
      };
      break;
    case "ROSE":
      chain = {
        logo: Oasis,
        name: "Oasis",
      };
      break;
    case "SHIMMER":
      chain = {
        logo: Shimmer,
        name: "Shimmer",
      };
      break;
    case "U2U":
      chain = {
        logo: U2U,
        name: "U2U",
      };
      break;
    // case "inEVM":
    //   chain = {
    //     logo: inEVM,
    //     name: "inEVM",
    //   };
    //   break;
    // case "APT":
    //   chain = {
    //     logo: Aptos,
    //     name: "Aptos",
    //   };
    //   break;
    // case "MANTA":
    //   chain = {
    //     logo: Manta,
    //     name: "Manta"
    //   };
    //   break;
  }
  return chain;
};

export const linkExplorer = (chain: any, hash: any) => {
  let links = {
    trx: "",
    address: "",
  };
  switch (chain) {
    case "BTC":
      links = {
        trx: `https://www.oklink.com/btc/tx/${hash}`,
        address: `https://www.oklink.com/btc/address/${hash}`,
      };
      break;
    case "SOL":
      links = {
        trx: `https://solscan.io/tx/${hash}`,
        address: `https://solscan.io/address/${hash}`,
      };
      break;
    case "ECLIPSE":
      links = {
        trx: `https://eclipsescan.xyz/tx/${hash}`,
        address: `https://eclipsescan.xyz/account/${hash}`,
      };
      break;
    case "NEAR":
      links = {
        trx: `https://nearblocks.io/txns/${hash}`,
        address: `https://nearblocks.io/address/${hash}`,
      };
      break;
    case "SUI":
      links = {
        trx: `https://suiscan.xyz/mainnet/tx/${hash}`,
        address: `https://suiscan.xyz/mainnet/account/${hash}`,
      };
      break;
    // case "APT":
    //   links = {
    //     trx: `https://aptoscan.com/transaction/${hash}`,
    //     address: `https://aptoscan.com/account/${hash}`,
    //   };
    //   break;
    case "AURA":
      links = {
        trx: `https://aurascan.io/transaction/${hash}`,
        address: `https://aurascan.io/account/${hash}`,
      };
      break;
    case "ALGO":
      links = {
        trx: `https://algoexplorer.io/tx/${hash}`,
        address: `https://algoexplorer.io/address/${hash}`,
      };
      break;
    case "INJ":
      links = {
        trx: `https://explorer.injective.network/transaction/${hash}`,
        address: `https://explorer.injective.network/account/${hash}`,
      };
      break;
    case "ETH":
      links = {
        trx: `https://etherscan.io/tx/${hash}`,
        address: `https://etherscan.io/address/${hash}`,
      };
      break;
    // case "XDAI":
    //   links = {
    //     trx: `https://gnosisscan.io/tx/${hash}`,
    //     address: `https://gnosisscan.io/address/${hash}`,
    //   };
    //   break;
    case "BNB":
      links = {
        trx: `https://bscscan.com/tx/${hash}`,
        address: `https://bscscan.com/address/${hash}`,
      };
      break;
    case "MATIC":
      links = {
        trx: `https://polygonscan.com/tx/${hash}`,
        address: `https://polygonscan.com/address/${hash}`,
      };
      break;
    case "OP":
      links = {
        trx: `https://optimistic.etherscan.io/tx/${hash}`,
        address: `https://optimistic.etherscan.io/address/${hash}`,
      };
      break;
    case "AVAX":
      links = {
        trx: `https://snowtrace.io/tx/${hash}`,
        address: `https://snowtrace.io/address/${hash}`,
      };
      break;
    case "ARB":
      links = {
        trx: `https://arbiscan.io/tx/${hash}`,
        address: `https://arbiscan.io/address/${hash}`,
      };
      break;
    case "BASE":
      links = {
        trx: `https://basescan.org/tx/${hash}`,
        address: `https://basescan.org/address/${hash}`,
      };
      break;
    case "SCROLL":
      links = {
        trx: `https://blockscout.scroll.io/tx/${hash}`,
        address: `https://blockscout.scroll.io/address/${hash}`,
      };
      break;
    case "ZKSYNC":
      links = {
        trx: `https://explorer.zksync.io/tx/${hash}`,
        address: `https://explorer.zksync.io/address/${hash}`,
      };
      break;
    case "LINEA":
      links = {
        trx: `https://lineascan.build/tx/${hash}`,
        address: `https://lineascan.build/address/${hash}`,
      };
      break;
    // case "CRONOS":
    //   links = {
    //     trx: `https://cronoscan.com/tx/${hash}`,
    //     address: `https://cronoscan.com/address/${hash}`,
    //   };
    //   break;
    // case "MANTLE":
    //   links = {
    //     trx: `https://mantlescan.info/tx/${hash}`,
    //     address: `https://mantlescan.info/address/${hash}`,
    //   };
    //   break;
    case "XZO":
      links = {
        trx: `https://evm.exzoscan.io/tx/${hash}`,
        address: `https://evm.exzoscan.io/address/${hash}`,
      };
      break;
    // case "KLAY":
    //   links = {
    //     trx: `https://klaytnscope.com/tx/${hash}`,
    //     address: `https://klaytnscope.com/account/${hash}`,
    //   };
    //   break;
    // case "VIC":
    //   links = {
    //     trx: `https://tomoscan.io/tx/${hash}`,
    //     address: `https://tomoscan.io/address/${hash}`,
    //   };
    //   break;
    // case "ZETA":
    //   links = {
    //     trx: `https://explorer.zetachain.com/evm/tx/${hash}`,
    //     address: `https://explorer.zetachain.com/address/${hash}`,
    //   };
    //   break;
    case "FANTOM":
      links = {
        trx: `https://ftmscan.com/tx/${hash}`,
        address: `https://ftmscan.com/address/${hash}`,
      };
      break;
    case "EVMOS":
      links = {
        trx: `https://escan.live/tx/${hash}`,
        address: `https://escan.live/address/${hash}`,
      };
      break;
    case "ONE":
      links = {
        trx: `https://explorer.harmony.one/tx/${hash}`,
        address: `https://explorer.harmony.one/address/${hash}`,
      };
      break;
    case "GLMR":
      links = {
        trx: `https://moonscan.io/tx/${hash}`,
        address: `https://moonscan.io/address/${hash}`,
      };
      break;
    case "METIS":
      links = {
        trx: `https://andromeda-explorer.metis.io/tx/${hash}`,
        address: `https://andromeda-explorer.metis.io/address/${hash}`,
      };
      break;
    // case "POLYGON_ZKEVM":
    //   links = {
    //     trx: `https://zkevm.polygonscan.com/tx/${hash}`,
    //     address: `https://zkevm.polygonscan.com/address/${hash}`,
    //   };
    //   break;
    case "OPBNB":
      links = {
        trx: `https://opbnbscan.com/tx/${hash}`,
        address: `https://opbnbscan.com/address/${hash}`,
      };
      break;
    // case "AURORA":
    //   links = {
    //     trx: `https://explorer.aurora.dev/tx/${hash}`,
    //     address: `https://explorer.aurora.dev/address/${hash}`,
    //   };
    //   break;
    case "RON":
      links = {
        trx: `https://app.roninchain.com/tx/${hash}`,
        address: `https://app.roninchain.com/address/${hash}`,
      };
      break;
    case "MOVR":
      links = {
        trx: `https://moonriver.moonscan.io/tx/${hash}`,
        address: `https://moonriver.moonscan.io/address/${hash}`,
      };
      break;
    case "CANTO":
      links = {
        trx: `https://cantoscan.com/tx/${hash}`,
        address: `https://cantoscan.com/address/${hash}`,
      };
      break;
    case "ROSE":
      links = {
        trx: `https://explorer.emerald.oasis.dev/tx/${hash}/internal-transactions`,
        address: `https://explorer.emerald.oasis.dev/address/${hash}/transactions`,
      };
      break;
    case "BLAST":
      links = {
        trx: `https://blastscan.io/tx/${hash}`,
        address: `https://blastscan.io/address/${hash}`,
      };
      break;
    case "SHIMMER":
      links = {
        trx: `https://explorer.evm.shimmer.network/tx/${hash}`,
        address: `https://explorer.evm.shimmer.network/address/${hash}`,
      };
      break;
    case "U2U":
      links = {
        trx: `https://u2uscan.xyz/tx/${hash}`,
        address: `https://u2uscan.xyz/address/${hash}?tab=tokens`,
      };
      break;
    // case "inEVM":
    //   links = {
    //     trx: `https://explorer.inevm.com/tx/${hash}`,
    //     address: `https://explorer.inevm.com/address/${hash}`,
    //   };
    //   break;
    case "TON":
      links = {
        trx: `https://tonviewer.com/transaction/${hash}`,
        address: `https://tonviewer.com/${hash}`,
      };
      break;
    // case "MANTA":
    //   links = {
    //     trx: `https://pacific-explorer.manta.network/tx/${hash}`,
    //     address: `https://pacific-explorer.manta.network/address/${hash}`,
    //   };
    //   break;
    default:
      links = {
        trx: "",
        address: "",
      };
  }
  return links;
};
