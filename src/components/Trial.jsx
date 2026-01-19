import { memo } from 'react'
import { X } from 'lucide-react'

function Trial({ 
  leftLabels, 
  rightLabels, 
  stimulus, 
  stimulusType,
  showError,
  progress,
  trialNumber,
  totalTrials
}) {
  // 根据刺激类型决定颜色
  const getStimulusColor = () => {
    if (stimulusType === 'targetA' || stimulusType === 'targetB') {
      return 'text-blue-600' // 类别词用蓝色
    }
    return 'text-green-600' // 属性词用绿色
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col select-none">
      {/* 进度条 */}
      <div className="h-1 bg-gray-200">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* 试次计数 */}
      <div className="text-center py-2 text-sm text-gray-400">
        {trialNumber} / {totalTrials}
      </div>
      
      {/* 主实验区域 */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* 左侧标签 */}
        <div className="absolute top-8 left-8 text-left">
          <div className="text-sm text-gray-400 mb-1">按 E 键</div>
          {leftLabels.map((label, i) => (
            <div
              key={i}
              className={`font-bold text-xl ${
                label.type === 'category' ? 'text-blue-600' : 'text-green-600'
              }`}
            >
              {label.text}
            </div>
          ))}
        </div>
        
        {/* 右侧标签 */}
        <div className="absolute top-8 right-8 text-right">
          <div className="text-sm text-gray-400 mb-1">按 I 键</div>
          {rightLabels.map((label, i) => (
            <div
              key={i}
              className={`font-bold text-xl ${
                label.type === 'category' ? 'text-blue-600' : 'text-green-600'
              }`}
            >
              {label.text}
            </div>
          ))}
        </div>
        
        {/* 中央刺激词 */}
        <div className="text-center">
          <div className={`text-5xl font-bold ${getStimulusColor()}`}>
            {stimulus}
          </div>
          
          {/* 错误提示 */}
          {showError && (
            <div className="mt-6 flex items-center justify-center gap-2 text-red-500">
              <X size={32} strokeWidth={3} />
              <span className="text-lg font-medium">选择错误，请您重新选择</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 底部按键提示 */}
      <div className="pb-8 flex justify-center gap-32">
        <div className="text-center">
          <kbd className="px-4 py-2 bg-white shadow rounded-lg text-2xl font-mono font-bold text-gray-700">
            E
          </kbd>
          <div className="text-xs text-gray-400 mt-1">左手</div>
        </div>
        <div className="text-center">
          <kbd className="px-4 py-2 bg-white shadow rounded-lg text-2xl font-mono font-bold text-gray-700">
            I
          </kbd>
          <div className="text-xs text-gray-400 mt-1">右手</div>
        </div>
      </div>
    </div>
  )
}

export default memo(Trial)
