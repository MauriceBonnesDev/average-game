import classes from "./HomePage.module.scss";
import timeline from "../../assets/timeline.png";
import Button from "../../components/button/Button";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className={classes.container}>
      <section className={classes.sectionHeading}>
        <h1>Average Game</h1>
        <h3>Trete unseren Spielen bei oder werde selber Spielleiter!</h3>
        <Button
          style="dark"
          color="green"
          size="large"
          onClick={() => navigate("/games")}
        >
          Get started
        </Button>
      </section>

      <section className={`${classes.section} ${classes.sectionHowToPlay}`}>
        <div className={classes.timelineContainer}>
          <img src={timeline} className={classes.timeline} />
          <ul>
            <li>
              <h5>Step 1</h5>
              <h3>Verbinde deine Wallet.</h3>
              <p>
                Nutze Metamask um deine Wallet mit der Webseite zu verbinden und
                Transaktionen zu ermöglichen.
              </p>
            </li>
            <li>
              <h5>Step 2</h5>
              <h3>Gehe zum Games-Tab</h3>
              <p>
                Navigiere über den Games-Tab in der Navigationsleiste auf die
                Übersicht aller laufenden Spiele.
              </p>
            </li>
            <li>
              <h5>Step 3</h5>
              <h3>Wähle ein Spiel aus der Liste</h3>
              <p>
                Suche dir ein Spiel aus. Achte darauf, dass der Einsatz deiner
                Risikobereitschaft entspricht und tritt bei.
              </p>
            </li>
            <li>
              <h5>Step 4</h5>
              <h3>Gib deinen Tipp ab</h3>
              <p>
                Überlege dir eine Zahl zwischen 0 und 1000, welche 2/3 des
                Durchschnitts aller Zahlen entspricht.
              </p>
            </li>
            <li>
              <h5>Step 5</h5>
              <h3>Wähle ein Geheimwort</h3>
              <p>
                Überlege dir eine Passphrase. Du benötigst sie in der nächsten
                Phase des Spiels erneut. Merke Sie dir!
              </p>
            </li>
            <li>
              <h5>Step 6</h5>
              <h3>Committe deine Eingaben</h3>
              <p>
                Klicke auf Join und bestätige deine Transaktion in Metamask. Du
                nimmst nun an dem Spiel teil.
              </p>
            </li>
            <li>
              <h5>Step 7</h5>
              <h3>Warte auf die nächste Phase</h3>
              <p>
                Das Spiel wird nach einer gewissen Zeit in die nächste Phase zum
                Veröffentlichen der Werte gelangen.
              </p>
            </li>
            <li>
              <h5>Step 8</h5>
              <h3>Tipp erneut eingeben</h3>
              <p>
                Gib exakt den gleichen Wert ein, den du bereits in Step 3
                abgegeben hast. Überprüfe die Eingabe!
              </p>
            </li>
            <li>
              <h5>Step 9</h5>
              <h3>Geheimwort erneut eingeben</h3>
              <p>
                Gib ebenfalls die exakt gleiche Passphrase ein, die du zuvor in
                Step 5 gewählt hast. Überprüfe die Eingabe!
              </p>
            </li>
            <li>
              <h5>Step 10</h5>
              <h3>Prüfe deine Eingaben</h3>
              <p>
                Prüfe sorgfältig die Eingabe der Werte. Bei falscher Eingabe
                verlieren sie automatisch Einsatz und Kaution.
              </p>
            </li>
            <li>
              <h5>Step 11</h5>
              <h3>Offenbare deine Eingaben</h3>
              <p>
                Klicke auf Reveal um deine Werte zu veröffentlichen. Bestätige
                deine Transaktion in Metamask.
              </p>
            </li>
            <li>
              <h5>Step 12</h5>
              <h3>Warte auf das Spielende</h3>
              <p>
                Schaue nach Spielende ob dein Tipp am nächsten am
                2/3-Durchschnitt liegt und GEWINNE!
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className={`${classes.section} ${classes.sectionExplanation}`}>
        Zum Schutz und zur Spielintegrität setzen wir auf ein
        Commit-Reveal-Schema, bei dem Sie in zwei Schritten handeln. Ihr
        initialer Commit verwandelt Ihre Zahl und ihr Geheimnis mithilfe einer
        Hashfunktion in einen unkenntlichen Wert, sodass Ihre Zahl geheim
        bleibt. Nach der Commit-Phase müssen Sie ihre Zahl und das Geheimnis
        erneut veröffentlichen. Ergibt die Prüfung, dass sie beide male die
        selben Werte veröffentlicht haben, fließt Ihr Einsatz in die Auswertung
        ein, wenn nicht, verfällt Ihr Einsatz samt Hinterlegung.
      </section>

      <section className={`${classes.section} ${classes.sectionRules}`}>
        <div>
          <h3>Regeln</h3>
          <ol>
            <li>
              Offenlegen falscher Werte für zu Verlust von Einsatz und Kaution.
            </li>
            <li>Die Kaution beträgt das Dreifache des Einsatzes.</li>
            <li>
              Bei Nichtoffenlegung verfällt sowohl Einsatz als auch Kaution.
            </li>
            <li>Bei Gleichstand entscheidet der Zufall.</li>
            <li>Erlaubt sind Zahlen von 0 bis 1000.</li>
            <li>Pro Spiel ist nur eine Teilnahme je Wallet möglich.</li>
          </ol>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
