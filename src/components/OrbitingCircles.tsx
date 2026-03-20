import React, { useId } from 'react'
import { cn } from '@/lib/utils'

interface OrbitingCirclesProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
  reverse?: boolean
  duration?: number
  radius?: number
  path?: boolean
  iconSize?: number
  speed?: number
  beamColor?: string
}

export function OrbitingCircles({
  className,
  children,
  reverse,
  duration = 20,
  radius = 160,
  path = true,
  iconSize = 30,
  speed = 1,
  beamColor = '#000000',
  ...props
}: OrbitingCirclesProps) {
  const calculatedDuration = duration / speed
  const id = useId()
  const gradientId = `beam-gradient-${id}`

  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <defs>
            <linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from={reverse ? '360 0 0' : '0 0 0'}
                to={reverse ? '0 0 0' : '360 0 0'}
                dur={`${calculatedDuration}s`}
                repeatCount="indefinite"
              />
              <stop offset="0%" stopColor={beamColor} stopOpacity="0" />
              <stop offset="20%" stopColor={beamColor} stopOpacity="0" />
              <stop offset="50%" stopColor={beamColor} stopOpacity="0.5" />
              <stop offset="80%" stopColor={beamColor} stopOpacity="0" />
              <stop offset="100%" stopColor={beamColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Base circle (faint) */}
          <circle
            className="stroke-black/5 stroke-[4px] sm:stroke-[3px] md:stroke-2"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
          {/* Beam circle (animated gradient) */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            className="stroke-[4px] sm:stroke-[3px] md:stroke-2"
          />
        </svg>
      )}
      {React.Children.map(children, (child, index) => {
        const angle = (360 / React.Children.count(children)) * index
        return (
          <div
            style={{
              '--duration': calculatedDuration,
              '--radius': radius,
              '--angle': angle,
              '--icon-size': `${iconSize}px`,
            } as React.CSSProperties}
            className={cn(
              'animate-orbit absolute flex size-[var(--icon-size)] transform-gpu items-center justify-center rounded-full',
              reverse && '[animation-direction:reverse]',
              className
            )}
            {...props}
          >
            {child}
          </div>
        )
      })}
    </>
  )
}
