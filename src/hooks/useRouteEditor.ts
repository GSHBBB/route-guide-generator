import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RouteSettings, Waypoint } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const LS_WAYPOINTS = 'route-guide.waypoints.v1'
const LS_SETTINGS = 'route-guide.settings.v1'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function loadWaypoints(): Waypoint[] {
  try {
    const raw = localStorage.getItem(LS_WAYPOINTS)
    if (raw) return JSON.parse(raw) as Waypoint[]
  } catch {
    /* ignore */
  }
  // 默认示例：复现参考图的熊德龙路线
  return [
    { id: uid(), number: 1, label: '熊德龙学生\n活动中心', color: 'auto', photo: null },
    { id: uid(), number: 2, label: '三楼301', color: 'auto', photo: null },
  ]
}

function loadSettings(): RouteSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS)
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<RouteSettings>) }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS
}

export function useRouteEditor() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(loadWaypoints)
  const [settings, setSettings] = useState<RouteSettings>(loadSettings)

  useEffect(() => {
    try {
      localStorage.setItem(LS_WAYPOINTS, JSON.stringify(waypoints))
    } catch {
      /* 照片过大导致超限时静默忽略 */
    }
  }, [waypoints])

  useEffect(() => {
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings))
    } catch {
      /* ignore */
    }
  }, [settings])

  /** 渲染/导出始终使用按编号升序的列表 */
  const sorted = useMemo(
    () => [...waypoints].sort((a, b) => a.number - b.number),
    [waypoints],
  )

  const addWaypoint = useCallback(() => {
    setWaypoints((list) => {
      const nextNo = list.length ? Math.max(...list.map((w) => w.number)) + 1 : 1
      return [
        ...list,
        { id: uid(), number: nextNo, label: `路径点 ${nextNo}`, color: 'auto' as const, photo: null },
      ]
    })
  }, [])

  const removeWaypoint = useCallback((id: string) => {
    setWaypoints((list) => list.filter((w) => w.id !== id))
  }, [])

  const updateWaypoint = useCallback((id: string, patch: Partial<Waypoint>) => {
    setWaypoints((list) => list.map((w) => (w.id === id ? { ...w, ...patch } : w)))
  }, [])

  /** 上移/下移：与相邻（按编号排序后）项交换编号 */
  const moveWaypoint = useCallback((id: string, dir: -1 | 1) => {
    setWaypoints((list) => {
      const s = [...list].sort((a, b) => a.number - b.number)
      const idx = s.findIndex((w) => w.id === id)
      const target = idx + dir
      if (idx < 0 || target < 0 || target >= s.length) return list
      const a = s[idx]
      const b = s[target]
      return list.map((w) => {
        if (w.id === a.id) return { ...w, number: b.number }
        if (w.id === b.id) return { ...w, number: a.number }
        return w
      })
    })
  }, [])

  const resetAll = useCallback(() => {
    setWaypoints([])
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return {
    waypoints,
    sorted,
    settings,
    setSettings,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    moveWaypoint,
    resetAll,
  }
}

/** 把上传的图片压缩到最长边 1400px 的 JPEG dataURL，避免 localStorage 超限 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const MAX = 1400
        const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.naturalWidth * scale)
        canvas.height = Math.round(img.naturalHeight * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('无法处理图片'))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
