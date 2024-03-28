import { expect } from "chai";
import { ethers } from "hardhat";
import { AverageGame, AverageGameFactory } from "../typechain-types";
import { BytesLike, Signer, solidityPackedKeccak256, parseEther } from "ethers";

describe("AverageGame & AverageGameFactory", function () {
  let deployer: Signer,
    gameMaster: Signer,
    player1: Signer,
    player2: Signer,
    player3: Signer,
    player4: Signer;
  let averageGame: AverageGame;
  let averageGameFactory: AverageGameFactory;
  let proxy: AverageGame;
  let averageGameAddress: string;
  let averageGameConnectedAsGameMaster: AverageGameFactory;
  const contractName = "AverageGame";
  const name = "Average Game";
  const maxPlayers = 5;
  const betAmount = 1;
  const gameFee = 10;
  const gameId = 1;
  const onlyGameMasterError = "Only game master can call this function";

  async function createAverageGame() {
    await averageGameFactory.createAverageGame(
      averageGameAddress,
      gameMaster.getAddress(),
      name,
      maxPlayers,
      betAmount,
      gameFee
    );
  }

  beforeEach(async () => {
    const dest = await ethers.getSigners();
    [deployer, gameMaster, player1, player2, player3, player4] =
      await ethers.getSigners();

    averageGame = await ethers.deployContract(contractName);

    averageGameFactory = await ethers.deployContract("AverageGameFactory", [
      deployer.getAddress(),
    ]);

    averageGameAddress = await averageGame.getAddress();
    await createAverageGame();

    averageGameConnectedAsGameMaster = averageGameFactory.connect(gameMaster);

    const proxyAddress = await averageGameConnectedAsGameMaster.getGameProxyAt(
      gameId
    );

    proxy = (await ethers.getContractAt(
      contractName,
      proxyAddress
    )) as AverageGame;
  });

  describe("Deployment", () => {
    it("Proxy address should be equal to the first element in the gameProxies of the averageGameFactory", async () => {
      const contractAddress = await proxy.getAddress();
      const proxyAddress =
        await averageGameConnectedAsGameMaster.getGameProxyAt(gameId);
      expect(contractAddress).to.be.equal(proxyAddress);
    });

    it("Calling getGameProxyAt not being the gameMaster should revert with error", async () => {
      await expect(averageGameFactory.getGameProxyAt(1)).to.be.revertedWith(
        "Only game master can call this function"
      );
    });

    it("GameMaster should be set", async () => {
      const gameMasterAddress = await averageGameFactory.getGameMasterAt(
        gameId
      );
      expect(gameMasterAddress).to.be.equal(await gameMaster.getAddress());
    });

    it("Should revert if caller of CreateAverageGame is not the owner", async () => {
      await expect(
        averageGameConnectedAsGameMaster.createAverageGame(
          averageGameAddress,
          gameMaster.getAddress(),
          name,
          maxPlayers,
          betAmount,
          gameFee
        )
      ).to.be.reverted;
    });

    it("Should increase totalGames by 1 on each call to createAverageGame", async () => {
      await createAverageGame();
      expect(await averageGameFactory.totalGames()).to.be.equal(2);
    });
  });

  describe("AverageGame Contract", () => {
    let gmProxy: AverageGame;
    const guess = 20;
    const salt = "abc";
    const bet = parseEther(betAmount.toString());
    const entryValue =
      bet + bet * BigInt(3) + (bet * BigInt(gameFee)) / BigInt(100);
    console.log(entryValue);
    function getHash(_guess: number, _salt: string) {
      return solidityPackedKeccak256(["uint256", "string"], [_guess, _salt]);
    }

    beforeEach(async () => {
      gmProxy = proxy.connect(gameMaster);
    });

    it("Name should be set", async () => {
      expect(await proxy.name()).to.be.equal(name);
    });

    it("Reinitializing the game should revert", async () => {
      await expect(
        proxy.initGame(
          gameId,
          name,
          maxPlayers,
          betAmount,
          gameMaster.getAddress(),
          gameFee,
          await averageGameFactory.getAddress()
        )
      ).to.be.revertedWith("Game is already initialized");
    });

    it("Factory address should be equal to the address of the calling contract", async () => {
      expect(await proxy.factory()).to.be.equal(
        await averageGameFactory.getAddress()
      );
    });

    it("StartBettingRound should set the gameState to 1", async () => {
      await gmProxy.startBettingRound();
      // await expect(proxy.startBettingRound()).to.be.revertedWith(
      //   onlyGameMasterError
      // );
      expect(await proxy.state()).to.be.equal(1);
    });

    it("Calling startBettingRound twice should revert", async () => {
      await gmProxy.startBettingRound();
      await expect(gmProxy.startBettingRound()).to.be.revertedWith(
        "Game has already started"
      );
    });

    it("Calling startBettingRound should revert if not called by game master", async () => {
      await expect(proxy.startBettingRound()).to.be.revertedWith(
        onlyGameMasterError
      );
    });

    it("joinGame should revert if the game has not started", async () => {
      const commit: BytesLike = getHash(guess, salt);
      proxy.connect(player1);
      await expect(
        proxy.joinGame(commit, { value: entryValue })
      ).to.be.revertedWith("Game has not started yet");
    });

    it("joinGame should revert if value is insufficient", async () => {
      await gmProxy.startBettingRound();
      const commit: BytesLike = getHash(guess, salt);
      proxy.connect(player1);
      await expect(
        proxy.joinGame(commit, { value: entryValue - BigInt(1) })
      ).to.be.revertedWith(
        "Insufficient amount, must be the bet amount + 3 times the bet amount as collateral including the game fee"
      );
    });

    it("joinGame should revert if the player already joined", async () => {
      await gmProxy.startBettingRound();
      const commit: BytesLike = getHash(guess, salt);
      proxy.connect(player1);
      await proxy.joinGame(commit, { value: entryValue });
      await expect(
        proxy.joinGame(commit, { value: entryValue })
      ).to.be.revertedWith("Player has already joined the game");
    });
  });
});
