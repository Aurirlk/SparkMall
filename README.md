# Coze-Shop

基于 Coze 工作流的校园商城 AI 导购演示项目。

## 项目简介

一个移动端校园商城前端页面，集成 Coze AI 导购助手，支持智能客服对话、商品浏览、购物车等功能。

## 功能特性

- 校园商城完整页面（首页、商品列表、详情、购物车、个人中心）
- Coze AI 导购助手（流式对话、智能推荐）
- 移动端适配（rem 布局）

## 技术栈

- HTML5 / CSS3 / JavaScript
- Coze API（流式 SSE 对话）
- Less 预处理器

## 快速开始

直接打开 `frontend/index.html` 即可预览。

## 项目结构

```
Coze-Shop/
├── Coze/                      # Coze 配置与提示词
│   ├── workflow/
│   │   ├── 智能体内部结构.md   # 智能体人设与回复逻辑
│   │   ├── Ask_workflow.md    # 工作流节点说明
│   │   └── 工作流截图.png      # 工作流截图
│   └── API调用教程.md          # Coze API 调用教程
├── frontend/                  # 前端页面
│   ├── index.html             # 首页
│   ├── list.html              # 商品列表
│   ├── detail.html            # 商品详情
│   ├── cart.html              # 购物车
│   ├── my.html                # 个人中心
│   ├── settings.html          # 设置页
│   ├── ai-chat.html           # AI 导购助手
│   ├── css/                   # 样式文件
│   ├── js/                    # 脚本文件
│   └── images/                # 图片资源
├── LICENSE
└── README.md
```

## Coze 智能体搭建

本项目的 AI 导购功能基于 Coze 平台实现。`Coze` 文件夹中包含了完整的提示词和配置参数，供参考使用。

### 搭建步骤

1. 访问 [扣子空间](https://code.coze.cn/home) 注册/登录账号
2. 创建智能体，参考 `Coze/workflow/智能体内部结构.md` 中的人设与回复逻辑
3. 创建工作流，参考 `Coze/workflow/Ask_workflow.md` 中的节点配置
4. 发布智能体并获取 API 密钥

详细 API 调用方式请参考 `Coze/API调用教程.md`。

## AI 导购配置

在 `frontend/ai-chat.html` 中修改 Coze API 配置：

```javascript
var COZE_CONFIG = {
  bot_id: 'YOUR_BOT_ID',
  token: 'YOUR_API_TOKEN',  // pat_ 开头的密钥
  api_url: 'https://api.coze.cn/v3/chat',
  user_id: 'YOUR_USER_ID'
};
```

## 开源协议

MIT License
