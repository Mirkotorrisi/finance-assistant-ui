'use client'

import { useId } from 'react'

interface SparklineProps {
  values: number[]
  /** CSS colour of the line */
  color?: string
  width?: number
  height?: number
  className?: string
}

/** A small line with a faint fill under it: trend only, no axes, no labels. */
export function Sparkline({ values, color = 'currentColor', width = 120, height = 32, className }: SparklineProps) {
  const id = useId()
  const points = values.filter((v) => Number.isFinite(v))
  if (points.length < 2) return <svg width={width} height={height} className={className} aria-hidden="true" />

  const min = Math.min(...points, 0)
  const max = Math.max(...points, 0)
  const span = max - min || 1
  const pad = 2
  const stepX = (width - pad * 2) / (points.length - 1)
  const y = (v: number) => pad + (height - pad * 2) * (1 - (v - min) / span)
  const coords = points.map((v, i) => [pad + i * stepX, y(v)] as const)
  const line = coords.map(([x, yy], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${yy.toFixed(1)}`).join(' ')
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)} ${height} L${pad} ${height} Z`
  const last = coords[coords.length - 1]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="spark-line"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color} />
    </svg>
  )
}
