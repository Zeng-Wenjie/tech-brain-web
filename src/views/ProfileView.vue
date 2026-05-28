<template>
  <div class="profile-layout-wrapper">
  <div class="profile-container">
    <div class="profile-aside">
      <div class="aside-header">
        <button class="back-btn" title="返回主页" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <div class="aside-title">个人中心</div>
      </div>
      <el-menu :default-active="activeMenu" class="profile-menu" @select="handleMenuSelect">
        <el-menu-item index="info"><i class="el-icon-user"></i> <span>我的信息</span></el-menu-item>
        <el-menu-item index="security"><i class="el-icon-lock"></i> <span>账号安全</span></el-menu-item>
        <el-menu-item index="my-records" disabled><i class="el-icon-notebook"></i> <span>我的记录</span></el-menu-item>
      </el-menu>
    </div>

    <div class="profile-main">
      <div class="user-banner">
        <div class="avatar-container">
          <el-upload
            class="avatar-uploader"
            action="#" 
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleAvatarChange" 
          >
            <el-avatar :size="80" :src="userInfo.avatar" class="main-avatar">
              <i class="el-icon-user-solid" v-if="!userInfo.avatar"></i>
            </el-avatar>
            <div class="avatar-hover-text">点击修改头像</div>
          </el-upload>
          
          <div class="name-box">
             <span class="full-name">{{ userInfo.name || userInfo.username || '未登录' }}</span>
          </div>
        </div>
      </div>

      <div class="content-body">
        <div v-if="activeMenu === 'info'" class="info-form">
          <h3 class="section-title">我的信息</h3>
          
          <el-form :model="userInfo" label-width="100px" style="max-width: 500px">
            <el-form-item label="昵称">
              <el-input v-model="userInfo.name" placeholder="设置你的昵称" />
            </el-form-item>
            
            <el-form-item label="性别">
              <el-radio-group v-model="userInfo.gender">
                <el-radio :value="1">男</el-radio>
                <el-radio :value="2">女</el-radio>
                <el-radio :value="0">保密</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="个人签名">
              <el-input type="textarea" v-model="userInfo.sign" placeholder="设置你的个性签名" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="handleSaveInfo">保存更新</el-button>
            </el-form-item>
          </el-form>
        </div>

      <div v-if="activeMenu === 'security'" class="security-list">
          <h3 class="section-title">账号安全</h3>
          <div class="security-item">
            <div class="sec-label">登录密码</div>
            <div class="sec-value">已设置</div>
            <el-button link type="primary" @click="openPasswordDialog">
              修改
            </el-button>
          </div>
          <div class="security-item">
            <div class="sec-label">手机绑定</div>
            <div class="sec-value">{{ userInfo.phone || '未绑定' }}</div>
            <el-button link type="primary" @click="openBindDialog('phone')">
              {{ userInfo.phone ? '修改' : '绑定' }}
            </el-button>
          </div>
          <div class="security-item">
            <div class="sec-label">邮箱绑定</div>
            <div class="sec-value">{{ userInfo.email || '未绑定' }}</div>
            <el-button link type="primary" @click="openBindDialog('email')">
              {{ userInfo.email ? '修改' : '绑定' }}
            </el-button>
          </div>
        </div>

      </div> </div> <el-dialog v-model="bindDialogVisible" :title="bindType === 'phone' ? '绑定手机号' : '绑定邮箱'" width="400px" @opened="onProfileDialogOpen">
      <el-form label-width="80px">
        <el-form-item :label="bindType === 'phone' ? '手机号' : '邮箱'">
          <el-input v-model="bindValue" :placeholder="bindType === 'phone' ? '请输入新的手机号' : '请输入新的邮箱'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bindDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitBind">确 认</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" title="修改登录密码" width="420px" @opened="onProfileDialogOpen" @closed="resetPasswordForm">
      <el-form label-width="100px">
        <el-form-item label="旧密码">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入旧密码"
          />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            placeholder="请输入 6-20 位新密码"
          />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="passwordSubmitting" @click="submitPassword">
            确 认
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div> 
  </div>
  </template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { makeAllDialogsDraggable } from '@/utils/draggable'

function onProfileDialogOpen() {
  nextTick(() => makeAllDialogsDraggable())
}

function goBack() {
  router.push('/')
}



const router = useRouter()
const activeMenu = ref('info')
const userInfo = ref({
  username: '',
  name: '',
  avatar: '',
  gender: 0,
  sign: '',
  level: 1,
  silverCoin: 0,
  goldCoin: 0
})

const handleMenuSelect = (index) => {
  activeMenu.value = index
}

// 挂载时拉取最新数据
onMounted(async () => {
  const res = await request.get('/info')
  if (res.code === 200) {
    userInfo.value = res.data
  }
})

// ... 原有的 import 和 ref 保持不变 ...

const handleAvatarChange = async (file) => {
  // 1. 如果是文件状态改变引起的触发，且没有原始文件，直接退出
  if (!file.raw) return;

  // 组装文件数据（这里是您之前丢失的真正上传逻辑！）
  const formData = new FormData();
  formData.append('file', file.raw); // 这里的 'file' 要和后端 Controller 接收的参数名一致

  try {
    //3. 把文件给后端上传接口
    const uploadRes = await request.post('/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // 4. 判断阿里云 OSS 是否成功返回了 URL
    if (uploadRes.code === 200 && uploadRes.data) {
      
      // 立马更新前端显示的图片
      userInfo.value.avatar = uploadRes.data; 
      ElMessage.success('头像上传至OSS成功');

      // 🎯 5. 拿到新 URL 后，静默调用保存接口，把新信息存进 MySQL，并触发双删
      const updateRes = await request.post('/userInformation', userInfo.value);
      
      if (updateRes.code === 200) {
        ElMessage.success('头像已永久保存生效！');
      } else {
        ElMessage.error('头像保存到数据库失败');
      }

    } else {
      ElMessage.error('阿里云OSS上传失败');
    }
  } catch (error) {
    console.error("操作异常", error);
    ElMessage.error('上传接口请求失败，请检查网络或后端状态');
  }
}


// 保存信息接口
const handleSaveInfo = async () => {
  const res = await request.post('/userInformation', userInfo.value)
  if (res.code === 200) {
    ElMessage.success('个人信息更新成功')
  }
}

// 💡 1. 定义弹窗需要的响应式变量
const bindDialogVisible = ref(false)
const bindType = ref('phone') // 记录当前是修改手机(phone)还是邮箱(email)
const bindValue = ref('')     // 弹窗里输入框的值
const passwordDialogVisible = ref(false)
const passwordSubmitting = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 💡 2. 打开弹窗的函数
const openBindDialog = (type) => {
  bindType.value = type
  // 把原有的手机/邮箱值放进输入框（如果有的话）
  bindValue.value = type === 'phone' ? userInfo.value.phone : userInfo.value.email
  bindDialogVisible.value = true
}

// 💡 3. 提交绑定/修改的函数 (复用你后端的 userInformation 接口)
const submitBind = async () => {
  if (!bindValue.value) {
    ElMessage.warning('内容不能为空')
    return
  }

  // 构建提交给后端的 Payload。直接更新本地 userInfo 对应字段
  if (bindType.value === 'phone') {
    userInfo.value.phone = bindValue.value
  } else {
    userInfo.value.email = bindValue.value
  }

  // 复用你后端的 "/userInformation" 接口进行全量更新
  try {
    const res = await request.post('/userInformation', userInfo.value)
    if (res.code === 200) {
      ElMessage.success('绑定信息更新成功！')
      bindDialogVisible.value = false // 关闭弹窗
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error) {
    ElMessage.error('网络异常，请检查后端服务')
  }
}

const openPasswordDialog = () => {
  resetPasswordForm()
  passwordDialogVisible.value = true
}

const resetPasswordForm = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordSubmitting.value = false
}

const validatePasswordForm = () => {
  const { oldPassword, newPassword, confirmPassword } = passwordForm.value

  if (!oldPassword) {
    ElMessage.warning('旧密码不能为空')
    return false
  }
  if (!newPassword) {
    ElMessage.warning('新密码不能为空')
    return false
  }
  if (newPassword.length < 6 || newPassword.length > 20) {
    ElMessage.warning('新密码长度必须为 6-20 位')
    return false
  }
  if (!confirmPassword) {
    ElMessage.warning('确认密码不能为空')
    return false
  }
  if (newPassword !== confirmPassword) {
    ElMessage.warning('两次新密码必须一致')
    return false
  }
  if (newPassword === oldPassword) {
    ElMessage.warning('新密码不能和旧密码相同')
    return false
  }

  return true
}

const submitPassword = async () => {
  if (!validatePasswordForm()) return

  passwordSubmitting.value = true
  try {
    const res = await request.post('/password', passwordForm.value)
    if (res.code === 200) {
      ElMessage.success('密码修改成功，请使用新密码重新登录')
      passwordDialogVisible.value = false
      localStorage.removeItem('token')
      router.push('/')
    } else {
      ElMessage.error(res.message || '密码修改失败')
    }
  } catch (error) {
    ElMessage.error('网络异常，请检查后端服务')
  } finally {
    passwordSubmitting.value = false
  }
}
</script>

<style scoped>
/* ─── 整体布局 ─────────────────────────────────────── */
.profile-layout-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  min-height: 100vh;
  background-color: #111113;
  padding: 24px 0;
  box-sizing: border-box;
  z-index: 10;
  overflow-y: auto;
}
.profile-layout-wrapper::-webkit-scrollbar { width: 6px; }
.profile-layout-wrapper::-webkit-scrollbar-thumb { background: #2e2e32; border-radius: 4px; }

.profile-container {
  display: flex;
  max-width: 1100px;
  margin: 0 auto;
  background-color: #171717;
  border-radius: 14px;
  min-height: 80vh;
  border: 0.5px solid #2e2e32;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

/* ─── 左侧菜单 ─────────────────────────────────────── */
.profile-aside {
  width: 200px;
  border-right: 0.5px solid #252525;
  background-color: #161618;
  padding: 18px 0;
  flex-shrink: 0;
}
.aside-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 16px;
  border-bottom: 0.5px solid #252525;
  margin-bottom: 10px;
}
.aside-title {
  font-size: 14px;
  font-weight: 500;
  color: #c9ccd6;
  letter-spacing: 0.5px;
}
.back-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e1e22;
  border: 0.5px solid #2e2e32;
  border-radius: 7px;
  color: #9ca3af;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  padding: 0;
}
.back-btn:hover {
  background: #252528;
  color: #e2e4e9;
  border-color: #3a3d4a;
}

/* Element Plus 菜单暗色覆盖 */
.profile-menu {
  background: transparent !important;
  border-right: none !important;
}
:deep(.profile-menu .el-menu-item) {
  background: transparent !important;
  color: #9ca3af !important;
  font-size: 13px;
  height: 42px;
  line-height: 42px;
  margin: 2px 10px;
  border-radius: 7px;
  padding: 0 14px !important;
  transition: background 0.15s, color 0.15s;
}
:deep(.profile-menu .el-menu-item:hover) {
  background: #1e1e22 !important;
  color: #e2e4e9 !important;
}
:deep(.profile-menu .el-menu-item.is-active) {
  background: rgba(99, 102, 241, 0.13) !important;
  color: #a5b4fc !important;
}
:deep(.profile-menu .el-menu-item.is-disabled) {
  color: #3a3d4a !important;
  opacity: 0.5;
}

/* ─── 右侧主区域 ─────────────────────────────────── */
.profile-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #171717;
  min-width: 0;
}

.user-banner {
  padding: 28px 36px;
  display: flex;
  align-items: center;
  border-bottom: 0.5px solid #252525;
  background: linear-gradient(180deg, #1a1a1c 0%, #171717 100%);
}
.avatar-container {
  display: flex;
  align-items: center;
  gap: 22px;
}
.name-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 80px;
}
.full-name {
  font-size: 22px;
  font-weight: 600;
  color: #e2e4e9 !important;
  line-height: 1.2;
}

/* ─── 内容区 ─────────────────────────────────── */
.content-body {
  padding: 28px 36px;
  flex: 1;
  background-color: #171717;
}
.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #e2e4e9;
  margin: 0 0 22px;
  padding-bottom: 12px;
  border-bottom: 0.5px solid #252525;
  letter-spacing: 0.3px;
}

/* Element Plus 表单 / Radio 暗色 */
:deep(.el-form-item__label) { color: #9ca3af !important; font-size: 13px !important; }
:deep(.el-radio__label) { color: #c9ccd6 !important; font-size: 13px; }
:deep(.el-radio__inner) {
  background: #252528 !important;
  border-color: #3a3d4a !important;
}
:deep(.el-radio__input.is-checked .el-radio__inner) {
  background: #6366f1 !important;
  border-color: #6366f1 !important;
}
:deep(.el-radio__input.is-checked + .el-radio__label) { color: #a5b4fc !important; }

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: #252528 !important;
  box-shadow: 0 0 0 1px #2e2e32 inset !important;
}
:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #6366f1 inset !important;
}
:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: #e2e4e9 !important;
  background: transparent !important;
}
:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) { color: #4b5263 !important; }

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%) !important;
  border-color: #6366f1 !important;
  color: #fff !important;
}
:deep(.el-button--primary:hover) { opacity: 0.9; }

/* ─── 账号安全列表 ─────────────────────────────── */
.security-item {
  display: flex;
  align-items: center;
  padding: 18px 0;
  border-bottom: 0.5px solid #252525;
  gap: 12px;
}
.security-item:last-child { border-bottom: none; }
.sec-label {
  width: 100px;
  color: #6b7280;
  font-size: 13px;
}
.sec-value {
  flex: 1;
  font-weight: 500;
  color: #e2e4e9;
  font-size: 13px;
}
:deep(.security-item .el-button.is-link) {
  color: #a5b4fc !important;
  font-size: 13px;
}
:deep(.security-item .el-button.is-link:hover) { color: #c4b5fd !important; }

/* ─── 头像上传 ─────────────────────────────── */
.avatar-uploader {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 0.5px solid #2e2e32;
  flex-shrink: 0;
}
:deep(.avatar-uploader .el-upload) {
  display: block;
  width: 100%;
  height: 100%;
}
:deep(.main-avatar) {
  width: 100% !important;
  height: 100% !important;
  background: #252528 !important;
  color: #6b7280 !important;
  font-size: 28px;
}
.avatar-hover-text {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 11px;
  text-align: center;
  padding: 5px 0;
  opacity: 0;
  transition: opacity 0.2s;
  line-height: 1;
}
.avatar-uploader:hover .avatar-hover-text { opacity: 1; }
</style>

<!-- 不带 scoped：穿透到 append-to-body 的弹窗（绑定 / 改密） -->
<style>
.el-overlay-dialog .el-dialog {
  /* 让 ProfileView 触发的弹窗也用暗色 */
  background: #1a1a1c !important;
}
.el-overlay-dialog .el-dialog__header {
  background: linear-gradient(180deg, #1e1e22 0%, #1a1a1c 100%) !important;
  border-bottom: 0.5px solid #2e2e32;
  padding: 14px 18px !important;
  margin: 0 !important;
}
.el-overlay-dialog .el-dialog__title { color: #e2e4e9 !important; font-size: 14px !important; }
.el-overlay-dialog .el-dialog__headerbtn .el-icon { color: #6b7280; }
.el-overlay-dialog .el-dialog__headerbtn:hover .el-icon { color: #fff; }
.el-overlay-dialog .el-dialog__body {
  background: #1a1a1c !important;
  padding: 20px 22px !important;
  color: #e2e4e9 !important;
}
.el-overlay-dialog .el-dialog__footer {
  background: #1a1a1c !important;
  border-top: 0.5px solid #2e2e32;
  padding: 12px 18px !important;
}
.el-overlay-dialog .el-dialog .el-form-item__label { color: #9ca3af !important; font-size: 13px !important; }
.el-overlay-dialog .el-dialog .el-input__wrapper {
  background: #252528 !important;
  box-shadow: 0 0 0 1px #2e2e32 inset !important;
}
.el-overlay-dialog .el-dialog .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #6366f1 inset !important;
}
.el-overlay-dialog .el-dialog .el-input__inner { color: #e2e4e9 !important; }
.el-overlay-dialog .el-dialog .el-input__inner::placeholder { color: #4b5263 !important; }

.el-overlay-dialog .el-dialog .el-button {
  background: #252528 !important;
  border-color: #2e2e32 !important;
  color: #c9ccd6 !important;
}
.el-overlay-dialog .el-dialog .el-button:hover {
  background: #2e2e32 !important;
  color: #fff !important;
}
.el-overlay-dialog .el-dialog .el-button--primary {
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%) !important;
  border-color: #6366f1 !important;
  color: #fff !important;
}
.el-overlay-dialog .el-dialog .el-button--primary:hover { opacity: 0.9; }
</style>
