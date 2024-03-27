import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AverageGameModule = buildModule("AverageGameModule", (m) => {
  const averageGame = m.contract("AverageGame", []);
  const averageGameFactory = m.contract("AverageGameFactory", []);

  m.call(averageGame, "sayHello", []);
  m.call(averageGameFactory, "createClone", [averageGame]);
  m.call(averageGameFactory, "proxies", [0]);
  const proxy = m.call(averageGameFactory, "getProxyAt", [0]);
  console.log(proxy);

  return { averageGame };
});

export default AverageGameModule;
