import { useEffect, useRef, useState } from 'react'
import type { Route, RouteSettings } from '../types'
import { CANVAS_H, CANVAS_W, drawRoute } from '../lib/renderRoute'

interface Props {
  routes: Route[]
  settings: RouteSettings
}

/** 实时预览：内部固定 1280x720 画布，CSS 自适应缩放 */
export default function RouteCanvas({ routes, settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef(new Map<string, HTMLImageElement>())
  const [tick, setTick] = useState(0)

  // 预加载照片，加载完成后触发重绘
  useEffect(() => {
    const cache = imagesRef.current
    if (cache.size > 80) cache.clear()
    for (const wp of routes.flatMap((r) => r.waypoints)) {
      if (!wp.photo || cache.has(wp.photo)) continue
      const img = new Image()
      img.onload = () => setTick((t) => t + 1)
      img.src = wp.photo
      cache.set(wp.photo, img)
    }
  }, [routes])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    drawRoute(ctx, { routes, settings, images: imagesRef.current })
  }, [routes, settings, tick])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="w-full h-auto rounded-lg shadow-xl border border-neutral-200 bg-white"
    />
  )
}
