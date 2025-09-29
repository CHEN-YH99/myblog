import type { App } from 'vue'
import { setupAuthDirective } from '@/directives/auth'
import { setupHighlightDirective } from '@/directives/highlight'
import { setupRippleDirective } from '@/directives/ripple'
import { setupRolesDirective } from '@/directives/roles'

export function setupGlobDirectives(app: App) {
  setupAuthDirective(app) // 权限指令
  setupRolesDirective(app) // 角色权限指令
  setupHighlightDirective(app) // 高亮指令
  setupRippleDirective(app) // 水波纹指令
}
