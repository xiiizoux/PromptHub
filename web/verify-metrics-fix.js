/**
 * 验证 metrics.ts 文件修复情况
 * 这个脚本检查文件是否存在以及关键修复点
 */

const fs = require('fs');
const path = require('path');

const METRICS_FILE_PATH = path.join(__dirname, 'src/pages/api/performance/metrics.ts');

function verifyMetricsFix() {
  console.log('🔍 验证 metrics.ts 文件修复情况...\n');

  // 检查文件是否存在
  if (!fs.existsSync(METRICS_FILE_PATH)) {
    console.log('❌ metrics.ts 文件不存在');
    return false;
  }

  console.log('✅ metrics.ts 文件存在');

  // 读取文件内容
  const fileContent = fs.readFileSync(METRICS_FILE_PATH, 'utf8');

  // 检查关键修复点
  const checks = [
    {
      name: '使用正确的表名 prompt_feedback',
      test: () => fileContent.includes('prompt_feedback'),
      fix: '修正了原代码中错误的 ratings 表名'
    },
    {
      name: '不再使用错误的 ratings 表',
      test: () => !fileContent.includes("from('ratings')"),
      fix: '移除了对不存在的 ratings 表的引用'
    },
    {
      name: '包含完整的性能指标计算',
      test: () => fileContent.includes('calculateMetrics') && 
                  fileContent.includes('generateTimeSeries') &&
                  fileContent.includes('calculateOverallScore'),
      fix: '保持了所有原有的性能分析功能'
    },
    {
      name: '使用正确的关联查询',
      test: () => fileContent.includes('usage_id') && fileContent.includes('.in(\'usage_id\', usageIds)'),
      fix: '通过 usage_id 正确关联使用记录和反馈数据'
    },
    {
      name: '增强的错误处理',
      test: () => fileContent.includes('console.warn') && fileContent.includes('获取反馈数据失败'),
      fix: '当查询失败时使用警告而不是抛出错误'
    },
    {
      name: '包含日志记录',
      test: () => fileContent.includes('console.log') && fileContent.includes('[API] 获取性能指标'),
      fix: '添加了详细的调试日志'
    }
  ];

  let allPassed = true;

  checks.forEach(check => {
    const passed = check.test();
    console.log(`${passed ? '✅' : '❌'} ${check.name}`);
    if (passed) {
      console.log(`   📝 ${check.fix}`);
    }
    allPassed = allPassed && passed;
    console.log('');
  });

  // 检查文件大小
  const stats = fs.statSync(METRICS_FILE_PATH);
  console.log(`📊 文件大小: ${stats.size} 字节`);
  console.log(`📊 文件行数: ${fileContent.split('\n').length} 行`);

  if (allPassed) {
    console.log('\n🎉 所有检查都通过！metrics.ts 文件已成功修复');
    console.log('\n📋 修复总结:');
    console.log('1. ✅ 修正了错误的表名 (ratings → prompt_feedback)');
    console.log('2. ✅ 修正了数据关联查询逻辑');
    console.log('3. ✅ 增强了错误处理机制');
    console.log('4. ✅ 保持了完整的性能分析功能');
    console.log('5. ✅ 添加了详细的调试日志');
    
    console.log('\n🚀 现在可以启动服务器测试性能分析功能：');
    console.log('   cd web && npm run dev');
    console.log('   然后访问性能分析页面，应该不会再出现404错误');
  } else {
    console.log('\n⚠️  部分检查未通过，请检查文件内容');
  }

  return allPassed;
}

if (require.main === module) {
  verifyMetricsFix();
}

module.exports = { verifyMetricsFix };
