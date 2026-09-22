"use client";

import { createPortal } from "react-dom";
import type { Key } from "@lichess-org/chessground/types";
import { PIECE_ICONS, type PromotionPieceName } from "./piece-icons";

export type PromotionPiece = "q" | "n" | "r" | "b";
export type PendingPromotion = { from: Key; to: Key; color: "white" | "black" };

const PIECE_ORDER: { code: PromotionPiece; name: PromotionPieceName }[] = [
  { code: "q", name: "queen" },
  { code: "n", name: "knight" },
  { code: "r", name: "rook" },
  { code: "b", name: "bishop" },
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
      <div className="absolute inset-0 z-20" style={{ pointerEvents: "none" }}>
        {PIECE_ORDER.map((piece, i) => {
          const row = rowTop + i * dir;
          return (
            <button
              key={piece.code}
              type="button"
              aria-label={`Promote to ${piece.name}`}
              onClick={() => onPick(piece.code)}
              className="absolute flex cursor-pointer items-center justify-center bg-white/95 transition-colors hover:bg-white dark:bg-neutral-800/95 dark:hover:bg-neutral-800"
              style={{
                pointerEvents: "auto",
                left: `${(file / 8) * 100}%`,
                top: `${(row / 8) * 100}%`,
                width: "12.5%",
                height: "12.5%",
              }}
            >
              <div
                aria-hidden
                style={{
                  width: "80%",
                  height: "80%",
                  backgroundImage: `url('${PIECE_ICONS[piece.name][pending.color]}')`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  pointerEvents: "none",
                }}
              />
            </button>
          );
        })}
      </div>
    </>,
    container,
  );
};

export default PromotionPicker;
