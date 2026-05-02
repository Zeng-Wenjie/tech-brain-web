<template>
  <div class="workspace-layout">
    
    <div class="agent-pane">
      <div class="pane-header left-header">
        <div class="title">Tech-Brain Agent</div>
      </div>

      <div class="chat-body" ref="chatBodyRef">
        <div v-for="(msg, index) in messages" :key="index" class="msg-row">
          <div class="avatar" v-if="msg.role === 'ai'">✨</div>
          <div class="msg-content markdown-body" :class="msg.role">
            <div v-if="msg.role === 'user'">{{ msg.content }}</div>
            
            <div v-else-if="index === 0">
              <div v-html="parseMarkdown(msg.content)"></div>
            </div>

            <div v-else class="ai-msg-box">
              <div v-html="parseMarkdown(msg.content)"></div>
              <div class="ai-msg-footer">
                <span class="save-action-btn" @click="handleSaveAiMsg(msg.content)">保存</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="input-dock">
        <div class="gemini-input-wrapper">
          <textarea 
          ref="textareaRef"
          v-model="userInput"
          placeholder="输入给 Tech-Brain 的指令..."
          class="custom-textarea"
          rows="1"
          @input="adjustHeight"
          @keydown.enter.prevent="handleSend"
          ></textarea>
          
          <div class="input-actions-right">
            <!-- <span class="model-selector">保存</span> -->
            <button class="send-btn" @click="handleSend">➤</button>
          </div>
        </div>
        <div class="footer-text">Tech-Brain Agent · RAG 增强模式</div>
      </div>
    </div>

    <div class="extension-pane">
      
      <div class="pane-header right-header">
       <div class="header-actions" style="display: flex; align-items: center; gap: 15px;">
          <span class="icon-btn" title="菜单" @click="isDrawerVisible = !isDrawerVisible">≡</span>
          
          <template v-if="notesViewRef && !notesViewRef.isManageMode">
            <span class="action-text-btn" @click="triggerAddNote">➕ 新建</span>
            <span class="action-text-btn" @click="notesViewRef.toggleManageMode()">编辑</span>
          </template>

          <template v-else-if="notesViewRef && notesViewRef.isManageMode">
            <span class="action-text-btn" @click="notesViewRef.toggleManageMode()">取消</span>
            <span class="action-text-btn danger" @click="notesViewRef.batchDeleteNotes()">删除 ({{ notesViewRef.selectedIds.length }})</span>
          </template>
        </div>
        
        <div class="right-configs">
          <el-button 
            link 
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

      <div class="extension-content" style="position: relative; overflow: hidden; display: flex; flex-direction: column;">
        
        <el-drawer
          v-model="isDrawerVisible"
          direction="ltr"
          :with-header="false"
          size="240px"
          :append-to-body="false"
          class="notes-drawer"
        >
          <div class="drawer-container">
            <div class="drawer-section" style="margin-top: 20px;">
              <div class="menu-item active"><span class="icon">📝</span> 全部笔记</div>
            </div>
            
            <div class="drawer-footer">
              <div class="menu-item"><span class="icon">⚙</span> 设置和帮助</div>
            </div>
          </div>
        </el-drawer>

        <NotesView ref="notesViewRef" />

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { Sunny, Moon } from '@element-plus/icons-vue' // 清理了不需要的 Close 和 Back
import request from '@/utils/request'
import { marked } from 'marked'

// 导入刚刚创建的子组件
import NotesView from './NotesView.vue'

const textareaRef = ref(null)
// 触发保存 AI 消息的方法
const handleSaveAiMsg = (content) => {
  if (notesViewRef.value) {
    // 调用子组件的方法，并把 AI 的内容传过去
    notesViewRef.value.openAddNote(content)
  }
}

// ================= 组件引用与跨组件调用 =================
const notesViewRef = ref(null)

// 触发子组件的新建笔记弹窗
const triggerAddNote = () => {
  if (notesViewRef.value) {
    notesViewRef.value.openAddNote()
    // 为了体验更好，点完新建如果抽屉开着，顺手关掉抽屉
    isDrawerVisible.value = false 
  }
}

// 新增解析函数
const parseMarkdown = (text) => {
  if (!text) return ''
  return marked(text)
}

// 控制侧边抽屉菜单的显示与隐藏
const isDrawerVisible = ref(false)

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
const isLoading = ref(false) 

const messages = ref([
  { 
    role: 'ai', 
    content: '###  欢迎回来，哥哥！\n\n我是你的专属小助理 **02**' 
  }
])

const handleSend = async () => {
  const text = userInput.value.trim()
  if (!text || isLoading.value) return 

  messages.value.push({ role: 'user', content: text })
  userInput.value = ''
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
  await scrollToBottom()

  isLoading.value = true
  messages.value.push({ role: 'ai', content: 'Tech-Brain 正在思考...' })
  await scrollToBottom()

  try {
    const response = await request.get('/chat', {
      params: { msg: text }
    })
    messages.value.pop()

    if (response.data && response.code === 200) {
      messages.value.push({ role: 'ai', content: response.data })
    } else {
      messages.value.push({ 
        role: 'ai', 
        content: `调用异常：${response.data.message || '后端返回非200状态码'}` 
      })
    }
  } catch (error) {
    messages.value.pop()
    messages.value.push({ 
      role: 'ai', 
      content: `网络请求失败，请检查后端服务是否启动。错误信息: ${error.message}` 
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }

  // 💡 核心：动态自适应高度函数
const adjustHeight = () => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  // 先把高度重置，这样删减文字时才能自动缩小
  textarea.style.height = 'auto' 
  
  // 拿到文字实际撑开的高度
  const scrollHeight = textarea.scrollHeight
  
  // 限制最大高度为 150px (大概 6 行)，超过了就出现内部滚动条
  if (scrollHeight <= 150) {
    textarea.style.height = scrollHeight + 'px'
    textarea.style.overflowY = 'hidden'
  } else {
    textarea.style.height = '150px'
    textarea.style.overflowY = 'auto'
  }
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
  background-color: var(--tb-color-bg-page);
  color: var(--tb-color-text-primary);
  overflow: hidden;
  transition: background-color 0.3s ease;
}

/* ================= 左侧 Agent 区 ================= */
.agent-pane {
  flex: 3;
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
  border-bottom: 1px solid var(--tb-color-border);
  font-weight: bold;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 130px; 
}

.msg-row {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  align-items: flex-start;
}

.avatar {
  font-size: 20px;
  color: var(--tb-color-primary);
}

.msg-content {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  width: 100%;
  color: var(--tb-color-text-primary);
}

.msg-content.user {
  text-align: right;
  color: var(--tb-color-text-secondary);
  font-weight: 500;
}

.input-dock {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: linear-gradient(180deg, transparent, var(--tb-color-bg-panel) 50%);
  padding: 15px;
  box-sizing: border-box;
}

.gemini-input-wrapper {
  background-color: var(--tb-color-bg-input);
  border-radius: 20px;
  display: flex;
  align-items: flex-end; 
  padding: 10px 15px;
  gap: 10px;
  border: 1px solid transparent; 
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.gemini-input-wrapper:focus-within {
  border-color: #409eff; /* Element Plus 经典科技蓝 */
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

:deep(.light .gemini-input-wrapper) {
  border-color: var(--tb-color-border);
}

.custom-textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--tb-color-text-primary);
  font-size: 15px; /* 字号稍微调大一点点更有质感 */
  resize: none;
  outline: none;
  line-height: 1.5;
  padding: 4px 0; /* 调整内边距让文字更居中 */
  overflow-y: hidden; /* 默认隐藏滚动条 */
  transition: height 0.1s ease; /* 伸缩高度时的丝滑过渡 */
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
  color: var(--tb-color-text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.send-btn {
  background: transparent;
  border: none;
  color: var(--tb-color-text-primary);
  font-size: 18px;
  cursor: pointer;
}

.footer-text {
  text-align: center;
  font-size: 12px;
  color: var(--tb-color-text-secondary);
  margin-top: 10px;
  opacity: 0.8;
}

/* ================= 右侧扩展区基础 ================= */
.extension-pane {
  flex: 7;
  background-color: var(--tb-color-bg-page);
  display: flex;
  flex-direction: column; 
  height: 100vh; /* 强制满高 */
  transition: background-color 0.3s ease;
}

.extension-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%; /* 强制向下撑满 */
  overflow: hidden;
}

.right-header {
  justify-content: space-between;
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
  color: var(--tb-color-text-secondary);
  cursor: pointer;
}

.right-configs {
  display: flex;
  align-items: center;
  gap: 15px;
}

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
  background-color: var(--tb-color-primary);
  color: #fff; 
  border-radius: 50%;
  text-align: center;
  line-height: 32px;
  font-size: 14px;
  font-weight: bold;
}

/* ================= Markdown 富文本样式 ================= */
:deep(.markdown-body p) { margin-top: 0; margin-bottom: 10px; }
:deep(.markdown-body strong) { font-weight: 600; color: var(--tb-color-primary); }
:deep(.markdown-body ul), :deep(.markdown-body ol) { margin-top: 0; margin-bottom: 10px; padding-left: 20px; }
:deep(.markdown-body li) { margin-bottom: 5px; }
:deep(.markdown-body hr) { border: 0; border-top: 1px solid var(--tb-color-border); margin: 15px 0; }
:deep(.markdown-body pre), :deep(.markdown-body code) { background-color: var(--tb-color-bg-input); border-radius: 4px; font-family: monospace; }
:deep(.markdown-body code) { padding: 2px 4px; color: #e83e8c; }
:deep(.markdown-body pre code) { padding: 10px; display: block; color: var(--tb-color-text-primary); overflow-x: auto; }

/* ================= 局部抽屉核心 ================= */
:deep(.el-overlay) {
  position: absolute !important;
  top: 0; left: 0; width: 100%; height: 100%;
}
:deep(.notes-drawer) {
  position: absolute !important;
  background-color: var(--tb-color-bg-panel);
  color: var(--tb-color-text-primary);
}
:deep(.el-drawer__body) { padding: 0; }

.drawer-container { display: flex; flex-direction: column; height: 100%; padding: 10px 20px; background-color: var(--tb-color-bg-panel); }
.drawer-header { height: 40px; display: flex; align-items: center; margin-bottom: 20px; }
.drawer-section { margin-bottom: 25px; }
.section-title { font-size: 12px; color: var(--tb-color-text-secondary); font-weight: bold; margin-bottom: 10px; padding: 0 10px; }
.menu-item { display: flex; align-items: center; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-size: 14px; color: var(--tb-color-text-primary); transition: background-color 0.2s; margin-bottom: 4px; }
.menu-item:hover { background-color: var(--tb-color-bg-input); }
.menu-item.active { background-color: #1a3c63; color: #e3e3e3; }
.light .menu-item.active { background-color: #d3e3fd; color: #041e49; }
.menu-item .icon { margin-right: 10px; font-size: 16px; }
.drawer-footer { margin-top: auto; padding-bottom: 20px; }

/* ================= AI 消息气泡框样式 ================= */
.ai-msg-box {
  background-color: var(--tb-color-bg-panel);
  border: 1px solid var(--tb-color-border);
  border-radius: 12px;
  padding: 15px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* 淡淡的投影增加立体感 */
}

.ai-msg-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px dashed var(--tb-color-border); /* 虚线分割线 */
}

.save-action-btn {
  color: #ff4d4f; /* 醒目的红色 */
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
  user-select: none;
}

.save-action-btn:hover {
  opacity: 0.7;
}

.action-text-btn {
  cursor: pointer;
  font-size: 15px;
  color: var(--tb-color-text-secondary);
  transition: color 0.2s;
}
.action-text-btn:hover {
  color: var(--tb-color-primary);
}
.action-text-btn.danger {
  color: #f56c6c;
  font-weight: bold;
}
.action-text-btn.danger:hover {
  color: #ff8989;
}
</style>