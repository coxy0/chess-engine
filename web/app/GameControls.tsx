"use client";

import { useState } from "react";
import { CheckIcon, CrossIcon } from "./icons";
import { PLAYER_COLOR } from "./lib/chess";

const MOVES_BEFORE_END_BUTTON = PLAYER_COLOR === "white" ? 1 : 2;

const footerButtonClass =
  "cursor-pointer border-t border-black/10 py-2 text-sm font-medium text-black/70 hover:bg-black/5 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5";

// Render with `key={moveCount}` so a pending confirm is dismissed by any move.
const GameControls = ({
  moveCount,
  isGameOver,
  onRestart,
}: {
  moveCount: number;
  isGameOver: boolean;
  onRestart: () => void;
}) => {
  const [confirming, setConfirming] = useState(false);

  if (isGameOver) {
    return (
      <button type="button" onClick={onRestart} className={footerButtonClass}>
        Restart
      </button>
    );
  }

  if (moveCount < MOVES_BEFORE_END_BUTTON) return null;

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={footerButtonClass}
      >
        Resign
      </button>
    );
  }

  return (
    <div className="grid grid-cols-4 items-center gap-1 border-t border-black/10 px-8 py-2 dark:border-white/10">
      <span className="col-span-2 flex items-center pl-[calc(25%-9px)] text-sm font-medium text-red-600 dark:text-red-400">
        Are you sure?
      </span>
      <button
        type="button"
        aria-label="Confirm resign"
        title="Confirm resign"
        onClick={onRestart}
        className="mr-[calc(9.5px-37.5%)] flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center justify-self-end rounded-sm text-green-600 hover:bg-black/10 dark:text-green-400 dark:hover:bg-white/10"
      >
        <CheckIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Cancel resign"
        title="Cancel resign"
        onClick={() => setConfirming(false)}
        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center justify-self-center rounded-sm text-red-600 hover:bg-black/10 dark:text-red-400 dark:hover:bg-white/10"
      >
        <CrossIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default GameControls;
