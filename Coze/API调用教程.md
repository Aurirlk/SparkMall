# Coze API 调用教程

本教程介绍如何调用 Coze API 实现 AI 导购对话功能。

## API Base URL

Coze 提供两种 API 调用方式：

| 类型 | Base URL | 用途 |
|------|----------|------|
| 智能体对话 | `https://api.coze.cn/v3/chat` | 与智能体进行多轮对话 |
| 工作流执行 | `https://api.coze.cn/v1/workflow/run` | 直接执行工作流 |

本项目使用 **智能体对话 API** (`/v3/chat`)。

## 参数含义说明

### Token（访问令牌）

- **含义**：API 访问凭证，用于身份验证
- **格式**：以 `pat_` 开头的字符串
- **获取方式**：
  1. 登录 [扣子空间](https://code.coze.cn/home)
  2. 进入个人设置 → API 密钥管理
  3. 点击「创建新密钥」
  4. 复制生成的 `pat_xxx` 密钥

### Bot ID（智能体 ID）

- **含义**：智能体的唯一标识符，告诉 API 要调用哪个智能体
- **获取方式**：
  1. 登录 [扣子空间](https://code.coze.cn/home)
  2. 打开你创建的智能体
  3. 在智能体设置页面或 URL 中找到 Bot ID
  4. 通常是一串数字，如 `7642679727366438975`

### User ID（用户标识）

- **含义**：调用者的唯一标识，用于区分不同用户会话
- **格式**：自定义字符串，如 `web_student_01`
- **说明**：相同 User ID 会共享对话上下文

## 智能体对话 API（/v3/chat）

### 请求地址

```
POST https://api.coze.cn/v3/chat
```

### 请求头

```
Content-Type: application/json
Authorization: Bearer {YOUR_TOKEN}
```

### 请求体参数

```json
{
  "bot_id": "YOUR_BOT_ID",
  "user_id": "YOUR_USER_ID",
  "stream": true,
  "additional_messages": [
    {
      "role": "user",
      "content": "用户的问题",
      "content_type": "text"
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| bot_id | string | 是 | 智能体 ID |
| user_id | string | 是 | 用户唯一标识 |
| stream | boolean | 否 | 是否开启流式输出，默认 false |
| additional_messages | array | 是 | 消息列表 |
| additional_messages[].role | string | 是 | 消息角色：user / assistant |
| additional_messages[].content | string | 是 | 消息内容 |
| additional_messages[].content_type | string | 否 | 内容类型，默认 text |

## 工作流执行 API（/v1/workflow/run）

如需直接执行工作流（不通过智能体），可使用此 API。

### 请求地址

```
POST https://api.coze.cn/v1/workflow/run
```

### 请求头

```
Content-Type: application/json
Authorization: Bearer {YOUR_TOKEN}
```

### 请求体参数

```json
{
  "workflow_id": "YOUR_WORKFLOW_ID",
  "parameters": {
    "input": "用户的问题"
  }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| workflow_id | string | 是 | 工作流 ID |
| parameters | object | 是 | 工作流输入参数 |

## 响应格式

### 流式响应 (SSE)

当 `stream: true` 时，服务器返回 SSE 流：

```
event:conversation.message.delta
data:{"role":"assistant","type":"answer","content":"你好"}
```

### 事件类型

| 事件 | 说明 |
|------|------|
| conversation.message.delta | 消息增量更新 |
| conversation.message.completed | 消息完成 |
| conversation.chat.completed | 对话完成 |
| [DONE] | 流结束标记 |

## JavaScript 示例

### 智能体对话

```javascript
// Coze API 配置
const COZE_CONFIG = {
  token: 'pat_xxxxxxxxxxxxxxxx',  // 你的 Token
  bot_id: '7642679727366438975',   // 你的 Bot ID
  api_base: 'https://api.coze.cn'
};

// 发送消息（流式）
async function sendMessage(question) {
  const response = await fetch(`${COZE_CONFIG.api_base}/v3/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${COZE_CONFIG.token}`
    },
    body: JSON.stringify({
      bot_id: COZE_CONFIG.bot_id,
      user_id: 'web_user_01',
      stream: true,
      additional_messages: [{
        role: 'user',
        content: question,
        content_type: 'text'
      }]
    })
  });

  // 处理流式响应
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let reply = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data:') && !line.includes('[DONE]')) {
        try {
          const data = JSON.parse(line.slice(5));
          if (data.type === 'answer') {
            reply += data.content;
            console.log(reply);
          }
        } catch (e) {}
      }
    }
  }

  return reply;
}
```

### 执行工作流

```javascript
async function runWorkflow(input) {
  const response = await fetch('https://api.coze.cn/v1/workflow/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      workflow_id: 'YOUR_WORKFLOW_ID',
      parameters: { input: input }
    })
  });

  return await response.json();
}
```

## Python 示例

```python
import requests

# 智能体对话
def chat_with_bot(question, token, bot_id):
    url = "https://api.coze.cn/v3/chat"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {
        "bot_id": bot_id,
        "user_id": "python_user_01",
        "stream": False,
        "additional_messages": [{
            "role": "user",
            "content": question,
            "content_type": "text"
        }]
    }
    response = requests.post(url, headers=headers, json=payload)
    return response.json()

# 执行工作流
def run_workflow(input_text, token, workflow_id):
    url = "https://api.coze.cn/v1/workflow/run"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {
        "workflow_id": workflow_id,
        "parameters": {"input": input_text}
    }
    response = requests.post(url, headers=headers, json=payload)
    return response.json()

# 使用示例
token = "pat_xxxxxxxxxxxxxxxx"
bot_id = "7642679727366438975"
result = chat_with_bot("推荐一款耳机", token, bot_id)
print(result)
```

## cURL 示例

```bash
# 智能体对话
curl -X POST "https://api.coze.cn/v3/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bot_id": "YOUR_BOT_ID",
    "user_id": "curl_user_01",
    "stream": false,
    "additional_messages": [{
      "role": "user",
      "content": "推荐一款耳机",
      "content_type": "text"
    }]
  }'

# 执行工作流
curl -X POST "https://api.coze.cn/v1/workflow/run" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "workflow_id": "YOUR_WORKFLOW_ID",
    "parameters": {"input": "推荐一款耳机"}
  }'
```

## 常见问题

### 1. 401 Unauthorized

- 检查 Token 是否正确
- 确认 Token 格式为 `pat_` 开头
- 检查 Token 是否过期

### 2. 400 Bad Request

- 检查 bot_id 是否正确
- 确认请求体格式正确
- 检查必填参数是否完整

### 3. 流式响应中断

- 检查网络连接
- 确认正确处理 `[DONE]` 标记
- 检查 buffer 拼接逻辑

## 相关资源

- [扣子空间](https://code.coze.cn/home)
- [Coze 官方文档](https://www.coze.cn/docs)
- [Coze API 参考](https://www.coze.cn/docs/developer_guides/chat_v3)
