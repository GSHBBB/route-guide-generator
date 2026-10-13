import type { RouteSettings, Waypoint } from '../types'

export const CANVAS_W = 1280
export const CANVAS_H = 720

// ---- 配色（取自参考图：深红 / 深绿箭头，米白底，底部红金装饰条）----
const RED: [string, string] = ['#b32222', '#7c1010']
const GREEN: [string, string] = ['#3aa757', '#13602b']
const BG = '#f7f5ef'
const TITLE_COLOR = '#1d5c2e'
const BAR_RED = '#8a1515'
const BAR_GOLD = '#d9b389'

// ---- 布局常量 ----
const MARGIN_X = 90
const TOP_PHOTO_Y = 82
const PHOTO_H = 190
const CHEV_Y = 312
const CHEV_H = 58
const BOTTOM_PHOTO_Y = 428
const BAR_Y = 692

export interface RenderOptions {
  waypoints: Waypoint[] // 已按编号排序
  settings: RouteSettings
  images: Map<string, HTMLImageElement>
}

function resolveColor(wp: Waypoint, index: number): [string, string] {
  if (wp.color === 'red') return RED
  if (wp.color === 'green') return GREEN
  return index % 2 === 0 ? RED : GREEN
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** 右向箭头丝带（chevron），左侧带凹口 */
function chevronPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tip: number,
) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w - tip, y)
  ctx.lineTo(x + w, y + h / 2)
  ctx.lineTo(x + w - tip, y + h)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x + tip, y + h / 2)
  ctx.closePath()
}

function drawChevronLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxW: number,
) {
  if (!text.trim()) return
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  let size = 22
  const buildLines = (fs: number): string[] => {
    ctx.font = `bold ${fs}px "Microsoft YaHei", "PingFang SC", sans-serif`
    const raw = text.split('\n')
    const lines: string[] = []
    for (const part of raw) {
      let cur = ''
      for (const ch of part) {
        if (ctx.measureText(cur + ch).width > maxW && cur) {
          lines.push(cur)
          cur = ch
        } else {
          cur += ch
        }
      }
      lines.push(cur)
    }
    return lines
  }

  let lines = buildLines(size)
  while (lines.length > 2 && size > 13) {
    size -= 1
    lines = buildLines(size)
  }
  if (lines.length > 2) lines = [lines[0], lines.slice(1).join('')]

  const lh = size + 6
  const startY = cy - ((lines.length - 1) * lh) / 2
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lh))
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 4
  roundRectPath(ctx, x, y, w, h, 18)
  if (img) {
    ctx.fillStyle = '#ddd'
    ctx.fill()
    ctx.restore()
    ctx.save()
    roundRectPath(ctx, x, y, w, h, 18)
    ctx.clip()
    // cover 裁剪
    const ir = img.naturalWidth / img.naturalHeight
    const tr = w / h
    let sw = img.naturalWidth
    let sh = img.naturalHeight
    if (ir > tr) sw = sh * tr
    else sh = sw / tr
    const sx = (img.naturalWidth - sw) / 2
    const sy = (img.naturalHeight - sh) / 2
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
  } else {
    ctx.fillStyle = '#eceae4'
    ctx.fill()
    ctx.restore()
    ctx.save()
    roundRectPath(ctx, x, y, w, h, 18)
    ctx.setLineDash([6, 5])
    ctx.strokeStyle = '#b7b2a6'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#9a9587'
    ctx.font = '18px "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('未上传照片', x + w / 2, y + h / 2)
  }
  ctx.restore()
}

export function drawRoute(ctx: CanvasRenderingContext2D, opts: RenderOptions) {
  const { waypoints, settings, images } = opts

  // 背景
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // 顶部标题
  if (settings.title.trim()) {
    ctx.fillStyle = TITLE_COLOR
    ctx.font = 'bold 30px "Microsoft YaHei", "PingFang SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(settings.title, CANVAS_W / 2, 34)
  }
  if (settings.subtitle.trim()) {
    ctx.fillStyle = '#5d7a63'
    ctx.font = '13px "Times New Roman", serif'
    ctx.textAlign = 'center'
    ctx.fillText(settings.subtitle, CANVAS_W / 2, 60)
  }

  const n = waypoints.length
  if (n === 0) {
    ctx.fillStyle = '#a39d8d'
    ctx.font = '24px "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('在左侧添加路径点，上传照片后这里会实时生成路线指引图', CANVAS_W / 2, CANVAS_H / 2)
  }

  const slotW = (CANVAS_W - MARGIN_X * 2) / Math.max(n, 1)
  const photoW = Math.min(250, slotW - 16)
  const photoH = Math.min(PHOTO_H, photoW * 0.76 + 40)
  const chevW = Math.min(210, slotW - 8)
  const tip = Math.min(30, chevW * 0.16)

  waypoints.forEach((wp, i) => {
    const cx = MARGIN_X + slotW * (i + 0.5)
    const isTop = i % 2 === 0
    const photoX = cx - photoW / 2
    const photoY = isTop ? TOP_PHOTO_Y : BOTTOM_PHOTO_Y
    const chevX = cx - chevW / 2
    const [c1, c2] = resolveColor(wp, i)

    // 连接线（照片 → 箭头）
    if (settings.showConnectors) {
      ctx.strokeStyle = 'rgba(170, 70, 70, 0.5)'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      if (isTop) {
        ctx.moveTo(photoX + photoW * 0.78, photoY + photoH)
        ctx.lineTo(chevX + chevW * 0.82, CHEV_Y)
      } else {
        ctx.moveTo(chevX + chevW * 0.82, CHEV_Y + CHEV_H)
        ctx.lineTo(photoX + photoW * 0.78, photoY)
      }
      ctx.stroke()
    }

    // 照片
    const img = wp.photo ? images.get(wp.photo) : undefined
    drawPhoto(ctx, img && img.complete && img.naturalWidth > 0 ? img : undefined, photoX, photoY, photoW, photoH)

    // 编号角标
    if (settings.showNumbers) {
      ctx.beginPath()
      ctx.arc(photoX + 6, photoY + 6, 17, 0, Math.PI * 2)
      ctx.fillStyle = '#a51919'
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 19px "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(wp.number), photoX + 6, photoY + 7)
    }

    // 箭头
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.28)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 2
    const grad = ctx.createLinearGradient(chevX, 0, chevX + chevW, 0)
    grad.addColorStop(0, c1)
    grad.addColorStop(1, c2)
    chevronPath(ctx, chevX, CHEV_Y, chevW, CHEV_H, tip)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()
    chevronPath(ctx, chevX, CHEV_Y, chevW, CHEV_H, tip)
    ctx.lineWidth = 3
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()

    // 箭头文字
    drawChevronLabel(ctx, wp.label, cx + tip / 2, CHEV_Y + CHEV_H / 2, chevW - tip * 2 - 14)
  })

  // 底部装饰条：红色通栏 + 左侧金色斜切块
  ctx.fillStyle = BAR_RED
  ctx.fillRect(0, BAR_Y, CANVAS_W, CANVAS_H - BAR_Y)
  ctx.beginPath()
  ctx.moveTo(0, BAR_Y)
  ctx.lineTo(150, BAR_Y)
  ctx.lineTo(186, CANVAS_H)
  ctx.lineTo(0, CANVAS_H)
  ctx.closePath()
  ctx.fillStyle = BAR_GOLD
  ctx.fill()
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** 导出用：先把所有照片加载完，再离屏渲染成 PNG Blob */
export async function renderToBlob(
  waypoints: Waypoint[],
  settings: RouteSettings,
): Promise<Blob> {
  const images = new Map<string, HTMLImageElement>()
  await Promise.all(
    waypoints
      .filter((w) => w.photo)
      .map(async (w) => {
        try {
          images.set(w.photo as string, await loadImage(w.photo as string))
        } catch {
          /* 忽略加载失败的照片 */
        }
      }),
  )
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  drawRoute(ctx, { waypoints, settings, images })
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出失败'))), 'image/png')
  })
}
