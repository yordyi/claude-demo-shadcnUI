# 项目管理系统架构设计文档

## 目录
1. [系统概述](#系统概述)
2. [技术栈](#技术栈)
3. [系统架构](#系统架构)
4. [数据库设计](#数据库设计)
5. [API设计](#api设计)
6. [认证与授权](#认证与授权)
7. [数据流设计](#数据流设计)
8. [部署架构](#部署架构)

## 系统概述

### 项目名称
项目管理系统 v1.0.0

### 项目描述
基于微服务架构的现代化项目管理系统，支持项目追踪、任务管理、团队协作和资源调度。

### 核心功能
- 项目和任务管理
- 团队协作与沟通
- 资源分配与调度
- 时间追踪与报告
- 文件管理与版本控制
- 看板和甘特图视图
- 实时通知与更新
- 权限和访问控制

## 技术栈

### 前端技术栈
- **框架**: Next.js 14 (App Router)
- **UI库**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand + React Query
- **图表**: Recharts
- **甘特图**: dhtmlx-gantt
- **实时通信**: Socket.io-client
- **表单处理**: React Hook Form + Zod
- **认证**: NextAuth.js

### 后端技术栈
- **运行时**: Node.js 20 LTS
- **框架**: NestJS
- **API**: REST + GraphQL
- **ORM**: Prisma
- **缓存**: Redis
- **队列**: Bull
- **文件存储**: MinIO/S3
- **实时通信**: Socket.io
- **认证**: JWT + Refresh Tokens

### 数据库
- **主数据库**: PostgreSQL 15
- **缓存数据库**: Redis 7
- **搜索引擎**: Elasticsearch 8
- **时序数据库**: TimescaleDB

### 基础设施
- **容器化**: Docker
- **编排**: Kubernetes
- **CI/CD**: GitHub Actions
- **监控**: Prometheus + Grafana
- **日志**: ELK Stack
- **反向代理**: Nginx
- **CDN**: CloudFlare

## 系统架构

### 架构模式
采用微服务架构模式，通过API网关进行服务路由和负载均衡。

### 架构层次

#### 1. 展示层 (Presentation Layer)
- Next.js前端应用
- 响应式设计，支持PC和移动端
- PWA支持离线访问
- 客户端缓存和状态管理

#### 2. API网关层 (API Gateway Layer)
- Kong Gateway / Nginx
- 请求路由和负载均衡
- 认证授权
- 速率限制
- API版本管理

#### 3. 应用服务层 (Application Services Layer)

##### 核心服务
1. **认证服务 (Auth Service)**
   - 用户认证和授权
   - JWT令牌管理
   - 会话管理
   - 2FA支持

2. **项目服务 (Project Service)**
   - 项目CRUD操作
   - 冲刺管理
   - 看板和甘特图
   - 项目统计

3. **任务服务 (Task Service)**
   - 任务管理
   - 状态流转
   - 任务分配
   - 子任务管理

4. **用户服务 (User Service)**
   - 用户管理
   - 团队管理
   - 角色权限
   - 个人设置

5. **通知服务 (Notification Service)**
   - 应用内通知
   - 邮件通知
   - 推送通知
   - 通知偏好设置

6. **文件服务 (File Service)**
   - 文件上传下载
   - 版本管理
   - 文件预览
   - 存储管理

7. **报告服务 (Report Service)**
   - 数据分析
   - 报告生成
   - 导出功能
   - 仪表板

8. **集成服务 (Integration Service)**
   - 第三方集成
   - Webhook管理
   - API适配器
   - 数据同步

9. **实时服务 (Realtime Service)**
   - WebSocket管理
   - 实时协作
   - 在线状态
   - 实时通知推送

#### 4. 数据层 (Data Layer)
- PostgreSQL: 主要业务数据
- Redis: 缓存和会话
- Elasticsearch: 全文搜索
- TimescaleDB: 时序数据
- MinIO/S3: 文件存储

## 数据库设计

### 核心实体

#### 1. 用户实体 (User)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar TEXT,
    role ENUM('ADMIN', 'MANAGER', 'MEMBER', 'GUEST'),
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
    timezone VARCHAR(50),
    language VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE
);
```

#### 2. 组织实体 (Organization)
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo TEXT,
    website VARCHAR(255),
    industry VARCHAR(100),
    size ENUM('1-10', '11-50', '51-200', '201-500', '500+'),
    owner_id UUID REFERENCES users(id),
    plan ENUM('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    settings JSONB
);
```

#### 3. 项目实体 (Project)
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(10) NOT NULL,
    description TEXT,
    status ENUM('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'),
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    type ENUM('SCRUM', 'KANBAN', 'WATERFALL', 'HYBRID'),
    visibility ENUM('PUBLIC', 'TEAM', 'PRIVATE'),
    owner_id UUID REFERENCES users(id),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    settings JSONB,
    metadata JSONB
);
```

#### 4. 任务实体 (Task)
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type ENUM('FEATURE', 'BUG', 'TASK', 'SUBTASK', 'EPIC'),
    status ENUM('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'),
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES users(id),
    points INTEGER,
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    due_date DATE,
    completed_at TIMESTAMP,
    position INTEGER,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    custom_fields JSONB
);
```

### 关系设计
- 一对多关系：User->Project, Project->Task, Task->Comment
- 多对多关系：User<->Team, User<->Role, Task<->Tag

## API设计

### RESTful API端点

#### 认证相关
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/logout` - 用户登出
- `POST /auth/refresh` - 刷新令牌
- `POST /auth/forgot-password` - 忘记密码
- `POST /auth/reset-password` - 重置密码

#### 项目管理
- `GET /projects` - 获取项目列表
- `POST /projects` - 创建项目
- `GET /projects/:id` - 获取项目详情
- `PUT /projects/:id` - 更新项目
- `DELETE /projects/:id` - 删除项目
- `GET /projects/:id/board` - 获取项目看板
- `GET /projects/:id/gantt` - 获取甘特图数据

#### 任务管理
- `GET /tasks` - 获取任务列表
- `POST /tasks` - 创建任务
- `GET /tasks/:id` - 获取任务详情
- `PUT /tasks/:id` - 更新任务
- `DELETE /tasks/:id` - 删除任务
- `PATCH /tasks/:id/status` - 更新任务状态
- `POST /tasks/:id/comments` - 添加评论

### GraphQL Schema (示例)
```graphql
type User {
  id: ID!
  email: String!
  username: String!
  firstName: String
  lastName: String
  role: UserRole!
  teams: [Team!]!
  projects: [Project!]!
}

type Project {
  id: ID!
  name: String!
  key: String!
  description: String
  status: ProjectStatus!
  tasks: [Task!]!
  team: Team
  owner: User!
}

type Task {
  id: ID!
  title: String!
  description: String
  status: TaskStatus!
  priority: Priority!
  assignee: User
  project: Project!
  comments: [Comment!]!
}
```

## 认证与授权

### 认证策略
- **方式**: JWT + Refresh Tokens
- **访问令牌有效期**: 15分钟
- **刷新令牌有效期**: 7天
- **算法**: RS256
- **2FA支持**: TOTP, SMS, Email

### 授权模型
- **模型**: RBAC + ABAC混合模式
- **系统角色**: SUPER_ADMIN, ORGANIZATION_ADMIN, PROJECT_MANAGER, TEAM_LEAD, DEVELOPER, VIEWER
- **权限格式**: resource:action:scope
- **资源**: organization, project, team, task, user等
- **操作**: create, read, update, delete, assign等
- **范围**: own, team, project, organization, all

### 安全措施
- 密码策略：最少8位，包含大小写字母、数字和特殊字符
- 速率限制：登录5次/15分钟，API调用100次/分钟
- 会话管理：支持多设备登录，可查看和管理活动会话
- 审计日志：记录所有安全相关操作

## 数据流设计

### 任务创建流程
1. 用户在前端填写任务表单
2. 前端进行客户端验证
3. 发送请求到API网关
4. API网关验证JWT令牌
5. 路由到任务服务
6. 任务服务验证业务规则和权限
7. 保存任务到PostgreSQL
8. 发布TaskCreated事件到消息队列
9. 通知服务生成通知
10. 搜索服务更新索引
11. 实时服务通过WebSocket推送更新
12. 前端更新界面

### 实时协作流程
1. 用户建立WebSocket连接
2. 服务端验证用户身份
3. 用户加入项目房间
4. 用户A编辑任务
5. 变更通过WebSocket发送
6. 服务端验证权限并保存
7. 通过Redis Pub/Sub同步到其他服务器
8. 广播变更给房间内其他用户
9. 其他用户实时看到更新
10. 冲突时使用CRDT或锁机制处理

## 部署架构

### 环境配置
- **开发环境**: Docker Compose本地部署
- **测试环境**: Kubernetes单节点集群
- **生产环境**: 多区域Kubernetes集群

### 部署策略
- **部署方式**: 蓝绿部署/金丝雀发布
- **回滚机制**: 自动回滚失败部署
- **健康检查**: 存活探针和就绪探针
- **扩缩容**: 基于CPU/内存的HPA

### 监控告警
- **指标监控**: Prometheus + Grafana
- **日志收集**: ELK Stack
- **链路追踪**: Jaeger
- **告警渠道**: Email, Slack, PagerDuty

### 备份恢复
- **数据库备份**: 每日全量备份，实时增量备份
- **文件备份**: S3跨区域复制
- **灾难恢复**: RPO < 1小时，RTO < 4小时

## 总结

本架构设计充分考虑了系统的可扩展性、可维护性和高可用性。通过微服务架构实现了服务的解耦和独立部署，通过完善的认证授权机制保证了系统安全，通过实时通信和协作功能提升了用户体验。整个系统设计遵循了云原生的最佳实践，能够很好地支撑项目管理系统的各项业务需求。