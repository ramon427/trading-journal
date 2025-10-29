import * as React from "react";

import { cn } from "./utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="relative w-full group">
        <input
          ref={ref}
          type={type}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-2 text-sm bg-input-background outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "border-border/60 hover:border-border",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:border-ring/50",
            "placeholder:text-muted-foreground/50 focus-visible:placeholder:text-muted-foreground/40",
            "transition-all duration-300 ease-out",
            "enhanced-input",
            className,
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {/* Focus indicator line */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-ring/0 via-ring to-ring/0",
            "transition-all duration-500 ease-out pointer-events-none",
            isFocused ? "w-full opacity-100" : "w-0 opacity-0"
          )}
          style={{
            transform: isFocused ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'center',
          }}
        />

        {/* Hover glow effect */}
        <div 
          className={cn(
            "absolute inset-0 rounded-md pointer-events-none",
            "transition-opacity duration-300",
            "bg-gradient-to-br from-ring/0 via-ring/5 to-ring/0",
            "opacity-0 group-hover:opacity-100",
            isFocused && "opacity-0"
          )}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
