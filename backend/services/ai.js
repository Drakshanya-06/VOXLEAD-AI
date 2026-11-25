import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { KnowledgeDocument } from '../models/index.js';

function scoreLead(data = {}) {
  const text = JSON.stringify(data).toLowerCase();
  let score = 0;
  if (/budget|₹|rs\.?|\$|inr|rupee|\d{3,}/i.test(text)) score += 20;
  if (/buy|purchase|interested|need|looking|implement|start|demo|scale|डेमो|డెమో/i.test(text)) score += 25;
  if (/immediately|this week|this month|urgent|soon|asap|now|तुरंत|వెంటనే/i.test(text)) score += 20;
  if (/company|business|team|employee|requirement|startup|enterprise|कंपनी|కంపెనీ/i.test(text)) score += 15;
  if (text.length > 120) score += 10;
  if (/@/.test(text)) score += 10;
  score = Math.min(100, score);
  return { score, category: score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold' };
}

function sentimentOf(text = '') {
  const s = text.toLowerCase();
  if (/angry|frustrat|disappoint|bad|issue|problem|not happy|poor|slow|terrible|expensive|hate|खराब|समस्या|సమస్య/.test(s)) return 'Negative';
  if (/great|good|thank|excellent|interested|love|awesome|perfect|helpful|impressive|yes|अच्छा|धन्यवाद|ధన్యవాదాలు|బాగుంది/.test(s)) return 'Positive';
  return 'Neutral';
}

async function retrieveKnowledge(userId, query) {
  try {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return [];
    const docs = await KnowledgeDocument.find({ userId }).lean();
    if (!docs || !docs.length) return [];
    const terms = query.toLowerCase().split(/\W+/).filter(x => x.length > 2);
    if (!terms.length) return [];
    return docs
      .map(d => {
        const lower = ((d.title || '') + ' ' + (d.content || '')).toLowerCase();
        const score = terms.reduce((acc, t) => acc + (lower.includes(t) ? 1 : 0), 0);
        return { title: d.title, content: d.content, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  } catch (err) {
    console.error('Knowledge retrieval error:', err.message);
    return [];
  }
}

function cleanSpokenText(text = '') {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[•\-\*]\s+/g, '')
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateSmartFallbackReply({ history = [], message = '', language = 'en-IN', knowledge = [], customerData = {} }) {
  const lowerMsg = message.toLowerCase();
  const lang = (language || 'en-IN').toLowerCase();
  const isHindi = lang.startsWith('hi');
  const isTelugu = lang.startsWith('te');

  // 1. If company knowledge document matched
  if (knowledge && knowledge.length > 0) {
    const bestDoc = knowledge[0];
    const snippet = bestDoc.content.split(/[.\n]/).filter(s => s.trim().length > 15)[0] || bestDoc.content.slice(0, 150);
    if (isHindi) {
      return `हमारी जानकारी के अनुसार: ${snippet.trim()}। क्या आप इस बारे में और विस्तार से जानना चाहते हैं?`;
    }
    if (isTelugu) {
      return `మా సమాచారం ప్రకారం: ${snippet.trim()}. దీని గురించి మరింత వివరంగా తెలుసుకోవాలనుకుంటున్నారా?`;
    }
    return `According to our company knowledge: ${snippet.trim()}. Would you like more details on pricing, features, or scheduling a demo?`;
  }

  // 2. Greeting intent
  if (/^(hi|hello|hey|namaste|greetings|good morning|good afternoon|good evening|नमस्ते|प्रणाम|నమస్కారం|నమస్తే)\b/i.test(lowerMsg.trim())) {
    if (isHindi) {
      return 'नमस्ते! VOXLEAD AI में आपका स्वागत है। मैं आपकी व्यावसायिक ज़रूरतों को समझने और सही समाधान खोजने में मदद कर सकता हूँ। आप किस प्रकार का समाधान खोज रहे हैं?';
    }
    if (isTelugu) {
      return 'నమస్కారం! VOXLEAD AI కి స్వాగతం. మీ వ్యాపార అవసరాలకు సరైన పరిష్కారాన్ని అందించడానికి నేను సిద్ధంగా ఉన్నాను. మీరు ఎలాంటి పరిష్కారం కోసం చూస్తున్నారు?';
    }
    return 'Hello! Welcome to VOXLEAD AI. I am here to understand your business requirements and find the perfect solution for you. What brings you to us today?';
  }

  // 3. Appointment / Demo booking intent
  if (/appointment|schedule|meeting|demo|call me|book|talk to (someone|sales|human)|डेमो|मीटिंग|अपॉइंटमेंट|డెమో|మీటింగ్|అపాయింట్‌మెంట్/i.test(lowerMsg)) {
    if (isHindi) {
      return 'ज़रूर! आप हमारी अपॉइंटमेंट्स स्क्रीन से सीधे हमारे सेल्स विशेषज्ञ के साथ एक डेमो या कॉल बुक कर सकते हैं। आप किस दिन और समय पर मीटिंग पसंद करेंगे?';
    }
    if (isTelugu) {
      return 'తప్పకుండా! మీరు మా అపాయింట్‌మెంట్స్ విభాగం ద్వారా నేరుగా మా సేల్స్ నిపుణుడితో సమావేశాన్ని షెడ్యూల్ చేయవచ్చు. మీకు ఏ సమయం అనుకూలంగా ఉంటుంది?';
    }
    return 'I would be delighted to set that up! You can book a convenient date and time in the Appointments tab, or let me know what day works best for your team.';
  }

  // 4. Pricing / Cost intent
  if (/price|cost|pricing|rate|charges|plan|subscription|how much|fee|कीमत|दाम|खर्च|ధర|ఖర్చు/i.test(lowerMsg)) {
    if (isHindi) {
      return 'हमारी कीमतें आपकी टीम के आकार और मॉड्यूल की आवश्यकता के अनुसार अनुकूलित की जाती हैं। क्या आप बता सकते हैं कि आपकी टीम में कितने लोग हैं या आपका अनुमानित बजट क्या है?';
    }
    if (isTelugu) {
      return 'మా ప్లాన్‌ల ధర మీ బృందం పరిమాణం మరియు అవసరమైన సేవల ఆధారంగా ఉంటుంది. మీ బృందంలో ఎంతమంది సభ్యులు ఉన్నారు లేదా మీ బడ్జెట్ ఎంత?';
    }
    return 'Our pricing is customized to your team size and implementation scope, designed to provide high ROI. Could you share your estimated team size or monthly budget?';
  }

  // 5. Budget or timeline provided
  if (customerData.budget || /immediately|this month|this week|urgent|soon|asap|month|budget|तुरंत|जल्दी|వెంటనే/i.test(lowerMsg)) {
    if (isHindi) {
      return 'धन्यवाद, यह समयसीमा और बजट हमारे समाधान के लिए बिल्कुल अनुकूल है। क्या आप अपनी कंपनी का नाम या अपना ईमेल बता सकते हैं ताकि हम विस्तृत प्रपोजल भेज सकें?';
    }
    if (isTelugu) {
      return 'వివరాలకు ధన్యవాదాలు. మీ కాలపరిమితి మరియు బడ్జెట్ మా ప్లాన్లకు అనువుగా ఉన్నాయి. వివరణాత్మక ప్రతిపాదన పంపడానికి మీ కంపెనీ పేరు లేదా ఈమెయిల్ ఐడీ చెప్పగలరా?';
    }
    return 'Thank you for sharing those details. That timeline and budget fit nicely within our rollout tiers. What is your company name or best email address so we can prepare a tailored proposal?';
  }

  // 6. Contact / Company details provided
  if (customerData.email || customerData.company || customerData.name) {
    if (isHindi) {
      return 'बहुत अच्छा, मैंने आपकी जानकारी नोट कर ली है। क्या आपके पास हमारे समाधान या फीचर्स को लेकर कोई विशिष्ट प्रश्न है?';
    }
    if (isTelugu) {
      return 'ధన్యవాదాలు, మీ వివరాలను నమోదు చేసుకున్నాను. మా ఫీచర్లు లేదా సేవల గురించి మీకు ఏవైనా నిర్దిష్ట ప్రశ్నలు ఉన్నాయా?';
    }
    return 'Great, I have noted your details down for our team. Is there any specific feature or challenge you would like us to highlight during the walkthrough?';
  }

  // 7. General inquiry / requirements continuation
  if (history.length <= 2) {
    if (isHindi) {
      return 'समझ गया। हम आपके व्यवसाय में बिक्री और लीड कन्वर्जन को स्वचालित और बेहतर बनाने में मदद करते हैं। क्या आप बता सकते हैं कि आपकी कंपनी का नाम क्या है और आपकी टीम में कितने लोग हैं?';
    }
    if (isTelugu) {
      return 'అర్థమైంది. మీ వ్యాపారంలో సేల్స్ మరియు లీడ్ కన్వర్షన్ వేగవంతం చేయడానికి మేము సహాయపడతాము. మీ కంపెనీ పేరు మరియు బృందం పరిమాణం తెలియజేస్తారా?';
    }
    return 'Understood. We specialize in automating customer qualification and accelerating sales cycles. Could you tell me a little about your company name and how many team members would use this?';
  }

  // Default natural follow-up
  if (isHindi) {
    return 'बहुत बढ़िया! क्या आप इसके लिए कोई अनुमानित बजट या लॉन्च की समयसीमा लेकर चल रहे हैं?';
  }
  if (isTelugu) {
    return 'చాలా బాగుంది! దీని కోసం మీ వద్ద ఏదైనా నిర్దిష్ట బడ్జెట్ లేదా టైమ్‌లైన్ ఉందా?';
  }
  return 'That sounds like a solid use case. Do you have an estimated budget or a target launch timeline in mind for this project?';
}

export async function processMessage({ userId, history = [], message = '', language = 'en-IN' }) {
  const knowledge = await retrieveKnowledge(userId, message);
  const context = knowledge.length
    ? knowledge.map(k => `${k.title}: ${k.content}`).join('\n')
    : 'No matching company knowledge was found.';

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const allText = [...history.map(m => m.content || ''), message].join(' ');
  const customerData = extractCustomerData(allText);
  let reply = '';

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const languageName = language === 'hi-IN' ? 'Hindi' : language === 'te-IN' ? 'Telugu' : 'English';

      const prompt = `You are VOXLEAD AI, an autonomous, warm, articulate AI sales representative.
Your response will be spoken aloud to the customer using browser text-to-speech.

CRITICAL VOICE & CONVERSATIONAL RULES:
1. Speak naturally, warmly, and concisely (strictly 1 to 3 conversational sentences max).
2. NEVER use markdown, bullet points, asterisks (*), hashtags (#), or emojis. Clean, spoken plain text only.
3. Language: Reply in ${languageName} (language code: ${language}).
4. Ask only ONE helpful qualification or follow-up question per turn to keep the dialogue flowing smoothly.
5. Qualify the prospect organically: discover their business challenge, company name, team size, budget, or timeline.
6. Ground your answers in the COMPANY KNOWLEDGE below. If knowledge does not contain facts or pricing, state that pricing is tailored and ask for their requirements.
7. Do not claim a calendar appointment was finalized; direct them to the Appointments tab if they want a meeting.

COMPANY KNOWLEDGE:
${context}

RECENT CONVERSATION:
${history.slice(-8).map(m => `${m.role === 'user' ? 'Customer' : 'VOXLEAD'}: ${m.content}`).join('\n')}

CUSTOMER:
${message}

YOUR SPOKEN RESPONSE:`;

      const result = await model.generateContent(prompt);
      reply = cleanSpokenText(result.response.text());
    } catch (llmErr) {
      console.warn('Gemini LLM call failed, using intelligent conversational engine fallback:', llmErr.message);
      reply = generateSmartFallbackReply({ history, message, language, knowledge, customerData });
    }
  } else {
    reply = generateSmartFallbackReply({ history, message, language, knowledge, customerData });
  }

  const qualification = scoreLead({ text: allText });
  return {
    reply,
    sentiment: sentimentOf(message),
    ...qualification,
    knowledgeUsed: knowledge.map(k => k.title),
    customerData
  };
}

function extractCustomerData(text = '') {
  const email = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i)?.[0] || '';
  const budget = text.match(/(?:(?:₹|rs\.?|inr|\$)\s?[\d,]+(?:\s?(?:k|lakh|lakhs|crore|crores|thousand|million|rupees?))?)|(?:[\d,]+\s?(?:rupees?|rs|dollars?|inr|lakh|lakhs|k))/i)?.[0] || '';
  const company = text.match(/(?:company|organisation|organization|firm|business)(?:\s+name)?\s+(?:is|called|named|:)?\s+([A-Za-z0-9&.-]+(?:\s+[A-Za-z0-9&.-]+){0,2})/i)?.[1]
    || text.match(/(?:at|with)\s+([A-Z][\w&.-]+(?:\s+[A-Z][\w&.-]+){0,2})/)?.[1]
    || '';
  const nameMatch = text.match(/(?:my name is|i am|i'm|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const name = nameMatch ? nameMatch[1] : '';
  return { email, budget, company, name };
}

export { scoreLead, sentimentOf };
