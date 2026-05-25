<template>
  <div class="workspace-layout">

    <div class="agent-pane">
      <div class="pane-header left-header">
        <div class="title">Tech-Brain Agent</div>
        <button class="new-conv-btn" @click="startNewConversation">+ 新会话</button>
      </div>

      <!-- 会话列表区域 -->
      <div class="conversation-list" v-if="conversations.length > 0">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conv-item"
          :class="{ active: conv.id === currentConversationId }"
          @click="loadConversation(conv.id)"
          :title="conv.title || '新会话'"
        >
          <span class="conv-icon">💬</span>
          <span class="conv-title">{{ conv.title || '新会话' }}</span>
          <span class="conv-delete-btn" @click.stop="deleteConversation(conv.id)" title="删除会话">×</span>
        </div>
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
            <button class="send-btn" @click="handleSend">➤</button>
          </div>
        </div>
        <div class="footer-text">Tech-Brain Agent · RAG 增强模式</div>
      </div>
    </div>

    <!-- AI 总结弹窗（聊天触发） -->
    <el-dialog
      v-model="summaryDialogVisible"
      title="AI总结"
      width="640px"
      :append-to-body="true"
      class="custom-dialog"
      @close="onSummaryDialogClose"
    >
      <div v-if="summaryLoading" class="summary-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>AI 正在总结中...</span>
      </div>
      <template v-else>
        <div v-if="summarySourceName" class="summary-topic">主题：{{ summarySourceName }}</div>
        <div class="summary-content markdown-body" v-html="parseMarkdown(summaryContent)"></div>
      </template>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onSummaryDialogClose">关闭</el-button>
          <el-button type="primary" :disabled="summaryLoading || !summaryContent" @click="copySummaryFromChat">复制总结</el-button>
        </span>
      </template>
    </el-dialog>

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
  <el-button link class="theme-toggle-btn" @click="toggleTheme">
    <el-icon v-if="isDark" :size="20"><Sunny /></el-icon>
    <el-icon v-else :size="20"><Moon /></el-icon>
  </el-button>

  <el-popover placement="bottom-end" :width="220" trigger="click" popper-class="profile-popper">
    <template #reference>
  <div style="cursor: pointer; display: flex; align-items: center;">
    <el-avatar :size="34" :src="userInfo.avatar" style="background-color: var(--tb-color-primary);">
      {{ userInfo.name?.charAt(0) || userInfo.username?.charAt(0) || 'U' }}
    </el-avatar>
  </div>
</template>

    <ProfileCard
      :userInfo="userInfo"
      @logout="handleLogout"
      @open-settings="goToProfile"
    />
  </el-popover>
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
import { Sunny, Moon, Loading } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import request from '@/utils/request'
import { marked } from 'marked'

import NotesView from './NotesView.vue'

import { useRouter } from 'vue-router'
import ProfileCard from '@/components/ProfileCard.vue'

const router = useRouter()

const userInfo = ref({
  name: '',
  username: '',
  avatar: '',
  level: 1
})

// ================= 会话管理状态 =================
const currentConversationId = ref(null)
const conversations = ref([])
const conversationLoading = ref(false)

const WELCOME_MSG = { role: 'ai', content: '###  欢迎回来，哥哥！\n\n我是你的专属小助理 **02**' }

// 获取会话列表
const fetchConversations = async () => {
  try {
    const res = await request.get('/conversation/list')
    if (res.code === 200 && res.data) {
      conversations.value = res.data
    }
  } catch (error) {
    console.warn('获取会话列表失败，已忽略', error)
  }
}

// 加载指定会话的历史消息
const loadConversation = async (conversationId) => {
  if (conversationId === currentConversationId.value) return
  currentConversationId.value = conversationId
  conversationLoading.value = true
  try {
    const res = await request.get(`/conversation/${conversationId}/messages`)
    if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
      const history = res.data.map(m => ({
        role: m.role === 'assistant' ? 'ai' : 'user',
        content: m.content
      }))
      messages.value = [{ ...WELCOME_MSG }, ...history]
    } else {
      messages.value = [{ ...WELCOME_MSG }]
    }
  } catch (error) {
    console.warn('加载历史消息失败，已忽略', error)
    messages.value = [{ ...WELCOME_MSG }]
  } finally {
    conversationLoading.value = false
  }
  await scrollToBottom()
}

// 新会话：清空 id、输入框，重置欢迎语
const startNewConversation = () => {
  currentConversationId.value = null
  messages.value = [{ ...WELCOME_MSG }]
  userInput.value = ''
}

// 删除会话
const deleteConversation = async (conversationId) => {
  try {
    await ElMessageBox.confirm('确定删除该会话吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await request.delete(`/conversation/${conversationId}`)
    if (conversationId === currentConversationId.value) {
      currentConversationId.value = null
      messages.value = [{ ...WELCOME_MSG }]
      userInput.value = ''
    }
    await fetchConversations()
    ElMessage.success('会话已删除')
  } catch (error) {
    ElMessage.error('删除失败，请重试')
  }
}

onMounted(async () => {
  // 加载用户信息
  try {
    const res = await request.get('/info')
    if (res.code === 200 && res.data) {
      userInfo.value = res.data
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }

  // 加载主题
  const savedTheme = localStorage.getItem('tech-brain-theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = !window.matchMedia('(prefers-color-scheme: light)').matches
  }
  updateBodyClass()

  // 加载会话列表（失败不影响页面）
  await fetchConversations()
})

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('tech-brain-theme')
  router.push('/login')
}

const goToProfile = () => {
  router.push('/profile')
}

const textareaRef = ref(null)

const handleSaveAiMsg = (content) => {
  if (notesViewRef.value) {
    notesViewRef.value.openAddNote(content)
  }
}

// ================= 组件引用与跨组件调用 =================
const notesViewRef = ref(null)

const triggerAddNote = () => {
  if (notesViewRef.value) {
    notesViewRef.value.openAddNote()
    isDrawerVisible.value = false
  }
}

const parseMarkdown = (text) => {
  if (!text) return ''
  return marked(text)
}

const isDrawerVisible = ref(false)

// ================= 主题切换逻辑 =================
const isDark = ref(true)

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

// ================= AI 总结弹窗状态 =================
const summaryDialogVisible = ref(false)
const summaryLoading = ref(false)
const summarySourceName = ref('')
const summaryContent = ref('')
const summaryArticleId = ref(null)
const summaryType = ref('')
const pendingSummaryFromChat = ref(false)
const summaryDialogManuallyClosed = ref(false)

const isSummaryIntent = (msg) => {
  const intentWords = ['总结', 'AI总结', '整理成要点', '提炼要点', '面试话术', '概括', '摘要']
  const targetWords = ['第', '篇', '文章', '笔记', 'note', 'article']
  return intentWords.some(k => msg.includes(k)) && targetWords.some(k => msg.includes(k))
}

const handleSummaryResult = (raw) => {
  if (!raw) return
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return
  }
  if (data.type !== 'article_summary') return

  pendingSummaryFromChat.value = false

  if (data.success !== true) {
    summaryLoading.value = false
    summaryDialogVisible.value = false
    ElMessage.warning(data.chatMessage || '总结失败')
    return
  }

  if (!data.summary) {
    summaryLoading.value = false
    summaryDialogVisible.value = false
    ElMessage.warning('总结内容为空')
    return
  }

  summarySourceName.value = data.title || ''
  summaryContent.value = data.summary
  summaryArticleId.value = data.articleId ?? null
  summaryType.value = data.summaryType || 'normal'
  summaryLoading.value = false

  if (!summaryDialogManuallyClosed.value) {
    summaryDialogVisible.value = true
  } else {
    ElMessage.success('总结完成，可重新打开查看')
  }
}

const onSummaryDialogClose = () => {
  if (summaryLoading.value) {
    summaryDialogManuallyClosed.value = true
  }
  summaryDialogVisible.value = false
}

const clearSummaryState = () => {
  summarySourceName.value = ''
  summaryContent.value = ''
  summaryArticleId.value = null
  summaryType.value = ''
  summaryLoading.value = false
  pendingSummaryFromChat.value = false
  summaryDialogManuallyClosed.value = false
}

const copySummaryFromChat = async () => {
  if (!summaryContent.value) return
  try {
    await navigator.clipboard.writeText(summaryContent.value)
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

// ================= 核心：Agent 对话交互逻辑 =================
const userInput = ref('')
const chatBodyRef = ref(null)
const isLoading = ref(false)

const messages = ref([{ ...WELCOME_MSG }])

const handleSend = async () => {
  const text = userInput.value.trim()
  if (!text || isLoading.value) return

  messages.value.push({ role: 'user', content: text })
  userInput.value = ''

  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  })

  await scrollToBottom()

  // 总结意图判断：先打开 loading 弹窗
  if (isSummaryIntent(text)) {
    pendingSummaryFromChat.value = true
    summaryDialogManuallyClosed.value = false
    summaryLoading.value = true
    summaryContent.value = ''
    summarySourceName.value = ''
    summaryType.value = ''
    summaryArticleId.value = null
    summaryDialogVisible.value = true
  }

  isLoading.value = true
  messages.value.push({ role: 'ai', content: '' })
  const aiMsg = messages.value[messages.value.length - 1]
  await scrollToBottom()

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': localStorage.getItem('token') || ''
      },
      body: JSON.stringify({
        conversationId: currentConversationId.value,
        msg: text
      })
    })

    if (!response.ok || !response.body) {
      aiMsg.content = `请求失败：HTTP ${response.status}`
      isLoading.value = false
      if (pendingSummaryFromChat.value) {
        pendingSummaryFromChat.value = false
        summaryLoading.value = false
        summaryDialogVisible.value = false
      }
      await scrollToBottom()
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      let currentEvent = ''
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          const raw = line.slice(5).trim()
          let parsed
          try {
            parsed = JSON.parse(raw)
          } catch {
            parsed = null
          }
          if (currentEvent === 'message') {
            aiMsg.content += parsed?.content ?? raw
            await scrollToBottom()
          } else if (currentEvent === 'done') {
            currentConversationId.value = parsed?.conversationId ?? raw
            await fetchConversations()
            isLoading.value = false
            // done 兜底：如果总结意图还在 pending，说明后端未返回 summary_result
            if (pendingSummaryFromChat.value) {
              pendingSummaryFromChat.value = false
              summaryLoading.value = false
              summaryDialogVisible.value = false
              ElMessage.warning('未收到总结结果，请稍后重试')
            }
          } else if (currentEvent === 'error') {
            aiMsg.content = `错误：${parsed?.message ?? raw}`
            isLoading.value = false
            if (pendingSummaryFromChat.value) {
              pendingSummaryFromChat.value = false
              summaryLoading.value = false
              summaryDialogVisible.value = false
            }
          } else if (currentEvent === 'summary_result') {
            handleSummaryResult(raw)
          }
          currentEvent = ''
        }
      }
    }
  } catch (error) {
    aiMsg.content = `网络请求失败，请检查后端服务是否启动。错误信息: ${error.message}`
    if (pendingSummaryFromChat.value) {
      pendingSummaryFromChat.value = false
      summaryLoading.value = false
      summaryDialogVisible.value = false
    }
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

const adjustHeight = () => {
  nextTick(() => {
    const textarea = textareaRef.value
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  })
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
  justify-content: space-between;
  flex-shrink: 0;
}

.new-conv-btn {
  background: transparent;
  border: 1px solid var(--tb-color-border);
  color: var(--tb-color-text-secondary);
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 14px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
  white-space: nowrap;
}
.new-conv-btn:hover {
  color: var(--tb-color-primary);
  border-color: var(--tb-color-primary);
}

/* ================= 会话列表（横向滚动） ================= */
.conversation-list {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid var(--tb-color-border);
  scrollbar-width: none; /* Firefox */
}
.conversation-list::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  max-width: 130px;
  padding: 4px 10px;
  border-radius: 14px;
  border: 1px solid var(--tb-color-border);
  cursor: pointer;
  font-size: 12px;
  color: var(--tb-color-text-secondary);
  background-color: transparent;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
}
.conv-item:hover {
  background-color: var(--tb-color-bg-input);
  color: var(--tb-color-text-primary);
}
.conv-item.active {
  border-color: var(--tb-color-primary);
  color: var(--tb-color-primary);
  background-color: var(--tb-color-bg-input);
  font-weight: 500;
}
.conv-icon {
  font-size: 11px;
  flex-shrink: 0;
}
.conv-title {
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.conv-delete-btn {
  flex-shrink: 0;
  display: none;
  font-size: 14px;
  line-height: 1;
  color: var(--tb-color-text-secondary);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  text-align: center;
  transition: color 0.2s;
}
.conv-item:hover .conv-delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.conv-delete-btn:hover {
  color: #f56c6c;
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
  transition: border-color 0.3s, box-shadow 0.3s;
}

.gemini-input-wrapper:focus-within {
  border-color: #409eff;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.2);
}

.custom-textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--tb-color-text-primary);
  font-size: 15px;
  line-height: 1.5;
  min-height: 24px;
  max-height: 150px;
  overflow-y: auto;
  padding: 2px 0;
  margin: 0;
  resize: none;
  outline: none;
  box-sizing: border-box;
  word-break: break-all;
  white-space: pre-wrap;
}

.custom-textarea::-webkit-scrollbar {
  width: 6px;
}
.custom-textarea::-webkit-scrollbar-thumb {
  background-color: var(--tb-color-border);
  border-radius: 4px;
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
  height: 100vh;
  transition: background-color 0.3s ease;
}

.extension-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.ai-msg-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px dashed var(--tb-color-border);
}

.save-action-btn {
  color: #ff4d4f;
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

/* ================= AI 总结弹窗 ================= */
.summary-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  color: var(--tb-color-text-secondary);
  font-size: 14px;
}
.summary-loading .el-icon {
  font-size: 28px;
  color: var(--tb-color-primary);
}
.summary-topic {
  font-size: 13px;
  color: var(--tb-color-text-secondary);
  margin-bottom: 12px;
}
.summary-content {
  max-height: 480px;
  overflow-y: auto;
  line-height: 1.8;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
