import { useContext } from "react";
import { Web3Context } from "../components/Web3Provider";

export const useWeb3Context = () => {
  const context = useContext(Web3Context);

  if (!context) {
    throw new Error("useWeb3Context must be used within a Web3Provider");
  }
  return context;
};
