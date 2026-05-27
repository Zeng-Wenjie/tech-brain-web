<template>
  <router-view></router-view>
</template>

<style>
:root {
  --tb-color-bg-page:      #111113;
  --tb-color-bg-panel:     #1a1a1c;
  --tb-color-bg-input:     #252528;
  --tb-color-border:       #2e2e32;
  --tb-color-text-primary: #e2e4e9;
  --tb-color-text-secondary: #6b7280;
  --tb-color-primary:      #6366f1;
  --tb-color-primary-variant: #818cf8;
}

/* 亮色模式保留（ProfileView 仍然是亮色） */
.light {
  --tb-color-bg-page:      #f0f2f5;
  --tb-color-bg-panel:     #ffffff;
  --tb-color-bg-input:     #ffffff;
  --tb-color-border:       #dcdfe6;
  --tb-color-text-primary: #1f1f1f;
  --tb-color-text-secondary: #606266;
  --tb-color-primary:      #6366f1;
  --tb-color-primary-variant: #818cf8;
}

*, *::before, *::after { box-sizing: border-box; }

body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: var(--tb-color-bg-page);
  color: var(--tb-color-text-primary);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
               "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
  -webkit-font-smoothing: antialiased;
}

#app { height: 100%; }

/* 全局滚动条 */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #2e2e32; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #3a3d4a; }

/* Element Plus 全局暗色覆盖 */
.el-button--primary {
  background-color: var(--tb-color-primary) !important;
  border-color: var(--tb-color-primary) !important;
}
.el-button--primary:hover {
  opacity: 0.88;
}

/* el-message 暗色 */
.el-message {
  background-color: #252528 !important;
  border-color: #2e2e32 !important;
}
.el-message .el-message__content { color: #c9ccd6 !important; }

/* el-message-box 暗色 */
.el-message-box {
  background-color: #1e1e22 !important;
  border-color: #2e2e32 !important;
  border-radius: 14px !important;
}
.el-message-box__header {
  background: #252528 !important;
  border-bottom: 0.5px solid #2e2e32 !important;
  cursor: move;
}
.el-message-box__title { color: #c9ccd6 !important; }
.el-message-box__content { color: #9ca3af !important; }
.el-message-box__headerbtn .el-icon { color: #4b5263 !important; }

/* el-overlay 背景 */
.el-overlay { background-color: rgba(0, 0, 0, 0.5) !important; }

/* el-popover 暗色（全局） */
.el-popover.el-popper {
  background: #1e1e22 !important;
  border-color: #2e2e32 !important;
  color: #c9ccd6 !important;
}
.el-popper__arrow::before {
  background: #1e1e22 !important;
  border-color: #2e2e32 !important;
}

/* ============ 所有 el-dialog 一律去掉浏览器/Element Plus 的白色光晕、聚焦边框 ============ */
.el-dialog,
.el-dialog:focus,
.el-dialog:focus-visible,
.el-dialog:active,
.el-dialog *:focus,
.el-dialog *:focus-visible {
  outline: none !important;
  outline-color: transparent !important;
}
/* 干掉 element-plus 默认的浅色 box-shadow / focus ring，并完全去掉边框 */
.el-dialog,
.el-dialog:focus,
.el-dialog:focus-visible {
  --el-dialog-box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55) !important;
  --el-dialog-border-color: transparent !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55) !important;
  border: none !important;
}
/* overlay 容器兜底 */
.el-overlay,
.el-overlay-dialog,
.el-overlay:focus,
.el-overlay-dialog:focus,
.el-overlay-dialog *:focus { outline: none !important; }

/* ─── AI 总结弹窗：通用全局样式（NotesView / AgentView 共用） ─── */
.tb-summary-dialog.el-dialog {
  background: #1a1a1c !important;
  border: none !important;
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}
.tb-summary-dialog .el-dialog__header {
  background: linear-gradient(180deg, #1e1e22 0%, #1a1a1c 100%) !important;
  border-bottom: 0.5px solid #2e2e32;
  padding: 14px 18px !important;
  margin: 0 !important;
  cursor: move;
}
.tb-summary-dialog .el-dialog__body {
  background: #1a1a1c !important;
  padding: 20px 22px 8px !important;
  color: #f1f3f8 !important;
}
.tb-summary-dialog .el-dialog__footer {
  background: #1a1a1c !important;
  border-top: 0.5px solid #2e2e32;
  padding: 12px 18px !important;
}
.tb-summary-dialog .summary-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.tb-summary-dialog .summary-header-left {
  display: flex; align-items: center; gap: 12px; min-width: 0;
}
.tb-summary-dialog .summary-badge {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 18px; flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}
.tb-summary-dialog .summary-titles { min-width: 0; }
.tb-summary-dialog .summary-title {
  font-size: 15px; font-weight: 600; color: #ffffff; line-height: 1.2;
}
.tb-summary-dialog .summary-subtitle {
  margin-top: 3px; font-size: 11px; color: #9ca3af;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 460px;
}
.tb-summary-dialog .summary-close {
  font-size: 18px; color: #6b7280; cursor: pointer;
  padding: 5px; border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}
.tb-summary-dialog .summary-close:hover { background: #252528; color: #fff; }
.tb-summary-dialog .summary-content {
  max-height: 55vh; overflow-y: auto;
  font-size: 14.5px; line-height: 1.85;
  color: #f1f3f8 !important;
  padding-right: 4px;
}
.tb-summary-dialog .summary-content,
.tb-summary-dialog .summary-content * { opacity: 1 !important; }
.tb-summary-dialog .summary-content p,
.tb-summary-dialog .summary-content li,
.tb-summary-dialog .summary-content span,
.tb-summary-dialog .summary-content div { color: #f1f3f8 !important; }
.tb-summary-dialog .summary-content h1,
.tb-summary-dialog .summary-content h2,
.tb-summary-dialog .summary-content h3,
.tb-summary-dialog .summary-content h4 {
  color: #ffffff !important;
  font-weight: 600 !important;
  margin: 16px 0 8px !important;
}
.tb-summary-dialog .summary-content strong { color: #c4b5fd !important; font-weight: 600 !important; }
.tb-summary-dialog .summary-content em { color: #e8eaf0 !important; }
.tb-summary-dialog .summary-content code {
  background: #252528 !important; color: #f0abfc !important;
  padding: 1px 6px; border-radius: 4px; font-size: 13px;
}
.tb-summary-dialog .summary-content pre {
  background: #252528 !important; border-radius: 8px;
  padding: 12px 14px; overflow-x: auto; margin: 10px 0;
}
.tb-summary-dialog .summary-content pre code {
  background: transparent !important; padding: 0;
  color: #f1f3f8 !important;
}
.tb-summary-dialog .summary-content::-webkit-scrollbar { width: 4px; }
.tb-summary-dialog .summary-content::-webkit-scrollbar-thumb { background: #2e2e32; border-radius: 4px; }
.tb-summary-dialog .summary-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 50px 0;
  color: #9ca3af; font-size: 13px;
}
.tb-summary-dialog .summary-loading .el-icon { font-size: 32px; color: #818cf8; }
.tb-summary-dialog .summary-footer {
  display: flex; align-items: center; gap: 8px; width: 100%;
}
.tb-summary-dialog .summary-footer-spacer { flex: 1; }
.tb-summary-dialog .summary-count { font-size: 11px; color: #6b7280; }
.tb-summary-dialog .el-button {
  background: #252528 !important;
  border-color: #2e2e32 !important;
  color: #e2e4e9 !important;
}
.tb-summary-dialog .el-button:hover {
  background: #2e2e32 !important;
  color: #ffffff !important;
}
.tb-summary-dialog .el-button--primary {
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%) !important;
  border-color: #6366f1 !important;
  color: #fff !important;
}
.tb-summary-dialog .el-button--primary:hover { opacity: 0.9; }
.tb-summary-dialog .el-button.is-disabled {
  background: #1e1e22 !important;
  color: #4b5263 !important;
  border-color: #2e2e32 !important;
  opacity: 0.7;
}
</style>
