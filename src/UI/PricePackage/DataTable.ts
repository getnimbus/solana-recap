import RealtimeVideo from "~/assets/pricing/Realtime.mp4";
import CustomAllocation from "~/assets/pricing/Custom-Allocation.mp4";
import Risk from "~/assets/pricing/Risk.mp4";
import CorrelationsMatrix from "~/assets/pricing/Correlation-Matrix.mp4";
import YieldFarming from "~/assets/pricing/Yield-Farming.mp4";
import Rebalance from "~/assets/pricing/Rebalance.mp4";

type ContentState = {
  state: "available" | "unavailable" | "notify";
  description: string;
};

type DetailContent = {
  nimbus: ContentState;
  excel: ContentState;
  coinstats: ContentState;
  debank: ContentState;
  nansen: ContentState;
};

interface CompareFeature {
  title?: string;
  content: DetailContent | "";
}

interface ComparePricing {
  title?: string;
  featureStatus: "main" | "part";
  tippy: {
    used: boolean;
    title: string;
    content: string;
  };
  content:
    | {
        free: ContentState;
        explorer: ContentState;
        alpha: ContentState;
      }
    | "";
}

export const priceTable: ComparePricing[] = [
  {
    title: "Monitoring",
    featureStatus: "main",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: "",
  },
  {
    title: "Realtime",
    featureStatus: "part",
    tippy: {
      used: true,
      title: "Get latest market information and real-time market update",
      content: RealtimeVideo,
    },
    content: {
      free: {
        state: "available",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "No of wallets",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "notify",
        description: "3 Wallets",
      },
      explorer: {
        state: "notify",
        description: "7 Wallets",
      },
      alpha: {
        state: "available",
        description: "Unlimited Wallets",
      },
    },
  },
  {
    title: "Total net worth",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "notify",
        description: "$20,000 total networth",
      },
      explorer: {
        state: "notify",
        description: "$100,000 total networth",
      },
      alpha: {
        state: "available",
        description: "Unlimited total networth",
      },
    },
  },
  {
    title: "Portfolio alert",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "available",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Portfolio summary",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "available",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Token analysis",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "available",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Aggregate data multiple accounts",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "available",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Analysis",
    featureStatus: "main",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "available",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Position detail",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "available",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Custom token category",
    featureStatus: "part",
    tippy: {
      used: true,
      title:
        "Custom your token category to diversify your portfolio on your own way",
      content: CustomAllocation,
    },
    content: {
      free: {
        state: "unavailable",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Risk healthy tag",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "unavailable",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "PnL analysis",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "unavailable",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Risk metrics",
    featureStatus: "part",
    tippy: {
      used: true,
      title: "Know what is your portfolio risk, in every single token you hold",
      content: Risk,
    },
    content: {
      free: {
        state: "unavailable",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Correlation matrix",
    featureStatus: "part",
    tippy: {
      used: true,
      title: "",
      content: CorrelationsMatrix,
    },
    content: {
      free: {
        state: "unavailable",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Sharpe ratio",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "unavailable",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Money flow",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "unavailable",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Activities analysis",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "unavailable",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Optimize earning",
    featureStatus: "main",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "available",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Yield farming suggestion",
    featureStatus: "part",
    tippy: {
      used: true,
      title:
        "Get up to 1000+ yield farming opportunities to boost your earning",
      content: YieldFarming,
    },
    content: {
      free: {
        state: "available",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "AI token allocation",
    featureStatus: "part",
    tippy: {
      used: true,
      title:
        "We suggest you how to optimize your portfolio to minimize the risk while maximizing the return",
      content: Rebalance,
    },
    content: {
      free: {
        state: "notify",
        description: "(Soon)",
      },
      explorer: {
        state: "notify",
        description: "(Soon)",
      },
      alpha: {
        state: "notify",
        description: "(Soon)",
      },
    },
  },
  {
    title: "Whale compare",
    featureStatus: "part",
    tippy: {
      used: false,
      title: "",
      content: ``,
    },
    content: {
      free: {
        state: "unavailable",
        description: "",
      },
      explorer: {
        state: "available",
        description: "",
      },
      alpha: {
        state: "available",
        description: "",
      },
    },
  },
];

export const compareTable: CompareFeature[] = [
  {
    title: "On-chain tracking",
    content: {
      nimbus: {
        state: "available",
        description: "",
      },
      excel: {
        state: "unavailable",
        description: "Manual",
      },
      coinstats: {
        state: "available",
        description: "",
      },
      debank: {
        state: "available",
        description: "",
      },
      nansen: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "DEFI position",
    content: {
      nimbus: {
        state: "notify",
        description: "Not fully support",
      },
      excel: {
        state: "unavailable",
        description: "Manual",
      },
      coinstats: {
        state: "notify",
        description: "Not fully support",
      },
      debank: {
        state: "available",
        description: "",
      },
      nansen: {
        state: "notify",
        description: "Not fully support",
      },
    },
  },
  {
    title: "Notification",
    content: {
      nimbus: {
        state: "available",
        description: "",
      },
      excel: {
        state: "unavailable",
        description: "",
      },
      coinstats: {
        state: "available",
        description: "",
      },
      debank: {
        state: "unavailable",
        description: "",
      },
      nansen: {
        state: "unavailable",
        description: "",
      },
    },
  },
  {
    title: "Market Data",
    content: {
      nimbus: {
        state: "unavailable",
        description: "",
      },
      excel: {
        state: "unavailable",
        description: "",
      },
      coinstats: {
        state: "unavailable",
        description: "",
      },
      debank: {
        state: "unavailable",
        description: "",
      },
      nansen: {
        state: "available",
        description: "",
      },
    },
  },
  {
    title: "Risks metrics",
    content: {
      nimbus: {
        state: "available",
        description: "",
      },
      excel: {
        state: "unavailable",
        description: "",
      },
      coinstats: {
        state: "unavailable",
        description: "",
      },
      debank: {
        state: "unavailable",
        description: "",
      },
      nansen: {
        state: "unavailable",
        description: "",
      },
    },
  },
  {
    title: "Investment metrics(Risks, return, Sharpe ratio, ...)",
    content: {
      nimbus: {
        state: "available",
        description: "",
      },
      excel: {
        state: "unavailable",
        description: "",
      },
      coinstats: {
        state: "unavailable",
        description: "",
      },
      debank: {
        state: "unavailable",
        description: "",
      },
      nansen: {
        state: "unavailable",
        description: "",
      },
    },
  },
  {
    title: "Optimize earning",
    content: {
      nimbus: {
        state: "available",
        description: "",
      },
      excel: {
        state: "unavailable",
        description: "",
      },
      coinstats: {
        state: "unavailable",
        description: "",
      },
      debank: {
        state: "unavailable",
        description: "",
      },
      nansen: {
        state: "unavailable",
        description: "",
      },
    },
  },
  {
    title: "Aggregate data multiple accounts",
    content: {
      nimbus: {
        state: "available",
        description: "",
      },
      excel: {
        state: "unavailable",
        description: "Manual",
      },
      coinstats: {
        state: "available",
        description: "",
      },
      debank: {
        state: "available",
        description: "",
      },
      nansen: {
        state: "unavailable",
        description: "",
      },
    },
  },
];
