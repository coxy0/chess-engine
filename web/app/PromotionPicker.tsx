"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { PIECE_ICONS, type PromotionPieceName } from "./piece-icons";
import type { PendingPromotion, PromotionPiece } from "./types";

const PIECE_ORDER: [PromotionPiece, PromotionPieceName][] = [
  ["q", "queen"],
  ["n", "knight"],
  ["r", "rook"],
  ["b", "bishop"],
];

const PromotionPicker = ({
  container,
  pending,
  onPick,
  onCancel,
}: {
  container: HTMLElement;
  pending: PendingPromotion;
  onPick: (piece: PromotionPiece) => void;
  onCancel: () => void;
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const file = pending.to.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(pending.to[1]);
  const rowTop = 8 - rank;
  const dir = pending.color === "white" ? 1 : -1;

  return createPortal(
    <>
      <div
        className="absolute inset-0 z-10 bg-black/40"
        onClick={onCancel}
        onContextMenu={(e) => {
          e.preventDefault();
          onCancel();
        }}
        role="presentation"
      />
      <div className="pointer-events-none absolute inset-0 z-20">
        {PIECE_ORDER.map(([code, name], i) => (
          <button
            key={code}
            type="button"
            aria-label={`Promote to ${name}`}
            onClick={() => onPick(code)}
            className="pointer-events-auto absolute flex h-[12.5%] w-[12.5%] cursor-pointer items-center justify-center bg-white/95 transition-colors hover:bg-white dark:bg-neutral-800/95 dark:hover:bg-neutral-800"
            style={{
              left: `${(file / 8) * 100}%`,
              top: `${((rowTop + i * dir) / 8) * 100}%`,
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none h-[80%] w-[80%] bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('${PIECE_ICONS[name][pending.color]}')`,
              }}
            />
          </button>
        ))}
      </div>
    </>,
    container,
  );
};

export default PromotionPicker;
