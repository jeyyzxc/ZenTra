'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../../context/ThemeContext';
import {
  DATE_FORMAT_OPTIONS,
  DEFAULT_SYSTEM_SETTINGS,
  LANGUAGE_OPTIONS,
  SESSION_TIMEOUT_OPTIONS,
  TIMEZONE_OPTIONS,
  type SystemSettings,
  type ThemePreference,
} from '@/lib/system-settings-types';

type Notice = { type: 'success' | 'error'; message: string } | null;
type NotificationKey = keyof SystemSettings['admin']['notifications'];
type ClientKey = keyof Omit<SystemSettings['client'], 'disabledMessage'>;

const notificationRows: Array<{ key: NotificationKey; label: string }> = [
  { key: 'newBookingRequests', label: 'New Booking Requests' },
  { key: 'bookingConfirmations', label: 'Booking Confirmations' },
  { key: 'bookingCancellations', label: 'Booking Cancellations' },
  { key: 'customerInquiries', label: 'Customer Inquiries' },
  { key: 'paymentUpdates', label: 'Payment Updates' },
  { key: 'contractUpdates', label: 'Contract Updates' },
  { key: 'testimonyUpdates', label: 'Testimony Updates' },
  { key: 'supportUpdates', label: 'Support Center Updates' },
  { key: 'systemAlerts', label: 'System Alerts' },
];

const clientRows: Array<{ key: ClientKey; label: string; detail: string }> = [
  { key: 'maintenanceMode', label: 'Maintenance Mode', detail: 'Temporarily pauses public client features.' },
  { key: 'bookingRequestsEnabled', label: 'Online Booking Requests', detail: 'Controls the booking flow and calendar availability endpoint.' },
  { key: 'inquirySubmissionsEnabled', label: 'Inquiry Submissions', detail: 'Controls Contact Us and homepage inquiry forms.' },
  { key: 'packagesVisible', label: 'Public Packages', detail: 'Controls package pages and public package APIs.' },
  { key: 'faqVisible', label: 'Client FAQ', detail: 'Controls FAQ pages, previews, and FAQ APIs.' },
  { key: 'assistantEnabled', label: 'Smart Assistant', detail: 'Controls the public Zeni chat assistant.' },
  { key: 'publicTestimoniesVisible', label: 'Public Testimonies', detail: 'Controls the testimonies page and featured stories.' },
  { key: 'testimonySubmissionsEnabled', label: 'Testimony Submissions', detail: 'Controls the client testimony submission form.' },
];

const panelClass = 'overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-500 dark:border-white/5 dark:bg-[#141A13]';
const labelClass = 'block text-[10.5px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-[#A3B19B]';
const selectClass = 'w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] font-semibold tracking-wide text-gray-800 shadow-sm outline-none transition-all duration-300 focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/30 dark:border-white/10 dark:bg-white/5 dark:text-[#F4F4F0]';

function Toggle({
  checked,
  disabled = false,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-5 w-10 flex-shrink-0 rounded-full border shadow-inner transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? 'border-[#D6B53B] bg-[#D6B53B]'
          : 'border-gray-300 bg-gray-200 hover:bg-gray-300 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20'
      }`}
    >
      <span
        className={`absolute top-[1px] h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="border-b border-gray-50 bg-gray-50/30 px-6 py-4 dark:border-white/5 dark:bg-white/[0.02]">
      <h2 className="flex items-center gap-2.5 font-sans text-[14.5px] font-semibold tracking-tight text-gray-800 dark:text-[#F4F4F0]">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDF5CC]/50 text-[#D6B53B] shadow-sm dark:bg-[#D6B53B]/10">
          <i className={`fi ${icon} relative top-[1px] text-[14px] leading-[0]`} />
        </span>
        {title}
      </h2>
    </div>
  );
}

export default function SettingsPage() {
  const { toggleTheme } = useTheme();
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch('/api/admin/settings', { cache: 'no-store' });
        const payload = await response.json() as {
          settings?: SystemSettings;
          updatedAt?: string | null;
          error?: string;
        };

        if (!response.ok || !payload.settings) {
          throw new Error(payload.error || 'Unable to load settings.');
        }

        if (!active) {
          return;
        }

        setSettings(payload.settings);
        setUpdatedAt(payload.updatedAt ?? null);
        toggleTheme(payload.settings.appearance.defaultTheme);
      } catch (error) {
        if (active) {
          setNotice({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unable to load settings.',
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, [toggleTheme]);

  const setAppearanceTheme = (value: ThemePreference) => {
    toggleTheme(value);
    setSettings((current) => ({
      ...current,
      appearance: { ...current.appearance, defaultTheme: value },
    }));
  };

  const setNotification = (key: NotificationKey, value: boolean) => {
    setSettings((current) => ({
      ...current,
      admin: {
        ...current.admin,
        notifications: {
          ...current.admin.notifications,
          [key]: value,
        },
      },
    }));
  };

  const setClient = (key: ClientKey, value: boolean) => {
    setSettings((current) => ({
      ...current,
      client: {
        ...current.client,
        [key]: value,
      },
    }));
  };

  const updateLocalization = (field: keyof SystemSettings['admin']['localization'], value: string) => {
    setSettings((current) => ({
      ...current,
      admin: {
        ...current.admin,
        localization: {
          ...current.admin.localization,
          [field]: value,
        },
      },
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setNotice(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const payload = await response.json() as {
        settings?: SystemSettings;
        updatedAt?: string | null;
        error?: string;
      };

      if (!response.ok || !payload.settings) {
        throw new Error(payload.error || 'Unable to save settings.');
      }

      setSettings(payload.settings);
      setUpdatedAt(payload.updatedAt ?? new Date().toISOString());
      setNotice({ type: 'success', message: 'Settings saved and applied across admin and client panels.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to save settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const exportHref = useMemo(() => {
    const params = new URLSearchParams({
      format: 'csv',
      timeZone: settings.admin.localization.timezone,
    });
    return `/api/audit/export?${params.toString()}`;
  }, [settings.admin.localization.timezone]);

  return (
    <div className="w-full px-6 pb-8 pt-4">
      <div className="-ml-3 mb-5 flex sm:-ml-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="group flex items-center gap-3 text-gray-500 transition-all duration-500 hover:text-[#D6B53B] focus:outline-none dark:text-[#A3B19B] dark:hover:text-[#D6B53B]"
          aria-label="Go back"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all duration-500 group-hover:border-[#D6B53B]/50 group-hover:shadow-[0_0_12px_rgba(214,181,59,0.4)] dark:border-white/10 dark:bg-[#141A13]">
            <i className="fi fi-rr-arrow-left mt-[2px] text-[14px] leading-[0] transition-transform duration-500 group-hover:-translate-x-0.5" />
          </span>
          <span className="-translate-x-2 text-[10px] font-bold uppercase tracking-[0.15em] opacity-0 transition-all duration-500 ease-out group-hover:translate-x-0 group-hover:opacity-100">
            Go Back
          </span>
        </button>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="m-0 font-sahitya text-3xl font-bold uppercase leading-none tracking-[0.08em] text-[#1a1f18] dark:text-[#F4F4F0]">
            Settings
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Manage operational preferences, public client access, localization, and system communications.
          </p>
          {updatedAt && (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8E7722]">
              Last saved {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={isSaving || isLoading}
          className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#1a1f18] px-8 py-3 text-[11.5px] font-semibold uppercase tracking-[0.15em] text-white shadow-md transition-all duration-500 ease-out hover:bg-[#D6B53B] hover:shadow-lg active:scale-95 disabled:opacity-70 dark:bg-[#D6B53B] dark:text-[#0C100B] dark:hover:bg-white"
        >
          <span className="absolute inset-0 h-full w-full -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite] dark:via-white/50" />
          {isSaving ? (
            <>
              <i className="fi fi-rr-spinner animate-spin text-[13px]" />
              Saving...
            </>
          ) : (
            <>
              <i className="fi fi-rr-disk relative top-[1px] text-[13px] leading-[0]" />
              <span className="relative top-[1px] leading-none">Save Changes</span>
            </>
          )}
        </button>
      </div>

      {notice && (
        <div className={`mb-6 flex items-start gap-3 rounded-xl border p-3.5 text-[13px] font-medium tracking-wide shadow-sm ${
          notice.type === 'success'
            ? 'border-green-200 bg-green-50/90 text-green-800 dark:border-green-500/30 dark:bg-green-900/20 dark:text-green-400'
            : 'border-red-200 bg-red-50/90 text-red-800 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          <i className={`fi ${notice.type === 'success' ? 'fi-rr-check-circle' : 'fi-rr-cross-circle'} mt-0.5 text-[16px] leading-[0]`} />
          <p>{notice.message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-xl bg-white/70 dark:bg-white/5 xl:col-span-6" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <section className={panelClass}>
              <SectionHeader icon="fi-rr-palette" title="Appearance & Theme" />
              <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                {(['light', 'dark'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAppearanceTheme(option)}
                    className={`relative rounded-xl border p-5 text-left shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md ${
                      settings.appearance.defaultTheme === option
                        ? 'border-[#D6B53B] ring-1 ring-[#D6B53B]/20'
                        : 'border-gray-200 opacity-80 hover:opacity-100 dark:border-white/10'
                    } ${option === 'light' ? 'bg-white dark:bg-[#0C100B]' : 'bg-gray-50 dark:bg-[#0C100B]'}`}
                  >
                    <i className={`fi ${option === 'light' ? 'fi-rr-brightness' : 'fi-rr-moon'} mb-4 flex h-12 w-12 items-center justify-center rounded-full border text-2xl leading-[0] ${
                      option === 'light'
                        ? 'border-[#D6B53B]/20 bg-[#FDF5CC] text-[#D6B53B]'
                        : 'border-gray-300 bg-gray-100 text-gray-600 dark:border-white/10 dark:bg-white/10 dark:text-white'
                    }`} />
                    <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight text-gray-900 dark:text-[#F4F4F0]">
                      {option === 'light' ? 'Light Mode' : 'Evening Gala'}
                    </h3>
                    <p className="text-[12.5px] font-medium tracking-wide text-gray-500 dark:text-[#A3B19B]/80">
                      {option === 'light' ? 'Default bright interface.' : 'Rich, dark interface.'}
                    </p>
                    {settings.appearance.defaultTheme === option && (
                      <i className="fi fi-rr-check-circle absolute right-4 top-4 text-xl leading-[0] text-[#D6B53B]" />
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section className={panelClass}>
              <SectionHeader icon="fi-rr-shield-check" title="Session & Advanced Security" />
              <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <label className="space-y-3">
                    <span className={labelClass}>Session Timeout</span>
                    <select
                      value={settings.admin.security.sessionTimeoutMinutes}
                      onChange={(event) => setSettings((current) => ({
                        ...current,
                        admin: {
                          ...current.admin,
                          security: {
                            ...current.admin.security,
                            sessionTimeoutMinutes: Number(event.target.value),
                          },
                        },
                      }))}
                      className={selectClass}
                    >
                      {SESSION_TIMEOUT_OPTIONS.map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes < 60 ? `${minutes} Minutes` : `${minutes / 60} Hour${minutes > 60 ? 's' : ''}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-5 dark:border-blue-500/20 dark:from-blue-900/10 dark:to-[#141A13]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="mb-1.5 text-[13.5px] font-semibold tracking-wide text-gray-900 dark:text-[#F4F4F0]">
                          Two-Factor Auth
                        </h4>
                        <p className="mb-3 text-[12px] font-medium leading-relaxed tracking-wide text-gray-600 dark:text-[#A3B19B]">
                          Authenticator enrollment is not available yet, so this stays disabled until a real setup flow exists.
                        </p>
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-widest text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          Unavailable
                        </span>
                      </div>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border bg-blue-100 text-blue-500 dark:border-blue-500/20 dark:bg-blue-900/30 dark:text-blue-400">
                        <i className="fi fi-rr-smartphone text-[18px] leading-[0]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white px-5 py-5 dark:border-white/5 dark:bg-[#1A2218]">
                  <span className={labelClass}>Access Policy</span>
                  <h4 className="mt-3 text-[14px] font-semibold tracking-wide text-gray-900 dark:text-[#F4F4F0]">
                    Admin session lifetime is enforced on login.
                  </h4>
                  <p className="mt-2 text-[12.5px] font-medium leading-6 text-gray-600 dark:text-[#A3B19B]">
                    The saved timeout controls how long non-remembered admin sessions remain valid. Destructive-action password prompts will appear here after those action forms support password confirmation.
                  </p>
                </div>
              </div>
            </section>

            <section className={panelClass}>
              <SectionHeader icon="fi-rr-globe" title="Client Panel Controls" />
              <div className="space-y-3 p-6">
                {clientRows.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-white/5 dark:bg-[#1A2218]">
                    <div>
                      <p className="text-[13px] font-semibold tracking-wide text-gray-800 dark:text-[#F4F4F0]">{item.label}</p>
                      <p className="mt-1 text-[11.5px] font-medium leading-5 text-gray-500 dark:text-[#A3B19B]">{item.detail}</p>
                    </div>
                    <Toggle checked={settings.client[item.key]} onChange={() => setClient(item.key, !settings.client[item.key])} />
                  </div>
                ))}
                <label className="block pt-3">
                  <span className={labelClass}>Unavailable Message</span>
                  <textarea
                    value={settings.client.disabledMessage}
                    onChange={(event) => setSettings((current) => ({
                      ...current,
                      client: {
                        ...current.client,
                        disabledMessage: event.target.value,
                      },
                    }))}
                    maxLength={300}
                    rows={3}
                    className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/30 dark:border-white/10 dark:bg-white/5 dark:text-[#F4F4F0]"
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="space-y-6 xl:col-span-5">
            <section className={panelClass}>
              <SectionHeader icon="fi-rr-bell" title="Communications" />
              <div className="space-y-1.5 p-6">
                <h4 className="mb-3 pl-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#A3B19B]/70">System Alerts</h4>
                {notificationRows.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                    <span className="text-[13px] font-medium tracking-wide text-gray-800 dark:text-[#F4F4F0]">{item.label}</span>
                    <Toggle
                      checked={settings.admin.notifications[item.key]}
                      onChange={() => setNotification(item.key, !settings.admin.notifications[item.key])}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className={panelClass}>
              <SectionHeader icon="fi-rr-settings-sliders" title="Localization & Data" />
              <div className="space-y-5 p-6">
                <label className="space-y-2.5">
                  <span className={labelClass}>Preferred Language</span>
                  <select value={settings.admin.localization.language} onChange={(event) => updateLocalization('language', event.target.value)} className={selectClass}>
                    {LANGUAGE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>

                <label className="space-y-2.5">
                  <span className={labelClass}>Timezone</span>
                  <select value={settings.admin.localization.timezone} onChange={(event) => updateLocalization('timezone', event.target.value)} className={selectClass}>
                    {TIMEZONE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <label className="space-y-2.5">
                  <span className={labelClass}>Date & Time Format</span>
                  <select value={settings.admin.localization.dateFormat} onChange={(event) => updateLocalization('dateFormat', event.target.value)} className={selectClass}>
                    {DATE_FORMAT_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/5">
                  <div>
                    <h4 className="mb-0.5 text-[13.5px] font-semibold tracking-wide text-gray-800 dark:text-[#F4F4F0]">Export Data</h4>
                    <p className="text-[11.5px] font-medium tracking-wide text-gray-500 dark:text-[#A3B19B]">Download activity logs.</p>
                  </div>
                  <a
                    href={exportHref}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-widest text-gray-600 shadow-sm transition-all duration-300 hover:border-[#1a1f18] hover:bg-[#1a1f18] hover:text-white active:scale-95 dark:border-white/20 dark:text-[#A3B19B] dark:hover:border-white dark:hover:bg-white dark:hover:text-[#0C100B]"
                  >
                    <i className="fi fi-rr-download leading-[0]" />
                    Export CSV
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
