import { useRef } from 'react'
import type { Route, RouteSettings, Waypoint } from '../types'
import { fileToDataURL, sortedWaypoints } from '../hooks/useRouteEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from 'lucide-react'

interface Props {
  routes: Route[]
  settings: RouteSettings
  onSettings: (s: RouteSettings) => void
  onAddRoute: () => void
  onRemoveRoute: (routeId: string) => void
  onUpdateRoute: (routeId: string, patch: Partial<Omit<Route, 'id' | 'waypoints'>>) => void
  onMoveRoute: (routeId: string, dir: -1 | 1) => void
  onAddWaypoint: (routeId: string) => void
  onRemoveWaypoint: (routeId: string, wpId: string) => void
  onUpdateWaypoint: (routeId: string, wpId: string, patch: Partial<Waypoint>) => void
  onMoveWaypoint: (routeId: string, wpId: string, dir: -1 | 1) => void
}

function WaypointCard({
  wp,
  index,
  total,
  onRemove,
  onUpdate,
  onMove,
}: {
  wp: Waypoint
  index: number
  total: number
  onRemove: () => void
  onUpdate: (patch: Partial<Waypoint>) => void
  onMove: (dir: -1 | 1) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File | undefined) => {
    if (!f) return
    try {
      const url = await fileToDataURL(f)
      onUpdate({ photo: url })
    } catch {
      alert('图片读取失败，请换一张试试')
    }
  }

  const autoColor = index % 2 === 0 ? '红' : '绿'

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
            index % 2 === 0 ? 'bg-red-700' : 'bg-green-700'
          }`}
        >
          {wp.number}
        </span>
        <span className="text-xs font-medium text-neutral-600 truncate flex-1">
          {wp.label.replace('\n', ' ') || '（未填写说明）'}
        </span>
        <button
          className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          title="上移"
        >
          <ArrowUp size={14} />
        </button>
        <button
          className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          title="下移"
        >
          <ArrowDown size={14} />
        </button>
        <button className="p-1 text-neutral-400 hover:text-red-600" onClick={onRemove} title="删除">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex gap-2">
        <div className="w-16 shrink-0">
          <Label className="text-xs text-neutral-500">编号</Label>
          <Input
            type="number"
            value={wp.number}
            min={0}
            onChange={(e) => onUpdate({ number: Number(e.target.value) })}
            className="h-8"
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs text-neutral-500">箭头文字（可换行）</Label>
          <Textarea
            value={wp.label}
            rows={2}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="min-h-[50px] text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50 hover:border-neutral-400"
          title="上传路径点照片"
        >
          {wp.photo ? (
            <img src={wp.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center text-neutral-400">
              <ImagePlus size={16} />
              <span className="text-[10px] mt-0.5">上传照片</span>
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <div className="flex-1">
          <Label className="text-xs text-neutral-500">箭头颜色</Label>
          <Select
            value={wp.color}
            onValueChange={(v) => onUpdate({ color: v as Waypoint['color'] })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">自动（{autoColor}）</SelectItem>
              <SelectItem value="red">红色</SelectItem>
              <SelectItem value="green">绿色</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {wp.photo && (
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-red-600 self-end px-2"
            onClick={() => onUpdate({ photo: null })}
          >
            移除
          </Button>
        )}
      </div>
    </div>
  )
}

export default function EditorPanel({
  routes,
  settings,
  onSettings,
  onAddRoute,
  onRemoveRoute,
  onUpdateRoute,
  onMoveRoute,
  onAddWaypoint,
  onRemoveWaypoint,
  onUpdateWaypoint,
  onMoveWaypoint,
}: Props) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="space-y-2 rounded-xl bg-neutral-50 p-3 border border-neutral-200">
        <div>
          <Label className="text-xs text-neutral-500">顶部标题</Label>
          <Input
            value={settings.title}
            onChange={(e) => onSettings({ ...settings, title: e.target.value })}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs text-neutral-500">顶部副标题（可留空）</Label>
          <Input
            value={settings.subtitle}
            onChange={(e) => onSettings({ ...settings, subtitle: e.target.value })}
            className="h-8"
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Label className="text-xs text-neutral-500">显示编号角标</Label>
          <Switch
            checked={settings.showNumbers}
            onCheckedChange={(v) => onSettings({ ...settings, showNumbers: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-neutral-500">显示连接线</Label>
          <Switch
            checked={settings.showConnectors}
            onCheckedChange={(v) => onSettings({ ...settings, showConnectors: v })}
          />
        </div>
      </div>

      {routes.map((route, ri) => {
        const wps = sortedWaypoints(route)
        return (
          <div
            key={route.id}
            className="space-y-2.5 rounded-xl border border-red-900/15 bg-red-50/40 p-3"
          >
            <div className="flex items-center gap-2">
              <Input
                value={route.name}
                onChange={(e) => onUpdateRoute(route.id, { name: e.target.value })}
                className="h-8 w-28 font-bold text-red-900"
                title="路线名（画布左侧竖排显示）"
              />
              <span className="text-xs text-neutral-400 flex-1">
                {wps.length} 个路径点，按编号排序
              </span>
              <button
                className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                disabled={ri === 0}
                onClick={() => onMoveRoute(route.id, -1)}
                title="路线上移"
              >
                <ArrowUp size={15} />
              </button>
              <button
                className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                disabled={ri === routes.length - 1}
                onClick={() => onMoveRoute(route.id, 1)}
                title="路线下移"
              >
                <ArrowDown size={15} />
              </button>
              <button
                className="p-1 text-neutral-400 hover:text-red-600"
                onClick={() => onRemoveRoute(route.id)}
                title="删除路线"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="space-y-2">
              {wps.map((wp, i) => (
                <WaypointCard
                  key={wp.id}
                  wp={wp}
                  index={i}
                  total={wps.length}
                  onRemove={() => onRemoveWaypoint(route.id, wp.id)}
                  onUpdate={(patch) => onUpdateWaypoint(route.id, wp.id, patch)}
                  onMove={(dir) => onMoveWaypoint(route.id, wp.id, dir)}
                />
              ))}
            </div>

            <Button
              onClick={() => onAddWaypoint(route.id)}
              variant="outline"
              size="sm"
              className="w-full border-dashed"
            >
              <Plus size={14} className="mr-1" /> 添加路径点
            </Button>
          </div>
        )
      })}

      <Button onClick={onAddRoute} variant="outline" className="w-full border-dashed">
        <Plus size={16} className="mr-1" /> 添加路线
      </Button>
    </div>
  )
}
