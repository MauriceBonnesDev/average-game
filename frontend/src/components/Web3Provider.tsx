import { ethers, JsonRpcSigner, Eip1193Provider } from "ethers";
import { createContext, useContext, useState, ReactNode } from "react";

interface Web3ContextType {
  wallet: JsonRpcSigner | undefined;
  address: string | null;
  init: () => Promise<void>;
}

interface EthereumEventEmitter {
  on(
    address: string,
    handleAccountsChanged: (accounts: string[]) => void
  ): void;
  removeListener(
    address: string,
    handleAccountsChanged: (accounts: unknown) => Promise<void>
  ): unknown;
}

declare global {
  interface Window {
    ethereum?: EthereumEventEmitter & Eip1193Provider;
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
      window.ethereum.on("accountsChanged", async () => {
        providerValue = new ethers.BrowserProvider(window.ethereum!);

        signer = await providerValue.getSigner();

        setWalletInstance(signer);
        setCurrentAddress(signer?.address ?? null);
      });
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

export const useWeb3Context = () => {
  const context = useContext(Web3Context);

  if (!context) {
    throw new Error("useWeb3Context must be used within a Web3Provider");
  }
  return context;
};
