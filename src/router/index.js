import { createRouter, createWebHistory } from 'vue-router'
import AgentView from '../views/AgentView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: AgentView 
    },
    // 👇 加上这一段：注册登录路由
    {
      path: '/login',
      name: 'login',
      component: LoginView 
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView 
    }
  ]
})

// 👇 现代版全局路由守卫（Vue Router 4+ 推荐写法）
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  
  if (to.path !== '/login' && !token) {
    // 没登录且想去别的页面，直接 return 重定向的路径
    return '/login' 
  }
  
  // 验证通过，直接 return true 放行（不要再写 next() 了）
  return true 
})

export default router