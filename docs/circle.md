---
title: Orbiting Circles
date: 2024-04-24
description: A collection of circles which move in orbit along a circular path
author: dillionverma
published: true
video: https://cdn.magicui.design/orbiting-circles.mp4
---

<ComponentPreview name="orbiting-circles-demo" />

## Installation

<Tabs defaultValue="cli">

<TabsList>
  <TabsTrigger value="cli">CLI</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>
<TabsContent value="cli">

```bash
npx shadcn@latest add @magicui/orbiting-circles
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Copy and paste the following code into your project.</Step>

```tsx
import React from "react"

import { cn } from "@/lib/utils"

export interface OrbitingCirclesProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
  reverse?: boolean
  duration?: number
  delay?: number
  radius?: number
  path?: boolean
  iconSize?: number
  speed?: number
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
  ...props
}: OrbitingCirclesProps) {
  const calculatedDuration = duration / speed
  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-black/10 stroke-1 dark:stroke-white/10"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}
      {React.Children.map(children, (child, index) => {
        const angle = (360 / React.Children.count(children)) * index
        return (
          <div
            style={
              {
                "--duration": calculatedDuration,
                "--radius": radius,
                "--angle": angle,
                "--icon-size": `${iconSize}px`,
              } as React.CSSProperties
            }
            className={cn(
              `animate-orbit absolute flex size-(--icon-size) transform-gpu items-center justify-center rounded-full`,
              { "[animation-direction:reverse]": reverse },
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

```

<Step>Update the import paths to match your project setup.</Step>

<Step>Add the required CSS animations</Step>

Add the following animations to your global CSS file.

```css title="app/globals.css" showLineNumbers {2, 4-14}
@theme inline {
  --animate-orbit: orbit calc(var(--duration) * 1s) linear infinite;

  @keyframes orbit {
    0% {
      transform: rotate(calc(var(--angle) * 1deg))
        translateY(calc(var(--radius) * 1px)) rotate(calc(var(--angle) * -1deg));
    }
    100% {
      transform: rotate(calc(var(--angle) * 1deg + 360deg))
        translateY(calc(var(--radius) * 1px))
        rotate(calc((var(--angle) * -1deg) - 360deg));
    }
  }
}
```

</Steps>

</TabsContent>

</Tabs>

## Usage

```tsx showLineNumbers
import { File, Search, Settings } from "lucide-react"

import { OrbitingCircles } from "@/components/ui/orbiting-circles"
```

```tsx showLineNumbers
<div className="relative h-[500px] w-full overflow-hidden">
  <OrbitingCircles>
    <File />
    <Settings />
    <File />
  </OrbitingCircles>
  <OrbitingCircles radius={100} reverse>
    <File />
    <Settings />
    <File />
    <Search />
  </OrbitingCircles>
</div>
```

## Props

| Prop        | Type              | Default | Description                                      |
| ----------- | ----------------- | ------- | ------------------------------------------------ |
| `className` | `string`          | `-`     | The class name for the component                 |
| `children`  | `React.ReactNode` | `-`     | The children nodes of the component              |
| `reverse`   | `boolean`         | `false` | If true, the animation plays in reverse          |
| `duration`  | `number`          | `20`    | The duration of the animation in seconds         |
| `delay`     | `number`          | `10`    | The delay before the animation starts in seconds |
| `radius`    | `number`          | `160`   | The radius of the orbit in pixels                |
| `path`      | `boolean`         | `true`  | If true, a path is displayed for the orbit       |
| `iconSize`  | `number`          | `30`    | The size of the icon in pixels                   |
| `speed`     | `number`          | `1`     | The speed of the animation                       |
