import type { ReactNode } from "react";

const Icon = ({
  className,
  strokeWidth = 2,
  children,
}: {
  className?: string;
  strokeWidth?: number;
  children: ReactNode;
}) => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

type IconProps = { className?: string };

export const ChevronIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M14 6l-6 6 6 6" />
  </Icon>
);

export const SkipIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M18 6l-8 6 8 6" />
    <path d="M6 6v12" />
  </Icon>
);

export const CheckIcon = ({ className }: IconProps) => (
  <Icon className={className} strokeWidth={2.5}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

export const CrossIcon = ({ className }: IconProps) => (
  <Icon className={className} strokeWidth={2.5}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);
