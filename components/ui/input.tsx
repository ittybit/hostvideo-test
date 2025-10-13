import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => {
    return (
      <>
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md bg-gray-100 px-3 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={ref}
          {...props}
        />
        {label && (
          <label className="text-xs pl-2 block text-gray-400 mt-2">{label}</label>
        )}
      </>
    );
  },
);
Input.displayName = "Input";

export { Input };
