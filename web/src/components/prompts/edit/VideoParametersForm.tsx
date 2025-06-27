import React from 'react';
import { motion } from 'framer-motion';
import { AdjustmentsHorizontalIcon, FilmIcon } from '@heroicons/react/24/outline';

export interface VideoParameters {
  duration?: number;
  fps?: number;
  resolution?: string;
  motion_strength?: number;
  camera_movement?: string;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
  aspect_ratio?: string;
  quality?: string;
}

interface VideoParametersFormProps {
  value: VideoParameters;
  onChange: (parameters: VideoParameters) => void;
  disabled?: boolean;
  className?: string;
}

const resolutionOptions = [
  { value: '512x512', label: '512×512', description: '标清方形' },
  { value: '768x768', label: '768×768', description: '高清方形' },
  { value: '1024x576', label: '1024×576', description: '横屏16:9' },
  { value: '576x1024', label: '576×1024', description: '竖屏9:16' },
  { value: '1280x720', label: '1280×720', description: 'HD横屏' },
  { value: '720x1280', label: '720×1280', description: 'HD竖屏' }
];

const cameraMovementOptions = [
  { value: 'static', label: '静止', description: '无摄像机运动' },
  { value: 'pan_left', label: '左移', description: '摄像机向左平移' },
  { value: 'pan_right', label: '右移', description: '摄像机向右平移' },
  { value: 'tilt_up', label: '上移', description: '摄像机向上倾斜' },
  { value: 'tilt_down', label: '下移', description: '摄像机向下倾斜' },
  { value: 'zoom_in', label: '拉近', description: '摄像机拉近镜头' },
  { value: 'zoom_out', label: '拉远', description: '摄像机拉远镜头' },
  { value: 'rotate_cw', label: '顺时针', description: '顺时针旋转' },
  { value: 'rotate_ccw', label: '逆时针', description: '逆时针旋转' }
];

const qualityOptions = [
  { value: 'draft', label: '草图', description: '快速生成，质量较低' },
  { value: 'standard', label: '标准', description: '平衡质量与速度' },
  { value: 'high', label: '高质量', description: '高质量，生成较慢' },
  { value: 'cinematic', label: '电影级', description: '最高质量，生成最慢' }
];

export default function VideoParametersForm({
  value,
  onChange,
  disabled = false,
  className = ''
}: VideoParametersFormProps) {
  const updateParameter = (key: keyof VideoParameters, paramValue: any) => {
    onChange({
      ...value,
      [key]: paramValue
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <AdjustmentsHorizontalIcon className="h-6 w-6 text-neon-pink" />
        <h3 className="text-lg font-semibold text-gray-200">视频生成参数</h3>
        <FilmIcon className="h-5 w-5 text-neon-cyan" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 时长设置 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            视频时长 (秒)
            <span className="ml-2 text-xs text-gray-500">
              ({value.duration || 10}s)
            </span>
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="2"
              max="30"
              step="1"
              value={value.duration || 10}
              onChange={(e) => updateParameter('duration', parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>2秒</span>
              <span>30秒</span>
            </div>
          </div>
        </div>

        {/* 帧率设置 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            帧率 (FPS)
          </label>
          <select
            value={value.fps || 24}
            onChange={(e) => updateParameter('fps', parseInt(e.target.value))}
            disabled={disabled}
            className="input-primary w-full"
          >
            <option value={12}>12 FPS - 低帧率</option>
            <option value={24}>24 FPS - 电影标准</option>
            <option value={30}>30 FPS - 高帧率</option>
            <option value={60}>60 FPS - 超高帧率</option>
          </select>
        </div>

        {/* 分辨率 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            视频分辨率
          </label>
          <select
            value={value.resolution || '1024x576'}
            onChange={(e) => updateParameter('resolution', e.target.value)}
            disabled={disabled}
            className="input-primary w-full"
          >
            {resolutionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* 质量设置 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            生成质量
          </label>
          <select
            value={value.quality || 'standard'}
            onChange={(e) => updateParameter('quality', e.target.value)}
            disabled={disabled}
            className="input-primary w-full"
          >
            {qualityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* 运动强度 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            运动强度
            <span className="ml-2 text-xs text-gray-500">
              ({value.motion_strength || 5})
            </span>
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={value.motion_strength || 5}
              onChange={(e) => updateParameter('motion_strength', parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>轻微运动</span>
              <span>剧烈运动</span>
            </div>
          </div>
        </div>

        {/* 摄像机运动 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            摄像机运动
          </label>
          <select
            value={value.camera_movement || 'static'}
            onChange={(e) => updateParameter('camera_movement', e.target.value)}
            disabled={disabled}
            className="input-primary w-full"
          >
            {cameraMovementOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* 引导强度 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            引导强度
            <span className="ml-2 text-xs text-gray-500">
              ({value.guidance_scale || 15})
            </span>
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="5"
              max="25"
              step="0.5"
              value={value.guidance_scale || 15}
              onChange={(e) => updateParameter('guidance_scale', parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>创意性强</span>
              <span>严格遵循</span>
            </div>
          </div>
        </div>

        {/* 推理步数 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            推理步数
            <span className="ml-2 text-xs text-gray-500">
              ({value.num_inference_steps || 25})
            </span>
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={value.num_inference_steps || 25}
              onChange={(e) => updateParameter('num_inference_steps', parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>速度快</span>
              <span>质量高</span>
            </div>
          </div>
        </div>

        {/* 随机种子 */}
        <div className="space-y-3 md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">
            随机种子 (可选)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={value.seed || ''}
              onChange={(e) => updateParameter('seed', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="留空为随机生成"
              disabled={disabled}
              className="input-primary flex-1"
              min="0"
              max="4294967295"
            />
            <motion.button
              type="button"
              onClick={() => updateParameter('seed', Math.floor(Math.random() * 4294967295))}
              disabled={disabled}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-neon-pink/20 border border-neon-pink/30 rounded-lg text-neon-pink hover:bg-neon-pink/30 transition-colors text-sm"
            >
              随机
            </motion.button>
          </div>
          <p className="text-xs text-gray-500">
            相同种子会产生相似的结果，用于复现效果
          </p>
        </div>
      </div>

      {/* 预计生成时间提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
      >
        <h4 className="text-sm font-medium text-yellow-400 mb-2">⏱️ 生成时间预估</h4>
        <div className="text-xs text-yellow-300 space-y-1">
          <p>基于当前设置，预计生成时间：</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>时长影响：{value.duration || 10}秒 × 2倍</div>
            <div>质量影响：{
              value.quality === 'draft' ? '0.5倍' :
              value.quality === 'standard' ? '1倍' :
              value.quality === 'high' ? '2倍' : '3倍'
            }</div>
            <div>推理步数：{value.num_inference_steps || 25}步</div>
            <div>预计时间：{Math.ceil(((value.duration || 10) * 
              (value.quality === 'draft' ? 0.5 : 
               value.quality === 'standard' ? 1 : 
               value.quality === 'high' ? 2 : 3) * 
              (value.num_inference_steps || 25) / 25))}分钟</div>
          </div>
        </div>
      </motion.div>

      {/* 参数预览 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-dark-bg-secondary/50 rounded-lg p-4 border border-gray-600"
      >
        <h4 className="text-sm font-medium text-gray-300 mb-3">参数预览</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-gray-500">时长:</span>
            <span className="ml-1 text-gray-300">{value.duration || 10}秒</span>
          </div>
          <div>
            <span className="text-gray-500">帧率:</span>
            <span className="ml-1 text-gray-300">{value.fps || 24} FPS</span>
          </div>
          <div>
            <span className="text-gray-500">分辨率:</span>
            <span className="ml-1 text-gray-300">{value.resolution || '1024x576'}</span>
          </div>
          <div>
            <span className="text-gray-500">运动强度:</span>
            <span className="ml-1 text-gray-300">{value.motion_strength || 5}</span>
          </div>
          <div>
            <span className="text-gray-500">摄像机:</span>
            <span className="ml-1 text-gray-300">
              {cameraMovementOptions.find(c => c.value === value.camera_movement)?.label || '静止'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">种子:</span>
            <span className="ml-1 text-gray-300">{value.seed || '随机'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}