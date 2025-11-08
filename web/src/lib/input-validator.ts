/**
 * 输入验证和数据清理工具
 * 提供统一的输入验证、数据清理和安全检查功能
 */

import { logger } from './error-handler';

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

// 验证规则接口
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'uuid';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  customValidator?: (value: any) => boolean | string;
}

// 常用正则表达式
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  SAFE_STRING: /^[a-zA-Z0-9\u4e00-\u9fa5_\-\s.!?，。！？]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE: /^1[3-9]\d{9}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
};

/**
 * 数据清理函数
 */
export class DataSanitizer {
  /**
   * 清理HTML标签和危险字符
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') {return '';}
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除script标签
      .replace(/<[^>]*>/g, '') // 移除所有HTML标签
      .replace(/javascript:/gi, '') // 移除javascript:协议
      .replace(/on\w+\s*=/gi, '') // 移除事件处理器
      .trim();
  }

  /**
   * 清理SQL注入字符
   */
  static sanitizeSql(input: string): string {
    if (typeof input !== 'string') {return '';}
    
    return input
      .replace(/['"`;\\]/g, '') // 移除SQL特殊字符
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b/gi, '') // 移除SQL关键字
      .trim();
  }

  /**
   * 清理XSS攻击字符
   */
  static sanitizeXss(input: string): string {
    if (typeof input !== 'string') {return '';}
    
    return input
      .replace(/[<>'"&]/g, (match) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return entities[match] || match;
      });
  }

  /**
   * 通用字符串清理
   */
  static sanitizeString(input: string, options: {
    removeHtml?: boolean;
    removeSql?: boolean;
    removeXss?: boolean;
    maxLength?: number;
  } = {}): string {
    if (typeof input !== 'string') {return '';}
    
    let result = input.trim();
    
    if (options.removeHtml) {
      result = this.sanitizeHtml(result);
    }
    
    if (options.removeSql) {
      result = this.sanitizeSql(result);
    }
    
    if (options.removeXss) {
      result = this.sanitizeXss(result);
    }
    
    if (options.maxLength && result.length > options.maxLength) {
      result = result.substring(0, options.maxLength);
    }
    
    return result;
  }

  /**
   * 清理数组
   */
  static sanitizeArray(input: any[], itemSanitizer?: (item: any) => any): any[] {
    if (!Array.isArray(input)) {return [];}
    
    return input
      .filter(item => item !== null && item !== undefined)
      .map(item => itemSanitizer ? itemSanitizer(item) : item);
  }
}

/**
 * 输入验证器类
 */
export class InputValidator {
  /**
   * 验证单个字段
   */
  static validateField(value: any, rule: ValidationRule): string[] {
    const errors: string[] = [];
    const { field, required, type, minLength, maxLength, min, max, pattern, allowedValues, customValidator } = rule;

    // 检查必填字段
    if (required && (value === null || value === undefined || value === '')) {
      errors.push(`${field}是必填项`);
      return errors;
    }

    // 如果不是必填且值为空，跳过其他验证
    if (!required && (value === null || value === undefined || value === '')) {
      return errors;
    }

    // 类型验证
    if (type) {
      switch (type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${field}必须是字符串类型`);
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`${field}必须是有效数字`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${field}必须是布尔类型`);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`${field}必须是数组类型`);
          }
          break;
        case 'object':
          if (typeof value !== 'object' || Array.isArray(value) || value === null) {
            errors.push(`${field}必须是对象类型`);
          }
          break;
        case 'email':
          if (typeof value === 'string' && !PATTERNS.EMAIL.test(value)) {
            errors.push(`${field}必须是有效的邮箱地址`);
          }
          break;
        case 'uuid':
          if (typeof value === 'string' && !PATTERNS.UUID.test(value)) {
            errors.push(`${field}必须是有效的UUID格式`);
          }
          break;
      }
    }

    // 字符串长度验证
    if (typeof value === 'string') {
      if (minLength !== undefined && value.length < minLength) {
        errors.push(`${field}长度不能少于${minLength}个字符`);
      }
      if (maxLength !== undefined && value.length > maxLength) {
        errors.push(`${field}长度不能超过${maxLength}个字符`);
      }
    }

    // 数值范围验证
    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        errors.push(`${field}不能小于${min}`);
      }
      if (max !== undefined && value > max) {
        errors.push(`${field}不能大于${max}`);
      }
    }

    // 数组长度验证
    if (Array.isArray(value)) {
      if (minLength !== undefined && value.length < minLength) {
        errors.push(`${field}至少需要${minLength}个元素`);
      }
      if (maxLength !== undefined && value.length > maxLength) {
        errors.push(`${field}最多只能有${maxLength}个元素`);
      }
    }

    // 正则表达式验证
    if (pattern && typeof value === 'string' && !pattern.test(value)) {
      errors.push(`${field}格式不正确`);
    }

    // 允许值验证
    if (allowedValues && !allowedValues.includes(value)) {
      errors.push(`${field}必须是以下值之一: ${allowedValues.join(', ')}`);
    }

    // 自定义验证器
    if (customValidator) {
      const result = customValidator(value);
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : `${field}验证失败`);
      }
    }

    return errors;
  }

  /**
   * 验证对象
   */
  static validate(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    for (const rule of rules) {
      const value = data[rule.field];
      const fieldErrors = this.validateField(value, rule);
      errors.push(...fieldErrors);

      // 如果没有错误，进行数据清理
      if (fieldErrors.length === 0 && value !== undefined) {
        if (rule.type === 'string' && typeof value === 'string') {
          sanitizedData[rule.field] = DataSanitizer.sanitizeString(value, {
            removeHtml: true,
            removeXss: true,
            maxLength: rule.maxLength,
          });
        } else {
          sanitizedData[rule.field] = value;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined,
    };
  }
}

/**
 * 常用验证规则预设
 */
export const VALIDATION_PRESETS = {
  // 用户相关
  email: { field: 'email', required: true, type: 'email' as const, maxLength: 255 },
  password: { field: 'password', required: true, type: 'string' as const, minLength: 8, maxLength: 128, pattern: PATTERNS.PASSWORD },
  username: { field: 'username', required: true, type: 'string' as const, minLength: 3, maxLength: 20, pattern: PATTERNS.USERNAME },
  
  // 提示词相关
  promptName: { field: 'name', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
  promptDescription: { field: 'description', required: true, type: 'string' as const, minLength: 1, maxLength: 1000 },
  promptCategory: { field: 'category', required: true, type: 'string' as const, minLength: 1, maxLength: 50 },
  promptTags: { field: 'tags', required: false, type: 'array' as const, maxLength: 20 },
  promptContent: { field: 'content', required: true, type: 'string' as const, minLength: 1, maxLength: 10000 },
  
  // 通用
  id: { field: 'id', required: true, type: 'uuid' as const },
  userId: { field: 'user_id', required: true, type: 'uuid' as const },
  isPublic: { field: 'is_public', required: false, type: 'boolean' as const },
  version: { field: 'version', required: false, type: 'number' as const, min: 0, max: 999 },
};
