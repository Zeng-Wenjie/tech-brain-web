<template>
  <div class="profile-layout-wrapper">
  <div class="profile-container">
    <div class="profile-aside">
      <div class="aside-title">个人中心</div>
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

      </div> </div> <el-dialog v-model="bindDialogVisible" :title="bindType === 'phone' ? '绑定手机号' : '绑定邮箱'" width="400px">
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

    <el-dialog v-model="passwordDialogVisible" title="修改登录密码" width="420px" @closed="resetPasswordForm">
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'



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
.profile-layout-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100vh;
  background-color: #f4f5f7 !important; /* B站经典的外部浅灰底色 */
  padding: 20px 0;
  box-sizing: border-box;
  z-index: 10; /* 盖住一切妖魔鬼怪 */
}


.profile-container {
  display: flex;
  max-width: 1100px;
  /*  注意：这里的 margin 改成 0 auto，上下留白由外层 wrapper 的 padding 负责 */
  margin: 0 auto; 
  background-color: #ffffff !important; 
  border-radius: 6px;
  min-height: 80vh;
  border: 1px solid #e5e9ef; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}


.profile-aside {
  width: 170px;
  border-right: 1px solid #e5e9ef;
  background-color: #fafbfc; 
  padding: 20px 0;
}

.aside-title {
  padding: 0 25px 20px;
  font-size: 16px;
  font-weight: bold;
  color: #99a2aa;
  border-bottom: 1px solid #e5e9ef;
  margin-bottom: 10px;
}

.profile-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}


.user-banner {
  padding: 30px 40px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e9ef;
  background-color: #ffffff;
}

.avatar-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.name-box {
  display: flex;
  align-items: center;
  height: 80px;
  margin-left: 10px;
}

/* 名字强制黑色 */
.full-name { 
  font-size: 22px; 
  font-weight: bold; 
  color: #222222 !important; 
}

/* 4. 内容表单区：强制白底黑字 */
.content-body {
  padding: 30px 40px;
  flex: 1;
  background-color: #ffffff;
}

.section-title {
  font-size: 18px;
  color: #222222;
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e9ef;
}

/* 强制覆盖 Element Plus 的默认表单文字颜色 */
:deep(.el-form-item__label) {
  color: #606266 !important;
}

:deep(.el-radio__label) {
  color: #606266 !important;
}

.security-item {
  display: flex;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #e5e9ef;
}
.sec-label { width: 100px; color: #606266; }
.sec-value { flex: 1; font-weight: 500; color: #222222; }

/* 头像上传容器的定位与裁切 */
.avatar-uploader {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden; /* 核心：超出圆圈的部分全部裁掉 */
  cursor: pointer;
}

/* 确保 el-upload 内部的触发区域撑满圆圈 */
:deep(.el-upload) {
  display: block;
  width: 100%;
  height: 100%;
}

/* 💡 重新找回：底部半透明文字条 */
.avatar-hover-text {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.6); /* 半透明黑底 */
  color: #fff;
  font-size: 11px;
  text-align: center;
  padding: 5px 0;
  opacity: 0; /* 默认完全透明(隐藏) */
  transition: opacity 0.3s; /* 平滑过渡动画 */
  line-height: 1;
}

/* 鼠标放上去时，文字条浮现 */
.avatar-uploader:hover .avatar-hover-text {
  opacity: 1; 
}
</style>
