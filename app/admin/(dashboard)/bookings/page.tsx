'use client';

import React from 'react';

const mockBookings = [
  { id: 'B-1042', client: 'Jerome & Steph', type: 'Wedding', package: 'Ultimate 100Pax', date: '2026-06-12', status: 'Secured', statusColor: 'bg-green-100 text-green-700' },
  { id: 'B-1043', client: "Sarah's 18th", type: 'Debut', package: 'Standard 50Pax', date: '2026-06-20', status: 'For Ocular Visit', statusColor: 'bg-blue-100 text-blue-700' },
  { id: 'B-1044', client: 'Mark & Julia', type: 'Wedding', package: 'Premium 150Pax', date: '2026-06-18', status: 'For Admin Review', statusColor: 'bg-yellow-100 text-yellow-700' },
  { id: 'B-1045', client: 'Alice & Bob', type: 'Wedding', package: 'Intimate 20Pax', date: '2026-07-05', status: 'Awaiting Downpayment', statusColor: 'bg-orange-100 text-orange-700' },
  { id: 'B-1046', client: 'Company XMAS', type: 'Party', package: 'Custom 200Pax', date: '2026-12-15', status: 'Expired', statusColor: 'bg-red-100 text-red-700' },
  { id: 'B-1047', client: 'Baby Liam', type: 'Christening', package: 'Standard 50Pax', date: '2026-05-15', status: 'Secured', statusColor: 'bg-green-100 text-green-700' },
  { id: 'B-1048', client: 'Santos Reunion', type: 'Party', package: 'Custom 100Pax', date: '2026-08-10', status: 'For Admin Review', statusColor: 'bg-yellow-100 text-yellow-700' },
];

export default function BookingManagement() {
  return (
    <div className="flex flex-col gap-6 h-full font-serif text-[#1a1f18]">
      
      {/* Top Toolbar */}
      <div className="bg-[#FDF5CC] rounded-xl p-4 flex justify-between items-center shadow-sm border border-black/5">
        
        {/* Search */}
        <div className="relative w-[350px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search bookings......." 
            className="w-full border border-black rounded-full py-2 pl-10 pr-4 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-[#BEA542]"
          />
        </div>

        {/* Filter Button */}
        <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
          </svg>
          Filter Date
        </button>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Booking ID</th>
                <th className="px-6 py-4 font-semibold">Client Name</th>
                <th className="px-6 py-4 font-semibold">Event Details</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Workflow Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockBookings.map((booking, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4 text-sm text-gray-600">{booking.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#1a1f18]">{booking.client}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-[#1a1f18]">{booking.type}</div>
                    <div className="text-xs text-gray-500">{booking.package}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{booking.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-[11px] font-bold uppercase rounded-full tracking-wide ${booking.statusColor}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-black transition-colors p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:translate-x-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <div className="bg-[#FDF5CC] rounded-xl p-4 flex justify-between items-center shadow-sm border border-black/5 mt-auto">
        <span className="text-sm font-medium text-[#1a1f18]">Showing 1 to 7 of 42 bookings</span>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50" disabled>
            Prev
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            Next
          </button>
        </div>
      </div>

    </div>
  );
}
