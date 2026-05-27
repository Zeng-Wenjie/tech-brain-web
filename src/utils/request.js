import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000
})

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['token'] = token
  }
  return config
}, error => Promise.reject(error))

let lastUnauthorizedAt = 0
function handleUnauthorized() {
  localStorage.removeItem('token')
  const now = Date.now()
  if (now - lastUnauthorizedAt < 3000) return
  lastUnauthorizedAt = now
  window.dispatchEvent(new CustomEvent('tb:require-login'))
  ElMessage.error('身份已过期，请重新登录')
}

// 登录/注册接口本身不应触发"身份过期"逻辑
const AUTH_ENDPOINTS = ['/login', '/register']
function isAuthEndpoint(url = '') {
  return AUTH_ENDPOINTS.some(p => url.endsWith(p) || url.includes(p + '?'))
}

request.interceptors.response.use(response => {
  const res = response.data
  if (res && res.code === 401 && !isAuthEndpoint(response.config?.url)) {
    handleUnauthorized()
    return Promise.reject('Unauthorized')
  }
  return res
}, error => {
  if (axios.isCancel?.(error)) return Promise.reject(error)

  const status = error.response?.status
  const url = error.config?.url || ''
  const onAuth = isAuthEndpoint(url)

  // 登录/注册接口：直接把后端错误透传，不要清 token / 弹登录框
  if (onAuth) {
    const msg = error.response?.data?.msg
      || error.response?.data?.message
      || (status === 403 ? '登录被拒绝（请检查后端是否放行 /login）' : `请求失败 (${status || '网络异常'})`)
    ElMessage.error(msg)
    return Promise.reject(error)
  }

  if (status === 401 || status === 403) {
    handleUnauthorized()
    return Promise.reject(error)
  }

  if (error.response) {
    ElMessage.error(`请求失败 (${status})`)
  } else if (error.request) {
    ElMessage.error('无法连接到服务器，请检查后端是否启动')
  } else {
    ElMessage.error('请求异常：' + error.message)
  }
  return Promise.reject(error)
})

export default request
