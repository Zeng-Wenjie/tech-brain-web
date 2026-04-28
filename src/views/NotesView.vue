<template>
  <div class="notes-workspace" :style="{ padding: expandedNote ? '0' : '20px 30px' }">
    
    <template v-if="!expandedNote">
      <div class="cards-container">
        <el-row :gutter="20" style="margin: 0;">
          <el-col :span="8" v-for="note in notesList" :key="note.id" style="margin-bottom: 20px;">
            <el-card class="note-card" shadow="hover" @dblclick="expandNote(note)">
              <template #header>
                <div class="card-header">
                  <span class="note-title">{{ note.title }}</span>
                  <div>
                    <el-icon class="edit-icon" @click.stop="openEditNote(note)" style="margin-right: 10px;"><Edit /></el-icon>
                    <el-icon class="delete-icon" @click.stop="deleteNote(note.id)"><Close /></el-icon>
                  </div>
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

  </div>
</template>

<script setup>
import { ref, onMounted, defineExpose } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Back, Edit } from '@element-plus/icons-vue' // 加上了 Edit
import axios from 'axios' // 记得引入 axios

// ================= 1. 数据状态定义 =================
const notesList = ref([]) // 初始为空，等后端数据
const expandedNote = ref(null)

const currentPage = ref(1)
const pageSize = ref(9)
const totalNotes = ref(0)

// 弹窗相关状态
const dialogVisible = ref(false)
const dialogTitle = ref('✨ 录入新知识')
const currentNoteId = ref(null)
const newNote = ref({ title: '', content: '' })

// ================= 2. 查询 (Read) =================
const fetchNotes = async () => {
  try {
    const res = await axios.get('/api/article') // 对应你的 @GetMapping
    if (res.data && res.data.code === 200) {
      notesList.value = res.data.data
      totalNotes.value = res.data.data.length // 如果暂时没做真分页，先用总长度代替
    }
  } catch (error) {
    ElMessage.error('获取知识库列表失败，请检查后端服务')
  }
}

// 组件挂载时自动查库
onMounted(() => {
  fetchNotes()
})

// ================= 3. 新增与修改弹窗控制 =================
// 暴露给父组件(AgentView)使用的新增方法
const openAddNote = () => {
  dialogTitle.value = '✨ 录入新知识'
  currentNoteId.value = null
  newNote.value = { title: '', content: '' }
  dialogVisible.value = true
}
defineExpose({ openAddNote })

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
      const res = await axios.put('/api/article', {
        id: currentNoteId.value,
        title: newNote.value.title,
        content: newNote.value.content
      })
      if (res.data.code === 200) {
        ElMessage.success('修改成功')
        // 如果放大的刚好是这篇，同步更新视图
        if (expandedNote.value && expandedNote.value.id === currentNoteId.value) {
          expandedNote.value.title = newNote.value.title
          expandedNote.value.content = newNote.value.content
        }
      }
    } else {
      // 执行新增 (对应你的 @PostMapping)
      const res = await axios.post('/api/article', {
        title: newNote.value.title,
        content: newNote.value.content
      })
      if (res.data.code === 200) {
        ElMessage.success('笔记已存入数据库')
      }
    }
    
    dialogVisible.value = false
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
      const res = await axios.delete(`/api/article/${id}`) // 对应你的 @DeleteMapping
      if (res.data.code === 200) {
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

const handlePageChange = (val) => {
  console.log(`切换到第 ${val} 页，后续联调真实分页`)
}
</script>

<style scoped>
/* ================= 笔记组件专属 CSS ================= */
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
.note-content { font-size: 13px; color: var(--tb-color-text-secondary); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }

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

.expanded-header { display: flex; align-items: center; padding: 15px 20px; border-bottom: 1px solid var(--tb-color-border); }
.header-left { display: flex; align-items: center; gap: 15px; }
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

.edit-icon {
  cursor: pointer;
  color: var(--tb-color-text-secondary);
  font-size: 16px;
  transition: color 0.2s;
}
.edit-icon:hover {
  color: var(--tb-color-primary); 
}
</style>