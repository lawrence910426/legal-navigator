const OpenAIApi = require("openai");
const openai = new OpenAIApi({
	apiKey: process.env.OPENAI_API_KEY
});

const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_KEY;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

var history = [];


bot.onText(/\/clear/, async (msg, match) => {
	history = [];
})

bot.onText(/\/ask (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  
  const answer = await reply(resp);
  bot.sendMessage(chatId, answer);
});


const reply = async (content) => {
  history.push(content);
  prmpt = history.join("\n")

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prmpt }],
    model: 'gpt-3.5-turbo',
  });
  console.log(completion.choices);
  
  const reply = completion.choices[0].message.content
  history.push(reply)
  return reply
}

