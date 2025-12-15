# FanHouse - Creator Platform MVP

A full-stack OnlyFans-class creator platform built as a vertical slice demonstration of production-quality code.

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **shadcn/ui** components
- **Ably** for real-time features
- **Axios** for API calls

### Backend
- **Node.js + TypeScript**
- **Express.js**
- **PostgreSQL** database
- **JWT** authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads
- **Ably** for real-time events

### Infrastructure
- **Docker** & Docker Compose
- PostgreSQL 15
- Cloud Run ready (or any Node.js hosting)

## Architecture Overview

### Database Schema
The platform uses PostgreSQL with the following key tables:
- **users** - Fan, Creator, and Admin accounts
- **creator_profiles** - Extended creator information and verification status
- **posts** - Content with access gating (public/subscriber/PPV)
- **subscriptions** - Fan-to-Creator subscriptions
- **ppv_unlocks** - Pay-per-view content unlocks
- **ledger_entries** - Append-only transaction log (critical for payments)
- **notifications** - In-app notification system

### Key Features

#### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (Fan, Creator, Admin)
- Secure password hashing with bcrypt
- Token-based API protection

#### 2. Creator Onboarding
- Creator application flow
- Mock Persona verification integration
- Verification states: pending → approved/rejected
- Only approved creators can monetize

#### 3. Content Gating
Three access levels:
- **Public** - Anyone can view
- **Subscriber-only** - Requires active subscription
- **PPV** - Pay-per-view unlocks

Access enforcement at API level with proper authorization checks.

#### 4. Payment System (Mock CCBill)
- Mock payment processor simulating CCBill
- Subscription payments (recurring model)
- PPV unlock payments (one-time)
- 95% success rate simulation

#### 5. Append-Only Ledger
Critical feature for financial integrity:
- All transactions recorded in `ledger_entries`
- No updates to transaction records
- Full audit trail
- Supports: subscriptions, PPV unlocks, refunds, payouts

#### 6. Real-Time Features (Ably)
Implemented real-time events:
- New post notifications
- New subscriber notifications
- PPV unlock confirmations
- Admin action broadcasts

#### 7. Notifications (Mock Knock.app)
- In-app notification storage
- Notification types: verification updates, new subscribers, PPV unlocks
- Database-backed with read/unread status

#### 8. Admin Panel
Admin capabilities:
- View all users and creators
- Approve/reject creator verifications
- Enable/disable creators
- View all posts and transactions
- Platform statistics dashboard

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Option 1: Local Development

#### 1. Clone the repository
```bash
git clone <your-repo-url>
cd FanHouse
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Set up PostgreSQL
Create a database named `fanhouse`:
```bash
createdb fanhouse
```

#### 4. Configure environment variables

Backend (.env):
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/fanhouse
JWT_SECRET=your-super-secret-jwt-key-change-this
ABLY_API_KEY=your_ably_key (optional)
```

Frontend (.env.local):
```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ABLY_KEY=your_ably_key (optional)
```

#### 5. Run database migrations
```bash
cd backend
npm run migrate
```

This creates the schema and a default admin user:
- Email: `admin@fanhouse.com`
- Password: `admin123`

#### 6. Start the development servers
```bash
# From root directory
npm run dev
```

This starts both frontend (port 3000) and backend (port 3001).

### Option 2: Docker Deployment

#### 1. Build and run with Docker Compose
```bash
docker-compose up -d
```

#### 2. Run migrations in the container
```bash
docker-compose exec backend npm run migrate
```

#### 3. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Usage

### Testing the Platform

#### 1. Admin Access
Login with the default admin account:
- Email: `admin@fanhouse.com`
- Password: `admin123`

Navigate to `/admin` to:
- View platform statistics
- Manage creators
- View all transactions

#### 2. Create a Creator Account
1. Go to `/register`
2. Choose "Creator" role
3. Register with email/username/password
4. Submit verification (mock Persona flow)
5. Admin must approve the creator

#### 3. Create a Fan Account
1. Go to `/register`
2. Choose "Fan" role
3. Register with credentials
4. Browse creators and content

#### 4. Creator Workflow
Once approved:
1. Navigate to dashboard
2. Click "Create Post"
3. Choose access type (public/subscriber/PPV)
4. Upload media (images/videos)
5. Post is visible based on access rules

#### 5. Fan Workflow
1. Browse creators
2. Subscribe to creators (mock payment)
3. Unlock PPV content (mock payment)
4. View unlocked content

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Creators
- `GET /api/creators` - List approved creators
- `GET /api/creators/:id` - Get creator profile
- `PUT /api/creators/profile` - Update profile (creator only)
- `POST /api/creators/verify` - Submit verification (creator only)

### Posts
- `GET /api/posts` - List posts (with access control)
- `GET /api/posts/:id` - Get single post (with access control)
- `POST /api/posts` - Create post (creator only)
- `DELETE /api/posts/:id` - Delete post (creator only)

### Payments
- `POST /api/payments/subscribe` - Subscribe to creator
- `POST /api/payments/unlock-ppv` - Unlock PPV content
- `GET /api/payments/subscriptions` - User's subscriptions
- `GET /api/payments/transactions` - User's transaction history

### Admin
- `GET /api/admin/users` - All users
- `GET /api/admin/creators` - All creators
- `POST /api/admin/creators/:id/verify` - Approve/reject creator
- `POST /api/admin/creators/:id/toggle` - Enable/disable creator
- `GET /api/admin/posts` - All posts
- `POST /api/admin/posts/:id/toggle` - Enable/disable post
- `GET /api/admin/transactions` - All transactions
- `GET /api/admin/stats` - Platform statistics

## Design Decisions & Tradeoffs

### Smart Decisions

#### 1. Append-Only Ledger
Implemented a proper append-only ledger for all financial transactions. This is critical for:
- Audit compliance
- Financial reconciliation
- Dispute resolution
- No data corruption from updates

#### 2. API-Level Access Control
Content gating is enforced at the API level, not just in the UI. This prevents:
- Direct URL access bypassing
- API manipulation
- Unauthorized content access

#### 3. Transaction-Based Payments
Used database transactions for payment flows to ensure:
- Atomicity (all-or-nothing)
- Consistency (ledger + subscription/unlock together)
- Rollback on payment failures

#### 4. Role-Based Middleware
Centralized authorization middleware for:
- Consistent security enforcement
- Easy to audit
- Scalable permission model

### Shortcuts Taken

#### 1. Mock Payment Provider
CCBill integration is mocked with:
- Simulated API responses
- Random transaction IDs
- 95% success rate simulation

**Production requirement**: Integrate real CCBill API with webhooks.

#### 2. Local File Storage
Files stored locally in `/uploads` directory.

**Production requirement**: Use cloud storage (S3, GCS) with signed URLs for secure access.

#### 3. Mock Persona Verification
Persona verification generates fake inquiry IDs.

**Production requirement**: Integrate real Persona SDK for identity verification.

#### 4. No Redis Caching
Direct database queries without caching layer.

**Production consideration**: Add Redis for:
- Session management
- Content caching
- Real-time presence

#### 5. Simplified Real-Time
Ably integration is event-publishing only.

**Production enhancement**: Add:
- Presence indicators
- Live chat
- Typing indicators

#### 6. Basic Error Handling
Simple try-catch with console logging.

**Production requirement**:
- Structured logging (Winston, Pino)
- Error tracking (Sentry)
- Monitoring (Datadog, New Relic)

## Security Considerations

### Implemented
- JWT token authentication
- Password hashing (bcrypt)
- SQL injection prevention (parameterized queries)
- CORS configuration
- Role-based access control

### Production Requirements
- Rate limiting
- HTTPS/SSL certificates
- Environment variable security
- Database connection pooling limits
- File upload validation (MIME type verification)
- Content moderation system
- GDPR compliance
- Age verification

## Scalability Considerations

### Current Architecture
Suitable for:
- MVP/prototype
- < 1000 concurrent users
- Single server deployment

### Scale Requirements
For production scale:
1. **Database**: Connection pooling, read replicas, partitioning
2. **Backend**: Horizontal scaling, load balancing
3. **Frontend**: CDN for static assets, edge caching
4. **Storage**: Cloud object storage with CDN
5. **Caching**: Redis cluster
6. **Queue**: Message queue for async jobs (transcoding, notifications)

## Testing

### Manual Testing Checklist
- [ ] User registration (fan & creator)
- [ ] Login/logout
- [ ] Creator verification flow
- [ ] Post creation (all access types)
- [ ] Subscription payment
- [ ] PPV unlock payment
- [ ] Content access control
- [ ] Admin approval/rejection
- [ ] Transaction ledger entries
- [ ] Real-time notifications (if Ably configured)

### Automated Testing
Not included in this MVP. Production would need:
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright)
- Load tests (k6)

## Deployment

### Cloud Run (Google Cloud)
1. Build containers:
```bash
docker build -t gcr.io/PROJECT_ID/fanhouse-backend ./backend
docker build -t gcr.io/PROJECT_ID/fanhouse-frontend ./frontend
```

2. Push to Container Registry:
```bash
docker push gcr.io/PROJECT_ID/fanhouse-backend
docker push gcr.io/PROJECT_ID/fanhouse-frontend
```

3. Deploy to Cloud Run:
```bash
gcloud run deploy fanhouse-backend --image gcr.io/PROJECT_ID/fanhouse-backend
gcloud run deploy fanhouse-frontend --image gcr.io/PROJECT_ID/fanhouse-frontend
```

### Environment Variables
Ensure all production environment variables are set in Cloud Run configuration.

## License
Proprietary - FanHouse Engineering Test

## Contact
For questions or issues, please contact the development team.
