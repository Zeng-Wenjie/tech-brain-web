<template>
  <div class="tb-app">

    <!-- ═══════════════ 左侧导航栏 ═══════════════ -->
    <aside class="tb-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- Logo + 折叠按钮 -->
      <div class="sidebar-logo">
        <div class="logo-home" title="返回主页" @click="goHome">
          <div class="logo-icon"><span>TB</span></div>
          <span class="logo-text" v-show="!sidebarCollapsed">Tech-Brain</span>
        </div>
        <el-icon
          class="sidebar-toggle"
          :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
          @click="toggleSidebar"
        >
          <Fold v-if="!sidebarCollapsed" />
          <Expand v-else />
        </el-icon>
      </div>

      <!-- 新对话 -->
      <div class="new-chat-btn" :title="sidebarCollapsed ? '新对话' : ''" @click="startNewConversation">
        <el-icon><EditPen /></el-icon>
        <span v-show="!sidebarCollapsed">新对话</span>
      </div>

      <!-- 对话历史 -->
      <template v-if="!sidebarCollapsed">
        <div class="sidebar-section-label">最近对话</div>
        <div class="conv-list" v-if="conversations.length">
          <div
            v-for="conv in conversations"
            :key="conv.id"
            class="conv-item"
            :class="{ active: conv.id === currentConversationId }"
            @click="loadConversation(conv.id)"
            :title="conv.title || '新会话'"
          >
            <span class="conv-item-title">{{ conv.title || '新会话' }}</span>
            <span class="conv-item-del" @click.stop="deleteConversation(conv.id)">✕</span>
          </div>
        </div>
        <div v-else class="conv-empty">暂无对话记录</div>
      </template>
      <!-- 折叠时占位，把功能区推到下方 -->
      <div v-else class="conv-list-spacer"></div>

      <!-- 功能入口 -->
      <div class="sidebar-divider"></div>
      <div class="sidebar-section-label" v-show="!sidebarCollapsed">功能</div>

      <div
        class="nav-item"
        :class="{ active: currentView === 'notes' }"
        :title="sidebarCollapsed ? '知识笔记' : ''"
        @click="currentView = 'notes'"
      >
        <el-icon><Notebook /></el-icon>
        <span v-show="!sidebarCollapsed">知识笔记</span>
        <span class="nav-badge" v-if="notesTotal > 0 && !sidebarCollapsed">{{ notesTotal }}</span>
      </div>

      <div
        class="nav-item"
        :class="{ active: currentView === 'tool-log' }"
        :title="sidebarCollapsed ? '工具调用日志' : ''"
        @click="currentView = 'tool-log'"
      >
        <el-icon><Tickets /></el-icon>
        <span v-show="!sidebarCollapsed">工具调用日志</span>
      </div>

      <div
        class="nav-item"
        :class="{ active: currentView === 'files' }"
        :title="sidebarCollapsed ? '文件管理' : ''"
        @click="currentView = 'files'"
      >
        <el-icon><Folder /></el-icon>
        <span v-show="!sidebarCollapsed">文件管理</span>
      </div>

      <div class="nav-item disabled" :title="sidebarCollapsed ? '数据分析（即将上线）' : '即将上线'">
        <el-icon><TrendCharts /></el-icon>
        <span v-show="!sidebarCollapsed">数据分析</span>
        <span class="nav-soon" v-show="!sidebarCollapsed">即将上线</span>
      </div>

      <div class="nav-item disabled" :title="sidebarCollapsed ? '学习统计（即将上线）' : '即将上线'">
        <el-icon><DataAnalysis /></el-icon>
        <span v-show="!sidebarCollapsed">学习统计</span>
        <span class="nav-soon" v-show="!sidebarCollapsed">即将上线</span>
      </div>

      <!-- 底部用户区 -->
      <div class="sidebar-bottom">
        <template v-if="isLoggedIn">
          <el-popover placement="top-start" :width="200" trigger="click" popper-class="tb-profile-popper">
            <template #reference>
              <div class="user-area" :title="sidebarCollapsed ? (userInfo.name || userInfo.username) : ''">
                <el-avatar :size="28" :src="userInfo.avatar" class="user-avatar">
                  {{ (userInfo.name || userInfo.username || 'U').charAt(0).toUpperCase() }}
                </el-avatar>
                <div class="user-info" v-show="!sidebarCollapsed">
                  <div class="user-name">{{ userInfo.name || userInfo.username }}</div>
                  <div class="user-sub">个人中心 / 设置</div>
                </div>
                <el-icon class="user-more" v-show="!sidebarCollapsed"><MoreFilled /></el-icon>
              </div>
            </template>
            <div class="profile-pop">
              <div class="profile-pop-name">{{ userInfo.name || userInfo.username }}</div>
              <div class="profile-pop-item" @click="goToProfile">
                <el-icon><UserFilled /></el-icon> 个人中心
              </div>
              <div class="profile-pop-item logout" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon> 退出登录
              </div>
            </div>
          </el-popover>
        </template>
        <template v-else>
          <div class="user-area guest" :title="sidebarCollapsed ? '点击登录' : ''" @click="loginModalVisible = true">
            <div class="user-avatar-guest"><el-icon><User /></el-icon></div>
            <div class="user-info" v-show="!sidebarCollapsed">
              <div class="user-name">未登录</div>
              <div class="user-sub">点击登录 / 注册</div>
            </div>
          </div>
        </template>
      </div>
    </aside>

    <!-- ═══════════════ 主内容区 ═══════════════ -->
    <main class="tb-main">

      <!-- ─── HOME 视图 ─── -->
      <div v-if="currentView === 'home'" class="view-home">
        <div class="home-center">
          <div class="home-greeting">你好，欢迎来到 Tech-Brain</div>
          <div class="home-sub">你的专属 AI 技术知识助理，开始你的第一个对话吧</div>
          <div class="home-prompts-header">
            <span class="home-prompts-label">猜你想问</span>
            <span class="home-prompts-refresh" @click="refreshPrompts">
              <el-icon><RefreshRight /></el-icon>
              换一批
            </span>
          </div>
          <div class="home-prompts">
            <div
              v-for="p in quickPrompts"
              :key="p.text"
              class="prompt-card"
              @click="usePrompt(p.text)"
            >
              <div class="prompt-title">{{ p.text }}</div>
              <div class="prompt-tag">{{ p.tag }}</div>
            </div>
          </div>
          <div class="home-input-wrap">
            <textarea
              ref="homeTextareaRef"
              v-model="userInput"
              class="home-textarea"
              placeholder="有什么想问的，直接说..."
              rows="1"
              @input="adjustHomeHeight"
              @keydown.enter.exact.prevent="handleSend"
            ></textarea>
            <button class="home-send-btn" @click="handleSend">
              <el-icon><Promotion /></el-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- ─── CHAT 视图 ─── -->
      <div v-else-if="currentView === 'chat'" class="view-chat">
        <div class="chat-header">
          <span class="chat-title">{{ currentChatTitle }}</span>
          <div class="chat-header-actions">
            <el-icon class="hdr-icon"><Share /></el-icon>
            <el-icon class="hdr-icon"><MoreFilled /></el-icon>
          </div>
        </div>

        <div class="chat-body" ref="chatBodyRef">
          <div v-for="(msg, idx) in messages" :key="idx" class="msg-row" :class="msg.role">
            <template v-if="msg.role === 'ai'">
              <div class="ai-avatar">TB</div>
              <div class="ai-bubble">
                <div class="ai-content markdown-body" v-html="parseMarkdown(msg.content)"></div>
                <div class="ai-actions" v-if="idx > 0">
                  <button class="ai-action-btn" @click="handleSaveAiMsg(msg.content)">
                    <el-icon><Notebook /></el-icon> 保存笔记
                  </button>
                  <button class="ai-action-btn" @click="copyText(msg.content)">
                    <el-icon><CopyDocument /></el-icon> 复制
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="user-bubble">{{ msg.content }}</div>
            </template>
          </div>
        </div>

        <div class="chat-input-dock">
          <div class="chat-input-wrap">
            <textarea
              ref="chatTextareaRef"
              v-model="userInput"
              class="chat-textarea"
              placeholder="继续向 Tech-Brain 提问..."
              rows="1"
              @input="adjustChatHeight"
              @keydown.enter.exact.prevent="handleSend"
            ></textarea>
            <button class="chat-send-btn" :disabled="isLoading" @click="handleSend">
              <el-icon><Promotion /></el-icon>
            </button>
          </div>
          <div class="chat-footer-tip">Tech-Brain · RAG 增强模式</div>
        </div>
      </div>

      <!-- ─── NOTES 视图 ─── -->
      <div v-else-if="currentView === 'notes'" class="view-notes">
        <div class="notes-topbar">
          <div class="notes-topbar-left">
            <span class="notes-topbar-title">知识笔记</span>
            <span class="notes-topbar-count" v-if="notesTotal > 0">{{ notesTotal }}</span>
          </div>
          <div class="notes-topbar-right">
            <template v-if="notesViewRef && !notesViewRef.isManageMode">
              <span class="topbar-btn primary" @click="triggerAddNote">+ 新建</span>
              <span class="topbar-btn" @click="notesViewRef.toggleManageMode()">编辑</span>
            </template>
            <template v-else-if="notesViewRef && notesViewRef.isManageMode">
              <span class="topbar-btn" @click="notesViewRef.toggleManageMode()">取消</span>
              <span class="topbar-btn danger" @click="notesViewRef.batchDeleteNotes()">
                删除 ({{ notesViewRef.selectedIds.length }})
              </span>
            </template>
          </div>
        </div>
        <NotesView ref="notesViewRef" @total-change="notesTotal = $event" />
      </div>

      <!-- ─── 工具调用日志视图 ─── -->
      <div v-else-if="currentView === 'tool-log'" class="view-tool-log">
        <div class="notes-topbar">
          <div class="notes-topbar-left">
            <span class="notes-topbar-title">工具调用日志</span>
          </div>
        </div>
        <ToolCallLogView />
      </div>

      <!-- ─── 文件管理视图 ─── -->
      <div v-else-if="currentView === 'files'" class="view-tool-log">
        <div class="notes-topbar">
          <div class="notes-topbar-left">
            <span class="notes-topbar-title">文件管理</span>
          </div>
        </div>
        <UserFileView />
      </div>

    </main>

    <!-- ═══════════════ AI 总结弹窗 ═══════════════ -->
    <el-dialog
      v-model="summaryDialogVisible"
      width="640px"
      :append-to-body="true"
      :show-close="false"
      class="tb-summary-dialog"
      @opened="onDialogOpen"
      @close="onSummaryDialogClose"
    >
      <template #header>
        <div class="summary-header">
          <div class="summary-header-left">
            <div class="summary-badge">
              <el-icon><MagicStick /></el-icon>
            </div>
            <div class="summary-titles">
              <div class="summary-title">AI 总结</div>
              <div class="summary-subtitle">
                {{ summarySourceName ? `来自《${summarySourceName}》` : 'AI 工具自动总结' }}
              </div>
            </div>
          </div>
          <el-icon class="summary-close" @click="onSummaryDialogClose"><Close /></el-icon>
        </div>
      </template>

      <div v-if="summaryLoading" class="summary-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>AI 正在总结中...</span>
      </div>
      <div v-else class="summary-content markdown-body" v-html="parseMarkdown(summaryContent)"></div>

      <template #footer>
        <div class="summary-footer">
          <span class="summary-count" v-if="!summaryLoading && summaryContent">
            {{ summaryContent.length }} 字
          </span>
          <span class="summary-footer-spacer"></span>
          <el-button @click="onSummaryDialogClose">关闭</el-button>
          <el-button :disabled="!summaryContent || summaryLoading" @click="copySummaryFromChat">
            <el-icon><CopyDocument /></el-icon>
            <span style="margin-left: 4px;">复制</span>
          </el-button>
          <el-button
            type="primary"
            :disabled="!summaryContent || summaryLoading || summarySaving"
            :loading="summarySaving"
            @click="saveSummaryAsNoteFromChat"
          >
            <el-icon v-if="!summarySaving"><DocumentAdd /></el-icon>
            <span style="margin-left: 4px;">保存为新笔记</span>
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══════════════ 登录弹窗 ═══════════════ -->
    <LoginModal v-model:visible="loginModalVisible" @success="onLoginSuccess" />

  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue'
import {
  EditPen, Notebook, TrendCharts, DataAnalysis, User, UserFilled,
  MoreFilled, SwitchButton, Promotion, Share, CopyDocument, Loading,
  Expand, Fold, RefreshRight, MagicStick, DocumentAdd, Close, Tickets, Folder
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import request from '@/utils/request'
import { makeAllDialogsDraggable } from '@/utils/draggable'
import NotesView from './NotesView.vue'
import ToolCallLogView from './ToolCallLogView.vue'
import UserFileView from './UserFileView.vue'
import LoginModal from '@/components/LoginModal.vue'

const router = useRouter()

// ─── 视图状态 ───────────────────────────────────────────
const currentView = ref('home') // 'home' | 'chat' | 'notes'
const sidebarCollapsed = ref(localStorage.getItem('tb:sidebar-collapsed') === '1')
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('tb:sidebar-collapsed', sidebarCollapsed.value ? '1' : '0')
}
function goHome() {
  currentView.value = 'home'
  currentConversationId.value = null
}

// ─── 用户信息 ───────────────────────────────────────────
const userInfo = ref({ name: '', username: '', avatar: '', level: 1 })
const isLoggedIn = computed(() => !!localStorage.getItem('token'))
const loginModalVisible = ref(false)

// ─── 笔记总数（由 NotesView emit） ───────────────────────
const notesTotal = ref(0)
const notesViewRef = ref(null)

// ─── 对话状态 ───────────────────────────────────────────
const currentConversationId = ref(null)
const conversations = ref([])
const messages = ref([])
const userInput = ref('')
const isLoading = ref(false)
const chatBodyRef = ref(null)
const chatTextareaRef = ref(null)
const homeTextareaRef = ref(null)

const WELCOME_MSG = { role: 'ai', content: '### 欢迎回来！\n\n我是你的专属助理 **02**，有什么可以帮你的？' }

const currentChatTitle = computed(() => {
  if (!currentConversationId.value) return '新对话'
  const c = conversations.value.find(c => c.id === currentConversationId.value)
  return c?.title || '新对话'
})

// ─── 快捷 Prompt ───────────────────────────────────────
const PROMPT_POOL = [
  // ── Java 基础 ─────────────────────────────────
  { text: '说说 == 和 equals 的区别，String 为什么重写 equals', tag: 'Java 基础' },
  { text: 'final、finally、finalize 三者的区别', tag: 'Java 基础' },
  { text: '深拷贝和浅拷贝的区别，怎么实现深拷贝', tag: 'Java 基础' },
  { text: '为什么 String 是不可变的，有什么好处', tag: 'Java 基础' },
  { text: 'StringBuilder 和 StringBuffer 的区别', tag: 'Java 基础' },
  { text: '接口和抽象类的区别，什么时候用哪个', tag: 'Java 基础' },
  { text: '泛型擦除是什么，为什么 List<Integer> 不能转 List<Object>', tag: 'Java 基础' },
  { text: '反射的原理和应用场景，有什么性能问题', tag: 'Java 基础' },
  { text: '动态代理 JDK Proxy 和 CGLIB 的区别', tag: 'Java 基础' },
  { text: '说说 Java 异常体系，受检异常和非受检异常', tag: 'Java 基础' },

  // ── 集合源码 ──────────────────────────────────
  { text: '为什么 HashMap 在 Java 8 引入红黑树', tag: '集合源码' },
  { text: 'HashMap 的扩容机制和扩容为什么是 2 倍', tag: '集合源码' },
  { text: 'ConcurrentHashMap 1.7 和 1.8 的区别', tag: '集合源码' },
  { text: 'HashMap 和 Hashtable 的区别', tag: '集合源码' },
  { text: '对比 ArrayList 和 LinkedList 的底层差异', tag: '集合源码' },
  { text: 'ArrayList 扩容机制详解', tag: '集合源码' },
  { text: 'CopyOnWriteArrayList 的原理和适用场景', tag: '集合源码' },
  { text: 'TreeMap 底层红黑树的实现思路', tag: '集合源码' },
  { text: 'LinkedHashMap 怎么实现 LRU 缓存', tag: '集合源码' },
  { text: 'fail-fast 和 fail-safe 机制的区别', tag: '集合源码' },

  // ── 并发编程 ──────────────────────────────────
  { text: 'ThreadLocal 的实现原理和内存泄漏问题', tag: '并发编程' },
  { text: 'Synchronized 和 ReentrantLock 怎么选', tag: '并发编程' },
  { text: 'volatile 关键字的作用和实现原理', tag: '并发编程' },
  { text: 'AQS 原理详解，谁基于它实现的', tag: '并发编程' },
  { text: 'CAS 是什么，怎么解决 ABA 问题', tag: '并发编程' },
  { text: 'Synchronized 的锁升级过程', tag: '并发编程' },
  { text: 'ThreadPoolExecutor 的核心参数和工作流程', tag: '并发编程' },
  { text: '线程池拒绝策略有哪些，怎么自定义', tag: '并发编程' },
  { text: 'CountDownLatch、CyclicBarrier、Semaphore 的区别', tag: '并发编程' },
  { text: 'Java 内存模型 JMM 和 happens-before 规则', tag: '并发编程' },
  { text: 'CompletableFuture 怎么实现异步编排', tag: '并发编程' },
  { text: '死锁的 4 个必要条件，怎么避免和排查', tag: '并发编程' },
  { text: '聊聊 ForkJoinPool 和工作窃取算法', tag: '并发编程' },

  // ── JVM ──────────────────────────────────────
  { text: '聊聊 JVM 的垃圾回收算法和收集器', tag: 'JVM' },
  { text: 'JVM 内存结构分区，每个区放什么', tag: 'JVM' },
  { text: '类加载过程的 5 个阶段', tag: 'JVM' },
  { text: '双亲委派模型，怎么打破它', tag: 'JVM' },
  { text: 'CMS 和 G1 收集器的对比', tag: 'JVM' },
  { text: 'ZGC 的低延迟是怎么做到的', tag: 'JVM' },
  { text: '什么是 GC Root，可达性分析详解', tag: 'JVM' },
  { text: 'Full GC 触发的几种场景', tag: 'JVM' },
  { text: '常用的 JVM 调优参数有哪些', tag: 'JVM' },
  { text: '逃逸分析和栈上分配的原理', tag: 'JVM' },
  { text: '出 5 道 JVM 面试题并给出答案', tag: 'JVM' },

  // ── Spring / Spring Boot ──────────────────────
  { text: '帮我总结 Spring Boot 自动装配原理', tag: 'Spring' },
  { text: 'Spring Bean 的生命周期', tag: 'Spring' },
  { text: 'Spring IOC 和 DI 是什么关系', tag: 'Spring' },
  { text: '讲讲 Spring 事务传播行为的 7 种类型', tag: 'Spring' },
  { text: 'Spring 事务什么情况下会失效', tag: 'Spring' },
  { text: 'Spring AOP 的实现原理和使用场景', tag: 'Spring' },
  { text: 'Spring 怎么解决循环依赖，三级缓存', tag: 'Spring' },
  { text: 'Spring Boot Starter 的工作原理', tag: 'Spring' },
  { text: '@Resource 和 @Autowired 的区别', tag: 'Spring' },
  { text: 'Spring MVC 一次请求的处理流程', tag: 'Spring' },
  { text: 'Bean 的作用域有哪几种', tag: 'Spring' },
  { text: 'BeanFactory 和 FactoryBean 的区别', tag: 'Spring' },

  // ── Spring Cloud ──────────────────────────────
  { text: 'Spring Cloud 五大核心组件分别是什么', tag: 'Spring Cloud' },
  { text: 'Eureka 和 Nacos 注册中心的区别', tag: 'Spring Cloud' },
  { text: 'Nacos 的 AP 和 CP 模式怎么切换', tag: 'Spring Cloud' },
  { text: 'OpenFeign 的工作原理和动态代理', tag: 'Spring Cloud' },
  { text: 'Ribbon 负载均衡策略有哪几种', tag: 'Spring Cloud' },
  { text: 'Hystrix 和 Sentinel 的区别', tag: 'Spring Cloud' },
  { text: '熔断、降级、限流的区别和实际场景', tag: 'Spring Cloud' },
  { text: 'Sentinel 流控规则和热点参数限流', tag: 'Spring Cloud' },
  { text: '聊聊 Spring Cloud Gateway 的过滤器链', tag: 'Spring Cloud' },
  { text: 'Gateway 和 Zuul 的区别', tag: 'Spring Cloud' },
  { text: 'Seata 的 AT、TCC、SAGA 模式对比', tag: 'Spring Cloud' },
  { text: '分布式事务有哪些解决方案', tag: 'Spring Cloud' },
  { text: '微服务架构下怎么做链路追踪', tag: 'Spring Cloud' },
  { text: 'Config Server 的配置热更新原理', tag: 'Spring Cloud' },
  { text: '分布式锁的三种实现：DB、Redis、ZK', tag: 'Spring Cloud' },

  // ── MySQL / SQL 优化 ──────────────────────────
  { text: '解释 MySQL 联合索引最左前缀原则', tag: 'SQL 优化' },
  { text: '什么情况下索引会失效', tag: 'SQL 优化' },
  { text: 'EXPLAIN 执行计划怎么看，关键字段含义', tag: 'SQL 优化' },
  { text: 'type 字段从 all 到 ref 各代表什么', tag: 'SQL 优化' },
  { text: '覆盖索引和回表是什么', tag: 'SQL 优化' },
  { text: '索引下推 ICP 的原理和作用', tag: 'SQL 优化' },
  { text: '什么是慢 SQL，怎么定位和优化', tag: 'SQL 优化' },
  { text: 'count(*)、count(1)、count(列) 谁更快', tag: 'SQL 优化' },
  { text: 'limit 深分页的优化方案', tag: 'SQL 优化' },
  { text: 'B+ 树和 B 树的区别，为什么 MySQL 用 B+ 树', tag: 'SQL 优化' },
  { text: '聚簇索引和非聚簇索引的区别', tag: 'SQL 优化' },
  { text: 'in、exists、join 三种关联查询的取舍', tag: 'SQL 优化' },
  { text: 'MySQL 怎么设计一张大表的字段类型', tag: 'SQL 优化' },
  { text: 'where 和 having 的执行顺序', tag: 'SQL 优化' },
  { text: 'union 和 union all 的区别', tag: 'SQL 优化' },
  { text: '分库分表的几种策略和热点问题', tag: 'SQL 优化' },
  { text: '一条 SQL 在 MySQL 里的完整执行流程', tag: 'SQL 优化' },

  // ── MySQL 原理 ───────────────────────────────
  { text: 'MySQL InnoDB 的 MVCC 是怎么实现的', tag: 'MySQL 原理' },
  { text: '事务的四种隔离级别和对应问题', tag: 'MySQL 原理' },
  { text: 'redo log、undo log、binlog 三者作用', tag: 'MySQL 原理' },
  { text: '两阶段提交是什么', tag: 'MySQL 原理' },
  { text: '聊聊 InnoDB 的行锁、间隙锁、临键锁', tag: 'MySQL 原理' },
  { text: 'RR 隔离级别下幻读真的解决了吗', tag: 'MySQL 原理' },
  { text: 'Buffer Pool 的工作原理和 LRU 改造', tag: 'MySQL 原理' },
  { text: 'MyISAM 和 InnoDB 的区别', tag: 'MySQL 原理' },
  { text: 'MySQL 主从同步的实现机制', tag: 'MySQL 原理' },
  { text: 'MySQL 主从延迟怎么处理', tag: 'MySQL 原理' },

  // ── Redis ────────────────────────────────────
  { text: '讲解 Redis 缓存击穿、穿透、雪崩的方案', tag: 'Redis' },
  { text: 'Redis 持久化 RDB 和 AOF 怎么选', tag: 'Redis' },
  { text: 'Redis 的 5 种基本数据结构和底层实现', tag: 'Redis' },
  { text: 'Redis 为什么这么快', tag: 'Redis' },
  { text: 'Redis 单线程模型和 IO 多路复用', tag: 'Redis' },
  { text: 'Redis 的过期删除策略和内存淘汰策略', tag: 'Redis' },
  { text: 'Redis 主从复制原理', tag: 'Redis' },
  { text: 'Redis 哨兵和 Cluster 集群的区别', tag: 'Redis' },
  { text: 'Redis 怎么实现分布式锁，Redisson 怎么做', tag: 'Redis' },
  { text: 'Redis 大 key 问题怎么排查和处理', tag: 'Redis' },
  { text: '缓存一致性的几种保证方案', tag: 'Redis' },
  { text: 'Redis Stream 和消息队列对比', tag: 'Redis' },

  // ── 消息队列 ──────────────────────────────────
  { text: 'Kafka 怎么保证消息不丢失、不重复', tag: '消息队列' },
  { text: 'Kafka 高吞吐量的秘密：零拷贝、批量、分区', tag: '消息队列' },
  { text: 'RabbitMQ 和 Kafka 的应用场景对比', tag: '消息队列' },
  { text: '消息队列怎么保证顺序消费', tag: '消息队列' },
  { text: 'RocketMQ 的事务消息怎么实现', tag: '消息队列' },
  { text: '消息积压了怎么处理', tag: '消息队列' },

  // ── 分布式 / 系统设计 ─────────────────────────
  { text: '什么是 CAP 理论？BASE 又是什么', tag: '分布式' },
  { text: '一致性 hash 算法和虚拟节点', tag: '分布式' },
  { text: '雪花算法 Snowflake 的实现原理', tag: '分布式' },
  { text: '设计一个秒杀系统需要考虑哪些点', tag: '系统设计' },
  { text: '设计一个短链系统', tag: '系统设计' },
  { text: '设计一个排行榜系统', tag: '系统设计' },
  { text: '设计一个分布式 ID 生成器', tag: '系统设计' },

  // ── 计算机基础 ────────────────────────────────
  { text: '讲解 TCP 三次握手和四次挥手', tag: '计算机网络' },
  { text: 'TCP 和 UDP 的区别，分别用在哪', tag: '计算机网络' },
  { text: 'HTTP 和 HTTPS 的区别，SSL 握手过程', tag: '计算机网络' },
  { text: 'HTTP/1.1、HTTP/2、HTTP/3 的演进', tag: '计算机网络' },
  { text: '从输入 URL 到页面渲染发生了什么', tag: '计算机网络' },

  // ── 线上排查 / 实战 ──────────────────────────
  { text: '怎么排查线上 CPU 飙高的问题', tag: '线上排查' },
  { text: '怎么排查 OOM 异常', tag: '线上排查' },
  { text: '线上接口慢，从哪几个层面排查', tag: '线上排查' },
  { text: 'Arthas 常用命令场景', tag: '线上排查' },
  { text: '内存泄漏和内存溢出的区别', tag: '线上排查' },

  // ── 安全 / 其他 ───────────────────────────────
  { text: 'OAuth2 四种授权模式分别用在什么场景', tag: '安全认证' },
  { text: 'JWT 的结构和无状态认证流程', tag: '安全认证' },
  { text: '怎么防御 XSS、CSRF、SQL 注入', tag: '安全认证' },
  { text: '面试官问我 Docker 和虚拟机的区别', tag: '面试辅助' },
  { text: 'MyBatis 一级缓存和二级缓存的区别', tag: '持久层' },
  { text: 'MyBatis 的 #{} 和 ${} 区别', tag: '持久层' }
]

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const quickPrompts = ref(shuffle(PROMPT_POOL).slice(0, 4))
function refreshPrompts() {
  quickPrompts.value = shuffle(PROMPT_POOL).slice(0, 4)
}

function usePrompt(text) {
  userInput.value = text
  handleSend()
}

// ─── 弹窗拖动（统一对所有打开的 el-dialog 绑定，工具内部有去重保护） ───
function onDialogOpen() {
  nextTick(() => makeAllDialogsDraggable())
}

// ─── 用户相关 ──────────────────────────────────────────
async function loadUserInfo() {
  if (!localStorage.getItem('token')) return
  try {
    const res = await request.get('/info')
    if (res.code === 200 && res.data) userInfo.value = res.data
  } catch { /* ignore */ }
}

function onLoginSuccess(data) {
  userInfo.value = data
  loadUserInfo()
  fetchConversations()
}

function handleLogout() {
  localStorage.removeItem('token')
  userInfo.value = { name: '', username: '', avatar: '', level: 1 }
  currentConversationId.value = null
  conversations.value = []
  messages.value = []
  currentView.value = 'home'
  ElMessage.success('已退出登录')
}

function goToProfile() {
  router.push('/profile')
}

// ─── 全局登录事件监听 ────────────────────────────────────
function onRequireLogin() {
  loginModalVisible.value = true
}

// ─── 对话管理 ──────────────────────────────────────────
async function fetchConversations() {
  if (!localStorage.getItem('token')) return
  try {
    const res = await request.get('/conversation/list')
    if (res.code === 200 && res.data) conversations.value = res.data
  } catch { /* ignore */ }
}

async function loadConversation(id) {
  if (id === currentConversationId.value) {
    currentView.value = 'chat'
    return
  }
  currentConversationId.value = id
  currentView.value = 'chat'
  try {
    const res = await request.get(`/conversation/${id}/messages`)
    if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
      messages.value = [
        { ...WELCOME_MSG },
        ...res.data.map(m => ({ role: m.role === 'assistant' ? 'ai' : 'user', content: m.content }))
      ]
    } else {
      messages.value = [{ ...WELCOME_MSG }]
    }
  } catch {
    messages.value = [{ ...WELCOME_MSG }]
  }
  await scrollToBottom()
}

function startNewConversation() {
  currentConversationId.value = null
  messages.value = [{ ...WELCOME_MSG }]
  userInput.value = ''
  currentView.value = 'chat'
}

async function deleteConversation(id) {
  try {
    await ElMessageBox.confirm('确定删除该会话吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch { return }
  try {
    await request.delete(`/conversation/${id}`)
    if (id === currentConversationId.value) {
      currentConversationId.value = null
      messages.value = [{ ...WELCOME_MSG }]
      currentView.value = 'home'
    }
    await fetchConversations()
    ElMessage.success('会话已删除')
  } catch {
    ElMessage.error('删除失败')
  }
}

// ─── 发送消息 ──────────────────────────────────────────
async function handleSend() {
  const text = userInput.value.trim()
  if (!text || isLoading.value) return

  if (!localStorage.getItem('token')) {
    loginModalVisible.value = true
    return
  }

  // 切换到 chat 视图
  if (currentView.value !== 'chat') {
    currentView.value = 'chat'
    if (!messages.value.length) messages.value = [{ ...WELCOME_MSG }]
    await nextTick()
  }

  messages.value.push({ role: 'user', content: text })
  userInput.value = ''
  resetTextareaHeight()

  // 总结意图检测
  if (isSummaryIntent(text)) {
    pendingSummaryFromChat.value = true
    summaryDialogManuallyClosed.value = false
    summaryLoading.value = true
    summaryContent.value = ''
    summarySourceName.value = ''
    summaryDialogVisible.value = true
  }

  isLoading.value = true
  messages.value.push({ role: 'ai', content: '' })
  const aiMsg = messages.value[messages.value.length - 1]
  await scrollToBottom()

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': localStorage.getItem('token') || ''
      },
      body: JSON.stringify({ conversationId: currentConversationId.value, msg: text })
    })

    if (!response.ok || !response.body) {
      aiMsg.content = `请求失败：HTTP ${response.status}`
      isLoading.value = false
      clearPendingSummary()
      await scrollToBottom()
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      let currentEvent = ''
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          const raw = line.slice(5).trim()
          let parsed
          try { parsed = JSON.parse(raw) } catch { parsed = null }

          if (currentEvent === 'message') {
            aiMsg.content += parsed?.content ?? raw
            await scrollToBottom()
          } else if (currentEvent === 'done') {
            currentConversationId.value = parsed?.conversationId ?? raw
            await fetchConversations()
            isLoading.value = false
            if (pendingSummaryFromChat.value) {
              pendingSummaryFromChat.value = false
              summaryLoading.value = false
              summaryDialogVisible.value = false
              ElMessage.warning('未收到总结结果')
            }
          } else if (currentEvent === 'error') {
            aiMsg.content = `错误：${parsed?.message ?? raw}`
            isLoading.value = false
            clearPendingSummary()
          } else if (currentEvent === 'summary_result') {
            handleSummaryResult(raw)
          }
          currentEvent = ''
        }
      }
    }
  } catch (error) {
    aiMsg.content = `网络请求失败：${error.message}`
    clearPendingSummary()
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

// ─── 辅助函数 ──────────────────────────────────────────
function parseMarkdown(text) {
  if (!text) return ''
  return marked(text)
}

async function scrollToBottom() {
  await nextTick()
  if (chatBodyRef.value) chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
}

function adjustChatHeight() {
  nextTick(() => {
    const t = chatTextareaRef.value
    if (!t) return
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 160) + 'px'
  })
}

function adjustHomeHeight() {
  nextTick(() => {
    const t = homeTextareaRef.value
    if (!t) return
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 160) + 'px'
  })
}

function resetTextareaHeight() {
  nextTick(() => {
    const t = chatTextareaRef.value || homeTextareaRef.value
    if (t) t.style.height = 'auto'
  })
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

function handleSaveAiMsg(content) {
  currentView.value = 'notes'
  nextTick(() => notesViewRef.value?.openAddNote(content))
}

function triggerAddNote() {
  currentView.value = 'notes'
  nextTick(() => notesViewRef.value?.openAddNote())
}

// ─── AI 总结 ──────────────────────────────────────────
const summaryDialogVisible = ref(false)
const summaryLoading = ref(false)
const summarySourceName = ref('')
const summaryContent = ref('')
const summarySaving = ref(false)
const pendingSummaryFromChat = ref(false)
const summaryDialogManuallyClosed = ref(false)

async function saveSummaryAsNoteFromChat() {
  if (!summaryContent.value.trim()) return
  summarySaving.value = true
  const baseTitle = summarySourceName.value
    ? `${summarySourceName.value} - 总结`
    : 'AI 总结'
  const title = baseTitle.length > 30 ? baseTitle.slice(0, 30) : baseTitle
  try {
    const res = await request.post('/save-note', { title, content: summaryContent.value })
    if (res.code === 200 || res.code === 1) {
      ElMessage.success('总结已保存为新笔记')
      summaryDialogVisible.value = false
      if (notesViewRef.value) notesViewRef.value.fetchNotes?.()
      notesTotal.value = (notesTotal.value || 0) + 1
    } else {
      ElMessage.error(res.msg || res.message || '保存失败')
    }
  } catch {
    ElMessage.error('保存失败，接口异常')
  } finally {
    summarySaving.value = false
  }
}

const isSummaryIntent = (msg) => {
  const intentWords = ['总结', 'AI总结', '整理成要点', '提炼要点', '面试话术', '概括', '摘要']
  const targetWords = ['第', '篇', '文章', '笔记', 'note', 'article']
  return intentWords.some(k => msg.includes(k)) && targetWords.some(k => msg.includes(k))
}

function handleSummaryResult(raw) {
  let data
  try { data = JSON.parse(raw) } catch { return }
  if (data.type !== 'article_summary') return
  pendingSummaryFromChat.value = false
  if (!data.success) {
    summaryLoading.value = false
    summaryDialogVisible.value = false
    ElMessage.warning(data.chatMessage || '总结失败')
    return
  }
  summarySourceName.value = data.title || ''
  summaryContent.value = data.summary || ''
  summaryLoading.value = false
  if (!summaryDialogManuallyClosed.value) summaryDialogVisible.value = true
}

function onSummaryDialogClose() {
  if (summaryLoading.value) summaryDialogManuallyClosed.value = true
  summaryDialogVisible.value = false
}

function clearPendingSummary() {
  if (pendingSummaryFromChat.value) {
    pendingSummaryFromChat.value = false
    summaryLoading.value = false
    summaryDialogVisible.value = false
  }
}

async function copySummaryFromChat() {
  try {
    await navigator.clipboard.writeText(summaryContent.value)
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败')
  }
}

// ─── 主题（暗色，不再切换） ─────────────────────────────
onMounted(async () => {
  document.body.classList.remove('light')
  await loadUserInfo()
  await fetchConversations()
  window.addEventListener('tb:require-login', onRequireLogin)
})

onUnmounted(() => {
  window.removeEventListener('tb:require-login', onRequireLogin)
})
</script>

<style scoped>
/* ── 根布局 ─────────────────────────────────────── */
.tb-app {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #111113;
  color: #e2e4e9;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

/* ── 左侧导航栏 ─────────────────────────────────── */
.tb-sidebar {
  width: 224px;
  flex-shrink: 0;
  background: #171717;
  border-right: 0.5px solid #252525;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.22s ease;
}
.tb-sidebar.collapsed {
  width: 60px;
}

/* 折叠按钮 */
.sidebar-toggle {
  margin-left: auto;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.sidebar-toggle:hover { background: #252525; color: #e2e4e9; }
.tb-sidebar.collapsed .sidebar-toggle { margin-left: 0; }

/* 折叠态：图标居中、内边距收紧 */
.tb-sidebar.collapsed .sidebar-logo { justify-content: center; padding: 0 8px; gap: 0; }
.tb-sidebar.collapsed .new-chat-btn { margin: 0 8px 6px; padding: 0; }
.tb-sidebar.collapsed .nav-item { justify-content: center; padding: 8px 0; margin: 1px 8px; }
.tb-sidebar.collapsed .user-area { justify-content: center; padding: 7px 0; }
.tb-sidebar.collapsed .sidebar-bottom { padding: 8px; }
.tb-sidebar.collapsed .sidebar-divider { margin: 8px; }
.conv-list-spacer { flex: 1; }

.sidebar-logo {
  height: 54px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  flex-shrink: 0;
}
.logo-home {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 6px;
  margin: 0 -6px;
  border-radius: 8px;
  transition: background 0.15s;
}
.logo-home:hover { background: #222; }

.logo-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.logo-text {
  font-size: 14px;
  font-weight: 500;
  color: #ececec;
}

.new-chat-btn {
  margin: 0 10px 6px;
  background: #252525;
  border: 0.5px solid #2e2e2e;
  border-radius: 8px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #9ca3af;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.new-chat-btn:hover { background: #2e2e2e; color: #e2e4e9; }

.sidebar-section-label {
  font-size: 10px;
  color: #3a3d4a;
  padding: 4px 16px 3px;
  letter-spacing: 0.4px;
  flex-shrink: 0;
}

.conv-list {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 60px;
  max-height: 220px;
  padding: 0 6px;
}
.conv-list::-webkit-scrollbar { width: 3px; }
.conv-list::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 3px; }

.conv-item {
  display: flex;
  align-items: center;
  padding: 7px 10px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 12px;
  color: #5b6071;
  transition: background 0.15s, color 0.15s;
  gap: 6px;
}
.conv-item:hover { background: #1e1e22; color: #c9ccd6; }
.conv-item.active { background: rgba(99, 102, 241, 0.13); color: #d4d6e0; }
.conv-item-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv-item-del {
  flex-shrink: 0;
  font-size: 11px;
  color: transparent;
  border-radius: 3px;
  padding: 1px 3px;
  transition: color 0.15s;
}
.conv-item:hover .conv-item-del { color: #4b5263; }
.conv-item-del:hover { color: #f56c6c !important; }

.conv-empty {
  font-size: 11px;
  color: #2d2f3a;
  padding: 8px 16px;
}

.sidebar-divider {
  border-top: 0.5px solid #222;
  margin: 8px 10px;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 14px;
  border-radius: 7px;
  margin: 1px 6px;
  cursor: pointer;
  font-size: 13px;
  color: #c9ccd6;
  transition: background 0.15s;
}
.nav-item:hover { background: #1e1e22; }
.nav-item.active { background: rgba(99, 102, 241, 0.13); color: #a5b4fc; }
.nav-item.disabled { opacity: 0.42; cursor: default; }
.nav-item .el-icon { font-size: 15px; flex-shrink: 0; }

.nav-badge {
  margin-left: auto;
  font-size: 10px;
  background: #222;
  border: 0.5px solid #2e2e2e;
  border-radius: 10px;
  padding: 1px 6px;
  color: #4b5263;
}
.nav-soon {
  margin-left: auto;
  font-size: 9px;
  background: #1e1e22;
  border-radius: 10px;
  padding: 2px 6px;
  color: #3a3d4a;
  white-space: nowrap;
}

/* ── 底部用户区 ──────────────────────────────────── */
.sidebar-bottom {
  margin-top: auto;
  padding: 8px 10px;
  border-top: 0.5px solid #222;
  flex-shrink: 0;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: #222;
  transition: background 0.2s;
}
.user-area:hover { background: #2a2a2a; }
.user-area.guest .user-avatar-guest {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #252528;
  border: 0.5px solid #2e2e32;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5263;
  font-size: 14px;
}

.user-avatar {
  background: #6366f1 !important;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 12px; color: #c9ccd6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-sub { font-size: 10px; color: #3a3d4a; }
.user-more { color: #3a3d4a; font-size: 14px; }

/* profile popover */
:global(.tb-profile-popper) {
  background: #1e1e22 !important;
  border: 0.5px solid #2e2e32 !important;
  padding: 8px !important;
}
.profile-pop-name {
  font-size: 12px;
  font-weight: 500;
  color: #c9ccd6;
  padding: 4px 8px 10px;
  border-bottom: 0.5px solid #2e2e32;
  margin-bottom: 4px;
}
.profile-pop-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: #c9ccd6;
  cursor: pointer;
  transition: background 0.15s;
}
.profile-pop-item:hover { background: #252528; }
.profile-pop-item.logout { color: #f56c6c; margin-top: 2px; }

/* ── 主内容区 ───────────────────────────────────── */
.tb-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1a1a1c;
}

/* ── HOME 视图 ──────────────────────────────────── */
.view-home {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 40px 24px;
}

.home-center {
  width: 100%;
  max-width: 680px;
}

.home-greeting {
  font-size: 28px;
  font-weight: 500;
  color: #e2e4e9;
  text-align: center;
  margin-bottom: 8px;
}

.home-sub {
  font-size: 14px;
  color: #4b5263;
  text-align: center;
  margin-bottom: 32px;
}

.home-prompts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 2px;
}
.home-prompts-label {
  font-size: 12px;
  color: #4b5263;
  letter-spacing: 0.3px;
}
.home-prompts-refresh {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}
.home-prompts-refresh:hover { background: #252528; color: #a5b4fc; }
.home-prompts-refresh .el-icon { font-size: 13px; }

.home-prompts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.prompt-card {
  background: #252528;
  border: 0.5px solid #2e2e32;
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.prompt-card:hover { background: #2a2a2e; border-color: #6366f1; }
.prompt-title { font-size: 13px; color: #c9ccd6; line-height: 1.4; margin-bottom: 4px; }
.prompt-tag { font-size: 11px; color: #3a3d4a; }

.home-input-wrap {
  background: #252528;
  border: 0.5px solid #2e2e32;
  border-radius: 14px;
  display: flex;
  align-items: flex-end;
  padding: 12px 14px;
  gap: 10px;
  transition: border-color 0.2s;
}
.home-input-wrap:focus-within { border-color: #6366f1; }

.home-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  color: #e2e4e9;
  line-height: 1.5;
  min-height: 24px;
  max-height: 160px;
  overflow-y: auto;
}
.home-textarea::placeholder { color: #303034; }

.home-send-btn {
  width: 32px;
  height: 32px;
  background: #6366f1;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;
}
.home-send-btn:hover { opacity: 0.85; }

/* ── CHAT 视图 ──────────────────────────────────── */
.view-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  height: 52px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 0.5px solid #252525;
  flex-shrink: 0;
}
.chat-title { font-size: 13px; color: #4b5263; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat-header-actions { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
.hdr-icon { font-size: 18px; color: #3a3d4a; cursor: pointer; transition: color 0.2s; }
.hdr-icon:hover { color: #6b7280; }

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.chat-body::-webkit-scrollbar { width: 4px; }
.chat-body::-webkit-scrollbar-thumb { background: #2e2e32; border-radius: 4px; }

.msg-row { display: flex; width: 100%; max-width: 820px; }
.msg-row.user { justify-content: flex-end; }
.msg-row.ai { justify-content: flex-start; align-items: flex-start; gap: 12px; }

.ai-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  margin-top: 2px;
}

.ai-bubble { flex: 1; min-width: 0; }
.ai-content { font-size: 14px; color: #c8cad4; line-height: 1.7; }
.ai-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.ai-action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 0.5px solid #2e2e32;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: #4b5263;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.ai-action-btn:hover { color: #c9ccd6; border-color: #4b5263; }

.user-bubble {
  background: #252528;
  border: 0.5px solid #2e2e32;
  border-radius: 16px 16px 4px 16px;
  padding: 10px 14px;
  font-size: 14px;
  color: #e2e4e9;
  line-height: 1.6;
  max-width: 72%;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── CHAT 输入区 ─────────────────────────────────── */
.chat-input-dock {
  padding: 12px 20px 16px;
  flex-shrink: 0;
}
.chat-input-wrap {
  background: #252528;
  border: 0.5px solid #2e2e32;
  border-radius: 14px;
  display: flex;
  align-items: flex-end;
  padding: 12px 14px;
  gap: 10px;
  transition: border-color 0.2s;
  max-width: 820px;
  margin: 0 auto;
}
.chat-input-wrap:focus-within { border-color: #6366f1; }

.chat-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  color: #e2e4e9;
  line-height: 1.5;
  min-height: 24px;
  max-height: 160px;
  overflow-y: auto;
}
.chat-textarea::placeholder { color: #303034; }

.chat-send-btn {
  width: 32px;
  height: 32px;
  background: #6366f1;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;
}
.chat-send-btn:hover:not(:disabled) { opacity: 0.85; }
.chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.chat-footer-tip {
  text-align: center;
  font-size: 11px;
  color: #1e1e22;
  margin-top: 5px;
}

/* ── NOTES 视图 ─────────────────────────────────── */
.view-notes,
.view-tool-log {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notes-topbar {
  height: 52px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 0.5px solid #252525;
  flex-shrink: 0;
}
.notes-topbar-left { display: flex; align-items: center; gap: 10px; }
.notes-topbar-title { font-size: 14px; font-weight: 500; color: #e2e4e9; }
.notes-topbar-count {
  font-size: 11px;
  color: #3a3d4a;
  background: #222;
  border: 0.5px solid #2e2e2e;
  border-radius: 20px;
  padding: 1px 8px;
}
.notes-topbar-right { display: flex; align-items: center; gap: 10px; }
.topbar-btn {
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
}
.topbar-btn:hover { color: #c9ccd6; }
.topbar-btn.primary { color: #818cf8; font-weight: 500; }
.topbar-btn.primary:hover { color: #a5b4fc; }
.topbar-btn.danger { color: #f56c6c; font-weight: 500; }

/* ── Markdown 内容 ───────────────────────────────── */
:deep(.markdown-body p) { margin: 0 0 8px; }
:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3) { color: #e2e4e9; font-weight: 500; margin: 12px 0 6px; }
:deep(.markdown-body strong) { color: #a5b4fc; font-weight: 600; }
:deep(.markdown-body ul),
:deep(.markdown-body ol) { padding-left: 18px; margin: 4px 0 8px; }
:deep(.markdown-body li) { margin-bottom: 4px; color: #c8cad4; }
:deep(.markdown-body code) { background: #252528; border-radius: 4px; padding: 1px 5px; font-size: 12px; color: #e879f9; font-family: monospace; }
:deep(.markdown-body pre) { background: #252528; border-radius: 8px; padding: 12px 14px; overflow-x: auto; margin: 8px 0; }
:deep(.markdown-body pre code) { padding: 0; color: #c9ccd6; font-size: 13px; }
:deep(.markdown-body hr) { border: 0; border-top: 0.5px solid #2e2e32; margin: 12px 0; }

/* ── el-dialog 暗色适配 ────────────────────────────── */
:deep(.tb-dialog .el-dialog) {
  background: #1e1e22 !important;
  border: 0.5px solid #2e2e32;
  border-radius: 14px;
}
:deep(.tb-dialog .el-dialog__header) {
  background: #252528;
  border-bottom: 0.5px solid #2e2e32;
  padding: 14px 18px;
  cursor: move;
}
:deep(.tb-dialog .el-dialog__title) { color: #c9ccd6; font-size: 14px; }
:deep(.tb-dialog .el-dialog__headerbtn .el-icon) { color: #4b5263; }
:deep(.tb-dialog .el-dialog__body) { color: #c9ccd6; padding: 20px 20px 10px; }
:deep(.tb-dialog .el-dialog__footer) { border-top: 0.5px solid #2e2e32; padding: 12px 18px; }

.dialog-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  color: #4b5263;
  font-size: 14px;
}
.dialog-loading .el-icon { font-size: 28px; color: #6366f1; }

.summary-topic { font-size: 12px; color: #4b5263; margin-bottom: 10px; }
.summary-content {
  max-height: 440px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.8;
  color: #c9ccd6;
}
</style>
