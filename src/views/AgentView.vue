<template>
  <div class="workspace-layout">
    
    <div class="agent-pane">
      <div class="pane-header left-header">
        <div class="title">Tech-Brain Agent</div>
      </div>

      <div class="chat-body" ref="chatBodyRef">
        <div v-for="(msg, index) in messages" :key="index" class="msg-row">
          <div class="avatar" v-if="msg.role === 'ai'">✨</div>
          <div class="msg-content" :class="msg.role">
            {{ msg.content }}
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
        <div class="user-avatar">U</div>
      </div>

      <div class="extension-content">
        <div class="placeholder-box">
          <h2>📚 知识库与扩展模块区</h2>
          <p>这里将用来嵌入你的 Notes 笔记管理表格，以及未来的其他组件。</p>
          <p>（后续可以通过 Vue 的组件引入功能，把 NotesView.vue 直接嵌入到这里）</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const userInput = ref('')
const chatBodyRef = ref(null)

const messages = ref([
  { role: 'user', content: '测试左3右7分栏布局' },
  { role: 'ai', content: '布局已更新。左侧占比 30% 用于独立对话，右侧占比 70% 用于知识库管理。' }
])

const handleSend = async () => {
  if (!userInput.value.trim()) return

  messages.value.push({ role: 'user', content: userInput.value })
  const text = userInput.value
  userInput.value = ''
  await scrollToBottom()

  setTimeout(async () => {
    messages.value.push({ role: 'ai', content: `收到指令：${text}。` })
    await scrollToBottom()
  }, 800)
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}
</script>

<style scoped>
/* 整体工作台布局 */
.workspace-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #131314;
  color: #e3e3e3;
  overflow: hidden; /* 防止出现全局滚动条 */
}

/* ================= 左侧 Agent 区 ================= */
.agent-pane {
  flex: 3; /* 核心：占据 3 份宽度 */
  background-color: #1e1f20; /* 左侧底色稍微提亮，与右侧区分 */
  border-right: 1px solid #333; /* 分割线 */
  display: flex;
  flex-direction: column;
  position: relative;
}

.pane-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.left-header {
  border-bottom: 1px solid #333;
  font-weight: bold;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 120px; /* 给输入框留空间 */
}

.msg-row {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  align-items: flex-start;
}

.avatar {
  font-size: 20px;
}

.msg-content {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  width: 100%;
}

.msg-content.user {
  text-align: right;
  color: #c4c7c5;
}

.input-dock {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: linear-gradient(180deg, transparent, #1e1f20 30%);
  padding: 15px;
  box-sizing: border-box;
}

.gemini-input-wrapper {
  background-color: #2a2b2c;
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 10px 15px;
  gap: 10px;
}

.custom-textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: #e3e3e3;
  font-size: 14px;
  resize: none;
  outline: none;
}

.input-actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.model-selector {
  color: #c4c7c5;
  font-size: 12px;
  cursor: pointer;
}

.send-btn {
  background: transparent;
  border: none;
  color: #e3e3e3;
  font-size: 18px;
  cursor: pointer;
}

.footer-text {
  text-align: center;
  font-size: 12px;
  color: #8e8e8e;
  margin-top: 10px;
}

/* ================= 右侧 扩展区 ================= */
.extension-pane {
  flex: 7; /* 核心：占据 7 份宽度 */
  background-color: #131314;
  display: flex;
  flex-direction: column;
}

.right-header {
  justify-content: space-between; /* 元素两端对齐 */
  border-bottom: 1px solid #333;
}

.header-actions {
  display: flex;
  gap: 20px;
}

.icon-btn {
  font-size: 24px;
  color: #c4c7c5;
  cursor: pointer;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background-color: #1e88e5;
  border-radius: 50%;
  text-align: center;
  line-height: 32px;
  font-size: 14px;
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
  border: 2px dashed #444;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  color: #8e8e8e;
  width: 80%;
  max-width: 600px;
}
</style>