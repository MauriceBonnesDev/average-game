import classes from "./AppLayout.module.scss";
import { Outlet } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import { ToastBar, Toaster } from "react-hot-toast";

const AppLayout = () => {
  return (
    <>
      <Navbar />
      <Toaster
        containerClassName={classes.toast}
        position="top-center"
        gutter={3}
      >
        {(t) => (
          <ToastBar
            toast={t}
            style={{
              ...t.style,
              minWidth: "500px",
              animation: t.visible
                ? "custom-enter 0s ease"
                : "custom-exit 0s ease",
            }}
          />
        )}
      </Toaster>
      <main className={classes.mainContainer}>
        <Outlet />
      </main>
    </>
  );
};

export default AppLayout;
