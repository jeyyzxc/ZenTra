# Deployment and n8n Orchestration Readiness Plan  
## Zion Events Place and Management System

> **Archived architecture note:** this plan predates the current full-stack Next.js
> implementation. Do not deploy a duplicate backend API to Render. Use the canonical
> [`../deployment/vercel-supabase-render.md`](../deployment/vercel-supabase-render.md):
> Vercel runs the full Next.js application, Supabase provides application data/storage,
> and Render runs n8n only.

---

## 1. Overview

This document provides a clear deployment readiness plan for the **Zion Events Place and Management System**.

The system will not be fully deployed yet. However, the project should already be prepared for future deployment, cloud database connection, backend hosting, frontend hosting, and n8n workflow orchestration.

### Planned Deployment Setup

| System Part | Platform |
|---|---|
| Frontend | Vercel |
| Backend API | Render |
| Database | Supabase PostgreSQL |
| Automation / Orchestration | n8n |
| File Storage | Supabase Storage, if needed |

The goal is to make the system ready for future deployment while still allowing local development.

---

## 2. Target System Architecture

### 2.1 High-Level Architecture

```text
Client / Admin User
        ↓
Frontend Admin Panel / Website
Hosted on Vercel
        ↓
Backend API
Hosted on Render
        ↓
Supabase PostgreSQL Database
        ↑
n8n Orchestration Workflows
        ↓
Email Provider / Notifications / Workflow Results
```

### 2.2 Main Component Responsibilities

| Component | Platform | Responsibility |
|---|---|---|
| Frontend | Vercel | Hosts the user interface, admin dashboard, and client-facing pages |
| Backend API | Render | Handles validation, authentication, business logic, secure API routes, and database operations |
| Database | Supabase PostgreSQL | Stores bookings, payments, contracts, users, logs, and workflow records |
| n8n | n8n Cloud or self-hosted | Handles workflow automation, email sending, reminders, and orchestration |
| Storage | Supabase Storage | Stores optional files such as receipts, contracts, uploaded proofs, and documents |

---

## 3. Deployment Readiness Goals

Since the system is not yet ready for full deployment, the current objective is to prepare the system for future deployment.

### Main Goals

1. Prepare the frontend for deployment to Vercel.
2. Prepare the backend for deployment to Render.
3. Prepare the database for deployment to Supabase PostgreSQL.
4. Prepare environment variables for local, staging, and production.
5. Prepare backend API endpoints for n8n orchestration.
6. Prepare secure communication between the backend and n8n.
7. Keep local development working while making the system cloud-ready.
8. Avoid hardcoded credentials, URLs, API keys, and database connection strings.
9. Make future deployment easier, safer, and more organized.

---

## 4. Environment Strategy

The system should support three environments:

1. Local Development
2. Staging / Preview
3. Production

---

### 4.1 Local Development

Used while developing the system locally.

Example setup:

```text
Frontend: http://localhost:3000
Backend: http://localhost:5000 or http://localhost:8000
Database: Local PostgreSQL or Supabase development database
n8n: Local n8n or n8n test webhook URL
```

---

### 4.2 Staging / Preview

Used for testing the system online before final production deployment.

Example setup:

```text
Frontend: Vercel Preview Deployment
Backend: Render Staging Service
Database: Supabase Staging Project
n8n: n8n Test or Staging Workflow
```

---

### 4.3 Production

Used for the final live version of the system.

Example setup:

```text
Frontend: Vercel Production Domain
Backend: Render Production Service
Database: Supabase Production Project
n8n: n8n Production Workflow URLs
```

---

## 5. Frontend Deployment Plan — Vercel

### 5.1 Frontend Preparation

Before deploying the frontend, make sure the project has:

- Clean project structure
- Working local build
- No hardcoded backend URLs
- Environment-based API URL
- Proper error handling for failed backend requests
- Loading and empty states
- Protected admin routes if authentication exists
- Responsive UI

---

### 5.2 Recommended Frontend Environment Variables

For **Next.js**:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-render-backend-url.onrender.com
NEXT_PUBLIC_APP_ENV=production
```

For **Vite / React**:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
VITE_APP_ENV=production
```

---

### 5.3 Frontend API Connection Rule

Do not hardcode API URLs such as:

```text
http://localhost:5000/api/bookings
```

Instead, use:

```text
API_BASE_URL + /api/bookings
```

This allows the same frontend code to work in local, staging, and production environments.

---

### 5.4 Vercel Deployment Steps

1. Push the frontend code to GitHub.
2. Connect the frontend repository to Vercel.
3. Set the correct build command.
4. Set the correct output directory.
5. Add frontend environment variables.
6. Deploy to Preview first.
7. Test all pages and API connections.
8. Promote to Production once ready.

---

### 5.5 Frontend Deployment Checklist

| Task | Status |
|---|---|
| Remove hardcoded localhost API URLs | Pending |
| Add frontend environment variables | Pending |
| Confirm build command works locally | Pending |
| Connect GitHub repository to Vercel | Future |
| Add Vercel Preview environment variables | Future |
| Add Vercel Production environment variables | Future |
| Test frontend-to-backend API connection | Future |
| Test admin dashboard pages | Future |

---

## 6. Backend Deployment Plan — Render

### 6.1 Backend Preparation

Before deploying the backend to Render, make sure the backend has:

- Proper start command
- Health check route
- Environment-based configuration
- Supabase PostgreSQL connection support
- CORS configuration for Vercel frontend
- Secure API routes
- Request validation
- Error logging
- n8n webhook integration placeholders
- Database migration support

---

### 6.2 Recommended Backend Health Check Route

Add a simple health route:

```text
GET /health
```

Expected response:

```json
{
  "status": "ok",
  "service": "zion-backend",
  "environment": "production"
}
```

This helps confirm that the backend service is running properly after deployment.

---

### 6.3 Recommended Backend Environment Variables

```env
APP_ENV=production
PORT=10000

FRONTEND_URL=https://your-vercel-frontend-domain.vercel.app
CORS_ORIGIN=https://your-vercel-frontend-domain.vercel.app

DATABASE_URL=your_supabase_postgres_connection_string

SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

JWT_SECRET=your_secure_jwt_secret
SESSION_SECRET=your_secure_session_secret

N8N_BASE_URL=https://your-n8n-domain.com
N8N_WEBHOOK_SECRET=your_secure_n8n_secret

N8N_BOOKING_CREATED_WEBHOOK_URL=your_n8n_booking_created_webhook_url
N8N_PAYMENT_SYNC_WEBHOOK_URL=your_n8n_payment_sync_webhook_url
N8N_CONTRACT_WORKFLOW_WEBHOOK_URL=your_n8n_contract_workflow_webhook_url
N8N_EMAIL_RESULT_WEBHOOK_URL=your_n8n_email_result_webhook_url

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=zion_events@example.com
```

---

### 6.4 Backend Deployment Steps

1. Push the backend code to GitHub.
2. Create a new Web Service in Render.
3. Connect the backend repository.
4. Set the build command.
5. Set the start command.
6. Add backend environment variables.
7. Add the health check path.
8. Connect the backend to Supabase PostgreSQL.
9. Run database migrations.
10. Test the backend health route.
11. Test API routes from the deployed frontend.
12. Check backend logs for errors.

---

### 6.5 Backend Deployment Checklist

| Task | Status |
|---|---|
| Add `/health` route | Pending |
| Add environment-based database config | Pending |
| Add CORS configuration for Vercel | Pending |
| Add Supabase connection string support | Pending |
| Add n8n webhook placeholders | Pending |
| Add audit log and email log endpoints | Pending |
| Add migration command | Pending |
| Connect GitHub repo to Render | Future |
| Add Render environment variables | Future |
| Test backend deployment logs | Future |

---

## 7. Database Deployment Plan — Supabase PostgreSQL

### 7.1 Supabase Role in the System

Supabase PostgreSQL will be the main cloud database of the system.

It will store:

- Admin users
- Team management records
- Bookings
- Payments
- Contracts
- Audit logs
- Email logs
- Workflow sync records
- Notification records
- System settings

---

### 7.2 Recommended Database Strategy

Use Supabase as the cloud database, but let the backend remain the gatekeeper of business logic.

Recommended rule:

```text
Frontend → Backend API → Supabase Database
```

The frontend should not directly modify sensitive database tables.

This protects sensitive system operations such as:

- Booking status changes
- Payment sync
- Contract updates
- Audit logs
- Email logs
- Admin management
- n8n workflow results

---

### 7.3 Recommended Core Tables

Prepare these tables:

```text
users
roles
bookings
booking_status_history
booking_activity_timeline
payments
contracts
audit_logs
email_logs
n8n_workflow_logs
notifications
system_settings
```

---

### 7.4 Recommended Workflow Tracking Table

Create a table for workflow-related logs:

```text
n8n_workflow_logs
```

Suggested fields:

```text
id
workflow_name
workflow_execution_id
related_module
related_record_id
trigger_source
request_payload
response_payload
status
error_message
started_at
completed_at
created_at
updated_at
```

Recommended statuses:

```text
pending
processing
success
failed
retrying
cancelled
```

---

### 7.5 Supabase Setup Steps

1. Create a Supabase project.
2. Create the database schema.
3. Run migrations.
4. Add seed data if needed.
5. Get the database connection string.
6. Store the connection string in Render environment variables.
7. Store Supabase project URL and service role key only in the backend environment.
8. Test backend database connection.
9. Test create, read, update, and delete operations through the backend API.
10. Confirm that logs are saved correctly.

---

### 7.6 Database Checklist

| Task | Status |
|---|---|
| Create Supabase project | Future |
| Prepare migration files | Pending |
| Prepare seed data | Pending |
| Add bookings table | Pending |
| Add payments table | Pending |
| Add contracts table | Pending |
| Add audit logs table | Pending |
| Add email logs table | Pending |
| Add n8n workflow logs table | Pending |
| Connect backend to Supabase | Future |
| Test database connection | Future |

---

## 8. n8n Orchestration Integration Plan

### 8.1 Main Integration Principle

The backend should act as the secure middle layer between the system and n8n.

Recommended flow:

```text
System Event
→ Backend validates event
→ Backend triggers n8n webhook
→ n8n performs automation
→ n8n returns or sends workflow result
→ Backend validates result
→ Backend updates Supabase
→ Audit Logs / Email Logs / Timeline are updated
```

Avoid allowing n8n to freely update all database tables directly unless necessary. It is safer and cleaner for n8n to communicate with the backend API.

---

## 9. n8n Workflow Connection Design

### 9.1 Outbound Flow: Backend Triggers n8n

When something important happens in the system, the backend sends data to n8n.

Examples:

- New booking created
- Booking confirmed
- Payment recorded
- Payment reminder needed
- Contract ready
- Contract link sent
- Booking cancelled
- Booking rescheduled
- Inquiry received

Example flow:

```text
Booking Created
→ Backend validates booking
→ Backend saves booking
→ Backend calls n8n Booking Created Webhook
→ n8n sends confirmation email
→ n8n sends admin notification
→ n8n sends result back to backend
→ Backend updates Email Logs and Booking Timeline
```

---

### 9.2 Inbound Flow: n8n Sends Result Back to Backend

After n8n finishes a workflow, it should call a backend callback endpoint.

Example flow:

```text
n8n workflow completed
→ HTTP Request node calls backend callback endpoint
→ Backend validates n8n secret/signature
→ Backend saves workflow result
→ Backend updates related booking/payment/contract record
→ Backend creates audit log and email log
```

---

## 10. Recommended Backend API Endpoints for n8n

### 10.1 Booking Orchestration Endpoints

```text
POST /api/orchestration/bookings/upsert
POST /api/orchestration/bookings/status-update
POST /api/orchestration/bookings/workflow-result
POST /api/orchestration/bookings/conflict-detected
```

Purpose:

- Create or update booking records from workflow data
- Update booking status
- Save workflow result
- Handle conflict detection results

---

### 10.2 Payment Sync Endpoints

```text
POST /api/orchestration/payments/sync-summary
POST /api/orchestration/payments/reminder-result
POST /api/orchestration/payments/failed-reminder
```

Purpose:

- Sync payment summary into Booking Management
- Save payment reminder email result
- Log failed reminder attempts

---

### 10.3 Contract Workflow Endpoints

```text
POST /api/orchestration/contracts/preparation-result
POST /api/orchestration/contracts/delivery-result
POST /api/orchestration/contracts/signing-status
```

Purpose:

- Update contract preparation status
- Save contract email delivery result
- Update signing status

---

### 10.4 Email Logs Endpoint

```text
POST /api/orchestration/email-logs
```

Purpose:

- Save email delivery results from n8n
- Track sent, delivered, failed, bounced, pending, or retried emails

---

### 10.5 Workflow Logs Endpoint

```text
POST /api/orchestration/workflow-logs
```

Purpose:

- Save n8n execution status
- Store workflow execution ID
- Store workflow result
- Store failure details

---

## 11. Recommended n8n Workflows

### 11.1 Booking Confirmation Workflow

Trigger:

```text
New booking created or booking confirmed
```

Workflow:

```text
Webhook Trigger
→ Validate booking payload
→ Format booking details
→ Send booking confirmation email to client
→ Send admin notification
→ Send result to backend email logs endpoint
→ Send workflow result to backend
→ Respond to webhook
```

Expected result:

- Client receives booking confirmation.
- Admin receives notification.
- Email Logs are updated.
- Booking Timeline is updated.
- Audit Logs are updated.

---

### 11.2 Payment Reminder Workflow

Trigger:

```text
Scheduled daily workflow or manual backend trigger
```

Workflow:

```text
Schedule Trigger or Webhook Trigger
→ Get unpaid or pending payment records
→ Filter due payments
→ Send payment reminder email
→ Save email result to backend
→ Update workflow log
→ Notify admin if failed
```

Expected result:

- Client receives payment reminder.
- Failed reminders are logged.
- Admin can review failed attempts in System Logs.

---

### 11.3 Contract Delivery Workflow

Trigger:

```text
Contract generated or booking confirmed with required payment status
```

Workflow:

```text
Webhook Trigger
→ Get booking and contract details
→ Generate or retrieve contract link
→ Send contract link to client
→ Save delivery result to Email Logs
→ Update contract status
→ Notify admin
```

Expected result:

- Client receives contract link.
- Contract delivery is logged.
- Booking and Contract Management are updated.

---

### 11.4 Booking Update Workflow

Trigger:

```text
Booking date, time, package, status, or venue changed
```

Workflow:

```text
Webhook Trigger
→ Validate updated booking data
→ Send booking update email to client
→ Save email result
→ Update booking timeline
→ Notify admin if needed
```

Expected result:

- Client receives updated booking details.
- Admin can track the update in logs.

---

### 11.5 Cancellation / Reschedule Workflow

Trigger:

```text
Booking cancelled or rescheduled
```

Workflow:

```text
Webhook Trigger
→ Validate cancellation or reschedule data
→ Send notice to client
→ Save email result
→ Update booking status
→ Add timeline entry
→ Notify admin
```

Expected result:

- Client receives cancellation or reschedule notice.
- Booking record is updated.
- Email and audit logs are updated.

---

## 12. Security Plan for n8n Integration

### 12.1 Use Shared Secret

Every request from n8n to the backend should include a secret header.

Example:

```text
x-n8n-secret: your_secure_n8n_secret
```

The backend should reject requests without the correct secret.

---

### 12.2 Use Dedicated Orchestration Routes

Keep n8n routes separate from normal user/admin routes.

Example:

```text
/api/orchestration/...
```

This makes the system cleaner and easier to secure.

---

### 12.3 Validate Every Payload

Do not trust n8n payloads blindly.

Validate:

- Required fields
- Related record ID
- Email format
- Status values
- Workflow name
- Execution ID
- Timestamp
- Allowed module names

---

### 12.4 Do Not Expose Sensitive Keys

Never expose these in the frontend:

- Supabase service role key
- Database URL
- SMTP password
- n8n webhook secret
- JWT secret
- Backend private keys

These should only be stored in Render environment variables or the secure environment where needed.

---

## 13. Recommended Data Flow for Booking Management

### 13.1 Automatic Booking Creation Flow

```text
Client submits booking form
→ Frontend sends request to Backend
→ Backend validates booking
→ Backend checks schedule conflict
→ Backend creates booking record in Supabase
→ Backend triggers n8n booking confirmation workflow
→ n8n sends email
→ n8n returns result to Backend
→ Backend updates Email Logs, Audit Logs, and Booking Timeline
```

---

### 13.2 Payment Sync Flow

```text
Payment updated in Payment Management
→ Backend updates payment record
→ Backend triggers payment sync event
→ Booking Management payment summary is updated
→ n8n sends payment-related email if needed
→ Email Logs and Audit Logs are updated
```

---

### 13.3 Contract Delivery Flow

```text
Contract generated
→ Backend saves contract record
→ Backend triggers n8n contract workflow
→ n8n sends contract link
→ n8n sends result to Backend
→ Backend updates Contract Management, Email Logs, and Booking Timeline
```

---

## 14. Logging Plan

### 14.1 Audit Logs

Audit Logs should record important system actions.

Examples:

- Booking created
- Booking updated
- Booking status changed
- Payment summary synced
- Contract generated
- n8n workflow triggered
- n8n workflow failed
- Email sent
- Email failed
- Conflict detected
- Manual override used

---

### 14.2 Email Logs

Email Logs should record all automated email attempts.

Examples:

- Booking confirmation sent
- Payment reminder failed
- Contract link delivered
- Inquiry auto-reply sent
- Cancellation notice bounced
- Reschedule notice sent

---

### 14.3 Workflow Logs

Workflow Logs should track n8n execution status.

Examples:

- Workflow started
- Workflow completed
- Workflow failed
- Workflow retried
- Workflow response received
- Callback failed

---

## 15. Deployment Preparation Timeline

### Phase 1: Local Readiness

Goal: Make the code deployment-ready while still running locally.

Tasks:

- Remove hardcoded URLs.
- Add `.env.example` files.
- Add environment-based API configuration.
- Add backend health route.
- Add CORS configuration.
- Prepare Supabase database schema.
- Prepare n8n webhook placeholders.
- Add audit log, email log, and workflow log structure.

---

### Phase 2: Cloud Service Preparation

Goal: Prepare Vercel, Render, and Supabase accounts/projects.

Tasks:

- Create Vercel project.
- Create Render web service.
- Create Supabase project.
- Add environment variables.
- Prepare database connection.
- Prepare storage bucket if needed.
- Prepare migration scripts.

---

### Phase 3: Staging Deployment

Goal: Deploy a test version before final production.

Tasks:

- Deploy frontend to Vercel Preview.
- Deploy backend to Render staging service.
- Connect backend to Supabase staging database.
- Test frontend-to-backend connection.
- Test database operations.
- Test n8n test webhook integration.
- Test Email Logs and Audit Logs.

---

### Phase 4: n8n Integration Testing

Goal: Connect and test actual workflows.

Tasks:

- Create n8n test workflows.
- Add Webhook Trigger nodes.
- Add HTTP Request callback nodes.
- Add backend orchestration endpoints.
- Test booking confirmation workflow.
- Test payment reminder workflow.
- Test contract delivery workflow.
- Test failed workflow handling.
- Confirm logs are saved properly.

---

### Phase 5: Production Readiness

Goal: Prepare the final system for official deployment.

Tasks:

- Switch to production environment variables.
- Use production n8n webhook URLs.
- Use production Supabase database.
- Confirm database backup strategy.
- Confirm security rules.
- Confirm CORS origins.
- Confirm error monitoring.
- Confirm logging.
- Confirm admin access.
- Final end-to-end testing.

---

## 16. Final Readiness Checklist

### Frontend — Vercel

| Requirement | Status |
|---|---|
| Environment-based backend API URL | Pending |
| Local build working | Pending |
| Vercel project prepared | Future |
| Preview environment prepared | Future |
| Production environment prepared | Future |
| Frontend connected to Render backend | Future |

---

### Backend — Render

| Requirement | Status |
|---|---|
| Health route added | Pending |
| Supabase database connection ready | Pending |
| CORS configured for Vercel | Pending |
| Environment variables prepared | Pending |
| n8n orchestration endpoints prepared | Pending |
| Render service prepared | Future |
| Backend logs tested | Future |

---

### Database — Supabase

| Requirement | Status |
|---|---|
| Supabase project created | Future |
| Database schema prepared | Pending |
| Migration files prepared | Pending |
| Seed data prepared | Pending |
| Database connection string added to Render | Future |
| Audit Logs, Email Logs, and Workflow Logs tables ready | Pending |

---

### n8n Orchestration

| Requirement | Status |
|---|---|
| Workflow plan prepared | In Progress |
| Webhook URLs prepared | Future |
| Backend callback endpoints prepared | Pending |
| Shared secret configured | Pending |
| Booking workflow tested | Future |
| Payment reminder workflow tested | Future |
| Contract delivery workflow tested | Future |
| Email Logs integration tested | Future |

---

## 17. Final Recommended Architecture Rule

The recommended final architecture is:

```text
Frontend handles user interaction.
Backend handles validation, security, and business logic.
Supabase stores system data.
n8n handles workflow automation.
System Logs store audit, email, and workflow activity.
```

The backend should remain the main gatekeeper of the system. n8n should automate workflows, but important data changes should still pass through secure backend endpoints to prevent invalid updates, duplicate records, and untracked system actions.

---

## 18. Summary

This deployment plan prepares the system for future deployment without forcing immediate production release.

The system will be structured around:

- **Vercel** for frontend deployment
- **Render** for backend hosting
- **Supabase PostgreSQL** for database deployment
- **n8n** for workflow automation and orchestration

This setup keeps the system scalable, secure, and easier to maintain as the project grows.
