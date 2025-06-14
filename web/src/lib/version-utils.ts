/**
 * 版本控制工具函数 - 一位小数版本方案
 */

// 版本号格式验证 - 允许一位小数
export const validateVersionFormat = (version: string | number): boolean => {
  if (typeof version === 'number') {
    // 检查是否为有效的一位小数（如 1.0, 1.1, 1.6 等）
    return version > 0 && Number((version * 10) % 1) === 0;
  }
  
  if (typeof version === 'string') {
    const trimmed = version.trim();
    // 匹配格式：整数或一位小数（如 "1", "1.0", "1.6"）
    const regex = /^\d+(\.\d)?$/;
    if (!regex.test(trimmed)) return false;
    
    const num = parseFloat(trimmed);
    return num > 0 && Number((num * 10) % 1) === 0;
  }
  
  return false;
};

// 版本号比较（返回 1: v1 > v2, 0: v1 = v2, -1: v1 < v2）
export const compareVersions = (v1: string | number, v2: string | number): number => {
  const num1 = typeof v1 === 'number' ? v1 : parseFloat(v1.toString());
  const num2 = typeof v2 === 'number' ? v2 : parseFloat(v2.toString());
  
  if (num1 > num2) return 1;
  if (num1 < num2) return -1;
  return 0;
};

// 检查版本是否可以递增
export const canIncrementVersion = (currentVersion: string | number, newVersion: string | number): boolean => {
  if (!validateVersionFormat(currentVersion) || !validateVersionFormat(newVersion)) {
    return false;
  }
  
  return compareVersions(newVersion, currentVersion) > 0;
};

// 建议下一个版本号 - 支持0.1和1.0增量
export const suggestNextVersion = (currentVersion: string | number, increment: 'minor' | 'major' = 'minor'): number => {
  const current = typeof currentVersion === 'number' 
    ? currentVersion 
    : parseFloat(currentVersion.toString());
    
  if (isNaN(current)) return 1.0;
  
  if (increment === 'minor') {
    // +0.1 增量
    return Math.round((current + 0.1) * 10) / 10;
  } else {
    // +1.0 增量
    return Math.round((current + 1.0) * 10) / 10;
  }
};

// 格式化版本号显示 - 保持一位小数格式
export const formatVersionFromInt = (version: number): string => {
  return version.toFixed(1);
};

// 通用版本号显示格式化函数 - 统一显示为小数格式
export const formatVersionDisplay = (version: string | number | undefined): string => {
  if (version === undefined || version === null) {
    return '1.0';
  }
  
  const numVersion = typeof version === 'number' ? version : parseFloat(version.toString());
  
  if (isNaN(numVersion)) {
    return '1.0';
  }
  
  return numVersion.toFixed(1);
};

// 解析版本号为数字 - 保持小数精度，确保一位小数格式
export const parseVersionToInt = (version: string | number): number => {
  if (typeof version === 'number') {
    return Math.max(1.0, Math.round(version * 10) / 10);
  }
  
  const parsed = parseFloat(version.toString());
  const result = isNaN(parsed) ? 1.0 : Math.max(1.0, Math.round(parsed * 10) / 10);
  
  // 确保返回的是一位小数格式
  return Math.round(result * 10) / 10;
};

// 版本验证错误消息
export const getVersionValidationMessage = (currentVersion: string | number, newVersion: string | number): string | null => {
  if (!validateVersionFormat(newVersion)) {
    return '版本号必须是正数，支持一位小数（如：1.0, 1.6, 2.0）';
  }
  
  if (!canIncrementVersion(currentVersion, newVersion)) {
    const current = typeof currentVersion === 'number' ? currentVersion : parseFloat(currentVersion.toString());
    return `新版本号必须大于当前版本 ${formatVersionFromInt(current)}`;
  }
  
  return null;
};

// 版本历史排序 - 按数字降序
export const sortVersions = (versions: (string | number)[]): number[] => {
  return versions
    .map(v => parseVersionToInt(v))
    .sort((a, b) => b - a); // 降序排列
};

// 获取版本变更类型 - 基于小数增量
export const getChangeType = (oldVersion: string | number, newVersion: string | number): 'major' | 'minor' => {
  const oldNum = parseVersionToInt(oldVersion);
  const newNum = parseVersionToInt(newVersion);
  const diff = newNum - oldNum;
  
  // 如果版本号增加超过或等于1.0，认为是大版本更新
  return diff >= 1.0 ? 'major' : 'minor';
}; 