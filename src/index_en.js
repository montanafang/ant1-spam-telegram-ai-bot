// src/index.js

const SPAM_SCORE_KICK = 90;
const SPAM_SCORE_BAN = 70;
const SPAM_SCORE_WARN = 50;

async function isSpam(messageText, userInfo, env) {
  console.log("Starting spam check, message content:", messageText);
  console.log("User information:", userInfo);

  const prompt = `
The following are the criteria for determining whether a message is spam:
1. This group is for a specific project. Any messages related to the project should not be deleted or result in user removal. Users discussing other projects should be removed. We only focus on advertisements, not other content.
2. For new users (joined less than 1 day ago, less than 3 messages), if their message is short, we will be cautious in our judgment, reducing the probability of identifying it as spam to avoid false bans.
3. For new users, if their first few messages show clear spam characteristics (such as using specific keywords, or using homophones, misspellings, or homonyms to evade keyword detection, or inserting symbols, special characters, emojis, etc. to confuse the information), we should correctly identify and judge them to avoid not banning.
4. For existing users in the group (joined more than 1 day ago, more than 3 messages), if their message is short and doesn't have obvious spam characteristics, we should forcefully determine that it's not spam to avoid false bans.
5. If the user's name or message contains sensitive words related to the project, but doesn't have other obvious spam characteristics, we need to be cautious in our judgment, reducing the probability of identifying it as spam to avoid misjudging normal project discussions.
6. If the user's name also contains obvious spam characteristics, we should increase the probability of judging it as spam.
7. This group is for a specific project. Any messages related to the project should not be deleted or result in user removal. Users discussing other projects should be removed. We only focus on advertisements, not other content.

Examples of spam characteristics:
- Contains information about virtual payment institutions or bank cards, such as fake payment institutions, virtual bank card purchases, etc.
- Induces users to join groups, click links, or participate in virtual activities;
- Involves illegal activities such as illegal payments, gambling, selling prohibited items, etc.;
- Provides illegal services, such as opening fake memberships, proxy payments, order brushing, scams, selling cryptocurrencies, loans, adult content, online money-making schemes, dating services, etc.

Please judge the user's message based on the above information and spam characteristics.
This is the user's basic information: ${JSON.stringify(userInfo)}
The content within the double quotes is a message from this user: "${messageText}"

Based on the above information, is this message spam or promotional content?
Your reply must strictly follow the following JSON format, do not include any other text or symbols:
["T or F","score","short reason"]
Where:
'T or F' indicates whether it's spam, use 'T' for yes, 'F' for no
'score' represents the possible fraud score, ranging from 0-100, higher values indicate a higher possibility of fraud.
'short reason' briefly explains the reason for judging it as spam, summarized in English, for example 'GAMBLE SPAM'.
Please output the JSON object directly in plain text format, for example:
["T","70","GAMBLE SPAM"]
  `;

  console.log("Input before calling AI model:", prompt);

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
      throw new Error(`Error calling AI model: Error: HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI model response data:", data);

    if (!data.choices || data.choices.length === 0) {
      console.error("AI model response data format is incorrect:", data);
      throw new Error("AI model response data format is incorrect");
    }

    const aiOutput = data.choices[0].text.trim();
    const result = JSON.parse(aiOutput);

    console.log("Parsed AI model response data:", result);

    const isSpamMessage = result[0] === "T";
    const spamScore = parseInt(result[1], 10);
    const spamReason = result[2];

    return [isSpamMessage, spamScore, spamReason];
  } catch (e) {
    console.error(`Error calling AI model: ${e}`);
    if (e.message.includes('401')) {
      console.error('Please check if your AI_API_KEY is correct.');
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
    console.error(`Error checking admin status: ${e}`);
    return false;
  }
}

async function handleMessage(update, env) {
  if (!update.message) {
    console.error("No message in the update object");
    return;
  }

  const botToken = env.TELEGRAM_BOT_TOKEN;
  const user = update.message.from;
  const messageText = update.message.text;
  const chatId = update.message.chat.id;
  const messageId = update.message.message_id;

  console.log(`Start processing message from group ID: ${chatId}`);

  const managedChatId = parseInt(env.MANAGED_CHAT_ID);
  if (chatId !== managedChatId) {
    console.log(`Message from non-managed group ID: ${chatId}, expected managed group ID: ${managedChatId}, skipping processing`);
    return;
  }

  if (user.is_bot) {
    console.log(`Message from bot, user ID: ${user.id}, skipping processing`);
    return;
  }

  if (await isAdmin(botToken, chatId, user.id)) {
    console.log(`User is an admin, user ID: ${user.id}, skipping spam check, group ID: ${chatId}`);
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

  console.log("User information retrieved:", userInfo);

  const [isSpamMessage, spamScore, spamReason] = await isSpam(messageText, userInfo, env);

  console.log("Spam check completed, result:", { isSpamMessage, spamScore, spamReason });

  if (isSpamMessage) {
    try {
      let action;
      if (spamScore > SPAM_SCORE_KICK) {
        await fetch(`https://api.telegram.org/bot${botToken}/kickChatMember?chat_id=${chatId}&user_id=${user.id}`);
        await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage?chat_id=${chatId}&message_id=${messageId}`);
        action = "kicked and message deleted";
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
        action = "banned and message deleted";
      } else if (spamScore > SPAM_SCORE_WARN) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Warning: This message may contain spam. Please follow the group rules."
          })
        });
        action = "warned";
      } else {
        console.log(`Spam score below warning threshold, no action taken, group ID: ${chatId}`);
        return;
      }

      const adminMessage = `User ${user.username} has been ${action}.
Reason: ${spamReason}
Spam probability: ${spamScore}%
Message content: ${messageText}
From group ID: ${chatId}`;

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

      // Save information to KV storage, key name is current time, value is adminMessage
      const timestamp = new Date().toISOString();
      await env.KV.put(timestamp, adminMessage);
      console.log(`Information saved to KV storage, key: ${timestamp}, value: ${adminMessage}`);

      console.log(`Spam detected, user ${user.username} has been ${action}, from group ID: ${chatId}`);
    } catch (e) {
      console.error(`Error handling spam, group ID: ${chatId}: ${e}`);
    }
  } else {
    console.log(`Message is not spam, from group ID: ${chatId}`);
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