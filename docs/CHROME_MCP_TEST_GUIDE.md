# OpenAlex Topics Tree 测试指南

## Chrome DevTools MCP 配置

### 安装 Chrome DevTools MCP

chrome-devtools-mcp 是 Google 官方提供的 MCP 工具，可以让 AI Agent 控制 Chrome 浏览器。

#### 安装命令

```bash
npx chrome-devtools-mcp@latest
```

#### 完整配置（在 MCP 配置文件中的配置）

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    }
  }
}
```

### 可用的 MCP 工具

#### 页面导航
- `navigate_page` - 导航到指定 URL
- `go_back` - 后退
- `go_forward` - 前进
- `reload_page` - 刷新页面

#### 输入自动化
- `click_element` - 点击元素
- `fill_input` - 填写输入框
- `select_option` - 选择下拉选项

#### 快照和截图
- `take_snapshot` - 获取页面快照（可交互元素）
- `take_screenshot` - 截图

#### 诊断工具
- `list_console_messages` - 列出控制台消息
- `get_console_message` - 获取控制台消息详情
- `list_network_requests` - 列出网络请求
- `get_network_request` - 获取网络请求详情

#### 性能分析
- `performance_start_trace` - 开始性能追踪
- `performance_stop_trace` - 停止性能追踪
- `performance_analyze_insight` - 分析性能洞察

### 测试场景

#### 1. 基本功能测试
```javascript
// 导航到应用
navigate_page("http://localhost:5173")

// 截图
take_screenshot()

// 获取快照
take_snapshot()
```

#### 2. 交互测试
```javascript
// 点击搜索框
click_element("input.search-input")

// 填写搜索内容
fill_input("input.search-input", "machine learning")

// 截图确认
take_screenshot()
```

#### 3. 诊断测试
```javascript
// 检查控制台错误
list_console_messages()

// 检查网络请求
list_network_requests()
```

#### 4. 性能测试
```javascript
// 开始追踪
performance_start_trace()

// 执行操作...

// 停止追踪并分析
performance_stop_trace()
performance_analyze_insight()
```

### 在 Trae IDE 中使用

1. 打开 Trae IDE 设置
2. 进入 MCP 市场面板
3. 搜索 "chrome-devtools-mcp"
4. 点击安装
5. 配置 Chrome 浏览器路径（如果需要）

### 启动应用进行测试

```bash
# 启动开发服务器
cd c:\Users\ider\Documents\openalex-topics-tree
npm run dev

# 应用将运行在 http://localhost:5173
```

### 预期测试结果

✅ 页面正常加载
✅ 显示 "OpenAlex Topics Tree" 标题
✅ 显示统计数据（Topics 和 Works 数量）
✅ 左侧显示 Domain 过滤器
✅ 中间显示 Topic 树形列表
✅ 右侧显示 Topic 详情面板
✅ 搜索框功能正常
✅ 点击 Topic 显示详情
