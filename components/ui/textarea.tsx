import * as React from "react"


import { cn } from "@/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string;
}

function Textarea({ className, label, ...props }: TextareaProps) {
  return (
    <div>
      <textarea
        data-slot="textarea"
        style={{ resize: "none" }}
        className={cn(
          "placeholder:text-muted-foreground mt-4 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md  bg-gray-100 px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
      {label && (
        <label className="text-xs pl-2 block mt-2 text-gray-400 -mt-1">
          {label}
        </label>
      )}
    </div>
  )
}

export { Textarea }
