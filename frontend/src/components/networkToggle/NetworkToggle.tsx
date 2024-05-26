import classes from "./NetworkToggle.module.scss";
import { useNetworkContext } from "../../hooks/useNetworkContext";

const NetworkToggle = () => {
  const { network, toggleNetwork } = useNetworkContext();

  return (
    <div className={classes.toggleContainer}>
      <span
        onClick={() => toggleNetwork("hardhat")}
        id={classes.hardhat}
        className={`${classes.networkName} ${
          network === "hardhat" ? classes.active : ""
        }`}
      >
        Hardhat
      </span>
      <span
        onClick={() => toggleNetwork("sepolia")}
        id={classes.sepolia}
        className={`${classes.networkName} ${
          network === "sepolia" ? classes.active : ""
        }`}
      >
        Sepolia
      </span>
    </div>
  );
};

export default NetworkToggle;
