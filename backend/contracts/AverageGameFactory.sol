// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AverageGame.sol";
import "hardhat/console.sol";

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AverageGameFactory is Ownable {
    uint256 public totalGames = 0;

    address[] private gameProxies;
    address[] private gameMasters;

    modifier onlyGameMaster(uint256 _gameId) {
        require(
            gameMasters[_gameId] == msg.sender,
            "Only game master can call this function"
        );
        _;
    }

    event GameCreated(uint256 indexed gameCount, address indexed gameAddress);

    constructor(address _owner) Ownable(_owner) {}

    function createAverageGame(
        address _address,
        address _gameMaster,
        string memory _name,
        uint256 _maxPlayers,
        uint256 _betAmount,
        uint256 _gameFee
    ) public onlyOwner returns (address) {
        console.log("Creating Game!!!!!");
        address proxy = Clones.clone(_address);
        console.log("Cloned");
        gameProxies.push(proxy);
        console.log("Game Master", _gameMaster);
        gameMasters.push(_gameMaster);
        AverageGame(proxy).initGame({
            _gameId: totalGames,
            _name: _name,
            _minGuess: 0,
            _maxGuess: 1000,
            _maxPlayers: _maxPlayers,
            _betAmount: _betAmount,
            _gameMaster: _gameMaster,
            _gameFee: _gameFee,
            _factory: address(this)
        });

        totalGames++;
        emit GameCreated(totalGames, proxy);
        console.log("Init game called", proxy);

        return proxy;
    }

    function getGameProxies() public view returns (address[] memory) {
        return gameProxies;
    }

    function getGameMasters() public view returns (address[] memory) {
        return gameMasters;
    }

    function getGameProxyAt(
        uint256 _index
    ) public view onlyGameMaster(_index) returns (address) {
        return gameProxies[_index];
    }

    function getGameMasterAt(uint256 _index) public view returns (address) {
        return gameMasters[_index];
    }
}
