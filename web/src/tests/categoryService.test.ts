/**
 * 分类服务测试
 * 验证重构后的分类系统是否正常工作
 */

import { categoryService, CategoryInfo, CategoryDisplayInfo } from '@/services/categoryService';
import { getIconComponent } from '@/utils/categoryIcons';

// Mock API调用
jest.mock('@/lib/api', () => ({
  getCategories: jest.fn(),
}));

jest.mock('@/lib/error-handler', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { getCategories } from '@/lib/api';

const mockGetCategories = getCategories as jest.MockedFunction<typeof getCategories>;

describe('CategoryService', () => {
  beforeEach(() => {
    // 清除缓存
    categoryService.clearCache();
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('应该成功获取分类数据', async () => {
      const mockCategories = ['通用对话', '学术研究', '编程开发'];
      mockGetCategories.mockResolvedValue(mockCategories);

      const result = await categoryService.getCategories('chat');

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('通用对话');
      expect(result[0].type).toBe('chat');
      expect(mockGetCategories).toHaveBeenCalledWith('chat');
    });

    it('应该在API失败时返回空数组', async () => {
      mockGetCategories.mockRejectedValue(new Error('API失败'));

      const result = await categoryService.getCategories('chat');

      expect(result).toHaveLength(0); // 不再提供硬编码默认分类
    });

    it('应该使用缓存避免重复API调用', async () => {
      const mockCategories = ['通用对话', '学术研究'];
      mockGetCategories.mockResolvedValue(mockCategories);

      // 第一次调用
      await categoryService.getCategories('chat');
      // 第二次调用
      await categoryService.getCategories('chat');

      expect(mockGetCategories).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCategoryDisplayInfo', () => {
    it('应该返回正确的分类显示信息', () => {
      const displayInfo = categoryService.getCategoryDisplayInfo('编程开发');

      expect(displayInfo.name).toBe('编程开发');
      expect(displayInfo.color).toBeDefined();
      expect(displayInfo.iconName).toBeDefined();
    });

    it('应该为任何分类返回显示信息', () => {
      const displayInfo = categoryService.getCategoryDisplayInfo('测试分类');

      expect(displayInfo.name).toBe('测试分类');
      expect(displayInfo.color).toBeDefined();
      expect(displayInfo.iconName).toBeDefined();
    });

    it('应该基于关键词智能匹配图标', () => {
      const displayInfo = categoryService.getCategoryDisplayInfo('编程相关');

      expect(displayInfo.name).toBe('编程相关');
      expect(displayInfo.iconName).toBe('CodeBracketIcon');
    });
  });

  describe('getCategoryMap', () => {
    it('应该返回分类名称到CategoryInfo的映射', async () => {
      const mockCategories = ['测试分类1', '测试分类2'];
      mockGetCategories.mockResolvedValue(mockCategories);

      const categoryMap = await categoryService.getCategoryMap('chat');

      expect(categoryMap.size).toBe(2);
      expect(categoryMap.has('测试分类1')).toBe(true);
      expect(categoryMap.has('测试分类2')).toBe(true);

      const category = categoryMap.get('测试分类1');
      expect(category?.name).toBe('测试分类1');
      expect(category?.type).toBe('chat');
    });
  });

  describe('缓存功能', () => {
    it('应该正确清除缓存', async () => {
      const mockCategories = ['通用对话'];
      mockGetCategories.mockResolvedValue(mockCategories);

      // 第一次调用，建立缓存
      await categoryService.getCategories('chat');
      expect(mockGetCategories).toHaveBeenCalledTimes(1);

      // 清除缓存
      categoryService.clearCache();

      // 再次调用，应该重新请求API
      await categoryService.getCategories('chat');
      expect(mockGetCategories).toHaveBeenCalledTimes(2);
    });

    it('应该返回正确的缓存状态', () => {
      const status = categoryService.getCacheStatus();

      expect(status).toHaveProperty('categoriesCache');
      expect(status).toHaveProperty('categoryMapCache');
      expect(status).toHaveProperty('cacheTTL');
      expect(typeof status.cacheTTL).toBe('number');
    });
  });
});

describe('图标工具函数', () => {
  describe('getIconComponent', () => {
    it('应该返回正确的图标组件', () => {
      const IconComponent = getIconComponent('CodeBracketIcon');
      expect(IconComponent).toBeDefined();
      expect(typeof IconComponent).toBe('function');
    });

    it('应该为未知图标返回默认图标', () => {
      const IconComponent = getIconComponent('UnknownIcon');
      expect(IconComponent).toBeDefined();
      expect(typeof IconComponent).toBe('function');
    });
  });
});

describe('集成测试', () => {
  it('应该完整地处理分类数据流', async () => {
    const mockCategories = ['编程开发', '文案写作'];
    mockGetCategories.mockResolvedValue(mockCategories);

    // 获取分类
    const categories = await categoryService.getCategories('chat');
    expect(categories).toHaveLength(2);

    // 获取显示信息
    const displayInfo = categoryService.getCategoryDisplayInfo('编程开发');
    expect(displayInfo.name).toBe('编程开发');
    expect(displayInfo.iconName).toBe('CodeBracketIcon');

    // 获取图标组件
    const IconComponent = getIconComponent(displayInfo.iconName);
    expect(IconComponent).toBeDefined();
  });

  it('应该处理错误情况', async () => {
    mockGetCategories.mockRejectedValue(new Error('网络错误'));

    // API失败时应该返回空数组
    const categories = await categoryService.getCategories('chat');
    expect(categories.length).toBe(0);

    // 显示信息应该仍然可用（动态生成）
    const displayInfo = categoryService.getCategoryDisplayInfo('任意分类');
    expect(displayInfo.name).toBe('任意分类');
    expect(displayInfo.iconName).toBeDefined();
  });
});

describe('类型安全性', () => {
  it('CategoryInfo接口应该包含所有必需字段', async () => {
    const mockCategories = ['测试分类'];
    mockGetCategories.mockResolvedValue(mockCategories);

    const categories = await categoryService.getCategories('chat');
    const category = categories[0];

    expect(category).toHaveProperty('id');
    expect(category).toHaveProperty('name');
    expect(category).toHaveProperty('type');
    expect(category).toHaveProperty('sort_order');
    expect(category).toHaveProperty('is_active');
    
    expect(typeof category.id).toBe('string');
    expect(typeof category.name).toBe('string');
    expect(['chat', 'image', 'video']).toContain(category.type);
    expect(typeof category.sort_order).toBe('number');
    expect(typeof category.is_active).toBe('boolean');
  });

  it('CategoryDisplayInfo接口应该包含所有必需字段', () => {
    const displayInfo = categoryService.getCategoryDisplayInfo('编程开发');

    expect(displayInfo).toHaveProperty('name');
    expect(displayInfo).toHaveProperty('color');
    expect(displayInfo).toHaveProperty('gradient');
    expect(displayInfo).toHaveProperty('iconName');
    
    expect(typeof displayInfo.name).toBe('string');
    expect(typeof displayInfo.color).toBe('string');
    expect(typeof displayInfo.gradient).toBe('string');
    expect(typeof displayInfo.iconName).toBe('string');
  });
});
