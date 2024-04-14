// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AverageGame.sol";
import "hardhat/console.sol";

import "@openzeppelin/contracts/proxy/Clones.sol";

contract AverageGameFactory {
    uint256 public totalGames = 0;

    address[] private gameProxies;
    address[] private gameMasters;

    event GameCreated(uint256 indexed gameCount, address indexed gameAddress);

    function createAverageGame(
        address _address,
        string memory _name,
        uint256 _maxPlayers,
        uint256 _betAmount,
        uint256 _gameFee
    ) public returns (address) {
        console.log("Creating Game!!!!!");
        address proxy = Clones.clone(_address);
        console.log("Cloned");
        gameProxies.push(proxy);
        console.log("Game Master", msg.sender);
        gameMasters.push(msg.sender);
        AverageGame(proxy).initGame({
            _gameId: totalGames,
            _name: _name,
            _minGuess: 0,
            _maxGuess: 1000,
            _maxPlayers: _maxPlayers,
            _betAmount: _betAmount,
            _gameMaster: msg.sender,
            _gameFee: _gameFee
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

    function getGameProxyAt(uint256 _index) public view returns (address) {
        return gameProxies[_index];
    }

    function getGameMasterAt(uint256 _index) public view returns (address) {
        return gameMasters[_index];
    }
}
