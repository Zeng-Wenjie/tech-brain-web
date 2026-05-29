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
 * 后端文件控制器根路径是 /api/files（带 /api 前缀，跟 tool-log 一致）
 * 经 vite 代理 rewrite 剥掉一层 /api，最终命中后端 /api/files/...
 */
const BASE = '/api/files'

/**
 * 上传用户文件
 * @param {File} file
 */
export function uploadUserFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`${BASE}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 分页查询用户文件
 * @param {Object} params { pageNum, pageSize, keyword, fileType, fileExt, startTime, endTime }
 */
export function pageUserFiles(params) {
  return request.get(`${BASE}/page`, { params: cleanParams(params) })
}

/**
 * 文件详情
 * @param {number|string} id
 */
export function getUserFileDetail(id) {
  return request.get(`${BASE}/${id}`)
}
