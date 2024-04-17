import { ethers, JsonRpcSigner, Eip1193Provider } from "ethers";
import { createContext, useState, ReactNode, useEffect } from "react";

interface Web3ContextType {
  wallet: JsonRpcSigner | undefined;
  address: string | null;
  init: () => Promise<void>;
  disconnect: () => void;
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

function useConnectedWallets() {
  const getWallets = () => {
    const storedWallets = localStorage.getItem("connectedWallets");
    return storedWallets ? storedWallets.split(",") : [];
  };

  // Initialisiere den State mit den im localStorage gespeicherten Wallets
  const [connectedWallets, setConnectedWallets] = useState(getWallets);

  const isWalletConnected = (address: string): boolean => {
    const wallets = getWallets();

    return wallets.includes(address);
  };

  // Füge eine neue Wallet zur Liste hinzu und aktualisiere den localStorage
  const addWallet = (address: string) => {
    if (!isWalletConnected(address)) {
      setConnectedWallets((prevWallets) => {
        const updatedWallets = [...prevWallets, address];
        localStorage.setItem("connectedWallets", updatedWallets.join(","));
        return updatedWallets;
      });
    }
  };

  // Entferne eine Wallet aus der Liste und aktualisiere den localStorage
  const removeWallet = (addressToRemove: string) => {
    setConnectedWallets((prevWallets) => {
      const updatedWallets = prevWallets.filter(
        (address) => address !== addressToRemove
      );
      localStorage.setItem("connectedWallets", updatedWallets.join(","));
      return updatedWallets;
    });
  };

  return { connectedWallets, isWalletConnected, addWallet, removeWallet };
}

export const Web3Context = createContext<Web3ContextType | null>(null);

export default function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState();
  const [walletInstance, setWalletInstance] = useState<
    JsonRpcSigner | undefined
  >();
  const [isMounted, setIsMounted] = useState(false);
  const { isWalletConnected, addWallet, removeWallet } = useConnectedWallets();
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async () => {
        const providerValue = new ethers.BrowserProvider(window.ethereum!);

        const signer = await providerValue.getSigner();
        if (isWalletConnected(signer.address)) {
          setWalletInstance(signer);
          addWallet(signer?.address ?? null);
        } else {
          setWalletInstance(undefined);
        }
      });

      initWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initWallet() {
    let providerValue;
    let signer;
    if (window.ethereum == null) {
      console.log("MetaMask not installed; using read-only defaults");
      providerValue = ethers.getDefaultProvider();
    } else {
      providerValue = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }], // 0xaa36a7 für Sepolia
      });
      signer = await providerValue.getSigner();
      if (isMounted || isWalletConnected(signer.address)) {
        setWalletInstance(signer);
        addWallet(signer?.address ?? null);
      }
      setIsMounted(true);
    }
    setProvider(provider);
  }

  function disconnectWallet() {
    if (walletInstance) {
      removeWallet(walletInstance.address);
      setWalletInstance(undefined);
      localStorage.removeItem("walletAddress");
    }
  }

  return (
    <Web3Context.Provider
      value={{
        wallet: walletInstance,
        address: walletInstance?.address ?? null,
        init: initWallet,
        disconnect: disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}
