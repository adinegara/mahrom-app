---
title: Animated Beam
date: 2024-02-11
description: An animated beam of light which travels along a path. Useful for showcasing the "integration" features of a website.
author: dillionverma
published: true
video: https://cdn.magicui.design/animated-beam.mp4
---

<ComponentPreview name="animated-beam-demo" />

## Installation

<Tabs defaultValue="cli">

<TabsList>
  <TabsTrigger value="cli">CLI</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>
<TabsContent value="cli">

```bash
npx shadcn@latest add @magicui/animated-beam
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Copy and paste the following code into your project.</Step>

```tsx
"use client"

import { RefObject, useEffect, useId, useState } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export interface AnimatedBeamProps {
  className?: string
  containerRef: RefObject<HTMLElement | null> // Container ref
  fromRef: RefObject<HTMLElement | null>
  toRef: RefObject<HTMLElement | null>
  curvature?: number
  reverse?: boolean
  pathColor?: string
  pathWidth?: number
  pathOpacity?: number
  gradientStartColor?: string
  gradientStopColor?: string
  delay?: number
  duration?: number
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false, // Include the reverse prop
  duration = Math.random() * 3 + 4,
  delay = 0,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#ffaa40",
  gradientStopColor = "#9c40ff",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}) => {
  const id = useId()
  const [pathD, setPathD] = useState("")
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })

  // Calculate the gradient coordinates based on the reverse prop
  const gradientCoordinates = reverse
    ? {
        x1: ["90%", "-10%"],
        x2: ["100%", "0%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }
    : {
        x1: ["10%", "110%"],
        x2: ["0%", "100%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const rectA = fromRef.current.getBoundingClientRect()
        const rectB = toRef.current.getBoundingClientRect()

        const svgWidth = containerRect.width
        const svgHeight = containerRect.height
        setSvgDimensions({ width: svgWidth, height: svgHeight })

        const startX =
          rectA.left - containerRect.left + rectA.width / 2 + startXOffset
        const startY =
          rectA.top - containerRect.top + rectA.height / 2 + startYOffset
        const endX =
          rectB.left - containerRect.left + rectB.width / 2 + endXOffset
        const endY =
          rectB.top - containerRect.top + rectB.height / 2 + endYOffset

        const controlY = startY - curvature
        const d = `M ${startX},${startY} Q ${
          (startX + endX) / 2
        },${controlY} ${endX},${endY}`
        setPathD(d)
      }
    }

    // Initialize ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      updatePath()
    })

    // Observe the container element
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Call the updatePath initially to set the initial path
    updatePath()

    // Clean up the observer on component unmount
    return () => {
      resizeObserver.disconnect()
    }
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ])

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute top-0 left-0 transform-gpu stroke-2",
        className
      )}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        strokeWidth={pathWidth}
        stroke={`url(#${id})`}
        strokeOpacity="1"
        strokeLinecap="round"
      />
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits={"userSpaceOnUse"}
          initial={{
            x1: "0%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1], // https://easings.net/#easeOutExpo
            repeat: Infinity,
            repeatDelay: 0,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0"></stop>
          <stop stopColor={gradientStartColor}></stop>
          <stop offset="32.5%" stopColor={gradientStopColor}></stop>
          <stop
            offset="100%"
            stopColor={gradientStopColor}
            stopOpacity="0"
          ></stop>
        </motion.linearGradient>
      </defs>
    </svg>
  )
}

```

<Step>Update the import paths to match your project setup.</Step>

</Steps>

</TabsContent>

</Tabs>

## Examples

### Animated Beam Uni-Directional

<ComponentPreview name="animated-beam-unidirectional" />

### Animated Beam Bi-Directional

<ComponentPreview name="animated-beam-bidirectional" />

### Animated Beam Multiple Inputs

<ComponentPreview name="animated-beam-multiple-inputs" />

### Animated Beam Multiple Outputs

<ComponentPreview name="animated-beam-multiple-outputs" />

## Usage

```tsx showLineNumbers
import { AnimatedBeam } from "@/components/ui/animated-beam"
```

```tsx showLineNumbers
<AnimatedBeam containerRef={containerRef} fromRef={fromRef} toRef={toRef} />
```

## Props

### Animated Beam

| Prop                 | Type      | Default   | Description                                              |
| -------------------- | --------- | --------- | -------------------------------------------------------- |
| `className`          | `string`  | `-`       | The class name for the component.                        |
| `containerRef`       | `ref`     | `-`       | The container ref.                                       |
| `fromRef`            | `ref`     | `-`       | The ref of the element from which the beam should start. |
| `toRef`              | `ref`     | `-`       | The ref of the element to which the beam should end.     |
| `curvature`          | `number`  | `0`       | The curvature of the beam.                               |
| `reverse`            | `boolean` | `false`   | Whether the beam should be reversed.                     |
| `duration`           | `number`  | `5`       | The duration of the beam.                                |
| `delay`              | `number`  | `0`       | The delay of the beam.                                   |
| `pathColor`          | `string`  | `gray`    | The color of the beam.                                   |
| `pathWidth`          | `number`  | `2`       | The width of the beam.                                   |
| `pathOpacity`        | `number`  | `0.2`     | The opacity of the beam.                                 |
| `gradientStartColor` | `string`  | `#ffaa40` | The start color of the gradient.                         |
| `gradientStopColor`  | `string`  | `#9c40ff` | The stop color of the gradient.                          |
| `startXOffset`       | `number`  | `0`       | The start x offset of the beam.                          |
| `startYOffset`       | `number`  | `0`       | The start y offset of the beam.                          |
| `endXOffset`         | `number`  | `0`       | The end x offset of the beam.                            |
| `endYOffset`         | `number`  | `0`       | The end y offset of the beam.                            |

## Credits

- Credit to [@itsarghyadas](https://twitter.com/itsarghyadas) for figuring out the foundation of this!
