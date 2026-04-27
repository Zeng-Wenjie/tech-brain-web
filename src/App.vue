<template>
  <router-view></router-view>
</template>

<style>
/* 终极暗黑模式底色去边距 */
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #131314; /* Gemini 标志性纯暗背景 */
  color: #e3e3e3;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
#app {
  height: 100%;
}
</style>