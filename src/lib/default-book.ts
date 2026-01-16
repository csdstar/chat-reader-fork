import type { Book } from '@/types';

const README_CONTENT = `Chat Reader 是一个伪装成 ChatGPT 的小说阅读器，让你在办公室"认真工作"的同时享受阅读的乐趣。

这是 AI 时代的摸鱼神器。

功能特性包括：完美伪装界面、智能分章、流式输出、进度保存、拖拽上传、多编码支持。

界面 1:1 还原 ChatGPT，白色主题，专业感十足。

自动识别「第X章」「Chapter X」等章节标题，无需手动分割。

模拟 AI 打字效果，逐字显示小说内容，看起来就像真的在和 AI 对话。

使用 IndexedDB 存储，支持超大文件，刷新页面也不会丢失阅读进度。

直接将 txt 文件拖入页面即可开始阅读，无需点击任何按钮。

自动识别 UTF-8 和 GBK 编码，兼容各种来源的小说文件。

使用方法很简单：将 txt 文件直接拖入页面，在输入框输入任意内容按回车，每次会流式输出 3 个段落。

点击左侧章节列表可以跳转到任意章节，点击收起按钮可以隐藏侧边栏让界面更像 ChatGPT。

摸鱼技巧：收起左侧边栏，看起来就是在和 AI 聊天。

输入框可以打任何内容，比如「帮我分析一下这个需求」「这段代码有什么问题」。

老板来了？直接切换到其他标签页，或者继续打字假装在工作。

建议配合真正的 ChatGPT 标签页使用，随时切换更自然。

技术栈：Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui + IndexedDB + TypeScript。

支持的章节格式：第一章、第1章、第一百二十三章、第一节、第一回、第一卷、Chapter 1、CHAPTER 1、卷一、卷1。

免责声明：本项目仅供学习和娱乐目的。请在完成工作任务后适度摸鱼，合理安排工作与休息时间。

现在你可以拖入一个 txt 文件开始阅读你的小说了。

祝你摸鱼愉快！🐟`;

export function getDefaultBook(): Book {
  const paragraphs = README_CONTENT.split('\n\n').filter(p => p.trim());
  
  return {
    title: 'Chat Reader 使用指南',
    chapters: [{
      title: '使用指南',
      paragraphs,
    }],
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
  };
}
