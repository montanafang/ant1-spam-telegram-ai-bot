// src/index.js

const SPAM_SCORE_KICK = 90;
const SPAM_SCORE_BAN = 70;
const SPAM_SCORE_WARN = 50;

async function isSpam(messageText, userInfo, env) {
  console.log("开始垃圾信息检查，消息内容:", messageText);
  console.log("用户信息:", userInfo);

  const prompt = `
以下是判断发言是否为垃圾广告的条件：
1. 本群为特定项目群，任何与项目相关的消息不得删除和踢出，其他项目都踢出。我们只关注广告，不关注别的东西，注意力放在广告上。
2. 对于新加入群组的用户（加入时间不到1天，发言次数少于3次），如果他的发言较短，我们会谨慎判断，降低识别为垃圾广告的概率，以免错误封禁。
3. 对于新加组的用户，如果他的头几句发布的信息存在很明显的垃圾广告特征（如使用特定关键词，或使用谐音、错别字、同音字等变体来规避关键词检测，或在聊天内容中插入符号、特殊字符、emoji等来混淆信息），我们应当正确识别并判断，以免不封禁。
4. 对于群组中已存在的用户（加入群组时间超过1天，发言次数超过3次），如果他的发言字数较短且没有明显垃圾广告特征，我们应强制认定其发言不是垃圾广告，以免错误封禁。
5. 如果用户的名称或发言中包含与项目相关的敏感词，但没有其他明显的垃圾广告特征，则需谨慎判断，降低识别为垃圾广告的概率，以免误判正常的项目讨论。
6. 如果用户的名称中也存在明显的垃圾广告特征，我们也应当提高判定为垃圾广告的概率。
7. 本群为特定项目群，任何与项目相关的消息不得删除和踢出，其他项目都踢出。我们只关注广告，不关注别的东西，注意力放在广告上。

垃圾广告特征示例：
- 包含虚拟支付机构或银行卡信息，如冒牌支付机构、虚拟银行卡购买等；
- 诱导用户加入群组、点击链接或参与虚拟活动;
- 涉及非法支付、博彩、贩卖禁止物品等违法活动;
- 提供非法服务，如代开飞会会员、代付、刷单、行骗、出U、贷款、色粉、网赚、交友等。

请根据以上信息和垃圾广告特征，对用户发言进行判断。
这是该用户的基本资料:${JSON.stringify(userInfo)}
双引号内的内容是一条来自该用户发的:"${messageText}"

根据以上信息，这条发言是垃圾广告或推广信息吗？
你的回复必须严格遵循以下 JSON 格式，不要包含任何其他文本或符号：
["T or F","score","short reason"]
其中：
'T or F' 表示是否为垃圾信息，用 'T' 表示是，'F' 表示否
'score' 表示可能的欺诈分数值，范围为 0-100，数值越高表示欺诈可能性越大。
'short reason' 表示判断为垃圾信息的原因，用英文简短概括，例如 'GAMBLE SPAM'。
请直接以纯文本格式输出 JSON 对象，例如：
["T","70","GAMBLE SPAM"]
  `;

  console.log("调用AI模型前的输入:", prompt);

  try {
    const response = await fetch(`https://api.example.com/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.AI_API_KEY}`
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      throw new Error(`调用AI模型时出错: Error: HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI模型响应数据:", data);

    if (!data.choices || data.choices.length === 0) {
      console.error("AI模型响应数据格式不正确:", data);
      throw new Error("AI模型响应数据格式不正确");
    }

    const aiOutput = data.choices[0].text.trim();
    const result = JSON.parse(aiOutput);

    console.log("解析后的AI模型响应数据:", result);

    const isSpamMessage = result[0] === "T";
    const spamScore = parseInt(result[1], 10);
    const spamReason = result[2];

    return [isSpamMessage, spamScore, spamReason];
  } catch (e) {
    console.error(`调用AI模型时出错: ${e}`);
    if (e.message.includes('401')) {
      console.error('请检查您的 AI_API_KEY 是否正确。');
    }
    return [false, 0, ""];
  }
}

async function isAdmin(botToken, chatId, userId) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${chatId}&user_id=${userId}`);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(`HTTP error! status: ${data.error_code}`);
    }

    const chatMember = data.result;
    return ["administrator", "creator"].includes(chatMember.status);
  } catch (e) {
    console.error(`检查管理员状态时出错: ${e}`);
    return false;
  }
}

async function handleMessage(update, env) {
  if (!update.message) {
    console.error("更新对象中没有消息");
    return;
  }

  const botToken = env.TELEGRAM_BOT_TOKEN;
  const user = update.message.from;
  const messageText = update.message.text;
  const chatId = update.message.chat.id;
  const messageId = update.message.message_id;

  console.log(`开始处理消息，来自群组ID: ${chatId}`);

  const managedChatId = parseInt(env.MANAGED_CHAT_ID);
  if (chatId !== managedChatId) {
    console.log(`消息来自非管理群组ID: ${chatId}，预期管理群组ID: ${managedChatId}，跳过处理`);
    return;
  }

  if (user.is_bot) {
    console.log(`消息来自机器人，用户ID: ${user.id}，跳过处理`);
    return;
  }

  if (await isAdmin(botToken, chatId, user.id)) {
    console.log(`用户是管理员，用户ID: ${user.id}，跳过垃圾信息检查，群组ID: ${chatId}`);
    return;
  }

  const joinDate = user.date ? new Date(user.date * 1000) : new Date();
  const userInfo = {
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    join_date: joinDate.toISOString()
  };

  console.log("用户信息已获取:", userInfo);

  const [isSpamMessage, spamScore, spamReason] = await isSpam(messageText, userInfo, env);

  console.log("垃圾信息检查完成，结果:", { isSpamMessage, spamScore, spamReason });

  if (isSpamMessage) {
    try {
      let action;
      if (spamScore > SPAM_SCORE_KICK) {
        await fetch(`https://api.telegram.org/bot${botToken}/kickChatMember?chat_id=${chatId}&user_id=${user.id}`);
        await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage?chat_id=${chatId}&message_id=${messageId}`);
        action = "踢出并删除消息";
      } else if (spamScore > SPAM_SCORE_BAN) {
        await fetch(`https://api.telegram.org/bot${botToken}/restrictChatMember`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            user_id: user.id,
            permissions: {
              can_send_messages: false,
              can_send_polls: false,
              can_send_other_messages: false,
              can_add_web_page_previews: false,
              can_change_info: false,
              can_invite_users: false,
              can_pin_messages: false
            }
          })
        });
        await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage?chat_id=${chatId}&message_id=${messageId}`);
        action = "禁言并删除消息";
      } else if (spamScore > SPAM_SCORE_WARN) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: "警告：此消息可能包含垃圾信息。请注意群规。"
          })
        });
        action = "警告";
      } else {
        console.log(`垃圾信息分数低于警告线，不采取行动，群组ID: ${chatId}`);
        return;
      }

      const adminMessage = `用户 ${user.username} 被${action}。
原因： ${spamReason}
垃圾信息概率: ${spamScore}%
消息内容: ${messageText}
来自群组ID: ${chatId}`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: parseInt(env.ADMIN_CHAT_ID),
          text: adminMessage
        })
      });

      // 保存信息到 KV 存储，键名为当前时间，键值为 adminMessage
      const timestamp = new Date().toISOString();
      await env.KV.put(timestamp, adminMessage);
      console.log(`信息已保存到 KV 存储，键名: ${timestamp}, 键值: ${adminMessage}`);

      console.log(`检测到垃圾信息，用户 ${user.username} 被${action}，来自群组ID: ${chatId}`);
    } catch (e) {
      console.error(`处理垃圾信息时出错，群组ID: ${chatId}: ${e}`);
    }
  } else {
    console.log(`消息不是垃圾信息，来自群组ID: ${chatId}`);
  }
}

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/webhook" && request.method === "POST") {
    const update = await request.json();
    await handleMessage(update, env);
    return new Response("OK");
  }

  return new Response("Not Found.", { status: 404 });
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};