import { createContext, ReactNode, useState } from "react";

interface NetworkContextType {
  network: string;
  toggleNetwork: (network: string) => void;
}

export const NetworkContext = createContext<NetworkContextType | null>(null);

export default function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState("hardhat");

  const toggleNetwork = (network: string) => {
    setNetwork((prev) => (network !== prev ? network : prev));
  };

  return (
    <NetworkContext.Provider value={{ network, toggleNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}
