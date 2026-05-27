<template>
  <div class="tb-app">

    <!-- ═══════════════ 左侧导航栏 ═══════════════ -->
    <aside class="tb-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- Logo + 折叠按钮 -->
      <div class="sidebar-logo">
        <div class="logo-icon"><span>TB</span></div>
        <span class="logo-text" v-show="!sidebarCollapsed">Tech-Brain</span>
        <el-icon
          class="sidebar-toggle"
          :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
          @click="toggleSidebar"
        >
          <Fold v-if="!sidebarCollapsed" />
          <Expand v-else />
        </el-icon>
      </div>

      <!-- 新对话 -->
      <div class="new-chat-btn" :title="sidebarCollapsed ? '新对话' : ''" @click="startNewConversation">
        <el-icon><EditPen /></el-icon>
        <span v-show="!sidebarCollapsed">新对话</span>
      </div>

      <!-- 对话历史 -->
      <template v-if="!sidebarCollapsed">
        <div class="sidebar-section-label">最近对话</div>
        <div class="conv-list" v-if="conversations.length">
          <div
            v-for="conv in conversations"
            :key="conv.id"
            class="conv-item"
            :class="{ active: conv.id === currentConversationId }"
            @click="loadConversation(conv.id)"
            :title="conv.title || '新会话'"
          >
            <span class="conv-item-title">{{ conv.title || '新会话' }}</span>
            <span class="conv-item-del" @click.stop="deleteConversation(conv.id)">✕</span>
          </div>
        </div>
        <div v-else class="conv-empty">暂无对话记录</div>
      </template>
      <!-- 折叠时占位，把功能区推到下方 -->
      <div v-else class="conv-list-spacer"></div>

      <!-- 功能入口 -->
      <div class="sidebar-divider"></div>
      <div class="sidebar-section-label" v-show="!sidebarCollapsed">功能</div>

      <div
        class="nav-item"
        :class="{ active: currentView === 'notes' }"
        :title="sidebarCollapsed ? '知识笔记' : ''"
        @click="currentView = 'notes'"
      >
        <el-icon><Notebook /></el-icon>
        <span v-show="!sidebarCollapsed">知识笔记</span>
        <span class="nav-badge" v-if="notesTotal > 0 && !sidebarCollapsed">{{ notesTotal }}</span>
      </div>

      <div class="nav-item disabled" :title="sidebarCollapsed ? '数据分析（即将上线）' : '即将上线'">
        <el-icon><TrendCharts /></el-icon>
        <span v-show="!sidebarCollapsed">数据分析</span>
        <span class="nav-soon" v-show="!sidebarCollapsed">即将上线</span>
      </div>

      <div class="nav-item disabled" :title="sidebarCollapsed ? '学习统计（即将上线）' : '即将上线'">
        <el-icon><DataAnalysis /></el-icon>
        <span v-show="!sidebarCollapsed">学习统计</span>
        <span class="nav-soon" v-show="!sidebarCollapsed">即将上线</span>
      </div>

      <!-- 底部用户区 -->
      <div class="sidebar-bottom">
        <template v-if="isLoggedIn">
          <el-popover placement="top-start" :width="200" trigger="click" popper-class="tb-profile-popper">
            <template #reference>
              <div class="user-area" :title="sidebarCollapsed ? (userInfo.name || userInfo.username) : ''">
                <el-avatar :size="28" :src="userInfo.avatar" class="user-avatar">
                  {{ (userInfo.name || userInfo.username || 'U').charAt(0).toUpperCase() }}
                </el-avatar>
                <div class="user-info" v-show="!sidebarCollapsed">
                  <div class="user-name">{{ userInfo.name || userInfo.username }}</div>
                  <div class="user-sub">个人中心 / 设置</div>
                </div>
                <el-icon class="user-more" v-show="!sidebarCollapsed"><MoreFilled /></el-icon>
              </div>
            </template>
            <div class="profile-pop">
              <div class="profile-pop-name">{{ userInfo.name || userInfo.username }}</div>
              <div class="profile-pop-item" @click="goToProfile">
                <el-icon><UserFilled /></el-icon> 个人中心
              </div>
              <div class="profile-pop-item logout" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon> 退出登录
              </div>
            </div>
          </el-popover>
        </template>
        <template v-else>
          <div class="user-area guest" :title="sidebarCollapsed ? '点击登录' : ''" @click="loginModalVisible = true">
            <div class="user-avatar-guest"><el-icon><User /></el-icon></div>
            <div class="user-info" v-show="!sidebarCollapsed">
              <div class="user-name">未登录</div>
              <div class="user-sub">点击登录 / 注册</div>
            </div>
          </div>
        </template>
      </div>
    </aside>

    <!-- ═══════════════ 主内容区 ═══════════════ -->
    <main class="tb-main">

      <!-- ─── HOME 视图 ─── -->
      <div v-if="currentView === 'home'" class="view-home">
        <div class="home-center">
          <div class="home-greeting">你好，欢迎来到 Tech-Brain</div>
          <div class="home-sub">你的专属 AI 技术知识助理，开始你的第一个对话吧</div>
          <div class="home-prompts">
            <div
              v-for="p in quickPrompts"
              :key="p.text"
              class="prompt-card"
              @click="usePrompt(p.text)"
            >
              <div class="prompt-title">{{ p.text }}</div>
              <div class="prompt-tag">{{ p.tag }}</div>
            </div>
          </div>
          <div class="home-input-wrap">
            <textarea
              ref="homeTextareaRef"
              v-model="userInput"
              class="home-textarea"
              placeholder="有什么想问的，直接说..."
              rows="1"
              @input="adjustHomeHeight"
              @keydown.enter.exact.prevent="handleSend"
            ></textarea>
            <button class="home-send-btn" @click="handleSend">
              <el-icon><Promotion /></el-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- ─── CHAT 视图 ─── -->
      <div v-else-if="currentView === 'chat'" class="view-chat">
        <div class="chat-header">
          <span class="chat-title">{{ currentChatTitle }}</span>
          <div class="chat-header-actions">
            <el-icon class="hdr-icon"><Share /></el-icon>
            <el-icon class="hdr-icon"><MoreFilled /></el-icon>
          </div>
        </div>

        <div class="chat-body" ref="chatBodyRef">
          <div v-for="(msg, idx) in messages" :key="idx" class="msg-row" :class="msg.role">
            <template v-if="msg.role === 'ai'">
              <div class="ai-avatar">TB</div>
              <div class="ai-bubble">
                <div class="ai-content markdown-body" v-html="parseMarkdown(msg.content)"></div>
                <div class="ai-actions" v-if="idx > 0">
                  <button class="ai-action-btn" @click="handleSaveAiMsg(msg.content)">
                    <el-icon><Notebook /></el-icon> 保存笔记
                  </button>
                  <button class="ai-action-btn" @click="copyText(msg.content)">
                    <el-icon><CopyDocument /></el-icon> 复制
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="user-bubble">{{ msg.content }}</div>
            </template>
          </div>
        </div>

        <div class="chat-input-dock">
          <div class="chat-input-wrap">
            <textarea
              ref="chatTextareaRef"
              v-model="userInput"
              class="chat-textarea"
              placeholder="继续向 Tech-Brain 提问..."
              rows="1"
              @input="adjustChatHeight"
              @keydown.enter.exact.prevent="handleSend"
            ></textarea>
            <button class="chat-send-btn" :disabled="isLoading" @click="handleSend">
              <el-icon><Promotion /></el-icon>
            </button>
          </div>
          <div class="chat-footer-tip">Tech-Brain · RAG 增强模式</div>
        </div>
      </div>

      <!-- ─── NOTES 视图 ─── -->
      <div v-else-if="currentView === 'notes'" class="view-notes">
        <div class="notes-topbar">
          <div class="notes-topbar-left">
            <span class="notes-topbar-title">知识笔记</span>
            <span class="notes-topbar-count" v-if="notesTotal > 0">{{ notesTotal }}</span>
          </div>
          <div class="notes-topbar-right">
            <template v-if="notesViewRef && !notesViewRef.isManageMode">
              <span class="topbar-btn primary" @click="triggerAddNote">+ 新建</span>
              <span class="topbar-btn" @click="notesViewRef.toggleManageMode()">编辑</span>
            </template>
            <template v-else-if="notesViewRef && notesViewRef.isManageMode">
              <span class="topbar-btn" @click="notesViewRef.toggleManageMode()">取消</span>
              <span class="topbar-btn danger" @click="notesViewRef.batchDeleteNotes()">
                删除 ({{ notesViewRef.selectedIds.length }})
              </span>
            </template>
          </div>
        </div>
        <NotesView ref="notesViewRef" @total-change="notesTotal = $event" />
      </div>

    </main>

    <!-- ═══════════════ AI 总结弹窗 ═══════════════ -->
    <el-dialog
      v-model="summaryDialogVisible"
      title="AI 总结"
      width="600px"
      :append-to-body="true"
      class="tb-dialog"
      @open="onDialogOpen"
      @close="onSummaryDialogClose"
    >
      <div v-if="summaryLoading" class="dialog-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>AI 正在总结中...</span>
      </div>
      <template v-else>
        <div v-if="summarySourceName" class="summary-topic">主题：{{ summarySourceName }}</div>
        <div class="summary-content markdown-body" v-html="parseMarkdown(summaryContent)"></div>
      </template>
      <template #footer>
        <el-button @click="onSummaryDialogClose">关闭</el-button>
        <el-button type="primary" :disabled="summaryLoading || !summaryContent" @click="copySummaryFromChat">
          复制总结
        </el-button>
      </template>
    </el-dialog>

    <!-- ═══════════════ 登录弹窗 ═══════════════ -->
    <LoginModal v-model:visible="loginModalVisible" @success="onLoginSuccess" />

  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue'
import {
  EditPen, Notebook, TrendCharts, DataAnalysis, User, UserFilled,
  MoreFilled, SwitchButton, Promotion, Share, CopyDocument, Loading,
  Expand, Fold
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import request from '@/utils/request'
import { makeDraggable } from '@/utils/draggable'
import NotesView from './NotesView.vue'
import LoginModal from '@/components/LoginModal.vue'

const router = useRouter()

// ─── 视图状态 ───────────────────────────────────────────
const currentView = ref('home') // 'home' | 'chat' | 'notes'
const sidebarCollapsed = ref(localStorage.getItem('tb:sidebar-collapsed') === '1')
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('tb:sidebar-collapsed', sidebarCollapsed.value ? '1' : '0')
}

// ─── 用户信息 ───────────────────────────────────────────
const userInfo = ref({ name: '', username: '', avatar: '', level: 1 })
const isLoggedIn = computed(() => !!localStorage.getItem('token'))
const loginModalVisible = ref(false)

// ─── 笔记总数（由 NotesView emit） ───────────────────────
const notesTotal = ref(0)
const notesViewRef = ref(null)

// ─── 对话状态 ───────────────────────────────────────────
const currentConversationId = ref(null)
const conversations = ref([])
const messages = ref([])
const userInput = ref('')
const isLoading = ref(false)
const chatBodyRef = ref(null)
const chatTextareaRef = ref(null)
const homeTextareaRef = ref(null)

const WELCOME_MSG = { role: 'ai', content: '### 欢迎回来！\n\n我是你的专属助理 **02**，有什么可以帮你的？' }

const currentChatTitle = computed(() => {
  if (!currentConversationId.value) return '新对话'
  const c = conversations.value.find(c => c.id === currentConversationId.value)
  return c?.title || '新对话'
})

// ─── 快捷 Prompt ───────────────────────────────────────
const quickPrompts = [
  { text: '讲解 Redis 缓存击穿与雪崩的解决方案', tag: '技术知识' },
  { text: '帮我总结 Spring Boot 自动装配原理', tag: '知识总结' },
  { text: '出 5 道 JVM 面试题并给出答案', tag: '面试辅助' },
  { text: '解释 MySQL 联合索引最左前缀原则', tag: '数据库' }
]

function usePrompt(text) {
  userInput.value = text
  handleSend()
}

// ─── 弹窗拖动 ──────────────────────────────────────────
function onDialogOpen() {
  nextTick(() => {
    const el = document.querySelector('.tb-dialog .el-dialog')
    if (el) makeDraggable(el)
  })
}

// ─── 用户相关 ──────────────────────────────────────────
async function loadUserInfo() {
  if (!localStorage.getItem('token')) return
  try {
    const res = await request.get('/info')
    if (res.code === 200 && res.data) userInfo.value = res.data
  } catch { /* ignore */ }
}

function onLoginSuccess(data) {
  userInfo.value = data
  loadUserInfo()
  fetchConversations()
}

function handleLogout() {
  localStorage.removeItem('token')
  userInfo.value = { name: '', username: '', avatar: '', level: 1 }
  currentConversationId.value = null
  conversations.value = []
  messages.value = []
  currentView.value = 'home'
  ElMessage.success('已退出登录')
}

function goToProfile() {
  router.push('/profile')
}

// ─── 全局登录事件监听 ────────────────────────────────────
function onRequireLogin() {
  loginModalVisible.value = true
}

// ─── 对话管理 ──────────────────────────────────────────
async function fetchConversations() {
  if (!localStorage.getItem('token')) return
  try {
    const res = await request.get('/conversation/list')
    if (res.code === 200 && res.data) conversations.value = res.data
  } catch { /* ignore */ }
}

async function loadConversation(id) {
  if (id === currentConversationId.value) {
    currentView.value = 'chat'
    return
  }
  currentConversationId.value = id
  currentView.value = 'chat'
  try {
    const res = await request.get(`/conversation/${id}/messages`)
    if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
      messages.value = [
        { ...WELCOME_MSG },
        ...res.data.map(m => ({ role: m.role === 'assistant' ? 'ai' : 'user', content: m.content }))
      ]
    } else {
      messages.value = [{ ...WELCOME_MSG }]
    }
  } catch {
    messages.value = [{ ...WELCOME_MSG }]
  }
  await scrollToBottom()
}

function startNewConversation() {
  currentConversationId.value = null
  messages.value = [{ ...WELCOME_MSG }]
  userInput.value = ''
  currentView.value = 'chat'
}

async function deleteConversation(id) {
  try {
    await ElMessageBox.confirm('确定删除该会话吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch { return }
  try {
    await request.delete(`/conversation/${id}`)
    if (id === currentConversationId.value) {
      currentConversationId.value = null
      messages.value = [{ ...WELCOME_MSG }]
      currentView.value = 'home'
    }
    await fetchConversations()
    ElMessage.success('会话已删除')
  } catch {
    ElMessage.error('删除失败')
  }
}

// ─── 发送消息 ──────────────────────────────────────────
async function handleSend() {
  const text = userInput.value.trim()
  if (!text || isLoading.value) return

  if (!localStorage.getItem('token')) {
    loginModalVisible.value = true
    return
  }

  // 切换到 chat 视图
  if (currentView.value !== 'chat') {
    currentView.value = 'chat'
    if (!messages.value.length) messages.value = [{ ...WELCOME_MSG }]
    await nextTick()
  }

  messages.value.push({ role: 'user', content: text })
  userInput.value = ''
  resetTextareaHeight()

  // 总结意图检测
  if (isSummaryIntent(text)) {
    pendingSummaryFromChat.value = true
    summaryDialogManuallyClosed.value = false
    summaryLoading.value = true
    summaryContent.value = ''
    summarySourceName.value = ''
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
      body: JSON.stringify({ conversationId: currentConversationId.value, msg: text })
    })

    if (!response.ok || !response.body) {
      aiMsg.content = `请求失败：HTTP ${response.status}`
      isLoading.value = false
      clearPendingSummary()
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
          try { parsed = JSON.parse(raw) } catch { parsed = null }

          if (currentEvent === 'message') {
            aiMsg.content += parsed?.content ?? raw
            await scrollToBottom()
          } else if (currentEvent === 'done') {
            currentConversationId.value = parsed?.conversationId ?? raw
            await fetchConversations()
            isLoading.value = false
            if (pendingSummaryFromChat.value) {
              pendingSummaryFromChat.value = false
              summaryLoading.value = false
              summaryDialogVisible.value = false
              ElMessage.warning('未收到总结结果')
            }
          } else if (currentEvent === 'error') {
            aiMsg.content = `错误：${parsed?.message ?? raw}`
            isLoading.value = false
            clearPendingSummary()
          } else if (currentEvent === 'summary_result') {
            handleSummaryResult(raw)
          }
          currentEvent = ''
        }
      }
    }
  } catch (error) {
    aiMsg.content = `网络请求失败：${error.message}`
    clearPendingSummary()
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

// ─── 辅助函数 ──────────────────────────────────────────
function parseMarkdown(text) {
  if (!text) return ''
  return marked(text)
}

async function scrollToBottom() {
  await nextTick()
  if (chatBodyRef.value) chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
}

function adjustChatHeight() {
  nextTick(() => {
    const t = chatTextareaRef.value
    if (!t) return
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 160) + 'px'
  })
}

function adjustHomeHeight() {
  nextTick(() => {
    const t = homeTextareaRef.value
    if (!t) return
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 160) + 'px'
  })
}

function resetTextareaHeight() {
  nextTick(() => {
    const t = chatTextareaRef.value || homeTextareaRef.value
    if (t) t.style.height = 'auto'
  })
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

function handleSaveAiMsg(content) {
  currentView.value = 'notes'
  nextTick(() => notesViewRef.value?.openAddNote(content))
}

function triggerAddNote() {
  currentView.value = 'notes'
  nextTick(() => notesViewRef.value?.openAddNote())
}

// ─── AI 总结 ──────────────────────────────────────────
const summaryDialogVisible = ref(false)
const summaryLoading = ref(false)
const summarySourceName = ref('')
const summaryContent = ref('')
const pendingSummaryFromChat = ref(false)
const summaryDialogManuallyClosed = ref(false)

const isSummaryIntent = (msg) => {
  const intentWords = ['总结', 'AI总结', '整理成要点', '提炼要点', '面试话术', '概括', '摘要']
  const targetWords = ['第', '篇', '文章', '笔记', 'note', 'article']
  return intentWords.some(k => msg.includes(k)) && targetWords.some(k => msg.includes(k))
}

function handleSummaryResult(raw) {
  let data
  try { data = JSON.parse(raw) } catch { return }
  if (data.type !== 'article_summary') return
  pendingSummaryFromChat.value = false
  if (!data.success) {
    summaryLoading.value = false
    summaryDialogVisible.value = false
    ElMessage.warning(data.chatMessage || '总结失败')
    return
  }
  summarySourceName.value = data.title || ''
  summaryContent.value = data.summary || ''
  summaryLoading.value = false
  if (!summaryDialogManuallyClosed.value) summaryDialogVisible.value = true
}

function onSummaryDialogClose() {
  if (summaryLoading.value) summaryDialogManuallyClosed.value = true
  summaryDialogVisible.value = false
}

function clearPendingSummary() {
  if (pendingSummaryFromChat.value) {
    pendingSummaryFromChat.value = false
    summaryLoading.value = false
    summaryDialogVisible.value = false
  }
}

async function copySummaryFromChat() {
  try {
    await navigator.clipboard.writeText(summaryContent.value)
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败')
  }
}

// ─── 主题（暗色，不再切换） ─────────────────────────────
onMounted(async () => {
  document.body.classList.remove('light')
  await loadUserInfo()
  await fetchConversations()
  window.addEventListener('tb:require-login', onRequireLogin)
})

onUnmounted(() => {
  window.removeEventListener('tb:require-login', onRequireLogin)
})
</script>

<style scoped>
/* ── 根布局 ─────────────────────────────────────── */
.tb-app {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #111113;
  color: #e2e4e9;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

/* ── 左侧导航栏 ─────────────────────────────────── */
.tb-sidebar {
  width: 224px;
  flex-shrink: 0;
  background: #171717;
  border-right: 0.5px solid #252525;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.22s ease;
}
.tb-sidebar.collapsed {
  width: 60px;
}

/* 折叠按钮 */
.sidebar-toggle {
  margin-left: auto;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.sidebar-toggle:hover { background: #252525; color: #e2e4e9; }
.tb-sidebar.collapsed .sidebar-toggle { margin-left: 0; }

/* 折叠态：图标居中、内边距收紧 */
.tb-sidebar.collapsed .sidebar-logo { justify-content: center; padding: 0 8px; gap: 0; }
.tb-sidebar.collapsed .new-chat-btn { margin: 0 8px 6px; padding: 0; }
.tb-sidebar.collapsed .nav-item { justify-content: center; padding: 8px 0; margin: 1px 8px; }
.tb-sidebar.collapsed .user-area { justify-content: center; padding: 7px 0; }
.tb-sidebar.collapsed .sidebar-bottom { padding: 8px; }
.tb-sidebar.collapsed .sidebar-divider { margin: 8px; }
.conv-list-spacer { flex: 1; }

.sidebar-logo {
  height: 54px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  flex-shrink: 0;
}

.logo-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.logo-text {
  font-size: 14px;
  font-weight: 500;
  color: #ececec;
}

.new-chat-btn {
  margin: 0 10px 6px;
  background: #252525;
  border: 0.5px solid #2e2e2e;
  border-radius: 8px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #9ca3af;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.new-chat-btn:hover { background: #2e2e2e; color: #e2e4e9; }

.sidebar-section-label {
  font-size: 10px;
  color: #3a3d4a;
  padding: 4px 16px 3px;
  letter-spacing: 0.4px;
  flex-shrink: 0;
}

.conv-list {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 60px;
  max-height: 220px;
  padding: 0 6px;
}
.conv-list::-webkit-scrollbar { width: 3px; }
.conv-list::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 3px; }

.conv-item {
  display: flex;
  align-items: center;
  padding: 7px 10px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 12px;
  color: #5b6071;
  transition: background 0.15s, color 0.15s;
  gap: 6px;
}
.conv-item:hover { background: #1e1e22; color: #c9ccd6; }
.conv-item.active { background: rgba(99, 102, 241, 0.13); color: #d4d6e0; }
.conv-item-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv-item-del {
  flex-shrink: 0;
  font-size: 11px;
  color: transparent;
  border-radius: 3px;
  padding: 1px 3px;
  transition: color 0.15s;
}
.conv-item:hover .conv-item-del { color: #4b5263; }
.conv-item-del:hover { color: #f56c6c !important; }

.conv-empty {
  font-size: 11px;
  color: #2d2f3a;
  padding: 8px 16px;
}

.sidebar-divider {
  border-top: 0.5px solid #222;
  margin: 8px 10px;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 14px;
  border-radius: 7px;
  margin: 1px 6px;
  cursor: pointer;
  font-size: 13px;
  color: #c9ccd6;
  transition: background 0.15s;
}
.nav-item:hover { background: #1e1e22; }
.nav-item.active { background: rgba(99, 102, 241, 0.13); color: #a5b4fc; }
.nav-item.disabled { opacity: 0.42; cursor: default; }
.nav-item .el-icon { font-size: 15px; flex-shrink: 0; }

.nav-badge {
  margin-left: auto;
  font-size: 10px;
  background: #222;
  border: 0.5px solid #2e2e2e;
  border-radius: 10px;
  padding: 1px 6px;
  color: #4b5263;
}
.nav-soon {
  margin-left: auto;
  font-size: 9px;
  background: #1e1e22;
  border-radius: 10px;
  padding: 2px 6px;
  color: #3a3d4a;
  white-space: nowrap;
}

/* ── 底部用户区 ──────────────────────────────────── */
.sidebar-bottom {
  margin-top: auto;
  padding: 8px 10px;
  border-top: 0.5px solid #222;
  flex-shrink: 0;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: #222;
  transition: background 0.2s;
}
.user-area:hover { background: #2a2a2a; }
.user-area.guest .user-avatar-guest {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #252528;
  border: 0.5px solid #2e2e32;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5263;
  font-size: 14px;
}

.user-avatar {
  background: #6366f1 !important;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 12px; color: #c9ccd6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-sub { font-size: 10px; color: #3a3d4a; }
.user-more { color: #3a3d4a; font-size: 14px; }

/* profile popover */
:global(.tb-profile-popper) {
  background: #1e1e22 !important;
  border: 0.5px solid #2e2e32 !important;
  padding: 8px !important;
}
.profile-pop-name {
  font-size: 12px;
  font-weight: 500;
  color: #c9ccd6;
  padding: 4px 8px 10px;
  border-bottom: 0.5px solid #2e2e32;
  margin-bottom: 4px;
}
.profile-pop-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: #c9ccd6;
  cursor: pointer;
  transition: background 0.15s;
}
.profile-pop-item:hover { background: #252528; }
.profile-pop-item.logout { color: #f56c6c; margin-top: 2px; }

/* ── 主内容区 ───────────────────────────────────── */
.tb-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1a1a1c;
}

/* ── HOME 视图 ──────────────────────────────────── */
.view-home {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 40px 24px;
}

.home-center {
  width: 100%;
  max-width: 680px;
}

.home-greeting {
  font-size: 28px;
  font-weight: 500;
  color: #e2e4e9;
  text-align: center;
  margin-bottom: 8px;
}

.home-sub {
  font-size: 14px;
  color: #4b5263;
  text-align: center;
  margin-bottom: 32px;
}

.home-prompts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.prompt-card {
  background: #252528;
  border: 0.5px solid #2e2e32;
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.prompt-card:hover { background: #2a2a2e; border-color: #6366f1; }
.prompt-title { font-size: 13px; color: #c9ccd6; line-height: 1.4; margin-bottom: 4px; }
.prompt-tag { font-size: 11px; color: #3a3d4a; }

.home-input-wrap {
  background: #252528;
  border: 0.5px solid #2e2e32;
  border-radius: 14px;
  display: flex;
  align-items: flex-end;
  padding: 12px 14px;
  gap: 10px;
  transition: border-color 0.2s;
}
.home-input-wrap:focus-within { border-color: #6366f1; }

.home-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  color: #e2e4e9;
  line-height: 1.5;
  min-height: 24px;
  max-height: 160px;
  overflow-y: auto;
}
.home-textarea::placeholder { color: #303034; }

.home-send-btn {
  width: 32px;
  height: 32px;
  background: #6366f1;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;
}
.home-send-btn:hover { opacity: 0.85; }

/* ── CHAT 视图 ──────────────────────────────────── */
.view-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  height: 52px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 0.5px solid #252525;
  flex-shrink: 0;
}
.chat-title { font-size: 13px; color: #4b5263; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat-header-actions { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
.hdr-icon { font-size: 18px; color: #3a3d4a; cursor: pointer; transition: color 0.2s; }
.hdr-icon:hover { color: #6b7280; }

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.chat-body::-webkit-scrollbar { width: 4px; }
.chat-body::-webkit-scrollbar-thumb { background: #2e2e32; border-radius: 4px; }

.msg-row { display: flex; width: 100%; max-width: 820px; }
.msg-row.user { justify-content: flex-end; }
.msg-row.ai { justify-content: flex-start; align-items: flex-start; gap: 12px; }

.ai-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  margin-top: 2px;
}

.ai-bubble { flex: 1; min-width: 0; }
.ai-content { font-size: 14px; color: #c8cad4; line-height: 1.7; }
.ai-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.ai-action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 0.5px solid #2e2e32;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: #4b5263;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.ai-action-btn:hover { color: #c9ccd6; border-color: #4b5263; }

.user-bubble {
  background: #252528;
  border: 0.5px solid #2e2e32;
  border-radius: 16px 16px 4px 16px;
  padding: 10px 14px;
  font-size: 14px;
  color: #e2e4e9;
  line-height: 1.6;
  max-width: 72%;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── CHAT 输入区 ─────────────────────────────────── */
.chat-input-dock {
  padding: 12px 20px 16px;
  flex-shrink: 0;
}
.chat-input-wrap {
  background: #252528;
  border: 0.5px solid #2e2e32;
  border-radius: 14px;
  display: flex;
  align-items: flex-end;
  padding: 12px 14px;
  gap: 10px;
  transition: border-color 0.2s;
  max-width: 820px;
  margin: 0 auto;
}
.chat-input-wrap:focus-within { border-color: #6366f1; }

.chat-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  color: #e2e4e9;
  line-height: 1.5;
  min-height: 24px;
  max-height: 160px;
  overflow-y: auto;
}
.chat-textarea::placeholder { color: #303034; }

.chat-send-btn {
  width: 32px;
  height: 32px;
  background: #6366f1;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;
}
.chat-send-btn:hover:not(:disabled) { opacity: 0.85; }
.chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.chat-footer-tip {
  text-align: center;
  font-size: 11px;
  color: #1e1e22;
  margin-top: 5px;
}

/* ── NOTES 视图 ─────────────────────────────────── */
.view-notes {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notes-topbar {
  height: 52px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 0.5px solid #252525;
  flex-shrink: 0;
}
.notes-topbar-left { display: flex; align-items: center; gap: 10px; }
.notes-topbar-title { font-size: 14px; font-weight: 500; color: #e2e4e9; }
.notes-topbar-count {
  font-size: 11px;
  color: #3a3d4a;
  background: #222;
  border: 0.5px solid #2e2e2e;
  border-radius: 20px;
  padding: 1px 8px;
}
.notes-topbar-right { display: flex; align-items: center; gap: 10px; }
.topbar-btn {
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
}
.topbar-btn:hover { color: #c9ccd6; }
.topbar-btn.primary { color: #818cf8; font-weight: 500; }
.topbar-btn.primary:hover { color: #a5b4fc; }
.topbar-btn.danger { color: #f56c6c; font-weight: 500; }

/* ── Markdown 内容 ───────────────────────────────── */
:deep(.markdown-body p) { margin: 0 0 8px; }
:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3) { color: #e2e4e9; font-weight: 500; margin: 12px 0 6px; }
:deep(.markdown-body strong) { color: #a5b4fc; font-weight: 600; }
:deep(.markdown-body ul),
:deep(.markdown-body ol) { padding-left: 18px; margin: 4px 0 8px; }
:deep(.markdown-body li) { margin-bottom: 4px; color: #c8cad4; }
:deep(.markdown-body code) { background: #252528; border-radius: 4px; padding: 1px 5px; font-size: 12px; color: #e879f9; font-family: monospace; }
:deep(.markdown-body pre) { background: #252528; border-radius: 8px; padding: 12px 14px; overflow-x: auto; margin: 8px 0; }
:deep(.markdown-body pre code) { padding: 0; color: #c9ccd6; font-size: 13px; }
:deep(.markdown-body hr) { border: 0; border-top: 0.5px solid #2e2e32; margin: 12px 0; }

/* ── el-dialog 暗色适配 ────────────────────────────── */
:deep(.tb-dialog .el-dialog) {
  background: #1e1e22 !important;
  border: 0.5px solid #2e2e32;
  border-radius: 14px;
}
:deep(.tb-dialog .el-dialog__header) {
  background: #252528;
  border-bottom: 0.5px solid #2e2e32;
  padding: 14px 18px;
  cursor: move;
}
:deep(.tb-dialog .el-dialog__title) { color: #c9ccd6; font-size: 14px; }
:deep(.tb-dialog .el-dialog__headerbtn .el-icon) { color: #4b5263; }
:deep(.tb-dialog .el-dialog__body) { color: #c9ccd6; padding: 20px 20px 10px; }
:deep(.tb-dialog .el-dialog__footer) { border-top: 0.5px solid #2e2e32; padding: 12px 18px; }

.dialog-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  color: #4b5263;
  font-size: 14px;
}
.dialog-loading .el-icon { font-size: 28px; color: #6366f1; }

.summary-topic { font-size: 12px; color: #4b5263; margin-bottom: 10px; }
.summary-content {
  max-height: 440px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.8;
  color: #c9ccd6;
}
</style>
