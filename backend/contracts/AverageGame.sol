// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title 2/3-Average Game
 * @author Maurice Bonnes
 * @notice This contract represents a 2/3-Average Game, where players have to guess a number between 0 and 1000.
 * @dev Most of the functions are only external, because the contract is used by the AverageGameFactory contract, which uses the Clone Factory Pattern.
 * @dev Also the onlyFactory modifier is used to restrict access to the functions to the AverageGameFactory contract.
 */
contract AverageGame is ReentrancyGuard {
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
    uint256 private totalGameFees;

    string public name;

    address private gameMaster;
    address public factory;
    address public winner;
    address[] public players;
    address[] public potentialWinners;

    bool private isInitialized;

    GameState public state;

    mapping(address => bytes32) private commitments;
    mapping(address => bool) private playerAlreadyJoined;
    mapping(address => RevealState) private playerRevealed;
    mapping(address => string) private revealedSalts;
    mapping(address => uint256) private revealedGuesses;
    mapping(address => uint256) private collateralOfPlayer;

    enum GameState {
        Initialized, // The game has been created
        CommitPhase, // Participants are committing their guesses
        RevealPhase, // Participants are revealing their guesses
        Ended // The game has ended
    }

    enum RevealState {
        NotRevealed,
        Revealed,
        Invalid
    }

    modifier onlyGameMaster() {
        require(
            gameMaster == msg.sender,
            "Only game master can call this function"
        );
        _;
    }

    modifier onlyValidPlayers(address _player) {
        require(_player != address(0), "Address can't be 0x0");
        require(playerAlreadyJoined[_player], "Not a valid player address");
        _;
    }

    modifier onlyWinner() {
        require(winner == msg.sender, "Only winner can call this function");
        _;
    }

    event PlayerJoined(
        address indexed player,
        uint256 indexed totalPlayersAmount
    );

    event PlayerRevealedGuess(
        address indexed player,
        uint256 indexed guess,
        string indexed salt,
        RevealState revealState
    );

    event GameStarted();
    event GameEnded();
    event BettingRoundClosed();
    event FeeCollected(address indexed player, uint256 indexed amount);
    event CollateralDeposited(address indexed player, uint256 indexed amount);
    event PrizeAwarded(
        address indexed player,
        uint256 indexed amount,
        uint256 indexed guess
    );

    /**
     * @notice Initializes the game with the given parameters. The collateral is fixed to be 3 times the bet amount
     * @dev This function is only called once and the only function that does not require the onlyFactory modifier
     * @param _gameId Id of the game
     * @param _name Name of the game
     * @param _maxPlayers Amount of players that can join the game
     * @param _betAmount Bet amount for each player
     * @param _gameMaster Address of the game master
     * @param _gameFee Game fee as an integer, that represents the percentage
     */
    function initGame(
        uint256 _gameId,
        string memory _name,
        uint256 _maxPlayers,
        uint256 _betAmount,
        address _gameMaster,
        uint256 _gameFee,
        address _factory
    ) external {
        require(!isInitialized, "Game is already initialized");
        id = _gameId;
        name = _name;
        maxPlayers = _maxPlayers;
        betAmount = _betAmount * 1 ether;
        collateralAmount = _betAmount * 3 * 1 ether;
        players = new address[](maxPlayers);
        state = GameState.Initialized;
        gameFee = _gameFee;
        isInitialized = true;
        gameMaster = _gameMaster;
        factory = _factory;
        console.log("Game initialized");
    }

    /**
     * @notice Starts the betting round where players can join the game, first function to call by the game master
     * @dev This function can only be called by the game master and the factory contract
     */
    function startBettingRound() external onlyGameMaster {
        require(state == GameState.Initialized, "Game has already started");
        state = GameState.CommitPhase;
        console.log("Game started");
        emit GameStarted();
    }

    /**
     * @notice Allows a player to join the game by committing their guess
     * @dev The guess is hashed on the client side with a salt and stored in the commitments mapping
     * @param _guess The guess of the player
     */
    function joinGame(bytes32 _guess) external payable {
        uint256 fee = (betAmount * gameFee) / 100;
        require(state == GameState.CommitPhase, "Game has not started yet");
        require(
            msg.value == collateralAmount + betAmount + fee,
            "Insufficient amount, must be the bet amount + 3 times the bet amount as collateral including the game fee"
        );
        require(
            !playerAlreadyJoined[msg.sender],
            "Player has already joined the game"
        );
        totalBetAmount += betAmount;
        totalCollateralAmount += collateralAmount;
        collateralOfPlayer[msg.sender] = collateralAmount;
        totalGameFees += fee;
        commitments[msg.sender] = _guess;

        console.log(totalPlayers);
        players[totalPlayers] = msg.sender;
        console.log(totalPlayers);
        playerAlreadyJoined[msg.sender] = true;
        totalPlayers++;

        console.log("Player joined the game");
        emit PlayerJoined(msg.sender, totalPlayers);
    }

    /**
     * @notice Closes the betting round and starts the reveal phase. This is the second function a game master has to call
     * @dev Only allowed once 3 players have joined the game
     */
    function closeBettingRound() external onlyGameMaster {
        require(state == GameState.CommitPhase, "Game has not started yet");
        require(
            totalPlayers >= 3,
            "Atleast 3 players are required to start the game"
        );

        state = GameState.RevealPhase;
        console.log("Betting round closed");
        emit BettingRoundClosed();
    }

    /**
     * @notice Allows a player to reveal his guess and get his collateral back if he revealed, what he committed
     * @param _guess Guess of the player
     * @param _salt Salt of the player to hash the guess
     */
    function revealGuess(
        uint256 _guess,
        string memory _salt
    ) external onlyValidPlayers(msg.sender) {
        require(state == GameState.RevealPhase, "Game has not ended yet");
        RevealState revealState = playerRevealed[msg.sender];
        require(
            revealState == RevealState.NotRevealed,
            "Player already revealed their guess"
        );

        revealedGuesses[msg.sender] = _guess;
        revealedSalts[msg.sender] = _salt;
        playerRevealed[msg.sender] = verifyCommit(msg.sender);

        if (revealState == RevealState.Revealed) {
            console.log("Player revealed their correct guess");
            payoutCollateral(msg.sender);
        } else {
            console.log(
                "Player revealed an incorrect guess, collateral will not be refunded"
            );
        }

        emit PlayerRevealedGuess(msg.sender, _guess, _salt, revealState);
    }

    /**
     * @notice Ends the game and determines the winner. This is the third function a game master has to call
     */
    function endGame() external onlyGameMaster {
        require(state == GameState.RevealPhase, "Game has not ended yet");

        uint256 totalWinners = determinePotentialWinners();
        selectWinner(potentialWinners, totalWinners);
        console.log("Game ended");

        state = GameState.Ended;
        emit GameEnded();
    }

    /**
     * @notice Determines the potential winners of the game by checking the distance of each players guess to the 2/3 average, while only considering the players that correctly revealed their guesses
     * @dev There are multiple potential winners, because multiple players can have the same distance to the result
     * @dev Stores the potential winners in state variable potentialWinners
     * @return The amount of potential winners
     */
    function determinePotentialWinners()
        private
        onlyGameMaster
        returns (uint256)
    {
        require(state == GameState.RevealPhase, "Game has not ended yet");

        uint256 twoThirdAverage = calculateTwoThirdAverage();
        potentialWinners = new address[](totalPlayers);
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
                for (uint256 u = 0; u < potentialWinners.length; u++) {
                    potentialWinners[u] = address(0);
                }

                minDistance = distance;
                winnerIndex = 0;
                potentialWinners[winnerIndex] = currentPlayer;
            } else if (distance == minDistance) {
                // Multiple potential winners can be determined if they have the same distance to the result
                potentialWinners[winnerIndex] = currentPlayer;
            }

            winnerIndex++;
        }

        return winnerIndex;
    }

    /**
     * @notice Calculates the 2/3 average of the correctly revealed guesses
     * @dev participants is the amount of players that correctly revealed their guesses
     * @return result The 2/3 average of the correctly revealed guesses
     */
    function calculateTwoThirdAverage()
        private
        view
        onlyGameMaster
        returns (uint256 result)
    {
        uint256 sum = 0;
        uint256 participants = 0;
        uint256 average = 0;

        for (uint i = 0; i < totalPlayers; i++) {
            address currentPlayer = players[i];

            if (playerRevealed[currentPlayer] == RevealState.Revealed) {
                console.log("Player revealed their correct values");
                uint256 guess = revealedGuesses[currentPlayer];
                sum += guess;
                participants++;
            }
        }

        average = sum / participants;
        result = (average * 2) / 3;
    }

    /**
     * @notice Verifies the commitment of a player by comparing the hash of the revealed guess with its salt and the commitment
     * @param _participant The address of the player to verify the commitment
     * @return Either RevealState.Revealed, if the hash and commitment match or RevealState.Invalid if they don't match
     */
    function verifyCommit(
        address _participant
    )
        private
        view
        onlyGameMaster
        onlyValidPlayers(_participant)
        returns (RevealState)
    {
        uint256 guess = revealedGuesses[_participant];
        string memory salt = revealedSalts[_participant];
        bytes32 commitment = commitments[_participant];
        bytes32 revealedHash = keccak256(abi.encodePacked(guess, salt));

        return
            (revealedHash == commitment)
                ? RevealState.Revealed
                : RevealState.Invalid;
    }

    /**
     * @notice Selects the winner of the game by using randomness if there are multiple potential winners
     * @dev The winner is selected by using the chainlink VRF
     * @param _potentialWinners The potential winners of the game
     * @param _totalPotentialWinners The amount of potential winners
     */
    function selectWinner(
        address[] memory _potentialWinners,
        uint256 _totalPotentialWinners
    ) private onlyGameMaster {
        require(state == GameState.Ended, "Game has not ended yet");
        uint256 pricePool = totalBetAmount + totalCollateralAmount;
        require(
            getBalance() >= pricePool,
            "Not enough funds to payout the winners"
        );

        // Adjust randomness by using chainlink VRF
        if (_totalPotentialWinners > 1) {
            uint256 randomIndex = uint256(
                keccak256(abi.encodePacked(block.timestamp, block.prevrandao))
            ) % _totalPotentialWinners;
            winner = payable(_potentialWinners[randomIndex]);
        } else {
            winner = payable(_potentialWinners[0]);
        }
    }

    /**
     * @notice Withdraws the price pool of the game to the winner
     * @dev can only be called by the winner itself
     * @param _winner address of the winner
     */
    function withdrawPricepool(
        address _winner
    ) external onlyWinner nonReentrant {
        require(state == GameState.Ended, "Game has not ended yet");
        uint256 payout = totalBetAmount + totalCollateralAmount;
        require(
            getBalance() >= payout,
            "Not enough funds to payout the winner"
        );

        totalBetAmount = 0;
        totalCollateralAmount = 0;

        (bool sent, ) = _winner.call{value: payout}("");
        require(sent, "Failed to send Ether");

        uint256 guess = revealedGuesses[_winner];
        emit PrizeAwarded(_winner, payout, guess);
    }

    /**
     * @notice Withdraws the collateral of a player if the player revealed the correct guess
     * @param _player address of the player
     */
    function payoutCollateral(
        address _player
    ) private onlyGameMaster onlyValidPlayers(_player) nonReentrant {
        require(
            totalCollateralAmount >= collateralAmount,
            "Not enough funds to payout the collateral amount"
        );
        require(
            collateralOfPlayer[_player] >= collateralAmount,
            "Not enough funds to payout the collateral amount"
        );
        require(
            playerRevealed[_player] == RevealState.Revealed,
            "Player did not reveal their guess"
        );

        collateralOfPlayer[_player] -= collateralAmount;
        totalCollateralAmount -= collateralAmount;

        (bool sent, ) = _player.call{value: collateralAmount}("");
        require(sent, "Failed to send Ether");

        emit CollateralDeposited(_player, collateralAmount);
    }

    /**
     * @notice Withdraws the game fees to the game master
     */
    function withdrawGameFees() external onlyGameMaster nonReentrant {
        require(
            getBalance() >= totalGameFees,
            "Not enough funds to withdraw the game fees"
        );

        totalGameFees = 0;

        (bool sent, ) = msg.sender.call{value: totalGameFees}("");
        require(sent, "Failed to send Ether");

        emit FeeCollected(msg.sender, totalGameFees);
    }

    /**
     * @notice Returns the balance of the contract
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
