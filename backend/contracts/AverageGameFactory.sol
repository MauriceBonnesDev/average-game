// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AverageGame.sol";
import "hardhat/console.sol";

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AverageGameFactory is Ownable {
  uint256 public totalGames;

  mapping(uint256 => address) private gameProxies;
  mapping(uint256 => address) public gameMasters;

  modifier onlyGameMaster(uint256 _gameId) {
    require(gameMasters[_gameId] == msg.sender, "Only game master can call this function");
    _;
  }

  constructor(address _owner) Ownable(_owner) {}

  function createAverageGame(address _address, address _gameMaster) public onlyOwner returns (address) {
    address proxy = Clones.clone(_address);
    totalGames++;
    gameProxies[totalGames] = proxy;
    AverageGame(proxy).initGame(totalGames, "Average Game", 5, 1 ether, _gameMaster);

    return proxy;
  }

  function getAverageGameProxyAt(uint256 _index) public view returns(address) {
    return gameProxies[_index];
  }
}