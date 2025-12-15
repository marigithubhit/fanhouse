# Video Walkthrough Guide (3-5 minutes)

This guide helps you structure your Loom video for the FanHouse engineering test.

## Video Structure

### Introduction (30 seconds)

**What to say:**
> "Hi, I'm [Your Name]. This is my submission for the FanHouse engineering test. I've built a vertical slice of an OnlyFans-class creator platform with Next.js, Node.js, PostgreSQL, and implemented all required features including authentication, creator onboarding, content gating, payments with a ledger system, and real-time capabilities using Ably."

**What to show:**
- Quick overview of the running application
- Show both frontend and backend running

---

### Architecture Overview (1 minute)

**What to say:**
> "Let me walk through the architecture. The frontend is built with Next.js 14 using the App Router, TypeScript, TailwindCSS, and shadcn/ui components. The backend is a Node.js Express API with TypeScript, connected to PostgreSQL. I've implemented role-based authentication with JWT, and all content access is enforced at the API level, not just in the UI."

**What to show:**
- Open the project structure in your editor
- Briefly show `backend/src/routes` folder
- Show `frontend/app` folder structure
- Show the database schema (`backend/src/db/schema.sql`)

**Key points to mention:**
- Frontend: Next.js 14 App Router
- Backend: Express + TypeScript
- Database: PostgreSQL with proper schema design
- Authentication: JWT-based with role-based access control

---

### Data Model & Smart Decisions (1-1.5 minutes)

**What to say:**
> "One of the smartest decisions I made was implementing a proper append-only ledger for all financial transactions. Instead of updating balances, every transaction creates a new immutable entry. This is critical for audit compliance, financial reconciliation, and meets real-world production requirements."

**What to show:**
- Open `backend/src/db/schema.sql`
- Highlight the `ledger_entries` table
- Show the payment routes (`backend/src/routes/payments.ts`)
- Point out the database transaction usage

**Code to highlight:**
```typescript
// Database transaction ensuring atomicity
await client.query('BEGIN');

// Create ledger entry (append-only)
await client.query(`INSERT INTO ledger_entries...`);

// Create subscription
await client.query(`INSERT INTO subscriptions...`);

await client.query('COMMIT');
// If anything fails, entire operation rolls back
```

**What to say:**
> "Another critical decision was enforcing access control at the API level. Content gating checks happen on every API request, not just in the UI. This prevents users from bypassing paywalls by manipulating the frontend."

**Show:**
- Open `backend/src/routes/posts.ts`
- Show the access control logic in the GET endpoints

---

### Live Demo (1 minute)

**What to demonstrate:**

1. **Admin Flow** (20 seconds)
   - Login as admin (`admin@fanhouse.com` / `admin123`)
   - Show admin panel
   - Show platform statistics

2. **Creator Flow** (20 seconds)
   - Register as creator
   - Submit verification
   - Admin approves creator
   - Creator creates a post with different access types

3. **Fan Flow** (20 seconds)
   - Register as fan
   - Subscribe to creator (show mock payment)
   - View locked vs unlocked content

**What to say while demoing:**
> "Here's the platform in action. The admin can approve creators, view all transactions, and manage the platform. Creators can create posts with three access types: public, subscriber-only, or pay-per-view. Fans can subscribe to creators or unlock individual PPV posts. All payments go through the mock CCBill processor and are recorded in the append-only ledger."

---

### Shortcuts & Tradeoffs (45 seconds)

**What to say:**
> "I took some intentional shortcuts for this MVP. First, payment processing uses a mock CCBill integration with simulated responses. In production, this would integrate with the real CCBill API and webhooks. Second, files are stored locally instead of cloud storage like S3. For production, I'd use signed URLs for secure, temporary access. Third, Persona verification is mocked - production would use the real Persona SDK. All of these shortcuts are documented with production solutions in the architecture file."

**What to show:**
- Briefly show `backend/src/routes/payments.ts` - mock payment function
- Show the uploads directory
- Show `backend/src/routes/creators.ts` - mock Persona

**What to say:**
> "These shortcuts were pragmatic choices to focus on demonstrating architectural correctness and production thinking, rather than integrating every third-party API."

---

### Conclusion (30 seconds)

**What to say:**
> "This project demonstrates production-quality code with proper separation of concerns, secure authentication and authorization, content gating enforced at the API level, a financial ledger system that would meet audit requirements, and real-time capabilities. The codebase is fully typed with TypeScript, includes Docker deployment configuration, and is ready to deploy to Cloud Run or any Node.js hosting platform. All technical decisions and tradeoffs are documented in the ARCHITECTURE.md file. Thank you for reviewing my submission."

**What to show:**
- Show README.md briefly
- Show ARCHITECTURE.md
- Show docker-compose.yml
- End on the running application

---

## Key Points to Emphasize

✅ **Architecture correctness** - Not just features, but the right way to build them

✅ **Append-only ledger** - Shows understanding of financial systems

✅ **API-level access control** - Security is not just UI hiding

✅ **Type safety** - TypeScript throughout

✅ **Database design** - Proper schema with relationships, indexes, constraints

✅ **Real-world thinking** - Mock integrations documented with production solutions

✅ **Deployment ready** - Docker, environment configs, migrations

## What NOT to Do

❌ Don't spend time explaining basic React or Express concepts

❌ Don't read code line by line

❌ Don't apologize for shortcuts - explain them as intentional tradeoffs

❌ Don't go over 5 minutes (aim for 3-4 minutes)

❌ Don't wing it - practice once before recording

## Pre-Recording Checklist

- [ ] Application is running (frontend + backend)
- [ ] Database has migrations run
- [ ] You have test accounts ready (admin, creator, fan)
- [ ] Code editor is open to relevant files
- [ ] Browser tabs are ready (localhost:3000, localhost:3001/health)
- [ ] You've practiced your talking points
- [ ] Screen recording software is ready (Loom)

## Recommended Flow

1. **Start with app running** - Show it works
2. **Quick architecture overview** - Show you understand the system
3. **Deep dive on smart decision** - Ledger system (this impresses)
4. **Live demo** - Prove it works end-to-end
5. **Acknowledge tradeoffs** - Show you make pragmatic decisions
6. **Conclude confidently** - This is production-quality work

## Time Breakdown

| Section | Time | Purpose |
|---------|------|---------|
| Introduction | 30s | Set context |
| Architecture | 1m | Show system understanding |
| Smart Decisions | 1-1.5m | Demonstrate expertise |
| Live Demo | 1m | Prove it works |
| Shortcuts | 45s | Show pragmatism |
| Conclusion | 30s | Confident finish |
| **Total** | **3-4m** | ✅ Within 5min limit |

---

## Sample Script

**Intro:**
"Hi, I'm [Name], and this is FanHouse - a production-quality vertical slice of an OnlyFans-class platform. I've implemented authentication, creator verification, content gating, payments, and real-time features using Next.js, Node.js, PostgreSQL, and Ably."

**Architecture:**
"The stack is Next.js 14 with App Router on the frontend, Express with TypeScript on the backend, and PostgreSQL for data. I've used JWT for authentication with role-based access control."

**Smart Decision:**
"The smartest decision I made was implementing an append-only ledger for all financial transactions. Every payment creates an immutable entry - no updates, no deletes. This enables complete audit trails and meets real-world compliance requirements. I also enforced content access at the API level, not just the UI, preventing paywall bypass."

**Demo:**
"Let me show you. Here's the admin panel with platform stats. I'll approve this creator, who can then create posts with public, subscriber-only, or PPV access. Fans can subscribe or unlock individual posts. All payments flow through the mock CCBill processor and are recorded in the ledger."

**Shortcuts:**
"I took intentional shortcuts: mock CCBill instead of real integration, local file storage instead of S3, and mock Persona verification. All documented with production solutions in ARCHITECTURE.md."

**Conclusion:**
"This demonstrates production thinking: proper architecture, financial integrity through the ledger, secure access control, full TypeScript coverage, and deployment-ready Docker configuration. Thanks for your time."

---

Good luck with your video! 🎥
