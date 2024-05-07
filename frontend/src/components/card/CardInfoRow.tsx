import classes from "./CardInfoRow.module.scss";
import ethLogo from "../../assets/eth.svg";
type CardInfoRowProps = {
  amount: number;
  title: string;
};

const CardInfoRow = ({ amount, title }: CardInfoRowProps) => {
  return (
    <div className={classes.cardInfoRow}>
      <img src={ethLogo} />
      <p className={classes.cardInfoPrice}>{amount.toFixed(3)}</p>
      <p className={classes.cardInfoName}>{title}</p>
    </div>
  );
};

export default CardInfoRow;
