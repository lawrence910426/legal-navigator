const OpenAIApi = require("openai");
const openai = new OpenAIApi({
	apiKey: process.env.OPENAI_API_KEY
});

const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_KEY;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, async (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: resp }],
    model: 'gpt-3.5-turbo',
  });
  console.log(completion.choices);
  const reply = completion.choices[0].message.content

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, reply);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message');
});
