# To-Do List Web App — 项目笔记

> 记录截至目前所有已完成的工作、依赖安装和文件说明

---

## 📁 项目目录结构

```
to-do-list web/
├── backend/                  # Django 后端
│   ├── venv/                 # Python 虚拟环境（勿提交 Git）
│   ├── config/               # Django 项目配置
│   │   ├── settings.py       # 全局配置（已配置 DRF、CORS）
│   │   ├── urls.py           # 主路由（挂载 /api/）
│   │   └── wsgi.py / asgi.py
│   ├── todos/                # To-Do Django App
│   │   ├── models.py         # Todo 数据模型 ✅
│   │   ├── serializers.py    # DRF 序列化器 ✅
│   │   ├── views.py          # API 视图逻辑 ✅
│   │   ├── urls.py           # todos 路由 ✅
│   │   └── migrations/       # 数据库迁移文件 ✅
│   ├── manage.py             # Django 管理命令入口
│   ├── db.sqlite3            # SQLite 数据库（自动生成）
│   └── note.md               # 本笔记文件
└── frontend/                 # React + Vite 前端（TypeScript）
    ├── node_modules/         # npm 依赖（勿提交 Git）
    ├── src/
    │   ├── main.ts           # 入口文件（默认 Vite 模板）
    │   └── style.css         # 全局样式
    ├── index.html
    ├── package.json
    └── tsconfig.json
```

---

## 🐍 Backend — Python / Django

### 虚拟环境

```bash
# 在 backend/ 目录下创建虚拟环境
python -m venv venv

# 激活虚拟环境（每次开发前都要执行）
venv\Scripts\activate        # Windows PowerShell
```

### pip 安装的库

```bash
pip install django djangorestframework django-cors-headers
```

| 库名 | 版本（已安装） | 用途 |
|------|---------------|------|
| `django` | 6.0.3 | Python Web 框架，后端核心 |
| `djangorestframework` | 3.17.1 | 构建 REST API（DRF） |
| `django-cors-headers` | 4.9.0 | 允许前端跨域访问 API |
| `asgiref` | 3.11.1 | Django 异步支持（自动依赖） |
| `sqlparse` | 0.5.5 | SQL 解析工具（自动依赖） |
| `tzdata` | 2026.1 | 时区数据（自动依赖） |

### 已执行的 Django 命令

```bash
# 初始化 Django 项目（配置名为 config）
venv\Scripts\django-admin startproject config .

# 创建 todos App
venv\Scripts\python manage.py startapp todos

# 生成数据库迁移文件
venv\Scripts\python manage.py makemigrations

# 执行数据库迁移（生成 db.sqlite3）
venv\Scripts\python manage.py migrate
```

### 启动后端服务器

```bash
# 在 backend/ 目录下执行
venv\Scripts\python manage.py runserver
# 默认运行在 http://127.0.0.1:8000/
```

---

## 📦 Todo 数据模型（`todos/models.py`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | CharField | 任务名称 |
| `urgency` | CharField | 紧急度：`low / medium / high / critical` |
| `size` | CharField | 任务大小：`small / medium / large` |
| `has_due_date` | BooleanField | 是否有截止日期 |
| `due_date` | DateField (nullable) | 截止日期（可为空） |
| `status` | CharField | `pending / in_progress / completed` |
| `created_at` | DateTimeField | 创建时间（自动） |
| `started_at` | DateTimeField (nullable) | 开始计时时间 |
| `completed_at` | DateTimeField (nullable) | 完成时间 |
| `time_spent_seconds` | IntegerField (nullable) | 实际耗时（秒） |

---

## 🔗 API 接口（已配置路由）

> 基础 URL：`http://127.0.0.1:8000/api/`

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/todos/` | 获取所有活跃任务 |
| POST | `/api/todos/` | 创建新任务 |
| GET/PUT/DELETE | `/api/todos/<id>/` | 查看 / 编辑 / 删除任务 |
| POST | `/api/todos/<id>/start/` | 开始计时（status → in_progress） |
| POST | `/api/todos/<id>/complete/` | 完成任务（自动计算耗时） |
| GET | `/api/history/` | 获取已完成任务 |
| DELETE | `/api/history/<id>/` | 删除历史记录 |

---

## ⚛️ Frontend — React + Vite (TypeScript)

### 创建项目

```bash
# 在 to-do-list web/ 根目录执行
npm create vite@latest frontend -- --template react
# 选择：React → TypeScript
# 已自动执行 npm install
```

### 已安装的 npm 依赖

| 依赖 | 类型 | 用途 |
|------|------|------|
| `vite` | devDependency | 前端构建工具 |
| `typescript` | devDependency | TypeScript 支持 |
| `react` | dependency | React 核心库 |
| `react-dom` | dependency | React DOM 渲染 |
| `axios` | dependency | HTTP 请求库，与后端 API 通信 |
| `@vitejs/plugin-react` | devDependency | Vite 的 React JSX 转换插件 |
| `@types/react` | devDependency | React TypeScript 类型定义 |
| `@types/react-dom` | devDependency | React DOM TypeScript 类型定义 |

### 启动前端开发服务器

```bash
# 在 frontend/ 目录下执行
npm run dev
# 默认运行在 http://localhost:5173/
```

---

## ✅ 已完成 / ⏳ 待完成

### 后端
- [x] 创建 Python 虚拟环境
- [x] 安装 Django、DRF、CORS 依赖
- [x] 初始化 Django 项目（config）
- [x] 创建 todos App
- [x] 编写 Todo 数据模型
- [x] 编写 DRF 序列化器
- [x] 编写 API 视图（CRUD + 计时 + 完成 + 历史）
- [x] 配置路由（todos/urls.py + config/urls.py）
- [x] 配置 CORS（允许 localhost:5173）
- [x] 执行数据库迁移

### 前端
- [x] 创建 Vite + React + TypeScript 项目
- [x] 安装 react、react-dom、axios、@vitejs/plugin-react
- [x] 配置 vite.config.ts（添加 React 插件）
- [x] 配置 tsconfig.json（添加 jsx: react-jsx）
- [x] 封装 Axios（api/axios.ts）
- [x] 定义 TypeScript 类型（types.ts）
- [x] 编写 AddTaskModal 组件（含紧急度/大小/截止日期选择）
- [x] 编写 TaskCard 组件（含 checkbox + 实时计时器）
- [x] 编写 HistoryTable 组件
- [x] 编写 App.tsx（主页面 + Active Tasks / History 双 Tab）
- [x] 编写全局 CSS 样式（深色主题）
- [x] 前后端联调验证 ✅

---

## ⚙️ 已修改的配置文件

### `config/settings.py` 新增内容
```python
INSTALLED_APPS = [
    ...
    'rest_framework',      # DRF
    'corsheaders',         # CORS
    'todos',               # 我们的 App
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # 放在最前面
    ...
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ]
}
```

---

## 💡 常见问题

### VS Code 显示 `Cannot find module django` 警告
**原因**：VS Code 使用系统 Python，没有选择虚拟环境。  
**解决**：按 `Ctrl+Shift+P` → `Python: Select Interpreter` → 选择 `backend/venv/Scripts/python.exe`

### PowerShell 不支持 `&&` 语法
**解决**：改用分号 `;` 或分两行执行命令：
```powershell
venv\Scripts\python manage.py makemigrations
venv\Scripts\python manage.py migrate
```

---

## 🔐 Django Admin 账号

| 项目 | 值 |
|------|-----|
| **URL** | http://localhost:8000/admin/ |
| **Username** | `admin` |
| **Password** | `admin1234` |

> ⚠️ 这是学习用的临时密码，正式上线前需要更改！

### 如何重新创建 / 修改密码

```bash
# 在 backend/ 目录下，修改密码
venv\Scripts\python manage.py changepassword admin

# 或用 shell 重新创建
venv\Scripts\python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', '新密码')"
```
