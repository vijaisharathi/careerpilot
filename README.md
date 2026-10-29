# Career Pilot AI — AI-Powered Career Guidance & Placement Agent

> **Production-Oriented Web Application & Educational SaaS Platform**  
> An intelligent career development platform engineered for college students to analyze skills, discover career paths, identify skill gaps, generate tailored milestone learning roadmaps, optimize resumes, practice technical and behavioral interviews, and track campus/off-campus placement applications.

---

## 🏛️ System Architecture

The application is structured as a modern monorepo separating **Backend (Node.js/Express/TypeScript)** and **Frontend (React/Vite/Tailwind CSS)** with shared contracts, strict request validation, and an enterprise-grade provider-independent LLM pipeline.

```
career-pilot-ai/
├── package.json                   # Root workspace scripts (dev, test, lint, build)
├── .gitignore                     # Git ignore rules for node_modules, secrets, dist
├── README.md                      # Architecture documentation & setup guide
│
├── backend/                       # Express.js REST API service (TypeScript)
│   ├── .env.example               # Safe environment variable configuration blueprint
│   ├── tsconfig.json              # Strict TypeScript compilation config
│   ├── vitest.config.ts           # Backend test suite config
│   ├── eslint.config.mjs          # ESLint 9 configuration
│   └── src/
│       ├── config/                # Environment and database connectivity
│       ├── controllers/           # Health, Auth, and AI controllers
│       ├── middleware/            # Auth, Error, Validation, NotFound middlewares
│       ├── models/                # User Mongoose model
│       ├── routes/                # Health, Auth, and AI route endpoints
│       ├── services/              # Auth service and Provider-Independent LLM service
│       ├── utils/                 # Envelopes, AppError, JWT, and Leveled Logger
│       └── validations/           # Shared Zod schemas
│
└── frontend/                      # React 18 + Vite + TypeScript + Tailwind CSS SPA
    ├── .env.example               # Frontend environment template
    ├── vite.config.ts             # Vite bundler config with /api reverse proxy
    ├── tailwind.config.js         # Tailwind CSS styling design tokens
    ├── postcss.config.js          # PostCSS processor config
    ├── tsconfig.json              # Strict TypeScript config
    └── src/
        ├── components/
        │   ├── common/            # Atomic Reusable UI Components
        │   │   ├── Button.tsx     # Variant-driven button with loading spinner
        │   │   ├── Card.tsx       # Standard card container
        │   │   ├── Badge.tsx      # Status badges (success, warning, info, danger)
        │   │   ├── Spinner.tsx    # Accessible SVG spinner
        │   │   ├── ProgressBar.tsx# Visual progress bar with threshold variants
        │   │   ├── Modal.tsx      # Accessible modal dialog with focus trap
        │   │   ├── Table.tsx      # Responsive data table with empty state
        │   │   ├── SearchBar.tsx  # Search input with instant clear
        │   │   ├── FilterControls.tsx # Dropdown filter group controls
        │   │   ├── FormControls.tsx # Input, Select, Textarea, and ToggleSwitch
        │   │   ├── SkeletonLoader.tsx # Card and row skeleton placeholders
        │   │   ├── Dropdown.tsx   # Popover action menu
        │   │   ├── Tabs.tsx       # Line & Pill tab navigation
        │   │   ├── LoadingState.tsx # Standardized loading state view
        │   │   ├── ErrorState.tsx # Standardized error state view with retry
        │   │   ├── EmptyState.tsx # Standardized empty state view with CTA
        │   │   └── SuccessState.tsx # Standardized success state view
        │   ├── layout/
        │   │   ├── Sidebar.tsx    # Persistent & responsive mobile drawer navigation
        │   │   ├── Header.tsx     # Top navigation with search, alerts & user menu
        │   │   ├── DashboardLayout.tsx # Authenticated shell with sidebar and header
        │   │   ├── Navbar.tsx     # Public site navbar
        │   │   └── Footer.tsx     # Standard architectural footer
        │   └── features/
        │       ├── HealthStatusWidget.tsx # Live API & DB health monitor
        │       ├── StateShowcase.tsx      # Interactive UI state testbed
        │       └── CareerGuidanceWidget.tsx # AI Career Advisor demo
        ├── context/
        │   ├── AuthContext.tsx    # JWT session management & user cache
        │   ├── StudentDataContext.tsx # Global student profile, roadmap & tracker state
        │   └── ToastContext.tsx   # Dynamic toast notification alerts
        └── pages/                 # 19 Fully-Implemented Responsive Pages
            ├── HomePage.tsx       # 1. Public landing page
            ├── RegisterPage.tsx   # 2. Registration page
            ├── LoginPage.tsx      # 3. Login page
            ├── OnboardingPage.tsx # 4. Student onboarding wizard (4 steps)
            ├── DashboardPage.tsx  # 5. Main student dashboard (all 9 components)
            ├── ProfilePage.tsx    # 6. Profile & skills management
            ├── CareerAnalysisPage.tsx # 7. Career fit analysis & benchmarks
            ├── SkillGapPage.tsx   # 8. Skill-gap analysis matrix
            ├── RoadmapPage.tsx    # 9. Adaptive learning roadmap
            ├── JobsPage.tsx       # 10. Job & internship discovery
            ├── JobDetailsPage.tsx # 11. Job details & compatibility breakdown
            ├── ResumeBuilderPage.tsx # 12. ATS resume builder with live preview
            ├── ResumeAnalysisPage.tsx # 13. Resume ATS analysis & scoring
            ├── InterviewPrepPage.tsx # 14. Interview preparation question bank
            ├── InterviewSessionPage.tsx # 15. Mock interview simulator with timer
            ├── ApplicationsPage.tsx # 16. Application tracker (Kanban & Table)
            ├── AiAssistantPage.tsx # 17. AI career assistant chat
            ├── NotificationsPage.tsx # 18. Notifications & alerts
            ├── SettingsPage.tsx   # 19. Account & preference settings
            └── NotFoundPage.tsx   # 404 error page
```

---

## 🗺️ Complete Page Routing Map

| URL Route | Page Title | Primary Functionality |
| :--- | :--- | :--- |
| `/` | Public Landing Page | Hero section, benefits, 4-step workflow, FAQ accordion, system health, CTA |
| `/register` | Student Registration | Account creation with university & target role validation |
| `/login` | Student Sign In | Authentication with demo student credential auto-fill |
| `/onboarding` | Onboarding Wizard | 4-step intake (Education &rarr; Target Role &rarr; Skills &rarr; Summary) |
| `/dashboard` | Student Dashboard | Readiness summary, recommended roles, roadmap progress, interview reminders, next actions |
| `/profile` | Profile & Skills | Competencies manager (Levels: Beginner to Advanced), education modal, certifications |
| `/career-analysis` | Career Fit Analysis | Benchmarks against Full-Stack, Backend, Cloud/DevOps, Data/AI with compensation |
| `/skill-gap` | Skill-Gap Matrix | Target role selector, missing critical skills, priority badges, study hour estimates |
| `/roadmap` | Learning Roadmap | Milestone sprint checklist with interactive module completion toggles |
| `/jobs` | Job & Intern Discovery | Search & filter by role type, work mode, and minimum match score |
| `/jobs/:id` | Job Details | Role description, candidate requirements, profile compatibility breakdown, application CTA |
| `/resume-builder` | ATS Resume Builder | Split-screen editor with live printable single-column ATS preview and markdown export |
| `/resume-analysis` | Resume ATS Analysis | Overall score (84/100), formatting checks, and high-yield keyword recommendations |
| `/interview-prep` | Interview Prep Hub | Curated questions filterable by topic, company (Stripe, Google, Amazon), and difficulty |
| `/interview-session` | Mock Simulator | 30-minute countdown timer, code editor with syntax check, AI evaluation scorecard |
| `/applications` | Application Tracker | Kanban board (Wishlist &rarr; Applied &rarr; Interview &rarr; Offered &rarr; Rejected) + Table view |
| `/ai-assistant` | AI Career Assistant | Chat agent connected to backend LLM service with suggested prompt pills |
| `/notifications` | Notifications & Alerts | Categorized alerts (Interviews, Matches, Roadmap) with "Mark All Read" action |
| `/settings` | Account Settings | Profile handles, password update, notification toggles, and JSON data export |

---

## 🔒 Authentication & Persistent Student Profile Architecture

### 1. Database Persistence & Models
- **`User` (`User.ts`)**: Credentials & session security model.
  - Email uniqueness with lowercase indexing (`match: /\S+@\S+\.\S+/`).
  - Passwords hashed using `bcryptjs` with salt work factor of 10 (`select: false`, stripped from JSON transforms).
  - Refresh token rotation records array storing cryptographic SHA-256 hashes of refresh tokens, metadata (client IP, User-Agent), and expiration dates (`select: false`).
  - Linked to `StudentProfile` through `profileId` reference.
- **`StudentProfile` (`StudentProfile.ts`)**: Student portfolio & academic state model.
  - Core fields: `fullName`, `email`, `phone`, `location`, `headline`, `college`, `degree`, `department`, `graduationYear`.
  - Nested sub-documents: `skills`, `projects`, `certifications`, `educationHistory`, `experience`.
  - `careerInterests`: `targetRoles`, `preferredLocations`, `preferredMode`, `careerGoals`, `targetCompensation`.
  - Automated `completionPercentage` calculation (0–100%) via pre-save hook based on completeness of basic info, education, skills, projects, experience, and target roles.

### 2. Token Security & Rotation Strategy
- **Access Tokens**: Short-lived (15 minutes), signed with `JWT_SECRET`. Contains claims `{ userId, email, role, tokenType: 'access' }`.
- **Refresh Tokens**: Long-lived (7 days), signed with `JWT_REFRESH_SECRET`. Contains UUID `tokenId` and `tokenType: 'refresh'`.
- **Cryptographic Hashing**: Plaintext refresh tokens are never stored in the database. Only SHA-256 hashes are persisted.
- **Strict Token Rotation & Theft Detection**: On each refresh, the old token is consumed and revoked. If an attacker replays a previously consumed token, all refresh tokens for that user account are revoked immediately as a compromise mitigation.
- **Rate Limiting**: `express-rate-limit` prevents brute-force credential stuffing (20 attempts per 15-minute window on auth endpoints).
- **Strict Ownership Isolation**: Authenticated endpoints read `userId` exclusively from the verified JWT payload (`req.user.userId`), strictly forbidding cross-user read/write attempts.

### 3. REST API Endpoints

#### Authentication (`/api/auth`)
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Rate Limited | Register new student, hashes password, creates profile, issues token pair |
| `POST` | `/api/auth/login` | Rate Limited | Authenticates credentials, issues token pair |
| `POST` | `/api/auth/refresh-token`| Rate Limited | Rotates refresh token and issues new access token |
| `POST` | `/api/auth/logout` | `Bearer JWT` | Revokes active refresh token or clears session tokens |
| `GET` | `/api/auth/me` | `Bearer JWT` | Returns authenticated user and attached profile |

#### Student Profile (`/api/profile`)
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile/me` | `Bearer JWT` | Get current student's full profile and portfolio |
| `PUT` | `/api/profile/me` | `Bearer JWT` | Update college, degree, department, headline, bio, career goals |
| `POST` | `/api/profile/skills` | `Bearer JWT` | Add technical/soft skill with proficiency rating |
| `PUT` | `/api/profile/skills/:id` | `Bearer JWT` | Update skill proficiency or verification |
| `DELETE`| `/api/profile/skills/:id` | `Bearer JWT` | Remove skill from profile |
| `POST` | `/api/profile/projects` | `Bearer JWT` | Add student project with technologies & bullets |
| `PUT` | `/api/profile/projects/:id` | `Bearer JWT` | Update student project |
| `DELETE`| `/api/profile/projects/:id`| `Bearer JWT` | Remove project |
| `POST` | `/api/profile/certifications`| `Bearer JWT` | Add verified certification credential |
| `DELETE`| `/api/profile/certifications/:id`| `Bearer JWT` | Remove certification |
| `POST` | `/api/profile/education` | `Bearer JWT` | Add university or college degree record |
| `DELETE`| `/api/profile/education/:id` | `Bearer JWT` | Remove education record |
| `POST` | `/api/profile/experience` | `Bearer JWT` | Add internship or work experience entry |
| `DELETE`| `/api/profile/experience/:id` | `Bearer JWT` | Remove experience entry |

#### AI Career Analysis & Skill Gap (`/api/career`)
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/career/roles` | Public | List all 12+ supported career roles and requirements |
| `GET` | `/api/career/roles/:slug` | Public | Get single career role specifications and salary benchmarks |
| `POST` | `/api/career/analyze` | `Bearer JWT` | Run deterministic scoring and AI narrative analysis for target role |
| `GET` | `/api/career/analysis/latest` | `Bearer JWT` | Retrieve latest analysis with profile staleness detection |
| `GET` | `/api/career/analysis/history` | `Bearer JWT` | Retrieve user's previous analysis runs |
| `GET` | `/api/career/analysis/:id` | `Bearer JWT` | Retrieve specific analysis by ID with ownership verification |

---

## 🧠 Explainable AI & Deterministic Scoring Engine

### 1. Transparent Scoring Algorithm
To prevent LLM hallucination or arbitrary score invention, all numerical scores are computed deterministically prior to LLM narrative generation:
- **Skill Match Score (0–100%)**:
  - Weight multiplier: Critical skills are weighted **3x**, recommended skills **1x**.
  - Partial Credit: Awarded proportionally when student possesses a skill below required proficiency ($Rank_{student} / Rank_{required}$, e.g. Beginner (1) vs Intermediate (2) yields 50% credit).
- **Readiness Score (0–100%)**:
  $$\text{Readiness} = 0.50 \times \text{SkillMatch} + 0.20 \times \text{ProjectDepth} + 0.15 \times \text{Experience} + 0.15 \times \text{Academics}$$
- **Suitability Classification**:
  - **High Match**: $\ge 75\%$
  - **Moderate Match**: $50\% - 74\%$
  - **Developing Match**: $< 50\%$

### 2. AI Explainability & Schema Validation
The configured server-side LLM (Gemini, OpenAI, or Mock) receives the deterministic score breakdown and generates:
- Executive Career Summary.
- Strengths narrative contextualized with real student projects.
- Gap Analysis narrative detailing recruiter screening expectations.
- Tailored capstone projects and certifications addressing identified gaps.
- 30-60-90 day milestone action plans.

Model outputs are strictly parsed and validated against `careerAnalysisAiResponseSchema` (Zod). If the model returns invalid JSON, times out, or is offline, the system safely falls back to a deterministic rule-based template engine and clearly marks `isAiSimulated: true` and `aiProvider: 'deterministic-fallback'`.

---

## 🗺️ Personalized Learning Roadmap Module

The Personalized Learning Roadmap module converts student career goals and identified skill gaps into a structured, week-by-week curriculum with verified resources and interactive progress tracking:

### 1. Curated Verified Learning Resource Catalog
* Purely legitimate, canonical documentation and learning links: MDN Web Docs, React Docs, Node.js Foundation, Microsoft TypeScript Handbook, MongoDB Docs, PostgreSQL, Redis, Docker, Kubernetes, AWS Guides, LeetCode, and GitHub Open Source Guides.
* Strictly **zero** hallucinated, broken, or fake course links.

### 2. Structured Hierarchy
* **Phases**:
  * **Phase 1: Foundations & Critical Skill-Gap Remediation** — Closing primary prerequisite gaps required for technical rounds.
  * **Phase 2: Advanced Architecture & Industry Design Patterns** — Scalable API engineering, indexing, caching, and distributed data systems.
  * **Phase 3: Capstone Engineering & Placement Interview Sprint** — Full-stack capstone project, containerized deployment, mock technical rounds, and DSA practice.
* **Weeks**: Focus theme and task allocations based on weekly study hours ($weeklyHours \times 60$ minutes budget).
* **Tasks**: Deterministic `taskKey`, learning objective, estimated duration, type (`Concept`, `Hands-on Exercise`, `Project`, `DSA`, `Reading`, `Assessment`), and verified resources.

### 3. Dynamic Progress Tracking & Schedule Management
* Toggling task completion (`PATCH /api/roadmap/tasks/:taskId`) automatically updates `completedAt` and triggers pre-save hooks to recalculate phase progress, phase status, completed tasks count, and overall roadmap progress percentage ($0-100\%$).
* Students can customize their weekly pace and total duration via `PATCH /api/roadmap/schedule` (3-40 hours/week, 2-24 weeks).

### 4. Progress Preservation on Regeneration
* When students regenerate their roadmap for new or updated career targets (`POST /api/roadmap/regenerate`), existing completed tasks are matched by `taskKey` and normalized title.
* Completion credit (`completed: true`, `completedAt`) is preserved automatically so students never lose progress for modules they already completed.

### 5. API Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/roadmap` | Get student's active learning roadmap | Yes (JWT) |
| `POST` | `/api/roadmap/generate` | Generate personalized structured roadmap | Yes (JWT) |
| `PATCH` | `/api/roadmap/tasks/:taskId` | Toggle task completion (completed/pending) | Yes (JWT) |
| `PATCH` | `/api/roadmap/schedule` | Update weekly study hours and total weeks | Yes (JWT) |
| `POST` | `/api/roadmap/regenerate` | Regenerate plan preserving finished tasks | Yes (JWT) |

---

## 💼 Job & Internship Discovery and Profile-Based Matching

The Job and Internship Discovery module empowers students to explore relevant employment vacancies and understand their exact fit through transparent, mathematical matching and independent academic eligibility audits:

### 1. Normalized Opportunity Data Model (`jobOpportunity.model.ts`)
* Fields: `title`, `slug`, `company`, `companyLogo`, `description`, `roleCategory`, `employmentType` (`Full-time`, `Internship`, `Co-op`), `workMode` (`Remote`, `Hybrid`, `On-site`), `location`, `compensation`, `experienceRequirements`, `requiredSkills` (weighted with minimum proficiency and importance), `preferredSkills`, `minimumQualifications` (degree, majors, GPA, grad years), `responsibilities`, `applicationUrl`, `source`, `dataSourceType`, `isVerifiedVacancy`, and `status`.

### 2. Extensible Data Source Integration Layer (`jobSource.service.ts`)
* Standardized `IJobSourceProvider` interface decoupling data collection from persistence.
* `LocalSeedJobProvider`: Loads high-quality simulated vacancies for campus recruitment practice.
* **Integrity Guarantee**: All demo listings are explicitly tagged with `isVerifiedVacancy: false` and accompanied by a visible demo disclaimer banner. Demo data is never misrepresented as verified live vacancies.

### 3. Transparent Deterministic Matching Engine (`jobMatching.service.ts`)
* **Skill Match Score ($0 - 100\%$)**:
  $$\text{MatchScore} = \min\left(100, \left(\frac{\sum (w_i \times \text{credit}_i)}{\sum w_i} \times 90\right) + \text{preferredBonus}\right)$$
  * Credit: Full credit ($1.0$) for meeting or exceeding required proficiency, partial credit ($0.75$ / $0.5$) for 1-2 proficiency levels below.
  * Preferred Skills: $+2.5\%$ bonus per matched preferred skill (up to $10\%$).
* **Independent Academic Eligibility Assessment**:
  * Assesses degree level, academic major/department, graduation year window, and minimum GPA independently from skill match.
  * **Strict Missing Data Policy**: Whenever student profile information is absent (e.g. unlisted GPA or graduation year), the system marks the criterion as `unverified` and sets the overall verdict to `Requires Verification` rather than falsely claiming eligibility.

### 4. URL Security & SSRF Protection (`urlValidator.ts`)
* Validates external application links, ensuring only legitimate public `http` and `https` protocols are allowed.
* Strictly blocks malicious schemes (`javascript:`, `data:`, `file:`) and private/internal IP ranges (`127.0.0.1`, `10.x`, `172.16-31.x`, `192.168.x`, and cloud metadata IP `169.254.169.254`).

### 5. API Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/jobs` | Search & filter opportunities with pagination and match scores | Optional (JWT for matching) |
| `GET` | `/api/jobs/:idOrSlug` | Detailed opportunity with breakdown & eligibility checklist | Optional (JWT for matching) |
| `GET` | `/api/jobs/:id/ai-insights` | AI preparation tips & skill-gap remediation advice | Yes (JWT) |
| `GET` | `/api/jobs/saved` | List authenticated student's saved/bookmarked jobs | Yes (JWT) |
| `POST` | `/api/jobs/:id/save` | Save opportunity with optional notes | Yes (JWT) |
| `DELETE` | `/api/jobs/:id/save` | Remove opportunity from student's saved list | Yes (JWT) |
| `POST` | `/api/jobs/seed` | Seed demonstration opportunities if empty | Optional / Admin |

---



## 🚀 Getting Started

### 1. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Environment Variables
Copy `.env.example` templates to `.env`:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Run Development Servers
Launch both Backend and Frontend concurrently with one command:
```bash
npm run dev
```

* **Frontend Application**: [http://localhost:5173](http://localhost:5173)
* **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Quality Assurance & Verification

All quality checks execute cleanly with zero errors across the entire workspace:

```bash
# Typecheck TypeScript files
npm run typecheck

# Run automated test suites (Vitest)
npm run test

# Run ESLint across all files
npm run lint

# Production build
npm run build
```
