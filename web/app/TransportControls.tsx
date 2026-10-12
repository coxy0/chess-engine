import type { ReactNode } from "react";
import { ChevronIcon, SkipIcon } from "./icons";

const TransportButton = ({
  onClick,
  disabled,
  label,
  icon,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  icon: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="flex flex-1 items-center justify-center rounded-sm py-1.5 text-black/60 hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent dark:text-white/60 dark:hover:bg-white/5"
  >
    {icon}
  </button>
);

const TransportControls = ({
  viewIndex,
  moveCount,
  onJump,
  onStep,
}: {
  viewIndex: number;
  moveCount: number;
  onJump: (viewIndex: number) => void;
  onStep: (viewIndex: number) => void;
}) => {
  const isLive = viewIndex === moveCount;

  return (
    <div className="flex gap-1 border-t border-black/10 p-2 dark:border-white/10">
      <TransportButton
        onClick={() => onJump(0)}
        disabled={viewIndex === 0}
        label="First move"
        icon={<SkipIcon className="h-4 w-4" />}
      />
      <TransportButton
        onClick={() => onStep(Math.max(0, viewIndex - 1))}
        disabled={viewIndex === 0}
        label="Previous move"
        icon={<ChevronIcon className="h-4 w-4" />}
      />
      <TransportButton
        onClick={() => onStep(Math.min(moveCount, viewIndex + 1))}
        disabled={isLive}
        label="Next move"
        icon={<ChevronIcon className="h-4 w-4 rotate-180" />}
      />
      <TransportButton
        onClick={() => onJump(moveCount)}
        disabled={isLive}
        label="Last move"
        icon={<SkipIcon className="h-4 w-4 rotate-180" />}
      />
    </div>
  );
};

export default TransportControls;
