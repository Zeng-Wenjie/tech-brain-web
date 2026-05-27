import { createRouter, createWebHistory } from 'vue-router'
import AgentView from '../views/AgentView.vue'
import ProfileView from '../views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: AgentView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    }
  ]
})

// 只保护 profile 页面，/ 首页无需登录也可访问
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    // 触发全局登录弹窗事件，而不是跳转页面
    window.dispatchEvent(new CustomEvent('tb:require-login'))
    return false
  }
  return true
})

export default router
