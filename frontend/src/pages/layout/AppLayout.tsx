import classes from "./AppLayout.module.scss";
import { Outlet } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";

const AppLayout = () => {
  return (
    <>
      <Navbar />
      <main className={classes.mainContainer}>
        <Outlet />
      </main>
    </>
  );
};

export default AppLayout;
