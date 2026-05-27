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
</style>
