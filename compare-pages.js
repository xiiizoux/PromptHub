const { chromium } = require('playwright');

async function comparePages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  try {
    // 打开创建页面
    const createPage = await context.newPage();
    await createPage.goto('http://localhost:9011/create');
    await createPage.waitForLoadState('networkidle');
    console.log('✅ 创建页面加载完成');

    // 截图创建页面
    await createPage.screenshot({ path: 'create-page.png', fullPage: true });
    console.log('📸 创建页面截图已保存');

    // 获取创建页面的表单结构
    const createFormStructure = await createPage.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return { error: '未找到表单' };
      
      const elements = Array.from(form.querySelectorAll('label, input, textarea, select, button')).map(el => {
        return {
          tagName: el.tagName,
          type: el.type || '',
          placeholder: el.placeholder || '',
          textContent: el.textContent?.trim() || '',
          className: el.className || '',
          name: el.name || '',
          id: el.id || ''
        };
      });
      
      return { elements, totalElements: elements.length };
    });

    console.log('📋 创建页面表单结构:', JSON.stringify(createFormStructure, null, 2));

    // 等待一会儿让用户观察页面
    await createPage.waitForTimeout(3000);

    // 现在需要访问一个编辑页面，先获取一个提示词ID
    const promptsPage = await context.newPage();
    await promptsPage.goto('http://localhost:9011/prompts');
    await promptsPage.waitForLoadState('networkidle');
    
    // 查找第一个提示词链接
    const firstPromptLink = await promptsPage.locator('a[href*="/prompts/"]').first();
    const href = await firstPromptLink.getAttribute('href');
    
    if (href) {
      const promptId = href.split('/').pop();
      const editUrl = `http://localhost:9011/prompts/${promptId}/edit`;
      
      // 打开编辑页面
      const editPage = await context.newPage();
      await editPage.goto(editUrl);
      await editPage.waitForLoadState('networkidle');
      console.log('✅ 编辑页面加载完成');

      // 截图编辑页面
      await editPage.screenshot({ path: 'edit-page.png', fullPage: true });
      console.log('📸 编辑页面截图已保存');

      // 获取编辑页面的表单结构
      const editFormStructure = await editPage.evaluate(() => {
        const forms = document.querySelectorAll('form');
        let targetForm = null;
        
        // 查找包含提示词内容的表单
        for (let form of forms) {
          if (form.querySelector('textarea[placeholder*="提示词"]') || 
              form.querySelector('input[placeholder*="提示词"]')) {
            targetForm = form;
            break;
          }
        }
        
        if (!targetForm) {
          // 如果没有找到传统表单，查找表单字段
          const formElements = document.querySelectorAll('label, input, textarea, select, button[type="submit"]');
          return { 
            elements: Array.from(formElements).map(el => ({
              tagName: el.tagName,
              type: el.type || '',
              placeholder: el.placeholder || '',
              textContent: el.textContent?.trim() || '',
              className: el.className || '',
              name: el.name || '',
              id: el.id || ''
            })),
            totalElements: formElements.length,
            note: '使用全局表单元素查找'
          };
        }
        
        const elements = Array.from(targetForm.querySelectorAll('label, input, textarea, select, button')).map(el => {
          return {
            tagName: el.tagName,
            type: el.type || '',
            placeholder: el.placeholder || '',
            textContent: el.textContent?.trim() || '',
            className: el.className || '',
            name: el.name || '',
            id: el.id || ''
          };
        });
        
        return { elements, totalElements: elements.length };
      });

      console.log('📋 编辑页面表单结构:', JSON.stringify(editFormStructure, null, 2));

      // 比较两个页面的字段顺序
      console.log('\n🔍 字段顺序对比:');
      console.log('创建页面字段数量:', createFormStructure.totalElements);
      console.log('编辑页面字段数量:', editFormStructure.totalElements);

      // 查找类型选择器
      const createTypeSelector = await createPage.locator('text=选择提示词类型').count();
      const editTypeSelector = await editPage.locator('text=选择提示词类型').count();
      
      console.log('创建页面类型选择器数量:', createTypeSelector);
      console.log('编辑页面类型选择器数量:', editTypeSelector);

      // 等待用户观察
      await editPage.waitForTimeout(5000);
    }

    await promptsPage.close();

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await browser.close();
  }
}

comparePages().catch(console.error);