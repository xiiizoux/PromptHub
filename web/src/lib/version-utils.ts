/**
 * 版本控制工具函数 - 整数递增版本方案
 */

// 版本号格式验证 - 只允许正整数
export const validateVersionFormat = (version: string | number): boolean => {
  if (typeof version === 'number') {
    return Number.isInteger(version) && version > 0;
  }
  
  if (typeof version === 'string') {
    const num = parseInt(version, 10);
    return !isNaN(num) && num > 0 && num.toString() === version.trim();
  }
  
  return false;
};

// 版本号比较（返回 1: v1 > v2, 0: v1 = v2, -1: v1 < v2）
export const compareVersions = (v1: string | number, v2: string | number): number => {
  const num1 = typeof v1 === 'number' ? v1 : parseInt(v1.toString(), 10);
  const num2 = typeof v2 === 'number' ? v2 : parseInt(v2.toString(), 10);
  
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

// 建议下一个版本号 - 简单递增
export const suggestNextVersion = (currentVersion: string | number): number => {
  const current = typeof currentVersion === 'number' 
    ? currentVersion 
    : parseInt(currentVersion.toString(), 10);
    
  return isNaN(current) ? 1 : current + 1;
};

// 格式化版本号显示 - 直接返回整数
export const formatVersionFromInt = (version: number): string => {
  return version.toString();
};

// 解析版本号为整数 - 保持原值
export const parseVersionToInt = (version: string | number): number => {
  if (typeof version === 'number') {
    return Math.max(1, Math.floor(version));
  }
  
  const parsed = parseInt(version.toString(), 10);
  return isNaN(parsed) ? 1 : Math.max(1, parsed);
};

// 版本验证错误消息
export const getVersionValidationMessage = (currentVersion: string | number, newVersion: string | number): string | null => {
  if (!validateVersionFormat(newVersion)) {
    return '版本号必须是正整数（如：1, 2, 3）';
  }
  
  if (!canIncrementVersion(currentVersion, newVersion)) {
    const current = typeof currentVersion === 'number' ? currentVersion : parseInt(currentVersion.toString(), 10);
    return `新版本号必须大于当前版本 ${current}`;
  }
  
  return null;
};

// 版本历史排序 - 按数字降序
export const sortVersions = (versions: (string | number)[]): number[] => {
  return versions
    .map(v => parseVersionToInt(v))
    .sort((a, b) => b - a); // 降序排列
};

// 获取版本变更类型 - 简化为递增类型
export const getChangeType = (oldVersion: string | number, newVersion: string | number): 'major' | 'minor' => {
  const oldNum = parseVersionToInt(oldVersion);
  const newNum = parseVersionToInt(newVersion);
  const diff = newNum - oldNum;
  
  // 如果版本号增加超过10，认为是大版本更新
  return diff >= 10 ? 'major' : 'minor';
}; 