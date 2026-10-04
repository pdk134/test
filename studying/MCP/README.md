# MCP 学习笔记

本目录用于学习和实践 Model Context Protocol（MCP，模型上下文协议）。

## MCP 是什么

MCP（Model Context Protocol）是一个开放协议，用于标准化 AI 应用（如 Claude、CodeBuddy 等）与外部数据源、工具之间的连接方式。可以把 MCP 理解为 AI 应用的 "USB 接口"：

- **Server（服务端）**：暴露能力（工具、资源、提示词）
- **Client（客户端）**：连接 Server 并调用其能力
- **Host（宿主）**：AI 应用本身，如 Claude Desktop、CodeBuddy

## 核心概念

| 概念 | 说明 |
| --- | --- |
| Tools | 可被模型调用的函数，如查天气、发邮件 |
| Resources | 可被读取的数据，如文件、数据库记录 |
| Prompts | 可复用的提示词模板 |
| Transport | 通信方式：stdio（本地进程）或 Streamable HTTP（远程） |

## 目录规划

```
Studying/MCP/
├── README.md        # 本文件：学习路线
├── notes/           # 概念笔记
├── examples/        # 动手示例代码
└── docs/            # 整理的参考资料
```

## 学习路线

1. **理解协议**：阅读官方文档 [modelcontextprotocol.io](https://modelcontextprotocol.io)，弄清 Tools / Resources / Prompts 的区别
2. **跑通官方示例**：用 Python/TypeScript SDK 写一个最小的 MCP Server
3. **接入客户端**：把 Server 接入 Claude Desktop 或 CodeBuddy 等客户端，验证工具调用
4. **实战项目**：为某个实际需求实现自己的 MCP Server（如文件检索、数据库查询、自动化脚本）

## 常用 SDK

- Python: `pip install mcp`
- TypeScript: `npm install @modelcontextprotocol/sdk`

## 参考资料

- 官方文档：https://modelcontextprotocol.io
- 规范仓库：https://github.com/modelcontextprotocol/modelcontextprotocol
- Python SDK：https://github.com/modelcontextprotocol/python-sdk
- TypeScript SDK：https://github.com/modelcontextprotocol/typescript-sdk
