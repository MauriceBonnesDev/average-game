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
    player4: Signer,
    player5: Signer;
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
    [deployer, gameMaster, player1, player2, player3, player4, player5] =
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
    const betAmountEth = parseEther(betAmount.toString());
    const collateralAmountEth = betAmountEth * BigInt(3);
    const gameFeeAmountEth = (betAmountEth * BigInt(gameFee)) / BigInt(100);
    const commit: BytesLike = getHash(guess, salt);
    const entryValue = betAmountEth + collateralAmountEth + gameFeeAmountEth;

    function getHash(_guess: number, _salt: string) {
      return solidityPackedKeccak256(["uint256", "string"], [_guess, _salt]);
    }

    async function startValidGame() {
      await gmProxy.startBettingRound();

      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await proxyAsPlayer2.joinGame(commit, { value: entryValue });
      const proxyAsPlayer3 = proxy.connect(player3);
      await proxyAsPlayer3.joinGame(commit, { value: entryValue });

      await gmProxy.closeBettingRound();

      return { proxyAsPlayer1, proxyAsPlayer2, proxyAsPlayer3 };
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
          0,
          1000,
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

    it("StartBettingRound should set the gameState to Commit Phase (1)", async () => {
      await gmProxy.startBettingRound();
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
      const proxyAsPlayer1 = proxy.connect(player1);
      await expect(
        proxyAsPlayer1.joinGame(commit, { value: entryValue })
      ).to.be.revertedWith("Game has not started yet");
    });

    it("joinGame should revert if value is insufficient", async () => {
      await gmProxy.startBettingRound();
      const proxyAsPlayer1 = proxy.connect(player1);
      await expect(
        proxyAsPlayer1.joinGame(commit, { value: entryValue - BigInt(1) })
      ).to.be.revertedWith(
        "Insufficient amount, must be the bet amount + 3 times the bet amount as collateral including the game fee"
      );
    });

    it("joinGame should revert if the player already joined", async () => {
      await gmProxy.startBettingRound();
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      await expect(
        proxyAsPlayer1.joinGame(commit, { value: entryValue })
      ).to.be.revertedWith("Player has already joined the game");
    });

    it("joinGame should increase the totalBetAmount by betAmount", async () => {
      await gmProxy.startBettingRound();
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await proxyAsPlayer2.joinGame(getHash(1, "test"), { value: entryValue });

      expect(await proxy.totalBetAmount()).to.be.equal(
        BigInt(2) * betAmountEth
      );
    });

    it("joinGame should increase the totalCollateralAmount by collateralAmount", async () => {
      await gmProxy.startBettingRound();
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await proxyAsPlayer2.joinGame(getHash(1, "test"), { value: entryValue });

      expect(await proxy.totalCollateralAmount()).to.be.equal(
        BigInt(2) * collateralAmountEth
      );
    });

    // it("joinGame should increase the totalGameFee by gameFeeAmount", async () => {
    //   await gmProxy.startBettingRound();
    //   const proxyAsPlayer1 = proxy.connect(player1);
    //   await proxyAsPlayer1.joinGame(commit, { value: entryValue });
    //   const proxyAsPlayer2 = proxy.connect(player2);
    //   await proxyAsPlayer2.joinGame(getHash(1, "test"), { value: entryValue });

    //   expect(await gmProxy.getTotalGameFees()).to.be.equal(
    //     BigInt(2) * gameFeeAmountEth
    //   );
    // });

    // it("joinGame should set commitment for player", async () => {
    //   await gmProxy.startBettingRound();
    //   const proxyAsPlayer1 = proxy.connect(player1);
    //   await proxyAsPlayer1.joinGame(commit, { value: entryValue });

    //   expect(await gmProxy.getCommitment(player1.getAddress())).to.be.equal(
    //     commit
    //   );
    // });

    it("closeBettingRound should revert if not called by game master", async () => {
      await expect(proxy.closeBettingRound()).to.be.revertedWith(
        onlyGameMasterError
      );
    });

    it("closeBettingRound should revert if not game is not in commit phase", async () => {
      await expect(gmProxy.closeBettingRound()).to.be.revertedWith(
        "Game has not started yet"
      );
    });

    it("closeBettingRound should revert if less than 3 players joined", async () => {
      await gmProxy.startBettingRound();
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await proxyAsPlayer2.joinGame(commit, { value: entryValue });

      await expect(gmProxy.closeBettingRound()).to.be.revertedWith(
        "Atleast 3 players are required to start the game"
      );
    });

    it("closeBettingRound should set state to Reveal Phase if successful", async () => {
      await startValidGame();

      expect(await gmProxy.state()).to.equal(2);
    });

    it("revealGuess should revert cause not a valid players calls it", async () => {
      await gmProxy.startBettingRound();
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });

      await expect(gmProxy.revealGuess(guess, salt)).to.be.revertedWith(
        "Not a valid player address"
      );
    });

    it("revealGuess should set reveal state to revealed (1) on verified reveal", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      await proxyAsPlayer1.revealGuess(guess, salt);

      expect(
        await gmProxy.getPlayerRevealedState(await player1.getAddress())
      ).to.equal(1);
    });

    it("revealGuess should set reveal state to invalid (2) on invalid guess reveal", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      await proxyAsPlayer1.revealGuess(10, salt);

      expect(
        await gmProxy.getPlayerRevealedState(await player1.getAddress())
      ).to.equal(2);
    });

    it("revealGuess should call payoutCollateral on successful reveal", async () => {
      const { proxyAsPlayer1 } = await startValidGame();

      await expect(proxyAsPlayer1.revealGuess(guess, salt)).to.emit(
        proxyAsPlayer1,
        "CollateralDeposited"
      );
    });

    it("endGame should only be callable by game master", async () => {
      const { proxyAsPlayer1 } = await startValidGame();

      await expect(proxyAsPlayer1.endGame()).to.be.revertedWith(
        onlyGameMasterError
      );
    });

    it("endGame should only be callable if in Reveal Phase", async () => {
      await gmProxy.startBettingRound();

      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await proxyAsPlayer2.joinGame(commit, { value: entryValue });
      const proxyAsPlayer3 = proxy.connect(player3);
      await proxyAsPlayer3.joinGame(commit, { value: entryValue });

      await expect(gmProxy.endGame()).to.be.revertedWith(
        "Game has not ended yet"
      );
    });

    it("endGame should set the game state to Ended (3)", async () => {
      await startValidGame();
      await gmProxy.endGame();

      expect(await gmProxy.state()).to.equal(3);
    });

    it("endGame should call refundPlayers if totalWinners == -1", async () => {
      await startValidGame();

      await expect(gmProxy.endGame()).to.emit(gmProxy, "PlayerRefunded");
    });

    it("endGame should call selectWinner if totalWinners != -1", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      await proxyAsPlayer1.revealGuess(guess, salt);

      await expect(gmProxy.endGame()).to.emit(gmProxy, "WinnerSelected");
    });

    [
      {
        guesses: [9, 18, 27, 0, 0],
        average: 7.2,
        salts: ["secret1", "secret2", "secret3", "secret4", "secret5"],
        containsPotentialWinner: [true, false, false, false, false],
        players: "player1",
      },
      {
        guesses: [9, 18, 27, 36, 45],
        average: 18,
        salts: ["secret1", "secret2", "secret3", "secret4", "secret5"],
        containsPotentialWinner: [false, true, false, false, false],
        players: "player2",
      },
      {
        guesses: [9, 18, 18, 27, 36],
        average: 14.4,
        salts: ["secret1", "secret2", "secret3", "secret4", "secret5"],
        containsPotentialWinner: [false, true, true, false, false],
        players: "player2, player3",
      },
    ].forEach(
      ({ guesses, average, salts, containsPotentialWinner, players }) => {
        it(`determinePotentialWinners with ${guesses[0]}, ${guesses[1]}, ${guesses[2]}, ${guesses[3]}, ${guesses[4]} and ${average} as average should contain ${players}`, async () => {
          await gmProxy.startBettingRound();
          const commits = guesses.map((guess, index) => {
            return getHash(guess, salts[index]);
          });
          const proxys = [];
          const signers = await ethers.getSigners();
          for (let i = 0; i < 5; i++) {
            proxys.push(proxy.connect(signers[i + 2]));
            await proxys[i].joinGame(commits[i], { value: entryValue });
          }

          await gmProxy.closeBettingRound();

          for (let i = 0; i < 5; i++) {
            await proxys[i].revealGuess(guesses[i], salts[i]);
          }

          await gmProxy.endGame();
          const potentialWinners = await gmProxy.getPotentialWinners();

          expect(
            potentialWinners.includes(await player1.getAddress())
          ).to.equal(containsPotentialWinner[0]);
          expect(
            potentialWinners.includes(await player2.getAddress())
          ).to.equal(containsPotentialWinner[1]);
          expect(
            potentialWinners.includes(await player3.getAddress())
          ).to.equal(containsPotentialWinner[2]);
          expect(
            potentialWinners.includes(await player4.getAddress())
          ).to.equal(containsPotentialWinner[3]);
          expect(
            potentialWinners.includes(await player5.getAddress())
          ).to.equal(containsPotentialWinner[4]);
        });
      }
    );

    it("withdrawPricepool should withdraw betAmounts + collateralAmounts because only 1 player revealed", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      // 3 players joined, 2 didn't reveal, therefore the player 1 already got his collateral refundend
      const expectedPayout =
        (betAmountEth + collateralAmountEth) * BigInt(3) - collateralAmountEth;
      await proxyAsPlayer1.revealGuess(guess, salt);
      await gmProxy.endGame();

      const player1Address = await player1.getAddress();
      await expect(proxyAsPlayer1.withdrawPricepool(player1Address))
        .to.emit(gmProxy, "PrizeAwarded")
        .withArgs(player1Address, expectedPayout, guess);
    });

    it("withdrawPricepool should revert if price pool is 0", async () => {
      const { proxyAsPlayer1 } = await startValidGame();

      await proxyAsPlayer1.revealGuess(guess, salt);
      await gmProxy.endGame();

      const player1Address = await player1.getAddress();
      await proxyAsPlayer1.withdrawPricepool(player1Address);
      await expect(
        proxyAsPlayer1.withdrawPricepool(player1Address)
      ).to.revertedWith("No price pool to payout");
    });

    it("withdrawPricepool should correctly reduce balance", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      // 3 players joined, 2 didn't reveal, therefore the player 1 already got his collateral refundend
      const balanceBefore = entryValue * BigInt(3) - collateralAmountEth;
      const expectedPayout =
        (betAmountEth + collateralAmountEth) * BigInt(3) - collateralAmountEth;
      const balanceAfter = balanceBefore - expectedPayout;

      await proxyAsPlayer1.revealGuess(guess, salt);
      await gmProxy.endGame();

      const player1Address = await player1.getAddress();
      expect(await proxyAsPlayer1.getBalance()).to.be.equal(balanceBefore);
      await proxyAsPlayer1.withdrawPricepool(player1Address);
      expect(await proxyAsPlayer1.getBalance()).to.be.equal(balanceAfter);
    });

    it("withdrawPricepool should correctly reduce balance", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      // 3 players joined, 2 didn't reveal, therefore the player 1 already got his collateral refundend
      const balanceBefore = entryValue * BigInt(3) - collateralAmountEth;
      const expectedPayout =
        (betAmountEth + collateralAmountEth) * BigInt(3) - collateralAmountEth;
      const balanceAfter = balanceBefore - expectedPayout;

      await proxyAsPlayer1.revealGuess(guess, salt);
      await gmProxy.endGame();

      const player1Address = await player1.getAddress();
      expect(await proxyAsPlayer1.getBalance()).to.be.equal(balanceBefore);
      await proxyAsPlayer1.withdrawPricepool(player1Address);
      expect(await proxyAsPlayer1.getBalance()).to.be.equal(balanceAfter);
    });

    it("payoutCollateral should reduce balance by collateralAmount", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      const balanceBefore = entryValue * BigInt(3);
      const balanceAfter = balanceBefore - collateralAmountEth;
      expect(await proxyAsPlayer1.getBalance()).to.be.equal(balanceBefore);

      await proxyAsPlayer1.revealGuess(guess, salt);

      expect(await proxyAsPlayer1.getBalance()).to.be.equal(balanceAfter);
    });

    it("withdrawGameFees should revert if GameState is not Ended", async () => {
      await startValidGame();

      await expect(gmProxy.withdrawGameFees()).to.revertedWith(
        "Game has not ended yet"
      );
    });

    it("withdrawGameFees should revert if not called by game master", async () => {
      const { proxyAsPlayer1 } = await startValidGame();

      await expect(proxyAsPlayer1.withdrawGameFees()).to.revertedWith(
        onlyGameMasterError
      );
    });

    it("withdrawGameFees should revert if no winner was found", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      await gmProxy.endGame();

      await expect(gmProxy.withdrawGameFees()).to.revertedWith(
        "No winner found"
      );
    });

    it("withdrawGameFees should emit event on success", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      await proxyAsPlayer1.revealGuess(guess, salt);
      await gmProxy.endGame();

      await expect(gmProxy.withdrawGameFees()).to.emit(gmProxy, "FeeCollected");
    });

    it("withdrawGameFees should transfer correct fee amount", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      await proxyAsPlayer1.revealGuess(guess, salt);

      const expectedFee = gameFeeAmountEth * BigInt(3);
      await gmProxy.endGame();

      await expect(gmProxy.withdrawGameFees())
        .to.emit(gmProxy, "FeeCollected")
        .withArgs(await gameMaster.getAddress(), expectedFee);
    });

    it("withdrawGameFees should correctly reduce balance", async () => {
      const balanceBefore = entryValue * BigInt(3) - collateralAmountEth;
      const expectedFee = gameFeeAmountEth * BigInt(3);
      const balanceAfter = balanceBefore - expectedFee;

      const { proxyAsPlayer1 } = await startValidGame();
      await proxyAsPlayer1.revealGuess(guess, salt);

      await gmProxy.endGame();

      expect(await gmProxy.getBalance()).to.equal(balanceBefore);
      await gmProxy.withdrawGameFees();
      expect(await gmProxy.getBalance()).to.equal(balanceAfter);
    });
  });
});
