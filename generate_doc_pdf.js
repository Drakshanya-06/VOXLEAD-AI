import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotsDir = path.resolve('screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function run() {
  console.log('1. Setting up demo user and seeding database data...');
  const baseApi = 'http://localhost:7000/api';
  let token = '';
  const testEmail = 'ui_demo@voxlead.ai';
  const testPass = 'password123';

  try {
    const regRes = await fetch(`${baseApi}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alex Vance', email: testEmail, password: testPass })
    });
    const regData = await regRes.json();
    token = regData.token;
  } catch (e) {}

  if (!token) {
    const logRes = await fetch(`${baseApi}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPass })
    });
    const logData = await logRes.json();
    token = logData.token;
  }

  if (token) {
    try {
      await fetch(`${baseApi}/dashboard/seed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Also add a sample knowledge base doc
      await fetch(`${baseApi}/knowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'VOXLEAD Enterprise Pricing & SLAs',
          content: 'Starter Package: ₹15,000/mo for up to 500 qualification minutes. Enterprise Package: ₹50,000/mo with unlimited voice calls, custom CRM webhook sync, and 99.9% uptime SLA.'
        })
      });
      console.log('Sample data seeded successfully.');
    } catch (e) {
      console.warn('Seeding note:', e.message);
    }
  }

  console.log('2. Launching Chrome with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,980']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 980, deviceScaleFactor: 2 });

  console.log('3. Capturing UI screens...');
  
  // A. Landing Page (Light)
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.landing');
  await page.screenshot({ path: path.join(screenshotsDir, '01_landing_light.png') });
  console.log('Captured 01_landing_light.png');

  // B. Landing Page (Dark)
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(screenshotsDir, '02_landing_dark.png') });
  console.log('Captured 02_landing_dark.png');

  // Reset to light
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
  });

  // C. Auth / Sign In Page
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.auth-card');
  await page.screenshot({ path: path.join(screenshotsDir, '03_auth_login.png') });
  console.log('Captured 03_auth_login.png');

  // D. Inject Auth Token for App Shell Pages
  await page.evaluate(t => {
    localStorage.setItem('voxlead_token', t);
  }, token);

  // E. Dashboard (Light)
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(screenshotsDir, '04_dashboard_light.png') });
  console.log('Captured 04_dashboard_light.png');

  // F. Dashboard (Dark)
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotsDir, '05_dashboard_dark.png') });
  console.log('Captured 05_dashboard_dark.png');

  // Reset to light for remaining sections
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
  });

  // G. AI Voice Agent Workspace
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.side-link')).find(b => b.textContent.includes('AI Voice Agent'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '06_ai_voice_agent.png') });
  console.log('Captured 06_ai_voice_agent.png');

  // H. Lead Management
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.side-link')).find(b => b.textContent.includes('Lead Management'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '07_lead_management.png') });
  console.log('Captured 07_lead_management.png');

  // I. Appointments
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.side-link')).find(b => b.textContent.includes('Appointments'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '08_appointments.png') });
  console.log('Captured 08_appointments.png');

  // J. Knowledge Base
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.side-link')).find(b => b.textContent.includes('Knowledge Base'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '09_knowledge_base.png') });
  console.log('Captured 09_knowledge_base.png');

  // K. Conversation Reports
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.side-link')).find(b => b.textContent.includes('Conversation Reports'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '10_conversation_reports.png') });
  console.log('Captured 10_conversation_reports.png');

  // Convert images to base64 so HTML can render offline cleanly
  const toBase64 = filename => {
    const p = path.join(screenshotsDir, filename);
    if (!fs.existsSync(p)) return '';
    const bitmap = fs.readFileSync(p);
    return `data:image/png;base64,${bitmap.toString('base64')}`;
  };

  console.log('4. Generating Comprehensive HTML Document for PDF rendering...');
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VOXLEAD AI — Complete UI Documentation</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
    
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1a2e26;
      background: #ffffff;
      line-height: 1.6;
    }

    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
        font-size: 9pt;
        color: #8c9e95;
      }
    }

    .page-break {
      page-break-after: always;
    }

    /* Cover Page */
    .cover {
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 20px;
      border-bottom: 2px solid #e1eee5;
    }
    .cover-top {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cover-badge {
      display: inline-block;
      background: #eaf7ee;
      color: #16845b;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .cover-title {
      font-size: 44px;
      font-weight: 800;
      line-height: 1.15;
      color: #103325;
      margin: 30px 0 16px;
      letter-spacing: -1.5px;
    }
    .cover-title span {
      color: #16845b;
    }
    .cover-subtitle {
      font-size: 18px;
      color: #5c7467;
      max-width: 650px;
      line-height: 1.6;
    }
    .cover-meta {
      background: #f7faf8;
      border: 1px solid #e3ede6;
      border-radius: 14px;
      padding: 24px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 40px;
    }
    .cover-meta div b {
      display: block;
      font-size: 13px;
      color: #103325;
      margin-bottom: 4px;
    }
    .cover-meta div span {
      font-size: 11px;
      color: #6a8274;
    }
    .cover-footer {
      font-size: 11px;
      color: #8a9e92;
      border-top: 1px solid #eef3ef;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
    }

    /* Section Structure */
    .section {
      padding: 25px 0 35px;
    }
    .section-header {
      margin-bottom: 20px;
      border-bottom: 2px solid #edf4f0;
      padding-bottom: 12px;
    }
    .section-eyebrow {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #16845b;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 24px;
      font-weight: 800;
      color: #113426;
      margin: 6px 0 8px;
      letter-spacing: -0.6px;
    }
    .section-desc {
      font-size: 13px;
      color: #586f62;
      margin: 0;
      line-height: 1.6;
    }

    /* Image Card */
    .ui-preview-card {
      background: #fcfdfc;
      border: 1px solid #e2ebe4;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(22, 132, 91, 0.06);
      margin: 20px 0;
    }
    .ui-preview-card img {
      width: 100%;
      height: auto;
      display: block;
    }
    .ui-caption {
      padding: 10px 16px;
      background: #f7faf8;
      border-top: 1px solid #e9f0eb;
      font-size: 11px;
      color: #62776b;
      font-weight: 600;
    }

    /* Feature Breakdown Cards */
    .feature-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin: 18px 0;
    }
    .feature-item {
      background: #f9fbf9;
      border: 1px solid #e7efe9;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .feature-item b {
      display: block;
      font-size: 12px;
      color: #123829;
      margin-bottom: 4px;
    }
    .feature-item p {
      font-size: 11px;
      color: #607569;
      margin: 0;
      line-height: 1.5;
    }

    .badge-pill {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 12px;
      background: #eaf7ee;
      color: #16845b;
      margin-right: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 11px;
    }
    th {
      background: #f1f7f3;
      color: #133829;
      padding: 10px 12px;
      text-align: left;
      font-weight: 700;
      border: 1px solid #e0eae2;
    }
    td {
      padding: 9px 12px;
      border: 1px solid #e7eee9;
      color: #496154;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover page-break">
    <div>
      <div class="cover-top">
        <span class="cover-badge">OFFICIAL USER INTERFACE ARCHITECTURE</span>
        <span style="font-size:12px;color:#789083;">VOXLEAD AI · v1.0.0</span>
      </div>
      <h1 class="cover-title">VOXLEAD <span>AI</span><br>Comprehensive UI Documentation & Visual Guide</h1>
      <p class="cover-subtitle">
        An end-to-end architectural, interactive, and functional walkthrough of the autonomous AI sales assistant interface. Featuring complete screen captures, component breakdowns, speech pipeline controls, and MongoDB data mapping.
      </p>

      <div class="cover-meta">
        <div>
          <b>Frontend Technology</b>
          <span>React 18 · Vite 6 · Tailwind CSS · Recharts</span>
        </div>
        <div>
          <b>Voice & Speech Engine</b>
          <span>Continuous Web Speech STT · Multi-Language TTS</span>
        </div>
        <div>
          <b>Persistence & API</b>
          <span>Node.js · Express · MongoDB Mongoose</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>Authored for VOXLEAD AI Sales System</span>
      <span>Comprehensive Interface Review · Single Document</span>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="section page-break">
    <div class="section-header">
      <span class="section-eyebrow">TABLE OF CONTENTS</span>
      <h2 class="section-title">Interface Architecture & Functional Index</h2>
      <p class="section-desc">Quick reference map of all pages and views documented within this single PDF.</p>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:15%">Section</th>
          <th style="width:35%">Module / Page</th>
          <th style="width:50%">Key Interactive Capabilities Covered</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><b>Section 01</b></td>
          <td><b>Public Landing Page</b></td>
          <td>Hero conversion, real-time waveform orb, live pill status, features matrix, step-by-step pipeline.</td>
        </tr>
        <tr>
          <td><b>Section 02</b></td>
          <td><b>Authentication & Session Security</b></td>
          <td>JWT-based login and registration, input validation, bcrypt encryption, persistent sessions.</td>
        </tr>
        <tr>
          <td><b>Section 03</b></td>
          <td><b>Overview Command Center</b></td>
          <td>5-card KPI row, weekly volume bar charts, qualification pie distribution, intent analytics, live feed.</td>
        </tr>
        <tr>
          <td><b>Section 04</b></td>
          <td><b>Autonomous AI Voice Agent</b></td>
          <td>Continuous speech recognition, live transcript feedback, manual stop/send controls, lead scoring meter.</td>
        </tr>
        <tr>
          <td><b>Section 05</b></td>
          <td><b>Lead Intelligence Management</b></td>
          <td>Enriched prospect database, status updates (Hot/Warm/Cold), budget extraction, search filtration.</td>
        </tr>
        <tr>
          <td><b>Section 06</b></td>
          <td><b>Appointments & Scheduling</b></td>
          <td>Direct demo booking engine, calendar conflict prevention, upcoming meeting queue.</td>
        </tr>
        <tr>
          <td><b>Section 07</b></td>
          <td><b>Knowledge Base (RAG System)</b></td>
          <td>Company product ground-truth documents, auto-chunking, keyword retrieval for accurate AI answers.</td>
        </tr>
        <tr>
          <td><b>Section 08</b></td>
          <td><b>Conversation Intelligence Reports</b></td>
          <td>Transcript audit logs, sentiment tracking (Positive/Neutral/Negative), conversational summaries.</td>
        </tr>
        <tr>
          <td><b>Section 09</b></td>
          <td><b>Dual-Theme Engine (Light vs. Dark)</b></td>
          <td>Custom Emerald Dark Mode palette, high-contrast typography, localStorage theme persistence.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 1: LANDING PAGE -->
  <div class="section page-break">
    <div class="section-header">
      <span class="section-eyebrow">SECTION 01 · PUBLIC EXPERIENCE</span>
      <h2 class="section-title">1. Public Landing Page & Visual Value Proposition</h2>
      <p class="section-desc">Designed to educate visitors on the capabilities of an autonomous sales assistant and drive rapid onboarding.</p>
    </div>

    <div class="ui-preview-card">
      <img src="${toBase64('01_landing_light.png')}" alt="Landing Page Preview">
      <div class="ui-caption">Figure 1.1: VOXLEAD AI Public Landing Page (Light Mode) with Top Navigation and Animated Hero Card.</div>
    </div>

    <div class="feature-list">
      <div class="feature-item">
        <b>Navigation & Theme Toggle</b>
        <p>Fixed top navigation with brand mark, anchor links to Features and Workflow, instant Dark Mode toggle, and quick launch actions.</p>
      </div>
      <div class="feature-item">
        <b>Interactive Voice Assistant Visual</b>
        <p>Features an animated voice card displaying live soundwave bars, assistant status pills, sample conversational bubble, and language pills.</p>
      </div>
      <div class="feature-item">
        <b>Core Value Grid</b>
        <p>Four primary value propositions highlighting Natural Voice, Lead Intelligence, Grounded Knowledge Base, and Action-Oriented Follow-up.</p>
      </div>
      <div class="feature-item">
        <b>Four-Step Sales Workflow</b>
        <p>Visual step sequence: 1. Listen to customer → 2. Understand needs → 3. Qualify & capture lead → 4. Book follow-up meeting.</p>
      </div>
    </div>
  </div>

  <!-- SECTION 2: AUTHENTICATION -->
  <div class="section page-break">
    <div class="section-header">
      <span class="section-eyebrow">SECTION 02 · ACCESS CONTROL</span>
      <h2 class="section-title">2. Authentication & Workspace Sign-In</h2>
      <p class="section-desc">Secure gateway ensuring tenant isolation and persistent authenticated user sessions.</p>
    </div>

    <div class="ui-preview-card">
      <img src="${toBase64('03_auth_login.png')}" alt="Authentication Login Screen">
      <div class="ui-caption">Figure 2.1: Sign In & Registration Modal with floating Theme Switcher and Client-Side Validation.</div>
    </div>

    <div class="feature-list">
      <div class="feature-item">
        <b>Password Security & Hashing</b>
        <p>Enforces 8+ character passwords, encrypted using bcryptjs (12 salt rounds) before database storage.</p>
      </div>
      <div class="feature-item">
        <b>JWT Token Lifecycle</b>
        <p>Issues 7-day signed JSON Web Tokens stored securely in the browser's localStorage for seamless subsequent visits.</p>
      </div>
      <div class="feature-item">
        <b>Instant Mode Switching</b>
        <p>Toggle between "Sign In" and "Create Account" without page refreshes, retaining entered form state.</p>
      </div>
      <div class="feature-item">
        <b>Tenant Isolation Guarantee</b>
        <p>Every lead, conversation, appointment, and document created is linked to the user's specific MongoDB ObjectId.</p>
      </div>
    </div>
  </div>

  <!-- SECTION 3: OVERVIEW DASHBOARD -->
  <div class="section page-break">
    <div class="section-header">
      <span class="section-eyebrow">SECTION 03 · EXECUTIVE COMMAND CENTER</span>
      <h2 class="section-title">3. Overview Dashboard & Sales Intelligence</h2>
      <p class="section-desc">Comprehensive real-time command center displaying lead distribution, deal pipeline, and conversational volume.</p>
    </div>

    <div class="ui-preview-card">
      <img src="${toBase64('04_dashboard_light.png')}" alt="Overview Dashboard Light Mode">
      <div class="ui-caption">Figure 3.1: Overview Dashboard featuring 5-Card KPI Row, Dual Recharts Visualizations, Intent Breakdown, and Live Activity Feed.</div>
    </div>

    <div class="feature-list">
      <div class="feature-item">
        <b>5-Card KPI Matrix</b>
        <p>Tracks Total Leads, Estimated Pipeline Value (calculated from budget extractions), Qualification Rate, Average Call Duration, and Booked Meetings.</p>
      </div>
      <div class="feature-item">
        <b>Weekly Volume Bar Chart</b>
        <p>Dual-bar interactive Recharts graph comparing daily customer voice sessions against high-intent qualified leads across 7 days.</p>
      </div>
      <div class="feature-item">
        <b>Lead Readiness Donut Chart</b>
        <p>Visual segment distribution of Hot (>=70 score), Warm (>=40 score), and Cold prospects ready for sales rep outreach.</p>
      </div>
      <div class="feature-item">
        <b>Customer Intent & Sentiment</b>
        <p>Progress bars highlighting top inquiries (Pricing, Demos, Integrations, Regional Voice) and real-time sentiment distribution.</p>
      </div>
    </div>
  </div>

  <!-- SECTION 4: AI VOICE AGENT -->
  <div class="section page-break">
    <div class="section-header">
      <span class="section-eyebrow">SECTION 04 · CONVERSATIONAL VOICE AGENT</span>
      <h2 class="section-title">4. Autonomous AI Voice Agent Workspace</h2>
      <p class="section-desc">Continuous Web Speech voice recognition, dynamic multi-turn qualification, and real-time lead score calculation.</p>
    </div>

    <div class="ui-preview-card">
      <img src="${toBase64('06_ai_voice_agent.png')}" alt="AI Voice Agent Workspace">
      <div class="ui-caption">Figure 4.1: AI Voice Agent Workspace showing Chat Thread, Continuous Mic Controls, Live Orb, and Lead Score Track.</div>
    </div>

    <div class="feature-list">
      <div class="feature-item">
        <b>Continuous Voice Recognition (No Cutoffs)</b>
        <p>Web Speech API configured with continuous listening. Displays live feedback: 'Hearing: "..."' with dedicated Stop (■) and 'Done & Send' controls.</p>
      </div>
      <div class="feature-item">
        <b>Multi-Language Regional Voices</b>
        <p>Native conversational responses in English, Hindi (हिन्दी), and Telugu (తెలుగు) with automated browser regional voice synthesizer matching.</p>
      </div>
      <div class="feature-item">
        <b>Real-Time Lead Score Meter</b>
        <p>0–100 dynamic scoring track evaluating company size, budget, urgency/timeline, and buying intent immediately as the customer speaks.</p>
      </div>
      <div class="feature-item">
        <b>Grounded RAG Knowledge Retrieval</b>
        <p>Answers customer questions by quoting verified company documents and FAQs rather than hallucinating pricing or terms.</p>
      </div>
    </div>
  </div>

  <!-- SECTION 5: LEAD MANAGEMENT -->
  <div class="section page-break">
    <div class="section-header">
      <span class="section-eyebrow">SECTION 05 · CRM & PIPELINE</span>
      <h2 class="section-title">5. Lead Management & Prospect Records</h2>
      <p class="section-desc">Searchable, enriched customer relationship management database synchronized with every voice session.</p>
    </div>

    <div class="ui-preview-card">
      <img src="${toBase64('07_lead_management.png')}" alt="Lead Management Screen">
      <div class="ui-caption">Figure 5.1: Lead Management table displaying customer company, score badges, extracted budget, and pipeline status.</div>
    </div>

    <div class="feature-list">
      <div class="feature-item">
        <b>Automated Entity Extraction</b>
        <p>Extracts company name, customer email, customer name, and monetary budget directly from natural voice transcripts without manual entry.</p>
      </div>
      <div class="feature-item">
        <b>Hot / Warm / Cold Badges</b>
        <p>High-contrast color badges reflecting buying readiness for instant prioritization by enterprise sales representatives.</p>
      </div>
      <div class="feature-item">
        <b>Fast Filter & Search</b>
        <p>Instant client-side text filtering by prospect name, email address, company name, or qualification category.</p>
      </div>
      <div class="feature-item">
        <b>Lifecycle Status Tracking</b>
        <p>Tracks deal progression from 'New' to 'In Discussion', 'Qualified', and 'Meeting Booked' directly backed by MongoDB.</p>
      </div>
    </div>
  </div>

  <!-- SECTION 6: APPOINTMENTS -->
  <div class="section page-break">
    <div class="section-header">
      <span class="section-eyebrow">SECTION 06 · MEETING SCHEDULER</span>
      <h2 class="section-title">6. Appointments & Demo Booking Engine</h2>
      <p class="section-desc">Dedicated booking workflow enabling customers and sales reps to transition conversation into scheduled calendar meetings.</p>
    </div>

    <div class="ui-preview-card">
      <img src="${toBase64('08_appointments.png')}" alt="Appointments Screen">
      <div class="ui-caption">Figure 6.1: Appointment booking interface and upcoming meeting queue sorted chronologically.</div>
    </div>

    <div class="feature-list">
      <div class="feature-item">
        <b>Two-Column Ergonomic Layout</b>
        <p>Left panel provides rapid meeting creation with customer name, email, date, time, and purpose; right panel shows upcoming schedule.</p>
      </div>
      <div class="feature-item">
        <b>Validation & Future Guarding</b>
        <p>Prevents scheduling past dates and validates full email formatting before persisting to MongoDB.</p>
      </div>
      <div class="feature-item">
        <b>Calendar Date Pill Presentation</b>
        <p>Displays day number and abbreviated month in emerald badges for rapid visual scanning of daily appointments.</p>
      </div>
      <div class="feature-item">
        <b>Lead Linkage</b>
        <p>Appointments link directly to the qualified Lead ID generated during the voice conversation.</p>
      </div>
    </div>
  </div>

  <!-- SECTION 7: KNOWLEDGE BASE -->
  <div class="section page-break">
    <div class="section-header">
      <span class="section-eyebrow">SECTION 07 · GROUNDED RAG SYSTEM</span>
      <h2 class="section-title">7. Knowledge Base & Grounded Retrieval</h2>
      <p class="section-desc">Repository of verified company facts, product catalogs, pricing tiers, and FAQs referenced by the voice agent.</p>
    </div>

    <div class="ui-preview-card">
      <img src="${toBase64('09_knowledge_base.png')}" alt="Knowledge Base Screen">
      <div class="ui-caption">Figure 7.1: Knowledge Base interface with document creator, indexed articles list, and RAG architecture briefing.</div>
    </div>

    <div class="feature-list">
      <div class="feature-item">
        <b>Document Authoring & Chunking</b>
        <p>Allows adding comprehensive documents which the backend automatically chunks into 700-character segments for granular retrieval.</p>
      </div>
      <div class="feature-item">
        <b>Keyword-Scored Relevance Engine</b>
        <p>Analyzes customer utterance keywords against indexed company documents to find top 3 highest-matching reference snippets.</p>
      </div>
      <div class="feature-item">
        <b>Zero-Hallucination Guardrail</b>
        <p>Instructs the AI agent to explicitly reference verified documents or admit lack of pricing details rather than inventing facts.</p>
      </div>
      <div class="feature-item">
        <b>Instant Document Management</b>
        <p>One-click document deletion with real-time UI synchronization and database cleanup.</p>
      </div>
    </div>
  </div>

  <!-- SECTION 8: CONVERSATION REPORTS -->
  <div class="section page-break">
    <div class="section-header">
      <span class="section-eyebrow">SECTION 08 · AUDIT & ANALYTICS</span>
      <h2 class="section-title">8. Conversation Intelligence & Audit Reports</h2>
      <p class="section-desc">Full transcripts, customer sentiment telemetry, and conversational summaries for management review.</p>
    </div>

    <div class="ui-preview-card">
      <img src="${toBase64('10_conversation_reports.png')}" alt="Conversation Reports Screen">
      <div class="ui-caption">Figure 8.1: Conversation Reports listing stored transcripts, timestamps, message counts, and sentiment badges.</div>
    </div>

    <div class="feature-list">
      <div class="feature-item">
        <b>Full Session Transcripts</b>
        <p>Stores user voice inputs and AI audio outputs with millisecond timestamps for compliance, training, and QA audits.</p>
      </div>
      <div class="feature-item">
        <b>Automated Summarization</b>
        <p>Generates concise summaries of customer requirements and discussions for sales handoffs.</p>
      </div>
      <div class="feature-item">
        <b>Sentiment Classification</b>
        <p>Labels conversations as Positive, Neutral, or Negative (identifying objections or frustration early).</p>
      </div>
      <div class="feature-item">
        <b>Lead Readiness Linkage</b>
        <p>Displays Hot/Warm/Cold classification badge directly beside session metadata for fast triage.</p>
      </div>
    </div>
  </div>

  <!-- SECTION 9: DARK MODE EXPERIENCE -->
  <div class="section page-break">
    <div class="section-header">
      <span class="section-eyebrow">SECTION 09 · DESIGN SYSTEM</span>
      <h2 class="section-title">9. Dual-Theme Experience: Emerald Dark Mode</h2>
      <p class="section-desc">High-contrast, eye-friendly dark aesthetic engineered specifically for high-frequency operations desks.</p>
    </div>

    <div class="ui-preview-card">
      <img src="${toBase64('05_dashboard_dark.png')}" alt="Dashboard Dark Mode">
      <div class="ui-caption">Figure 9.1: Overview Dashboard in Emerald Dark Mode with Deep Slate Backgrounds and Glowing Accents.</div>
    </div>

    <div class="feature-list">
      <div class="feature-item">
        <b>Deep Slate & Emerald Palette</b>
        <p>Engineered with #0d1613 deep charcoal-emerald backgrounds, #14221d card elevations, and #3ed18f glowing status indicators.</p>
      </div>
      <div class="feature-item">
        <b>High-Contrast Typography</b>
        <p>Text elements adapt to soft off-white (#e4eee8) and muted sage (#8fa599) to eliminate eye strain during evening operations.</p>
      </div>
      <div class="feature-item">
        <b>Consistent Component Inversion</b>
        <p>Every element — including modal inputs, voice wave orb, SVG charts, and tables — features custom dark mode overrides.</p>
      </div>
      <div class="feature-item">
        <b>Persistent User Choice</b>
        <p>Theme selection is synchronized with browser localStorage, automatically loading in dark or light mode on repeat visits.</p>
      </div>
    </div>
  </div>

</body>
</html>
  `;

  const htmlPath = path.resolve('VOXLEAD_AI_Complete_UI_Guide.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log('HTML guide generated at:', htmlPath);

  console.log('5. Rendering PDF via Chrome headless...');
  const pdfPage = await browser.newPage();
  await pdfPage.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  const pdfPath = path.resolve('VOXLEAD_AI_Complete_UI_Documentation.pdf');
  await pdfPage.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm'
    }
  });

  console.log('SUCCESS! PDF generated at:', pdfPath);
  await browser.close();
}

run().catch(err => {
  console.error('Error generating documentation:', err);
  process.exit(1);
});
