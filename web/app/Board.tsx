"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";
import MoveList from "./MoveList";
import TransportControls from "./TransportControls";
import GameControls from "./GameControls";
import PromotionPicker from "./PromotionPicker";
import { playMoveSound } from "./sounds";
import {
  START_FEN,
  checkedColor,
  drawKingShapes,
  gameResult,
  movableFor,
  movePairs,
  soundForMove,
  turnColor,
} from "./lib/chess";
import { randomEngineMove } from "./lib/engine-player";
import type {
  GetEngineMove,
  MoveRecord,
  PendingPromotion,
  PromotionPiece,
} from "./types";

const ENGINE_MOVE_DELAY_MS = 300;

const Board = ({
  getEngineMove = randomEngineMove,
}: {
  getEngineMove?: GetEngineMove;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const userMoveRef = useRef<(orig: Key, dest: Key, premove: boolean) => void>(
    () => {},
  );
  const moveCountRef = useRef(0);
  const gameIdRef = useRef(0);
  const [game] = useState(() => new Chess());
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [viewIndex, setViewIndex] = useState(0);
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null);
  const [boardEl, setBoardEl] = useState<HTMLDivElement | null>(null);

  const setContainer = (el: HTMLDivElement | null) => {
    containerRef.current = el;
    setBoardEl(el);
  };

  const recordMove = (move: Move) => {
    const fen = game.fen();
    const sound = soundForMove(move, game);
    moveCountRef.current += 1;
    setMoveHistory((prev) => [
      ...prev,
      { fen, san: move.san, from: move.from as Key, to: move.to as Key, sound },
    ]);
    setViewIndex(moveCountRef.current);
    playMoveSound(sound);
  };

  const maybePlayEngineMove = () => {
    if (game.isGameOver()) return;

    const gameId = gameIdRef.current;
    const delay = new Promise((resolve) =>
      setTimeout(resolve, ENGINE_MOVE_DELAY_MS),
    );
    Promise.all([getEngineMove(game.fen()), delay]).then(([engineMove]) => {
      if (gameId !== gameIdRef.current || !engineMove) return;

      const move = game.move(engineMove);
      if (move) recordMove(move);
    });
  };

  const playPlayerMove = (move: Move) => {
    recordMove(move);
    maybePlayEngineMove();
  };

  const handleUserMove = (orig: Key, dest: Key, premove: boolean) => {
    const from = orig as Square;
    const to = dest as Square;
    const isPromotion = game
      .moves({ square: from, verbose: true })
      .some((m) => m.to === to && m.promotion);

    if (isPromotion && !premove) {
      setPendingPromotion({ from: orig, to: dest, color: turnColor(game) });
      return;
    }

    const move = game.move(
      isPromotion ? { from, to, promotion: "q" } : { from, to },
    );
    if (move) playPlayerMove(move);
  };

  const resolvePromotion = (piece: PromotionPiece) => {
    if (!pendingPromotion) return;

    const move = game.move({
      from: pendingPromotion.from as Square,
      to: pendingPromotion.to as Square,
      promotion: piece,
    });
    setPendingPromotion(null);
    if (move) playPlayerMove(move);
  };

  const cancelPromotion = () => {
    setPendingPromotion(null);
    apiRef.current?.set({
      fen: game.fen(),
      turnColor: turnColor(game),
      check: checkedColor(game),
      movable: movableFor(game, true),
    });
  };

  const stepView = useCallback(
    (nextIndex: number) => {
      if (nextIndex !== viewIndex) {
        const passedMove = moveHistory[Math.min(viewIndex, nextIndex)];
        playMoveSound(passedMove ? passedMove.sound : "move");
      }
      setViewIndex(nextIndex);
    },
    [viewIndex, moveHistory],
  );

  // The board's sync effect below re-applies the starting position.
  const restart = () => {
    game.reset();
    gameIdRef.current += 1;
    moveCountRef.current = 0;
    setPendingPromotion(null);
    setMoveHistory([]);
    setViewIndex(0);
  };

  useEffect(() => {
    userMoveRef.current = handleUserMove;
  });

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
        ...movableFor(game, true),
        events: {
          after: (orig, dest, metadata) =>
            userMoveRef.current(orig, dest, metadata.premove),
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
    const canPlay = isLive && !position.isGameOver();

    api.set({
      fen,
      lastMove: record ? [record.from, record.to] : undefined,
      turnColor: turnColor(position),
      check: checkedColor(position),
      viewOnly: !isLive,
      movable: movableFor(game, canPlay),
      premovable: { enabled: canPlay },
      drawable: {
        autoShapes:
          isLive && gameResult(game)?.draw ? drawKingShapes(game) : [],
      },
    });

    if (canPlay && position.turn() === "w") api.playPremove();
  }, [viewIndex, moveHistory, game]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !pendingPromotion) return;

    api.set({ movable: movableFor(game, false) });
  }, [pendingPromotion, game]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepView(Math.max(0, viewIndex - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepView(Math.min(moveHistory.length, viewIndex + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewIndex, moveHistory.length, stepView]);

  const pairs = movePairs(moveHistory.map((m) => m.san));
  const isGameOver = game.isGameOver();
  const result = gameResult(game);

  return (
    <div className="flex w-full flex-wrap items-start justify-center gap-6 px-4 md:flex-nowrap md:[--list-w:clamp(16rem,28vw,24rem)] md:[--board:min(44rem,calc(100vw-var(--list-w)-3.5rem))]">
      <div
        className="aspect-square w-full max-w-160 shrink-0 md:w-(--board) md:max-w-none"
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
      <div className="flex h-72 w-full max-w-160 flex-col rounded-md border border-black/10 bg-black/3 md:h-(--board) md:w-(--list-w) dark:border-white/10 dark:bg-white/3">
        <MoveList
          pairs={pairs}
          moveCount={moveHistory.length}
          viewIndex={viewIndex}
          result={result}
          onSelectPly={setViewIndex}
        />
        <GameControls
          key={moveHistory.length}
          moveCount={moveHistory.length}
          isGameOver={isGameOver}
          onRestart={restart}
        />
        <TransportControls
          viewIndex={viewIndex}
          moveCount={moveHistory.length}
          onJump={setViewIndex}
          onStep={stepView}
        />
      </div>
    </div>
  );
};

export default Board;
