import * as React from "react";

import { cn } from "./utils";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  autoResize?: boolean;
  maxHeight?: number;
  showCharCount?: boolean;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, maxHeight = 400, showCharCount = false, maxLength, onChange, onFocus, onBlur, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement>(null);
    const [charCount, setCharCount] = React.useState(0);
    const [isFocused, setIsFocused] = React.useState(false);
    const [cursorPosition, setCursorPosition] = React.useState<number | null>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    // Auto-resize functionality
    const adjustHeight = React.useCallback(() => {
      const textarea = innerRef.current;
      if (!textarea || !autoResize) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate new height
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [autoResize, maxHeight]);

    // Handle content changes
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (showCharCount || maxLength) {
          setCharCount(e.target.value.length);
        }
        
        if (autoResize) {
          // Defer height adjustment to next frame for smoother animation
          requestAnimationFrame(() => adjustHeight());
        }
        
        if (onChange) {
          onChange(e);
        }
      },
      [onChange, adjustHeight, autoResize, showCharCount, maxLength]
    );

    // Handle focus
    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(true);
        if (onFocus) {
          onFocus(e);
        }
      },
      [onFocus]
    );

    // Handle blur
    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(false);
        setCursorPosition(null);
        if (onBlur) {
          onBlur(e);
        }
      },
      [onBlur]
    );

    // Track cursor position for animations
    const handleClick = React.useCallback(() => {
      const textarea = innerRef.current;
      if (textarea) {
        setCursorPosition(textarea.selectionStart);
      }
    }, []);

    // Initial resize on mount and when value changes externally
    React.useEffect(() => {
      if (autoResize) {
        adjustHeight();
      }
      if ((showCharCount || maxLength) && props.value) {
        setCharCount(String(props.value).length);
      }
    }, [props.value, autoResize, adjustHeight, showCharCount, maxLength]);

    const isOverLimit = maxLength ? charCount > maxLength : false;

    return (
      <div className="relative w-full group">
        <textarea
          ref={innerRef}
          data-slot="textarea"
          className={cn(
            // Base styles
            "flex min-h-[80px] w-full rounded-md border bg-input-background px-3 py-2.5 text-sm",
            "enhanced-textarea",
            
            // Border animations
            "border-border/60",
            "hover:border-border",
            "focus-visible:border-ring/50",
            
            // Ring styles with smooth animation
            "ring-offset-background",
            "focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-1",
            
            // Placeholder
            "placeholder:text-muted-foreground/50",
            "focus-visible:placeholder:text-muted-foreground/40",
            
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
            
            // Transitions
            "transition-all duration-300 ease-out",
            
            // Resize behavior
            autoResize ? "resize-none overflow-hidden" : "resize-y",
            
            // Character count spacing
            showCharCount && "pb-7",
            
            // Error state
            isOverLimit && "border-destructive/60 focus-visible:ring-destructive/20 focus-visible:border-destructive",
            
            className,
          )}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleClick}
          maxLength={maxLength}
          style={autoResize ? { overflow: 'hidden' } : undefined}
          {...props}
        />
        
        {/* Focus indicator line */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-ring/0 via-ring to-ring/0",
            "transition-all duration-500 ease-out",
            "pointer-events-none",
            isFocused ? "w-full opacity-100" : "w-0 opacity-0"
          )}
          style={{
            transform: isFocused ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'center',
          }}
        />
        
        {/* Character count with animation */}
        {showCharCount && maxLength && (
          <div 
            className={cn(
              "absolute bottom-2 right-3 text-xs tabular-nums",
              "transition-all duration-300 ease-out",
              "pointer-events-none select-none",
              isOverLimit 
                ? "text-destructive scale-105" 
                : isFocused 
                  ? "text-muted-foreground/80" 
                  : "text-muted-foreground/50"
            )}
          >
            <span className={cn(
              "inline-block transition-all duration-200",
              isOverLimit && "animate-pulse"
            )}>
              {charCount}
            </span>
            <span className="opacity-50">/{maxLength}</span>
          </div>
        )}
        
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

Textarea.displayName = "Textarea";

export { Textarea };
