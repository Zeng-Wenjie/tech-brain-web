<template>
  <Teleport to="body">
    <div v-if="visible" class="login-modal-overlay" @click.self="close">
      <div
        class="login-modal"
        ref="modalRef"
        :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
      >
        <!-- 拖动手柄 -->
        <div class="modal-header" @mousedown="onDragStart">
          <div class="modal-title">
            <span class="logo-dot"></span>
            {{ isLogin ? '登录 Tech-Brain' : '注册 Tech-Brain' }}
          </div>
          <button class="modal-close" @click="close">✕</button>
        </div>

        <!-- 表单 -->
        <div class="modal-body">
          <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                prefix-icon="User"
                @keydown.enter="handleSubmit"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                show-password
                placeholder="请输入密码"
                prefix-icon="Lock"
                @keydown.enter="handleSubmit"
              />
            </el-form-item>
          </el-form>

          <el-button
            class="submit-btn"
            :loading="loading"
            @click="handleSubmit"
          >
            {{ isLogin ? '立刻进入' : '完成注册' }}
          </el-button>

          <div class="switch-row">
            <span @click="toggleMode">
              {{ isLogin ? '没有账号？去注册' : '已有账号？去登录' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const props = defineProps({
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible', 'success'])

const isLogin = ref(true)
const loading = ref(false)
const formRef = ref(null)
const modalRef = ref(null)

const form = reactive({ username: '', password: '' })

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '4-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '6-20个字符', trigger: 'blur' }
  ]
}

// 初始居中位置
const pos = reactive({ x: 0, y: 0 })
const centered = ref(false)

watch(() => props.visible, (val) => {
  if (val && !centered.value) {
    nextTick(() => {
      const el = modalRef.value
      if (el) {
        pos.x = (window.innerWidth - el.offsetWidth) / 2
        pos.y = (window.innerHeight - el.offsetHeight) / 2
        centered.value = true
      }
    })
  }
  if (!val) {
    centered.value = false
    formRef.value?.resetFields()
  }
})

// ── 拖动逻辑 ──────────────────────────────────────────
let dragging = false, sx = 0, sy = 0

function onDragStart(e) {
  if (e.button !== 0) return
  dragging = true
  sx = e.clientX - pos.x
  sy = e.clientY - pos.y

  const move = (e) => {
    if (!dragging) return
    pos.x = e.clientX - sx
    pos.y = e.clientY - sy
  }
  const up = () => {
    dragging = false
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
  }
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

// ── 登录 / 注册 ────────────────────────────────────────
function toggleMode() {
  isLogin.value = !isLogin.value
  nextTick(() => formRef.value?.resetFields())
}

function close() {
  emit('update:visible', false)
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  const url = isLogin.value ? '/login' : '/register'
  try {
    const res = await request.post(url, { username: form.username, password: form.password })
    if (res.code === 200) {
      if (isLogin.value) {
        localStorage.setItem('token', res.data.token)
        ElMessage.success('欢迎回来，' + res.data.username)
        emit('success', res.data)
        close()
      } else {
        ElMessage.success('注册成功，请登录！')
        isLogin.value = true
        nextTick(() => formRef.value?.resetFields())
      }
    } else {
      ElMessage.error(res.msg || res.message || '操作失败')
    }
  } catch {
    // 全局拦截器已处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.45);
}

.login-modal {
  position: fixed;
  width: 360px;
  background: #1e1e22;
  border: 0.5px solid #2e2e38;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  z-index: 10000;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #252528;
  border-bottom: 0.5px solid #2e2e32;
  cursor: move;
  user-select: none;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #c9ccd6;
}

.logo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6366f1;
}

.modal-close {
  background: transparent;
  border: none;
  color: #4b5263;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
  transition: color 0.2s;
}
.modal-close:hover { color: #e2e4e9; }

.modal-body {
  padding: 20px 20px 18px;
}

/* Element Plus 输入框适配暗色 */
:deep(.el-form-item__label) {
  color: #6b7280 !important;
  font-size: 12px !important;
  padding-bottom: 4px !important;
}
:deep(.el-input__wrapper) {
  background-color: #252528 !important;
  box-shadow: 0 0 0 1px #2e2e32 inset !important;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #6366f1 inset !important;
}
:deep(.el-input__inner) {
  color: #e2e4e9 !important;
  font-size: 13px !important;
}
:deep(.el-input__inner::placeholder) {
  color: #3a3d4a !important;
}
:deep(.el-input__prefix-inner .el-icon) {
  color: #4b5263 !important;
}
:deep(.el-form-item) {
  margin-bottom: 14px;
}

.submit-btn {
  width: 100%;
  height: 40px;
  background: #6366f1 !important;
  border: none !important;
  border-radius: 8px !important;
  color: #fff !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  margin-top: 6px;
  letter-spacing: 0.5px;
  transition: opacity 0.2s;
}
.submit-btn:hover { opacity: 0.88; }

.switch-row {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: #3a3d4a;
}
.switch-row span {
  cursor: pointer;
  color: #818cf8;
  transition: color 0.2s;
}
.switch-row span:hover { color: #a5b4fc; }
</style>
