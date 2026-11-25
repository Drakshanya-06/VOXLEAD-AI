# VOXLEAD AI — Interview Preparation

## 60-second project explanation
VOXLEAD AI is a browser-based autonomous sales assistant prototype. A customer can speak or type an enquiry. The frontend converts speech to text using the browser Speech Recognition API and sends the message to a Node/Express backend. The backend loads recent conversation history, retrieves relevant company knowledge and calls Gemini to generate a response. It then derives a lead score, Hot/Warm/Cold category and sentiment, and stores the conversation and lead in MongoDB. The dashboard displays leads, conversations and appointments. Text chat is available when voice APIs are unsupported.

## Business problem
Sales teams repeatedly answer similar questions, gather prospect details and identify purchase intent. VOXLEAD AI helps standardize first-contact conversations and structures the information for follow-up.

## Key concepts

**Generative AI:** Models that generate content, such as a natural-language response, from an input and context.

**Agentic AI:** A system that uses a model with context, tools and controlled actions to pursue a goal. This MVP demonstrates conversational orchestration and qualification; fully autonomous appointment tool-calling is a future enhancement.

**LLM:** A Large Language Model trained to understand and generate language. The project uses Gemini through a server-side API integration.

**STT:** Speech-to-text converts a spoken utterance into text. Here, browser Web Speech API recognition is used where supported.

**TTS:** Text-to-speech reads generated text aloud using browser speech synthesis.

**RAG:** Retrieval-Augmented Generation retrieves relevant external knowledge and supplies it to the model to ground its answer. This MVP uses keyword retrieval; semantic embeddings/vector search are future work.

**Contextual memory:** Recent messages are stored in MongoDB and sent as context on later turns so the assistant can maintain continuity.

**Sentiment analysis:** A simple prototype rule set labels a message Positive, Neutral or Negative. It is not a clinically or commercially validated classifier.

**Lead scoring:** A heuristic score from 0 to 100 estimates buying readiness using budget, intent, timeline, business fit and engagement signals. Hot/Warm/Cold are threshold-based categories.

## Architecture / API flow
React → Express REST API → conversation history + knowledge retrieval → Gemini → qualification/sentiment → MongoDB → dashboard. Protected endpoints use a JWT bearer token.

## Database collections
- User: name, email, hashed password.
- Lead: customer details, budget, requirements, score, category, sentiment and status.
- Conversation: user, messages, language, summary and qualification fields.
- Appointment: customer, email, date, time, purpose and status.
- KnowledgeDocument: title, content and chunks.

## Security
Passwords are hashed with bcrypt. JWT protects API routes. The Gemini key remains on the backend in `.env`. Helmet, CORS and rate limiting are configured. Production needs stronger validation, full tenant isolation testing, encryption, consent/retention policies, secret rotation and security testing.

## Scaling to 100,000 users
Use stateless API replicas behind a load balancer, CDN for static assets, managed MongoDB replica sets and indexes, Redis caching, queues for long-running tasks, rate limits and monitoring. First calculate peak concurrent sessions; 100,000 registered users does not mean 100,000 simultaneous calls. Load-test before making capacity claims.

## Commercial feasibility
Potential customers include SaaS companies, education providers, real-estate firms and service businesses. Pricing could combine a monthly workspace fee and usage-based charges. Costs depend on model tokens, speech minutes, infrastructure, concurrency and support.

## Limitations to state honestly
- Browser speech support varies; no PSTN/telephony integration.
- RAG is keyword-based, not vector semantic search.
- Appointment entry is currently via the appointment page, not an autonomous calendar tool.
- Lead scoring and sentiment are prototype heuristics.
- No 100k-user load test has been performed.

## 30 likely technical questions and concise answers

1. **What problem does your project solve?** It structures initial sales conversations and helps capture prospect intent and follow-up details.
2. **Why React?** Component-based UI, reusable stateful components and a mature ecosystem.
3. **Why Node and Express?** JavaScript across the stack and a lightweight REST API layer.
4. **Why MongoDB?** Flexible documents suit conversation messages and evolving lead data.
5. **What is an API?** A defined interface that lets software components exchange data.
6. **What is REST?** An HTTP API style using resources and methods such as GET, POST, PATCH and DELETE.
7. **What is an LLM?** A model that processes and generates natural language.
8. **How does Gemini integrate?** The backend sends instructions, recent context and retrieved knowledge to the model API.
9. **Why keep the API key on the backend?** To prevent users from extracting credentials from browser code.
10. **What is STT?** Converting speech audio into text.
11. **What is TTS?** Converting text into speech audio.
12. **What is RAG?** Retrieve relevant knowledge and provide it to the LLM before it answers.
13. **Is your RAG semantic?** The current MVP uses keyword overlap; vector embeddings are a planned improvement.
14. **How does memory work?** Messages are stored in MongoDB and recent turns are included in the next model request.
15. **How do you qualify a lead?** A transparent heuristic score considers budget, intent, timeline, business fit and engagement.
16. **What is sentiment analysis?** Estimating whether customer language is positive, neutral or negative.
17. **What is Agentic AI?** AI combined with tools and controlled actions to accomplish a goal; this MVP has a limited agent workflow.
18. **How would you make booking autonomous?** Add a validated appointment tool, check calendar availability, request customer confirmation and persist the booking.
19. **How do you prevent hallucinations?** Ground responses in retrieved company knowledge and instruct the model not to invent unknown facts; still validate outputs.
20. **How is authentication handled?** Passwords are bcrypt-hashed and the API uses signed JWT bearer tokens.
21. **What is middleware?** Code that runs during the request/response pipeline, such as authentication or rate limiting.
22. **How do you protect customer data?** User-scoped queries, access control, encryption, consent and retention controls; more production hardening is required.
23. **What happens if the AI API fails?** The frontend displays an error; without a configured key the backend uses a clearly disclosed demo fallback.
24. **How do you support multilingual use?** The UI selects a language code for model responses and browser voice; voice availability depends on the device.
25. **How would you scale the backend?** Keep it stateless and run multiple instances behind a load balancer.
26. **How would you scale MongoDB?** Index common queries, use replica sets and evaluate sharding based on measured load.
27. **Why use queues?** To process slow summaries, CRM sync and analytics asynchronously with retries.
28. **How do you measure success?** Qualified-lead rate, appointment conversion, response latency, cost per conversation and customer satisfaction.
29. **What is the biggest limitation?** This is a browser MVP; production voice, semantic RAG and autonomous calendar/CRM tools need further engineering.
30. **What would you build next?** Streaming voice/telephony, vector RAG, confirmed appointment tool-calling, CRM integration, tests and load testing.
