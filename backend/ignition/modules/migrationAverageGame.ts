import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AverageGameModule = buildModule("AverageGameModule", (m) => {
  const averageGame = m.contract("AverageGame", []);

  return { averageGame };
});

export default AverageGameModule;
