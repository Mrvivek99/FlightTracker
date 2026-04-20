const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}
const MODEL_NAME = 'gemini-2.5-flash';

// Cerebras API
let cerebrasClient = null;
if (process.env.CEREBRAS_API_KEY) {
  cerebrasClient = new OpenAI({
    apiKey: process.env.CEREBRAS_API_KEY,
    baseURL: 'https://api.cerebras.ai/v1'
  });
}

// OpenAI API
let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

const SKYBOT_SYSTEM_PROMPT = `You are SkyBot — an elite AI flight price tracker and travel assistant powered by real flight data.

## YOUR ROLE
You help users find cheapest flights, compare airlines, understand price trends, and set price alerts.

## BEHAVIOR RULES
1. If a user asks about flights, ALWAYS extract: origin city/airport code, destination city/airport code, and travel date.
2. If any of the 3 are missing, ask for them one at a time — don't overwhelm the user by asking for all at once.
3. When flight data is provided in [FLIGHT DATA] context, analyze it thoroughly and present results in a clean structured format.
4. Always highlight the BEST DEAL with a 🏆 emoji.
5. Rate the price as "💚 Low", "🟡 Average", or "🔴 High" for that route based on what you see in the data.
6. Never make up flight numbers, prices, or airlines. Only use data from the [FLIGHT DATA] context.
7. Keep responses concise but informative. Use markdown formatting: **bold**, bullet lists, tables, emojis.
8. After showing flight results, always follow up with: "💡 Want me to set a price alert for this route so you know when prices drop?"

## RESPONSE FORMAT FOR FLIGHTS
When showing flight results, use this exact format:

✈️ **[Origin City] → [Destination City]** | [Date if known]

| Airline | Flight | Departs | Arrives | Price | Duration | Stops |
|---------|--------|---------|---------|-------|----------|-------|
| Emirates | EK201 | 10:00 AM | 10:00 PM | **$450** | 7h 0m | Direct |
| Air India | AI301 | 2:00 PM | 11:15 PM | **$380** 🏆 | 9h 15m | 1 stop |

📊 **Price Analysis:** [low/average/high for this route]
💡 **Smart Tip:** [Specific actionable advice]

## PRICE TREND HEURISTICS (apply these always)
- Monday/Tuesday departures = typically 10–20% cheaper
- Friday/Sunday departures = typically 20–30% more expensive  
- Book domestic flights: 3–4 weeks in advance for best prices
- Book international flights: 6–8 weeks in advance for best prices
- Last-minute bookings (< 7 days) = typically 40–60% premium
- Shoulder seasons (Apr–May, Sep–Oct) = cheapest for most international routes

## EDGE CASES
- If NO flight data is provided, say: "I don't have live flight data for that exact route right now, but here's what I know about that route typically..."
- If a city is invalid, ask the user for clarification politely.
- If a date is in the past, gently point it out and ask for a future date.`;

/**
 * Build the Gemini multi-turn content array from chat history.
 */
const buildContentsGemini = (history = [], userMessage, flightContext = '') => {
  const contents = history.map(msg => ({
    role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  let currentText = userMessage;
  if (flightContext) {
    currentText = `[FLIGHT DATA]\n${flightContext}\n[/FLIGHT DATA]\n\nUser: ${userMessage}`;
  }

  contents.push({
    role: 'user',
    parts: [{ text: currentText }]
  });

  return contents;
};

/**
 * Build OpenAI / Cerebras history
 */
const buildContentsOpenAI = (history = [], userMessage, flightContext = '') => {
  const messages = [{ role: 'system', content: SKYBOT_SYSTEM_PROMPT }];
  
  history.forEach(msg => {
    messages.push({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content
    });
  });

  let currentText = userMessage;
  if (flightContext) {
    currentText = `[FLIGHT DATA]\n${flightContext}\n[/FLIGHT DATA]\n\nUser: ${userMessage}`;
  }

  messages.push({ role: 'user', content: currentText });
  return messages;
};

/**
 * Extract intent
 */
const extractIntent = (message) => {
  const upper = message.toUpperCase();
  const intent = { from: '', to: '', date: '' };

  const airportCodes = upper.match(/\b([A-Z]{3})\b/g) || [];
  if (airportCodes.length >= 2) {
    const validCodes = airportCodes.filter(c => !['THE', 'FOR', 'AND', 'ARE', 'YOU', 'CAN', 'WAY', 'GET', 'FLY', 'ANY'].includes(c));
    if (validCodes[0]) intent.from = validCodes[0];
    if (validCodes[1]) intent.to = validCodes[1];
  }

  const dateMatch = message.match(/\d{4}-\d{2}-\d{2}/);
  if (dateMatch) intent.date = dateMatch[0];

  return intent;
};

const callOpenAILikeApi = async (client, modelName, userMessage, flightContext = '', history = []) => {
  const messages = buildContentsOpenAI(history, userMessage, flightContext);
  const response = await client.chat.completions.create({
    model: modelName,
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000
  });
  return response.choices[0].message.content;
};

const callGeminiApi = async (userMessage, flightContext = '', history = []) => {
  if (!genAI) throw new Error('Gemini API key is not configured.');
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SKYBOT_SYSTEM_PROMPT
  });
  const contents = buildContentsGemini(history, userMessage, flightContext);
  const result = await model.generateContent({ contents });
  return result.response.text();
};

const callGemini = async (userMessage, flightContext = '', history = []) => {
  // 1. First Priority: Cerebras
  if (cerebrasClient) {
    try {
      console.log('Sending message to Cerebras...');
      return await callOpenAILikeApi(cerebrasClient, 'llama3.1-8b', userMessage, flightContext, history);
    } catch (err) {
      console.error('Cerebras failed, falling back to next available...', err.message);
    }
  }

  // 2. Second Priority: OpenAI
  if (openaiClient) {
    try {
      console.log('Sending message to OpenAI...');
      return await callOpenAILikeApi(openaiClient, 'gpt-4o-mini', userMessage, flightContext, history);
    } catch (err) {
      console.error('OpenAI failed, falling back to next available...', err.message);
    }
  }
  
  // 3. Third Priority: Google Gemini
  if (genAI) {
    try {
      console.log('Sending message to Gemini...');
      return await callGeminiApi(userMessage, flightContext, history);
    } catch (err) {
      console.error('Gemini failed:', err.message);
    }
  }

  throw new Error('All configured AI providers failed or no keys were provided.');
};

module.exports = { callGemini, extractIntent, genAI };
