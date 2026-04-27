<template>
  <router-view></router-view>
</template>

<style>
/* 1. 定义全局 CSS 变量 */
:root {
  /* 默认：暗黑模式（Gemini 风格） */
  --tb-color-bg-page: #131314;      /* 极暗背景 */
  --tb-color-bg-panel: #1e1f20;     /* 稍亮的面板背景 */
  --tb-color-bg-input: #2a2b2c;     /* 输入框背景 */
  --tb-color-border: #333333;       /* 分割线颜色 */
  --tb-color-text-primary: #e3e3e3;   /* 主文本颜色（接近白） */
  --tb-color-text-secondary: #c4c7c5; /* 次要文本颜色（淡灰） */
  
  /* 品牌色（头像、按钮等） */
  --tb-color-primary: #1e88e5;
  --tb-color-primary-variant: #ffd04b; /* 用户消息颜色 */
}

/* 2. 定义亮色模式的变量覆盖 */
/* 当 body 标签带有 .light 类时生效 */
.light {
  --tb-color-bg-page: #f0f2f5;      /* 浅灰网页背景 */
  --tb-color-bg-panel: #ffffff;     /* 纯白面板背景 */
  --tb-color-bg-input: #ffffff;     /* 白色输入框背景 */
  --tb-color-border: #dcdfe6;       /* 浅色分割线 */
  --tb-color-text-primary: #1f1f1f;   /* 主文本颜色（接近黑） */
  --tb-color-text-secondary: #606266; /* 次要文本颜色（深灰） */
  
  --tb-color-primary: #007bff;
  --tb-color-primary-variant: #f57c00; /* 亮色下的用户文本色 */
}

/* 3. 全局基础样式引用变量 */
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  /* 引用变量 */
  background-color: var(--tb-color-bg-page);
  color: var(--tb-color-text-primary);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  
  /* 增加一个简单的过渡动画，让切换不那么刺眼 */
  transition: background-color 0.3s ease, color 0.3s ease;
}

#app {
  height: 100%;
}
</style>