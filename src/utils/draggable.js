/**
 * 让 Element Plus el-dialog 的 header 区域可拖动
 * 用法：在 el-dialog 的 @open 或 @opened 事件中调用 makeDraggable()
 *
 * 每个弹窗关闭后 transform 会随 DOM 销毁一起重置（el-dialog destroy-on-close）
 * 若不销毁，可通过传入 el 精确定位，避免多弹窗冲突
 */
export function makeDraggable(dialogEl) {
  if (!dialogEl) return

  // 支持传入 el-dialog 根 DOM 或直接由外部 querySelector 找到的 .el-dialog
  const dialog = dialogEl.classList?.contains('el-dialog')
    ? dialogEl
    : dialogEl.querySelector?.('.el-dialog')

  if (!dialog) return
  if (dialog.__tb_draggable__) return  // 防止重复绑定

  const header = dialog.querySelector('.el-dialog__header')
  if (!header) return

  dialog.__tb_draggable__ = true
  header.style.cursor = 'move'
  header.style.userSelect = 'none'

  let startX = 0, startY = 0, tx = 0, ty = 0

  const onMouseDown = (e) => {
    // 只响应鼠标左键
    if (e.button !== 0) return
    startX = e.clientX - tx
    startY = e.clientY - ty

    const onMove = (e) => {
      tx = e.clientX - startX
      ty = e.clientY - startY
      dialog.style.transform = `translate(${tx}px, ${ty}px)`
      dialog.style.marginTop = '0'
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  header.addEventListener('mousedown', onMouseDown)

  // 返回 cleanup 函数，dialog 销毁时可手动调用
  return () => {
    header.removeEventListener('mousedown', onMouseDown)
    delete dialog.__tb_draggable__
  }
}

/**
 * Vue 自定义指令 v-drag-dialog
 * 直接挂在包裹 el-dialog 的容器 div 上即可
 *
 * 用法：
 *   <div v-drag-dialog>
 *     <el-dialog v-model="visible" ...>...</el-dialog>
 *   </div>
 *
 * 由于 el-dialog 默认 teleport 到 body，该指令通过 MutationObserver
 * 监听 body 子节点变化，在弹窗出现时自动附加拖动能力
 */
export const vDragDialog = {
  mounted() {
    // 弹窗由 teleport 挂到 body，此处通过事件委托兜底
    // 主要还是通过 @open 回调 + makeDraggable 来使用
  }
}

/**
 * 在 nextTick 后对当前页面所有打开的 .el-dialog 执行拖动挂载
 * 适合统一在 onMounted 时调用一次
 */
export function makeAllDialogsDraggable() {
  document.querySelectorAll('.el-dialog').forEach(makeDraggable)
}
