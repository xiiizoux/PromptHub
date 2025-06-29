/**
 * AI模型分类和标签系统
 * 用于PromptHub的兼容模型选择
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

  // 4. 多模态融合模型 (Multimodal Models)
  MULTIMODAL_VQA = 'multimodal_vqa',                // 视觉问答
  MULTIMODAL_LMM = 'multimodal_lmm',                // 多模态大模型
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
  color: string; // 用于UI显示的颜色
}

// 预定义模型标签 - 按照新的分类方案重新组织
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

  // ===== 4. 多模态融合模型 (Multimodal Models) =====
  {
    id: 'multimodal-vqa',
    name: '视觉问答模型',
    description: '对图片或视频提出问题，模型用文本回答',
    type: ModelType.MULTIMODAL_VQA,
    capabilities: [ModelCapability.VISION, ModelCapability.CHAT, ModelCapability.ANALYSIS],
    color: 'text-indigo-400',
  },
  {
    id: 'multimodal-lmm',
    name: '多模态大模型',
    description: '能够接受文本、图像、音频等混合输入的大型模型，如GPT-4V、Gemini Pro Vision',
    type: ModelType.MULTIMODAL_LMM,
    capabilities: [ModelCapability.VISION, ModelCapability.CHAT, ModelCapability.REASONING, ModelCapability.ANALYSIS],
    scale: ModelScale.XLARGE,
    deployment: DeploymentType.API,
    color: 'text-purple-400',
  },
];

// 分类类型到模型类型的映射
export const CATEGORY_TYPE_TO_MODEL_TYPES = {
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
  multimodal: [
    ModelType.MULTIMODAL_VQA,
    ModelType.MULTIMODAL_LMM,
  ]
} as const;

// 根据分类类型获取对应的模型标签
export const getModelTagsByCategoryType = (categoryType: 'chat' | 'image' | 'video' | 'multimodal'): ModelTag[] => {
  const modelTypes = CATEGORY_TYPE_TO_MODEL_TYPES[categoryType] || [];
  return MODEL_TAGS.filter(tag => (modelTypes as readonly ModelType[]).includes(tag.type));
};

// 根据类型获取模型标签
export const getModelTagsByType = (type: ModelType): ModelTag[] => {
  return MODEL_TAGS.filter(tag => tag.type === type);
};

// 根据能力获取模型标签
export const getModelTagsByCapability = (capability: ModelCapability): ModelTag[] => {
  return MODEL_TAGS.filter(tag => tag.capabilities.includes(capability));
};

// 获取所有模型类型的选项
export const getModelTypeOptions = () => {
  return Object.values(ModelType).map(type => ({
    value: type,
    label: getModelTypeLabel(type),
    description: getModelTypeDescription(type),
  }));
};

// 获取模型类型的中文标签
export const getModelTypeLabel = (type: ModelType): string => {
  const labels = {
    // 对话模型
    [ModelType.CHAT_GENERAL]: '通用聊天机器人',
    [ModelType.CHAT_TASK_ORIENTED]: '任务导向对话系统',
    [ModelType.CHAT_QA]: '知识问答系统',
    [ModelType.TEXT_CONTENT_CREATION]: '内容创作模型',
    [ModelType.TEXT_SUMMARIZATION]: '文本摘要模型',
    [ModelType.TEXT_TRANSLATION]: '机器翻译模型',
    [ModelType.TEXT_CODE_GENERATION]: '代码生成模型',
    [ModelType.TEXT_SENTIMENT_ANALYSIS]: '情感分析模型',
    [ModelType.TEXT_NER]: '命名实体识别模型',
    [ModelType.TEXT_CLASSIFICATION]: '文本分类模型',

    // 图像模型
    [ModelType.IMAGE_TEXT_TO_IMAGE]: '文本到图像生成',
    [ModelType.IMAGE_IMAGE_TO_IMAGE]: '图像到图像转换',
    [ModelType.IMAGE_CLASSIFICATION]: '图像分类模型',
    [ModelType.IMAGE_OBJECT_DETECTION]: '目标检测模型',
    [ModelType.IMAGE_CAPTIONING]: '图像描述模型',
    [ModelType.IMAGE_OCR]: '光学字符识别模型',

    // 视频模型
    [ModelType.VIDEO_TEXT_TO_VIDEO]: '文本到视频生成',
    [ModelType.VIDEO_IMAGE_TO_VIDEO]: '图像到视频转换',
    [ModelType.VIDEO_ACTION_RECOGNITION]: '行为识别模型',
    [ModelType.VIDEO_SUMMARIZATION]: '视频摘要模型',
    [ModelType.VIDEO_OBJECT_TRACKING]: '目标跟踪模型',

    // 多模态模型
    [ModelType.MULTIMODAL_VQA]: '视觉问答模型',
    [ModelType.MULTIMODAL_LMM]: '多模态大模型',
  };
  return labels[type] || type;
};

// 获取模型类型的描述
export const getModelTypeDescription = (type: ModelType): string => {
  const descriptions = {
    // 对话模型
    [ModelType.CHAT_GENERAL]: '用于开放式、非特定主题的对话，具备一定的知识储备和上下文理解能力',
    [ModelType.CHAT_TASK_ORIENTED]: '为完成特定任务而设计，如预订、查询、客服等',
    [ModelType.CHAT_QA]: '基于给定的知识库或文档，精确回答用户提出的问题',
    [ModelType.TEXT_CONTENT_CREATION]: '生成文章、广告文案、诗歌、邮件等创意内容',
    [ModelType.TEXT_SUMMARIZATION]: '将长篇文章或对话精炼成简短的摘要',
    [ModelType.TEXT_TRANSLATION]: '在不同语言之间进行转换',
    [ModelType.TEXT_CODE_GENERATION]: '根据自然语言描述生成代码片段或完整程序',
    [ModelType.TEXT_SENTIMENT_ANALYSIS]: '判断文本所表达的情绪（正面、负面、中性）',
    [ModelType.TEXT_NER]: '识别并分类文本中的特定实体（人名、地名、组织等）',
    [ModelType.TEXT_CLASSIFICATION]: '将文本自动归入预设的类别中',

    // 图像模型
    [ModelType.IMAGE_TEXT_TO_IMAGE]: '根据文本描述生成对应的图像',
    [ModelType.IMAGE_IMAGE_TO_IMAGE]: '对现有图像进行风格转换、编辑或修复',
    [ModelType.IMAGE_CLASSIFICATION]: '判断图像属于哪个类别',
    [ModelType.IMAGE_OBJECT_DETECTION]: '在图像中定位并识别出多个物体',
    [ModelType.IMAGE_CAPTIONING]: '用自然语言描述图像内容',
    [ModelType.IMAGE_OCR]: '识别图像中的文字',

    // 视频模型
    [ModelType.VIDEO_TEXT_TO_VIDEO]: '根据文本描述生成视频',
    [ModelType.VIDEO_IMAGE_TO_VIDEO]: '让静态图像动起来',
    [ModelType.VIDEO_ACTION_RECOGNITION]: '识别视频中人物或物体的动作',
    [ModelType.VIDEO_SUMMARIZATION]: '自动生成长视频的精彩集锦或摘要',
    [ModelType.VIDEO_OBJECT_TRACKING]: '在视频序列中持续追踪特定目标',

    // 多模态模型
    [ModelType.MULTIMODAL_VQA]: '对一张图片或一段视频提出问题，模型用文本回答',
    [ModelType.MULTIMODAL_LMM]: '能够接受文本、图像、音频等混合输入，并进行复杂的推理和对话',
  };
  return descriptions[type] || '';
};