CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" TEXT NOT NULL,
  "settings" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "system_settings" ("id", "settings")
VALUES (
  'singleton',
  '{
    "appearance": {
      "defaultTheme": "light"
    },
    "admin": {
      "notifications": {
        "newBookingRequests": true,
        "bookingConfirmations": true,
        "bookingCancellations": true,
        "customerInquiries": true,
        "paymentUpdates": true,
        "contractUpdates": true,
        "testimonyUpdates": true,
        "supportUpdates": true,
        "weeklySummary": true,
        "marketingEmails": false,
        "systemAlerts": true
      },
      "security": {
        "sessionTimeoutMinutes": 30,
        "twoFactorAuthEnabled": false,
        "requirePasswordForDeletes": true,
        "requirePasswordForBookingCancellations": true,
        "requirePasswordForBillingChanges": false
      },
      "localization": {
        "language": "English (US)",
        "timezone": "Asia/Manila",
        "dateFormat": "MM/DD/YYYY (12-hour)"
      }
    },
    "client": {
      "maintenanceMode": false,
      "bookingRequestsEnabled": true,
      "inquirySubmissionsEnabled": true,
      "packagesVisible": true,
      "faqVisible": true,
      "assistantEnabled": true,
      "publicTestimoniesVisible": true,
      "testimonySubmissionsEnabled": true,
      "disabledMessage": "This feature is temporarily unavailable. Please contact Zion Events Place directly for assistance."
    }
  }'::jsonb
)
ON CONFLICT ("id") DO NOTHING;
