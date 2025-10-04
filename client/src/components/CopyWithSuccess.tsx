import { Button } from "@mui/material";
import { useState } from "react";

interface CopyWithSuccessProps {
  label?: string;
  textToCopy?: string;
}

export default function CopyWithSuccess({ label, textToCopy }: CopyWithSuccessProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <>
      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <Button
          autoFocus
          disabled={!textToCopy}
          onClick={handleCopy}
          variant="contained"
        >
          {label || "Copy to clipboard"}
        </Button>

        {/* Success tick */}
        <div
          aria-live="polite"
          role="status"
          style={{
            width: 28,
            height: 28,
            position: "relative",
            transition: "opacity 200ms ease",
            opacity: copied ? 1 : 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            style={{
              display: "block",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
            }}
          >
            {/* Circle */}
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="#22c55e" /* Tailwind's green-500 */
            />
            {/* Check mark stroke animation */}
            <path
              d="M7 12.5l3 3 7-7"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 22,
                strokeDashoffset: copied ? 0 : 22,
                transition: "stroke-dashoffset 300ms ease 120ms",
              }}
            />
          </svg>
        </div>
      </div>
    </>
  );
}
