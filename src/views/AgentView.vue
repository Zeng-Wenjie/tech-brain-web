<template>
  <div class="gemini-layout">
    <div class="sidebar">
      <div class="menu-icon">≡</div>
      <div class="new-chat-icon">+</div>
    </div>

    <div class="main-content">
      <div class="header">
        <div class="title">Tech-Brain Agent</div>
        <div class="user-avatar">U</div>
      </div>

      <div class="chat-body" ref="chatBodyRef">
        <div class="content-limit">
          <div v-for="(msg, index) in messages" :key="index" class="msg-row">
            <div class="avatar" v-if="msg.role === 'ai'">✨</div>
            
            <div class="msg-content" :class="msg.role">
              {{ msg.content }}
            </div>
          </div>
        </div>
      </div>

      <div class="input-dock">
        <div class="input-content-limit">
          <div class="gemini-input-wrapper">
            <div class="input-actions-left">
              <span class="icon-btn">+</span>
            </div>
            
            <textarea 
              v-model="userInput"
              placeholder="输入给 Tech-Brain 的指令..."
              class="custom-textarea"
              rows="1"
              @keydown.enter.prevent="handleSend"
            ></textarea>
            
            <div class="input-actions-right">
              <span class="model-selector">Pro ⌄</span>
              <button class="send-btn" @click="handleSend">➤</button>
            </div>
          </div>
          <div class="footer-text">Tech-Brain 是一款 AI Agent 工具，其回答未必正确无误。</div>
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
  { role: 'user', content: '欢迎回来，哥哥' },
  { role: 'ai', content: '我是你的小助手，请问有什么我可以帮你的吗？'}
])

const handleSend = async () => {
  if (!userInput.value.trim()) return

  messages.value.push({ role: 'user', content: userInput.value })
  const text = userInput.value
  userInput.value = ''
  await scrollToBottom()

  // 模拟接口调用延迟
  setTimeout(async () => {
    messages.value.push({ role: 'ai', content: `收到指令：${text}。等待后端 /api/chat 接口联调。` })
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
.gemini-layout {
  display: flex;
  height: 100vh;
  background-color: #131314;
}

/* 简易侧边栏 */
.sidebar {
  width: 60px;
  background-color: #1e1f20;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
  gap: 30px;
  color: #c4c7c5;
  font-size: 24px;
  cursor: pointer;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 顶部标题 */
.header {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: #e3e3e3;
  font-size: 18px;
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

/* 聊天主体 */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 150px; /* 给底部留空间 */
}

.content-limit {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.msg-row {
  display: flex;
  gap: 15px;
  margin-bottom: 40px;
  align-items: flex-start;
}

.avatar {
  font-size: 24px;
}

.msg-content {
  font-size: 16px;
  line-height: 1.6;
  color: #e3e3e3;
  white-space: pre-wrap;
  width: 100%;
}

.msg-content.user {
  text-align: right; /* Gemini默认用户消息靠右或无头像 */
  color: #c4c7c5;
}

/* 底部输入框 */
.input-dock {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: linear-gradient(180deg, transparent, #131314 30%);
  display: flex;
  justify-content: center;
  padding-bottom: 10px;
}

.input-content-limit {
  max-width: 800px;
  width: 100%;
  padding: 0 20px;
}

.gemini-input-wrapper {
  background-color: #1e1f20;
  border-radius: 30px;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  gap: 15px;
}

.icon-btn {
  font-size: 24px;
  color: #c4c7c5;
  cursor: pointer;
}

.custom-textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: #e3e3e3;
  font-size: 16px;
  resize: none;
  outline: none;
  font-family: inherit;
  padding: 5px 0;
}

.custom-textarea::placeholder {
  color: #8e8e8e;
}

.input-actions-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.model-selector {
  color: #c4c7c5;
  font-size: 14px;
  cursor: pointer;
}

.send-btn {
  background: transparent;
  border: none;
  color: #e3e3e3;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
}

.footer-text {
  text-align: center;
  font-size: 12px;
  color: #8e8e8e;
  margin-top: 15px;
}
</style>