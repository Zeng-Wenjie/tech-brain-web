<template>
  <div class="notes-workspace" :style="{ padding: expandedNote ? '0' : '20px 30px' }">
    
    <template v-if="!expandedNote">
      <div class="cards-container">
        <el-row :gutter="20" style="margin: 0;">
          <el-col :span="8" v-for="note in notes" :key="note.id" style="margin-bottom: 20px;">
           <el-card class="note-card" shadow="hover" @dblclick="!isManageMode && expandNote(note)">
              
              <template #header>
                <div class="card-header">
                  <span class="note-title">{{ note.title }}</span>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    
                    <div 
                      v-if="isManageMode" 
                      class="circle-checkbox" 
                      :class="{ 'is-checked': selectedIds.includes(note.id) }"
                      @click.stop="toggleSelectNote(note.id)"
                    ></div>
                    
                    <template v-else>
                      <el-icon class="edit-icon" @click.stop="openEditNote(note)"><Edit /></el-icon>
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

      <div class="pagination-container" style="display: flex; justify-content: center; margin-top: 20px;">
  <el-pagination
    background
    layout="slot, prev, pager, next" 
    :total="total"
    :page-size="pageSize"
    v-model:current-page="currentPage"
    @current-change="handlePageChange"
  >
    <span class="custom-pagination-info">
      共 <strong>{{ total }}</strong> 条笔记 
      <span class="divider">/</span> 
      共 <strong>{{ totalPages }}</strong> 页
    </span>
  </el-pagination>
</div>
    </template>

    <template v-else>
      <div class="expanded-fullscreen-card">
        <div class="expanded-header">
          <div class="header-left">
            <el-button :icon="Back" circle @click="closeExpandedNote" class="back-btn"></el-button>
            <h2 class="expanded-title">{{ expandedNote.title }}</h2>
          </div>
          <div class="header-right">
            <el-button
              type="primary"
              :loading="summaryLoading"
              @click="summarizeNote(expandedNote)"
            >
              AI总结
            </el-button>
          </div>
        </div>
        
       <div class="expanded-body markdown-body" v-html="parseMarkdown(expandedNote.content)"></div>
      </div>
    </template>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle" 
      width="500px"
      :append-to-body="true"
      destroy-on-close
      class="custom-dialog"
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
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNote">存入知识库</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="summaryDialogVisible"
      title="AI总结"
      width="640px"
      :append-to-body="true"
      destroy-on-close
      class="custom-dialog"
    >
      <div v-if="summaryLoading" class="summary-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>AI 正在总结中...</span>
      </div>
      <div v-else class="summary-content markdown-body" v-html="parseMarkdown(summaryContent)"></div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="summaryDialogVisible = false">关闭</el-button>
          <el-button type="primary" :disabled="!summaryContent" @click="copySummary">复制总结</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, defineExpose } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Back, Edit, Loading } from '@element-plus/icons-vue' // 加上了 Edit
import request from '@/utils/request' // 引入封装好、带了“自动塞Token”功能的request！
import { marked } from 'marked' // 新增：引入 Markdown 解析器

// ... 你之前的变量定义保持不变 ...

const notes = ref([]) // 用来存笔记列表的数组
const total = ref(0)  // 用来存总条数

// 1. 用于“放大视图”：将 Markdown 真正渲染成带样式的富文本 HTML
const parseMarkdown = (text) => {
  if (!text) return ''
  return marked(text)
}

// 2. 用于“小卡片预览”：粗略剥离 Markdown 符号，只给用户展示干净的纯文本
const stripMarkdown = (text) => {
  if (!text) return ''
  return text.replace(/\*\*(.*?)\*\*/g, '$1') // 去除粗体符号 **
             .replace(/###?\s(.*?)\n/g, '$1\n') // 去除标题符号 #
             .replace(/`(.*?)`/g, '$1')       // 去除代码块符号 `
             .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 去除链接符号
             .replace(/\n/g, ' ')             // 把换行换成空格，防止卡片排版错乱
}

// ================= 1. 数据状态定义 =================
const expandedNote = ref(null)

const currentPage = ref(1)
const pageSize = ref(9)

// 弹窗相关状态
const dialogVisible = ref(false)
const dialogTitle = ref('✨ 录入新知识')
const currentNoteId = ref(null)
const newNote = ref({ title: '', content: '' })
const summaryDialogVisible = ref(false)
const summaryLoading = ref(false)
const summaryContent = ref('')

const totalPages = ref(0) // 新增：用来接收总页数

// ================= 1. 获取分页数据 =================
const fetchNotes = async () => {
  try {
    // 调用后端新写的分页接口，并把页码传过去
    // 注意：这里的字段名要和你后端的 PageQuery 实体类保持一致 (pageNo, pageSize)
    const res = await request.get('/article/page', {
      params: {
        pageNo: currentPage.value,
        pageSize: pageSize.value
      }
    })
    
    if (res.data && res.code === 200) { // 假设你的成功状态码是 200
      //  核心改变：对接你的 PageDTO
      notes.value = res.data?.records || res.data?.list || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.data.msg || '获取列表失败')
    }
  } catch (error) {
    ElMessage.error('服务器连接异常')
    console.error(error)
  }
}

// 组件挂载时自动查库
onMounted(() => {
  fetchNotes()
})

// ================= 3. 新增与修改弹窗控制 =================
// 接收外部传来的初始内容（如果是点 AI 保存传过来的，initialContent 就有值）
const openAddNote = (initialContent = '') => {
  dialogTitle.value = '✨ 录入新知识'
  currentNoteId.value = null
  // 自动把 AI 的内容填入 textarea 里
  newNote.value = { title: '', content: initialContent } 
  dialogVisible.value = true
}

// 点击卡片上的编辑按钮
const openEditNote = (note) => {
  dialogTitle.value = '✏️ 编辑笔记'
  currentNoteId.value = note.id
  newNote.value = { title: note.title, content: note.content } // 回显数据
  dialogVisible.value = true
}

// ================= 4. 保存 (Create & Update) =================
const saveNote = async () => {
  if (!newNote.value.title.trim() || !newNote.value.content.trim()) {
    ElMessage.warning('标题和内容都不能为空哦，哥哥')
    return
  }

  try {
    if (currentNoteId.value) {
      // 执行修改 (对应你的 @PutMapping)
      // 执行新增 (对接你最新写的双写接口)
      const res = await request.put('/article', {
        id: currentNoteId.value,
        title: newNote.value.title,
        content: newNote.value.content
      })
      if (res.code === 200) {
        ElMessage.success('修改成功')
        // 如果放大的刚好是这篇，同步更新视图
        if (expandedNote.value && expandedNote.value.id === currentNoteId.value) {
          expandedNote.value.title = newNote.value.title
          expandedNote.value.content = newNote.value.content
        }
      }
    } else {
      // 执行新增 (对应你的 @PostMapping)
      const res = await request.post('/save-note', {
        title: newNote.value.title,
        content: newNote.value.content
      })
      if (res.code === 200) {
        ElMessage.success('笔记已存入数据库')
      }
    }
    
    dialogVisible.value = false
    currentPage.value = 1 // 强制切回第一页
    fetchNotes() // 保存完毕，重新拉取最新数据
  } catch (error) {
    ElMessage.error('操作失败，接口异常')
  }
}

// ================= 5. 删除 (Delete) =================
const deleteNote = (id) => {
  ElMessageBox.confirm('确定要彻底删除这篇笔记吗？', '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      const res = await request.delete(`/article/${id}`) // 对应你的 @DeleteMapping
      if (res.code === 200) {
        ElMessage.success('笔记删除成功')
        fetchNotes() // 重新拉取
        
        // 如果删掉的正是当前放大的这篇，退回网格
        if (expandedNote.value && expandedNote.value.id === id) {
          closeExpandedNote()
        }
      }
    } catch (error) {
      ElMessage.error('删除失败，接口异常')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// ================= 6. 展开/收起逻辑 =================
const expandNote = (note) => { expandedNote.value = note }
const closeExpandedNote = () => { expandedNote.value = null }

const summarizeNote = async (note) => {
  if (!note?.id) return

  summaryDialogVisible.value = true
  summaryLoading.value = true
  summaryContent.value = ''

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
  } catch (error) {
    ElMessage.error('AI总结失败，接口异常')
    summaryDialogVisible.value = false
  } finally {
    summaryLoading.value = false
  }
}

const copySummary = async () => {
  if (!summaryContent.value) return

  try {
    await navigator.clipboard.writeText(summaryContent.value)
    ElMessage.success('总结已复制')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// ================= 2. 处理点击翻页 =================
const handlePageChange = (val) => {
  currentPage.value = val // 更新当前所在的页码
  fetchNotes()            // 重新向后端发请求，拉取新一页的数据
}

// ================= 批量管理状态与逻辑 =================
const isManageMode = ref(false) // 是否开启编辑(批量操作)模式
const selectedIds = ref([])     // 存放选中的笔记 ID

// 切换编辑模式
const toggleManageMode = () => {
  isManageMode.value = !isManageMode.value
  selectedIds.value = [] // 每次退出或进入时，清空选中状态
}

// 选中/取消选中某张卡片
const toggleSelectNote = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1) // 已选中则移除
  } else {
    selectedIds.value.push(id) // 未选中则加入
  }
}

// 执行批量删除请求
const batchDeleteNotes = () => {
  if (selectedIds.value.length === 0) return

  ElMessageBox.confirm(`确定要彻底删除选定的 ${selectedIds.value.length} 篇笔记吗？`, '批量删除', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'danger',
  }).then(async () => {
    try {
      // request 的 DELETE 请求带有 body 参数时，必须包在 data 属性里！
      const res = await request.delete('/article/batch', {
        data: selectedIds.value 
      })
      if (res.code === 200 || res.code === 1) {
        ElMessage.success('批量删除成功')
        toggleManageMode() // 删完退出编辑模式
        fetchNotes() // 重新拉取最新列表
      }
    } catch (error) {
      ElMessage.error('批量删除失败，接口异常')
    }
  }).catch(() => {})
}
defineExpose({ openAddNote, isManageMode, selectedIds, toggleManageMode, batchDeleteNotes })
</script>

<style scoped>
/* ================= 笔记组件专属 CSS ================= */
.notes-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%; /* 强制向下撑满 */
  box-sizing: border-box;
  overflow: hidden; 
}

.cards-container {
  flex: 1;
  overflow: hidden;
  overflow-y: auto; 
  overflow-x: hidden;
  padding-right: 5px;
}

/* 穿透修改 el-card */
:deep(.note-card) {
  background-color: var(--tb-color-bg-panel);
  border: 1px solid var(--tb-color-border);
  color: var(--tb-color-text-primary);
  border-radius: 10px;
  transition: all 0.3s ease;
}
:deep(.note-card:hover) { border-color: var(--tb-color-primary); }
:deep(.el-card__header) { padding: 12px 15px; border-bottom: 1px solid var(--tb-color-border); }
:deep(.el-card__body) { padding: 15px; height: 100px; }

.card-header { display: flex; justify-content: space-between; align-items: center; }
.note-title { font-weight: bold; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 85%; }
.delete-icon { cursor: pointer; color: var(--tb-color-text-secondary); font-size: 16px; }
.delete-icon:hover { color: #f56c6c; }
.note-content { font-size: 13px; color: var(--tb-color-text-secondary); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 4;line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.pagination-dock { height: 50px; display: flex; justify-content: center; align-items: center; margin-top: 10px; }
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

/* 铺满放大模式样式 */
.expanded-fullscreen-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%; 
  background-color: var(--tb-color-bg-panel);
  border-radius: 0; 
  border: none; 
  box-sizing: border-box;
  animation: fadeInCard 0.2s ease-out;
}
@keyframes fadeInCard {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.expanded-header { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; border-bottom: 1px solid var(--tb-color-border); }
.header-left { display: flex; align-items: center; gap: 15px; }
.header-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.expanded-title { margin: 0; font-size: 18px; color: var(--tb-color-text-primary); }

.expanded-body {
  flex: 1;
  padding: 30px;
  overflow-y: auto; 
  overflow-x: hidden;
  color: var(--tb-color-text-primary);
  font-size: 15px;
  line-height: 1.8;
  white-space: pre-wrap;
}

/* 滚动条美化 */
.expanded-body::-webkit-scrollbar { width: 6px; }
.expanded-body::-webkit-scrollbar-track { background: transparent; }
.expanded-body::-webkit-scrollbar-thumb { background-color: var(--tb-color-border); border-radius: 4px; }
.expanded-body::-webkit-scrollbar-thumb:hover { background-color: var(--tb-color-text-secondary); }

/* 弹窗样式 */
:deep(.custom-dialog) { background-color: var(--tb-color-bg-panel) !important; border-radius: 12px; }
:deep(.el-dialog__title) { color: var(--tb-color-text-primary); }
:deep(.el-form-item__label) { color: var(--tb-color-text-secondary); }
:deep(.el-input__inner), :deep(.el-textarea__inner) {
  background-color: var(--tb-color-bg-input);
  border-color: var(--tb-color-border);
  color: var(--tb-color-text-primary);
}

.summary-content {
  min-height: 160px;
  max-height: 55vh;
  overflow-y: auto;
  padding: 4px 2px;
  color: var(--tb-color-text-primary);
  font-size: 15px;
  line-height: 1.8;
}

.summary-loading {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--tb-color-text-secondary);
  font-size: 14px;
}

.edit-icon {
  cursor: pointer;
  color: var(--tb-color-text-secondary);
  font-size: 16px;
  transition: color 0.2s;
}
.edit-icon:hover {
  color: var(--tb-color-primary); 
}

/* ================= 批量管理的圆框绿点样式 ================= */
.circle-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--tb-color-border);
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.circle-checkbox.is-checked {
  background-color: #67c23a; 
  border-color: #67c23a;
  box-shadow: inset 0 0 0 3px var(--tb-color-bg-panel); 
}

/* 去除 Element Plus 分页器自带的“禁止点击”鼠标手势 */
.pagination-container :deep(.el-pagination button:disabled),
.pagination-container :deep(.el-pagination .btn-prev:disabled),
.pagination-container :deep(.el-pagination .btn-next:disabled),
.pagination-container :deep(.el-pagination .el-pager li.is-active) {
  cursor: default !important; /* 强制替换为普通的箭头鼠标 */
}

/* 如果你觉得悬浮在当前页码上还是有点暗，可以顺手加这句保持亮蓝 */
.pagination-container :deep(.el-pagination .el-pager li.is-active:hover) {
  color: #409eff !important;
}
</style>
