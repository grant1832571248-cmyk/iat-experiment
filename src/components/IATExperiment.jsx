import { useState, useEffect, useCallback, useRef } from 'react'
import { Download, AlertCircle, CheckCircle } from 'lucide-react'
import Trial from './Trial'

// 刺激词数据（各10个，共40个）
const TARGET_A = ["保定", "唐山", "邯郸", "沧州", "邢台", "廊坊", "承德", "衡水", "定州", "正定"] // 河北
const TARGET_B = ["太原", "沈阳", "郑州", "济南", "西安", "合肥", "长春", "兰州", "银川", "西宁"] // 外省
const POSITIVE = ["快乐", "幸福", "美好", "成功", "优秀", "喜爱", "友善", "智慧", "真诚", "幸运"]
const NEGATIVE = ["痛苦", "悲伤", "丑陋", "失败", "糟糕", "厌恶", "冷漠", "愚蠢", "虚伪", "倒霉"]

// 实验配置
const CONFIG = {
  categories: {
    targetA: {
      label: '河北 (家乡)',
      stimuli: TARGET_A
    },
    targetB: {
      label: '外省 (他乡)',
      stimuli: TARGET_B
    }
  },
  attributes: {
    positive: {
      label: '积极 (好)',
      stimuli: POSITIVE
    },
    negative: {
      label: '消极 (坏)',
      stimuli: NEGATIVE
    }
  },
  keys: {
    left: 'e',
    right: 'i'
  },
  fixationDuration: 300
}

// Block 配置
const BLOCKS = [
  {
    id: 1,
    name: 'Block 1 - 概念词辨别练习',
    description: '请将"河北"相关城市按 E 键，"外省"相关城市按 I 键',
    trials: 20,
    leftLabels: [{ text: CONFIG.categories.targetA.label, type: 'category' }],
    rightLabels: [{ text: CONFIG.categories.targetB.label, type: 'category' }],
    trialType: 'concept', // Block 1: 10河北 + 10外省 = 20，每词出现1次
    isPractice: true
  },
  {
    id: 2,
    name: 'Block 2 - 属性词辨别练习',
    description: '请将"积极"词汇按 E 键，"消极"词汇按 I 键',
    trials: 20,
    leftLabels: [{ text: CONFIG.attributes.positive.label, type: 'attribute' }],
    rightLabels: [{ text: CONFIG.attributes.negative.label, type: 'attribute' }],
    trialType: 'attribute', // Block 2: 10积极 + 10消极 = 20，每词出现1次
    isPractice: true
  },
  {
    id: 3,
    name: 'Block 3 - 联合练习',
    description: '请将"河北"或"积极"词汇按 E 键，"外省"或"消极"词汇按 I 键',
    trials: 20,
    leftLabels: [
      { text: CONFIG.categories.targetA.label, type: 'category' },
      { text: CONFIG.attributes.positive.label, type: 'attribute' }
    ],
    rightLabels: [
      { text: CONFIG.categories.targetB.label, type: 'category' },
      { text: CONFIG.attributes.negative.label, type: 'attribute' }
    ],
    trialType: 'combined_practice', // Block 3: 5河北 + 5外省 + 5积极 + 5消极 = 20
    isPractice: true
  },
  {
    id: 4,
    name: 'Block 4 - 联合测试 (正式)',
    description: '请将"河北"或"积极"词汇按 E 键，"外省"或"消极"词汇按 I 键',
    trials: 40,
    leftLabels: [
      { text: CONFIG.categories.targetA.label, type: 'category' },
      { text: CONFIG.attributes.positive.label, type: 'attribute' }
    ],
    rightLabels: [
      { text: CONFIG.categories.targetB.label, type: 'category' },
      { text: CONFIG.attributes.negative.label, type: 'attribute' }
    ],
    trialType: 'combined_test', // Block 4: 全部40词各出现1次
    isPractice: false
  },
  {
    id: 5,
    name: 'Block 5 - 概念词反转练习',
    description: '⚠️ 注意位置变化！请将"外省"相关城市按 E 键，"河北"相关城市按 I 键',
    trials: 40,
    leftLabels: [{ text: CONFIG.categories.targetB.label, type: 'category' }],
    rightLabels: [{ text: CONFIG.categories.targetA.label, type: 'category' }],
    trialType: 'concept_reversed_double', // Block 5: 20个概念词 × 2 = 40，打破定势
    isPractice: true,
    isReversed: true
  },
  {
    id: 6,
    name: 'Block 6 - 反转联合练习',
    description: '请将"外省"或"积极"词汇按 E 键，"河北"或"消极"词汇按 I 键',
    trials: 20,
    leftLabels: [
      { text: CONFIG.categories.targetB.label, type: 'category' },
      { text: CONFIG.attributes.positive.label, type: 'attribute' }
    ],
    rightLabels: [
      { text: CONFIG.categories.targetA.label, type: 'category' },
      { text: CONFIG.attributes.negative.label, type: 'attribute' }
    ],
    trialType: 'combined_practice_reversed', // Block 6: 5河北 + 5外省 + 5积极 + 5消极 = 20
    isPractice: true,
    isReversed: true
  },
  {
    id: 7,
    name: 'Block 7 - 反转联合测试 (正式)',
    description: '请将"外省"或"积极"词汇按 E 键，"河北"或"消极"词汇按 I 键',
    trials: 40,
    leftLabels: [
      { text: CONFIG.categories.targetB.label, type: 'category' },
      { text: CONFIG.attributes.positive.label, type: 'attribute' }
    ],
    rightLabels: [
      { text: CONFIG.categories.targetA.label, type: 'category' },
      { text: CONFIG.attributes.negative.label, type: 'attribute' }
    ],
    trialType: 'combined_test_reversed', // Block 7: 全部40词各出现1次
    isPractice: false,
    isReversed: true
  }
]

// 打乱数组
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 从数组中随机选取 n 个元素
function pickRandom(array, n) {
  const shuffled = shuffleArray(array)
  return shuffled.slice(0, n)
}

// 生成试次列表（根据不同 Block 类型）
function generateTrials(block) {
  let stimuliList = []
  
  switch (block.trialType) {
    case 'concept':
      // Block 1: 10河北 + 10外省 = 20，每词出现1次
      stimuliList = [
        ...TARGET_A.map(s => ({ word: s, correctKey: 'e', type: 'targetA' })),
        ...TARGET_B.map(s => ({ word: s, correctKey: 'i', type: 'targetB' }))
      ]
      break
      
    case 'attribute':
      // Block 2: 10积极 + 10消极 = 20，每词出现1次
      stimuliList = [
        ...POSITIVE.map(s => ({ word: s, correctKey: 'e', type: 'positive' })),
        ...NEGATIVE.map(s => ({ word: s, correctKey: 'i', type: 'negative' }))
      ]
      break
      
    case 'combined_practice':
      // Block 3: 5河北 + 5外省 + 5积极 + 5消极 = 20
      stimuliList = [
        ...pickRandom(TARGET_A, 5).map(s => ({ word: s, correctKey: 'e', type: 'targetA' })),
        ...pickRandom(TARGET_B, 5).map(s => ({ word: s, correctKey: 'i', type: 'targetB' })),
        ...pickRandom(POSITIVE, 5).map(s => ({ word: s, correctKey: 'e', type: 'positive' })),
        ...pickRandom(NEGATIVE, 5).map(s => ({ word: s, correctKey: 'i', type: 'negative' }))
      ]
      break
      
    case 'combined_test':
      // Block 4: 全部40词各出现1次
      stimuliList = [
        ...TARGET_A.map(s => ({ word: s, correctKey: 'e', type: 'targetA' })),
        ...TARGET_B.map(s => ({ word: s, correctKey: 'i', type: 'targetB' })),
        ...POSITIVE.map(s => ({ word: s, correctKey: 'e', type: 'positive' })),
        ...NEGATIVE.map(s => ({ word: s, correctKey: 'i', type: 'negative' }))
      ]
      break
      
    case 'concept_reversed_double':
      // Block 5: 20个概念词 × 2 = 40，打破定势（反转：河北按I，外省按E）
      const conceptPool = [
        ...TARGET_A.map(s => ({ word: s, correctKey: 'i', type: 'targetA' })),
        ...TARGET_B.map(s => ({ word: s, correctKey: 'e', type: 'targetB' }))
      ]
      stimuliList = [...conceptPool, ...conceptPool] // 两份
      break
      
    case 'combined_practice_reversed':
      // Block 6: 5河北 + 5外省 + 5积极 + 5消极 = 20（反转：河北按I，外省按E）
      stimuliList = [
        ...pickRandom(TARGET_A, 5).map(s => ({ word: s, correctKey: 'i', type: 'targetA' })),
        ...pickRandom(TARGET_B, 5).map(s => ({ word: s, correctKey: 'e', type: 'targetB' })),
        ...pickRandom(POSITIVE, 5).map(s => ({ word: s, correctKey: 'e', type: 'positive' })),
        ...pickRandom(NEGATIVE, 5).map(s => ({ word: s, correctKey: 'i', type: 'negative' }))
      ]
      break
      
    case 'combined_test_reversed':
      // Block 7: 全部40词各出现1次（反转：河北按I，外省按E）
      stimuliList = [
        ...TARGET_A.map(s => ({ word: s, correctKey: 'i', type: 'targetA' })),
        ...TARGET_B.map(s => ({ word: s, correctKey: 'e', type: 'targetB' })),
        ...POSITIVE.map(s => ({ word: s, correctKey: 'e', type: 'positive' })),
        ...NEGATIVE.map(s => ({ word: s, correctKey: 'i', type: 'negative' }))
      ]
      break
      
    default:
      stimuliList = []
  }
  
  // 打乱顺序
  const shuffled = shuffleArray(stimuliList)
  
  // 添加 block 信息和试次序号
  return shuffled.map((stimulus, index) => ({
    ...stimulus,
    blockId: block.id,
    blockName: block.name,
    trialIndex: index + 1
  }))
}

// 实验阶段枚举
const PHASE = {
  WELCOME: 'welcome',
  INSTRUCTION: 'instruction',
  FIXATION: 'fixation',
  TRIAL: 'trial',
  BLOCK_END: 'block_end',
  COMPLETE: 'complete'
}

export default function IATExperiment() {
  const [phase, setPhase] = useState(PHASE.WELCOME)
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0)
  const [trials, setTrials] = useState([])
  const [results, setResults] = useState([])
  const [showError, setShowError] = useState(false)
  const [trialStartTime, setTrialStartTime] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const currentBlock = BLOCKS[currentBlockIndex]
  const currentTrial = trials[currentTrialIndex]

  // 进入全屏
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen()
    }
    setIsFullscreen(true)
  }, [])

  // 退出全屏
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
    setIsFullscreen(false)
  }, [])

  // 开始 Block
  const startBlock = useCallback(() => {
    const newTrials = generateTrials(currentBlock)
    setTrials(newTrials)
    setCurrentTrialIndex(0)
    setPhase(PHASE.FIXATION)
  }, [currentBlock])

  // 显示注视点后开始试次
  useEffect(() => {
    if (phase === PHASE.FIXATION) {
      const timer = setTimeout(() => {
        setPhase(PHASE.TRIAL)
        setTrialStartTime(Date.now())
      }, CONFIG.fixationDuration)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // 处理按键
  const handleKeyPress = useCallback((key) => {
    if (phase !== PHASE.TRIAL || !currentTrial) return
    
    const pressedKey = key.toLowerCase()
    if (pressedKey !== 'e' && pressedKey !== 'i') return
    
    const isCorrect = pressedKey === currentTrial.correctKey
    const reactionTime = Date.now() - trialStartTime
    
    if (!isCorrect) {
      setShowError(true)
      // 记录错误但继续（需要按正确键）
      return
    }
    
    // 记录结果
    const result = {
      blockId: currentTrial.blockId,
      blockName: currentTrial.blockName,
      trialIndex: currentTrial.trialIndex,
      stimulus: currentTrial.word,
      stimulusType: currentTrial.type,
      correctKey: currentTrial.correctKey,
      pressedKey: pressedKey,
      reactionTime: reactionTime,
      isCorrect: !showError, // 如果之前按错过，记为错误
      timestamp: new Date().toISOString()
    }
    
    setResults(prev => [...prev, result])
    setShowError(false)
    
    // 下一个试次或结束 Block
    if (currentTrialIndex + 1 >= trials.length) {
      setPhase(PHASE.BLOCK_END)
    } else {
      setCurrentTrialIndex(prev => prev + 1)
      setPhase(PHASE.FIXATION)
    }
  }, [phase, currentTrial, trialStartTime, currentTrialIndex, trials.length, showError])

  // 键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'e' || e.key.toLowerCase() === 'i') {
        e.preventDefault()
        handleKeyPress(e.key)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyPress])

  // 下一个 Block
  const nextBlock = useCallback(() => {
    if (currentBlockIndex + 1 >= BLOCKS.length) {
      setPhase(PHASE.COMPLETE)
      exitFullscreen()
    } else {
      setCurrentBlockIndex(prev => prev + 1)
      setPhase(PHASE.INSTRUCTION)
    }
  }, [currentBlockIndex, exitFullscreen])

  // 导出数据为 CSV
  const exportToCSV = useCallback(() => {
    const headers = [
      'Block序号',
      'Block名称',
      '试次序号',
      '刺激词',
      '刺激类型',
      '正确答案',
      '用户按键',
      '反应时(ms)',
      '是否正确',
      '时间戳'
    ]
    
    const rows = results.map(r => [
      r.blockId,
      r.blockName,
      r.trialIndex,
      r.stimulus,
      r.stimulusType,
      r.correctKey.toUpperCase(),
      r.pressedKey.toUpperCase(),
      r.reactionTime,
      r.isCorrect ? '正确' : '错误',
      r.timestamp
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `IAT_实验数据_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [results])

  // 计算统计数据
  const getStats = useCallback(() => {
    const block4Results = results.filter(r => r.blockId === 4)
    const block7Results = results.filter(r => r.blockId === 7)
    
    const calcMean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    
    const block4RT = calcMean(block4Results.filter(r => r.isCorrect).map(r => r.reactionTime))
    const block7RT = calcMean(block7Results.filter(r => r.isCorrect).map(r => r.reactionTime))
    const block4Acc = block4Results.filter(r => r.isCorrect).length / block4Results.length * 100
    const block7Acc = block7Results.filter(r => r.isCorrect).length / block7Results.length * 100
    
    return { block4RT, block7RT, block4Acc, block7Acc }
  }, [results])

  // 渲染欢迎页
  if (phase === PHASE.WELCOME) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full p-8">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
            内隐联想测验 (IAT)
          </h1>
          <p className="text-gray-600 text-center mb-2">
            河北师范大学心理学系 · 毕业论文实验
          </p>
          <p className="text-gray-500 text-sm text-center mb-8">
            方言启动效应：内群体与外群体的偏见研究
          </p>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">实验说明</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">1.</span>
                <span>本实验需要您对屏幕中央出现的词汇进行快速分类。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">2.</span>
                <span>使用键盘按键进行分类：<kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">E</kbd> 键代表左侧类别，<kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">I</kbd> 键代表右侧类别。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">3.</span>
                <span>请尽可能<strong>快速且准确</strong>地做出反应。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">4.</span>
                <span>如果分类错误，会出现红色 "✗" 提示，请按正确的键继续。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">5.</span>
                <span>实验共有 <strong>7 个阶段</strong>，每个阶段开始前会有具体说明。</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle size={20} />
              <span className="font-medium">建议全屏进行实验以获得最佳体验</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              enterFullscreen()
              setPhase(PHASE.INSTRUCTION)
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors"
          >
            开始实验
          </button>
        </div>
      </div>
    )
  }

  // 渲染指导语页
  if (phase === PHASE.INSTRUCTION) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full p-8">
          <div className="text-center mb-6">
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
              currentBlock.isPractice ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
            }`}>
              {currentBlock.isPractice ? '练习阶段' : '正式测试'}
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            {currentBlock.name}
          </h2>
          
          {currentBlock.isReversed && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <span className="font-medium">注意：类别位置已经改变！</span>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 text-center mb-8">
            {currentBlock.description}
          </p>
          
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1 text-center p-4 bg-gray-50 rounded-xl mr-2">
              <div className="text-sm text-gray-500 mb-2">按 E 键</div>
              {currentBlock.leftLabels.map((label, i) => (
                <div
                  key={i}
                  className={`font-semibold text-lg ${
                    label.type === 'category' ? 'text-blue-600' : 'text-green-600'
                  }`}
                >
                  {label.text}
                </div>
              ))}
            </div>
            <div className="flex-1 text-center p-4 bg-gray-50 rounded-xl ml-2">
              <div className="text-sm text-gray-500 mb-2">按 I 键</div>
              {currentBlock.rightLabels.map((label, i) => (
                <div
                  key={i}
                  className={`font-semibold text-lg ${
                    label.type === 'category' ? 'text-blue-600' : 'text-green-600'
                  }`}
                >
                  {label.text}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center text-gray-500 text-sm mb-6">
            共 {currentBlock.trials} 个试次
          </div>
          
          <button
            onClick={startBlock}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors"
          >
            准备好了，开始
          </button>
        </div>
      </div>
    )
  }

  // 渲染注视点
  if (phase === PHASE.FIXATION) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-6xl font-light text-gray-400">+</div>
      </div>
    )
  }

  // 渲染试次
  if (phase === PHASE.TRIAL && currentTrial) {
    return (
      <Trial
        leftLabels={currentBlock.leftLabels}
        rightLabels={currentBlock.rightLabels}
        stimulus={currentTrial.word}
        stimulusType={currentTrial.type}
        showError={showError}
        progress={(currentTrialIndex + 1) / trials.length * 100}
        trialNumber={currentTrialIndex + 1}
        totalTrials={trials.length}
      />
    )
  }

  // 渲染 Block 结束页
  if (phase === PHASE.BLOCK_END) {
    const blockResults = results.filter(r => r.blockId === currentBlock.id)
    const accuracy = blockResults.filter(r => r.isCorrect).length / blockResults.length * 100
    const avgRT = blockResults.filter(r => r.isCorrect).reduce((sum, r) => sum + r.reactionTime, 0) / 
                  blockResults.filter(r => r.isCorrect).length
    
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {currentBlock.name} 完成
          </h2>
          
          <p className="text-gray-500 mb-6">
            {currentBlockIndex + 1} / {BLOCKS.length} 阶段
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">{accuracy.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">正确率</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{avgRT.toFixed(0)}ms</div>
                <div className="text-sm text-gray-500">平均反应时</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={nextBlock}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors"
          >
            {currentBlockIndex + 1 >= BLOCKS.length ? '查看结果' : '继续下一阶段'}
          </button>
        </div>
      </div>
    )
  }

  // 渲染完成页
  if (phase === PHASE.COMPLETE) {
    const stats = getStats()
    
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-white" size={40} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            实验完成
          </h1>
          <p className="text-gray-500 mb-8">
            感谢您的参与！
          </p>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-700 mb-4">关键数据摘要</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Block 4 (相容) 平均反应时</span>
                <span className="font-medium">{stats.block4RT.toFixed(0)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Block 4 (相容) 正确率</span>
                <span className="font-medium">{stats.block4Acc.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Block 7 (不相容) 平均反应时</span>
                <span className="font-medium">{stats.block7RT.toFixed(0)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Block 7 (不相容) 正确率</span>
                <span className="font-medium">{stats.block7Acc.toFixed(1)}%</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between">
                <span className="text-gray-600">总试次数</span>
                <span className="font-medium">{results.length}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={exportToCSV}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Download size={20} />
            下载完整数据 (CSV)
          </button>
          
          <p className="text-xs text-gray-400 mt-4">
            数据文件包含每个试次的详细记录
          </p>
        </div>
      </div>
    )
  }

  return null
}
