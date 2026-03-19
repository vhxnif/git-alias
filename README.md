# @vhxnif/git-alias

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://www.npmjs.com/package/@vhxnif/git-alias)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-%3E%3D1.1.36-black?logo=bun)](https://bun.sh)

> 交互式 Git 别名工具，提供表格化输出和 LLM 智能提交信息生成。

## ✨ 特性

- 🎯 **交互式界面** - 使用友好的选择器替代繁琐的命令行参数
- 🤖 **LLM 集成** - 自动生成提交信息 (支持 OpenAI 和 Ollama)
- 🎨 **主题支持** - 5 种精选配色方案
- 📊 **表格输出** - 清晰美观的表格展示
- ⚡ **快速操作** - 常用 Git 命令一键完成

## 📦 安装

### 系统要求

- [Bun](https://bun.sh) >= 1.1.36

### 安装步骤

```bash
# 克隆仓库
git clone <repository-url>
cd git-alias

# 安装依赖
bun install

# 链接到本地（全局可用）
bun run link
```

### 卸载

```bash
bun run unlink
```

## 🚀 快速开始

安装完成后，即可在终端使用以下命令：

```bash
# 查看工作区状态（表格形式）
gs

# 提交代码（交互式选择 + LLM 生成提交信息）
gc

# 切换分支（模糊搜索）
gbc

# 查看帮助
gh
```

## 📋 命令列表

### 基础命令

| 别名 | 对应命令 | 说明 |
|------|---------|------|
| `gps` | `git push` | 推送代码 |
| `gpl` | `git pull` | 拉取代码 |
| `gs` | `git status` | 表格形式展示状态 |
| `gh` | - | 显示所有别名映射 |

### 分支操作

| 别名 | 对应命令 | 说明 |
|------|---------|------|
| `gbl` | `git branch` | 表格形式展示分支列表 |
| `gbc` | `git switch <branch>` | 搜索并切换分支 |
| `gbn` | `git switch -c/-t <name>` | 创建新分支或从远程检出 |
| `gbm` | `git merge <branch>` | 搜索并合并分支 |
| `gbr` | `git rebase <branch>` | 搜索并变基分支 |
| `gbd` | `git branch -D <branch>` | 搜索并删除分支 |

### 暂存区操作

| 别名 | 对应命令 | 说明 |
|------|---------|------|
| `gfa` | `git add <files>` | 交互式选择文件添加到暂存区 |
| `gfd` | `git restore --staged <files>` | 交互式取消暂存文件 |
| `gfr` | `git checkout HEAD -- <files>` | 交互式还原文件到 HEAD |
| `gfc` | `git diff <file>` | 交互式查看文件差异 |

### 提交与日志

| 别名 | 对应命令 | 说明 |
|------|---------|------|
| `gc` | `git commit -m <message>` | 交互式选择 + LLM 生成提交信息 |
| `gcs` | - | 生成提交摘要 |
| `gl` | `git log -n <limit>` | 表格形式展示日志 |
| `gld` | `git diff <commit>` | 查看提交差异 |

### 储藏操作

| 别名 | 对应命令 | 说明 |
|------|---------|------|
| `gsl` | `git stash list` | 表格形式展示储藏列表 |
| `gsa` | `git stash push -m <message>` | 添加储藏 |
| `gsp` | `git stash pop` | 弹出最新储藏 |
| `gss` | `git stash show -p <stash>` | 查看储藏详情 |
| `gsu` | `git stash apply <stash>` | 应用指定储藏 |
| `gsd` | `git stash drop <stash>` | 删除指定储藏 |

### 标签操作

| 别名 | 对应命令 | 说明 |
|------|---------|------|
| `gts` | `git show <tag>` | 查看标签详情 |

## ⚙️ 配置

### 环境变量

创建 `.zshrc` 或 `.bashrc` 配置文件：

```bash
# 编辑器设置（默认 vi）
export EDITOR='vi'

# ===== OpenAI 配置 =====
export ALIAS_BASE_URL='https://api.openai.com/v1'
export ALIAS_API_KEY='your-api-key'
export ALIAS_DEFAULT_MODEL='gpt-4'

# ===== Ollama 配置（本地运行） =====
export ALIAS_OLLAMA_BASE_URL='http://localhost:11434'
export ALIAS_OLLAMA_DEFAULT_MODEL='llama3'

# 使用 Ollama 替代 OpenAI
export ALIAS_TYPE='ollama'

# ===== 主题配置 =====
export ALIAS_THEME='catppuccin-mocha'
```

### LLM 使用说明

#### OpenAI

需要有效的 API Key，支持所有兼容 OpenAI API 格式的服务商。

#### Ollama（推荐）

本地运行，无需联网，隐私安全：

```bash
# 1. 安装 Ollama
# https://ollama.com

# 2. 拉取模型
ollama pull llama3

# 3. 设置环境变量后使用 gc 命令
```

## 🎨 主题

通过 `ALIAS_THEME` 环境变量配置主题。

| 主题名称 | 描述 |
|---------|------|
| `catppuccin-mocha` | 温暖柔和的粉彩色（默认） |
| `rose-pine` | 柔和的粉紫色调 |
| `tokyonight` | 深蓝紫色调 |
| `kanagawa` | 日式墨水蓝、红、金配色 |
| `dracula` | 经典暗色主题 |

### 切换主题

```bash
# 临时切换
ALIAS_THEME='tokyonight' gs

# 永久切换（添加到 ~/.zshrc 或 ~/.bashrc）
export ALIAS_THEME='tokyonight'
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT](LICENSE)

---

Made with ❤️ by [vhxnif](https://github.com/vhxnif)
