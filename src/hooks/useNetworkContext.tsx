import { useContext } from "react";
import { NetworkContext } from "../components/NetworkProvider";

export const useNetworkContext = () => {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error("useNetworkContext must be used within a NetworkProvider");
  }
  return context;
};
