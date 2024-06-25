import { createContext, ReactNode, useState } from "react";

interface NetworkContextType {
  network: string;
  toggleNetwork: (network: string) => void;
}

export const NetworkContext = createContext<NetworkContextType | null>(null);

export default function NetworkProvider({ children }: { children: ReactNode }) {
  const getNetworkFromLocalStorage = (): string => {
    const selectedNetwork = localStorage.getItem("network");

    return selectedNetwork ?? "hardhat";
  };

  const setNetworkToLocalStorage = (network: string) => {
    localStorage.setItem("network", network);
  };

  const [network, setNetwork] = useState(getNetworkFromLocalStorage);

  const toggleNetwork = (network: string) => {
    setNetwork((prev) => {
      if (network !== prev) {
        setNetworkToLocalStorage(network);
        return network;
      }

      setNetworkToLocalStorage(prev);
      return prev;
    });
  };

  return (
    <NetworkContext.Provider value={{ network, toggleNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}
