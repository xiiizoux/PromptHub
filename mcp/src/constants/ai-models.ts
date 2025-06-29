/**
 * AI模型常量定义
 * 与前端web/src/constants/ai-models.ts保持一致
 * 按照对话、图像、视频三大类进行重新分类
 */

// 模型类型枚举 - 按照用户的分类方案重新设计
export enum ModelType {
  // 1. 对话模型 (Text & Dialogue Models)
  // 1.1 交互式对话模型 (Interactive Dialogue)
  CHAT_GENERAL = 'chat_general',                    // 通用聊天机器人
  CHAT_TASK_ORIENTED = 'chat_task_oriented',        // 任务导向型对话系统
  CHAT_QA = 'chat_qa',                             // 知识问答系统

  // 1.2 文本生成与处理模型 (Text Generation & Processing)
  TEXT_CONTENT_CREATION = 'text_content_creation',  // 内容创作
  TEXT_SUMMARIZATION = 'text_summarization',        // 文本摘要
  TEXT_TRANSLATION = 'text_translation',            // 机器翻译
  TEXT_CODE_GENERATION = 'text_code_generation',    // 代码生成

  // 1.3 文本理解与分析模型 (Text Understanding & Analysis)
  TEXT_SENTIMENT_ANALYSIS = 'text_sentiment_analysis', // 情感分析
  TEXT_NER = 'text_ner',                              // 命名实体识别
  TEXT_CLASSIFICATION = 'text_classification',         // 文本分类

  // 2. 图像模型 (Image Models)
  // 2.1 图像生成模型 (Image Generation)
  IMAGE_TEXT_TO_IMAGE = 'image_text_to_image',      // 文本到图像
  IMAGE_IMAGE_TO_IMAGE = 'image_image_to_image',    // 图像到图像

  // 2.2 图像理解模型 (Image Understanding)
  IMAGE_CLASSIFICATION = 'image_classification',     // 图像分类
  IMAGE_OBJECT_DETECTION = 'image_object_detection', // 目标检测
  IMAGE_CAPTIONING = 'image_captioning',             // 图像描述
  IMAGE_OCR = 'image_ocr',                          // 光学字符识别

  // 3. 视频模型 (Video Models)
  // 3.1 视频生成模型 (Video Generation)
  VIDEO_TEXT_TO_VIDEO = 'video_text_to_video',      // 文本到视频
  VIDEO_IMAGE_TO_VIDEO = 'video_image_to_video',    // 图像到视频

  // 3.2 视频理解与分析模型 (Video Understanding & Analysis)
  VIDEO_ACTION_RECOGNITION = 'video_action_recognition', // 行为识别
  VIDEO_SUMMARIZATION = 'video_summarization',           // 视频摘要
  VIDEO_OBJECT_TRACKING = 'video_object_tracking',       // 目标跟踪

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

// 预定义模型标签（与前端完全一致）- 按照新的分类方案重新组织
export const MODEL_TAGS: ModelTag[] = [
  // ===== 1. 对话模型 (Text & Dialogue Models) =====

  // 1.1 交互式对话模型 (Interactive Dialogue)
  {
    id: 'chat-general-large',
    name: '大型通用聊天机器人',
    description: '如GPT-4、Claude等，具备强大的对话能力和知识储备',
    type: ModelType.CHAT_GENERAL,
    capabilities: [ModelCapability.CHAT, ModelCapability.REASONING, ModelCapability.CREATIVE],
    scale: ModelScale.XLARGE,
    deployment: DeploymentType.API,
    color: 'text-blue-400',
  },
  {
    id: 'chat-general-medium',
    name: '中型通用聊天机器人',
    description: '平衡性能和成本的通用对话模型',
    type: ModelType.CHAT_GENERAL,
    capabilities: [ModelCapability.CHAT, ModelCapability.COMPLETION],
    scale: ModelScale.LARGE,
    deployment: DeploymentType.OPEN_SOURCE,
    color: 'text-green-400',
  },
  {
    id: 'chat-task-oriented',
    name: '任务导向对话系统',
    description: '专门用于完成特定任务的对话系统，如订票、客服等',
    type: ModelType.CHAT_TASK_ORIENTED,
    capabilities: [ModelCapability.CHAT, ModelCapability.ANALYSIS],
    color: 'text-cyan-400',
  },
  {
    id: 'chat-qa-system',
    name: '知识问答系统',
    description: '基于知识库的精确问答系统',
    type: ModelType.CHAT_QA,
    capabilities: [ModelCapability.CHAT, ModelCapability.REASONING, ModelCapability.ANALYSIS],
    color: 'text-indigo-400',
  },

  // 1.2 文本生成与处理模型 (Text Generation & Processing)
  {
    id: 'text-content-creation',
    name: '内容创作模型',
    description: '专门用于生成文章、广告文案、诗歌等创意内容',
    type: ModelType.TEXT_CONTENT_CREATION,
    capabilities: [ModelCapability.GENERATION, ModelCapability.CREATIVE],
    color: 'text-purple-400',
  },
  {
    id: 'text-summarization',
    name: '文本摘要模型',
    description: '将长篇文章或对话精炼成简短摘要',
    type: ModelType.TEXT_SUMMARIZATION,
    capabilities: [ModelCapability.ANALYSIS, ModelCapability.GENERATION],
    color: 'text-orange-400',
  },
  {
    id: 'text-translation',
    name: '机器翻译模型',
    description: '在不同语言之间进行高质量转换',
    type: ModelType.TEXT_TRANSLATION,
    capabilities: [ModelCapability.TRANSLATION],
    color: 'text-teal-400',
  },
  {
    id: 'text-code-generation',
    name: '代码生成模型',
    description: '根据自然语言描述生成代码片段或完整程序',
    type: ModelType.TEXT_CODE_GENERATION,
    capabilities: [ModelCapability.CODING, ModelCapability.GENERATION],
    color: 'text-cyan-400',
  },

  // 1.3 文本理解与分析模型 (Text Understanding & Analysis)
  {
    id: 'text-sentiment-analysis',
    name: '情感分析模型',
    description: '判断文本所表达的情绪（正面、负面、中性）',
    type: ModelType.TEXT_SENTIMENT_ANALYSIS,
    capabilities: [ModelCapability.ANALYSIS],
    color: 'text-pink-400',
  },
  {
    id: 'text-ner',
    name: '命名实体识别模型',
    description: '识别并分类文本中的特定实体（人名、地名、组织等）',
    type: ModelType.TEXT_NER,
    capabilities: [ModelCapability.ANALYSIS],
    color: 'text-yellow-400',
  },
  {
    id: 'text-classification',
    name: '文本分类模型',
    description: '将文本自动归入预设的类别中',
    type: ModelType.TEXT_CLASSIFICATION,
    capabilities: [ModelCapability.ANALYSIS],
    color: 'text-red-400',
  },

  // ===== 2. 图像模型 (Image Models) =====

  // 2.1 图像生成模型 (Image Generation)
  {
    id: 'image-text-to-image',
    name: '文本到图像生成',
    description: '根据文本描述生成对应的图像，如Midjourney、DALL-E',
    type: ModelType.IMAGE_TEXT_TO_IMAGE,
    capabilities: [ModelCapability.GENERATION, ModelCapability.CREATIVE],
    color: 'text-purple-400',
  },
  {
    id: 'image-image-to-image',
    name: '图像到图像转换',
    description: '对现有图像进行风格转换、编辑或修复',
    type: ModelType.IMAGE_IMAGE_TO_IMAGE,
    capabilities: [ModelCapability.GENERATION, ModelCapability.CREATIVE],
    color: 'text-violet-400',
  },

  // 2.2 图像理解模型 (Image Understanding)
  {
    id: 'image-classification',
    name: '图像分类模型',
    description: '判断图像属于哪个类别',
    type: ModelType.IMAGE_CLASSIFICATION,
    capabilities: [ModelCapability.VISION, ModelCapability.ANALYSIS],
    color: 'text-blue-400',
  },
  {
    id: 'image-object-detection',
    name: '目标检测模型',
    description: '在图像中定位并识别出多个物体',
    type: ModelType.IMAGE_OBJECT_DETECTION,
    capabilities: [ModelCapability.VISION, ModelCapability.ANALYSIS],
    color: 'text-green-400',
  },
  {
    id: 'image-captioning',
    name: '图像描述模型',
    description: '用自然语言描述图像内容',
    type: ModelType.IMAGE_CAPTIONING,
    capabilities: [ModelCapability.VISION, ModelCapability.GENERATION],
    color: 'text-indigo-400',
  },
  {
    id: 'image-ocr',
    name: '光学字符识别模型',
    description: '识别图像中的文字内容',
    type: ModelType.IMAGE_OCR,
    capabilities: [ModelCapability.VISION, ModelCapability.ANALYSIS],
    color: 'text-orange-400',
  },

  // ===== 3. 视频模型 (Video Models) =====

  // 3.1 视频生成模型 (Video Generation)
  {
    id: 'video-text-to-video',
    name: '文本到视频生成',
    description: '根据文本描述生成视频，如Sora、Lumiere',
    type: ModelType.VIDEO_TEXT_TO_VIDEO,
    capabilities: [ModelCapability.GENERATION, ModelCapability.CREATIVE],
    color: 'text-emerald-400',
  },
  {
    id: 'video-image-to-video',
    name: '图像到视频转换',
    description: '让静态图像动起来，制作成动态视频',
    type: ModelType.VIDEO_IMAGE_TO_VIDEO,
    capabilities: [ModelCapability.GENERATION, ModelCapability.CREATIVE],
    color: 'text-teal-400',
  },

  // 3.2 视频理解与分析模型 (Video Understanding & Analysis)
  {
    id: 'video-action-recognition',
    name: '行为识别模型',
    description: '识别视频中人物或物体的动作',
    type: ModelType.VIDEO_ACTION_RECOGNITION,
    capabilities: [ModelCapability.VISION, ModelCapability.ANALYSIS],
    color: 'text-cyan-400',
  },
  {
    id: 'video-summarization',
    name: '视频摘要模型',
    description: '自动生成长视频的精彩集锦或摘要',
    type: ModelType.VIDEO_SUMMARIZATION,
    capabilities: [ModelCapability.ANALYSIS, ModelCapability.GENERATION],
    color: 'text-lime-400',
  },
  {
    id: 'video-object-tracking',
    name: '目标跟踪模型',
    description: '在视频序列中持续追踪特定目标',
    type: ModelType.VIDEO_OBJECT_TRACKING,
    capabilities: [ModelCapability.VISION, ModelCapability.ANALYSIS],
    color: 'text-amber-400',
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

// 分类类型到模型类型的映射
export const CATEGORY_TYPE_TO_MODEL_TYPES: Record<string, ModelType[]> = {
  chat: [
    ModelType.CHAT_GENERAL,
    ModelType.CHAT_TASK_ORIENTED,
    ModelType.CHAT_QA,
    ModelType.TEXT_CONTENT_CREATION,
    ModelType.TEXT_SUMMARIZATION,
    ModelType.TEXT_TRANSLATION,
    ModelType.TEXT_CODE_GENERATION,
    ModelType.TEXT_SENTIMENT_ANALYSIS,
    ModelType.TEXT_NER,
    ModelType.TEXT_CLASSIFICATION,
  ],
  image: [
    ModelType.IMAGE_TEXT_TO_IMAGE,
    ModelType.IMAGE_IMAGE_TO_IMAGE,
    ModelType.IMAGE_CLASSIFICATION,
    ModelType.IMAGE_OBJECT_DETECTION,
    ModelType.IMAGE_CAPTIONING,
    ModelType.IMAGE_OCR,
  ],
  video: [
    ModelType.VIDEO_TEXT_TO_VIDEO,
    ModelType.VIDEO_IMAGE_TO_VIDEO,
    ModelType.VIDEO_ACTION_RECOGNITION,
    ModelType.VIDEO_SUMMARIZATION,
    ModelType.VIDEO_OBJECT_TRACKING,
  ],
};

// 根据分类类型获取对应的模型标签
export const getModelTagsByCategoryType = (categoryType: 'chat' | 'image' | 'video'): ModelTag[] => {
  const modelTypes = CATEGORY_TYPE_TO_MODEL_TYPES[categoryType] || [];
  return MODEL_TAGS.filter(tag => modelTypes.includes(tag.type));
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
  const labels: Record<string, string> = {
    // 对话模型
    [ModelType.CHAT_GENERAL]: '通用聊天',
    [ModelType.CHAT_TASK_ORIENTED]: '任务导向对话',
    [ModelType.CHAT_QA]: '知识问答',
    [ModelType.TEXT_CONTENT_CREATION]: '内容创作',
    [ModelType.TEXT_SUMMARIZATION]: '文本摘要',
    [ModelType.TEXT_TRANSLATION]: '机器翻译',
    [ModelType.TEXT_CODE_GENERATION]: '代码生成',
    [ModelType.TEXT_SENTIMENT_ANALYSIS]: '情感分析',
    [ModelType.TEXT_NER]: '命名实体识别',
    [ModelType.TEXT_CLASSIFICATION]: '文本分类',

    // 图像模型
    [ModelType.IMAGE_TEXT_TO_IMAGE]: '文本到图像',
    [ModelType.IMAGE_IMAGE_TO_IMAGE]: '图像到图像',
    [ModelType.IMAGE_CLASSIFICATION]: '图像分类',
    [ModelType.IMAGE_OBJECT_DETECTION]: '目标检测',
    [ModelType.IMAGE_CAPTIONING]: '图像描述',
    [ModelType.IMAGE_OCR]: '光学字符识别',

    // 视频模型
    [ModelType.VIDEO_TEXT_TO_VIDEO]: '文本到视频',
    [ModelType.VIDEO_IMAGE_TO_VIDEO]: '图像到视频',
    [ModelType.VIDEO_ACTION_RECOGNITION]: '行为识别',
    [ModelType.VIDEO_SUMMARIZATION]: '视频摘要',
    [ModelType.VIDEO_OBJECT_TRACKING]: '目标跟踪',

  };
  return labels[type] || type;
};