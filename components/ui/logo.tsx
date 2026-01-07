import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      {...props}
    >
      <style>
        {`
        :root {
          --bean: #5D4037;
          --bracket: #15803d;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bean: #D4B08C;
            --bracket: #4ADE80;
          }
        }
        `}
      </style>
      <g transform="rotate(-45 16 16)">
        <rect
          x="9"
          y="5"
          width="14"
          height="22"
          rx="7"
          stroke="var(--bean)"
          strokeWidth="3"
        />
        <path
          d="M16 5V27"
          stroke="var(--bean)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <path
        d="M3 9V5H7"
        stroke="var(--bracket)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M29 9V5H25"
        stroke="var(--bracket)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 23V27H7"
        stroke="var(--bracket)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M29 23V27H25"
        stroke="var(--bracket)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
