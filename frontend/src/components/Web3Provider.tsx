import { ethers, JsonRpcSigner, Eip1193Provider } from "ethers";
import { createContext, useContext, useState, ReactNode } from "react";

interface Web3ContextType {
  wallet: JsonRpcSigner | undefined;
  address: string | null;
  init: () => Promise<void>;
}

// interface Ethereum {
//   on(
//     arg0: string,
//     handleAccountsChanged: (accounts: unknown) => Promise<void>
//   ): unknown;
//   removeListener(
//     arg0: string,
//     handleAccountsChanged: (accounts: unknown) => Promise<void>
//   ): unknown;
//   request: (request: { method: string }) => Promise<string[]>;
// }

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export const Web3Context = createContext<Web3ContextType | null>(null);

export default function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState();
  const [walletInstance, setWalletInstance] = useState<
    JsonRpcSigner | undefined
  >();
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  async function initWallet() {
    let providerValue;
    let signer;
    if (window.ethereum == null) {
      console.log("MetaMask not installed; using read-only defaults");
      providerValue = ethers.getDefaultProvider();
    } else {
      providerValue = new ethers.BrowserProvider(window.ethereum);
      signer = await providerValue.getSigner();
      setWalletInstance(signer);
      setCurrentAddress(signer?.address ?? null);
    }
    setProvider(provider);
  }

  return (
    <Web3Context.Provider
      value={{
        wallet: walletInstance,
        address: currentAddress,
        init: initWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
