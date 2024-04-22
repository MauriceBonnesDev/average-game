import Navbar from "../../components/navbar/Navbar";
import page404 from "../../assets/page404.png";
import classes from "./ErrorPage.module.scss";
import Button from "../../components/button/Button";
import { useNavigate } from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className={classes.container}>
        <img src={page404} />
        <p>Sieht aus als hättest du dich verirrt.</p>
        <Button style="light" size="large" onClick={() => navigate("/")}>
          Zurück zur Startseite
        </Button>
      </div>
    </>
  );
};

export default ErrorPage;
