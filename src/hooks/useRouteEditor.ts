import { useCallback, useEffect, useState } from 'react'
import type { Route, RouteSettings, Waypoint } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const LS_ROUTES = 'route-guide.routes.v2'
const LS_LEGACY = 'route-guide.waypoints.v1'
const LS_SETTINGS = 'route-guide.settings.v1'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function makeWaypoint(number: number, label = `路径点 ${number}`): Waypoint {
  return { id: uid(), number, label, color: 'auto', photo: null }
}

function defaultRoutes(): Route[] {
  return [
    {
      id: uid(),
      name: '路线一',
      waypoints: [
        { id: uid(), number: 1, label: '熊德龙学生\n活动中心', color: 'auto', photo: null },
        { id: uid(), number: 2, label: '三楼301', color: 'auto', photo: null },
      ],
    },
    {
      id: uid(),
      name: '路线二',
      waypoints: [makeWaypoint(1), makeWaypoint(2)],
    },
  ]
}

function loadRoutes(): Route[] {
  try {
    const raw = localStorage.getItem(LS_ROUTES)
    if (raw) return JSON.parse(raw) as Route[]
    // 迁移 v1 单路线数据
    const legacy = localStorage.getItem(LS_LEGACY)
    if (legacy) {
      const wps = JSON.parse(legacy) as Waypoint[]
      if (wps.length) return [{ id: uid(), name: '路线一', waypoints: wps }]
    }
  } catch {
    /* ignore */
  }
  return defaultRoutes()
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

/** 路线内路径点按编号升序 */
export function sortedWaypoints(route: Route): Waypoint[] {
  return [...route.waypoints].sort((a, b) => a.number - b.number)
}

const CN_NUM = ['一', '二', '三', '四', '五', '六']

export function useRouteEditor() {
  const [routes, setRoutes] = useState<Route[]>(loadRoutes)
  const [settings, setSettings] = useState<RouteSettings>(loadSettings)

  useEffect(() => {
    try {
      localStorage.setItem(LS_ROUTES, JSON.stringify(routes))
    } catch {
      /* 照片过大导致超限时静默忽略 */
    }
  }, [routes])

  useEffect(() => {
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings))
    } catch {
      /* ignore */
    }
  }, [settings])

  // ---- 路线操作 ----
  const addRoute = useCallback(() => {
    setRoutes((list) => [
      ...list,
      { id: uid(), name: `路线${CN_NUM[list.length] ?? list.length + 1}`, waypoints: [] },
    ])
  }, [])

  const removeRoute = useCallback((routeId: string) => {
    setRoutes((list) => list.filter((r) => r.id !== routeId))
  }, [])

  const updateRoute = useCallback((routeId: string, patch: Partial<Omit<Route, 'id' | 'waypoints'>>) => {
    setRoutes((list) => list.map((r) => (r.id === routeId ? { ...r, ...patch } : r)))
  }, [])

  const moveRoute = useCallback((routeId: string, dir: -1 | 1) => {
    setRoutes((list) => {
      const idx = list.findIndex((r) => r.id === routeId)
      const target = idx + dir
      if (idx < 0 || target < 0 || target >= list.length) return list
      const next = [...list]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }, [])

  // ---- 路径点操作 ----
  const addWaypoint = useCallback((routeId: string) => {
    setRoutes((list) =>
      list.map((r) => {
        if (r.id !== routeId) return r
        const nextNo = r.waypoints.length ? Math.max(...r.waypoints.map((w) => w.number)) + 1 : 1
        return { ...r, waypoints: [...r.waypoints, makeWaypoint(nextNo)] }
      }),
    )
  }, [])

  const removeWaypoint = useCallback((routeId: string, wpId: string) => {
    setRoutes((list) =>
      list.map((r) =>
        r.id === routeId ? { ...r, waypoints: r.waypoints.filter((w) => w.id !== wpId) } : r,
      ),
    )
  }, [])

  const updateWaypoint = useCallback((routeId: string, wpId: string, patch: Partial<Waypoint>) => {
    setRoutes((list) =>
      list.map((r) =>
        r.id === routeId
          ? { ...r, waypoints: r.waypoints.map((w) => (w.id === wpId ? { ...w, ...patch } : w)) }
          : r,
      ),
    )
  }, [])

  /** 与相邻（按编号排序后）项交换编号 */
  const moveWaypoint = useCallback((routeId: string, wpId: string, dir: -1 | 1) => {
    setRoutes((list) =>
      list.map((r) => {
        if (r.id !== routeId) return r
        const s = [...r.waypoints].sort((a, b) => a.number - b.number)
        const idx = s.findIndex((w) => w.id === wpId)
        const target = idx + dir
        if (idx < 0 || target < 0 || target >= s.length) return r
        const a = s[idx]
        const b = s[target]
        return {
          ...r,
          waypoints: r.waypoints.map((w) => {
            if (w.id === a.id) return { ...w, number: b.number }
            if (w.id === b.id) return { ...w, number: a.number }
            return w
          }),
        }
      }),
    )
  }, [])

  /** 拖动排序：把某路径点插入到新位置，并按新顺序重排编号为 1..n */
  const reorderWaypoint = useCallback((routeId: string, wpId: string, toIndex: number) => {
    setRoutes((list) =>
      list.map((r) => {
        if (r.id !== routeId) return r
        const s = [...r.waypoints].sort((a, b) => a.number - b.number)
        const from = s.findIndex((w) => w.id === wpId)
        if (from < 0) return r
        const clamped = Math.max(0, Math.min(s.length - 1, toIndex))
        if (clamped === from) return r
        const [moved] = s.splice(from, 1)
        s.splice(clamped, 0, moved)
        return { ...r, waypoints: s.map((w, i) => ({ ...w, number: i + 1 })) }
      }),
    )
  }, [])

  const resetAll = useCallback(() => {
    setRoutes(defaultRoutes())
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return {
    routes,
    settings,
    setSettings,
    addRoute,
    removeRoute,
    updateRoute,
    moveRoute,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    moveWaypoint,
    reorderWaypoint,
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
