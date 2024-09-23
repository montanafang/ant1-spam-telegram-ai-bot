<<<<<<< HEAD
# ant1 Spam Telegram AI Bot

[English](README_EN.md)

ant1 Spam Telegram AI Bot 是一个基于人工智能的 Telegram 反广告机器人，只用于检测和处理群组中的垃圾信息。这个机器人可以使用各种兼容 OpenAI Endpoint 的模型来分析消息内容，并根据预设的规则采取相应的行动。

## 主要功能

- 实时检测群组中的垃圾信息
- 根据垃圾信息的严重程度采取不同的行动（警告、禁言、踢出）
- 将垃圾信息处理结果通知管理员
- 使用 KV 存储记录处理历史
- 完全静音操作，只在管理群进行封禁通知
- 支持多种语言和模型
- 支持自定义规则

## TODO
- [ ] 提高垃圾信息检测的准确性
- [ ] 实现跟踪真实用户数据的功能
- [ ] 实现识别用户加入群组时的功能

## 部署指南

1. 克隆仓库：
   ```bash
   git clone https://github.com/montanafang/ant1-spam-telegram-ai-bot.git
   cd ant1-spam-telegram-ai-bot
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 设置 AI baseURL 和配置环境变量：
   在 `wrangler.toml` 文件中设置以下变量：
   - `TELEGRAM_BOT_TOKEN`：你的 Telegram 机器人 token
   - `ADMIN_CHAT_ID`：接收通知的管理员聊天 ID
   - `MANAGED_CHAT_ID`：需要管理的群组 ID
   - `AI_API_KEY`：AI 文本分析 API 的密钥

4. 部署到 Cloudflare Workers：
   ```bash
   npm run deploy
   ```

5. 设置 Telegram Webhook：
   将你的 Cloudflare Worker URL 设置为 Telegram 机器人的 webhook。

## 使用方法

1. 将机器人添加到你想要管理的 Telegram 群组中。
2. 确保机器人具有必要的权限（删除消息、踢出用户等）。
3. 机器人会自动检测群组中的新消息，并对可疑的垃圾信息采取行动。

## 自定义配置

你可以通过修改 `src/index.js` 文件中的以下常量来调整机器人的行为：

- `SPAM_SCORE_KICK`：踢出用户的阈值分数
- `SPAM_SCORE_BAN`：禁言用户的阈值分数
- `SPAM_SCORE_WARN`：警告用户的阈值分数


欢迎提交 Pull Requests 

## 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

## 作者

d3x

## 免责声明

此bot仅用于辅助群组管理，不应完全依赖它来做出决定。始终需要人工审核来确保不会误杀。

## 鸣谢

本项目是 [AI Anti Bot](https://github.com/assimon/ai-anti-bot) 的简单实现，特此感谢原作者的创意
=======
# ant1-spam-telegram-ai-bot
>>>>>>> 3a3b0fe5c4a249acd690f118bdbf3e1b2ee6756d
