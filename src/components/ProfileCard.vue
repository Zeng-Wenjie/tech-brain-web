<template>
  <div class="profile-card">
    <div class="profile-header">
      <div class="username">{{ userInfo.name || userInfo.username || '未知用户' }}</div>
      <div class="level-tag">LV.{{ userInfo.level || 1 }}</div>
    </div>
    
    <div class="profile-menu">
      <div class="menu-item-link" @click="$emit('open-settings')">
        <i class="el-icon-user"></i> 个人中心
      </div>
      
      <div class="menu-item-link logout" @click="$emit('logout')">
        <i class="el-icon-right"></i> 退出登录
      </div>
    </div>
  </div>
</template>

<script setup>
// 接收父组件传过来的用户信息
defineProps({
  userInfo: {
    type: Object,
    // 💡 在这里加上 username 字段的默认值
    default: () => ({ name: '', username: '', avatar: '', level: 1 })
  }
})

// 定义点击事件，交给父组件处理具体逻辑
defineEmits(['logout', 'open-settings'])
</script>

<style scoped>
.profile-card {
  padding: 5px;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--tb-color-border);
  margin-bottom: 10px;
}

.username {
  font-weight: 600;
  font-size: 15px;
  color: var(--tb-color-text-primary);
}

.level-tag {
  font-size: 10px;
  background: #ff9900;
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
}

.profile-menu .menu-item-link {
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--tb-color-text-primary);
  transition: background 0.2s;
}

.profile-menu .menu-item-link:hover {
  background-color: var(--tb-color-bg-input);
}

.profile-menu .logout {
  color: #f56c6c;
  margin-top: 5px;
  font-weight: 500;
}
</style>