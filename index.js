const OpenAIApi = require("openai");
const openai = new OpenAIApi({
	apiKey: process.env.OPENAI_API_KEY
});
const xlsx = require('node-xlsx')
const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_KEY;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Load the database
var worksheet = xlsx.parse(`${__dirname}/db.xlsx`)[0].data.slice(1)
var sentences = worksheet.map((row) => row.join("\t"))
const MAX_TOKENS = 1000;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const fetch = require("node-fetch");

var history = [];

bot.onText(/\/donwload/, async (msg, match) => {
  await execute_bash("rm -rf db.xlsx")
  await execute_bash(`gdown https://drive.google.com/uc?id=${process.env.DRIVE_ID}`)
  worksheet = xlsx.parse(`${__dirname}/db.xlsx`)[0].data.slice(1)
  worksheet.map((row) => row.join("\t"))
})

bot.onText(/\/reset/, async (msg, match) => {
  history = [];
})

bot.onText(/\/ask (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  
  const answer = await reply(resp);
  bot.sendMessage(chatId, answer);
});


const reply = async (content) => {
  var prmpt = await similarity(content) + "\n" + history.join("\n") + "\nQuestion: " + content + "\nAnswer: ";
  console.log("Prompt\n============\n" + prmpt)
  history.push(content);

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prmpt }],
    model: 'gpt-3.5-turbo',
  });
  console.log(completion.choices);
  
  const reply = completion.choices[0].message.content
  history.push(reply)
  return reply
}

const query = async (data) => {
  const response = await fetch(
      "https://api-inference.huggingface.co/models/sentence-transformers/msmarco-distilbert-base-tas-b",
      {
          headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_KEY}` },
          method: "POST",
          body: JSON.stringify(data),
      }
  );
  const result = await response.json();
  return result;
}

const similarity = async (question) => {
  var response = await query({
    "inputs": {
        "source_sentence": question,
        "sentences": sentences
    },
    "wait_for_model": true
  })

  const sorted = response.map((item, i) => {
    return { index: i, value: item, sentence: sentences[i] };
  }).sort((a, b) => {
    return b.value - a.value;
  })
  console.log(sorted)

  var prompts = []
  var i = 0;
  for(var token_length = 0; token_length < MAX_TOKENS; token_length += sentences[sorted[i].index].length) {
    prompts.push(sentences[sorted[i].index])
    i += 1;
    if (i >= sorted.length) break;
  }
  return prompts.join("\n")
}

const execute_bash = async (command) => {
  try {
      const { stdout, stderr } = await exec(command);
      console.log('stdout:', stdout);
      console.log('stderr:', stderr);
      return stdout
  } catch (err) {
     console.error(err);
  };
};
