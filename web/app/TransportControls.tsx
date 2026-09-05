import type { ReactNode } from "react";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 6l-6 6 6 6" />
    </svg>
  );
}

function SkipIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6l-8 6 8 6" />
      <path d="M6 6v12" />
    </svg>
  );
}

function TransportButton({
  onClick,
  disabled,
  label,
  icon,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  icon: ReactNode;
}) {
  return (
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
}

export default function TransportControls({
  viewIndex,
  moveCount,
  onChange,
}: {
  viewIndex: number;
  moveCount: number;
  onChange: (viewIndex: number) => void;
}) {
  const isLive = viewIndex === moveCount;

  return (
    <div className="flex gap-1 border-t border-black/10 p-2 dark:border-white/10">
      <TransportButton
        onClick={() => onChange(0)}
        disabled={viewIndex === 0}
        label="First move"
        icon={<SkipIcon className="h-4 w-4" />}
      />
      <TransportButton
        onClick={() => onChange(Math.max(0, viewIndex - 1))}
        disabled={viewIndex === 0}
        label="Previous move"
        icon={<ChevronIcon className="h-4 w-4" />}
      />
      <TransportButton
        onClick={() => onChange(Math.min(moveCount, viewIndex + 1))}
        disabled={isLive}
        label="Next move"
        icon={<ChevronIcon className="h-4 w-4 rotate-180" />}
      />
      <TransportButton
        onClick={() => onChange(moveCount)}
        disabled={isLive}
        label="Last move"
        icon={<SkipIcon className="h-4 w-4 rotate-180" />}
      />
    </div>
  );
}
