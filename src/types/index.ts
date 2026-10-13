export type ChevronColor = 'auto' | 'red' | 'green'

export interface Waypoint {
  id: string
  /** 路径点编号，渲染时按它升序排序 */
  number: number
  /** 箭头上的文字说明 */
  label: string
  /** 箭头颜色：auto = 红绿交替 */
  color: ChevronColor
  /** 照片 dataURL，null 表示未上传 */
  photo: string | null
}

export interface RouteSettings {
  title: string
  subtitle: string
  showNumbers: boolean
  showConnectors: boolean
}

export const DEFAULT_SETTINGS: RouteSettings = {
  title: '中山大学学生会 · 中山大学研究生会',
  subtitle: 'Student Union of Yat-sen University',
  showNumbers: true,
  showConnectors: true,
}
