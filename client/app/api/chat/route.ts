import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAI } from 'openai';
import { mockFlights } from '@/utils/mockFlights';

// Initialize AI clients
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const MODEL_NAME = 'gemini-2.5-flash';

const cerebrasClient = process.env.CEREBRAS_API_KEY ? new OpenAI({
  apiKey: process.env.CEREBRAS_API_KEY,
  baseURL: 'https://api.cerebras.ai/v1'
}) : null;

const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

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

✈️ **[Origin City] → [Destination City]**

| Airline | Flight | Departs | Arrives | Price | Duration | Stops |
|---------|--------|---------|---------|-------|----------|-------|
| Emirates | EK201 | 10:00 AM | 10:00 PM | **$450** | 7h 0m | Direct |
| Air India | AI301 | 2:00 PM | 11:15 PM | **$380** 🏆 | 9h 15m | 1 stop |

📊 **Price Analysis:** [low/average/high for this route]
💡 **Smart Tip:** [Specific actionable advice]

## EDGE CASES
- If NO flight data is provided, say: "I don't have live flight data for that exact route right now, but here's what I know about that route typically..."
- If a city is invalid, ask the user for clarification politely.`;

const extractIntent = (message: string) => {
  const upper = message.toUpperCase();
  const intent = { from: '', to: '', date: '' };

  const airportCodes = upper.match(/\b([A-Z]{3})\b/g) || [];
  if (airportCodes.length >= 2) {
    const validCodes = airportCodes.filter(c => !['THE', 'FOR', 'AND', 'ARE', 'YOU', 'CAN', 'WAY', 'GET', 'FLY', 'ANY'].includes(c));
    if (validCodes[0]) intent.from = validCodes[0];
    if (validCodes[1]) intent.to = validCodes[1];
  }

  return intent;
};

const buildContentsOpenAI = (history: any[] = [], userMessage: string, flightContext: string = '') => {
  const messages: any[] = [{ role: 'system', content: SKYBOT_SYSTEM_PROMPT }];
  
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

const buildContentsGemini = (history: any[] = [], userMessage: string, flightContext: string = '') => {
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // 1. Extract intent
    const intent = extractIntent(message);
    let flightContext = '';

    // 2. Mock Flight Search Context Injection
    if (intent.from && intent.to) {
      const routes = mockFlights.filter(
        f => f.from.code === intent.from && f.to.code === intent.to
      );
      if (routes.length > 0) {
        flightContext = JSON.stringify(routes.map(r => ({
          airline: r.airline,
          flightNumber: r.flightNumber,
          from: r.from.code,
          to: r.to.code,
          price: r.price,
          duration: r.duration,
          stops: r.stops,
          class: r.class
        })));
      }
    }

    // 3. Fallback AI Router
    let aiResponse = '';

    if (cerebrasClient) {
      try {
        console.log('Next.js API: Trying Cerebras...');
        const messages = buildContentsOpenAI(history, message, flightContext);
        const res = await cerebrasClient.chat.completions.create({
          model: 'llama3.1-8b',
          messages: messages,
          temperature: 0.7,
        });
        aiResponse = res.choices[0].message.content || 'Error parsing response';
      } catch (err: any) {
        console.error('Cerebras failed:', err.message);
      }
    }

    if (!aiResponse && openaiClient) {
      try {
        console.log('Next.js API: Trying OpenAI...');
        const messages = buildContentsOpenAI(history, message, flightContext);
        const res = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
        });
        aiResponse = res.choices[0].message.content || 'Error parsing response';
      } catch (err: any) {
        console.error('OpenAI failed:', err.message);
      }
    }

    if (!aiResponse && genAI) {
      try {
        console.log('Next.js API: Trying Gemini...');
        const model = genAI.getGenerativeModel({
          model: MODEL_NAME,
          systemInstruction: SKYBOT_SYSTEM_PROMPT
        });
        const contents = buildContentsGemini(history, message, flightContext);
        const result = await model.generateContent({ contents });
        aiResponse = result.response.text();
      } catch (err: any) {
        console.error('Gemini failed:', err.message);
      }
    }

    if (!aiResponse) {
      return NextResponse.json({ 
        success: false, 
        message: "I'm sorry, I'm having trouble connecting to AI services right now! ✈️" 
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: aiResponse,
      sessionId: 'local-session-id'
    });

  } catch (error: any) {
    console.error('Next.js API Chat Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
