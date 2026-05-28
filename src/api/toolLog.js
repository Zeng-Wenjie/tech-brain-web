import request from '@/utils/request'

/**
 * 构造请求参数：去掉空字符串 / null / undefined
 */
function cleanParams(params = {}) {
  const out = {}
  Object.keys(params).forEach(k => {
    const v = params[k]
    if (v === null || v === undefined) return
    if (typeof v === 'string' && v.trim() === '') return
    out[k] = v
  })
  return out
}

/**
 * 后端工具日志控制器的根路径是 /api/tool-log（带 /api 前缀，跟其他接口不同）
 * 经 vite 代理 rewrite 剥掉一层 /api 之后还要剩 /api/tool-log，所以前端这里要写 /api/tool-log/...
 *
 * 请求流程：
 *   request.get('/api/tool-log/page')
 *     → baseURL=/api 拼出 /api/api/tool-log/page
 *     → vite 代理匹配 /api → rewrite 剥掉一层 /api
 *     → 后端收到 /api/tool-log/page ✓
 */
const BASE = '/api/tool-log'

/**
 * 分页查询工具调用日志
 * @param {Object} params { pageNum, pageSize, traceId, conversationId, toolName, toolType, callSource, success, startTime, endTime }
 */
export function pageToolCallLogs(params) {
  return request.get(`${BASE}/page`, { params: cleanParams(params) })
}

/**
 * 工具调用日志详情
 * @param {number|string} id
 */
export function getToolCallLogDetail(id) {
  return request.get(`${BASE}/${id}`)
}

/**
 * 按工具名维度的调用统计
 * @param {Object} params { toolName, conversationId, callSource, startTime, endTime }
 */
export function getToolCallStats(params) {
  return request.get(`${BASE}/stats/tool`, { params: cleanParams(params) })
}

/**
 * RAG 命中率统计（固定统计 ragSearch，不接受 toolName 参数）
 * @param {Object} params { conversationId, callSource, startTime, endTime }
 */
export function getRagHitStats(params) {
  return request.get(`${BASE}/stats/rag-hit`, { params: cleanParams(params) })
}
