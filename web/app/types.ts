import type { Key } from "@lichess-org/chessground/types";
import type { MoveSoundKind } from "./sounds";

export type Color = "white" | "black";
export type MoveRecord = {
  fen: string;
  san: string;
  from: Key;
  to: Key;
  sound: MoveSoundKind;
};
export type MovePair = { n: number; white: string; black?: string };
export type GameResult = { token: string; reason: string; draw: boolean };
export type EngineMove = { from: string; to: string; promotion?: string };
export type GetEngineMove = (fen: string) => Promise<EngineMove | null>;
export type PromotionPiece = "q" | "n" | "r" | "b";
export type PendingPromotion = { from: Key; to: Key; color: Color };
