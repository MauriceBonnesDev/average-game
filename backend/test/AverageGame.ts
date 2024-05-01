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
  let timeManipulations = 1;
  const contractName = "AverageGame";
  const name = "Average Game";
  const maxPlayers = 5;
  const betAmount = 1;
  const gameFee = 10.5; // percent
  const gameId = 0;
  const onlyGameMasterError =
    "Nur der Spielleiter kann diese Funktion aufrufen!";
  const betAmountEth = parseEther(betAmount.toString());
  const collateralAmountEth = betAmountEth * BigInt(3);
  const gameFeeAmountEth = BigInt((gameFee / 100) * 1e18 * betAmount);
  const entryValue = betAmountEth + collateralAmountEth + gameFeeAmountEth;
  const gameIcon = 0;

  async function createAverageGame() {
    await averageGameConnectedAsGameMaster.createAverageGame(
      averageGameAddress,
      name,
      maxPlayers,
      betAmountEth,
      gameFeeAmountEth,
      gameIcon
    );
  }

  beforeEach(async () => {
    const dest = await ethers.getSigners();
    [deployer, gameMaster, player1, player2, player3, player4, player5] =
      await ethers.getSigners();

    averageGame = await ethers.deployContract(contractName);

    averageGameFactory = await ethers.deployContract("AverageGameFactory");

    averageGameAddress = await averageGame.getAddress();

    averageGameConnectedAsGameMaster = averageGameFactory.connect(gameMaster);
    await createAverageGame();

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

    it("GameMaster should be set", async () => {
      const gameMasterAddress = await averageGameFactory.getGameMasterAt(
        gameId
      );
      expect(gameMasterAddress).to.be.equal(await gameMaster.getAddress());
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
    const commit: BytesLike = getHash(guess, salt);

    console.log("EntryValue:", entryValue);

    function getHash(_guess: number, _salt: string) {
      return solidityPackedKeccak256(["uint256", "string"], [_guess, _salt]);
    }

    async function waitBlocks(amountOfBlocks: number) {
      for (let i = 0; i < amountOfBlocks; i++) {
        await ethers.provider.send("evm_setNextBlockTimestamp", [
          2000000000 + 10000 * timeManipulations++,
        ]);
        await ethers.provider.send("evm_mine", []);
      }
    }

    async function waitBlock(times: number) {
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        2000000000 + 10000 * times,
      ]);
      await ethers.provider.send("evm_mine", []);
    }

    async function startValidGame() {
      const proxyAsPlayer1 = proxy.connect(player1);
      await waitBlock(timeManipulations++);

      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await waitBlock(timeManipulations++);
      await proxyAsPlayer2.joinGame(commit, { value: entryValue });
      const proxyAsPlayer3 = proxy.connect(player3);
      await waitBlock(timeManipulations++);
      await proxyAsPlayer3.joinGame(commit, { value: entryValue });
      await waitBlocks(25);

      await gmProxy.startRevealPhase();

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
          betAmountEth,
          gameMaster.getAddress(),
          gameFeeAmountEth,
          0
        )
      ).to.be.revertedWith("Spiel wurde bereits initialisiert!");
    });

    it("joinGame should revert if value is insufficient", async () => {
      const proxyAsPlayer1 = proxy.connect(player1);
      await expect(
        proxyAsPlayer1.joinGame(commit, { value: entryValue - BigInt(1) })
      ).to.be.revertedWith(
        "Unzureichender Betrag: Bitte zahlen Sie den Einsatz, die dreifache Kaution und die Spielgebühr!"
      );
    });

    it("joinGame should revert if reveal phase already started", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      await expect(
        proxyAsPlayer1.joinGame(commit, { value: entryValue - BigInt(1) })
      ).to.be.revertedWith("Spiel muss in der Commit Phase sein!");
    });

    it("joinGame should revert if the player already joined", async () => {
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      await expect(
        proxyAsPlayer1.joinGame(commit, { value: entryValue })
      ).to.be.revertedWith("Du bist dem Spiel bereits beigetreten!");
    });

    it("joinGame should increase the totalBetAmount by betAmount", async () => {
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await proxyAsPlayer2.joinGame(getHash(1, "test"), { value: entryValue });

      expect(await proxy.totalBetAmount()).to.be.equal(
        BigInt(2) * betAmountEth
      );
    });

    it("joinGame should increase the totalCollateralAmount by collateralAmount", async () => {
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

    it("startRevealPhase should revert if game is not in commit phase", async () => {
      await startValidGame();
      await waitBlocks(25);
      await expect(gmProxy.startRevealPhase()).to.be.revertedWith(
        "Reveal Phase kann nur gestartet werden, wenn aktuell die Commit Phase ist!"
      );
    });

    it("startRevealPhase should revert if less than 3 players joined", async () => {
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await proxyAsPlayer2.joinGame(commit, { value: entryValue });
      await waitBlocks(25);
      await expect(gmProxy.startRevealPhase()).to.be.revertedWith(
        "Mindestens 3 Spieler werden benötigt um das Spiel zu starten!"
      );
    });

    it("startRevealPhase should revert if not enough time passed for players to join", async () => {
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await proxyAsPlayer2.joinGame(commit, { value: entryValue });

      await expect(gmProxy.startRevealPhase()).to.be.revertedWithCustomError(
        proxy,
        "MinimumTimePassed"
      );
    });

    it("startRevealPhase should set state to Reveal Phase if successful", async () => {
      await startValidGame();

      expect(await gmProxy.state()).to.equal(1);
    });

    it("revealGuess should revert cause not a valid players calls it", async () => {
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });

      await expect(gmProxy.revealGuess(guess, salt)).to.be.revertedWith(
        "Nur beigetretene Spieler können diese Funktion aufrufen!"
      );
    });

    it("revealGuess should revert cause the player already revealed his guess", async () => {
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await proxyAsPlayer2.joinGame(commit, { value: entryValue });
      const proxyAsPlayer3 = proxy.connect(player3);
      await proxyAsPlayer3.joinGame(commit, { value: entryValue });
      await waitBlocks(25);
      await proxyAsPlayer3.startRevealPhase();
      await proxyAsPlayer3.revealGuess(guess, salt);

      await expect(proxyAsPlayer3.revealGuess(guess, salt)).to.be.revertedWith(
        "Spieler hat bereits seinen Tipp veröffentlicht!"
      );
    });

    it("revealGuess should revert if the guess is higher than maxGuess", async () => {
      const wrongGuess = 1001;
      const saltForWrongGuess = "wrongGuess";
      const invalidGuessCommit: BytesLike = getHash(
        wrongGuess,
        saltForWrongGuess
      );
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await proxyAsPlayer2.joinGame(invalidGuessCommit, { value: entryValue });
      const proxyAsPlayer3 = proxy.connect(player3);
      await proxyAsPlayer3.joinGame(commit, { value: entryValue });
      await waitBlocks(25);
      await proxyAsPlayer2.startRevealPhase();

      await expect(
        proxyAsPlayer2.revealGuess(wrongGuess, saltForWrongGuess)
      ).to.be.revertedWith("Tipp muss zwischen 0 und 1000 liegen!");
    });

    it("revealGuess should revert if the minimum blocknumber for a reaveal is not reached", async () => {
      const { proxyAsPlayer1 } = await startValidGame();

      await expect(proxyAsPlayer1.revealGuess(guess, salt)).to.be.revertedWith(
        "Deine Revealzeit hat noch nicht begonnen!"
      );
    });

    it("revealGuess should revert if the maximum blocknumber for a reaveal has already passed", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      await waitBlocks(200);
      await expect(proxyAsPlayer1.revealGuess(guess, salt)).to.be.revertedWith(
        "Deine Revealzeit ist vorbei!"
      );
    });

    it("revealGuess should set reveal state to revealed (1) on verified reveal", async () => {
      const { proxyAsPlayer2 } = await startValidGame();
      await proxyAsPlayer2.revealGuess(guess, salt);

      expect(
        await gmProxy.getPlayerRevealedState(await player2.getAddress())
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
      const { proxyAsPlayer2 } = await startValidGame();
      await expect(proxyAsPlayer2.revealGuess(guess, salt)).to.emit(
        proxyAsPlayer2,
        "CollateralDeposited"
      );
    });

    it("revealGuess should not call payoutCollateral on invalid reveal (guess)", async () => {
      const { proxyAsPlayer3 } = await startValidGame();
      const wrongGuess = 987;
      await expect(proxyAsPlayer3.revealGuess(wrongGuess, salt)).to.not.emit(
        proxyAsPlayer3,
        "CollateralDeposited"
      );
    });

    it("revealGuess should not call payoutCollateral on invalid reveal (salt)", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      const wrongSalt = "wrongSalt";
      await expect(proxyAsPlayer1.revealGuess(guess, wrongSalt)).to.not.emit(
        proxyAsPlayer1,
        "CollateralDeposited"
      );
    });

    it("endGame should only be callable if in Reveal Phase", async () => {
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await proxyAsPlayer2.joinGame(commit, { value: entryValue });
      const proxyAsPlayer3 = proxy.connect(player3);
      await proxyAsPlayer3.joinGame(commit, { value: entryValue });
      await waitBlocks(25);
      await expect(gmProxy.endGame()).to.be.revertedWith(
        "Spiel muss in Reveal Phase sein!"
      );
    });

    it("endGame should set the game state to Ended (2)", async () => {
      await startValidGame();
      const proxyAsPlayer1 = proxy.connect(player1);
      await proxyAsPlayer1.revealGuess(guess, salt);
      await waitBlocks(75);
      await gmProxy.endGame();
      expect(await gmProxy.state()).to.equal(2);
    });

    it("endGame should call refundPlayers if totalWinners == -1", async () => {
      await startValidGame();
      await waitBlocks(75);
      await expect(gmProxy.endGame()).to.revertedWith(
        "Es wurde kein Gewinner gefunden!"
      );
    });

    it("endGame should call selectWinner if totalWinners != -1", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      await proxyAsPlayer1.revealGuess(guess, salt);
      await waitBlocks(75);
      await expect(gmProxy.endGame()).to.emit(gmProxy, "WinnerSelected");
    });

    it("endGame should revert if no winner was found", async () => {
      await startValidGame();
      await waitBlocks(75);
      await expect(gmProxy.endGame()).to.revertedWith(
        "Es wurde kein Gewinner gefunden!"
      );
    });

    it(`determinePotentialWinners with 9, 18, 27, 0, 0 and 7.2 as average should contain player1`, async () => {
      const guesses = [9, 18, 27, 0, 0];
      const salts = ["secret1", "secret2", "secret3", "secret4", "secret5"];
      const commits = guesses.map((guess, index) => {
        return getHash(guess, salts[index]);
      });
      const proxys = [];
      const signers = await ethers.getSigners();
      await waitBlock(timeManipulations++);
      for (let i = 0; i < 5; i++) {
        proxys.push(proxy.connect(signers[i + 2]));
        await proxys[i].joinGame(commits[i], { value: entryValue });
      }
      await waitBlocks(25);
      await gmProxy.startRevealPhase();

      await proxys[3].revealGuess(guesses[3], salts[3]);
      await waitBlocks(25);
      await proxys[4].revealGuess(guesses[4], salts[4]);
      await waitBlocks(25);
      await proxys[1].revealGuess(guesses[1], salts[1]);
      await waitBlocks(25);
      await proxys[0].revealGuess(guesses[0], salts[0]);
      await waitBlocks(25);
      await proxys[2].revealGuess(guesses[2], salts[2]);
      await waitBlocks(25);
      await gmProxy.endGame();
      const potentialWinners = await gmProxy.getPotentialWinners();
      const containsPotentialWinner = [true, false, false, false, false];

      expect(potentialWinners.includes(await player1.getAddress())).to.equal(
        containsPotentialWinner[0]
      );
      expect(potentialWinners.includes(await player2.getAddress())).to.equal(
        containsPotentialWinner[1]
      );
      expect(potentialWinners.includes(await player3.getAddress())).to.equal(
        containsPotentialWinner[2]
      );
      expect(potentialWinners.includes(await player4.getAddress())).to.equal(
        containsPotentialWinner[3]
      );
      expect(potentialWinners.includes(await player5.getAddress())).to.equal(
        containsPotentialWinner[4]
      );
    });

    it(`determinePotentialWinners with 9, 18, 27, 36, 45 and 18 as average should contain player2`, async () => {
      const guesses = [9, 18, 27, 36, 45];
      const salts = ["secret1", "secret2", "secret3", "secret4", "secret5"];
      const commits = guesses.map((guess, index) => {
        return getHash(guess, salts[index]);
      });
      const proxys = [];
      const signers = await ethers.getSigners();
      await waitBlock(timeManipulations++);
      for (let i = 0; i < 5; i++) {
        proxys.push(proxy.connect(signers[i + 2]));
        await proxys[i].joinGame(commits[i], { value: entryValue });
      }
      await waitBlocks(25);
      await gmProxy.startRevealPhase();

      await proxys[2].revealGuess(guesses[2], salts[2]);
      await waitBlocks(25);
      await proxys[0].revealGuess(guesses[0], salts[0]);
      await waitBlocks(25);
      await proxys[1].revealGuess(guesses[1], salts[1]);
      await waitBlocks(25);
      await proxys[3].revealGuess(guesses[3], salts[3]);
      await waitBlocks(25);
      await proxys[4].revealGuess(guesses[4], salts[4]);
      await waitBlocks(25);

      await gmProxy.endGame();
      const potentialWinners = await gmProxy.getPotentialWinners();
      const containsPotentialWinner = [false, true, false, false, false];

      expect(potentialWinners.includes(await player1.getAddress())).to.equal(
        containsPotentialWinner[0]
      );
      expect(potentialWinners.includes(await player2.getAddress())).to.equal(
        containsPotentialWinner[1]
      );
      expect(potentialWinners.includes(await player3.getAddress())).to.equal(
        containsPotentialWinner[2]
      );
      expect(potentialWinners.includes(await player4.getAddress())).to.equal(
        containsPotentialWinner[3]
      );
      expect(potentialWinners.includes(await player5.getAddress())).to.equal(
        containsPotentialWinner[4]
      );
    });

    it(`determinePotentialWinners with 9, 18, 18, 27, 36 and 14.4 as average should contain player2 and player3`, async () => {
      const guesses = [9, 18, 18, 27, 36];
      const salts = ["secret1", "secret2", "secret3", "secret4", "secret5"];
      const commits = guesses.map((guess, index) => {
        return getHash(guess, salts[index]);
      });
      const proxys = [];
      const signers = await ethers.getSigners();
      await waitBlock(timeManipulations++);
      for (let i = 0; i < 5; i++) {
        proxys.push(proxy.connect(signers[i + 2]));
        await proxys[i].joinGame(commits[i], { value: entryValue });
      }
      await waitBlocks(25);
      await gmProxy.startRevealPhase();

      await proxys[0].revealGuess(guesses[0], salts[0]);
      await waitBlocks(25);
      await proxys[2].revealGuess(guesses[2], salts[2]);
      await waitBlocks(25);
      await proxys[3].revealGuess(guesses[3], salts[3]);
      await waitBlocks(25);
      await proxys[1].revealGuess(guesses[1], salts[1]);
      await waitBlocks(25);
      await proxys[4].revealGuess(guesses[4], salts[4]);
      await waitBlocks(25);

      await gmProxy.endGame();
      const potentialWinners = await gmProxy.getPotentialWinners();
      const containsPotentialWinner = [false, true, true, false, false];

      expect(potentialWinners.includes(await player1.getAddress())).to.equal(
        containsPotentialWinner[0]
      );
      expect(potentialWinners.includes(await player2.getAddress())).to.equal(
        containsPotentialWinner[1]
      );
      expect(potentialWinners.includes(await player3.getAddress())).to.equal(
        containsPotentialWinner[2]
      );
      expect(potentialWinners.includes(await player4.getAddress())).to.equal(
        containsPotentialWinner[3]
      );
      expect(potentialWinners.includes(await player5.getAddress())).to.equal(
        containsPotentialWinner[4]
      );
    });

    it("withdrawPricepool should withdraw betAmounts + collateralAmounts because only 1 player revealed", async () => {
      const { proxyAsPlayer3 } = await startValidGame();
      // 3 players joined, 2 didn't reveal, therefore the player 1 already got his collateral refundend
      const expectedPayout =
        (betAmountEth + collateralAmountEth) * BigInt(3) - collateralAmountEth;
      await proxyAsPlayer3.revealGuess(guess, salt);
      await waitBlocks(75);
      await gmProxy.endGame();

      const player3Address = await player3.getAddress();
      const id = await gmProxy.id();
      await expect(proxyAsPlayer3.withdrawPricepool(player3Address))
        .to.emit(gmProxy, "PrizeAwarded")
        .withArgs(id, player3Address, expectedPayout, guess);
    });

    it("withdrawPricepool should revert if price pool is 0", async () => {
      const { proxyAsPlayer2 } = await startValidGame();

      await proxyAsPlayer2.revealGuess(guess, salt);
      await waitBlocks(75);
      await gmProxy.endGame();

      const player2Address = await player2.getAddress();
      await proxyAsPlayer2.withdrawPricepool(player2Address);
      await expect(
        proxyAsPlayer2.withdrawPricepool(player2Address)
      ).to.revertedWith("Kein Preispool vorhanden!");
    });

    it("withdrawPricepool should correctly reduce balance", async () => {
      const { proxyAsPlayer3 } = await startValidGame();
      // 3 players joined, 2 didn't reveal, therefore the player 1 already got his collateral refundend
      const balanceBefore = entryValue * BigInt(3) - collateralAmountEth;
      const expectedPayout =
        (betAmountEth + collateralAmountEth) * BigInt(3) - collateralAmountEth;
      const balanceAfter = balanceBefore - expectedPayout;

      await proxyAsPlayer3.revealGuess(guess, salt);
      await waitBlocks(75);
      await gmProxy.endGame();

      const player3Address = await player3.getAddress();
      expect(await proxyAsPlayer3.getBalance()).to.be.equal(balanceBefore);
      await proxyAsPlayer3.withdrawPricepool(player3Address);
      expect(await proxyAsPlayer3.getBalance()).to.be.equal(balanceAfter);
    });

    it("withdrawPricepool should revert if not called by winner", async () => {
      const { proxyAsPlayer1, proxyAsPlayer3 } = await startValidGame();

      await proxyAsPlayer1.revealGuess(guess, salt);
      await waitBlocks(75);
      await gmProxy.endGame();

      const player3Address = await player3.getAddress();
      await expect(
        proxyAsPlayer3.withdrawPricepool(player3Address)
      ).to.revertedWith("Nur der Sieger kann diese Funktion aufrufen!");
    });

    it("payoutCollateral should reduce balance by collateralAmount", async () => {
      const { proxyAsPlayer2 } = await startValidGame();
      const balanceBefore = entryValue * BigInt(3);
      const balanceAfter = balanceBefore - collateralAmountEth;
      expect(await proxyAsPlayer2.getBalance()).to.be.equal(balanceBefore);

      await proxyAsPlayer2.revealGuess(guess, salt);

      expect(await proxyAsPlayer2.getBalance()).to.be.equal(balanceAfter);
    });

    it("withdrawGameFees should revert if GameState is not Ended", async () => {
      await startValidGame();

      await expect(gmProxy.withdrawGameFees()).to.revertedWith(
        "Spiel ist noch nicht beendet!"
      );
    });

    it("withdrawGameFees should revert if not called by game master", async () => {
      const { proxyAsPlayer1 } = await startValidGame();

      await expect(proxyAsPlayer1.withdrawGameFees()).to.revertedWith(
        onlyGameMasterError
      );
    });

    it("withdrawGameFees should emit event on success", async () => {
      const { proxyAsPlayer3 } = await startValidGame();
      await proxyAsPlayer3.revealGuess(guess, salt);
      await waitBlocks(75);
      await gmProxy.endGame();

      await expect(gmProxy.withdrawGameFees()).to.emit(gmProxy, "FeeCollected");
    });

    it("withdrawGameFees should transfer correct fee amount", async () => {
      const { proxyAsPlayer2 } = await startValidGame();
      await proxyAsPlayer2.revealGuess(guess, salt);

      const expectedFee = gameFeeAmountEth * BigInt(3);
      await waitBlocks(75);
      await gmProxy.endGame();
      const id = await gmProxy.id();
      await expect(gmProxy.withdrawGameFees())
        .to.emit(gmProxy, "FeeCollected")
        .withArgs(id, await gameMaster.getAddress(), expectedFee);
    });

    it("withdrawGameFees should correctly reduce balance", async () => {
      const balanceBefore = entryValue * BigInt(3) - collateralAmountEth;
      const expectedFee = gameFeeAmountEth * BigInt(3);
      const balanceAfter = balanceBefore - expectedFee;

      const { proxyAsPlayer1 } = await startValidGame();
      await proxyAsPlayer1.revealGuess(guess, salt);
      await waitBlocks(75);
      await gmProxy.endGame();

      expect(await gmProxy.getBalance()).to.equal(balanceBefore);
      await gmProxy.withdrawGameFees();
      expect(await gmProxy.getBalance()).to.equal(balanceAfter);
    });

    it("withdrawCollateralShare should revert if player did not reveal his guess", async () => {
      const { proxyAsPlayer1, proxyAsPlayer2, proxyAsPlayer3 } =
        await startValidGame();

      await proxyAsPlayer2.revealGuess(guess, salt);
      await waitBlocks(25);
      await proxyAsPlayer1.revealGuess(guess, salt);
      await waitBlocks(50);
      await gmProxy.endGame();

      await expect(proxyAsPlayer3.withdrawCollateralShare()).to.revertedWith(
        "Spieler hat seinen Tipp nicht veröffentlicht!"
      );
    });

    it("withdrawCollateralShare should revert if game has not ended", async () => {
      const { proxyAsPlayer2 } = await startValidGame();

      await waitBlocks(25);
      await proxyAsPlayer2.revealGuess(guess, salt);

      await expect(proxyAsPlayer2.withdrawCollateralShare()).to.revertedWith(
        "Spiel ist noch nicht beendet!"
      );
    });

    it("withdrawCollateralShare should revert if winner tries to withdraw collateral", async () => {
      const { proxyAsPlayer1 } = await startValidGame();

      await proxyAsPlayer1.revealGuess(guess, salt);
      await waitBlocks(75);
      await gmProxy.endGame();
      await expect(proxyAsPlayer1.withdrawCollateralShare()).to.revertedWith(
        "Gewinner kann sich keine Kaution auszahlen!"
      );
    });

    it("withdrawCollateralShare should revert if player tries to withdraw multiple times", async () => {
      const { proxyAsPlayer3, proxyAsPlayer2 } = await startValidGame();

      await proxyAsPlayer2.revealGuess(guess, salt);
      await waitBlocks(25);
      await proxyAsPlayer3.revealGuess(guess, salt);
      await waitBlocks(50);

      await gmProxy.endGame();

      await proxyAsPlayer2.withdrawCollateralShare();
      await expect(proxyAsPlayer2.withdrawCollateralShare()).to.revertedWith(
        "Spieler hat nicht das Recht einen Teil des Collaterals auszuzahlen!"
      );
    });

    it("withdrawCollateralShare should transfer the correct amount", async () => {
      const balanceBefore =
        entryValue * BigInt(3) - collateralAmountEth * BigInt(2);
      const balanceAfter = balanceBefore - collateralAmountEth / BigInt(2);
      await waitBlocks(25);
      const { proxyAsPlayer1, proxyAsPlayer2 } = await startValidGame();

      await proxyAsPlayer2.revealGuess(guess, salt);
      await waitBlocks(25);
      await proxyAsPlayer1.revealGuess(guess, salt);
      await waitBlocks(50);
      await gmProxy.endGame();

      expect(await gmProxy.getBalance()).to.equal(balanceBefore);
      await proxyAsPlayer2.withdrawCollateralShare();
      expect(await gmProxy.getBalance()).to.equal(balanceAfter);
    });

    it("requestRefund should revert if not called in Commit Phase", async () => {
      const { proxyAsPlayer1 } = await startValidGame();
      await waitBlocks(25);
      await expect(proxyAsPlayer1.requestRefund()).to.revertedWith(
        "Spiel muss in der Commit Phase sein!"
      );
    });

    it("requestRefund should revert if not enough time has passed", async () => {
      const proxyAsPlayer1 = proxy.connect(player1);
      await waitBlock(timeManipulations++);

      await proxyAsPlayer1.joinGame(commit, { value: entryValue });
      const proxyAsPlayer2 = proxy.connect(player2);
      await waitBlock(timeManipulations++);
      await proxyAsPlayer2.joinGame(commit, { value: entryValue });
      const proxyAsPlayer3 = proxy.connect(player3);
      await waitBlocks(25);
      await expect(proxyAsPlayer3.requestRefund()).to.revertedWith(
        "Nur beigetretene Spieler können diese Funktion aufrufen!"
      );
    });
  });
});
