import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AverageGameFactoryModule = buildModule(
  "AverageGameFactoryModule",
  (m) => {
    const averageGameFactory = m.contract("AverageGameFactory", []);

    return { averageGameFactory };
  }
);

export default AverageGameFactoryModule;
