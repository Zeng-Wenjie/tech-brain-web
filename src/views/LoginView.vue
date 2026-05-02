<template>
  <div class="login-container">
    <div class="aurora-wrapper">
      <div class="aurora">
        <div class="aurora-item purple"></div>
        <div class="aurora-item cyan"></div>
        <div class="aurora-item pink"></div>
      </div>
    </div>
    
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span class="title">{{ isLogin ? 'Tech-Brain 登录' : '加入 Tech-Brain' }}</span>
        </div>
      </template>

      <el-form :model="authForm" :rules="rules" ref="authFormRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="authForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="authForm.password" type="password" show-password placeholder="请输入密码" prefix-icon="Lock" />
        </el-form-item>

        <div class="btn-group">
          <el-button type="primary" @click="handleSubmit" :loading="loading" class="main-btn">
            {{ isLogin ? '立刻进入' : '完成注册' }}
          </el-button>
          <el-button link @click="toggleMode" class="switch-btn">
            {{ isLogin ? '没有账号？去注册' : '已有账号？去登录' }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue' // 引入图标

const router = useRouter()
const isLogin = ref(true)
const loading = ref(false)
const authFormRef = ref(null)

const authForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 4, max: 20, message: '长度在 4 到 20 个字符', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }]
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  // 使用 nextTick 确保表单渲染完成后重置，防止报错
  nextTick(() => {
    authFormRef.value.resetFields()
  })
}

const handleSubmit = async () => {
  await authFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    const url = isLogin.value ? '/login' : '/register'
    
    try {
      // ⚠️ 记得检查你的 request.js baseURL 配置是否正确指引到后端地址
      const res = await request.post(url, authForm)
      if (res.code === 200) {
        if (isLogin.value) {
          localStorage.setItem('token', res.data.token)
          localStorage.setItem('userInfo', JSON.stringify(res.data))
          ElMessage.success('欢迎回来，' + res.data.username)
          router.push('/')
        } else {
          ElMessage.success('注册成功，请登录！')
          isLogin.value = true
        }
      } else {
        ElMessage.error(res.msg || res.message || '操作失败')
      }
    } catch (error) {
      console.error(error)
      // 提示更详细的错误（开发时非常重要，能看出是否连接失败）
      if (error.response) {
         ElMessage.error(`服务器报错: ${error.response.status}`)
      } else {
         ElMessage.error('连接服务器失败，请检查后端CORS配置')
      }
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  /* 基础深灰背景，作为极光透出的底色 */
  background-color: #2b2b2b;
  overflow: hidden;
}

/* ============ 核心：动态极光效果 (纯 CSS 实现) ============ */
.aurora-wrapper {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 1; /* 保证在表单卡片下方 */
}

.aurora {
  position: absolute;
  width: 100%; height: 100%;
  filter: blur(100px); /* ⚠️ 核心模糊，让色块融合成光晕 */
  opacity: 0.6; /* 极光整体亮度 */
}

.aurora-item {
  position: absolute;
  border-radius: 50%;
  animation: move-swirl 20s infinite ease-in-out alternate; /* 漩涡移动动画 */
}

.purple {
  width: 1000px; height: 1000px;
  background-color: rgba(138, 43, 226, 0.5); /* 霓虹紫 */
  top: -300px; left: -200px;
  animation-delay: -5s;
}

.cyan {
  width: 900px; height: 900px;
  background-color: rgba(0, 255, 255, 0.4); /* 霓虹青 */
  bottom: -200px; right: -100px;
  animation-delay: -2s;
}

.pink {
  width: 800px; height: 800px;
  background-color: rgba(255, 105, 180, 0.4); /* 亮粉 */
  top: 10%; right: 20%;
  animation-delay: -8s;
}

/* 极光漩涡移动动画 */
@keyframes move-swirl {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(100px, -50px) rotate(30deg); }
  100% { transform: translate(-50px, 80px) rotate(-30deg); }
}

/* ============ 核心：毛玻璃效果表单卡片 ============ */
.login-card {
  width: 420px;
  z-index: 2; /* 保证在极光上方 */
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1); /* 微弱的边框描边 */
  
  /* 💡 毛玻璃灵魂属性：背景半透明 + 背景模糊 */
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(20px); /* iOS 风的高逼格模糊 */
  -webkit-backdrop-filter: blur(20px);
  
  box-shadow: 0 15px 35px rgba(0,0,0,0.3);
}

/* 强制让 Element Plus 的卡片头部和身体也变成半透明 */
.el-card :deep(.el-card__header),
.el-card :deep(.el-card__body) {
  background-color: transparent !important;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.title {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #00ffff, #ff69b4); /* 极光色渐变标题 */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 强制把表单的 Label 也变白，保持 UI 一致性 */
.el-form :deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.7) !important;
  font-weight: bold;
}

/* 输入框的半透明质感，呼应毛玻璃 */
.el-input :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
}

.el-input :deep(.el-input__inner) {
  color: #fff !important;
}

.el-input :deep(.el-input__inner)::placeholder {
  color: rgba(255, 255, 255, 0.4) !important;
}

.btn-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 30px;
}

.main-btn {
  width: 100%;
  height: 45px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #8a2be2, #00ffff) !important; /* 霓虹渐变按钮 */
  border: none !important;
  box-shadow: 0 5px 15px rgba(0, 255, 255, 0.2);
  transition: all 0.3s;
}

.main-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 255, 255, 0.4);
}

.switch-btn {
  color: rgba(255, 255, 255, 0.6) !important;
  transition: all 0.3s;
}

.switch-btn:hover {
  color: #00ffff !important;
}
</style>