import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: 'http://localhost:8080', // 指向你的 Spring Boot 地址
  timeout: 60000
})

// 1. 请求拦截器：在大门里面，给每个发出的请求都贴上 Token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    // ⚠️ 这里的 Key 必须和你后端 request.getHeader("token") 保持完全一致
    config.headers['token'] = token 
  }
  return config
}, error => {
  return Promise.reject(error)
})

// 2. 响应拦截器：当后端由于 Token 过期把你踢出来时，前端得立刻响应
request.interceptors.response.use(response => {
  const res = response.data
  // 如果后端返回 401（未授权），立刻清空本地 Token 并跳回登录页
  if (res.code === 401) {
    localStorage.removeItem('token')
    router.push('/login')
    ElMessage.error('身份已过期，请重新登录')
    return Promise.reject('Unauthorized')
  }
  return res
}, error => {
  ElMessage.error('服务器连接异常')
  return Promise.reject(error)
})

export default request