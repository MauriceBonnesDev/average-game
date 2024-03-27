// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

import "hardhat/console.sol";

contract AverageGame {
    uint256 public id;
    uint256 public maxPlayers;
    uint256 public totalPlayers;
    uint256 public betAmount;
    uint256 public collateralAmount;
    uint256 public totalBetAmount;
    uint256 public totalCollateralAmount;
    uint256 public minGuess = 0;
    uint256 public maxGuess = 1000;
    uint256 public gameFee; // Integer representation of the percentage of the game fee
    uint256 public totalGameFees;
    
    string public name;

    address private gameMaster;
    address private factory;
    address[] public players;
    address[] public winners;

    bool private isInitialized;

    GameState public state;

    mapping(address => bytes32) public commitments;
    mapping(address => bool) public playerRevealed;
    mapping(address => bool) public playerAlreadyJoined;
    mapping(address => string) public revealedSalts;
    mapping(address => uint256) public revealedGuesses;
    mapping(address => uint256) public collateralOfPlayer;

    enum GameState {
        Initialized, // The game has been created
        CommitPhase, // Participants are committing their guesses
        RevealPhase, // Participants are revealing their guesses
        Ended        // The game has ended
    }
    
    modifier onlyGameMaster {
        require(gameMaster == msg.sender, "Only game master can call this function");
        _;
    }

    modifier onlyFactory {
        require(factory == msg.sender, "Only factory can call this function");
        _;
    }

    modifier onlyValidPlayers(address _player) {
        require(_player != address(0), "Address can't be 0x0");
        require(playerAlreadyJoined[_player], "Not a valid player address");
        _;
    }

    event PlayerJoined(address indexed player, uint256 indexed totalPlayersAmount);
    event PlayerRevealedGuess(address indexed player, uint256 indexed guess, string indexed salt);
    event GameStarted();
    event GameEnded();
    event BettingRoundClosed();
    event CollateralDeposited(address indexed player, uint256 indexed amount);
    event PrizeAwarded(address indexed player, uint256 indexed amount);
    event FeeCollected(address indexed player, uint256 indexed amount);

    function initGame(uint256 _gameId, string memory _name, uint256 _maxPlayers, uint256 _betAmount, address _gameMaster, uint256 _gameFee) public {
        require(!isInitialized, "Game is already initialized");
        id = _gameId;
        name = _name;
        maxPlayers = _maxPlayers;
        betAmount = _betAmount;
        collateralAmount = _betAmount * 3;
        state = GameState.Initialized;
        gameFee = _gameFee;
        isInitialized = true;
        gameMaster = _gameMaster;
        console.log("Game initialized");
    }

    function startBettingRound() external onlyGameMaster onlyFactory {
        require(state == GameState.Initialized, "Game has already started");
        state = GameState.CommitPhase;
        console.log("Game started");
        emit GameStarted();
    }

    function joinGame(bytes32 _guess) external payable onlyFactory {
        uint256 fee = (betAmount * gameFee) / 100;
        require(state == GameState.CommitPhase, "Game has not started yet");
        require(msg.value == collateralAmount + betAmount + fee, "Insufficient amount, must be the bet amount + 3 times the bet amount as collateral");
        require(!playerAlreadyJoined[msg.sender], "Player has already joined the game");

        totalBetAmount += betAmount;
        totalCollateralAmount += collateralAmount;
        collateralOfPlayer[msg.sender] = collateralAmount;
        totalGameFees += fee;
        commitments[msg.sender] = _guess;

        players[totalPlayers] = msg.sender;
        playerAlreadyJoined[msg.sender] = true;
        totalPlayers++;

        console.log("Player joined the game");
        emit PlayerJoined(msg.sender, totalPlayers);
    }

    function closeBettingRound() external onlyFactory onlyGameMaster {
        require(state == GameState.CommitPhase, "Game has not started yet");
        require(totalPlayers >= 3, "Atleast 3 players are required to start the game");

        state = GameState.RevealPhase;
        console.log("Betting round closed");
        emit BettingRoundClosed();
    }

    function determineWinners() external onlyFactory onlyGameMaster {
        require(state == GameState.RevealPhase, "Game has not ended yet");

        uint256 twoThirdAverage = calculateTwoThirdAverage();
        winners = new address[](totalPlayers);
        uint256 minDistance = maxGuess;
        uint256 winnerIndex = 0;

        for (uint i = 0; i < totalPlayers; i++) {
            address currentPlayer = players[i];
            uint256 guess = revealedGuesses[currentPlayer];
            uint256 distance = 0;
            if (guess < twoThirdAverage) {
                distance = twoThirdAverage - guess;
            } else {
                distance = guess - twoThirdAverage;
            }

            if (distance < minDistance) {
                // Clear the winners array, because we have a new minimum value
                for (uint256 u = 0; u < winners.length; u++) {
                    winners[u] = address(0);
                }

                minDistance = distance;
                winnerIndex = 0;
                winners[winnerIndex] = currentPlayer;
            } else if (distance == minDistance) {
                // Multiple winners can be determined if they have the same distance to the result
                winnerIndex++;
                winners[winnerIndex] = currentPlayer;
            }
        }

        state = GameState.Ended;
        emit GameEnded();
    }

    function calculateTwoThirdAverage() private onlyFactory onlyGameMaster returns(uint256 result) {
        uint256 sum = 0;
        uint256 participants = 0;
        uint256 average = 0;

        for (uint i = 0; i < totalPlayers; i++) {
            address currentPlayer = players[i];

            if (playerRevealed[currentPlayer]) {
                if (verifyCommit(players[i])) {
                    console.log("Player revealed their correct values");
                    uint256 guess = revealedGuesses[currentPlayer];

                    if (guess < minGuess || guess > maxGuess) {
                        console.log("Player revealed invalid guess, refund collateralization and bet amount");
                        payoutBetAmount(currentPlayer);
                        payoutCollateral(currentPlayer);
                    } else {
                        sum += guess;
                        participants++;
                    }
                } else {
                    console.log("Player revealed different values, penalize them");
                }
            } else {
                console.log("Player did not reveal their guess, refund collateralization and bet amount");
                payoutBetAmount(currentPlayer);
                payoutCollateral(currentPlayer);
            }
        }

        average = sum / participants;
        result = average * 2 / 3;
    }

    function verifyCommit(address _participant) private view onlyFactory onlyGameMaster returns (bool) {
        require(playerAlreadyJoined[_participant], "Not a valid player address");

        uint256 guess = revealedGuesses[_participant];
        string memory salt = revealedSalts[_participant];
        bytes32 commitment = commitments[_participant];
        bytes32 revealedHash = keccak256(abi.encodePacked(guess, salt));

        return (revealedHash == commitment);
    }

    function payWinners(address[] memory _winners, uint256 totalWinners) private onlyFactory onlyGameMaster {
        uint256 pricePool = totalBetAmount + totalCollateralAmount;
        require(getBalance() >= pricePool, "Not enough funds to payout the winners");

        uint256 priceFromBetAmount = totalBetAmount / totalWinners;
        uint256 priceFromCollateralAmount = totalCollateralAmount / totalWinners;

        for (uint256 i = 0; i < totalWinners; i++) {
            address winner = payable(_winners[i]);
            payoutWinner(winner, priceFromBetAmount, priceFromCollateralAmount);
        }
    }

    function payoutWinner(address _player, uint256 _betAmount, uint256 _collateralAmount) private onlyFactory onlyGameMaster onlyValidPlayers(_player) {
        uint256 payout = _betAmount + _collateralAmount;
        require(getBalance() >= payout, "Not enough funds to payout the winner");

        totalBetAmount -= _betAmount;
        totalCollateralAmount -= _collateralAmount;

        (bool sent, ) = _player.call{value: payout}("");
        require(sent, "Failed to send Ether");
        
        emit PrizeAwarded(_player, payout);
    }

    function payoutBetAmount(address _player) private onlyFactory onlyGameMaster onlyValidPlayers(_player) {
        require(totalBetAmount >= betAmount, "Not enough funds to payout the bet amount");

        totalBetAmount -= betAmount;

        (bool sent, ) = _player.call{value: betAmount}("");
        require(sent, "Failed to send Ether");
        
    }

    function payoutCollateral(address _player) private onlyFactory onlyGameMaster onlyValidPlayers(_player) {
        require(totalCollateralAmount >= collateralAmount, "Not enough funds to payout the collateral amount");
        require(collateralOfPlayer[_player] >= collateralAmount, "Not enough funds to payout the collateral amount");
        
        collateralOfPlayer[_player] -= collateralAmount;
        totalCollateralAmount -= collateralAmount;

        (bool sent, ) = _player.call{value: collateralAmount}("");
        require(sent, "Failed to send Ether");

    }

    function withdrawGameFees() external onlyFactory onlyGameMaster {
        require(getBalance() >= totalGameFees, "Not enough funds to withdraw the game fees");

        totalGameFees = 0;

        (bool sent, ) = msg.sender.call{value: totalGameFees}("");
        require(sent, "Failed to send Ether");

        emit FeeCollected(msg.sender, totalGameFees);
    }

    function revealGuess(uint256 _guess, string memory _salt) external onlyFactory onlyValidPlayers(msg.sender) {
        require(state == GameState.RevealPhase, "Game has not ended yet");

        revealedGuesses[msg.sender] = _guess;
        revealedSalts[msg.sender] = _salt;
        playerRevealed[msg.sender] = true;

        console.log("Player revealed their guess");
        emit PlayerRevealedGuess(msg.sender, _guess, _salt);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}