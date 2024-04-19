// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {UD60x18, mul, div, add, convert, isZero, ZERO} from "@prb/math/src/UD60x18.sol";

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
    uint256 public minGuess;
    uint256 public maxGuess;
    uint256 public gameFee;
    uint256 private totalGameFees;
    int256 private totalPotentialWinners;
    uint256 public blockNumber;
    uint16 public timeToPass = 10;

    string public name;

    address public gameMaster;
    address public winner;
    address[] private players;
    address[] public potentialWinners;

    bool private isInitialized;
    bool public rewardClaimed;
    bool public feeClaimed;

    GameState public state;
    GameIcon public icon;

    struct AverageGameInstance {
        uint256 id;
        string name;
        uint256 entryPrice;
        uint256 totalPlayers;
        uint256 maxPlayers;
        address contractAddress;
        uint256 collateral;
        uint256 gameFee;
        address[] players;
        GameState gameState;
        address gameMaster;
        address winner;
        bool rewardClaimed;
        bool feeClaimed;
        GameIcon icon;
    }

    mapping(address => bytes32) private commitments;
    mapping(address => bool) private playerAlreadyJoined;
    mapping(address => RevealState) private playerRevealed;
    mapping(address => string) private revealedSalts;
    mapping(address => uint256) private revealedGuesses;
    mapping(address => uint256) private collateralOfPlayer;

    enum GameState {
        CommitPhase, // Participants are committing their guesses
        RevealPhase, // Participants are revealing their guesses
        Ended // The game has ended
    }

    enum GameIcon {
        Bar,
        Bell,
        Coin,
        Crown,
        Diamond,
        Horseshoe,
        Seven,
        Shamrock,
        Star
    }

    enum RevealState {
        NotRevealed,
        Revealed,
        Invalid
    }

    modifier onlyGameMaster() {
        require(
            gameMaster == msg.sender,
            "Nur der Spielleiter kann diese Funktion aufrufen!"
        );
        _;
    }

    modifier onlyValidPlayers(address _player) {
        require(
            _player != address(0),
            "Adresse darf nicht die 0x0 Adresse sein!"
        );
        require(
            playerAlreadyJoined[_player],
            "Keine g\xC3\xBCltige Spieleradresse!"
        );
        _;
    }

    modifier onlyWinner() {
        console.log("Winner:", winner);
        console.log("Msg.sender", msg.sender);
        require(
            winner == msg.sender,
            "Nur der Sieger kann diese Funktion aufrufen!"
        );
        _;
    }

    event PlayerJoined(
        uint256 indexed gameId,
        address indexed player,
        uint256 indexed totalPlayersAmount
    );

    event PlayerRevealedGuess(
        uint256 indexed gameId,
        address indexed player,
        uint256 indexed guess,
        string salt,
        RevealState revealState
    );

    event GameCreated(uint256 indexed gameId);
    event GameEnded(uint256 indexed gameId);
    event BettingRoundClosed(uint256 indexed gameId);
    event FeeCollected(
        uint256 indexed gameId,
        address indexed player,
        uint256 indexed amount
    );
    event CollateralDeposited(
        uint256 indexed gameId,
        address indexed player,
        uint256 indexed amount
    );
    event PlayerRefunded(
        uint256 indexed gameId,
        address indexed player,
        uint256 indexed amount
    );
    event WinnerSelected(
        uint256 indexed gameId,
        address indexed winner,
        uint256 indexed amount
    );
    event PrizeAwarded(
        uint256 indexed gameId,
        address indexed player,
        uint256 indexed amount,
        uint256 guess
    );

    /**
     * @notice Initializes the game with the given parameters. The collateral is fixed to be 3 times the bet amount
     * @dev This function is only called once and the only function that does not require the onlyFactory modifier
     * @param _gameId Id of the game
     * @param _name Name of the game
     * @param _maxPlayers Amount of players that can join the game
     * @param _betAmount Bet amount for each player
     * @param _gameMaster Address of the game master
     * @param _gameFee Game fee
     */
    function initGame(
        uint256 _gameId,
        string memory _name,
        uint256 _minGuess,
        uint256 _maxGuess,
        uint256 _maxPlayers,
        uint256 _betAmount,
        address _gameMaster,
        uint256 _gameFee,
        uint256 _icon
    ) external payable {
        require(!isInitialized, "Spiel wurde bereits initialisiert!");
        id = _gameId;
        name = _name;
        minGuess = _minGuess;
        maxGuess = _maxGuess;
        maxPlayers = _maxPlayers;
        betAmount = _betAmount;
        collateralAmount = _betAmount * 3;
        players = new address[](maxPlayers);
        state = GameState.CommitPhase;
        icon = GameIcon(_icon);
        gameFee = _gameFee;
        isInitialized = true;
        gameMaster = _gameMaster;
        blockNumber = block.number;
        emit GameCreated(_gameId);
    }

    /**
     * @notice Allows a player to join the game by committing their guess
     * @dev The guess is hashed on the client side with a salt and stored in the commitments mapping
     * @param _guess The guess of the player
     */
    function joinGame(bytes32 _guess) external payable {
        require(
            state == GameState.CommitPhase,
            "Spiel hat noch nicht begonnen!"
        );
        require(
            msg.sender != gameMaster,
            "Spielleiter kann nicht am eigenen Spiel teilnehmen!"
        );
        require(
            msg.value == collateralAmount + betAmount + gameFee,
            "Unzureichender Betrag: Bitte zahlen Sie den Einsatz, die dreifache Kaution und die Spielgeb\xC3\xBChr!"
        );
        require(
            !playerAlreadyJoined[msg.sender],
            "Spieler ist dem Spiel bereits beigetreten!"
        );

        totalBetAmount += betAmount;
        totalCollateralAmount += collateralAmount;
        collateralOfPlayer[msg.sender] = collateralAmount;
        totalGameFees += gameFee;
        commitments[msg.sender] = _guess;
        players[totalPlayers] = msg.sender;
        playerAlreadyJoined[msg.sender] = true;
        playerRevealed[msg.sender] = RevealState.NotRevealed;
        totalPlayers++;

        console.log("Player joined the game");
        emit PlayerJoined(id, msg.sender, totalPlayers);
    }

    /**
     * @notice Closes the betting round and starts the reveal phase. This is the first function a game master has to call
     * @dev Only allowed once 3 players have joined the game
     */
    function startRevealPhase() external onlyGameMaster {
        require(
            state == GameState.CommitPhase,
            "Reveal Phase kann nur gestartet werden, wenn aktuell die Commit Phase ist!"
        );
        require(
            totalPlayers >= 3,
            "Mindestens 3 Spieler werden ben\xC3\xB6tigt um das Spiel zu starten!"
        );

        state = GameState.RevealPhase;
        blockNumber = block.number;
        console.log("Commit Phase ended, Reveal Phase started");
        emit BettingRoundClosed(id);
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
        require(
            state == GameState.RevealPhase,
            "Reveal Phase hat noch nicht begonnen!"
        );
        RevealState revealState = playerRevealed[msg.sender];
        require(
            revealState == RevealState.NotRevealed,
            "Spieler hat bereits seinen Tipp ver\xC3\xB6ffentlicht!"
        );

        revealedGuesses[msg.sender] = _guess;
        revealedSalts[msg.sender] = _salt;
        revealState = verifyCommit(msg.sender);
        playerRevealed[msg.sender] = revealState;

        if (revealState == RevealState.Revealed) {
            console.log("Player revealed their correct guess");
            payoutCollateral(msg.sender);
        } else {
            console.log(
                "Player revealed an incorrect guess, collateral will not be refunded"
            );
        }

        emit PlayerRevealedGuess(id, msg.sender, _guess, _salt, revealState);
    }

    /**
     * @notice Ends the game and determines the winner. This is the second function a game master has to call
     * @dev This function will be automatically called from within the factory, after the random number has been generated
     */
    function endGame() external onlyGameMaster {
        require(
            state == GameState.RevealPhase,
            "Reveal Phase hat noch nicht begonnen!"
        );

        determinePotentialWinners();

        state = GameState.Ended;
        if (totalPotentialWinners == -1) {
            refundPlayers();
            console.log(
                "No potential winners found, refunding everyone their money"
            );
        } else {
            selectWinner();
            console.log("Winner selected, game ended");
        }

        emit GameEnded(id);
    }

    /**
     * @notice Determines the potential winners of the game by checking the distance of each players guess to the 2/3 average, while only considering the players that correctly revealed their guesses
     * @dev There are multiple potential winners, because multiple players can have the same distance to the result
     * @dev Stores the potential winners in state variable potentialWinners
     */
    function determinePotentialWinners() private {
        require(
            state == GameState.RevealPhase,
            "Reveal Phase hat noch nicht begonnen!"
        );
        console.log("Determining potential winners");
        UD60x18 twoThirdAverage = calculateTwoThirdAverage();

        if (twoThirdAverage == convert(1000)) {
            totalPotentialWinners = -1;
            return;
        }

        potentialWinners = new address[](totalPlayers);
        UD60x18 minDistance = convert(maxGuess);
        uint256 winnerIndex = 0;

        for (uint i = 0; i < totalPlayers; i++) {
            address currentPlayer = players[i];
            UD60x18 guess = convert(revealedGuesses[currentPlayer]);
            UD60x18 distance = ZERO;
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
                console.log("New potential winner found with distance");
            } else if (distance == minDistance) {
                // Multiple potential winners can be determined if they have the same distance to the result
                winnerIndex++;
                potentialWinners[winnerIndex] = currentPlayer;
                console.log(
                    "Another potential winner found with same distance"
                );
            }
        }

        totalPotentialWinners = int256(winnerIndex + 1);
    }

    /**
     * @notice Calculates the 2/3 average of the correctly revealed guesses
     * @dev participants is the amount of players that correctly revealed their guesses
     * @return result The 2/3 average of the correctly revealed guesses
     */
    function calculateTwoThirdAverage() private view returns (UD60x18 result) {
        UD60x18 sum = ZERO;
        UD60x18 participants = ZERO;
        UD60x18 average = ZERO;

        for (uint i = 0; i < totalPlayers; i++) {
            address currentPlayer = players[i];

            if (playerRevealed[currentPlayer] == RevealState.Revealed) {
                console.log("Player revealed their correct values");
                UD60x18 guess = convert(revealedGuesses[currentPlayer]);
                sum = add(sum, guess);
                participants = add(participants, convert(1));
            }
        }

        if (isZero(participants)) {
            return convert(1000);
        }

        average = div(sum, participants);
        result = div(mul(average, convert(2)), convert(3));
    }

    /**
     * @notice Verifies the commitment of a player by comparing the hash of the revealed guess with its salt and the commitment
     * @param _participant The address of the player to verify the commitment
     * @return Either RevealState.Revealed, if the hash and commitment match or RevealState.Invalid if they don't match
     */
    function verifyCommit(
        address _participant
    ) private view returns (RevealState) {
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
     * @dev The winner is selected by using the chainlink VRF if multiple potential winners are found
     */
    function selectWinner() private {
        require(state == GameState.Ended, "Spiel ist noch nicht beendet!");
        uint256 pricePool = totalBetAmount + totalCollateralAmount;
        require(
            getBalance() >= pricePool,
            "Preispool reicht nicht aus um den Gewinner auszuzahlen!"
        );

        if (totalPotentialWinners > 1) {
            uint256 winnerIndex = calculateRandomNumber();
            winner = payable(potentialWinners[winnerIndex]);
        } else {
            winner = payable(potentialWinners[0]);
        }

        emit WinnerSelected(id, winner, pricePool);
    }

    /**
     * @notice Calculates a random number by hashing block parameters, with the salts and guesses by the potential winners
     * @dev the salts and guesses are only available, once the game can't be entered anymore, therefore it's save to say that these values can be used for randomness
     * @return The random number to determine the winner, acts as an index for the potential winners array
     */
    function calculateRandomNumber() private view returns (uint256) {
        bytes memory seed = abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.coinbase,
            block.number,
            block.gaslimit
        );
        for (uint256 i = 0; i < uint256(totalPotentialWinners); i++) {
            address currentPlayer = potentialWinners[i];
            uint256 guess = revealedGuesses[currentPlayer];
            string memory salt = revealedSalts[currentPlayer];
            seed = abi.encodePacked(seed, guess, salt);
        }

        bytes32 seedHash = keccak256(seed);

        return uint256(seedHash) % uint256(totalPotentialWinners);
    }

    /**
     * @notice Withdraws the price pool of the game to the winner
     * @dev can only be called by the winner itself
     * @param _winner address of the winner
     */
    function withdrawPricepool(
        address _winner
    ) external onlyWinner nonReentrant {
        require(state == GameState.Ended, "Spiel ist noch nicht beendet!");
        uint256 payout = totalBetAmount + totalCollateralAmount;
        require(payout > 0, "Kein Preispool vorhanden!");
        require(
            getBalance() >= payout,
            "Preispool reicht nicht aus um den Gewinner auszuzahlen!"
        );

        totalBetAmount = 0;
        totalCollateralAmount = 0;
        rewardClaimed = true;

        (bool sent, ) = _winner.call{value: payout}("");
        require(sent, "Senden von Ether ist fehlgeschlagen!");

        uint256 guess = revealedGuesses[_winner];
        emit PrizeAwarded(id, _winner, payout, guess);
    }

    /**
     * @notice Withdraws the collateral of a player if the player revealed the correct guess
     * @param _player address of the player
     */
    function payoutCollateral(address _player) private nonReentrant {
        require(
            totalCollateralAmount >= collateralAmount,
            "Nicht gen\xC3\xBCgend Ether in dem Vertrag um die Kaution auszuzahlen!"
        );
        require(
            collateralOfPlayer[_player] >= collateralAmount,
            "Hinterlegte Kaution reicht nicht aus!"
        );
        require(
            collateralOfPlayer[_player] >= 0,
            "Kaution wurde bereits ausgezahlt!"
        );
        require(
            playerRevealed[_player] == RevealState.Revealed,
            "Spieler hat seinen Tipp nicht ver\xC3\xB6ffentlicht!"
        );

        collateralOfPlayer[_player] -= collateralAmount;
        totalCollateralAmount -= collateralAmount;

        (bool sent, ) = _player.call{value: collateralAmount}("");
        require(sent, "Senden von Ether fehlgeschlagen!");

        emit CollateralDeposited(id, _player, collateralAmount);
    }

    // ------------------------------ Add refund after a specified time ------------------------------

    /**
     * @notice Refunds their money if no winner was found to prevent malicious behavior by the game master
     * @notice otherwise he could just end the game without a winner and keep the gameFees
     */
    function refundPlayers() private nonReentrant {
        for (uint i = 0; i < totalPlayers; i++) {
            address currentPlayer = players[i];
            uint256 collateral = collateralOfPlayer[currentPlayer];
            uint256 bet = betAmount;
            uint256 fee = totalGameFees / totalPlayers;
            uint256 refund = collateral + bet + fee;

            (bool sent, ) = currentPlayer.call{value: refund}("");
            require(sent, "Senden von Ether fehlgeschlagen!");
            emit PlayerRefunded(id, currentPlayer, refund);
        }
    }

    /**
     * @notice Allows a player to request a refund if the GameMaster does not act, immediately ends the game
     */
    function requestRefund() external onlyValidPlayers(msg.sender) {
        string memory message = string(
            abi.encodePacked(
                "Mindestens ",
                timeToPass,
                " Bl\xC3\xB6cke m\xC3\xBCssen vergangen sein um eine R\xC3\xBCckerstattung zu beantragen!"
            )
        );
        require(blockNumber + timeToPass < block.number, message);
        refundPlayers();
        emit GameEnded(id);
    }

    /**
     * @notice Withdraws the game fees to the game master
     */
    function withdrawGameFees() external onlyGameMaster nonReentrant {
        require(state == GameState.Ended, "Spiel ist noch nicht beendet!");
        require(winner != address(0), "Es wurde noch kein Gewinner gefunden!");
        require(
            getBalance() >= totalGameFees,
            "Nicht gen\xC3\xBCgend Ether in dem Vertrag um die Spielgeb\xC3\xBChr auszuzahlen!"
        );
        uint256 collectedFee = totalGameFees;
        totalGameFees = 0;
        feeClaimed = true;

        (bool sent, ) = msg.sender.call{value: collectedFee}("");
        require(sent, "Senden von Ether fehlgeschlagen!");

        emit FeeCollected(id, msg.sender, collectedFee);
    }

    // ---------------------------------------------
    // ---------------------------------------------
    // ---------- Getter functions ----------
    // ---------------------------------------------
    // ---------------------------------------------

    /**
     * @notice Returns the balance of the contract
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getPlayerRevealedState(
        address _player
    ) public view returns (RevealState) {
        return playerRevealed[_player];
    }

    function getPotentialWinners()
        public
        view
        onlyGameMaster
        returns (address[] memory)
    {
        return potentialWinners;
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    function getAverageGameInstance()
        public
        view
        returns (AverageGameInstance memory)
    {
        return
            AverageGameInstance(
                id,
                name,
                betAmount,
                totalPlayers,
                maxPlayers,
                address(this),
                collateralAmount,
                gameFee,
                players,
                state,
                gameMaster,
                winner,
                rewardClaimed,
                feeClaimed,
                icon
            );
    }
}
