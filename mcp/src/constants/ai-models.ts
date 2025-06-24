/**
 * AI模型常量定义
 * 与前端web/src/constants/ai-models.ts保持一致
 */

// 模型类型枚举
export enum ModelType {
  TEXT = 'text',           // 文本生成
  IMAGE = 'image',         // 图像生成  
  AUDIO = 'audio',         // 音频生成
  VIDEO = 'video',         // 视频生成
  MULTIMODAL = 'multimodal', // 多模态
  CODE = 'code',           // 代码生成
  EMBEDDING = 'embedding', // 向量嵌入
}

// 模型能力枚举
export enum ModelCapability {
  CHAT = 'chat',               // 对话
  COMPLETION = 'completion',   // 文本补全
  GENERATION = 'generation',   // 内容生成
  ANALYSIS = 'analysis',       // 分析理解
  TRANSLATION = 'translation', // 翻译
  REASONING = 'reasoning',     // 推理
  CREATIVE = 'creative',       // 创意创作
  CODING = 'coding',          // 编程
  VISION = 'vision',          // 视觉理解
  AUDIO_TO_TEXT = 'audio_to_text', // 语音转文字
  TEXT_TO_AUDIO = 'text_to_audio', // 文字转语音
}

// 模型规模枚举
export enum ModelScale {
  SMALL = 'small',     // 小型模型 (<7B参数)
  MEDIUM = 'medium',   // 中型模型 (7B-13B参数)
  LARGE = 'large',     // 大型模型 (13B-70B参数)
  XLARGE = 'xlarge',   // 超大型模型 (>70B参数)
}

// 部署方式枚举
export enum DeploymentType {
  API = 'api',           // API调用
  OPEN_SOURCE = 'open_source', // 开源模型
  LOCAL = 'local',       // 本地部署
  CLOUD = 'cloud',       // 云端部署
}

// 模型标签接口
export interface ModelTag {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  capabilities: ModelCapability[];
  scale?: ModelScale;
  deployment?: DeploymentType;
  color?: string; // UI显示颜色（MCP服务器可选）
}

// 预定义模型标签（与前端完全一致）
export const MODEL_TAGS: ModelTag[] = [
  // 文本模型类型
  {
    id: 'llm-large',
    name: '大型语言模型',
    description: '70B+参数的大型语言模型，如GPT-4、Claude等',
    type: ModelType.TEXT,
    capabilities: [ModelCapability.CHAT, ModelCapability.REASONING, ModelCapability.CREATIVE],
    scale: ModelScale.XLARGE,
    deployment: DeploymentType.API,
    color: 'text-blue-400',
  },
  {
    id: 'llm-medium',
    name: '中型语言模型',
    description: '7B-70B参数的中型语言模型',
    type: ModelType.TEXT,
    capabilities: [ModelCapability.CHAT, ModelCapability.COMPLETION, ModelCapability.CREATIVE],
    scale: ModelScale.LARGE,
    deployment: DeploymentType.OPEN_SOURCE,
    color: 'text-green-400',
  },
  {
    id: 'llm-small',
    name: '小型语言模型',
    description: '7B以下参数的轻量级模型，适合本地部署',
    type: ModelType.TEXT,
    capabilities: [ModelCapability.CHAT, ModelCapability.COMPLETION],
    scale: ModelScale.SMALL,
    deployment: DeploymentType.LOCAL,
    color: 'text-yellow-400',
  },
  
  // 代码模型
  {
    id: 'code-specialized',
    name: '代码专用模型',
    description: '专门针对编程任务优化的模型',
    type: ModelType.CODE,
    capabilities: [ModelCapability.CODING, ModelCapability.ANALYSIS],
    color: 'text-cyan-400',
  },
  
  // 图像模型
  {
    id: 'image-generation',
    name: '图像生成模型',
    description: '文本转图像生成模型',
    type: ModelType.IMAGE,
    capabilities: [ModelCapability.GENERATION, ModelCapability.CREATIVE],
    color: 'text-purple-400',
  },
  {
    id: 'image-analysis',
    name: '图像理解模型',
    description: '图像分析和理解模型',
    type: ModelType.IMAGE,
    capabilities: [ModelCapability.VISION, ModelCapability.ANALYSIS],
    color: 'text-pink-400',
  },
  
  // 多模态模型
  {
    id: 'multimodal-vision',
    name: '视觉多模态模型',
    description: '同时处理文本和图像的多模态模型',
    type: ModelType.MULTIMODAL,
    capabilities: [ModelCapability.VISION, ModelCapability.CHAT, ModelCapability.ANALYSIS],
    color: 'text-indigo-400',
  },
  
  // 音频模型
  {
    id: 'audio-stt',
    name: '语音转文字模型',
    description: '语音识别和转录模型',
    type: ModelType.AUDIO,
    capabilities: [ModelCapability.AUDIO_TO_TEXT],
    color: 'text-orange-400',
  },
  {
    id: 'audio-tts',
    name: '文字转语音模型',
    description: '文本转语音合成模型',
    type: ModelType.AUDIO,
    capabilities: [ModelCapability.TEXT_TO_AUDIO],
    color: 'text-red-400',
  },
  {
    id: 'audio-generation',
    name: '音频生成模型',
    description: '音乐和音效生成模型',
    type: ModelType.AUDIO,
    capabilities: [ModelCapability.GENERATION, ModelCapability.CREATIVE],
    color: 'text-amber-400',
  },
  
  // 视频模型
  {
    id: 'video-generation',
    name: '视频生成模型',
    description: '文本转视频和视频编辑模型',
    type: ModelType.VIDEO,
    capabilities: [ModelCapability.GENERATION, ModelCapability.CREATIVE],
    color: 'text-emerald-400',
  },
  
  // 特殊能力
  {
    id: 'translation-specialized',
    name: '翻译专用模型',
    description: '专门针对翻译任务优化的模型',
    type: ModelType.TEXT,
    capabilities: [ModelCapability.TRANSLATION],
    color: 'text-teal-400',
  },
  {
    id: 'reasoning-specialized',
    name: '推理专用模型',
    description: '专门针对逻辑推理和数学计算的模型',
    type: ModelType.TEXT,
    capabilities: [ModelCapability.REASONING, ModelCapability.ANALYSIS],
    color: 'text-violet-400',
  },
];

// 模型ID到名称的映射（便于MCP工具使用）
export const MODEL_ID_TO_NAME_MAP: Record<string, string> = {
  'llm-large': '大型语言模型',
  'llm-medium': '中型语言模型', 
  'llm-small': '小型语言模型',
  'code-specialized': '代码专用模型',
  'image-generation': '图像生成模型',
  'image-analysis': '图像理解模型',
  'multimodal-vision': '视觉多模态模型',
  'audio-stt': '语音转文字模型',
  'audio-tts': '文字转语音模型',
  'audio-generation': '音频生成模型',
  'video-generation': '视频生成模型',
  'translation-specialized': '翻译专用模型',
  'reasoning-specialized': '推理专用模型',
};

// 具体模型名称到标签ID的映射（用于智能分析）
export const SPECIFIC_MODEL_TO_TAG_MAP: Record<string, string[]> = {
  // 大型语言模型
  'GPT-4': ['llm-large'],
  'GPT-4-Turbo': ['llm-large'],
  'Claude': ['llm-large'],
  'Claude-3': ['llm-large'],
  
  // 中型语言模型
  'GPT-3.5': ['llm-medium'],
  'Claude-Instant': ['llm-medium'],
  'Gemini': ['llm-medium'],
  
  // 代码模型
  'GitHub Copilot': ['code-specialized'],
  'CodeLlama': ['code-specialized'],
  
  // 图像模型
  'DALL-E': ['image-generation'],
  'Midjourney': ['image-generation'],
  'Stable Diffusion': ['image-generation'],
  
  // 音频模型
  'Whisper': ['audio-stt'],
  'MusicLM': ['audio-generation'],
  
  // 视频模型
  'Runway': ['video-generation'],
  'Pika': ['video-generation'],
  
  // 翻译模型
  'Google Translate': ['translation-specialized'],
  'DeepL': ['translation-specialized'],
};

// 根据类型获取模型标签
export const getModelTagsByType = (type: ModelType): ModelTag[] => {
  return MODEL_TAGS.filter(tag => tag.type === type);
};

// 根据能力获取模型标签
export const getModelTagsByCapability = (capability: ModelCapability): ModelTag[] => {
  return MODEL_TAGS.filter(tag => tag.capabilities.includes(capability));
};

// 获取默认模型标签（用于各种场景的默认值）
export const getDefaultModelTags = (): string[] => {
  return ['llm-large', 'llm-medium', 'llm-small'];
};

// 根据内容特征智能推荐模型标签
export const suggestModelTagsByContent = (content: string): string[] => {
  const lowerContent = content.toLowerCase();
  const suggestedTags: Set<string> = new Set();
  
  // 默认添加基础文本模型
  suggestedTags.add('llm-large');
  suggestedTags.add('llm-medium');
  
  // 根据内容特征添加特定模型
  if (/图像|图片|画|绘制|视觉|图形/.test(lowerContent)) {
    suggestedTags.add('image-generation');
    suggestedTags.add('image-analysis');
    suggestedTags.add('multimodal-vision');
  }
  
  if (/代码|编程|程序|bug|算法/.test(lowerContent)) {
    suggestedTags.add('code-specialized');
  }
  
  if (/音频|音乐|声音|语音/.test(lowerContent)) {
    suggestedTags.add('audio-stt');
    suggestedTags.add('audio-tts');
    suggestedTags.add('audio-generation');
  }
  
  if (/视频|影像|动画/.test(lowerContent)) {
    suggestedTags.add('video-generation');
  }
  
  if (/翻译|多语言|语言转换/.test(lowerContent)) {
    suggestedTags.add('translation-specialized');
  }
  
  if (/推理|逻辑|数学|计算|分析/.test(lowerContent)) {
    suggestedTags.add('reasoning-specialized');
  }
  
  // 根据复杂度判断
  if (content.length > 1000 || /复杂|高级|专业/.test(lowerContent)) {
    suggestedTags.add('llm-large');
  } else {
    suggestedTags.add('llm-small');
  }
  
  return Array.from(suggestedTags).slice(0, 8); // 限制返回数量
};

// 将模型标签ID转换为显示名称
export const getModelDisplayNames = (tagIds: string[]): string[] => {
  return tagIds.map(id => MODEL_ID_TO_NAME_MAP[id] || id);
};

// 验证模型标签ID是否有效
export const isValidModelTag = (tagId: string): boolean => {
  return MODEL_TAGS.some(tag => tag.id === tagId);
};

// 获取模型类型的中文标签
export const getModelTypeLabel = (type: ModelType): string => {
  const labels = {
    [ModelType.TEXT]: '文本模型',
    [ModelType.IMAGE]: '图像模型',
    [ModelType.AUDIO]: '音频模型',
    [ModelType.VIDEO]: '视频模型',
    [ModelType.MULTIMODAL]: '多模态模型',
    [ModelType.CODE]: '代码模型',
    [ModelType.EMBEDDING]: '嵌入模型',
  };
  return labels[type] || type;
};