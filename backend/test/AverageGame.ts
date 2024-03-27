import { expect } from "chai";
import { ethers } from "hardhat";
import { AverageGame, AverageGameFactory } from "../typechain-types";

describe("AverageGame", function () {
  let deployer, player1, player2, player3;
  let averageGame: AverageGame;
  let averageGameFactory: AverageGameFactory;
  let proxy: AverageGame;

  beforeEach(async () => {
    [deployer, player1, player2, player3] = await ethers.getSigners();

    averageGame = await ethers.deployContract("AverageGame");
    averageGameFactory = await ethers.deployContract("AverageGameFactory");

    const address: string = await averageGame.getAddress();
    await averageGameFactory.createAverageGame(address);

    const proxyAddress = await averageGameFactory.getAverageGameProxyAt(0);

    proxy = (await ethers.getContractAt(
      "AverageGame",
      proxyAddress
    )) as AverageGame;
  });

  describe("Deployment", () => {
    it("Hello World should be the output", async () => {
      const sayHello = await proxy.sayHello();
      expect(sayHello).to.be.equal("Hello World");
    });
  });
});
