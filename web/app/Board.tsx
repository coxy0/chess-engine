"use client";

import { useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";

const START_FEN = new Chess().fen();

type MoveRecord = { fen: string; san: string; from: Key; to: Key };

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
  const pairs: { n: number; white: string; black?: string }[] = [];
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
    return () => api.destroy();
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
  const isLive = viewIndex === moveHistory.length;

  function moveClass(ply: number) {
    return ply === viewIndex
      ? "rounded-sm bg-black/10 px-1 -mx-1 dark:bg-white/10"
      : "rounded-sm px-1 -mx-1 hover:bg-black/5 dark:hover:bg-white/5";
  }

  return (
    <div className="flex w-full flex-wrap items-stretch justify-center gap-6 px-4">
      <div
        ref={containerRef}
        className="aspect-square w-full max-w-160 shrink-0"
      />
      <div className="flex w-full max-w-160 flex-col rounded-md border border-black/10 bg-black/3 sm:w-64 sm:max-w-none dark:border-white/10 dark:bg-white/3">
        <div className="max-h-64 flex-1 overflow-y-auto px-2 py-2 sm:max-h-none">
          {pairs.length === 0 ? (
            <div className="px-2 py-2 text-sm text-black/40 dark:text-white/40">
              No moves yet
            </div>
          ) : (
            pairs.map((pair) => {
              const whitePly = (pair.n - 1) * 2 + 1;
              const blackPly = (pair.n - 1) * 2 + 2;
              return (
                <div
                  key={pair.n}
                  className="grid grid-cols-[1.5rem_1fr_1fr] gap-2 px-2 py-1 font-mono text-sm"
                >
                  <span className="text-black/40 dark:text-white/40">
                    {pair.n}.
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewIndex(whitePly)}
                    className={`w-full cursor-pointer text-left ${moveClass(whitePly)}`}
                  >
                    {pair.white}
                  </button>
                  <button
                    type="button"
                    onClick={() => pair.black && setViewIndex(blackPly)}
                    disabled={!pair.black}
                    className={`w-full cursor-pointer text-left ${pair.black ? moveClass(blackPly) : ""}`}
                  >
                    {pair.black ?? ""}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="flex gap-1 border-t border-black/10 p-2 dark:border-white/10">
          <button
            type="button"
            onClick={() => setViewIndex(0)}
            disabled={viewIndex === 0}
            className="flex-1 rounded-sm py-1 text-sm text-black/60 hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent dark:text-white/60 dark:hover:bg-white/5"
          >
            |&lt;
          </button>
          <button
            type="button"
            onClick={() => setViewIndex((v) => Math.max(0, v - 1))}
            disabled={viewIndex === 0}
            className="flex-1 rounded-sm py-1 text-sm text-black/60 hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent dark:text-white/60 dark:hover:bg-white/5"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={() =>
              setViewIndex((v) => Math.min(moveHistory.length, v + 1))
            }
            disabled={isLive}
            className="flex-1 rounded-sm py-1 text-sm text-black/60 hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent dark:text-white/60 dark:hover:bg-white/5"
          >
            &gt;
          </button>
          <button
            type="button"
            onClick={() => setViewIndex(moveHistory.length)}
            disabled={isLive}
            className="flex-1 rounded-sm py-1 text-sm text-black/60 hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent dark:text-white/60 dark:hover:bg-white/5"
          >
            &gt;|
          </button>
        </div>
      </div>
    </div>
  );
}
