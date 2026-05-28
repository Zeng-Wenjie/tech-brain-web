<template>
  <div class="tool-log-workspace">
    <el-tabs v-model="activeTab" class="tool-log-tabs" @tab-change="onTabChange">
      <el-tab-pane label="调用记录" name="list">

    <!-- ═══════════════ 筛选区 ═══════════════ -->
    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">工具名</span>
          <el-select v-model="filters.toolName" placeholder="全部" clearable size="default" class="filter-select">
            <el-option label="全部" value="" />
            <el-option label="ragSearch" value="ragSearch" />
            <el-option label="summarizeArticle" value="summarizeArticle" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">状态</span>
          <el-select v-model="filters.success" placeholder="全部" clearable size="default" class="filter-select">
            <el-option label="全部" :value="null" />
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">会话ID</span>
          <el-input
            v-model="filters.conversationId"
            placeholder="conversationId"
            clearable
            type="number"
            class="filter-input"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">traceId</span>
          <el-input
            v-model="filters.traceId"
            placeholder="traceId"
            clearable
            class="filter-input"
          />
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
        </div>
      </div>
    </div>

    <!-- ═══════════════ 表格 ═══════════════ -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        size="small"
        class="tool-log-table"
        empty-text="暂无日志"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="toolName" label="工具名" min-width="130" show-overflow-tooltip />
        <el-table-column prop="toolType" label="类型" width="110" show-overflow-tooltip />
        <el-table-column prop="callSource" label="调用来源" width="110" show-overflow-tooltip />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.success === 1 ? 'success' : 'danger'"
              size="small"
              effect="dark"
            >
              {{ row.success === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="90" align="right">
          <template #default="{ row }">
            <span class="duration">{{ row.durationMs != null ? row.durationMs + ' ms' : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="conversationId" label="会话ID" width="90" align="center" />
        <el-table-column label="traceId" min-width="180">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.traceId"
              :content="row.traceId"
              placement="top"
              :show-after="300"
            >
              <span class="trace-id">{{ shortTraceId(row.traceId) }}</span>
            </el-tooltip>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" show-overflow-tooltip />
        <el-table-column label="操作" width="90" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ═══════════════ 分页 ═══════════════ -->
    <div class="pagination-bar">
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

      </el-tab-pane>

      <!-- ═══════════════ Tab 2：统计概览 ═══════════════ -->
      <el-tab-pane label="统计概览" name="stats">
        <!-- 统计筛选区 -->
        <div class="filter-bar">
          <div class="filter-row">
            <div class="filter-item">
              <span class="filter-label">工具名</span>
              <el-select v-model="statsFilters.toolName" placeholder="全部" clearable size="default" class="filter-select">
                <el-option label="全部" value="" />
                <el-option label="ragSearch" value="ragSearch" />
                <el-option label="summarizeArticle" value="summarizeArticle" />
              </el-select>
            </div>
            <div class="filter-item">
              <span class="filter-label">调用来源</span>
              <el-select v-model="statsFilters.callSource" placeholder="全部" clearable size="default" class="filter-select">
                <el-option label="全部" value="" />
                <el-option label="FORCE_ROUTE" value="FORCE_ROUTE" />
                <el-option label="MODEL_TOOL_CALL" value="MODEL_TOOL_CALL" />
              </el-select>
            </div>
            <div class="filter-item">
              <span class="filter-label">会话ID</span>
              <el-input
                v-model="statsFilters.conversationId"
                placeholder="conversationId"
                clearable
                type="number"
                class="filter-input"
              />
            </div>
            <div class="filter-item">
              <span class="filter-label">时间范围</span>
              <el-date-picker
                v-model="statsTimeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="filter-date"
              />
            </div>
            <div class="filter-actions">
              <el-button type="primary" :loading="statsLoading" @click="handleStatsSearch">查询</el-button>
              <el-button @click="handleStatsReset">重置</el-button>
              <el-button :icon="RefreshRight" :loading="statsLoading" @click="fetchStats">刷新</el-button>
            </div>
          </div>
        </div>

        <!-- 顶部汇总卡片 -->
        <div class="stats-summary" v-loading="statsLoading">
          <div class="summary-card">
            <div class="summary-label">总调用量</div>
            <div class="summary-value">{{ summary.totalCount }}</div>
          </div>
          <div class="summary-card danger" v-if="summary.totalFailure > 0">
            <div class="summary-label">总失败数</div>
            <div class="summary-value">{{ summary.totalFailure }}</div>
          </div>
          <div class="summary-card" v-else>
            <div class="summary-label">总失败数</div>
            <div class="summary-value zero">{{ summary.totalFailure }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">整体失败率</div>
            <div class="summary-value">{{ summary.overallFailureRate }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">工具数量</div>
            <div class="summary-value">{{ statsData.length }}</div>
          </div>
        </div>

        <!-- 统计表 -->
        <div class="table-container" v-if="statsLoading || statsData.length">
          <el-table
            v-loading="statsLoading"
            :data="statsData"
            stripe
            size="small"
            class="tool-log-table"
            empty-text="暂无统计数据"
          >
            <el-table-column prop="toolName" label="工具名" min-width="160" show-overflow-tooltip />
            <el-table-column label="类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="toolTypeTag(row.toolType)" size="small" effect="dark">
                  {{ row.toolType || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalCount" label="调用量" width="110" align="right">
              <template #default="{ row }">
                <span class="num">{{ row.totalCount ?? 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="successCount" label="成功" width="110" align="right">
              <template #default="{ row }">
                <span class="num success">{{ row.successCount ?? 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="失败" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="(row.failureCount ?? 0) > 0 ? 'danger' : 'success'"
                  size="small"
                  effect="dark"
                >
                  {{ row.failureCount ?? 0 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="失败率" width="120" align="right">
              <template #default="{ row }">
                <span :class="['num', (row.failureRate ?? 0) > 0 ? 'danger' : '']">
                  {{ formatRate(row.failureRate) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="平均耗时" width="130" align="right">
              <template #default="{ row }">
                <span class="num duration">{{ formatDuration(row.avgDurationMs) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 空状态 -->
        <el-empty v-else description="暂无工具调用统计数据" class="stats-empty" />

      </el-tab-pane>
    </el-tabs>

    <!-- ═══════════════ 详情弹窗 ═══════════════ -->
    <el-dialog
      v-model="detailVisible"
      width="780px"
      :append-to-body="true"
      :show-close="false"
      class="tb-tool-log-dialog"
      destroy-on-close
      @opened="onDialogOpen"
    >
      <template #header>
        <div class="detail-header">
          <div class="detail-header-left">
            <div class="detail-badge">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="detail-titles">
              <div class="detail-title">工具调用详情</div>
              <div class="detail-subtitle" v-if="detail">
                {{ detail.toolName || '-' }} · {{ detail.createTime || '' }}
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
        <!-- 基础信息 -->
        <section class="detail-section">
          <div class="detail-section-title">基础信息</div>
          <div class="detail-grid">
            <div class="kv"><span class="k">traceId</span><span class="v mono">{{ detail.traceId || '-' }}</span></div>
            <div class="kv"><span class="k">会话ID</span><span class="v">{{ detail.conversationId ?? '-' }}</span></div>
            <div class="kv"><span class="k">用户ID</span><span class="v">{{ detail.userId ?? '-' }}</span></div>
            <div class="kv"><span class="k">工具名</span><span class="v">{{ detail.toolName || '-' }}</span></div>
            <div class="kv"><span class="k">工具类型</span><span class="v">{{ detail.toolType || '-' }}</span></div>
            <div class="kv"><span class="k">调用来源</span><span class="v">{{ detail.callSource || '-' }}</span></div>
            <div class="kv"><span class="k">路由原因</span><span class="v">{{ detail.routeReason || '-' }}</span></div>
            <div class="kv">
              <span class="k">执行状态</span>
              <span class="v">
                <el-tag :type="detail.success === 1 ? 'success' : 'danger'" size="small" effect="dark">
                  {{ detail.success === 1 ? '成功' : '失败' }}
                </el-tag>
              </span>
            </div>
            <div class="kv"><span class="k">耗时</span><span class="v">{{ detail.durationMs != null ? detail.durationMs + ' ms' : '-' }}</span></div>
            <div class="kv"><span class="k">创建时间</span><span class="v">{{ detail.createTime || '-' }}</span></div>
          </div>
        </section>

        <!-- 用户输入 -->
        <section class="detail-section">
          <div class="detail-section-title">
            用户输入
            <el-button v-if="detail.userMessage" size="small" link @click="copyText(detail.userMessage)">
              <el-icon><CopyDocument /></el-icon>
              <span style="margin-left:4px;">复制</span>
            </el-button>
          </div>
          <pre class="code-block plain">{{ detail.userMessage || '-' }}</pre>
        </section>

        <!-- 工具参数 -->
        <section class="detail-section">
          <div class="detail-section-title">
            工具参数 (argumentsJson)
            <el-button v-if="detail.argumentsJson" size="small" link @click="copyText(detail.argumentsJson)">
              <el-icon><CopyDocument /></el-icon>
              <span style="margin-left:4px;">复制</span>
            </el-button>
          </div>
          <pre class="code-block">{{ formatJson(detail.argumentsJson) }}</pre>
        </section>

        <!-- 工具结果 -->
        <section class="detail-section">
          <div class="detail-section-title">
            工具结果 (resultJson)
            <el-button v-if="detail.resultJson" size="small" link @click="copyText(detail.resultJson)">
              <el-icon><CopyDocument /></el-icon>
              <span style="margin-left:4px;">复制</span>
            </el-button>
          </div>
          <pre class="code-block">{{ formatJson(detail.resultJson) }}</pre>
        </section>

        <!-- 最终回答 -->
        <section class="detail-section">
          <div class="detail-section-title">
            最终回答 (finalAnswer)
            <el-button v-if="detail.finalAnswer" size="small" link @click="copyText(detail.finalAnswer)">
              <el-icon><CopyDocument /></el-icon>
              <span style="margin-left:4px;">复制</span>
            </el-button>
          </div>
          <pre class="code-block plain">{{ detail.finalAnswer || '-' }}</pre>
        </section>

        <!-- 错误信息（仅失败时强调） -->
        <section class="detail-section" v-if="detail.errorMessage">
          <div class="detail-section-title danger">
            错误信息
            <el-button size="small" link @click="copyText(detail.errorMessage)">
              <el-icon><CopyDocument /></el-icon>
              <span style="margin-left:4px;">复制</span>
            </el-button>
          </div>
          <pre class="code-block error">{{ detail.errorMessage }}</pre>
        </section>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Tickets, Close, Loading, CopyDocument, RefreshRight } from '@element-plus/icons-vue'
import { pageToolCallLogs, getToolCallLogDetail, getToolCallStats } from '@/api/toolLog'
import { makeAllDialogsDraggable } from '@/utils/draggable'

// ─── Tab 切换 ────────────────────────────────────────
const activeTab = ref('list')
function onTabChange(name) {
  if (name === 'stats' && !statsLoaded.value) fetchStats()
}

// ─── 统计概览 ────────────────────────────────────────
const statsFilters = reactive({
  toolName: '',
  callSource: '',
  conversationId: ''
})
const statsTimeRange = ref(null)
const statsLoading = ref(false)
const statsLoaded = ref(false)
const statsData = ref([])

const summary = computed(() => {
  const totalCount = statsData.value.reduce((s, r) => s + (r.totalCount || 0), 0)
  const totalFailure = statsData.value.reduce((s, r) => s + (r.failureCount || 0), 0)
  const rate = totalCount > 0 ? (totalFailure / totalCount) : 0
  return {
    totalCount,
    totalFailure,
    overallFailureRate: totalCount > 0 ? (rate * 100).toFixed(2) + '%' : '-'
  }
})

function buildStatsParams() {
  const [start, end] = Array.isArray(statsTimeRange.value) ? statsTimeRange.value : []
  return {
    toolName: statsFilters.toolName || undefined,
    callSource: statsFilters.callSource || undefined,
    conversationId: statsFilters.conversationId === '' ? undefined : statsFilters.conversationId,
    startTime: start || undefined,
    endTime: end || undefined
  }
}

async function fetchStats() {
  statsLoading.value = true
  try {
    const res = await getToolCallStats(buildStatsParams())
    if (res.code === 200 || res.code === 1) {
      statsData.value = Array.isArray(res.data) ? res.data : []
      statsLoaded.value = true
    } else {
      ElMessage.error(res.msg || res.message || '工具调用统计加载失败')
    }
  } catch {
    ElMessage.error('工具调用统计加载失败')
  } finally {
    statsLoading.value = false
  }
}

function handleStatsSearch() { fetchStats() }
function handleStatsReset() {
  statsFilters.toolName = ''
  statsFilters.callSource = ''
  statsFilters.conversationId = ''
  statsTimeRange.value = null
  fetchStats()
}

function formatRate(r) {
  if (r == null || isNaN(r)) return '-'
  return (Number(r) * 100).toFixed(2) + '%'
}
function formatDuration(d) {
  if (d == null || isNaN(d)) return '-'
  return Number(d).toFixed(2) + ' ms'
}
function toolTypeTag(t) {
  if (t === 'RAG') return 'primary'
  if (t === 'SUMMARY') return 'warning'
  return 'info'
}

// ─── 弹窗拖动 ────────────────────────────────────────
function onDialogOpen() {
  nextTick(() => makeAllDialogsDraggable())
}

// ─── 筛选状态 ────────────────────────────────────────
const filters = reactive({
  toolName: '',
  success: null,
  conversationId: '',
  traceId: ''
})
const timeRange = ref(null)

// ─── 表格 & 分页 ─────────────────────────────────────
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)

// ─── 详情 ────────────────────────────────────────────
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)

// ─── 工具方法 ────────────────────────────────────────
function shortTraceId(t) {
  if (!t) return '-'
  if (t.length <= 18) return t
  return t.slice(0, 8) + '...' + t.slice(-6)
}

function formatJson(text) {
  if (text == null || text === '') return '-'
  try {
    const obj = JSON.parse(text)
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(text)
  }
}

async function copyText(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text))
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

// ─── 数据加载 ────────────────────────────────────────
function buildParams() {
  const [start, end] = Array.isArray(timeRange.value) ? timeRange.value : []
  return {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    toolName: filters.toolName || undefined,
    success: filters.success === null || filters.success === '' ? undefined : filters.success,
    conversationId: filters.conversationId === '' ? undefined : filters.conversationId,
    traceId: filters.traceId || undefined,
    startTime: start || undefined,
    endTime: end || undefined
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await pageToolCallLogs(buildParams())
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
  filters.toolName = ''
  filters.success = null
  filters.conversationId = ''
  filters.traceId = ''
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
    const res = await getToolCallLogDetail(id)
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
.tool-log-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  padding: 16px 20px;
  overflow: hidden;
}

/* ── Tabs 暗色 ───────────────────────────── */
.tool-log-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
:deep(.tool-log-tabs > .el-tabs__header) {
  margin: 0 0 12px;
  border-bottom: 0.5px solid #2e2e32;
}
:deep(.tool-log-tabs .el-tabs__nav-wrap::after) {
  background-color: transparent;
}
:deep(.tool-log-tabs .el-tabs__item) {
  color: #6b7280;
  font-size: 13px;
  height: 36px;
  line-height: 36px;
}
:deep(.tool-log-tabs .el-tabs__item:hover) { color: #c9ccd6; }
:deep(.tool-log-tabs .el-tabs__item.is-active) { color: #a5b4fc; }
:deep(.tool-log-tabs .el-tabs__active-bar) { background-color: #6366f1; }
:deep(.tool-log-tabs > .el-tabs__content),
:deep(.tool-log-tabs .el-tab-pane) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* ── 统计汇总卡片 ──────────────────────── */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  flex-shrink: 0;
}
.summary-card {
  background: #1e1e22;
  border: 0.5px solid #2e2e32;
  border-radius: 10px;
  padding: 14px 16px;
}
.summary-card.danger { border-color: #5f2a31; background: #2a1418; }
.summary-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}
.summary-value {
  font-size: 22px;
  font-weight: 600;
  color: #e2e4e9;
  font-family: ui-monospace, monospace;
  letter-spacing: 0.5px;
}
.summary-value.zero { color: #59c585; }
.summary-card.danger .summary-value { color: #fca5a5; }

/* 数字列 */
.num { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #c9ccd6; }
.num.success { color: #59c585; }
.num.danger { color: #fca5a5; }
.num.duration { color: #a5b4fc; }

.stats-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
:deep(.stats-empty .el-empty__description p) { color: #4b5263; }
:deep(.stats-empty .el-empty__image svg path) { fill: #2e2e32; }

/* ── 筛选区 ──────────────────────────────────── */
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
.filter-select { width: 150px; }
.filter-input  { width: 160px; }
.filter-date   { width: 320px; }
.filter-actions { display: flex; gap: 8px; margin-left: auto; }

/* el-input / el-select 暗色微调 */
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
:deep(.tool-log-table) {
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
:deep(.tool-log-table .el-table__inner-wrapper::before) { background: transparent; }
:deep(.tool-log-table th.el-table__cell) {
  background: #252528 !important;
  font-weight: 500;
  font-size: 12px;
}
:deep(.tool-log-table td.el-table__cell) {
  background: transparent !important;
  font-size: 12.5px;
  border-bottom: 0.5px solid #2e2e32 !important;
}
:deep(.tool-log-table tr:hover > td.el-table__cell) {
  background: #252528 !important;
}
:deep(.tool-log-table .el-table__empty-text) { color: #4b5263; }
.duration { font-family: ui-monospace, monospace; color: #a5b4fc; }
.trace-id {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #818cf8;
  cursor: help;
}

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

<!-- ──────────────────────────────────────────────
     不带 scoped：详情弹窗 append-to-body，scoped 触达不到
─────────────────────────────────────────────── -->
<style>
.tb-tool-log-dialog.el-dialog {
  background: #1a1a1c !important;
  border: none !important;
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}
.tb-tool-log-dialog .el-dialog__header {
  background: linear-gradient(180deg, #1e1e22 0%, #1a1a1c 100%) !important;
  border-bottom: 0.5px solid #2e2e32;
  padding: 14px 18px !important;
  margin: 0 !important;
}
.tb-tool-log-dialog .el-dialog__body {
  background: #1a1a1c !important;
  padding: 18px 22px 6px !important;
  color: #e2e4e9 !important;
}
.tb-tool-log-dialog .el-dialog__footer {
  background: #1a1a1c !important;
  border-top: 0.5px solid #2e2e32;
  padding: 12px 18px !important;
}

.tb-tool-log-dialog .detail-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.tb-tool-log-dialog .detail-header-left {
  display: flex; align-items: center; gap: 12px; min-width: 0;
}
.tb-tool-log-dialog .detail-badge {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 18px; flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}
.tb-tool-log-dialog .detail-title  { font-size: 15px; font-weight: 600; color: #ffffff; line-height: 1.2; }
.tb-tool-log-dialog .detail-subtitle {
  margin-top: 3px; font-size: 11px; color: #9ca3af;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 480px;
}
.tb-tool-log-dialog .detail-close {
  font-size: 18px; color: #6b7280; cursor: pointer;
  padding: 5px; border-radius: 6px; transition: background 0.15s, color 0.15s;
}
.tb-tool-log-dialog .detail-close:hover { background: #252528; color: #fff; }

.tb-tool-log-dialog .detail-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 50px 0;
  color: #9ca3af; font-size: 13px;
}
.tb-tool-log-dialog .detail-loading .el-icon { font-size: 32px; color: #818cf8; }

.tb-tool-log-dialog .detail-body {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;
}
.tb-tool-log-dialog .detail-body::-webkit-scrollbar { width: 4px; }
.tb-tool-log-dialog .detail-body::-webkit-scrollbar-thumb { background: #2e2e32; border-radius: 4px; }

.tb-tool-log-dialog .detail-section {
  margin-bottom: 16px;
}
.tb-tool-log-dialog .detail-section-title {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
  padding-bottom: 6px;
  margin-bottom: 8px;
  border-bottom: 0.5px solid #2e2e32;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tb-tool-log-dialog .detail-section-title.danger { color: #fca5a5; }

.tb-tool-log-dialog .detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 18px;
}
.tb-tool-log-dialog .detail-grid .kv {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12.5px;
  min-width: 0;
}
.tb-tool-log-dialog .detail-grid .k {
  color: #6b7280;
  min-width: 70px;
  flex-shrink: 0;
}
.tb-tool-log-dialog .detail-grid .v {
  color: #e2e4e9;
  word-break: break-all;
  min-width: 0;
}
.tb-tool-log-dialog .detail-grid .v.mono {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #818cf8;
}

.tb-tool-log-dialog .code-block {
  background: #14141a;
  color: #e2e4e9;
  border: 0.5px solid #2e2e32;
  border-radius: 8px;
  padding: 10px 12px;
  margin: 0;
  max-height: 240px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.tb-tool-log-dialog .code-block::-webkit-scrollbar { width: 4px; height: 4px; }
.tb-tool-log-dialog .code-block::-webkit-scrollbar-thumb { background: #2e2e32; border-radius: 4px; }
.tb-tool-log-dialog .code-block.plain { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px; }
.tb-tool-log-dialog .code-block.error {
  background: #2a1418;
  border-color: #5f2a31;
  color: #fca5a5;
}

/* footer button 暗色 */
.tb-tool-log-dialog .el-button {
  background: #252528 !important;
  border-color: #2e2e32 !important;
  color: #e2e4e9 !important;
}
.tb-tool-log-dialog .el-button:hover {
  background: #2e2e32 !important;
  color: #ffffff !important;
}
.tb-tool-log-dialog .el-button.is-link {
  background: transparent !important;
  border: none !important;
  color: #818cf8 !important;
  padding: 0 !important;
}
.tb-tool-log-dialog .el-button.is-link:hover { color: #a5b4fc !important; }
</style>
