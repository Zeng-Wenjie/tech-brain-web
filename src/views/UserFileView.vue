<template>
  <div class="user-file-workspace">
    <!-- ═══════════════ 上传 + 筛选区 ═══════════════ -->
    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">文件名</span>
          <el-input
            v-model="filters.keyword"
            placeholder="请输入文件名关键字"
            clearable
            class="filter-input"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">类型</span>
          <el-select v-model="filters.fileType" placeholder="全部" clearable class="filter-select">
            <el-option label="全部" value="" />
            <el-option label="文档" value="DOCUMENT" />
            <el-option label="图片" value="IMAGE" />
            <el-option label="其它" value="OTHER" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">扩展名</span>
          <el-select v-model="filters.fileExt" placeholder="全部" clearable class="filter-select">
            <el-option label="全部" value="" />
            <el-option v-for="ext in EXT_OPTIONS" :key="ext" :label="ext" :value="ext" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">时间范围</span>
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="filter-date"
          />
        </div>
        <div class="filter-actions">
          <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button :icon="RefreshRight" :loading="loading" @click="fetchList">刷新</el-button>
          <el-upload
            class="upload-inline"
            :show-file-list="false"
            :auto-upload="false"
            :accept="ACCEPT"
            :on-change="handleFileChange"
          >
            <el-button type="primary" :icon="Upload" :loading="uploadLoading">上传文件</el-button>
          </el-upload>
        </div>
      </div>
      <div class="upload-tip">
        支持 pdf / doc / docx / txt / md / png / jpg / jpeg / webp / py，单文件不超过 20MB
      </div>
    </div>

    <!-- ═══════════════ 表格 ═══════════════ -->
    <div class="table-container" v-if="loading || tableData.length">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        size="small"
        class="user-file-table"
        empty-text="暂无文件"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="originalName" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="fileTypeTag(row.fileType)" size="small" effect="dark">
              {{ fileTypeText(row.fileType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileExt" label="扩展名" width="90" align="center" />
        <el-table-column label="大小" width="110" align="right">
          <template #default="{ row }">
            <span class="size">{{ formatSize(row.fileSize) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="mimeType" label="MIME" min-width="150" show-overflow-tooltip />
        <el-table-column prop="uploadSource" label="来源" width="110" show-overflow-tooltip />
        <el-table-column prop="createTime" label="上传时间" width="170" show-overflow-tooltip />
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 空状态 -->
    <el-empty v-else description="暂无文件" class="file-empty" />

    <!-- ═══════════════ 分页 ═══════════════ -->
    <div class="pagination-bar" v-if="total > 0">
      <el-pagination
        background
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="fetchList"
        @size-change="onSizeChange"
      />
    </div>

    <!-- ═══════════════ 详情弹窗 ═══════════════ -->
    <el-dialog
      v-model="detailVisible"
      width="640px"
      :append-to-body="true"
      :show-close="false"
      class="tb-file-dialog"
      destroy-on-close
      @opened="onDialogOpen"
    >
      <template #header>
        <div class="detail-header">
          <div class="detail-header-left">
            <div class="detail-badge">
              <el-icon><Folder /></el-icon>
            </div>
            <div class="detail-titles">
              <div class="detail-title">文件详情</div>
              <div class="detail-subtitle" v-if="detail">
                {{ detail.originalName || '-' }}
              </div>
            </div>
          </div>
          <el-icon class="detail-close" @click="detailVisible = false"><Close /></el-icon>
        </div>
      </template>

      <div v-if="detailLoading" class="detail-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="detail" class="detail-body">
        <div class="detail-grid">
          <div class="kv"><span class="k">ID</span><span class="v">{{ detail.id ?? '-' }}</span></div>
          <div class="kv"><span class="k">文件名</span><span class="v">{{ detail.originalName || '-' }}</span></div>
          <div class="kv"><span class="k">扩展名</span><span class="v">{{ detail.fileExt || '-' }}</span></div>
          <div class="kv"><span class="k">MIME</span><span class="v">{{ detail.mimeType || '-' }}</span></div>
          <div class="kv">
            <span class="k">类型</span>
            <span class="v">
              <el-tag :type="fileTypeTag(detail.fileType)" size="small" effect="dark">
                {{ fileTypeText(detail.fileType) }}
              </el-tag>
            </span>
          </div>
          <div class="kv"><span class="k">大小</span><span class="v">{{ formatSize(detail.fileSize) }}</span></div>
          <div class="kv"><span class="k">存储类型</span><span class="v">{{ detail.storageType || '-' }}</span></div>
          <div class="kv"><span class="k">状态</span><span class="v">{{ detail.status ?? '-' }}</span></div>
          <div class="kv"><span class="k">上传来源</span><span class="v">{{ detail.uploadSource || '-' }}</span></div>
          <div class="kv"><span class="k">MD5</span><span class="v mono">{{ detail.md5 || '-' }}</span></div>
          <div class="kv full"><span class="k">访问地址</span><span class="v mono break">{{ detail.accessUrl || '-' }}</span></div>
          <div class="kv"><span class="k">创建时间</span><span class="v">{{ detail.createTime || '-' }}</span></div>
          <div class="kv"><span class="k">更新时间</span><span class="v">{{ detail.updateTime || '-' }}</span></div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Folder, Close, Loading, RefreshRight, Upload } from '@element-plus/icons-vue'
import { uploadUserFile, pageUserFiles, getUserFileDetail } from '@/api/userFile'
import { makeAllDialogsDraggable } from '@/utils/draggable'

const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg', 'webp', 'py']
const EXT_OPTIONS = ALLOWED_EXTS
const ACCEPT = '.pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.py'
const MAX_SIZE = 20 * 1024 * 1024

// ─── 筛选状态 ────────────────────────────────────────
const filters = reactive({
  keyword: '',
  fileType: '',
  fileExt: ''
})
const timeRange = ref(null)

// ─── 表格 & 分页 ─────────────────────────────────────
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)

// ─── 上传 ────────────────────────────────────────────
const uploadLoading = ref(false)

// ─── 详情 ────────────────────────────────────────────
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)

// ─── 弹窗拖动 ────────────────────────────────────────
function onDialogOpen() {
  nextTick(() => makeAllDialogsDraggable())
}

// ─── 工具方法 ────────────────────────────────────────
function fileTypeText(t) {
  if (t === 'DOCUMENT') return '文档'
  if (t === 'IMAGE') return '图片'
  return '其它'
}
function fileTypeTag(t) {
  if (t === 'DOCUMENT') return 'primary'
  if (t === 'IMAGE') return 'success'
  return 'info'
}
function formatSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '-'
  const b = Number(bytes)
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(2) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}

// ─── 上传校验 + 处理 ─────────────────────────────────
function validateFile(file) {
  const name = file.name || ''
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  if (!ALLOWED_EXTS.includes(ext)) {
    ElMessage.error('不支持该文件类型')
    return false
  }
  if (file.size > MAX_SIZE) {
    ElMessage.error('文件大小不能超过 20MB')
    return false
  }
  return true
}

async function handleFileChange(uploadFile) {
  const raw = uploadFile.raw
  if (!raw) return
  if (!validateFile(raw)) return

  uploadLoading.value = true
  try {
    const res = await uploadUserFile(raw)
    if (res.code === 200 || res.code === 1) {
      ElMessage.success('上传成功')
      pageNum.value = 1
      fetchList()
    } else {
      ElMessage.error(res.msg || res.message || '上传失败')
    }
  } catch {
    ElMessage.error('上传失败')
  } finally {
    uploadLoading.value = false
  }
}

// ─── 数据加载 ────────────────────────────────────────
function buildParams() {
  const [start, end] = Array.isArray(timeRange.value) ? timeRange.value : []
  return {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    keyword: filters.keyword || undefined,
    fileType: filters.fileType || undefined,
    fileExt: filters.fileExt || undefined,
    startTime: start || undefined,
    endTime: end || undefined
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await pageUserFiles(buildParams())
    if (res.code === 200 || res.code === 1) {
      const data = res.data || {}
      tableData.value = data.records || data.list || data.rows || []
      total.value = data.total || 0
    } else {
      ElMessage.error(res.msg || res.message || '查询失败')
    }
  } catch {
    // 全局拦截器已提示
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageNum.value = 1
  fetchList()
}

function handleReset() {
  filters.keyword = ''
  filters.fileType = ''
  filters.fileExt = ''
  timeRange.value = null
  pageNum.value = 1
  fetchList()
}

function onSizeChange(size) {
  pageSize.value = size
  pageNum.value = 1
  fetchList()
}

async function openDetail(id) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await getUserFileDetail(id)
    if (res.code === 200 || res.code === 1) {
      detail.value = res.data || null
    } else {
      ElMessage.error(res.msg || res.message || '获取详情失败')
      detailVisible.value = false
    }
  } catch {
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.user-file-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  padding: 16px 20px;
  overflow: hidden;
}

/* ── 上传 + 筛选区 ──────────────────────────── */
.filter-bar {
  background: #1e1e22;
  border: 0.5px solid #2e2e32;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.filter-label {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}
.filter-select { width: 140px; }
.filter-input  { width: 180px; }
.filter-date   { width: 320px; }
.filter-actions { display: flex; gap: 8px; margin-left: auto; align-items: center; }
.upload-inline { display: inline-block; }
.upload-tip {
  margin-top: 10px;
  font-size: 11px;
  color: #4b5263;
}

.filter-bar :deep(.el-input__wrapper),
.filter-bar :deep(.el-select__wrapper) {
  background: #252528 !important;
  box-shadow: 0 0 0 1px #2e2e32 inset !important;
}
.filter-bar :deep(.el-input__inner),
.filter-bar :deep(.el-select__placeholder) { color: #e2e4e9 !important; }
.filter-bar :deep(.el-input__inner::placeholder) { color: #4b5263 !important; }

/* ── 表格 ────────────────────────────────────── */
.table-container {
  flex: 1;
  min-height: 0;
  background: #1e1e22;
  border: 0.5px solid #2e2e32;
  border-radius: 10px;
  overflow: hidden;
}
:deep(.user-file-table) {
  --el-table-bg-color: #1e1e22;
  --el-table-tr-bg-color: #1e1e22;
  --el-table-header-bg-color: #252528;
  --el-table-row-hover-bg-color: #252528;
  --el-table-border-color: #2e2e32;
  --el-table-text-color: #c9ccd6;
  --el-table-header-text-color: #9ca3af;
  background: transparent !important;
  height: 100% !important;
}
:deep(.user-file-table .el-table__inner-wrapper::before) { background: transparent; }
:deep(.user-file-table th.el-table__cell) {
  background: #252528 !important;
  font-weight: 500;
  font-size: 12px;
}
:deep(.user-file-table td.el-table__cell) {
  background: transparent !important;
  font-size: 12.5px;
  border-bottom: 0.5px solid #2e2e32 !important;
}
:deep(.user-file-table tr:hover > td.el-table__cell) {
  background: #252528 !important;
}
:deep(.user-file-table .el-table__empty-text) { color: #4b5263; }
.size { font-family: ui-monospace, monospace; color: #a5b4fc; }

.file-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
:deep(.file-empty .el-empty__description p) { color: #4b5263; }
:deep(.file-empty .el-empty__image svg path) { fill: #2e2e32; }

/* ── 分页 ────────────────────────────────────── */
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 0;
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
:deep(.el-pagination .el-pagination__total),
:deep(.el-pagination .el-pagination__jump),
:deep(.el-pagination .el-input__inner) { color: #9ca3af !important; }
</style>

<!-- 不带 scoped：详情弹窗 append-to-body -->
<style>
.tb-file-dialog.el-dialog {
  background: #1a1a1c !important;
  border: none !important;
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}
.tb-file-dialog .el-dialog__header {
  background: linear-gradient(180deg, #1e1e22 0%, #1a1a1c 100%) !important;
  border-bottom: 0.5px solid #2e2e32;
  padding: 14px 18px !important;
  margin: 0 !important;
}
.tb-file-dialog .el-dialog__body {
  background: #1a1a1c !important;
  padding: 18px 22px 6px !important;
  color: #e2e4e9 !important;
}
.tb-file-dialog .el-dialog__footer {
  background: #1a1a1c !important;
  border-top: 0.5px solid #2e2e32;
  padding: 12px 18px !important;
}
.tb-file-dialog .detail-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.tb-file-dialog .detail-header-left {
  display: flex; align-items: center; gap: 12px; min-width: 0;
}
.tb-file-dialog .detail-badge {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 18px; flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}
.tb-file-dialog .detail-title  { font-size: 15px; font-weight: 600; color: #ffffff; line-height: 1.2; }
.tb-file-dialog .detail-subtitle {
  margin-top: 3px; font-size: 11px; color: #9ca3af;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 480px;
}
.tb-file-dialog .detail-close {
  font-size: 18px; color: #6b7280; cursor: pointer;
  padding: 5px; border-radius: 6px; transition: background 0.15s, color 0.15s;
}
.tb-file-dialog .detail-close:hover { background: #252528; color: #fff; }
.tb-file-dialog .detail-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 50px 0;
  color: #9ca3af; font-size: 13px;
}
.tb-file-dialog .detail-loading .el-icon { font-size: 32px; color: #818cf8; }
.tb-file-dialog .detail-body { max-height: 65vh; overflow-y: auto; padding-right: 4px; }
.tb-file-dialog .detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 18px;
}
.tb-file-dialog .detail-grid .kv {
  display: flex; align-items: baseline; gap: 8px;
  font-size: 12.5px; min-width: 0;
}
.tb-file-dialog .detail-grid .kv.full { grid-column: 1 / -1; }
.tb-file-dialog .detail-grid .k { color: #6b7280; min-width: 64px; flex-shrink: 0; }
.tb-file-dialog .detail-grid .v { color: #e2e4e9; word-break: break-all; min-width: 0; }
.tb-file-dialog .detail-grid .v.mono { font-family: ui-monospace, monospace; font-size: 12px; color: #818cf8; }
.tb-file-dialog .detail-grid .v.break { word-break: break-all; }
.tb-file-dialog .el-button {
  background: #252528 !important;
  border-color: #2e2e32 !important;
  color: #e2e4e9 !important;
}
.tb-file-dialog .el-button:hover {
  background: #2e2e32 !important;
  color: #ffffff !important;
}
</style>
