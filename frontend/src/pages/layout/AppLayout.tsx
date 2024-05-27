import classes from "./AppLayout.module.scss";
import { Outlet } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import { ToastBar, Toaster } from "react-hot-toast";
import Footer from "../../components/footer/Footer";

const AppLayout = () => {
  return (
    <div className={classes.container}>
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
              minWidth: "31.25rem",
              animation: t.visible
                ? "custom-enter 0s ease"
                : "custom-exit 0s ease",
            }}
          />
        )}
      </Toaster>
      <div className={classes.content}>
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;
