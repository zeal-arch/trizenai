"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface HoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const HoverButton = React.forwardRef<HTMLButtonElement, HoverButtonProps>(
  ({ className, children, ...props }, ref) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const [isListening, setIsListening] = React.useState(false)
    const [circles, setCircles] = React.useState<Array<{
      id: number
      x: number
      y: number
      color: string
      fadeState: "in" | "out" | null
    }>>([])
    const lastAddedRef = React.useRef(0)

    // Merge forwarded ref with internal ref
    const mergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
        if (typeof ref === "function") ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
      },
      [ref]
    )

    const createCircle = React.useCallback((x: number, y: number) => {
      const buttonWidth = buttonRef.current?.offsetWidth || 0
      const xPos = x / buttonWidth
      const color = `linear-gradient(to right, var(--circle-start) ${xPos * 100}%, var(--circle-end) ${xPos * 100}%)`

      setCircles((prev) => [
        ...prev,
        { id: Date.now(), x, y, color, fadeState: null },
      ])
    }, [])

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!isListening) return
        
        const currentTime = Date.now()
        // Reduced from 100ms to 40ms — prevents the disconnected "dot" look 
        // while perfectly preserving Serefim's beautiful blur trail.
        if (currentTime - lastAddedRef.current > 40) {
          lastAddedRef.current = currentTime
          const rect = event.currentTarget.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          createCircle(x, y)
        }
      },
      [isListening, createCircle]
    )

    const handlePointerEnter = React.useCallback(() => {
      setIsListening(true)
    }, [])

    const handlePointerLeave = React.useCallback(() => {
      setIsListening(false)
      // Fade out and clear immediately when mouse leaves
      setCircles((prev) =>
        prev.map((c) => ({ ...c, fadeState: "out" as const }))
      )
      setTimeout(() => setCircles([]), 500)
    }, [])

    React.useEffect(() => {
      circles.forEach((circle) => {
        if (!circle.fadeState) {
          setTimeout(() => {
            setCircles((prev) =>
              prev.map((c) =>
                c.id === circle.id ? { ...c, fadeState: "in" } : c
              )
            )
          }, 0)

          // Fade out slightly faster to keep the tail clean
          setTimeout(() => {
            setCircles((prev) =>
              prev.map((c) =>
                c.id === circle.id ? { ...c, fadeState: "out" } : c
              )
            )
          }, 800)

          setTimeout(() => {
            setCircles((prev) => prev.filter((c) => c.id !== circle.id))
          }, 1500)
        }
      })
    }, [circles])

    return (
      <button
        ref={mergedRef}
        className={cn(
          "relative isolate px-8 py-3 rounded-3xl",
          "text-white font-medium text-base leading-6", // text-white for the purple background
          "backdrop-blur-lg bg-white/10 hover:bg-white/15 transition-colors", // Frosted glass that looks beautiful on purple
          "cursor-pointer overflow-hidden",
          
          // Subtler frosted glass rim: reduced opacity of the 1px inset from 0.4 down to 0.15 for softness
          "before:content-[''] before:absolute before:inset-0",
          "before:rounded-[inherit] before:pointer-events-none",
          "before:z-[1]",
          "before:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15),inset_0_0_16px_0_rgba(255,255,255,0.08),inset_0_-3px_12px_0_rgba(255,255,255,0.12)]",
          "before:transition-transform before:duration-300",
          "active:before:scale-[0.975]",
          className
        )}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
        style={{
          "--circle-start": "#ffffff",
          "--circle-end": "#c4b5fd", 
        } as React.CSSProperties}
      >
        {circles.map(({ id, x, y, color, fadeState }) => (
          <div
            key={id}
            className={cn(
              "absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full",
              "blur-xl pointer-events-none z-0 transition-opacity duration-300",
              fadeState === "in" && "opacity-80",
              fadeState === "out" && "opacity-0 duration-700",
              !fadeState && "opacity-0"
            )}
            style={{
              left: x,
              top: y,
              background: color,
            }}
          />
        ))}
        {/* Added flex and inline alignment to keep the arrow icon nicely centered alongside text! */}
        <span className="relative z-10 flex items-center justify-center gap-1.5 pointer-events-none">{children}</span>
      </button>
    )
  }
)

HoverButton.displayName = "HoverButton"

export { HoverButton }