"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "white",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "#22c55e", // green-500
          "--success-text": "black",
          "--destructive-bg": "#ef4444", // red-500
          "--destructive-text": "white",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
