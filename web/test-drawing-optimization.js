/**
 * 测试绘图优化功能
 * 这个脚本将验证新添加的绘图优化功能是否正常工作
 */

const testPrompts = [
  {
    description: "简单绘图提示词",
    prompt: "画一个女孩",
    type: "drawing"
  },
  {
    description: "带有风格的绘图提示词", 
    prompt: "画一个美丽的女孩，要有动漫风格",
    type: "drawing"
  },
  {
    description: "复杂绘图提示词",
    prompt: "Create a portrait of a beautiful woman with long flowing hair in a fantasy style",
    type: "drawing"
  },
  {
    description: "包含技术关键词的提示词",
    prompt: "生成一张高质量的人物肖像，油画风格，4K分辨率，完美的光影效果",
    type: "drawing"
  }
];

async function testDrawingOptimization() {
  console.log('🎨 开始测试绘图优化功能...\n');
  
  for (const test of testPrompts) {
    console.log(`📝 测试：${test.description}`);
    console.log(`原始提示词：${test.prompt}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: test.prompt,
          optimizationType: test.type,
          requirements: '请提供高质量的通用优化版本'
        })
      });
      
      if (!response.ok) {
        console.error(`❌ API调用失败: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 优化成功！');
        console.log(`优化后提示词：${data.data.optimized.substring(0, 150)}...`);
        console.log(`改进点数量：${data.data.improvements.length}`);
        console.log(`建议数量：${data.data.suggestions.length}`);
        console.log('---');
      } else {
        console.error(`❌ 优化失败：${data.error}`);
      }
      
    } catch (error) {
      console.error(`❌ 测试失败：${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }
  
  console.log('🎨 绘图优化功能测试完成！');
}

// 如果在Node.js环境中运行
if (typeof require !== 'undefined') {
  // 安装需要的依赖：npm install node-fetch
  const fetch = require('node-fetch');
  testDrawingOptimization();
}

// 如果在浏览器中运行
if (typeof window !== 'undefined') {
  // 在浏览器控制台中运行
  window.testDrawingOptimization = testDrawingOptimization;
  console.log('在浏览器控制台中运行：testDrawingOptimization()');
}

module.exports = { testDrawingOptimization };