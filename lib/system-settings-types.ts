export type ThemePreference = 'light' | 'dark';

export type SystemSettings = {
  appearance: {
    defaultTheme: ThemePreference;
  };
  admin: {
    notifications: {
      newBookingRequests: boolean;
      bookingConfirmations: boolean;
      bookingCancellations: boolean;
      customerInquiries: boolean;
      paymentUpdates: boolean;
      contractUpdates: boolean;
      testimonyUpdates: boolean;
      supportUpdates: boolean;
      weeklySummary: boolean;
      marketingEmails: boolean;
      systemAlerts: boolean;
    };
    security: {
      sessionTimeoutMinutes: number;
      twoFactorAuthEnabled: boolean;
      requirePasswordForDeletes: boolean;
      requirePasswordForBookingCancellations: boolean;
      requirePasswordForBillingChanges: boolean;
    };
    localization: {
      language: string;
      timezone: string;
      dateFormat: string;
    };
  };
  client: {
    maintenanceMode: boolean;
    bookingRequestsEnabled: boolean;
    inquirySubmissionsEnabled: boolean;
    packagesVisible: boolean;
    faqVisible: boolean;
    assistantEnabled: boolean;
    publicTestimoniesVisible: boolean;
    testimonySubmissionsEnabled: boolean;
    disabledMessage: string;
  };
};

export type PublicSystemSettings = Pick<SystemSettings, 'appearance' | 'client'> & {
  localization: SystemSettings['admin']['localization'];
};

export const SESSION_TIMEOUT_OPTIONS = [15, 30, 60, 240] as const;

export const LANGUAGE_OPTIONS = [
  'English (US)',
  'Tagalog (PH)',
  'Spanish (ES)',
] as const;

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Manila', label: '(GMT+08:00) Manila, Taipei' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) Tokyo, Seoul' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time (US)' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US)' },
] as const;

export const DATE_FORMAT_OPTIONS = [
  'MM/DD/YYYY (12-hour)',
  'DD/MM/YYYY (24-hour)',
  'YYYY-MM-DD (ISO)',
] as const;

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  appearance: {
    defaultTheme: 'light',
  },
  admin: {
    notifications: {
      newBookingRequests: true,
      bookingConfirmations: true,
      bookingCancellations: true,
      customerInquiries: true,
      paymentUpdates: true,
      contractUpdates: true,
      testimonyUpdates: true,
      supportUpdates: true,
      weeklySummary: true,
      marketingEmails: false,
      systemAlerts: true,
    },
    security: {
      sessionTimeoutMinutes: 30,
      twoFactorAuthEnabled: false,
      requirePasswordForDeletes: true,
      requirePasswordForBookingCancellations: true,
      requirePasswordForBillingChanges: false,
    },
    localization: {
      language: 'English (US)',
      timezone: 'Asia/Manila',
      dateFormat: 'MM/DD/YYYY (12-hour)',
    },
  },
  client: {
    maintenanceMode: false,
    bookingRequestsEnabled: true,
    inquirySubmissionsEnabled: true,
    packagesVisible: true,
    faqVisible: true,
    assistantEnabled: true,
    publicTestimoniesVisible: true,
    testimonySubmissionsEnabled: true,
    disabledMessage: 'This feature is temporarily unavailable. Please contact Zion Events Place directly for assistance.',
  },
};
