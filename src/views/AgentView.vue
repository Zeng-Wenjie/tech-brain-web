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
            <span class="model-selector">保存</span>
            <button class="send-btn" @click="handleSend">➤</button>
          </div>
        </div>
        <div class="footer-text">Tech-Brain Agent · RAG 增强模式</div>
      </div>
    </div>

    <div class="extension-pane">
      
      <div class="pane-header right-header">
        <div class="header-actions">
          <span class="icon-btn" title="菜单" @click="isDrawerVisible = !isDrawerVisible">≡</span>
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

      <div class="extension-content" style="position: relative; overflow: hidden;">
        
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
              <div class="section-title">笔记本操作</div>
              <div class="menu-item active"><span class="icon">📝</span> 全部笔记</div>
              <div class="menu-item"><span class="icon">+</span> 新建笔记本</div>
            </div>
            
            <div class="drawer-footer">
              <div class="menu-item"><span class="icon">⚙</span> 设置和帮助</div>
            </div>
          </div>
        </el-drawer>

<!-- 笔记区中心部分 -->
       <div class="main-table-area" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          
          <div class="notes-workspace">
            
            <template v-if="!expandedNote">
              <div class="cards-container grid-scroll-area">
                <el-row :gutter="20" style="margin: 0;">
                  <el-col :span="8" v-for="note in notesList" :key="note.id" style="margin-bottom: 20px;">
                    <el-card class="note-card" shadow="hover" @dblclick="expandNote(note)">
                      <template #header>
                        <div class="card-header">
                          <span class="note-title">{{ note.title }}</span>
                          <el-icon class="delete-icon" @click.stop="deleteNote(note.id)"><Close /></el-icon>
                        </div>
                      </template>
                      <div class="note-content">{{ note.content }}</div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>

              <div class="pagination-dock">
                <el-pagination
                  v-model:current-page="currentPage"
                  :page-size="pageSize"
                  :total="totalNotes"
                  layout="prev, pager, next"
                  @current-change="handlePageChange"
                  background
                />
              </div>
            </template>

            <template v-else>
              <div class="expanded-fullscreen-card">
                <div class="expanded-header">
                  <div class="header-left">
                    <el-button :icon="Back" circle @click="closeExpandedNote" class="back-btn"></el-button>
                    <h2 class="expanded-title">{{ expandedNote.title }}</h2>
                  </div>
                </div>
                
                <div class="expanded-body markdown-body">
                  {{ expandedNote.content }}
                </div>
              </div>
            </template>

          </div>
        </div>
        </div>
        </div>
  </div>
   </template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { Sunny, Moon, Close, Back } from '@element-plus/icons-vue'
import axios from 'axios' // 引入 HTTP 客户端

import { marked } from 'marked'

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
const isLoading = ref(false) // 新增：请求发送状态，防止重复连击

const messages = ref([
  { 
    role: 'ai', 
    content: '### ✨ 欢迎回来，哥哥！\n\n我是你的专属小助理 **02**' 
  }
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

// ================= 知识库卡片与分页逻辑 =================
const currentPage = ref(1)
const pageSize = ref(9)
const totalNotes = ref(45) // 模拟总数据量

// 模拟一页 9 条数据
const notesList = ref(Array.from({ length: 9 }).map((_, index) => ({
  id: index + 1,
  title: `Spring Boot 核心概念 ${index + 1}`,
  content: `这是关于知识点 ${index + 1} 的详细笔记记录。主要包含了一些底层原理的解析，以及如何在实际的业务场景中去应用这些概念来实现高并发处理...`
})))

const handlePageChange = (val) => {
  console.log(`前端触发分页查询，当前页: ${val}，后续这里将调用 Axios 请求后端的分页接口`)
  // TODO: axios.get('/api/notes/page', { params: { page: val, size: pageSize.value } })
}

const deleteNote = (id) => {
  console.log(`触发删除操作，笔记 ID: ${id}`)
  // 模拟前端移除，后续对接后端删除接口
  notesList.value = notesList.value.filter(note => note.id !== id)
}

// ================= 笔记卡片展开/收起逻辑 =================
const expandedNote = ref(null)

const expandNote = (note) => {
  expandedNote.value = note
}

const closeExpandedNote = () => {
  expandedNote.value = null
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

/* ================= 右侧扩展区基础 ================= */
.extension-pane {
  flex: 7;
  background-color: var(--tb-color-bg-page);
  display: flex;
  flex-direction: column; /* 恢复为纵向布局 */
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

/* ================= 局部抽屉核心修复 ================= */
/* 强制遮罩层使用绝对定位，使其完全贴合右侧父容器，不再参照全屏 */
:deep(.el-overlay) {
  position: absolute !important;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 穿透修改抽屉本体样式以适应主题 */
:deep(.notes-drawer) {
  position: absolute !important;
  background-color: var(--tb-color-bg-panel);
  color: var(--tb-color-text-primary);
}
/* 去掉抽屉自带的内边距，方便我们自己画容器 */
:deep(.el-drawer__body) {
  padding: 0;
}

.drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px 20px;
  background-color: var(--tb-color-bg-panel);
}

.drawer-header {
  height: 40px;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.drawer-section {
  margin-bottom: 25px;
}

.section-title {
  font-size: 12px;
  color: var(--tb-color-text-secondary);
  font-weight: bold;
  margin-bottom: 10px;
  padding: 0 10px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--tb-color-text-primary);
  transition: background-color 0.2s;
  margin-bottom: 4px;
}

.menu-item:hover {
  background-color: var(--tb-color-bg-input);
}

.menu-item.active {
  background-color: #1a3c63; 
  color: #e3e3e3;
}
.light .menu-item.active {
  background-color: #d3e3fd; 
  color: #041e49;
}

.menu-item .icon {
  margin-right: 10px;
  font-size: 16px;
}

.drawer-footer {
  margin-top: auto; 
  padding-bottom: 20px;
}

/* ================= 知识库卡片区样式 ================= */
.notes-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 30px;
  height: 100%;
  box-sizing: border-box;
}

.cards-container {
  flex: 1;
  overflow-y: auto; /* 内容过多时仅卡片区滚动 */
}

/* 穿透修改 el-card，使其完美贴合暗黑/亮色主题 */
:deep(.note-card) {
  background-color: var(--tb-color-bg-panel);
  border: 1px solid var(--tb-color-border);
  color: var(--tb-color-text-primary);
  border-radius: 10px;
  transition: all 0.3s ease;
}

:deep(.note-card:hover) {
  border-color: var(--tb-color-primary);
}

:deep(.el-card__header) {
  padding: 12px 15px;
  border-bottom: 1px solid var(--tb-color-border);
}

:deep(.el-card__body) {
  padding: 15px;
  height: 100px; /* 固定高度，保证一竖排对齐 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-title {
  font-weight: bold;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 标题过长显示省略号 */
  max-width: 85%;
}

.delete-icon {
  cursor: pointer;
  color: var(--tb-color-text-secondary);
  font-size: 16px;
}

.delete-icon:hover {
  color: #f56c6c; /* 悬浮显示红色警示 */
}

.note-content {
  font-size: 13px;
  color: var(--tb-color-text-secondary);
  line-height: 1.6;
  /* 多行文本截断：最多显示4行 */
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 底部动态分页停靠区 */
.pagination-dock {
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}

/* 适配暗黑模式的分页器颜色穿透 */
:deep(.el-pagination.is-background .btn-next),
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .el-pager li) {
  background-color: var(--tb-color-bg-panel);
  color: var(--tb-color-text-primary);
}
:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: var(--tb-color-primary);
  color: #fff;
}

/* ================= 绿框工作区基础限制 ================= */
.notes-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 30px;
  height: 100%;
  box-sizing: border-box;
  /* 核心：外层大框绝对禁止滚动，杜绝双滚动条 */
  overflow: hidden; 
}

/* ================= 网格模式样式 ================= */
.cards-container {
  flex: 1;
  overflow: hidden;
}

.grid-scroll-area {
  overflow-y: auto; /* 网格模式下允许多行卡片往下滚 */
  overflow-x: hidden; /* 杜绝底部横向滚动条 */
  padding-right: 5px;
}

/* ================= 大卡片铺满模式样式 ================= */
.expanded-fullscreen-card {
  display: flex;
  flex-direction: column;
  height: 100%; /* 100% 霸占绿色框高度 */
  background-color: var(--tb-color-bg-panel);
  border-radius: 10px;
  border: 1px solid var(--tb-color-border);
  box-sizing: border-box;
  animation: fadeInCard 0.2s ease-out;
}

@keyframes fadeInCard {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.expanded-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--tb-color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.expanded-title {
  margin: 0;
  font-size: 18px;
  color: var(--tb-color-text-primary);
}

/* 核心：唯一允许出现滚动条的地方（你的红线） */
.expanded-body {
  flex: 1;
  padding: 25px;
  overflow-y: auto; 
  overflow-x: hidden;
  color: var(--tb-color-text-primary);
  font-size: 15px;
  line-height: 1.8;
  white-space: pre-wrap;
}

/* 其他的 .note-card, .delete-icon 等复用之前的即可 */
</style>