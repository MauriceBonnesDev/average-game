import classes from "./Navbar.module.scss";
import Button from "../button/Button";
import { NavLink } from "react-router-dom";
import { useWeb3Context } from "../../hooks/useWeb3Context";

const Navbar = () => {
  const { address, init, disconnect } = useWeb3Context();
  console.log(address);
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
      <Button
        onClick={address ? disconnect : init}
        size="large"
        style="light"
        color="purple"
      >
        {address ? formatAddress(address) : "Connect"}
      </Button>
    </div>
  );
};

export default Navbar;
