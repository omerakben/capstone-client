"use client";

import { Check, Clipboard } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

type ButtonVariant =
  | "default"
  | "outline"
  | "ghost"
  | "secondary"
  | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ClipboardButtonProps {
  value: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  label?: string;
  copiedLabel?: string;
}

export function ClipboardButton({
  value,
  variant = "outline",
  size = "icon",
  className,
  label = "Copy",
  copiedLabel = "Copied!",
}: ClipboardButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Clipboard write failed", e);
      }
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label}
      className={className}
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Clipboard className="h-4 w-4" />
      )}
      {size !== "icon" && (
        <span className="ml-2 text-xs">{copied ? copiedLabel : label}</span>
      )}
    </Button>
  );
}
