# Claude Demo - Shadcn UI

这是一个使用 Next.js 14、TypeScript 和 shadcn/ui 组件库构建的现代化 Web 应用程序模板。

## 技术栈

- **框架**: [Next.js 15](https://nextjs.org/) - React 框架
- **语言**: [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript
- **样式**: [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- **组件**: [shadcn/ui](https://ui.shadcn.com/) - 高质量的 React 组件
- **代码质量**: ESLint + Prettier - 代码规范和格式化

## 项目结构

```
claude-demo-shadcnUI/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── auth/              # 认证相关页面
│   ├── dashboard/         # 仪表板页面
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   ├── layout/           # 布局组件
│   ├── forms/            # 表单组件
│   └── shared/           # 共享组件
├── config/               # 配置文件
├── hooks/                # 自定义 React Hooks
├── lib/                  # 工具函数库
├── public/               # 静态资源
├── styles/               # 全局样式
├── types/                # TypeScript 类型定义
└── utils/                # 实用工具函数
```

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发环境

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 脚本命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm start` - 启动生产服务器
- `npm run lint` - 运行 ESLint 检查
- `npm run format` - 使用 Prettier 格式化代码
- `npm run format:check` - 检查代码格式

## 环境变量

复制 `.env.example` 到 `.env.local` 并填写相应的值：

```bash
cp .env.example .env.local
```

## 添加 shadcn/ui 组件

使用 shadcn/ui CLI 添加新组件：

```bash
npx shadcn-ui@latest add [component-name]
```

例如：
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
```

## 特性

- ✅ TypeScript 支持
- ✅ Tailwind CSS 集成
- ✅ shadcn/ui 组件库
- ✅ ESLint + Prettier 配置
- ✅ 响应式设计
- ✅ 暗色模式支持
- ✅ 环境变量配置
- ✅ API 路由支持

## 贡献

欢迎提交 Pull Requests 来改进这个项目！

## 许可证

MIT