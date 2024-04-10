import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AverageGameModule = buildModule("AverageGameModule", (m) => {
  const averageGame = m.contract("AverageGame", []);
  const averageGameFactory = m.contract("AverageGameFactory", [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  ]);
  // const gameMaster = "0x331e0f477be71d74228469a3fef83c50b2fd9f36";
  // const name = "Average Game";
  // const maxPlayers = 5;
  // const betAmount = 1;
  // const gameFee = 10;

  // m.call(averageGameFactory, "createAverageGame", [
  //   averageGame,
  //   gameMaster,
  //   name,
  //   maxPlayers,
  //   betAmount,
  //   gameFee,
  // ]);
  // const proxy = m.call(averageGameFactory, "getGameProxyAt", [0]);
  // console.log(proxy);

  return { averageGame, averageGameFactory };
});

export default AverageGameModule;
