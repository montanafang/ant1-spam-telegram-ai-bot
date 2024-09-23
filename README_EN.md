# ant1 Spam Telegram AI Bot

[中文](README.md)

ant1 Spam Telegram AI Bot is an artificial intelligence-based Telegram bot designed specifically for detecting and handling spam messages in group chats. This bot can use various models compatible with the OpenAI Endpoint to analyze message content and take appropriate actions based on preset rules.

## Main Features

- Real-time detection of spam messages in group chats
- Take different actions based on the severity of spam (warning, muting, kicking out)
- Notify administrators of spam handling results
- Use KV storage to record processing history
- Completely silent operation, only notify bans in the admin group
- Support for multiple languages and models
- Support for custom rules

## Deployment Guide

1. Clone the repository:
   ```bash
   git clone https://github.com/montanafang/ant1-spam-telegram-ai-bot.git
   cd ant1-spam-telegram-ai-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set AI baseURL and configure environment variables:
   Set the following variables in the `wrangler.toml` file:
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
   - `ADMIN_CHAT_ID`: Admin chat ID for receiving notifications
   - `MANAGED_CHAT_ID`: Group ID to be managed
   - `AI_API_KEY`: API key for AI text analysis

4. Deploy to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

5. Set up Telegram Webhook:
   Set your Cloudflare Worker URL/webhook as the webhook for your Telegram bot.

## Usage

1. Add the bot to the Telegram group you want to manage.
2. Ensure the bot has the necessary permissions (delete messages, kick users, etc.).
3. The bot will automatically detect new messages in the group and take action on suspicious spam messages.

## Todo
- [ ] Improve the accuracy of spam detection
- [ ] Implement functionality to track real user data
- [ ] Implement functionality to identify when users join the group

## Custom Configuration

You can adjust the bot's behavior by modifying the following constants in the `src/index.js` file:

- `SPAM_SCORE_KICK`: Threshold score for kicking out users
- `SPAM_SCORE_BAN`: Threshold score for banning users
- `SPAM_SCORE_WARN`: Threshold score for warning users

Pull Requests are welcome to improve this project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

d3x

## Disclaimer

This bot is only for assisting group management and should not be completely relied upon to make decisions. Human review is always necessary to ensure there are no friendly fire.

## Acknowledgments

This project is a simple implementation of [AI Anti Bot](https://github.com/assimon/ai-anti-bot). Special thanks to the original author for the idea and contribution.
