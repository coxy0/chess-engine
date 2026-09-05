"use client";

import { useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";
import MoveList from "./MoveList";
import TransportControls from "./TransportControls";

const START_FEN = new Chess().fen();

type MoveRecord = { fen: string; san: string; from: Key; to: Key };
export type MovePair = { n: number; white: string; black?: string };

function toDests(chess: Chess) {
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
}

function checkedColor(chess: Chess) {
  if (!chess.inCheck()) return false;
  return chess.turn() === "w" ? "white" : "black";
}

function playRandomMove(game: Chess) {
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;

  const move = moves[Math.floor(Math.random() * moves.length)];
  game.move(move);
  return move;
}

function movePairs(sans: string[]) {
  const pairs: MovePair[] = [];
  for (let i = 0; i < sans.length; i += 2) {
    pairs.push({ n: i / 2 + 1, white: sans[i], black: sans[i + 1] });
  }
  return pairs;
}

export default function Board() {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const moveCountRef = useRef(0);
  const [game] = useState(() => new Chess());
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [viewIndex, setViewIndex] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    function recordMove(move: { san: string; from: string; to: string }) {
      const fen = game.fen();
      moveCountRef.current += 1;
      setMoveHistory((prev) => [
        ...prev,
        { fen, san: move.san, from: move.from as Key, to: move.to as Key },
      ]);
      setViewIndex(moveCountRef.current);
    }

    const api = Chessground(containerRef.current, {
      coordinates: true,
      ranksPosition: "right",
      movable: {
        free: false,
        color: "white",
        dests: toDests(game),
        events: {
          after: (orig, dest) => {
            const move = game.move({
              from: orig as Square,
              to: dest as Square,
              promotion: "q",
            });
            if (!move) return;
            recordMove(move);

            if (!game.isGameOver()) {
              setTimeout(() => {
                const engineMove = playRandomMove(game);
                if (engineMove) recordMove(engineMove);
              }, 300);
            }
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
  }, [viewIndex, moveHistory, game]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setViewIndex((v) => Math.max(0, v - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setViewIndex((v) => Math.min(moveHistory.length, v + 1));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moveHistory.length]);

  const pairs = movePairs(moveHistory.map((m) => m.san));

  return (
    <div className="flex w-full flex-wrap items-start justify-center gap-6 px-4">
      <div
        ref={containerRef}
        className="aspect-square w-full max-w-160 shrink-0"
      />
      <div className="flex h-72 w-full max-w-160 flex-col rounded-md border border-black/10 bg-black/3 sm:h-160 sm:w-80 sm:max-w-none dark:border-white/10 dark:bg-white/3">
        <MoveList
          pairs={pairs}
          moveCount={moveHistory.length}
          viewIndex={viewIndex}
          onSelectPly={setViewIndex}
        />
        <TransportControls
          viewIndex={viewIndex}
          moveCount={moveHistory.length}
          onChange={setViewIndex}
        />
      </div>
    </div>
  );
}
