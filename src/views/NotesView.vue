<template>
  <div class="notes-workspace" :style="{ padding: expandedNote ? '0' : '20px 24px' }">

    <template v-if="!expandedNote">
      <div class="cards-container">
        <el-row :gutter="16" style="margin: 0;">
          <el-col :span="8" v-for="(note, idx) in notes" :key="note.id" style="margin-bottom: 16px;">
            <el-card
              class="note-card"
              shadow="never"
              @dblclick="!isManageMode && expandNote(note)"
              :style="{ '--card-accent': CARD_COLORS[idx % CARD_COLORS.length] }"
            >
              <template #header>
                <div class="card-header">
                  <span class="note-title">{{ note.title }}</span>
                  <div class="card-actions">
                    <div
                      v-if="isManageMode"
                      class="circle-checkbox"
                      :class="{ 'is-checked': selectedIds.includes(note.id) }"
                      @click.stop="toggleSelectNote(note.id)"
                    ></div>
                    <template v-else>
                      <el-icon class="delete-icon" @click.stop="deleteNote(note.id)"><Close /></el-icon>
                    </template>
                  </div>
                </div>
              </template>
              <div class="note-content">{{ stripMarkdown(note.content) }}</div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="pagination-container">
        <el-pagination
          background
          layout="slot, prev, pager, next"
          :total="total"
          :page-size="pageSize"
          v-model:current-page="currentPage"
          @current-change="handlePageChange"
        >
          <span class="custom-pagination-info">
            共 <strong>{{ total }}</strong> 条
            <span class="divider">/</span>
            共 <strong>{{ totalPages }}</strong> 页
          </span>
        </el-pagination>
      </div>
    </template>

    <!-- 展开全屏阅读 -->
    <template v-else>
      <div class="expanded-fullscreen-card">
        <div class="expanded-header">
          <div class="header-left">
            <el-button :icon="Back" circle @click="closeExpandedNote" class="back-btn"></el-button>
            <input
              v-if="editingTitle"
              ref="titleInputRef"
              v-model="inlineTitle"
              class="expanded-title-input"
              maxlength="30"
              @blur="commitTitle"
              @keydown.enter.prevent="commitTitle"
              @keydown.esc="cancelTitleEdit"
            />
            <h2
              v-else
              class="expanded-title"
              title="双击标题可编辑"
              @dblclick="startEditTitle"
            >
              {{ expandedNote.title }}
            </h2>
            <span v-if="inlineSaving" class="inline-saving">保存中…</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :loading="summaryLoading" @click="summarizeNote(expandedNote)">
              AI 总结
            </el-button>
          </div>
        </div>

        <div
          v-show="editingContent"
          ref="vditorMountRef"
          class="expanded-body-vditor"
        ></div>
        <div
          v-if="!editingContent"
          class="expanded-body markdown-body"
          title="双击进入编辑（Ctrl+Enter 保存，Esc 取消）"
          v-html="parseMarkdown(expandedNote.content)"
          @dblclick="startEditContent"
        ></div>
        <div v-if="editingContent" class="editor-action-bar">
          <span class="editor-hint">Ctrl+Enter 保存 · Esc 取消</span>
          <el-button size="small" @click="cancelContentEdit">取消</el-button>
          <el-button size="small" type="primary" @click="commitContent">保存</el-button>
        </div>
      </div>
    </template>

    <!-- 新建 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :append-to-body="true"
      destroy-on-close
      class="tb-note-dialog"
      @open="onAnyDialogOpen"
    >
      <el-form :model="newNote" label-position="top">
        <el-form-item label="笔记标题">
          <el-input
            v-model="newNote.title"
            placeholder="给这段知识起个名字..."
            maxlength="30"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="详细内容">
          <el-input
            v-model="newNote.content"
            type="textarea"
            :rows="6"
            placeholder="在这里输入详细的笔记内容，Tech-Brain 会学习这些内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNote">存入知识库</el-button>
      </template>
    </el-dialog>

    <!-- AI 总结弹窗 -->
    <el-dialog
      v-model="summaryDialogVisible"
      width="640px"
      :append-to-body="true"
      :show-close="false"
      destroy-on-close
      class="tb-summary-dialog"
      @open="onAnyDialogOpen"
    >
      <template #header>
        <div class="summary-header">
          <div class="summary-header-left">
            <div class="summary-badge">
              <el-icon><MagicStick /></el-icon>
            </div>
            <div class="summary-titles">
              <div class="summary-title">AI 总结</div>
              <div class="summary-subtitle">
                {{ summarySourceTitle ? `来自《${summarySourceTitle}》` : '基于当前笔记智能提炼' }}
              </div>
            </div>
          </div>
          <el-icon class="summary-close" @click="summaryDialogVisible = false"><Close /></el-icon>
        </div>
      </template>

      <div v-if="summaryLoading" class="summary-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>AI 正在总结中...</span>
      </div>
      <div v-else class="summary-content markdown-body" v-html="parseMarkdown(summaryContent)"></div>

      <template #footer>
        <div class="summary-footer">
          <span class="summary-count" v-if="!summaryLoading && summaryContent">
            {{ summaryContent.length }} 字
          </span>
          <span class="summary-footer-spacer"></span>
          <el-button @click="summaryDialogVisible = false">关闭</el-button>
          <el-button :disabled="!summaryContent || summaryLoading" @click="copySummary">
            <el-icon><CopyDocument /></el-icon>
            <span style="margin-left: 4px;">复制</span>
          </el-button>
          <el-button
            type="primary"
            :disabled="!summaryContent || summaryLoading || summarySaving"
            :loading="summarySaving"
            @click="saveSummaryAsNote"
          >
            <el-icon v-if="!summarySaving"><DocumentAdd /></el-icon>
            <span style="margin-left: 4px;">保存为新笔记</span>
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineExpose, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Back, Loading, MagicStick, DocumentAdd, CopyDocument } from '@element-plus/icons-vue'
import { nextTick } from 'vue'
import request from '@/utils/request'
import { marked } from 'marked'
import { makeDraggable } from '@/utils/draggable'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

const emit = defineEmits(['total-change'])

// 每张卡片顶部彩色 accent
const CARD_COLORS = ['#6366f1', '#7c3aed', '#0ea5e9', '#059669', '#d97706', '#db2777']

const notes = ref([])
const total = ref(0)
const totalPages = ref(0)
const currentPage = ref(1)
const pageSize = ref(9)

const expandedNote = ref(null)
const dialogVisible = ref(false)
const dialogTitle = ref('✨ 录入新知识')
const currentNoteId = ref(null)
const newNote = ref({ title: '', content: '' })
const summaryDialogVisible = ref(false)
const summaryLoading = ref(false)
const summaryContent = ref('')
const summarySourceTitle = ref('')
const summarySaving = ref(false)

const isManageMode = ref(false)
const selectedIds = ref([])

// ── Markdown ────────────────────────────────────────────
const parseMarkdown = (text) => {
  if (!text) return ''
  return marked(text)
}

const stripMarkdown = (text) => {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/###?\s(.*?)\n/g, '$1\n')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\n/g, ' ')
}

// ── 拖动支持 ───────────────────────────────────────────
function onAnyDialogOpen() {
  nextTick(() => {
    const el = document.querySelector('.tb-note-dialog .el-dialog')
    if (el) makeDraggable(el)
  })
}

// ── 数据获取 ───────────────────────────────────────────
const fetchNotes = async () => {
  try {
    const res = await request.get('/article/page', {
      params: { pageNo: currentPage.value, pageSize: pageSize.value }
    })
    if (res.data && res.code === 200) {
      notes.value = res.data?.records || res.data?.list || []
      total.value = res.data?.total || 0
      totalPages.value = Math.ceil(total.value / pageSize.value)
      emit('total-change', total.value)
    } else {
      ElMessage.error(res.data?.msg || '获取列表失败')
    }
  } catch (error) {
    ElMessage.error('服务器连接异常')
    console.error(error)
  }
}

onMounted(() => { fetchNotes() })

// ── 新建 / 编辑 ────────────────────────────────────────
const openAddNote = (initialContent = '') => {
  dialogTitle.value = '✨ 录入新知识'
  currentNoteId.value = null
  newNote.value = { title: '', content: initialContent }
  dialogVisible.value = true
}

// ── 保存 ───────────────────────────────────────────────
const saveNote = async () => {
  if (!newNote.value.title.trim() || !newNote.value.content.trim()) {
    ElMessage.warning('标题和内容都不能为空哦，哥哥')
    return
  }
  try {
    if (currentNoteId.value) {
      const res = await request.put('/article', {
        id: currentNoteId.value,
        title: newNote.value.title,
        content: newNote.value.content
      })
      if (res.code === 200) {
        ElMessage.success('修改成功')
        if (expandedNote.value && expandedNote.value.id === currentNoteId.value) {
          expandedNote.value.title = newNote.value.title
          expandedNote.value.content = newNote.value.content
        }
      }
    } else {
      const res = await request.post('/save-note', {
        title: newNote.value.title,
        content: newNote.value.content
      })
      if (res.code === 200) ElMessage.success('笔记已存入数据库')
    }
    dialogVisible.value = false
    currentPage.value = 1
    fetchNotes()
  } catch {
    ElMessage.error('操作失败，接口异常')
  }
}

// ── 删除 ───────────────────────────────────────────────
const deleteNote = (id) => {
  ElMessageBox.confirm('确定要彻底删除这篇笔记吗？', '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request.delete(`/article/${id}`)
      if (res.code === 200) {
        ElMessage.success('笔记删除成功')
        fetchNotes()
        if (expandedNote.value?.id === id) closeExpandedNote()
      }
    } catch {
      ElMessage.error('删除失败，接口异常')
    }
  }).catch(() => ElMessage.info('已取消删除'))
}

// ── 展开 / 收起 ────────────────────────────────────────
const expandNote = (note) => { expandedNote.value = note }
const closeExpandedNote = () => {
  // 若正在编辑则先保存
  if (editingTitle.value) commitTitle()
  if (editingContent.value) commitContent()
  expandedNote.value = null
}

// ── 内联编辑（展开页双击直接打字） ─────────────────────
const editingTitle = ref(false)
const editingContent = ref(false)
const inlineTitle = ref('')
const inlineSaving = ref(false)
const titleInputRef = ref(null)
const vditorMountRef = ref(null)
let vditorInstance = null

function destroyVditor() {
  if (vditorInstance) {
    try { vditorInstance.destroy() } catch { /* noop */ }
    vditorInstance = null
  }
}

onBeforeUnmount(destroyVditor)

function startEditTitle() {
  if (!expandedNote.value) return
  inlineTitle.value = expandedNote.value.title
  editingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
    titleInputRef.value?.select()
  })
}
function cancelTitleEdit() { editingTitle.value = false }
async function commitTitle() {
  if (!editingTitle.value) return
  const newTitle = inlineTitle.value.trim()
  editingTitle.value = false
  if (!newTitle) {
    ElMessage.warning('标题不能为空')
    return
  }
  if (newTitle === expandedNote.value.title) return
  await persistNote({ title: newTitle, content: expandedNote.value.content })
}

function startEditContent() {
  if (!expandedNote.value) return
  editingContent.value = true
  nextTick(() => initVditor(expandedNote.value.content))
}
function cancelContentEdit() {
  editingContent.value = false
  destroyVditor()
}
async function commitContent() {
  if (!editingContent.value || !vditorInstance) return
  const newContent = vditorInstance.getValue()
  editingContent.value = false
  destroyVditor()
  if (!newContent.trim()) {
    ElMessage.warning('内容不能为空')
    return
  }
  if (newContent === expandedNote.value.content) return
  await persistNote({ title: expandedNote.value.title, content: newContent })
}

function initVditor(initialMarkdown) {
  destroyVditor()
  if (!vditorMountRef.value) return
  vditorInstance = new Vditor(vditorMountRef.value, {
    mode: 'wysiwyg',
    theme: 'dark',
    height: '100%',
    minHeight: 300,
    placeholder: '开始编辑笔记...',
    cache: { enable: false },
    toolbarConfig: { pin: true },
    toolbar: [
      'headings', 'bold', 'italic', 'strike', '|',
      'line', 'quote', 'list', 'ordered-list', 'check', '|',
      'code', 'inline-code', 'link', 'table', '|',
      'undo', 'redo'
    ],
    preview: {
      hljs: { style: 'native' },
      theme: { current: 'dark' }
    },
    counter: { enable: false },
    after: () => {
      vditorInstance.setValue(initialMarkdown || '')
      vditorInstance.focus()
    },
    keydown: (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelContentEdit()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        commitContent()
      }
    }
  })
}

async function persistNote({ title, content }) {
  if (!expandedNote.value?.id) return
  inlineSaving.value = true
  try {
    const res = await request.put('/article', { id: expandedNote.value.id, title, content })
    if (res.code === 200) {
      expandedNote.value.title = title
      expandedNote.value.content = content
      const idx = notes.value.findIndex(n => n.id === expandedNote.value.id)
      if (idx > -1) {
        notes.value[idx].title = title
        notes.value[idx].content = content
      }
      ElMessage.success('已保存')
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch {
    ElMessage.error('保存失败，接口异常')
  } finally {
    inlineSaving.value = false
  }
}

// ── AI 总结 ────────────────────────────────────────────
const summarizeNote = async (note) => {
  if (!note?.id) return
  summaryDialogVisible.value = true
  summaryLoading.value = true
  summaryContent.value = ''
  summarySourceTitle.value = note.title || ''
  try {
    const res = await request.post(`/article/ai/summary/${note.id}`)
    if (res.code === 200 || res.code === 1) {
      const data = res.data
      summaryContent.value = typeof data === 'string'
        ? data
        : (data?.summary || data?.content || data?.text || '')
    } else {
      ElMessage.error(res.msg || res.message || 'AI总结失败')
      summaryDialogVisible.value = false
    }
  } catch {
    ElMessage.error('AI总结失败，接口异常')
    summaryDialogVisible.value = false
  } finally {
    summaryLoading.value = false
  }
}

const copySummary = async () => {
  try {
    await navigator.clipboard.writeText(summaryContent.value)
    ElMessage.success('总结已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

const saveSummaryAsNote = async () => {
  if (!summaryContent.value.trim()) return
  summarySaving.value = true
  const baseTitle = summarySourceTitle.value
    ? `${summarySourceTitle.value} - 总结`
    : 'AI 总结'
  const title = baseTitle.length > 30 ? baseTitle.slice(0, 30) : baseTitle
  try {
    const res = await request.post('/save-note', {
      title,
      content: summaryContent.value
    })
    if (res.code === 200 || res.code === 1) {
      ElMessage.success('总结已保存为新笔记')
      summaryDialogVisible.value = false
      currentPage.value = 1
      fetchNotes()
    } else {
      ElMessage.error(res.msg || res.message || '保存失败')
    }
  } catch {
    ElMessage.error('保存失败，接口异常')
  } finally {
    summarySaving.value = false
  }
}

// ── 翻页 ───────────────────────────────────────────────
const handlePageChange = (val) => {
  currentPage.value = val
  fetchNotes()
}

// ── 批量管理 ───────────────────────────────────────────
const toggleManageMode = () => {
  isManageMode.value = !isManageMode.value
  selectedIds.value = []
}

const toggleSelectNote = (id) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

const batchDeleteNotes = () => {
  if (!selectedIds.value.length) return
  ElMessageBox.confirm(
    `确定要彻底删除选定的 ${selectedIds.value.length} 篇笔记吗？`, '批量删除',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'danger' }
  ).then(async () => {
    try {
      const res = await request.delete('/article/batch', { data: selectedIds.value })
      if (res.code === 200 || res.code === 1) {
        ElMessage.success('批量删除成功')
        toggleManageMode()
        fetchNotes()
      }
    } catch {
      ElMessage.error('批量删除失败，接口异常')
    }
  }).catch(() => {})
}

defineExpose({ openAddNote, isManageMode, selectedIds, toggleManageMode, batchDeleteNotes, fetchNotes })
</script>

<style scoped>
.notes-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.cards-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}
.cards-container::-webkit-scrollbar { width: 4px; }
.cards-container::-webkit-scrollbar-thumb { background: #2e2e32; border-radius: 4px; }

/* 卡片 */
:deep(.note-card) {
  background-color: #1e1e22 !important;
  border: 0.5px solid #2e2e32 !important;
  border-top: 2px solid var(--card-accent, #6366f1) !important;
  border-radius: 10px !important;
  color: #c9ccd6;
  transition: border-color 0.2s, transform 0.15s;
  cursor: pointer;
}
:deep(.note-card:hover) {
  border-color: var(--card-accent, #6366f1) !important;
  transform: translateY(-1px);
}
:deep(.note-card .el-card__header) {
  padding: 10px 13px;
  border-bottom: 0.5px solid #2e2e32;
  background: transparent;
}
:deep(.note-card .el-card__body) {
  padding: 12px 13px;
  min-height: 70px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.note-title {
  font-weight: 500;
  font-size: 13px;
  color: #e2e4e9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}
.card-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.edit-icon, .delete-icon {
  cursor: pointer;
  font-size: 15px;
  color: #3a3d4a;
  transition: color 0.2s;
}
.edit-icon:hover { color: #818cf8; }
.delete-icon:hover { color: #f56c6c; }

.note-content {
  font-size: 12px;
  color: #4b5263;
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 14px 0 4px;
  flex-shrink: 0;
}
:deep(.el-pagination.is-background .btn-next),
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .el-pager li) {
  background-color: #1e1e22;
  color: #6b7280;
  border: 0.5px solid #2e2e32;
}
:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #6366f1;
  border-color: #6366f1;
  color: #fff;
}
:deep(.el-pagination.is-background .el-pager li:hover) { color: #a5b4fc; }
.custom-pagination-info { font-size: 12px; color: #3a3d4a; margin-right: 4px; }
.custom-pagination-info strong { color: #6b7280; }
.divider { margin: 0 4px; }

/* 展开全屏 */
.expanded-fullscreen-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  background: #1a1a1c;
  animation: fadeIn 0.18s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.expanded-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 0.5px solid #2e2e32;
  flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 14px; }
.back-btn {
  background: #252528 !important;
  border-color: #2e2e32 !important;
  color: #9ca3af !important;
}
.expanded-title {
  margin: 0;
  font-size: 17px;
  font-weight: 500;
  color: #e2e4e9;
  cursor: text;
  user-select: none;
  padding: 2px 6px;
  border-radius: 6px;
  transition: background 0.15s;
}
.expanded-title:hover { background: #252528; }

.expanded-title-input {
  margin: 0;
  font-size: 17px;
  font-weight: 500;
  color: #e2e4e9;
  background: #252528;
  border: 0.5px solid #6366f1;
  border-radius: 6px;
  padding: 4px 8px;
  outline: none;
  min-width: 320px;
}

.inline-saving {
  margin-left: 10px;
  font-size: 11px;
  color: #6366f1;
}

.expanded-body { cursor: text; }

/* Vditor 编辑器容器 */
.expanded-body-vditor {
  flex: 1;
  min-height: 0;
  border-top: 0.5px solid #2e2e32;
}
:deep(.expanded-body-vditor.vditor) {
  border: none !important;
  border-radius: 0 !important;
  height: 100% !important;
}
:deep(.expanded-body-vditor .vditor-toolbar) {
  background: #1e1e22 !important;
  border-bottom: 0.5px solid #2e2e32 !important;
}
:deep(.expanded-body-vditor .vditor-content) {
  background: #1a1a1c !important;
}
:deep(.expanded-body-vditor .vditor-wysiwyg) {
  background: #1a1a1c !important;
}
:deep(.expanded-body-vditor .vditor-reset) {
  background: #1a1a1c !important;
  color: #c9ccd6 !important;
  font-size: 14px !important;
  line-height: 1.8 !important;
  padding: 20px 28px !important;
}
:deep(.expanded-body-vditor .vditor-reset strong) { color: #a5b4fc !important; }
:deep(.expanded-body-vditor .vditor-reset code) {
  background: #252528 !important;
  color: #e879f9 !important;
}
:deep(.expanded-body-vditor .vditor-reset pre) {
  background: #252528 !important;
}
:deep(.expanded-body-vditor .vditor-counter) { display: none !important; }

.editor-action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: #1e1e22;
  border-top: 0.5px solid #2e2e32;
  flex-shrink: 0;
}
.editor-hint {
  flex: 1;
  font-size: 12px;
  color: #4b5263;
}
.expanded-body {
  flex: 1;
  padding: 24px 28px;
  overflow-y: auto;
  color: #c9ccd6;
  font-size: 14px;
  line-height: 1.8;
}
.expanded-body::-webkit-scrollbar { width: 4px; }
.expanded-body::-webkit-scrollbar-thumb { background: #2e2e32; border-radius: 4px; }

/* markdown in expanded */
:deep(.markdown-body p) { margin: 0 0 10px; }
:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3) { color: #e2e4e9; font-weight: 500; margin: 14px 0 6px; }
:deep(.markdown-body strong) { color: #a5b4fc; }
:deep(.markdown-body code) {
  background: #252528; border-radius: 4px; padding: 1px 5px;
  font-size: 12px; color: #e879f9; font-family: monospace;
}
:deep(.markdown-body pre) {
  background: #252528; border-radius: 8px;
  padding: 12px 14px; overflow-x: auto; margin: 8px 0;
}
:deep(.markdown-body pre code) { padding: 0; color: #c9ccd6; }
:deep(.markdown-body ul),
:deep(.markdown-body ol) { padding-left: 20px; margin-bottom: 8px; }
:deep(.markdown-body li) { margin-bottom: 4px; }
:deep(.markdown-body hr) { border: 0; border-top: 0.5px solid #2e2e32; margin: 12px 0; }

/* 批量选择圆框 */
.circle-checkbox {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid #2e2e32;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}
.circle-checkbox.is-checked {
  background: #6366f1;
  border-color: #6366f1;
  box-shadow: inset 0 0 0 3px #1e1e22;
}

/* 弹窗暗色适配 */
:deep(.tb-note-dialog .el-dialog) {
  background: #1e1e22 !important;
  border: 0.5px solid #2e2e32;
  border-radius: 14px;
}
:deep(.tb-note-dialog .el-dialog__header) {
  background: #252528;
  border-bottom: 0.5px solid #2e2e32;
  padding: 13px 18px;
  cursor: move;
}
:deep(.tb-note-dialog .el-dialog__title) { color: #c9ccd6; font-size: 14px; }
:deep(.tb-note-dialog .el-dialog__headerbtn .el-icon) { color: #4b5263; }
:deep(.tb-note-dialog .el-dialog__body) { padding: 18px 20px 10px; }
:deep(.tb-note-dialog .el-dialog__footer) { border-top: 0.5px solid #2e2e32; padding: 12px 18px; }
:deep(.tb-note-dialog .el-form-item__label) { color: #6b7280 !important; font-size: 12px !important; }
:deep(.tb-note-dialog .el-input__wrapper) {
  background: #252528 !important;
  box-shadow: 0 0 0 1px #2e2e32 inset !important;
}
:deep(.tb-note-dialog .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #6366f1 inset !important;
}
:deep(.tb-note-dialog .el-input__inner),
:deep(.tb-note-dialog .el-textarea__inner) {
  color: #e2e4e9 !important;
  background: #252528 !important;
}
:deep(.tb-note-dialog .el-input__inner::placeholder),
:deep(.tb-note-dialog .el-textarea__inner::placeholder) { color: #3a3d4a !important; }

/* AI 总结弹窗内容 */
.summary-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 50px 0;
  color: #4b5263; font-size: 13px;
}
.summary-loading .el-icon { font-size: 32px; color: #6366f1; }
.summary-content {
  max-height: 55vh; overflow-y: auto;
  font-size: 14.5px; line-height: 1.85;
  color: #f1f3f8 !important;
  opacity: 1 !important;
  padding-right: 4px;
}
.summary-content :deep(*) { opacity: 1 !important; }
.summary-content :deep(p),
.summary-content :deep(li),
.summary-content :deep(span),
.summary-content :deep(div) { color: #f1f3f8 !important; }
.summary-content :deep(h1),
.summary-content :deep(h2),
.summary-content :deep(h3),
.summary-content :deep(h4) {
  color: #ffffff !important;
  font-weight: 600 !important;
}
.summary-content :deep(strong) { color: #c4b5fd !important; font-weight: 600 !important; }
.summary-content :deep(em) { color: #e8eaf0 !important; }
.summary-content::-webkit-scrollbar { width: 4px; }
.summary-content::-webkit-scrollbar-thumb { background: #2e2e32; border-radius: 4px; }

/* ─── AI 总结弹窗（新样式） ──────────────────────────── */
:deep(.tb-summary-dialog .el-dialog) {
  background: #1a1a1c !important;
  border: 0.5px solid #2e2e32 !important;
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}
:deep(.tb-summary-dialog .el-dialog__header) {
  background: linear-gradient(180deg, #1e1e22 0%, #1a1a1c 100%);
  border-bottom: 0.5px solid #2e2e32;
  padding: 14px 18px;
  margin: 0;
  cursor: move;
}
:deep(.tb-summary-dialog .el-dialog__body) {
  background: #1a1a1c !important;
  padding: 20px 22px 8px;
  color: #f1f3f8;
}
:deep(.tb-summary-dialog .el-dialog__footer) {
  background: #1a1a1c;
  border-top: 0.5px solid #2e2e32;
  padding: 12px 18px;
}

/* 自定义 header */
.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.summary-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.summary-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}
.summary-titles { min-width: 0; }
.summary-title {
  font-size: 15px;
  font-weight: 600;
  color: #e2e4e9;
  line-height: 1.2;
}
.summary-subtitle {
  margin-top: 3px;
  font-size: 11px;
  color: #4b5263;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 460px;
}
.summary-close {
  font-size: 18px;
  color: #4b5263;
  cursor: pointer;
  padding: 5px;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}
.summary-close:hover { background: #252528; color: #c9ccd6; }

/* footer */
.summary-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.summary-footer-spacer { flex: 1; }
.summary-count {
  font-size: 11px;
  color: #3a3d4a;
}
:deep(.tb-summary-dialog .el-button) {
  background: #252528 !important;
  border-color: #2e2e32 !important;
  color: #c9ccd6 !important;
}
:deep(.tb-summary-dialog .el-button:hover) {
  background: #2e2e32 !important;
  color: #e2e4e9 !important;
}
:deep(.tb-summary-dialog .el-button--primary) {
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%) !important;
  border-color: #6366f1 !important;
  color: #fff !important;
}
:deep(.tb-summary-dialog .el-button--primary:hover) {
  opacity: 0.9;
}
:deep(.tb-summary-dialog .el-button.is-disabled) {
  background: #1e1e22 !important;
  color: #3a3d4a !important;
  border-color: #2e2e32 !important;
  opacity: 0.7;
}

/* 禁止分页按钮出现 not-allowed */
.pagination-container :deep(.el-pagination button:disabled),
.pagination-container :deep(.el-pagination .el-pager li.is-active) {
  cursor: default !important;
}
</style>

<!-- AI 总结弹窗的全局样式已统一移到 App.vue -->

