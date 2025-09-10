"use client";
import * as React from "react";

// Props: everything an input[type=checkbox] supports except we enforce the type
export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

// Minimal checkbox component to satisfy form usage
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={
          "h-4 w-4 rounded border border-gray-300 text-primary focus:ring-2 focus:ring-primary/50 " +
          className
        }
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";
