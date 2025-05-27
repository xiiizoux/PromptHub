/**
 * 版本控制工具函数
 */

// 版本号格式验证
export const validateVersionFormat = (version: string): boolean => {
  // 匹配格式：数字.数字（小数点后保留1位）
  const versionRegex = /^\d+\.\d{1}$/;
  return versionRegex.test(version);
};

// 版本号比较（返回 1: v1 > v2, 0: v1 = v2, -1: v1 < v2）
export const compareVersions = (v1: string, v2: string): number => {
  const parseVersion = (v: string): number => {
    const parts = v.split('.');
    return parseInt(parts[0]) * 10 + parseInt(parts[1]);
  };
  
  const num1 = parseVersion(v1);
  const num2 = parseVersion(v2);
  
  if (num1 > num2) return 1;
  if (num1 < num2) return -1;
  return 0;
};

// 检查版本是否可以递增
export const canIncrementVersion = (currentVersion: string, newVersion: string): boolean => {
  if (!validateVersionFormat(currentVersion) || !validateVersionFormat(newVersion)) {
    return false;
  }
  
  return compareVersions(newVersion, currentVersion) > 0;
};

// 建议下一个版本号
export const suggestNextVersion = (currentVersion: string, changeType: 'major' | 'minor' = 'minor'): string => {
  if (!validateVersionFormat(currentVersion)) {
    return '1.0';
  }
  
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  
  if (changeType === 'major') {
    return `${major + 1}.0`;
  } else {
    return `${major}.${minor + 1}`;
  }
};

// 将整数版本转换为小数格式
export const formatVersionFromInt = (version: number): string => {
  const major = Math.floor(version / 10);
  const minor = version % 10;
  return `${major}.${minor}`;
};

// 将小数版本转换为整数格式
export const parseVersionToInt = (version: string): number => {
  if (!validateVersionFormat(version)) {
    return 1;
  }
  
  const parts = version.split('.');
  return parseInt(parts[0]) * 10 + parseInt(parts[1]);
};

// 版本验证错误消息
export const getVersionValidationMessage = (currentVersion: string, newVersion: string): string | null => {
  if (!validateVersionFormat(newVersion)) {
    return '版本号格式错误，应为 X.Y 格式（如：1.0, 2.5）';
  }
  
  if (!canIncrementVersion(currentVersion, newVersion)) {
    return `新版本号必须大于当前版本 ${currentVersion}`;
  }
  
  return null;
};

// 版本历史排序
export const sortVersions = (versions: string[]): string[] => {
  return versions.sort((a, b) => compareVersions(b, a)); // 降序排列
};

// 获取版本变更类型
export const getChangeType = (oldVersion: string, newVersion: string): 'major' | 'minor' | 'patch' => {
  const oldParts = oldVersion.split('.').map(Number);
  const newParts = newVersion.split('.').map(Number);
  
  if (newParts[0] > oldParts[0]) {
    return 'major';
  } else if (newParts[1] > oldParts[1]) {
    return 'minor';
  } else {
    return 'patch';
  }
}; 