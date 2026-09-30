import { Chess } from "chess.js";
import type { GetEngineMove } from "../types";

export const randomEngineMove: GetEngineMove = async (fen) => {
  const moves = new Chess(fen).moves({ verbose: true });
  if (!moves.length) return null;

  const { from, to, promotion } =
    moves[Math.floor(Math.random() * moves.length)];
  return { from, to, promotion };
};
