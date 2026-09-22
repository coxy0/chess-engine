"use client";

import { useEffect, useRef, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";
import MoveList from "./MoveList";
import TransportControls from "./TransportControls";
import PromotionPicker, {
  type PendingPromotion,
  type PromotionPiece,
} from "./PromotionPicker";
import { playMoveSound } from "./sounds";

const START_FEN = new Chess().fen();
const PLAYER_COLOR: "white" | "black" = "white";
const MOVES_BEFORE_END_BUTTON = PLAYER_COLOR === "white" ? 1 : 2;

type MoveRecord = { fen: string; san: string; from: Key; to: Key };
export type MovePair = { n: number; white: string; black?: string };

const toDests = (chess: Chess) => {
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

const checkedColor = (chess: Chess) => {
  if (!chess.inCheck()) return false;
  return chess.turn() === "w" ? "white" : "black";
};

const soundForMove = (move: Move, gameAfterMove: Chess) => {
  if (gameAfterMove.isCheckmate()) return "checkmate" as const;
  if (move.promotion) return "promote" as const;
  if (move.isKingsideCastle() || move.isQueensideCastle())
    return "castle" as const;
  if (move.isCapture()) return "capture" as const;
  if (gameAfterMove.inCheck()) return "check" as const;
  return "move" as const;
};

const playRandomMove = (game: Chess) => {
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;

  const move = moves[Math.floor(Math.random() * moves.length)];
  game.move(move);
  return move;
};

const movePairs = (sans: string[]) => {
  const pairs: MovePair[] = [];
  for (let i = 0; i < sans.length; i += 2) {
    pairs.push({ n: i / 2 + 1, white: sans[i], black: sans[i + 1] });
  }
  return pairs;
};

const Board = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const moveCountRef = useRef(0);
  const [game] = useState(() => new Chess());
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [viewIndex, setViewIndex] = useState(0);
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null);
  const [boardEl, setBoardEl] = useState<HTMLDivElement | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setContainer = (el: HTMLDivElement | null) => {
    containerRef.current = el;
    setBoardEl(el);
  };

  const recordMove = (move: Move) => {
    const fen = game.fen();
    moveCountRef.current += 1;
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    setConfirmingEnd(false);
    setMoveHistory((prev) => [
      ...prev,
      { fen, san: move.san, from: move.from as Key, to: move.to as Key },
    ]);
    setViewIndex(moveCountRef.current);
    playMoveSound(soundForMove(move, game));
  };

  const maybePlayEngineMove = () => {
    if (game.isGameOver()) return;

    setTimeout(() => {
      const engineMove = playRandomMove(game);
      if (engineMove) recordMove(engineMove);
    }, 300);
  };

  const resolvePromotion = (piece: PromotionPiece) => {
    if (!pendingPromotion) return;

    const move = game.move({
      from: pendingPromotion.from as Square,
      to: pendingPromotion.to as Square,
      promotion: piece,
    });
    setPendingPromotion(null);
    if (!move) return;

    recordMove(move);
    maybePlayEngineMove();
  };

  const cancelPromotion = () => {
    setPendingPromotion(null);
    apiRef.current?.set({
      fen: game.fen(),
      turnColor: game.turn() === "w" ? "white" : "black",
      check: checkedColor(game),
      movable: { free: false, color: "white", dests: toDests(game) },
    });
  };

  const handleEndOrRestartClick = () => {
    if (game.isCheckmate()) {
      restart();
      return;
    }

    if (confirmingEnd) {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      setConfirmingEnd(false);
      restart();
      return;
    }

    setConfirmingEnd(true);
    confirmTimeoutRef.current = setTimeout(() => setConfirmingEnd(false), 3000);
  };

  const restart = () => {
    game.reset();
    moveCountRef.current = 0;
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    setConfirmingEnd(false);
    setPendingPromotion(null);
    setMoveHistory([]);
    setViewIndex(0);
    apiRef.current?.set({
      fen: START_FEN,
      lastMove: undefined,
      turnColor: "white",
      check: false,
      viewOnly: false,
      movable: { free: false, color: "white", dests: toDests(game) },
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const api = Chessground(containerRef.current, {
      coordinates: true,
      ranksPosition: "right",
      premovable: {
        enabled: true,
        showDests: true,
      },
      movable: {
        free: false,
        color: "white",
        dests: toDests(game),
        events: {
          after: (orig, dest, metadata) => {
            const from = orig as Square;
            const to = dest as Square;
            const isPromotion = game
              .moves({ square: from, verbose: true })
              .some((m) => m.to === to && m.promotion);

            if (isPromotion && !metadata.premove) {
              setPendingPromotion({
                from: orig as Key,
                to: dest as Key,
                color: game.turn() === "w" ? "white" : "black",
              });
              return;
            }

            const move = game.move(
              isPromotion ? { from, to, promotion: "q" } : { from, to },
            );
            if (!move) return;

            recordMove(move);
            maybePlayEngineMove();
          },
        },
      },
    });

    apiRef.current = api;

    const resizeObserver = new ResizeObserver(() => api.redrawAll());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      api.destroy();
    };
    // recordMove/maybePlayEngineMove intentionally captured once at mount;
    // they close over stable setters and the single `game` instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;

    const isLive = viewIndex === moveHistory.length;
    const record = viewIndex > 0 ? moveHistory[viewIndex - 1] : undefined;
    const fen = record ? record.fen : START_FEN;
    const position = new Chess(fen);

    api.set({
      fen,
      lastMove: record ? [record.from, record.to] : undefined,
      turnColor: position.turn() === "w" ? "white" : "black",
      check: checkedColor(position),
      viewOnly: !isLive,
      movable: isLive
        ? { free: false, color: "white", dests: toDests(game) }
        : { free: false, dests: new Map() },
    });

    if (isLive && position.turn() === "w") api.playPremove();
  }, [viewIndex, moveHistory, game]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !pendingPromotion) return;

    api.set({ movable: { free: false, dests: new Map() } });
  }, [pendingPromotion]);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pendingPromotion) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelPromotion();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingPromotion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setViewIndex((v) => Math.max(0, v - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setViewIndex((v) => Math.min(moveHistory.length, v + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moveHistory.length]);

  const pairs = movePairs(moveHistory.map((m) => m.san));
  const isCheckmate = game.isCheckmate();
  const showEndButton =
    isCheckmate || moveHistory.length >= MOVES_BEFORE_END_BUTTON;

  return (
    <div className="flex w-full flex-wrap items-start justify-center gap-6 px-4">
      <div
        className="aspect-square w-full max-w-160 shrink-0"
        ref={setContainer}
      >
        {pendingPromotion && boardEl && (
          <PromotionPicker
            container={boardEl}
            pending={pendingPromotion}
            onPick={resolvePromotion}
            onCancel={cancelPromotion}
          />
        )}
      </div>
      <div className="flex h-72 w-full max-w-160 flex-col rounded-md border border-black/10 bg-black/3 sm:h-160 sm:w-80 sm:max-w-none dark:border-white/10 dark:bg-white/3">
        <MoveList
          pairs={pairs}
          moveCount={moveHistory.length}
          viewIndex={viewIndex}
          onSelectPly={setViewIndex}
        />
        {showEndButton && (
          <button
            type="button"
            onClick={handleEndOrRestartClick}
            className={`cursor-pointer border-t border-black/10 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5 ${
              confirmingEnd
                ? "text-red-600 dark:text-red-400"
                : "text-black/70 dark:text-white/70"
            }`}
          >
            {isCheckmate
              ? "Restart"
              : confirmingEnd
                ? "Are you sure?"
                : "Resign"}
          </button>
        )}
        <TransportControls
          viewIndex={viewIndex}
          moveCount={moveHistory.length}
          onChange={setViewIndex}
        />
      </div>
    </div>
  );
};

export default Board;
