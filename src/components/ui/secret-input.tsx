"use client";

import { cn } from "@/lib/utils";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { Input } from "./input";

export interface SecretInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
  copyTooltip?: string;
}

export const SecretInput = React.forwardRef<HTMLInputElement, SecretInputProps>(
  ({ className, copyTooltip = "Copy", ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const onCopy = async () => {
      try {
        const v = (props.value ?? "").toString();
        if (!v) return;
        await navigator.clipboard.writeText(v);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch {
        // no-op
      }
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          {...props}
          type={show ? "text" : "password"}
          className={cn("pr-20 font-mono", className)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-1">
          <button
            type="button"
            aria-label={show ? "Hide value" : "Show value"}
            onClick={() => setShow((s) => !s)}
            className="inline-flex h-9 items-center justify-center rounded-md px-2 text-neutral-500 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {show ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            aria-label={copyTooltip}
            onClick={onCopy}
            className="inline-flex h-9 items-center justify-center rounded-md px-2 text-neutral-500 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    );
  }
);

SecretInput.displayName = "SecretInput";

export default SecretInput;
