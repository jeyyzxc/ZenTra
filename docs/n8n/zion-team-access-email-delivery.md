# Zion - Team Access Email Delivery

Last verified from the current codebase: 2026-07-05

Purpose: send secure team-account invitation, password-reset, and temporary-access emails through n8n without letting admins view, type, store, or reuse another team member's password.

The app creates the access token or code, stores only its hash, creates safe audit/email/workflow logs, then sends the raw link or code to n8n once in the webhook request body. n8n must send the email immediately and must not persist the raw secret in notes, pinned data, logs, tickets, spreadsheets, or chat messages.

## 1. Required app environment variables

Set these in the Next.js app environment:

```env
NEXTAUTH_URL="https://your-zion-app-domain.com"
NEXTAUTH_SECRET="strong-random-secret"
N8N_WEBHOOK_SECRET="strong-shared-workflow-secret"
N8N_TEAM_ACCESS_WEBHOOK_URL="https://your-n8n-domain.com/webhook/zion-team-access-email"
```

Notes:

- `NEXTAUTH_URL` must be the public app URL users can open from email.
- `NEXTAUTH_SECRET` is also used as the token-hash pepper. Rotating it invalidates outstanding access links/codes and existing auth sessions.
- `N8N_WEBHOOK_SECRET` is sent as `x-zion-workflow-secret`; n8n should reject requests when it does not match.
- Use the production `/webhook/...` URL after the n8n workflow is active. Use `/webhook-test/...` only during manual testing.

## 2. Required n8n environment variables

Set these in n8n:

```env
N8N_WEBHOOK_SECRET="same value as the app N8N_WEBHOOK_SECRET"
```

Also configure the email provider n8n will use, for example SMTP, Gmail, Resend, or another approved sender. The exact variables depend on your n8n email node/provider.

## 3. Webhook contract

Create an n8n workflow with a Webhook trigger:

- Method: `POST`
- Path: `zion-team-access-email`
- Response mode: respond only after the email provider accepts the send request.

Headers sent by the app:

```text
content-type: application/json
x-zion-source: backend
x-zion-event: team-access.email
x-zion-email-kind: invitation | password-reset | temp-access
x-zion-idempotency-key: EMAIL_LOG_ID
x-zion-workflow-secret: value_from_N8N_WEBHOOK_SECRET
```

Payload sent by the app:

```json
{
  "emailLogId": "EMAIL_LOG_ID",
  "workflowLogId": "N8N_WORKFLOW_LOG_ID",
  "triggeredAt": "2026-07-05T00:00:00.000Z",
  "recipientEmail": "team.member@example.com",
  "recipientName": "Team Member",
  "subject": "Set Up Your Team Account",
  "text": "Plain text email body supplied by the app...",
  "secureUrl": "https://your-zion-app-domain.com/setup-account?token=...",
  "temporaryCode": null,
  "emailKind": "invitation"
}
```

Field rules:

| `emailKind` | Uses | Expiry | Recipient action |
|---|---|---:|---|
| `invitation` | `secureUrl` | 24 hours | Create first password on `/setup-account`. |
| `password-reset` | `secureUrl` | 30 minutes | Create new password on `/reset-password`. |
| `temp-access` | `temporaryCode` | 15 minutes | Log in with code, then immediately create a new password on `/change-password`. |

For `temp-access`, `secureUrl` is `null`. For link-based emails, `temporaryCode` is `null`.

## 4. n8n node order

Use this workflow shape:

1. `Webhook - Team Access Email`
2. `Code - Validate Team Access Request`
3. `IF - Is Request Valid`
4. `Respond to Webhook - Invalid Request` with HTTP 401 or 400
5. `Send Email`
6. `Respond to Webhook - Email Accepted`

Validation node requirements:

1. Require method `POST`.
2. Require `x-zion-source` to equal `backend`.
3. Require `x-zion-event` to equal `team-access.email`.
4. Require `x-zion-workflow-secret` to equal `$env.N8N_WEBHOOK_SECRET`.
5. Require `emailKind` to be `invitation`, `password-reset`, or `temp-access`.
6. Require `recipientEmail`, `subject`, `text`, and `emailLogId`.
7. Require `secureUrl` for `invitation` and `password-reset`.
8. Require `temporaryCode` for `temp-access`.

## 5. Send Email node mapping

Map fields directly from the webhook payload:

| Email field | n8n expression |
|---|---|
| To | `={{ $json.recipientEmail }}` |
| Subject | `={{ $json.subject }}` |
| Text | `={{ $json.text }}` |

If your email provider requires HTML, generate a simple HTML body from `text`, but do not add workflow details:

```js
{{ String($json.text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replace(/\n/g, '<br>') }}
```

Do not add n8n branding, execution IDs, webhook URLs, secrets, admin notes, or internal logs to the message body.

## 6. Required response behavior

Return a 2xx response only after the email provider accepts the send request:

```json
{
  "success": true,
  "emailLogId": "EMAIL_LOG_ID",
  "providerMessageId": "optional-provider-message-id"
}
```

If validation fails, return 401 or 400 and stop. If the email provider fails, return a non-2xx response so the app marks the team-access email log as `FAILED`.

Current app behavior:

- Missing `N8N_TEAM_ACCESS_WEBHOOK_URL` creates a safe pending email log. No raw link/code is persisted.
- 2xx n8n response marks the workflow attempt successful.
- Non-2xx n8n response or request failure marks the email log and workflow log failed.

## 7. Security checklist

- Use HTTPS for production app and n8n URLs.
- Restrict workflow edit/view access to trusted automation admins only.
- Disable saving successful production execution data in n8n, or set the shortest retention your n8n environment allows.
- Do not pin webhook input data that contains `secureUrl` or `temporaryCode`.
- Do not forward the raw link/code to Slack, email logs, spreadsheets, tickets, or admin notifications.
- Never send the access link/code to the Super Admin instead of the target user.
- Never ask a Super Admin to create, type, or read a team member password.
- Keep `N8N_WEBHOOK_SECRET` out of browser code and out of `NEXT_PUBLIC_*` variables.
- Rotate `N8N_WEBHOOK_SECRET` if the n8n workflow URL or execution data is exposed.

## 8. Test checklist

1. Start the app with `N8N_TEAM_ACCESS_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` configured.
2. Activate the n8n workflow and copy the production webhook URL into `N8N_TEAM_ACCESS_WEBHOOK_URL`.
3. In Team Management, invite a test team member.
4. Confirm the test member receives the setup email at their own address.
5. Open the setup link and create a password.
6. Confirm the same link cannot be reused.
7. Send a password reset link and confirm it lands at the target member email.
8. Send a temporary access code, log in with it, and confirm the account can only access `/change-password` until a new password is created.
9. Review Admin Audit Logs and Email Logs. They should show the action and delivery state without exposing the raw link, token, temporary code, or password.

## 9. Troubleshooting

| Symptom | Check |
|---|---|
| Team action succeeds but no email is delivered | Confirm `N8N_TEAM_ACCESS_WEBHOOK_URL` is set in the app runtime and the n8n workflow is active. |
| `ERR_SSL_WRONG_VERSION_NUMBER` or `wrong version number` | `N8N_TEAM_ACCESS_WEBHOOK_URL` is using `https://` against a plain HTTP n8n endpoint. Use `http://` for local HTTP n8n, or configure n8n behind a valid HTTPS reverse proxy. |
| n8n returns 401 | Confirm app and n8n use the same `N8N_WEBHOOK_SECRET`. |
| Email link points to localhost | Set `NEXTAUTH_URL` to the public app URL and restart the app. |
| Email log is `FAILED` | Open the email log and n8n execution to inspect the provider error. Do not copy raw secret values into support notes. |
| Temporary code works but user cannot access dashboard | Expected. Temporary access is restricted to `/change-password` until the user creates a new password. |
