'use client';

import React from 'react';

const mockTransactions = [
  { client: 'Jerome & Steph', amount: '₱175,000', method: 'Bank Transfer', date: '2026-05-15', milestone: 'Downpayment Paid', milestoneColor: 'bg-blue-100 text-blue-700' },
  { client: 'Baby Liam', amount: '₱50,000', method: 'Cash', date: '2026-05-01', milestone: 'Fully Paid', milestoneColor: 'bg-green-100 text-green-700' },
  { client: 'Mark & Julia', amount: '₱100,000', method: 'Bank Transfer', date: '2026-05-18', milestone: 'Partial Payment', milestoneColor: 'bg-gray-200 text-gray-700' },
  { client: 'Alice & Bob', amount: '₱0', method: '-', date: '-', milestone: 'Overdue', milestoneColor: 'bg-red-100 text-red-700' },
];

export default function PaymentAndHistory() {
  return (
    <div className="flex flex-col gap-6 h-full font-serif text-[#1a1f18]">
      
      {/* Top KPI Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-[#FDF5CC] rounded-xl p-6 shadow-sm border border-black/5 flex items-center justify-center gap-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-center">Collected this month</h2>
        </div>
        <div className="bg-[#FDF5CC] rounded-xl p-6 shadow-sm border border-black/5 flex items-center justify-center gap-6">
          <div className="w-16 h-16 rounded-full border-[3px] border-black flex items-center justify-center text-black">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-center">Pending Verification</h2>
        </div>
        <div className="bg-[#FDF5CC] rounded-xl p-6 shadow-sm border border-black/5 flex items-center justify-center">
          <h2 className="text-xl font-bold text-center">Overdue Payments</h2>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6 flex-1">
        
        {/* Left Side: Transactions History */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-[#FDF5CC] p-4 border-b border-black/5 flex justify-between items-center">
            <h2 className="text-xl font-bold">Transactions History</h2>
            {/* Search */}
            <div className="relative w-[300px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search transactions...." 
                className="w-full border border-black rounded-full py-2 pl-9 pr-4 text-sm font-serif focus:outline-none focus:ring-1 focus:ring-black bg-white"
              />
            </div>
          </div>
          <div className="overflow-x-auto flex-1 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Milestone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockTransactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-800">{tx.client}</td>
                    <td className="px-6 py-4 text-sm font-bold text-black">{tx.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tx.method}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tx.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-[11px] font-bold rounded-md ${tx.milestoneColor}`}>
                        {tx.milestone}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Manual Override & Milestones */}
        <div className="w-[380px] flex flex-col gap-6">
          
          {/* Header Info */}
          <div className="bg-[#FDF5CC] rounded-xl p-5 shadow-sm border border-black/5">
            <h2 className="text-xl font-bold text-black">Mickey & Minnie</h2>
            <p className="text-sm text-gray-500">Pending Verification</p>
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-xs font-bold text-[#1a365d] uppercase tracking-wider mb-6">Milestone Progress</h3>
            
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
              {/* Step 1 */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-[3px] border-white"></div>
                <h4 className="font-bold text-black">50% Downpayment</h4>
                <p className="text-xs text-gray-400 mb-2">Due 1 month before event</p>
                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#a8f4c6] text-[#145a32]">Paid</span>
              </div>
              
               {/* Step 2 */}
               <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-300 border-[3px] border-white"></div>
                <h4 className="font-bold text-black">Full Payment</h4>
                <p className="text-xs text-gray-400 mb-2">Due 1 week before event</p>
                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#fcdbb1] text-[#9c5700]">Pending</span>
              </div>
            </div>
          </div>

          {/* Manual Override Form */}
          <div className="bg-[#FDF5CC] rounded-xl p-6 shadow-sm border border-black/5 flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-4">Manual Override</h3>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
                Receipt Uploaded
              </div>
              <button className="bg-[#EADE81] hover:bg-[#d4c86b] text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors">
                Verify & Approve
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-1">Update Status</label>
              <select className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-black">
                <option>Downpayment Paid</option>
                <option>Fully Paid</option>
                <option>Overdue</option>
              </select>
            </div>

            <div className="mb-6 flex-1">
              <label className="block text-sm font-bold mb-1">Add Log Note</label>
              <textarea 
                className="w-full h-24 bg-white border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none"
                placeholder="E.g Client paid cash on-site"
              ></textarea>
            </div>

            <button className="w-full bg-[#EADE81] hover:bg-[#d4c86b] text-black py-3 rounded-lg font-bold text-lg shadow-sm transition-colors">
              Save Changes
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
