<template>
  <div class="workspace-layout">
    
    <div class="agent-pane">
      <div class="pane-header left-header">
        <div class="title">Tech-Brain Agent</div>
      </div>

      <div class="chat-body" ref="chatBodyRef">
        <div v-for="(msg, index) in messages" :key="index" class="msg-row">
          <div class="avatar" v-if="msg.role === 'ai'">✨</div>

        <!-- 使用 v-html 指令注入解析后的 HTML -->
          <div class="msg-content markdown-body" :class="msg.role">
          <div v-if="msg.role === 'user'">{{ msg.content }}</div>
          <div v-else v-html="parseMarkdown(msg.content)"></div>
          </div>
        </div>
      </div>

      <div class="input-dock">
        <div class="gemini-input-wrapper">
          <textarea 
            v-model="userInput"
            placeholder="输入给 Tech-Brain 的指令..."
            class="custom-textarea"
            rows="1"
            @keydown.enter.prevent="handleSend"
          ></textarea>
          
          <div class="input-actions-right">
            <!-- <span class="model-selector">Pro ⌄</span> -->
            <button class="send-btn" @click="handleSend">➤</button>
          </div>
        </div>
        <div class="footer-text">Tech-Brain Agent · RAG 增强模式</div>
      </div>
    </div>

    <div class="extension-pane">
      <div class="pane-header right-header">
        <div class="header-actions">
          <span class="icon-btn" title="菜单">≡</span>
          <span class="icon-btn" title="新建对话">+</span>
        </div>
        
        <div class="right-configs">
          <el-button 
            type="text" 
            class="theme-toggle-btn" 
            @click="toggleTheme"
            :title="isDark ? '切换到亮色模式' : '切换到暗黑模式'"
          >
            <el-icon v-if="isDark" :size="20"><Sunny /></el-icon>
            <el-icon v-else :size="20"><Moon /></el-icon>
          </el-button>
          <div class="user-avatar">U</div>
        </div>
      </div>

      <div class="extension-content">
        <div class="placeholder-box">
          <h2>📚 知识库与扩展模块区</h2>
          <p>当前主题：{{ isDark ? '暗黑模式' : '亮色模式' }}</p>
          <p>测试背景色和文本色是否随着切换而改变。</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { Sunny, Moon } from '@element-plus/icons-vue'
import axios from 'axios' // 引入 HTTP 客户端

import { marked } from 'marked'

// 新增解析函数
const parseMarkdown = (text) => {
  if (!text) return ''
  return marked(text)
}

// ================= 主题切换逻辑 =================
const isDark = ref(true)

onMounted(() => {
  const savedTheme = localStorage.getItem('tech-brain-theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = !window.matchMedia('(prefers-color-scheme: light)').matches
  }
  updateBodyClass()
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('tech-brain-theme', isDark.value ? 'dark' : 'light')
  updateBodyClass()
}

const updateBodyClass = () => {
  if (isDark.value) {
    document.body.classList.remove('light')
  } else {
    document.body.classList.add('light')
  }
}

// ================= 核心：Agent 对话交互逻辑 =================
const userInput = ref('')
const chatBodyRef = ref(null)
const isLoading = ref(false) // 新增：请求发送状态，防止重复连击

const messages = ref([
  { role: 'ai', content: '哥哥，我是你的小助理02，请下达指令吧，我什么都会做的' }
])

const handleSend = async () => {
  const text = userInput.value.trim()
  if (!text || isLoading.value) return // 为空或正在请求时直接拦截

  // 1. 用户消息上屏
  messages.value.push({ role: 'user', content: text })
  userInput.value = ''
  await scrollToBottom()

  // 2. 进入等待状态，给出思考提示
  isLoading.value = true
  messages.value.push({ role: 'ai', content: 'Tech-Brain 正在思考...' })
  await scrollToBottom()

  try {
    // 3. 发送真实请求 (根据之前的截图，使用 query 参数 msg)
    const response = await axios.get('/api/chat', {
      params: { msg: text }
    })

    // 移除“思考中”的占位消息
    messages.value.pop()

    // 4. 解析后端返回的标准 Result 结构
    // 假设后端返回的是 { code: 200, data: "...", message: "..." }
    if (response.data && response.data.code === 200) {
      messages.value.push({ role: 'ai', content: response.data.data })
    } else {
      messages.value.push({ 
        role: 'ai', 
        content: `调用异常：${response.data.message || '后端返回非200状态码'}` 
      })
    }
  } catch (error) {
    // 处理网络崩溃或代理失败的情况
    messages.value.pop()
    messages.value.push({ 
      role: 'ai', 
      content: `网络请求失败，请检查后端服务是否启动。错误信息: ${error.message}` 
    })
  } finally {
    // 5. 释放状态
    isLoading.value = false
    await scrollToBottom()
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}
</script>

<style scoped>
/* ================= 应用变量进行样式重构 ================= */

.workspace-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  /* 应用变量 */
  background-color: var(--tb-color-bg-page);
  color: var(--tb-color-text-primary);
  overflow: hidden;
  transition: background-color 0.3s ease;
}

/* ================= 左侧 Agent 区 ================= */
.agent-pane {
  flex: 3;
  /* 应用变量 */
  background-color: var(--tb-color-bg-panel);
  border-right: 1px solid var(--tb-color-border);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: background-color 0.3s ease;
}

.pane-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.left-header {
  /* 应用变量 */
  border-bottom: 1px solid var(--tb-color-border);
  font-weight: bold;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 130px; /* 稍微加一点底边距 */
}

.msg-row {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  align-items: flex-start;
}

.avatar {
  font-size: 20px;
  /* 品牌色 */
  color: var(--tb-color-primary);
}

.msg-content {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  width: 100%;
  /* 应用变量：主文本色 */
  color: var(--tb-color-text-primary);
}

.msg-content.user {
  text-align: right;
  /* 应用变量：次要文本色/变体品牌色 */
  color: var(--tb-color-text-secondary);
  font-weight: 500;
}

.input-dock {
  position: absolute;
  bottom: 0;
  width: 100%;
  /* 这里的渐变也需要调整以适应亮色模式 */
  /* 我们用带有透明度的背景色变量 */
  background: linear-gradient(180deg, transparent, var(--tb-color-bg-panel) 50%);
  padding: 15px;
  box-sizing: border-box;
}

.gemini-input-wrapper {
  /* 应用变量：输入框背景 */
  background-color: var(--tb-color-bg-input);
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 10px 15px;
  gap: 10px;
  /* 在亮色模式下加一点 subtle 的阴影增加质感 */
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  /* 亮色模式下加个边框 */
  border: 1px solid transparent; 
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* 样式穿透：当 body 带有 .light 时，修改输入框包装器的边框 */
:deep(.light .gemini-input-wrapper) {
  border-color: var(--tb-color-border);
}

.custom-textarea {
  flex: 1;
  background: transparent;
  border: none;
  /* 应用变量 */
  color: var(--tb-color-text-primary);
  font-size: 14px;
  resize: none;
  outline: none;
}

.custom-textarea::placeholder {
  color: var(--tb-color-text-secondary);
  opacity: 0.7;
}

.input-actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.model-selector {
  /* 应用变量 */
  color: var(--tb-color-text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.send-btn {
  background: transparent;
  border: none;
  /* 应用变量 */
  color: var(--tb-color-text-primary);
  font-size: 18px;
  cursor: pointer;
}

.footer-text {
  text-align: center;
  font-size: 12px;
  /* 应用变量 */
  color: var(--tb-color-text-secondary);
  margin-top: 10px;
  opacity: 0.8;
}

/* ================= 右侧 扩展区 ================= */
.extension-pane {
  flex: 7;
  /* 应用变量：网页底色 */
  background-color: var(--tb-color-bg-page);
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;
}

.right-header {
  justify-content: space-between;
  /* 应用变量 */
  border-bottom: 1px solid var(--tb-color-border);
  background-color: var(--tb-color-bg-page);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.header-actions {
  display: flex;
  gap: 20px;
}

.icon-btn {
  font-size: 24px;
  /* 应用变量 */
  color: var(--tb-color-text-secondary);
  cursor: pointer;
}

.right-configs {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 主题按钮样式 */
.theme-toggle-btn {
  color: var(--tb-color-text-secondary) !important;
  padding: 0;
  margin-right: 5px;
}
.theme-toggle-btn:hover {
  color: var(--tb-color-primary) !important;
}

.user-avatar {
  width: 32px;
  height: 32px;
  /* 应用变量：品牌色 */
  background-color: var(--tb-color-primary);
  color: #fff; /* 头像文字保持白色 */
  border-radius: 50%;
  text-align: center;
  line-height: 32px;
  font-size: 14px;
  font-weight: bold;
}

.extension-content {
  flex: 1;
  padding: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 临时占位框样式 */
.placeholder-box {
  /* 应用变量 */
  border: 2px dashed var(--tb-color-border);
  background-color: var(--tb-color-bg-panel);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  /* 应用变量 */
  color: var(--tb-color-text-secondary);
  width: 80%;
  max-width: 600px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.placeholder-box h2 {
  color: var(--tb-color-text-primary);
}

/* ================= Markdown 富文本样式 ================= */
:deep(.markdown-body p) {
  margin-top: 0;
  margin-bottom: 10px;
}

:deep(.markdown-body strong) {
  font-weight: 600;
  color: var(--tb-color-primary); /* 让加粗的文字带点主题色，更醒目 */
}

:deep(.markdown-body ul), :deep(.markdown-body ol) {
  margin-top: 0;
  margin-bottom: 10px;
  padding-left: 20px;
}

:deep(.markdown-body li) {
  margin-bottom: 5px;
}

:deep(.markdown-body hr) {
  border: 0;
  border-top: 1px solid var(--tb-color-border);
  margin: 15px 0;
}

/* 简单的代码块样式预留 */
:deep(.markdown-body pre), :deep(.markdown-body code) {
  background-color: var(--tb-color-bg-input);
  border-radius: 4px;
  font-family: monospace;
}
:deep(.markdown-body code) {
  padding: 2px 4px;
  color: #e83e8c;
}
:deep(.markdown-body pre code) {
  padding: 10px;
  display: block;
  color: var(--tb-color-text-primary);
  overflow-x: auto;
}
</style>