# Prospect Pathways

I want you to build a complete, production-style Sales & CRM platform called "RicozProspect".

I have attached a screenshot that represents the visual direction and product concept. The screenshot shows a Sales & CRM / outbound prospecting platform called RicozProspect.

IMPORTANT:

This is NOT just a UI recreation task.

I want a complete functional CRM web application with frontend, backend/server-side functionality, authentication, MongoDB database integration, CRUD operations, protected routes, dashboard, prospects, accounts, contacts, campaigns, pipeline, activities, follow-ups and analytics.

The application should be structured like a real SaaS CRM product.

==================================================

1. PROJECT GOAL

==================================================

Build "RicozProspect", an outbound sales prospecting and CRM platform.

The platform should help sales teams:

- Manage companies/accounts

- Manage contacts/prospects

- Define Ideal Customer Profiles (ICP)

- Target suitable accounts

- Track prospects

- Manage a sales pipeline

- Create outreach campaigns

- Create outreach sequences

- Track prospect engagement

- Manage follow-ups and tasks

- View CRM analytics

- Manage users and their CRM data

The application should feel like a real SaaS CRM rather than a simple CRUD application.

==================================================

2. TECH STACK

==================================================

Use the following stack:

Frontend:

- Next.js

- React.js

- JavaScript

- Tailwind CSS

Backend:

- Next.js App Router

- Next.js Route Handlers

- Server-side JavaScript

Database:

- MongoDB

- Mongoose

Authentication:

- Access Token

- Refresh Token

- JWT

- bcrypt/bcryptjs for password hashing

IMPORTANT:

Do NOT use TypeScript.

Do NOT use Express unless there is a very strong architectural reason.

Do NOT create a separate backend server if Next.js Route Handlers can handle the backend requirements.

Use JavaScript throughout the project.

==================================================

3. AUTHENTICATION ARCHITECTURE

==================================================

Implement proper production-style authentication using:

- Access Token

- Refresh Token

- JWT

- HTTP-only cookies where appropriate

Authentication flow should work like this:

REGISTER

User

 ↓

Register API

 ↓

Validate input

 ↓

Hash password

 ↓

Create MongoDB User

 ↓

Generate Access Token

 ↓

Generate Refresh Token

 ↓

Store refresh token securely

 ↓

Authenticate user

LOGIN

User

 ↓

Login API

 ↓

Verify email/password

 ↓

Generate Access Token

 ↓

Generate Refresh Token

 ↓

Return/set tokens securely

 ↓

User enters dashboard

ACCESS TOKEN:

- Short-lived

- Used to authorize protected API requests

- Should contain minimal information such as user ID

- Should NOT contain sensitive information

- Validate access token on protected API routes

REFRESH TOKEN:

- Long-lived

- Used to generate a new access token

- Store it securely using an HTTP-only cookie

- Should not be accessible through JavaScript

- Implement refresh token rotation

- Implement refresh token expiration

- Implement refresh token revocation/logout

LOGOUT:

When the user logs out:

- Invalidate/revoke the refresh token

- Clear authentication cookies

- Prevent the old refresh token from being reused

- Redirect the user to login

TOKEN REFRESH:

If the access token expires:

Client

 ↓

Refresh API

 ↓

Validate refresh token

 ↓

Rotate refresh token

 ↓

Generate new access token

 ↓

Continue authenticated session

Create appropriate endpoints:

POST /api/auth/register

POST /api/auth/login

POST /api/auth/refresh

POST /api/auth/logout

GET  /api/auth/me

IMPORTANT SECURITY REQUIREMENTS:

- Never store plain-text passwords

- Never expose refresh tokens to client-side JavaScript

- Use HTTP-only cookies for refresh tokens

- Use Secure cookies in production

- Use appropriate SameSite settings

- Keep access tokens short-lived

- Validate token signatures

- Validate token expiration

- Validate refresh token ownership

- Revoke refresh tokens during logout

- Prevent users from accessing another user's CRM data

Explain the complete authentication architecture before implementing it.

==================================================

4. USER MODEL

==================================================

Create a User model with fields such as:

- name

- email

- password

- role

- refreshTokens/session information

- createdAt

- updatedAt

Passwords must be hashed.

Never return the password field from APIs.

Support basic roles if useful:

- user

- admin

Do not overcomplicate role-based access control unless necessary.

==================================================

5. APPLICATION PAGES

==================================================

PUBLIC:

1. Landing page

2. Login

3. Register

PROTECTED:

4. Dashboard

5. Accounts

6. Account Details

7. Contacts

8. Contact/Prospect Details

9. Pipeline

10. Campaigns

11. Campaign Details

12. Tasks / Follow-ups

13. Analytics

14. Settings / Profile

All protected pages must require authentication.

==================================================

6. DASHBOARD

==================================================

Create a professional CRM dashboard.

Display:

- Total accounts

- Total contacts

- New prospects

- Contacted prospects

- Qualified prospects

- Opportunities

- Converted leads

- Pending follow-ups

- Active campaigns

Also display:

- Recent prospects

- Recent activities

- Upcoming follow-ups

- Pipeline overview

- Campaign performance

==================================================

7. ACCOUNTS / COMPANIES

==================================================

Users should be able to:

- Create account

- View accounts

- Search accounts

- Filter accounts

- Edit account

- Delete account

- View account details

Fields:

- companyName

- website

- industry

- companySize

- location

- revenue

- description

- status

- tags

- notes

- owner

- createdAt

- updatedAt

Statuses:

- Target

- Researching

- Contacted

- Qualified

- Opportunity

- Customer

- Lost

==================================================

8. ICP / ACCOUNT TARGETING

==================================================

Create an ICP module.

Users should be able to define:

- Industry

- Company size

- Location

- Revenue range

- Technology

- Company type

- Tags

For now use normal rule-based matching.

DO NOT use AI for ICP matching yet.

Example:

ICP:

Industry = SaaS

Company Size = 50-500

Location = USA

The application should be able to filter/match accounts against these rules.

==================================================

9. CONTACTS / PROSPECTS

==================================================

Create a complete Contacts/Prospects module.

Users should be able to:

- Create contact

- Edit contact

- Delete contact

- Search contacts

- Filter contacts

- View details

- Assign contact to account

- Change prospect status

- Add notes

- Add tags

- Track activities

Fields:

- firstName

- lastName

- email

- phone

- jobTitle

- company

- accountId

- location

- linkedinUrl

- status

- source

- tags

- notes

- owner

- createdAt

- updatedAt

Statuses:

- New

- Researching

- Contacted

- Replied

- Qualified

- Opportunity

- Converted

- Lost

==================================================

10. SALES PIPELINE

==================================================

Create a Kanban-style pipeline.

Columns:

- New

- Contacted

- Replied

- Qualified

- Opportunity

- Converted

- Lost

Users should be able to move prospects between stages.

If practical, implement drag-and-drop.

When the status changes:

Frontend

 ↓

API

 ↓

Validate authentication

 ↓

Validate ownership

 ↓

Update MongoDB

 ↓

Return updated prospect

 ↓

Update UI

==================================================

11. CAMPAIGNS

==================================================

Create campaigns.

Users can:

- Create campaign

- Edit campaign

- Delete campaign

- Activate campaign

- Pause campaign

- Complete campaign

- Add prospects

- View campaign details

Fields:

- name

- description

- status

- targetAudience

- startDate

- endDate

- createdBy

- createdAt

- updatedAt

Statuses:

- Draft

- Active

- Paused

- Completed

==================================================

12. OUTREACH SEQUENCES

==================================================

Create a basic multi-step outreach sequence system.

Do NOT integrate actual email sending yet.

Allow sequence steps such as:

Step 1 → Email

Step 2 → Follow-up

Step 3 → LinkedIn

Step 4 → Follow-up

Each step:

- stepNumber

- channel

- subject

- message

- delay

- createdAt

Users should be able to:

- Add step

- Edit step

- Delete step

- Reorder steps

==================================================

13. ENGAGEMENT / ACTIVITY TRACKING

==================================================

Create an activity timeline.

Track:

- Contact created

- Email sent

- Email opened

- Reply received

- Call

- Meeting

- Note added

- Status changed

- Follow-up created

- Follow-up completed

For now activities can be created/recorded through the application.

Do not integrate external email providers unless absolutely necessary.

==================================================

14. TASKS / FOLLOW-UPS

==================================================

Create Tasks/Follow-ups.

Fields:

- title

- description

- dueDate

- priority

- status

- relatedContact

- relatedAccount

- createdBy

- createdAt

- updatedAt

Priority:

- Low

- Medium

- High

Status:

- Pending

- Completed

Users should be able to:

- Create

- Edit

- Delete

- Complete

- Filter

- Search

==================================================

15. ANALYTICS

==================================================

Create basic analytics.

Show:

- Total prospects

- Prospects by status

- Accounts by industry

- Conversion rate

- Campaign statistics

- Activity statistics

- Pipeline distribution

Use charts only where useful.

==================================================

16. SETTINGS

==================================================

Create Settings.

Include:

- User profile

- Name

- Email

- Change password

- Logout

==================================================

17. DATABASE MODELS

==================================================

Use MongoDB + Mongoose.

Create:

- User

- Account

- Contact

- ICP

- Campaign

- Sequence

- Activity

- Task

Create appropriate relationships using MongoDB references.

IMPORTANT:

Every CRM document must be associated with the authenticated user where appropriate.

Users must NEVER be able to access another user's accounts, contacts, campaigns, activities or tasks.

Always check ownership on the server.

==================================================

18. API ARCHITECTURE

==================================================

Use Next.js Route Handlers.

AUTH:

POST /api/auth/register

POST /api/auth/login

POST /api/auth/refresh

POST /api/auth/logout

GET  /api/auth/me

ACCOUNTS:

GET    /api/accounts

POST   /api/accounts

GET    /api/accounts/[id]

PUT    /api/accounts/[id]

DELETE /api/accounts/[id]

CONTACTS:

GET    /api/contacts

POST   /api/contacts

GET    /api/contacts/[id]

PUT    /api/contacts/[id]

DELETE /api/contacts/[id]

ICPs:

GET    /api/icps

POST   /api/icps

PUT    /api/icps/[id]

DELETE /api/icps/[id]

CAMPAIGNS:

GET    /api/campaigns

POST   /api/campaigns

GET    /api/campaigns/[id]

PUT    /api/campaigns/[id]

DELETE /api/campaigns/[id]

TASKS:

GET    /api/tasks

POST   /api/tasks

PUT    /api/tasks/[id]

DELETE /api/tasks/[id]

ACTIVITIES:

GET    /api/activities

POST   /api/activities

All protected endpoints must validate authentication and ownership.

Use proper HTTP status codes.

Use consistent JSON responses.

==================================================

19. FRONTEND UI

==================================================

Use Tailwind CSS.

Create:

- Sidebar

- Top navigation

- Dashboard

- Tables

- Cards

- Modals

- Forms

- Dropdowns

- Toasts

- Loading states

- Empty states

- Error states

- Confirmation dialogs

Sidebar:

Dashboard

Accounts

Contacts

Pipeline

Campaigns

Tasks

Analytics

Settings

Include:

- User profile

- Logout

==================================================

20. DESIGN

==================================================

Use the attached RicozProspect screenshot as the visual/product inspiration.

Design should be:

- Professional

- Minimal

- Enterprise SaaS

- Modern

- Clean

- Sales-focused

- Responsive

Use a red/pink accent inspired by the screenshot.

Do not simply copy the screenshot.

The screenshot is the product/branding direction.

The actual application should be a complete CRM dashboard.

==================================================

21. RESPONSIVE DESIGN

==================================================

Support:

Desktop

Tablet

Mobile

Mobile should include:

- Collapsible sidebar

- Responsive cards

- Responsive forms

- Usable tables

- Horizontally scrollable data when required

- Usable pipeline

==================================================

22. VALIDATION

==================================================

Implement proper validation for:

- Email

- Password

- Required fields

- MongoDB IDs

- Duplicate records

- Authentication

- Authorization

Return useful error messages.

Never expose internal server/database errors.

==================================================

23. SECURITY

==================================================

Follow production-style security practices.

Implement:

- Password hashing

- Access token validation

- Refresh token validation

- Refresh token rotation

- Refresh token revocation

- HTTP-only cookies

- Secure cookies in production

- Proper SameSite configuration

- Protected routes

- API authorization

- User ownership checks

- Input validation

- Safe MongoDB queries

- No password exposure

- No secrets in source code

==================================================

24. ENVIRONMENT VARIABLES

==================================================

Create:

.env.local

.env.example

Example:

MONGODB_URI=

ACCESS_TOKEN_SECRET=

REFRESH_TOKEN_SECRET=

ACCESS_TOKEN_EXPIRES_IN=

REFRESH_TOKEN_EXPIRES_IN=

NEXT_PUBLIC_APP_URL=

Explain every variable.

Never hardcode secrets.

==================================================

25. FOLDER STRUCTURE

==================================================

Before implementation, explain the complete folder structure.

Use a clean Next.js App Router structure.

Example:

src/

│

├── app/

│   ├── page.js

│   ├── login/

│   │   └── page.js

│   ├── register/

│   │   └── page.js

│   │

│   ├── dashboard/

│   │   └── page.js

│   │

│   ├── accounts/

│   │   ├── page.js

│   │   └── [id]/

│   │       └── page.js

│   │

│   ├── contacts/

│   │   ├── page.js

│   │   └── [id]/

│   │       └── page.js

│   │

│   ├── pipeline/

│   │   └── page.js

│   │

│   ├── campaigns/

│   │   ├── page.js

│   │   └── [id]/

│   │       └── page.js

│   │

│   ├── tasks/

│   │   └── page.js

│   │

│   ├── analytics/

│   │   └── page.js

│   │

│   ├── settings/

│   │   └── page.js

│   │

│   └── api/

│       ├── auth/

│       ├── accounts/

│       ├── contacts/

│       ├── icps/

│       ├── campaigns/

│       ├── tasks/

│       └── activities/

│

├── components/

│   ├── ui/

│   ├── layout/

│   ├── dashboard/

│   ├── accounts/

│   ├── contacts/

│   ├── pipeline/

│   ├── campaigns/

│   └── tasks/

│

├── models/

│   ├── User.js

│   ├── Account.js

│   ├── Contact.js

│   ├── ICP.js

│   ├── Campaign.js

│   ├── Sequence.js

│   ├── Activity.js

│   └── Task.js

│

├── lib/

│   ├── mongodb.js

│   ├── auth.js

│   ├── tokens.js

│   ├── utils.js

│   └── validations.js

│

└── middleware.js

You may improve this structure if you have a better production-friendly architecture.

If you change the structure, explain why.

Explain what each important folder and file is responsible for.

==================================================

26. COMPLETE SETUP

==================================================

Explain setup from ZERO.

Include:

1. Create Next.js project

2. Install dependencies

3. Configure Tailwind CSS

4. Configure MongoDB

5. Create MongoDB database

6. Configure Mongoose

7. Configure environment variables

8. Implement authentication

9. Configure access tokens

10. Configure refresh tokens

11. Configure middleware

12. Run development server

13. Test authentication

14. Test APIs

15. Build production

16. Deploy application

Give exact terminal commands.

==================================================

27. DEVELOPMENT PROCESS

==================================================

Do NOT dump a massive amount of unstructured code.

Follow this order:

PHASE 1

Architecture

PHASE 2

Folder structure

PHASE 3

Dependencies/setup

PHASE 4

MongoDB connection

PHASE 5

Database models

PHASE 6

Authentication

PHASE 7

Access token + refresh token system

PHASE 8

Middleware/protected routes

PHASE 9

Accounts

PHASE 10

Contacts

PHASE 11

ICP

PHASE 12

Pipeline

PHASE 13

Campaigns

PHASE 14

Sequences

PHASE 15

Activities

PHASE 16

Tasks/follow-ups

PHASE 17

Dashboard

PHASE 18

Analytics

PHASE 19

Settings

PHASE 20

Responsive UI/polishing

PHASE 21

Testing

PHASE 22

Production deployment

For every major file:

- Give exact file path

- Give complete code

- Explain the code

- Mention required dependencies

- Explain how it connects to the rest of the system

Keep the implementation beginner-friendly but production-oriented.

==================================================

28. AI FEATURES — DO NOT IMPLEMENT YET

==================================================

IMPORTANT:

Do NOT implement AI features in the current version.

However, I want you to analyze the RicozProspect product and suggest useful AI features that could be added in future versions.

After completing the core architecture, provide a separate section:

"Recommended Future AI Features"

Suggest practical AI features specifically useful for a Sales & CRM / outbound prospecting platform.

For each suggested AI feature, explain:

1. Feature name

2. What it does

3. Why it is useful

4. Where it would fit in RicozProspect

5. What data it would require

6. Possible APIs/models that could be used later

7. Difficulty level

8. Whether it should be Free, Pro, or Enterprise in a future SaaS pricing model

Possible areas to analyze include:

- AI lead scoring

- AI prospect/company research

- AI email personalization

- AI outreach message generation

- AI follow-up suggestions

- AI reply classification

- AI sales summaries

- AI meeting summaries

- AI next-best-action recommendations

- AI ICP recommendations

- AI account prioritization

- AI churn/opportunity prediction

- AI CRM data enrichment

- AI sales assistant

BUT:

Do not implement any of these now.

Do not install AI SDKs.

Do not call OpenAI/Gemini/Claude APIs.

Only suggest and architect possible future AI integrations.

Keep the current application completely functional without AI.

==================================================

29. REAL FUNCTIONALITY

==================================================

Do not create fake UI.

Every major button should perform a real action.

Example:

Add Account

→ Form

→ Validation

→ API

→ Authentication

→ MongoDB

→ Response

→ UI update

Delete Account

→ Confirmation

→ API

→ Authentication

→ Ownership check

→ MongoDB

→ UI update

Change Prospect Status

→ API

→ Authentication

→ Ownership check

→ MongoDB

→ UI update

Logout

→ Revoke refresh token

→ Clear cookie

→ Redirect to login

Token expiry

→ Access token expires

→ Refresh token API

→ Rotate refresh token

→ New access token

→ Continue session

==================================================

30. FINAL REQUIREMENTS

==================================================

The final application should allow:

Register

↓

Login

↓

Access Token + Refresh Token authentication

↓

Dashboard

↓

Create Accounts

↓

Create Contacts/Prospects

↓

Define ICP

↓

Target accounts

↓

Move prospects through pipeline

↓

Create campaigns

↓

Create outreach sequences

↓

Track activities

↓

Create follow-ups

↓

View analytics

↓

Manage profile

↓

Logout

The final product should feel like a real portfolio-quality SaaS CRM.

At the end provide:

1. Complete folder structure

2. Setup instructions

3. npm packages

4. Environment variables

5. Database schema

6. Authentication architecture

7. Access token flow

8. Refresh token flow

9. API documentation

10. Route protection explanation

11. Local development instructions

12. Production build instructions

13. Deployment instructions

14. Testing checklist

15. Recommended future AI features

16. Future SaaS features

17. Possible Free/Pro/Enterprise feature separation

IMPORTANT:

Build the current version WITHOUT AI.

AI should only be suggested as future functionality.

Start with:

PHASE 1 — Architecture

PHASE 2 — Folder Structure

PHASE 3 — Setup

Then proceed step-by-step through implementation.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7518781b-8a00-47dd-b95c-440920d15225).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
