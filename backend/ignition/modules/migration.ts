import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "ethers";
const AverageGameModule = buildModule("AverageGameModule", (m) => {
  const averageGame = m.contract("AverageGame", []);
  const averageGameFactory = m.contract("AverageGameFactory", []);
  let name = "Average Game";
  let maxPlayers = 5;
  let amount = 1;
  let betAmount = parseEther(amount.toString());
  let gameFee = BigInt((10 / 100) * 1e18 * amount);
  let id = "createAverageGame1";

  m.call(
    averageGameFactory,
    "createAverageGame",
    [averageGame, name, maxPlayers, betAmount, gameFee],
    { id }
  );

  name = "Standard Game";
  maxPlayers = 100;
  amount = 1.1;
  betAmount = parseEther(amount.toString());
  gameFee = BigInt((10 / 100) * 1e18 * amount);
  id = "createAverageGame2";

  m.call(
    averageGameFactory,
    "createAverageGame",
    [averageGame, name, maxPlayers, betAmount, gameFee],
    { id }
  );

  name = "Party Game";
  maxPlayers = 200;
  amount = 1.5;
  betAmount = parseEther(amount.toString());
  gameFee = BigInt((10 / 100) * 1e18 * amount);
  id = "createAverageGame3";

  m.call(
    averageGameFactory,
    "createAverageGame",
    [averageGame, name, maxPlayers, betAmount, gameFee],
    { id }
  );

  name = "Beginners Game";
  maxPlayers = 10;
  amount = 0.25;
  betAmount = parseEther(amount.toString());
  gameFee = BigInt((10 / 100) * 1e18 * amount);
  id = "createAverageGame4";

  m.call(
    averageGameFactory,
    "createAverageGame",
    [averageGame, name, maxPlayers, betAmount, gameFee],
    { id }
  );

  name = "Fun Game";
  maxPlayers = 1000;
  amount = 0.01;
  betAmount = parseEther(amount.toString());
  gameFee = BigInt((10 / 100) * 1e18 * amount);
  id = "createAverageGame5";

  m.call(
    averageGameFactory,
    "createAverageGame",
    [averageGame, name, maxPlayers, betAmount, gameFee],
    { id }
  );

  name = "Let's do this";
  maxPlayers = 55;
  amount = 2.25;
  betAmount = parseEther(amount.toString());
  gameFee = BigInt((10 / 100) * 1e18 * amount);
  id = "createAverageGame6";

  m.call(
    averageGameFactory,
    "createAverageGame",
    [averageGame, name, maxPlayers, betAmount, gameFee],
    { id }
  );

  name = "Betting Finals";
  maxPlayers = 15;
  amount = 1.75;
  betAmount = parseEther(amount.toString());
  gameFee = BigInt((10 / 100) * 1e18 * amount);
  id = "createAverageGame7";

  m.call(
    averageGameFactory,
    "createAverageGame",
    [averageGame, name, maxPlayers, betAmount, gameFee],
    { id }
  );

  return { averageGame, averageGameFactory };
});

export default AverageGameModule;
