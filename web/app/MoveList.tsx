"use client";

import { useEffect, useRef } from "react";
import type { MovePair } from "./Board";

function moveClass(ply: number, viewIndex: number) {
  return ply === viewIndex
    ? "bg-black/10 dark:bg-white/10"
    : "hover:bg-black/5 dark:hover:bg-white/5";
}

function MoveButton({
  ply,
  san,
  viewIndex,
  onSelect,
}: {
  ply: number;
  san: string | undefined;
  viewIndex: number;
  onSelect: (ply: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => san && onSelect(ply)}
      data-ply={ply}
      disabled={!san}
      className={`w-full cursor-pointer px-2 py-1 text-left outline-none ${san ? moveClass(ply, viewIndex) : ""}`}
    >
      {san ?? ""}
    </button>
  );
}

export default function MoveList({
  pairs,
  moveCount,
  viewIndex,
  onSelectPly,
}: {
  pairs: MovePair[];
  moveCount: number;
  viewIndex: number;
  onSelectPly: (ply: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lastRowStartPly = Math.ceil(moveCount / 2) * 2 - 1;

    if (viewIndex <= 2) {
      container.scrollTo({ top: 0 });
    } else if (viewIndex >= lastRowStartPly) {
      container.scrollTo({ top: container.scrollHeight });
    } else {
      container
        .querySelector<HTMLElement>(`[data-ply="${viewIndex}"]`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [viewIndex, moveCount]);

  return (
    <div
      ref={containerRef}
      className="move-list flex-1 overflow-y-auto px-2 py-2"
    >
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
              className="grid grid-cols-[1.5rem_1fr_1fr] font-mono text-sm"
            >
              <span className="flex items-center py-1 text-black/40 dark:text-white/40">
                {pair.n}.
              </span>
              <MoveButton
                ply={whitePly}
                san={pair.white}
                viewIndex={viewIndex}
                onSelect={onSelectPly}
              />
              <MoveButton
                ply={blackPly}
                san={pair.black}
                viewIndex={viewIndex}
                onSelect={onSelectPly}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
