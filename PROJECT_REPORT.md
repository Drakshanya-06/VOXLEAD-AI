# VOXLEAD AI — Autonomous AI Sales Voice Agent

**Project type:** Full-stack Generative AI / Agentic AI prototype  
**Objective:** Convert customer conversations into structured, actionable sales opportunities.

## Problem
Sales teams spend significant time responding to repetitive enquiries, collecting prospect details, identifying purchase intent and arranging follow-ups. Important customer context can be lost between conversations and CRM updates.

## Proposed solution
VOXLEAD AI is a browser-based sales assistant that accepts voice or text input, uses an LLM to respond conversationally, retrieves relevant company knowledge, captures lead signals and stores conversation and appointment records in a dashboard.

## Key capabilities
- Voice input/output using browser Web Speech APIs, with text fallback.
- Gemini-powered conversational responses when configured.
- Contextual conversation history persisted in MongoDB.
- Lead score (0–100), Hot/Warm/Cold classification and sentiment signal.
- Company knowledge retrieval using a keyword-based RAG baseline.
- Lead management, appointment records, conversation reports and dashboard analytics.
- JWT authentication, bcrypt password hashing and server-side secret configuration.

## Technology stack
React, Vite, JavaScript, Node.js, Express, MongoDB, Mongoose, Gemini API, Web Speech API, Axios, Recharts and Tailwind CSS configuration.

## Architecture and workflow
Customer voice/text → React UI → Express API → conversation orchestration → knowledge retrieval + LLM → qualification/sentiment analysis → MongoDB → lead, appointment and reporting dashboards. See `docs/architecture.svg`.

## Scalability approach
For a production target of 100,000 registered users, use stateless API instances behind a load balancer, tenant-aware database indexes, managed MongoDB replica sets/sharding where justified, Redis caching, asynchronous queues for summaries and integrations, rate limits, observability and CDN-hosted frontend assets. Registered-user count is not equivalent to simultaneous calls; concurrency and audio throughput must be capacity-planned and load-tested.

## Security considerations
Hash passwords, authenticate protected endpoints, keep AI credentials server-side, validate inputs, restrict CORS, rate-limit APIs and apply consent, encryption, retention and access controls to customer data. Production requires a full security review and tenant-isolation tests.

## Commercial feasibility
Potential customers include SMBs, SaaS vendors, education providers, real-estate teams and service businesses. A commercial model could combine a monthly workspace subscription with usage-based voice/LLM charges. Unit economics depend on call duration, model tokens, speech provider, concurrency, hosting and support; current prototype does not claim production cost or performance figures.

## Scope and future enhancements
This MVP demonstrates the core browser-based conversation and lead workflow. Next steps include semantic vector RAG, explicit AI tool calling for confirmed appointment creation, calendar/CRM integrations, telephony, streaming audio, multilingual evaluation, monitoring, automated tests and load testing.
