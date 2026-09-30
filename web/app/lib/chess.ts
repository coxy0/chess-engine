import { Chess, type Move } from "chess.js";
import type { Key } from "@lichess-org/chessground/types";
import type { DrawShape } from "@lichess-org/chessground/draw";
import type { GameResult, MovePair } from "../types";

export const START_FEN = new Chess().fen();

export const toDests = (chess: Chess) => {
  const dests = new Map<Key, Key[]>();
  for (const square of chess.board().flat()) {
    if (!square) continue;

    const moves = chess.moves({ square: square.square, verbose: true });
    if (moves.length) {
      dests.set(
        square.square,
        moves.map((move) => move.to),
      );
    }
  }

  return dests;
};

export const checkedColor = (chess: Chess) => {
  if (!chess.inCheck()) return false;
  return chess.turn() === "w" ? "white" : "black";
};

export const gameResult = (chess: Chess): GameResult | null => {
  if (chess.isCheckmate()) {
    return chess.turn() === "w"
      ? { token: "0-1", reason: "Checkmate" }
      : { token: "1-0", reason: "Checkmate" };
  }
  if (!chess.isGameOver()) return null;

  const reason = chess.isStalemate()
    ? "Stalemate"
    : chess.isInsufficientMaterial()
      ? "Insufficient material"
      : chess.isThreefoldRepetition()
        ? "Threefold repetition"
        : "Fifty-move rule";
  return { token: "½-½", reason };
};

export const drawKingShapes = (chess: Chess): DrawShape[] =>
  chess
    .board()
    .flat()
    .filter((sq) => sq?.type === "k")
    .map((sq) => ({
      orig: sq!.square as Key,
      below: true,
      customSvg: {
        html: `<defs><radialGradient id="draw-${sq!.square}" gradientUnits="userSpaceOnUse" cx="50" cy="50" r="70.7"><stop offset="0" stop-color="rgb(140,140,140)"/><stop offset="0.25" stop-color="rgb(140,140,140)"/><stop offset="0.89" stop-color="rgb(140,140,140)" stop-opacity="0"/></radialGradient></defs><rect width="100" height="100" fill="url(#draw-${sq!.square})"/>`,
      },
    }));

export const soundForMove = (move: Move, gameAfterMove: Chess) => {
  if (gameAfterMove.isCheckmate()) return "checkmate" as const;
  if (move.promotion) return "promote" as const;
  if (move.isKingsideCastle() || move.isQueensideCastle())
    return "castle" as const;
  if (move.isCapture()) return "capture" as const;
  if (gameAfterMove.inCheck()) return "check" as const;
  return "move" as const;
};

export const movePairs = (sans: string[]) => {
  const pairs: MovePair[] = [];
  for (let i = 0; i < sans.length; i += 2) {
    pairs.push({ n: i / 2 + 1, white: sans[i], black: sans[i + 1] });
  }
  return pairs;
};
