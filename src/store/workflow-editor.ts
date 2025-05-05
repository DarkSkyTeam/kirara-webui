import { ref, computed } from 'vue'
import type { BlockInstance, Wire, WorkflowConfig } from '@/api/workflow'
import type { BlockType } from '@/api/block'

// 定义意图（Intent）
export interface WorkflowEditorIntent {
  initialize: (data: {
    blocks: BlockInstance[]
    wires: Wire[]
    blockTypes: BlockType[]
    name?: string
    description?: string
    workflowId?: string
    config: WorkflowConfig
  }) => void
  updateBlocks: (blocks: BlockInstance[]) => void
  updateWires: (wires: Wire[]) => void
  updateName: (name: string) => void
  updateDescription: (description: string) => void
  updateWorkflowId: (workflowId: string) => void
  saveToHistory: () => void
  undo: () => void
  redo: () => void
  reset: () => void
}

// 定义视图状态（ViewState）
export interface WorkflowEditorViewState {
  blocks: BlockInstance[]
  wires: Wire[]
  blockTypes: BlockType[]
  name: string
  description: string
  workflowId: string
  config: WorkflowConfig
  canUndo: boolean
  canRedo: boolean
  hasClipboard: boolean
  skipSavingHistory: boolean
}

// 定义模型（Model）
interface HistoryState {
  blocks: BlockInstance[]
  wires: Wire[]
  name: string
  description: string
  workflowId: string
}

class WorkflowEditorModel {
  private state = ref({
    blocks: [] as BlockInstance[],
    wires: [] as Wire[],
    blockTypes: [] as BlockType[],
    name: '',
    description: '',
    workflowId: '',
    undoStack: [] as HistoryState[],
    redoStack: [] as HistoryState[],
    clipboard: null as any,
    config: {
      max_execution_time: 0
    }
  })

  // 新增：是否跳过保存历史记录的标志
  private skipSavingHistory = ref(false)

  // 计算属性
  private readonly viewState = computed<WorkflowEditorViewState>(() => ({
    blocks: this.state.value.blocks,
    wires: this.state.value.wires,
    blockTypes: this.state.value.blockTypes,
    name: this.state.value.name,
    description: this.state.value.description,
    workflowId: this.state.value.workflowId,
    canUndo: this.state.value.undoStack.length > 0,
    canRedo: this.state.value.redoStack.length > 0,
    hasClipboard: this.state.value.clipboard !== null,
    skipSavingHistory: this.skipSavingHistory.value,
    config: this.state.value.config
  }))

  // 新增：执行操作但不保存历史记录的高阶函数
  performActionWithoutHistory(action: () => void) {
    this.skipSavingHistory.value = true
    try {
      action()
    } finally {
      this.skipSavingHistory.value = false
    }
  }

  // 提取：保存当前状态到 undo 栈
  private pushToUndoStack() {
    const currentState: HistoryState = {
      blocks: [...this.state.value.blocks],
      wires: [...this.state.value.wires],
      name: this.state.value.name,
      description: this.state.value.description,
      workflowId: this.state.value.workflowId
    }
    this.state.value.undoStack.push(currentState)
    this.state.value.redoStack = []
  }

  // 提取：保存当前状态到 redo 栈
  private pushToRedoStack() {
    const currentState: HistoryState = {
      blocks: [...this.state.value.blocks],
      wires: [...this.state.value.wires],
      name: this.state.value.name,
      description: this.state.value.description,
      workflowId: this.state.value.workflowId
    }
    this.state.value.redoStack.push(currentState)
  }

  // 提取：恢复状态
  private restoreState(state: HistoryState) {
    Object.assign(this.state.value, {
      blocks: state.blocks,
      wires: state.wires,
      name: state.name,
      description: state.description,
      workflowId: state.workflowId
    })
  }

  // Intent 处理方法
  private readonly intent: WorkflowEditorIntent = {
    initialize: (data) => {
      // 使用 performActionWithoutHistory 包裹
      this.performActionWithoutHistory(() => {
        Object.assign(this.state.value, {
          blocks: data.blocks,
          wires: data.wires,
          blockTypes: data.blockTypes,
          name: data.name || '',
          description: data.description || '',
          workflowId: data.workflowId || '',
          config: data.config || {}
        })
      })
    },

    updateBlocks: (blocks) => {
      this.state.value.blocks = blocks
    },

    updateWires: (wires) => {
      this.state.value.wires = wires
    },

    updateName: (name) => {
      this.state.value.name = name
    },

    updateDescription: (description) => {
      this.state.value.description = description
    },

    updateWorkflowId: (workflowId) => {
      this.state.value.workflowId = workflowId
    },

    saveToHistory: () => {
      // 只有在 skipSavingHistory 为 false 时才保存历史记录
      if (this.skipSavingHistory.value) return
      this.pushToUndoStack()
    },

    undo: () => {
      if (this.state.value.undoStack.length === 0) return

      this.pushToRedoStack()
      const prevState = this.state.value.undoStack.pop()!
      this.restoreState(prevState)
    },

    redo: () => {
      if (this.state.value.redoStack.length === 0) return

      this.pushToUndoStack()
      const nextState = this.state.value.redoStack.pop()!
      this.restoreState(nextState)
    },

    reset: () => {
      this.intent.saveToHistory()
      this.state.value.blocks = []
      this.state.value.wires = []
    }
  }

  getViewState() {
    return this.viewState
  }

  getIntent() {
    return this.intent
  }
}

// 创建单例实例
export const workflowEditorModel = new WorkflowEditorModel()
