import type { AverageGameModule_AverageGame as TAverageGame } from "../../types/ethers-contracts/AverageGameModule_AverageGame";

export type Size = "small" | "medium" | "large" | "round";
export type Style = "light" | "dark" | "grey";
export type Color = "purple" | "orange" | "green" | "turquoise" | "grey";
export type GameSettings = {
  contractAddress: string;
  gameMaster: string;
  name: string;
  maxPlayers: number;
  betAmount: number;
  gameFee: number;
};

export enum GameState {
  "CommitPhase",
  "RevealPhase",
  "Ended",
}

export enum RevealState {
  "NotRevealed",
  "Revealed",
  "Invalid",
}

export type AverageGameInstance = {
  id: number;
  name: string;
  entryPrice: string;
  totalPlayers: number;
  maxPlayers: number;
  contract: TAverageGame;
  address: string;
  collateral: string;
  gameFee: string;
  players: string[];
  gameState: GameState;
  gameMaster: string;
  winner: string;
  rewardClaimed: boolean;
};
