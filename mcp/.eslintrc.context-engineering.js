/**
 * ESLint配置 - Context Engineering专用
 * 针对Context Engineering模块的特殊规则
 */
module.exports = {
  extends: ['./.eslintrc.js'],
  overrides: [
    {
      files: ['src/context-engineering/**/*.ts'],
      rules: {
        // 在Context Engineering中允许console.log用于调试和演示
        'no-console': 'off',
        // 允许any类型，因为这是通用的上下文处理系统
        '@typescript-eslint/no-explicit-any': 'warn',
        // 允许未使用的变量（用下划线前缀标识）
        '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }]
      }
    },
    {
      files: ['src/context-engineering/test-context-engineering.ts'],
      rules: {
        // 在测试文件中完全允许console语句
        'no-console': 'off',
        // 允许未使用的导入（测试用）
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ]
};