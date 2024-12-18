import Onboard from "@web3-onboard/core";
import safeModule from '@web3-onboard/gnosis';
import injectedModule from "@web3-onboard/injected-wallets";
import ledgerModule from "@web3-onboard/ledger";
import coinbaseModule from "@web3-onboard/coinbase";
import bitgetWalletModule from "@web3-onboard/bitget";

const safe = safeModule({
  whitelistedDomains: [/([a-zA-Z0-9-]+\.)blockscout\.com/]
});
const injected = injectedModule();
const coinbaseWallet = coinbaseModule();
const ledger = ledgerModule({ requiredChains: [1], walletConnectVersion: 2, projectId: "Nimbus" });
const bitget = bitgetWalletModule();

const wallets = [injected, coinbaseWallet, ledger, bitget, safe];

const chains = [
  {
    id: 1,
    token: "ETH",
    label: "Ethereum Mainnet",
    rpcUrl: "https://rpc.ankr.com/eth",
  },
];

const onboard = Onboard({
  wallets,
  chains,
  appMetadata: {
    name: "Nimbus",
    description: "A personalized portfolio for Web3 investors",
  },
  accountCenter: {
    desktop: {
      enabled: false,
      position: "bottomLeft",
    },
    mobile: {
      enabled: false,
      position: "bottomLeft",
    },
  },
});

export default onboard;
