import { useState } from 'react'
import RouteCanvas from '../components/RouteCanvas'
import EditorPanel from '../sections/EditorPanel'
import { useRouteEditor } from '../hooks/useRouteEditor'
import { renderToBlob } from '../lib/renderRoute'
import { Button } from '@/components/ui/button'
import { Download, RotateCcw } from 'lucide-react'

export default function Home() {
  const {
    routes,
    settings,
    setSettings,
    addRoute,
    removeRoute,
    updateRoute,
    moveRoute,
    reorderRoute,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    moveWaypoint,
    reorderWaypoint,
    resetAll,
  } = useRouteEditor()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await renderToBlob(routes, settings)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '路线指引.png'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <div>
          <h1 className="text-lg font-bold text-neutral-800">路线指引图生成器</h1>
          <p className="text-xs text-neutral-500">
            支持多条路线 · 输入路径点 → 上传照片 → 按编号自动排序 → 生成 1280×720 指引图
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('确定清空所有路线、路径点和设置吗？')) resetAll()
            }}
          >
            <RotateCcw size={15} className="mr-1" /> 重置
          </Button>
          <Button onClick={handleExport} disabled={exporting} size="sm">
            <Download size={15} className="mr-1" />
            {exporting ? '导出中…' : '导出 PNG'}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[400px] shrink-0 border-r border-neutral-200 bg-white/60">
          <EditorPanel
            routes={routes}
            settings={settings}
            onSettings={setSettings}
            onAddRoute={addRoute}
            onRemoveRoute={removeRoute}
            onUpdateRoute={updateRoute}
            onMoveRoute={moveRoute}
            onReorderRoute={reorderRoute}
            onAddWaypoint={addWaypoint}
            onRemoveWaypoint={removeWaypoint}
            onUpdateWaypoint={updateWaypoint}
            onMoveWaypoint={moveWaypoint}
            onReorderWaypoint={reorderWaypoint}
          />
        </aside>

        <main className="flex flex-1 items-center justify-center overflow-auto p-8">
          <div className="w-full max-w-[1100px]">
            <RouteCanvas routes={routes} settings={settings} />
            <p className="mt-3 text-center text-xs text-neutral-400">
              预览为实时效果，导出尺寸固定 1280×720；每条路线内路径点按编号升序从左到右、上下交错排列
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
