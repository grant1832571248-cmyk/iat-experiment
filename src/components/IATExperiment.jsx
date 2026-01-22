import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Trash2, Users, X, LogOut, ArrowLeft, Eye, EyeOff, ChevronDown, ChevronUp, Check } from 'lucide-react'

// ==================== 刺激词配置 (硬编码 40 个词) ====================
const TARGET_A = ["保定", "唐山", "邯郸", "沧州", "邢台", "廊坊", "承德", "衡水", "定州", "正定"]
const TARGET_B = ["太原", "沈阳", "郑州", "济南", "西安", "合肥", "长春", "兰州", "银川", "西宁"]
const POSITIVE = ["快乐", "幸福", "美好", "成功", "优秀", "喜爱", "友善", "智慧", "真诚", "幸运"]
const NEGATIVE = ["痛苦", "悲伤", "丑陋", "失败", "糟糕", "厌恶", "冷漠", "愚蠢", "虚伪", "倒霉"]

const LABELS = {
  targetA: '河北',
  targetB: '外省',
  positive: '积极',
  negative: '消极'
}

// ==================== 简单哈希函数 ====================
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

// 管理员凭证 (哈希存储)
const ADMIN_USERNAME = 'lwx'
const ADMIN_PASSWORD_HASH = simpleHash('147896321')

// ==================== Block 配置 ====================
const BLOCKS = [
  {
    id: 1, name: 'Block 1', instruction: '将"河北"城市按 E 键，"外省"城市按 I 键',
    trials: 20, leftCategories: ['targetA'], rightCategories: ['targetB'],
    trialType: 'concept', isPractice: true, isReversed: false
  },
  {
    id: 2, name: 'Block 2', instruction: '将"积极"词汇按 E 键，"消极"词汇按 I 键',
    trials: 20, leftCategories: ['positive'], rightCategories: ['negative'],
    trialType: 'attribute', isPractice: true, isReversed: false
  },
  {
    id: 3, name: 'Block 3', instruction: '将"河北"或"积极"按 E 键，"外省"或"消极"按 I 键',
    trials: 20, leftCategories: ['targetA', 'positive'], rightCategories: ['targetB', 'negative'],
    trialType: 'combined_practice', isPractice: true, isReversed: false
  },
  {
    id: 4, name: 'Block 4', instruction: '将"河北"或"积极"按 E 键，"外省"或"消极"按 I 键',
    trials: 40, leftCategories: ['targetA', 'positive'], rightCategories: ['targetB', 'negative'],
    trialType: 'combined_test', isPractice: false, isReversed: false
  },
  {
    id: 5, name: 'Block 5', instruction: '⚠️ 注意位置变化！将"外省"按 E 键，"河北"按 I 键',
    trials: 40, leftCategories: ['targetB'], rightCategories: ['targetA'],
    trialType: 'concept_reversed_double', isPractice: true, isReversed: true
  },
  {
    id: 6, name: 'Block 6', instruction: '将"外省"或"积极"按 E 键，"河北"或"消极"按 I 键',
    trials: 20, leftCategories: ['targetB', 'positive'], rightCategories: ['targetA', 'negative'],
    trialType: 'combined_practice_reversed', isPractice: true, isReversed: true
  },
  {
    id: 7, name: 'Block 7', instruction: '将"外省"或"积极"按 E 键，"河北"或"消极"按 I 键',
    trials: 40, leftCategories: ['targetB', 'positive'], rightCategories: ['targetA', 'negative'],
    trialType: 'combined_test_reversed', isPractice: false, isReversed: true
  }
]

// ==================== 工具函数 ====================
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function pickRandom(array, n) {
  return shuffleArray(array).slice(0, n)
}

function generateSessionId(name) {
  const now = new Date()
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') + '_' +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0')
  return `${name}_${dateStr}`
}

function generateTrials(block) {
  let stimuliList = []

  switch (block.trialType) {
    case 'concept':
      stimuliList = [
        ...TARGET_A.map(s => ({ word: s, category: 'targetA', correctKey: 'KeyE' })),
        ...TARGET_B.map(s => ({ word: s, category: 'targetB', correctKey: 'KeyI' }))
      ]
      break
    case 'attribute':
      stimuliList = [
        ...POSITIVE.map(s => ({ word: s, category: 'positive', correctKey: 'KeyE' })),
        ...NEGATIVE.map(s => ({ word: s, category: 'negative', correctKey: 'KeyI' }))
      ]
      break
    case 'combined_practice':
      stimuliList = [
        ...pickRandom(TARGET_A, 5).map(s => ({ word: s, category: 'targetA', correctKey: 'KeyE' })),
        ...pickRandom(TARGET_B, 5).map(s => ({ word: s, category: 'targetB', correctKey: 'KeyI' })),
        ...pickRandom(POSITIVE, 5).map(s => ({ word: s, category: 'positive', correctKey: 'KeyE' })),
        ...pickRandom(NEGATIVE, 5).map(s => ({ word: s, category: 'negative', correctKey: 'KeyI' }))
      ]
      break
    case 'combined_test':
      stimuliList = [
        ...TARGET_A.map(s => ({ word: s, category: 'targetA', correctKey: 'KeyE' })),
        ...TARGET_B.map(s => ({ word: s, category: 'targetB', correctKey: 'KeyI' })),
        ...POSITIVE.map(s => ({ word: s, category: 'positive', correctKey: 'KeyE' })),
        ...NEGATIVE.map(s => ({ word: s, category: 'negative', correctKey: 'KeyI' }))
      ]
      break
    case 'concept_reversed_double':
      const conceptPool = [
        ...TARGET_A.map(s => ({ word: s, category: 'targetA', correctKey: 'KeyI' })),
        ...TARGET_B.map(s => ({ word: s, category: 'targetB', correctKey: 'KeyE' }))
      ]
      stimuliList = [...conceptPool, ...conceptPool]
      break
    case 'combined_practice_reversed':
      stimuliList = [
        ...pickRandom(TARGET_A, 5).map(s => ({ word: s, category: 'targetA', correctKey: 'KeyI' })),
        ...pickRandom(TARGET_B, 5).map(s => ({ word: s, category: 'targetB', correctKey: 'KeyE' })),
        ...pickRandom(POSITIVE, 5).map(s => ({ word: s, category: 'positive', correctKey: 'KeyE' })),
        ...pickRandom(NEGATIVE, 5).map(s => ({ word: s, category: 'negative', correctKey: 'KeyI' }))
      ]
      break
    case 'combined_test_reversed':
      stimuliList = [
        ...TARGET_A.map(s => ({ word: s, category: 'targetA', correctKey: 'KeyI' })),
        ...TARGET_B.map(s => ({ word: s, category: 'targetB', correctKey: 'KeyE' })),
        ...POSITIVE.map(s => ({ word: s, category: 'positive', correctKey: 'KeyE' })),
        ...NEGATIVE.map(s => ({ word: s, category: 'negative', correctKey: 'KeyI' }))
      ]
      break
    default:
      stimuliList = []
  }

  return shuffleArray(stimuliList).map((stimulus, index) => ({
    ...stimulus,
    trialIndex: index + 1
  }))
}

// 视图状态
const VIEW = {
  LANDING: 'landing',
  PARTICIPANT_INPUT: 'participant_input',
  INSTRUCTION: 'instruction',
  BLOCK_INSTRUCTION: 'block_instruction',
  FIXATION: 'fixation',
  TRIAL: 'trial',
  BLOCK_END: 'block_end',
  COMPLETION: 'completion',
  ADMIN_LOGIN: 'admin_login',
  ADMIN_DASHBOARD: 'admin_dashboard'
}

// ==================== 动画配置 ====================
const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: 'easeOut' }
}

const stimulusAnimation = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.15, ease: 'easeOut' }
}

const shakeAnimation = {
  x: [-5, 5, -5, 5, -3, 3, 0],
  transition: { duration: 0.4, ease: 'easeInOut' }
}

// ==================== 成功动画组件 (带路径动画) ====================
function SuccessAnimation() {
  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div 
        className="relative w-32 h-32"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* 圆形背景 */}
        <motion.div 
          className="absolute inset-0 bg-green-100 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {/* 内圈 */}
        <motion.div 
          className="absolute inset-2 bg-green-500 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
        >
          {/* 对勾 SVG 路径动画 */}
          <svg 
            className="w-16 h-16 text-white" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <motion.path 
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* 文字 */}
      <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">上传成功</h2>
        <p className="text-gray-500">Data Saved</p>
      </motion.div>
    </div>
  )
}

// ==================== 错误抖动图标组件 ====================
function ShakingErrorIcon() {
  return (
    <motion.div
      className="mt-8 flex items-center justify-center text-red-500"
      animate={shakeAnimation}
    >
      <X size={48} strokeWidth={3} />
    </motion.div>
  )
}

// ==================== 主组件 ====================
export default function IATExperiment() {
  const [view, setView] = useState(VIEW.LANDING)
  const [participantName, setParticipantName] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0)
  const [trials, setTrials] = useState([])
  const [results, setResults] = useState([])
  const [showError, setShowError] = useState(false)
  const [trialStartTime, setTrialStartTime] = useState(null)
  const [hadError, setHadError] = useState(false)
  const [stimulusKey, setStimulusKey] = useState(0) // 用于触发刺激词动画

  // 使用 ref 存储当前状态，避免闭包陈旧问题
  const stateRef = useRef({
    view: VIEW.LANDING,
    currentTrialIndex: 0,
    trials: [],
    currentBlockIndex: 0,
    trialStartTime: null,
    hadError: false,
    participantName: '',
    sessionId: '',
    results: []
  })

  // 同步 state 到 ref
  useEffect(() => {
    stateRef.current = {
      view,
      currentTrialIndex,
      trials,
      currentBlockIndex,
      trialStartTime,
      hadError,
      participantName,
      sessionId,
      results
    }
  }, [view, currentTrialIndex, trials, currentBlockIndex, trialStartTime, hadError, participantName, sessionId, results])

  const currentBlock = BLOCKS[currentBlockIndex]
  const currentTrial = trials[currentTrialIndex]

  // 主容器 ref 用于焦点管理
  const containerRef = useRef(null)

  // 确保焦点在主容器上
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus()
    }
  }, [view])

  // 完成后自动返回首页
  useEffect(() => {
    if (view === VIEW.COMPLETION) {
      const timer = setTimeout(() => {
        resetToLanding()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [view])

  // 开始 Block
  const startBlock = useCallback(() => {
    const block = BLOCKS[stateRef.current.currentBlockIndex]
    const newTrials = generateTrials(block)
    setTrials(newTrials)
    setCurrentTrialIndex(0)
    setShowError(false)
    setHadError(false)
    setStimulusKey(prev => prev + 1)
    setView(VIEW.FIXATION)
  }, [])

  // 注视点计时
  useEffect(() => {
    if (view === VIEW.FIXATION) {
      const timer = setTimeout(() => {
        setView(VIEW.TRIAL)
        setTrialStartTime(Date.now())
        setShowError(false)
        setHadError(false)
        setStimulusKey(prev => prev + 1)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [view])

  // 进入下一个试次
  const goToNextTrial = useCallback(() => {
    const state = stateRef.current
    if (state.currentTrialIndex + 1 >= state.trials.length) {
      setView(VIEW.BLOCK_END)
    } else {
      setCurrentTrialIndex(prev => prev + 1)
      setStimulusKey(prev => prev + 1)
      setView(VIEW.FIXATION)
    }
  }, [])

  // 保存会话到 localStorage
  const saveSession = useCallback(() => {
    const state = stateRef.current
    const session = {
      sessionId: state.sessionId,
      participantName: state.participantName,
      date: new Date().toISOString().slice(0, 10),
      timestamp: new Date().toISOString(),
      trials: state.results
    }

    try {
      const existingSessions = JSON.parse(localStorage.getItem('iat_sessions') || '[]')
      existingSessions.push(session)
      localStorage.setItem('iat_sessions', JSON.stringify(existingSessions))
      console.log('Session saved:', session.sessionId)
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }, [])

  // 下一个 Block
  const nextBlock = useCallback(() => {
    const state = stateRef.current
    if (state.currentBlockIndex + 1 >= BLOCKS.length) {
      saveSession()
      setView(VIEW.COMPLETION)
    } else {
      setCurrentBlockIndex(prev => prev + 1)
      setView(VIEW.BLOCK_INSTRUCTION)
    }
  }, [saveSession])

  // 键盘事件处理 - 使用 event.code 解决 IME 问题
  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = stateRef.current
      const code = e.code

      // 处理 E/I 键 (使用 event.code)
      if (code === 'KeyE' || code === 'KeyI') {
        e.preventDefault()
        
        if (state.view !== VIEW.TRIAL) return
        
        const trial = state.trials[state.currentTrialIndex]
        if (!trial) return

        const block = BLOCKS[state.currentBlockIndex]
        const isCorrect = code === trial.correctKey
        const reactionTime = Date.now() - state.trialStartTime
        const isPractice = block.isPractice

        if (!isCorrect) {
          if (isPractice) {
            // 练习Block: 显示错误，必须重按
            setShowError(true)
            setHadError(true)
            return
          } else {
            // 测试Block: 记录错误后直接继续
            const result = {
              participantName: state.participantName,
              sessionId: state.sessionId,
              block: block.id,
              trialIndex: trial.trialIndex,
              stimulus: trial.word,
              category: trial.category,
              correctKey: trial.correctKey === 'KeyE' ? 'E' : 'I',
              userKey: code === 'KeyE' ? 'E' : 'I',
              latency: reactionTime,
              isCorrect: false
            }
            setResults(prev => [...prev, result])
            goToNextTrial()
            return
          }
        }

        // 正确按键
        const result = {
          participantName: state.participantName,
          sessionId: state.sessionId,
          block: block.id,
          trialIndex: trial.trialIndex,
          stimulus: trial.word,
          category: trial.category,
          correctKey: trial.correctKey === 'KeyE' ? 'E' : 'I',
          userKey: code === 'KeyE' ? 'E' : 'I',
          latency: reactionTime,
          isCorrect: isPractice ? !state.hadError : true
        }

        setResults(prev => [...prev, result])
        setShowError(false)
        setHadError(false)
        goToNextTrial()
      }

      // 处理空格键
      if (code === 'Space') {
        e.preventDefault()
        if (state.view === VIEW.BLOCK_END) {
          nextBlock()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNextTrial, nextBlock])

  // Block 统计
  const getBlockStats = useCallback(() => {
    const blockResults = results.filter(r => r.block === currentBlock?.id)
    if (blockResults.length === 0) return { accuracy: 0, meanRT: 0 }

    const correctTrials = blockResults.filter(r => r.isCorrect)
    const accuracy = (correctTrials.length / blockResults.length) * 100
    const meanRT = correctTrials.length > 0
      ? correctTrials.reduce((sum, r) => sum + r.latency, 0) / correctTrials.length
      : 0

    return { accuracy, meanRT }
  }, [results, currentBlock])

  const getCategoryLabel = (category) => LABELS[category] || category

  const renderLabels = (categories) => {
    return categories.map((cat, i) => {
      const isTarget = cat === 'targetA' || cat === 'targetB'
      return (
        <div key={i} className={`font-bold text-lg ${isTarget ? 'text-blue-600' : 'text-green-600'}`}>
          {getCategoryLabel(cat)}
        </div>
      )
    })
  }

  // 开始实验
  const handleStartExperiment = (name) => {
    const sid = generateSessionId(name)
    setParticipantName(name)
    setSessionId(sid)
    setCurrentBlockIndex(0)
    setResults([])
    setView(VIEW.INSTRUCTION)
  }

  // 重置到首页
  const resetToLanding = () => {
    setView(VIEW.LANDING)
    setParticipantName('')
    setSessionId('')
    setCurrentBlockIndex(0)
    setResults([])
    setTrials([])
    setShowError(false)
    setHadError(false)
  }

  return (
    <div 
      ref={containerRef} 
      tabIndex={-1} 
      className="outline-none"
      style={{ minHeight: '100vh' }}
    >
      <AnimatePresence mode="wait">
        {/* ==================== 门户页 ==================== */}
        {view === VIEW.LANDING && (
          <motion.div
            key="landing"
            {...pageTransition}
            className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
              <motion.div 
                className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </motion.div>

              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                认知反应测验
              </h1>
              <p className="text-gray-500 text-sm mb-8">
                Cognitive Response Test
              </p>

              <motion.button
                onClick={() => setView(VIEW.PARTICIPANT_INPUT)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors mb-6"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                进入测试 (Start Test)
              </motion.button>

              <button
                onClick={() => setView(VIEW.ADMIN_LOGIN)}
                className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
              >
                管理入口 (Admin)
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================== 参与者信息录入 ==================== */}
        {view === VIEW.PARTICIPANT_INPUT && (
          <motion.div key="participant" {...pageTransition}>
            <ParticipantInput onSubmit={handleStartExperiment} onBack={resetToLanding} />
          </motion.div>
        )}

        {/* ==================== 管理员登录 ==================== */}
        {view === VIEW.ADMIN_LOGIN && (
          <motion.div key="admin-login" {...pageTransition}>
            <AdminLogin onSuccess={() => setView(VIEW.ADMIN_DASHBOARD)} onBack={resetToLanding} />
          </motion.div>
        )}

        {/* ==================== 管理员面板 ==================== */}
        {view === VIEW.ADMIN_DASHBOARD && (
          <motion.div key="admin-dashboard" {...pageTransition}>
            <AdminDashboard onLogout={resetToLanding} />
          </motion.div>
        )}

        {/* ==================== 实验指导语 ==================== */}
        {view === VIEW.INSTRUCTION && (
          <motion.div
            key="instruction"
            {...pageTransition}
            className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-lg max-w-xl w-full p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">实验须知</h1>
                <p className="text-gray-500 text-sm">参与者: {participantName}</p>
              </div>

              <div className="space-y-4 text-gray-700 mb-6">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <p>请使用 <strong>电脑键盘</strong> 完成本实验</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <p>左手食指放在 <kbd className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono border">E</kbd> 键，右手食指放在 <kbd className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono border">I</kbd> 键</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <p>请在 <strong>安静的环境</strong> 中进行实验</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <p>请尽可能 <strong>快速且准确</strong> 地做出反应</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">5</span>
                  <p>实验共有 <strong>7 个阶段</strong>，请按提示操作</p>
                </div>
              </div>

              {/* 重要提示：关闭中文输入法 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800 text-sm font-medium text-center">
                  ⚠️ 请关闭中文输入法 (Please turn off Chinese Input Method)
                </p>
              </div>

              <motion.button
                onClick={() => setView(VIEW.BLOCK_INSTRUCTION)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                我已了解，开始实验
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ==================== Block 指导语 ==================== */}
        {view === VIEW.BLOCK_INSTRUCTION && (
          <motion.div
            key={`block-instruction-${currentBlockIndex}`}
            {...pageTransition}
            className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-lg max-w-xl w-full p-8">
              <div className="text-center mb-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  currentBlock.isPractice ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                }`}>
                  {currentBlock.isPractice ? '练习阶段' : '正式测试'}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
                {currentBlock.name}
              </h2>

              <p className="text-gray-600 text-center mb-6 text-sm">
                共 {currentBlock.trials} 个试次
              </p>

              {currentBlock.isReversed && (
                <motion.div 
                  className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-center"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ repeat: 2, repeatType: 'reverse', duration: 0.3 }}
                >
                  <span className="text-amber-700 font-medium">⚠️ 注意：类别位置已改变！</span>
                </motion.div>
              )}

              <p className="text-gray-700 text-center mb-6">{currentBlock.instruction}</p>

              <div className="flex justify-between mb-8">
                <div className="flex-1 text-center p-4 bg-gray-50 rounded-lg mr-2">
                  <div className="text-sm text-gray-500 mb-2">按 E 键</div>
                  {renderLabels(currentBlock.leftCategories)}
                </div>
                <div className="flex-1 text-center p-4 bg-gray-50 rounded-lg ml-2">
                  <div className="text-sm text-gray-500 mb-2">按 I 键</div>
                  {renderLabels(currentBlock.rightCategories)}
                </div>
              </div>

              <motion.button
                onClick={startBlock}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                开始
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ==================== 注视点 ==================== */}
        {view === VIEW.FIXATION && (
          <motion.div
            key={`fixation-${stimulusKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="min-h-screen bg-[#f3f4f6] flex items-center justify-center"
          >
            <div className="text-5xl font-light text-gray-400 select-none">+</div>
          </motion.div>
        )}

        {/* ==================== 试次 ==================== */}
        {view === VIEW.TRIAL && currentTrial && (
          <div className="min-h-screen bg-[#f3f4f6] flex flex-col select-none">
            {/* 进度条 */}
            <div className="h-1 bg-gray-200">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: `${(currentTrialIndex / trials.length) * 100}%` }}
                animate={{ width: `${((currentTrialIndex + 1) / trials.length) * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>

            {/* 试次计数 */}
            <div className="text-center py-2 text-sm text-gray-400">
              {currentTrialIndex + 1} / {trials.length}
            </div>

            {/* 主区域 */}
            <div className="flex-1 flex items-center justify-center relative">
              {/* 左侧标签 */}
              <div className="absolute top-8 left-8 text-left">
                <div className="text-xs text-gray-400 mb-1">E 键</div>
                {renderLabels(currentBlock.leftCategories)}
              </div>

              {/* 右侧标签 */}
              <div className="absolute top-8 right-8 text-right">
                <div className="text-xs text-gray-400 mb-1">I 键</div>
                {renderLabels(currentBlock.rightCategories)}
              </div>

              {/* 中央刺激词 - 带 Pop-in 动画 */}
              <div className="text-center">
                <motion.div
                  key={`stimulus-${stimulusKey}`}
                  {...stimulusAnimation}
                  className={`text-5xl font-bold ${
                    currentTrial.category === 'targetA' || currentTrial.category === 'targetB'
                      ? 'text-blue-600'
                      : 'text-green-600'
                  }`}
                >
                  {currentTrial.word}
                </motion.div>

                {/* 错误提示 - 带抖动动画 */}
                <AnimatePresence>
                  {showError && currentBlock.isPractice && (
                    <ShakingErrorIcon />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 底部按键提示 */}
            <div className="pb-6 flex justify-center gap-24">
              <div className="text-center">
                <kbd className="px-4 py-2 bg-white shadow rounded-lg text-xl font-mono font-bold text-gray-700">E</kbd>
              </div>
              <div className="text-center">
                <kbd className="px-4 py-2 bg-white shadow rounded-lg text-xl font-mono font-bold text-gray-700">I</kbd>
              </div>
            </div>
          </div>
        )}

        {/* ==================== Block 结束 ==================== */}
        {view === VIEW.BLOCK_END && (
          <motion.div
            key={`block-end-${currentBlockIndex}`}
            {...pageTransition}
            className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="text-green-600" size={24} />
              </motion.div>

              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {currentBlock.name} 完成
              </h2>

              <p className="text-gray-500 text-sm mb-6">
                第 {currentBlockIndex + 1} / {BLOCKS.length} 阶段
              </p>

              {currentBlock.isPractice && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{getBlockStats().accuracy.toFixed(1)}%</div>
                      <div className="text-sm text-gray-500">正确率</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{Math.round(getBlockStats().meanRT)} ms</div>
                      <div className="text-sm text-gray-500">平均反应时</div>
                    </div>
                  </div>
                </div>
              )}

              {!currentBlock.isPractice && (
                <p className="text-gray-600 mb-6">请稍作休息</p>
              )}

              <p className="text-gray-500 text-sm mb-4">
                按 <kbd className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono border">空格键</kbd> 继续
              </p>

              <motion.button
                onClick={nextBlock}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {currentBlockIndex + 1 >= BLOCKS.length ? '完成实验' : '继续'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ==================== 完成页 (带动画) ==================== */}
        {view === VIEW.COMPLETION && (
          <motion.div
            key="completion"
            {...pageTransition}
            className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-12">
              <SuccessAnimation />
              <motion.p 
                className="text-center text-gray-400 text-sm mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                即将返回首页...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==================== 参与者录入组件 ====================
function ParticipantInput({ onSubmit, onBack }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('请输入您的姓名')
      return
    }
    onSubmit(trimmedName)
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>返回</span>
        </button>

        <h1 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
          参与者信息
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          Participant Information
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              请输入您的姓名 (Please enter your name)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="例如：张三"
              autoFocus
            />
            {error && (
              <motion.p 
                className="text-red-500 text-sm mt-2"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}
          </div>

          <motion.button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            下一步 (Next)
          </motion.button>
        </form>
      </div>
    </div>
  )
}

// ==================== 管理员登录组件 ====================
function AdminLogin({ onSuccess, onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (username === ADMIN_USERNAME && simpleHash(password) === ADMIN_PASSWORD_HASH) {
      onSuccess()
    } else {
      setError('用户名或密码错误')
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>返回</span>
        </button>

        <h1 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
          管理员登录
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          Admin Login
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              用户名 (Username)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              密码 (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            登录 (Login)
          </motion.button>
        </form>
      </div>
    </div>
  )
}

// ==================== 管理员面板组件 (增强版) ====================
function AdminDashboard({ onLogout }) {
  const [sessions, setSessions] = useState([])
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [expandedSession, setExpandedSession] = useState(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = () => {
    try {
      const data = JSON.parse(localStorage.getItem('iat_sessions') || '[]')
      setSessions(data)
    } catch (error) {
      console.error('Failed to load sessions:', error)
      setSessions([])
    }
  }

  // 计算单个会话的统计数据
  const getSessionStats = useCallback((session) => {
    const trials = session.trials || []
    
    const block4Trials = trials.filter(t => t.block === 4)
    const block7Trials = trials.filter(t => t.block === 7)
    
    const calcStats = (blockTrials) => {
      if (blockTrials.length === 0) return { meanRT: 0, accuracy: 0 }
      const correctTrials = blockTrials.filter(t => t.isCorrect)
      const accuracy = (correctTrials.length / blockTrials.length) * 100
      const meanRT = correctTrials.length > 0
        ? correctTrials.reduce((sum, t) => sum + t.latency, 0) / correctTrials.length
        : 0
      return { meanRT, accuracy }
    }
    
    return {
      block4: calcStats(block4Trials),
      block7: calcStats(block7Trials)
    }
  }, [])

  const exportCSV = () => {
    if (sessions.length === 0) {
      alert('没有数据可导出')
      return
    }

    const headers = [
      'ParticipantName',
      'SessionID',
      'Block',
      'TrialIndex',
      'Stimulus',
      'Category',
      'CorrectKey',
      'UserKey',
      'Latency(ms)',
      'IsCorrect'
    ]

    const rows = []
    sessions.forEach(session => {
      (session.trials || []).forEach(trial => {
        rows.push([
          trial.participantName || session.participantName,
          trial.sessionId || session.sessionId,
          trial.block,
          trial.trialIndex,
          trial.stimulus,
          trial.category,
          trial.correctKey,
          trial.userKey,
          trial.latency,
          trial.isCorrect
        ])
      })
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `IAT_Data_Export_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearData = () => {
    localStorage.removeItem('iat_sessions')
    setSessions([])
    setShowConfirmClear(false)
    setExpandedSession(null)
  }

  const toggleExpand = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId)
  }

  const totalTrials = sessions.reduce((sum, s) => sum + (s.trials?.length || 0), 0)

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* 头部 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">数据管理面板</h1>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut size={18} />
              <span>退出</span>
            </button>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <motion.div 
              className="bg-blue-50 rounded-lg p-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-3xl font-bold text-blue-600">{sessions.length}</div>
              <div className="text-sm text-gray-600">参与者</div>
            </motion.div>
            <motion.div 
              className="bg-green-50 rounded-lg p-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-3xl font-bold text-green-600">{totalTrials}</div>
              <div className="text-sm text-gray-600">总试次</div>
            </motion.div>
            <motion.div 
              className="bg-purple-50 rounded-lg p-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-3xl font-bold text-purple-600">
                {sessions.length > 0 ? Math.round(totalTrials / sessions.length) : 0}
              </div>
              <div className="text-sm text-gray-600">平均/人</div>
            </motion.div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <motion.button
              onClick={exportCSV}
              disabled={sessions.length === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
              whileHover={{ scale: sessions.length > 0 ? 1.02 : 1 }}
              whileTap={{ scale: sessions.length > 0 ? 0.98 : 1 }}
            >
              <Download size={20} />
              导出 CSV
            </motion.button>
            <motion.button
              onClick={() => setShowConfirmClear(true)}
              disabled={sessions.length === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
              whileHover={{ scale: sessions.length > 0 ? 1.02 : 1 }}
              whileTap={{ scale: sessions.length > 0 ? 0.98 : 1 }}
            >
              <Trash2 size={20} />
              清除数据
            </motion.button>
          </div>

          {/* 确认清除 */}
          <AnimatePresence>
            {showConfirmClear && (
              <motion.div 
                className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-red-700 mb-4">确定要清除所有数据吗？此操作不可撤销。</p>
                <div className="flex gap-4">
                  <button
                    onClick={clearData}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg"
                  >
                    确认清除
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg"
                  >
                    取消
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 会话列表 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={20} />
            参与者数据 ({sessions.length})
          </h2>

          {sessions.length === 0 ? (
            <motion.div 
              className="text-center text-gray-500 py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              暂无数据
            </motion.div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => {
                const stats = getSessionStats(session)
                const isExpanded = expandedSession === session.sessionId

                return (
                  <motion.div 
                    key={session.sessionId || index} 
                    className="border border-gray-200 rounded-lg overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* 会话卡片头部 */}
                    <div
                      onClick={() => toggleExpand(session.sessionId)}
                      className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-800">{session.participantName}</span>
                            <span className="text-xs text-gray-500 font-mono">{session.sessionId}</span>
                          </div>
                          <div className="text-sm text-gray-500">{session.date}</div>
                        </div>

                        {/* 统计摘要 */}
                        <div className="flex items-center gap-6 mr-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Block 4</div>
                            <div className="text-sm">
                              <span className="font-medium text-blue-600">{Math.round(stats.block4.meanRT)}ms</span>
                              <span className="mx-1 text-gray-300">|</span>
                              <span className="font-medium text-green-600">{stats.block4.accuracy.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Block 7</div>
                            <div className="text-sm">
                              <span className="font-medium text-blue-600">{Math.round(stats.block7.meanRT)}ms</span>
                              <span className="mx-1 text-gray-300">|</span>
                              <span className="font-medium text-green-600">{stats.block7.accuracy.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>

                        <motion.div 
                          className="text-gray-400"
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown size={20} />
                        </motion.div>
                      </div>
                    </div>

                    {/* 展开的详细数据 */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-200 overflow-hidden"
                        >
                          <div className="max-h-96 overflow-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                  <th className="text-left py-2 px-4 font-medium text-gray-600">Block</th>
                                  <th className="text-left py-2 px-4 font-medium text-gray-600">刺激词</th>
                                  <th className="text-left py-2 px-4 font-medium text-gray-600">按键</th>
                                  <th className="text-left py-2 px-4 font-medium text-gray-600">RT(ms)</th>
                                  <th className="text-left py-2 px-4 font-medium text-gray-600">正确</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(session.trials || []).map((trial, tIndex) => (
                                  <tr key={tIndex} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 px-4">{trial.block}</td>
                                    <td className="py-2 px-4">{trial.stimulus}</td>
                                    <td className="py-2 px-4 font-mono">{trial.userKey}</td>
                                    <td className="py-2 px-4">{trial.latency}</td>
                                    <td className="py-2 px-4">
                                      {trial.isCorrect ? (
                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full">
                                          <Check size={14} />
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full">
                                          <X size={14} />
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
