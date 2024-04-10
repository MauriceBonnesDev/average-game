import classes from "./Navbar.module.scss";
import Button from "../button/Button";
import { useWeb3Context } from "../Web3Provider";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  const { address, wallet, init } = useWeb3Context()!;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className={classes.navbar}>
      <nav>
        <ul className={classes.nav}>
          <li>
            <NavLink
              className={({ isActive }) =>
                isActive ? classes.active : undefined
              }
              to="/"
            >
              HOME
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                isActive ? classes.active : undefined
              }
              to="/games"
            >
              GAMES
            </NavLink>
          </li>
        </ul>
      </nav>
      <Button onClick={init} size="large">
        {wallet && address ? formatAddress(address) : "Connect"}
      </Button>
    </div>
  );
};

export default Navbar;
