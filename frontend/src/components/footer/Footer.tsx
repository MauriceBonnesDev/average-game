import classes from "./Footer.module.scss";
import hsmwLogo from "../../assets/hsmw.png";
import bccmLogo from "../../assets/bccmLogo.png";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className={classes.footerContent}>
        <section>
          <h2>Follow me</h2>
          <div className={classes.followMe}>
            <a
              href="https://x.com/vitalikbuterin?s=21&t=op7yapCQxow0eHM4CKCpDw"
              target="_blank"
              id={classes.twitter}
            >
              <i className="fa-brands fa-x-twitter"></i>
            </a>
            <a
              href="https://www.linkedin.com/in/maurice-bonnes/"
              target="_blank"
              id={classes.linkedin}
            >
              <i className="fa-brands fa-linkedin"></i>
            </a>
            <a
              href="https://www.instagram.com/vitalik.eth.official?igsh=YTF3c2l0MDl5ZjRr"
              target="_blank"
              id={classes.instagram}
            >
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a
              href="https://github.com/MauriceBonnesDev"
              target="_blank"
              id={classes.github}
            >
              <i className="fa-brands fa-github"></i>
            </a>
          </div>
        </section>
        <section>
          <h2>Contact Me</h2>
          Bei Fragen schreiben Sie mir gerne eine Mail unter{" "}
          <a href="mailto:mbonnes@hs-mittweida.de">mbonnes@hs-mittweida.de</a>
        </section>
        <section>
          <h2>Disclaimer</h2>
          <p>
            Dieses Projekt wurde im Zuge des Blockchain 3 Belegs von Maurice
            Bonnes erstellt.
          </p>
        </section>
      </div>
      <div className={classes.partnerships}>
        <a href="https://www.hs-mittweida.de/" target="_blank">
          <img
            src={hsmwLogo}
            alt="Hochschule Mittweida"
            id={classes.hsmwLogo}
          />
        </a>
        <a href="https://blockchain.hs-mittweida.de/" target="_blank">
          <img
            src={bccmLogo}
            alt="Blockchain Competence Center Mittweida"
            id={classes.bccmLogo}
          />
        </a>
      </div>
      <div className={classes.copyright}>
        <p>&copy; {year} AverageGame</p>
      </div>
    </footer>
  );
};

export default Footer;
