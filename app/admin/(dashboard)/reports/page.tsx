import { requireAdmin } from '@/lib/authorization';
import { getReportsData } from '@/lib/reports-service';
import ReportsActions from './ReportsActions';

export const dynamic = 'force-dynamic';

function money(value: number) {
  return `PHP ${value.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
}

export default async function ReportsAndAnalytics() {
  await requireAdmin();
  const data = await getReportsData();
  const maxRevenue = Math.max(...data.monthly.map((item) => item.revenue), 1);
  const maxBookings = Math.max(...data.monthly.map((item) => item.bookings), 1);
  const maxDistribution = Math.max(
    ...data.eventTypes.map((item) => item.count),
    ...data.packages.map((item) => item.count),
    ...data.inquiryEventInterests.map((item) => item.count),
    1,
  );
  const maxInquiries = Math.max(...data.monthly.map((item) => item.inquiries), 1);

  return (
    <div className="space-y-6 pb-10 text-[#1a1f18] dark:text-[#F4F4F0]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em]">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#A3B19B]">Calculated from inquiry, booking, contract, and payment records.</p>
        </div>
        <ReportsActions />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Metric label="Booking count" value={String(data.summary.bookingCount)} />
        <Metric label="Pending bookings" value={String(data.summary.pendingBookingCount)} />
        <Metric label="Revenue collected" value={money(data.summary.revenueCollected)} />
        <Metric label="Revenue forecast" value={money(data.summary.revenueForecast)} />
        <Metric label="Pending payments" value={String(data.summary.pendingPaymentCount)} />
        <Metric label="Pending balance" value={money(data.summary.pendingPaymentBalance)} />
        <Metric label="Inquiries received" value={String(data.summary.inquiryCount)} />
        <Metric label="Inquiry conversion" value={`${data.summary.inquiryConversionRate.toFixed(1)}%`} />
        <Metric label="Average response time" value={`${data.summary.averageInquiryResponseHours.toFixed(1)} hrs`} />
        <Metric label="Unanswered inquiries" value={String(data.summary.unansweredInquiryCount)} />
        <Metric label="Follow-up inquiries" value={String(data.summary.followUpInquiryCount)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Chart title="Revenue collected by month">
          <div className="flex h-64 items-end gap-3">
            {data.monthly.map((item) => (
              <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2 text-center">
                <span className="text-xs font-bold text-[#8E7722]">{item.revenue ? money(item.revenue) : '-'}</span>
                <div className="mx-auto w-full max-w-12 rounded-t-lg bg-[#D6B53B]" style={{ height: `${Math.max(item.revenue ? 8 : 2, (item.revenue / maxRevenue) * 78)}%` }} />
                <span className="text-xs font-bold uppercase text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </Chart>

        <Chart title="Monthly booking status">
          <div className="flex h-64 items-end gap-3">
            {data.monthly.map((item) => (
              <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2 text-center">
                <div className="flex flex-1 items-end justify-center gap-1">
                  <div title={`${item.confirmed} confirmed`} className="w-4 rounded-t bg-emerald-500" style={{ height: `${Math.max(item.confirmed ? 8 : 2, (item.confirmed / maxBookings) * 90)}%` }} />
                  <div title={`${item.pending} pending`} className="w-4 rounded-t bg-amber-400" style={{ height: `${Math.max(item.pending ? 8 : 2, (item.pending / maxBookings) * 90)}%` }} />
                </div>
                <span className="text-xs font-bold uppercase text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-center gap-5 text-xs font-bold text-gray-500"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />Confirmed</span><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-400" />Pending</span></div>
        </Chart>

        <Chart title="Monthly inquiry pipeline">
          <div className="flex h-64 items-end gap-3">
            {data.monthly.map((item) => (
              <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2 text-center">
                <div className="flex flex-1 items-end justify-center gap-1">
                  <div title={`${item.inquiries} inquiries`} className="w-4 rounded-t bg-blue-500" style={{ height: `${Math.max(item.inquiries ? 8 : 2, (item.inquiries / maxInquiries) * 90)}%` }} />
                  <div title={`${item.convertedInquiries} converted`} className="w-4 rounded-t bg-[#D6B53B]" style={{ height: `${Math.max(item.convertedInquiries ? 8 : 2, (item.convertedInquiries / maxInquiries) * 90)}%` }} />
                </div>
                <span className="text-xs font-bold uppercase text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-center gap-5 text-xs font-bold text-gray-500"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500" />Inquiries</span><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-[#D6B53B]" />Converted</span></div>
        </Chart>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Distribution title="Event type distribution" items={data.eventTypes} max={maxDistribution} />
        <Distribution title="Package popularity" items={data.packages} max={maxDistribution} />
        <Distribution title="Inquiry event interests" items={data.inquiryEventInterests} max={maxDistribution} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[#D6B53B]/20 bg-[#FDF5CC] p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6D5A18]">{label}</p><p className="mt-2 font-sahitya text-3xl font-bold">{value}</p></div>;
}

function Chart({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]"><h2 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-gray-500">{title}</h2>{children}</section>;
}

function Distribution({ title, items, max }: { title: string; items: Array<{ name: string; count: number }>; max: number }) {
  return (
    <Chart title={title}>
      {items.length ? <div className="space-y-4">{items.map((item) => <div key={item.name}><div className="mb-1 flex justify-between text-sm"><span className="font-bold">{item.name}</span><span>{item.count}</span></div><div className="h-2 rounded-full bg-gray-100 dark:bg-white/5"><div className="h-full rounded-full bg-[#D6B53B]" style={{ width: `${(item.count / max) * 100}%` }} /></div></div>)}</div> : <p className="py-16 text-center text-sm text-gray-500">No booking records yet.</p>}
    </Chart>
  );
}
