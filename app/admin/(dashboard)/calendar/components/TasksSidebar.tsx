'use client';
import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle2, Star, ChevronUp, CheckSquare } from 'lucide-react';
import { getTaskLists, createTaskList } from '../actions';

interface TaskList {
  id: string;
  name: string;
  icon?: string | null;
  _count?: { tasks: number };
}

export function TasksSidebar() {
  const [lists, setLists] = useState<TaskList[]>([]);

  useEffect(() => {
    getTaskLists().then(setLists);
  }, []);

  const handleCreateList = async () => {
    const name = prompt('Enter new list name:');
    if (name && name.trim() !== '') {
      const newList = await createTaskList(name);
      // Optimistic update
      setLists([...lists, { ...newList, _count: { tasks: 0 } }]);
    }
  };

  return (
    <div className="w-[256px] flex-shrink-0 hidden lg:flex flex-col gap-2 overflow-y-auto calendar-scroll pr-2 pb-4 font-sans bg-transparent">
      {/* Create Button */}
      <button className="flex items-center gap-3 bg-white dark:bg-[#343539] hover:bg-gray-50 dark:hover:bg-[#434448] text-gray-800 dark:text-[#E2E2E2] px-4 py-3 rounded-[16px] text-[15px] font-medium transition-colors shadow-sm w-fit focus:outline-none mb-4 ml-2 mt-2">
        <Plus className="w-6 h-6 text-gray-600 dark:text-[#E2E2E2]" />
        <span className="pr-2">Create</span>
      </button>

      {/* Main Task Navigation */}
      <div className="flex flex-col">
        <button className="flex items-center gap-4 bg-[#C2E7FF] dark:bg-[#004A77] text-[#001D35] dark:text-blue-100 rounded-r-full px-5 py-2.5 w-[95%] font-medium text-[14px] transition-colors focus:outline-none">
          <CheckCircle2 className="w-5 h-5 text-[#001D35] dark:text-blue-100" />
          All tasks
        </button>
        <button className="flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-[#E2E2E2] rounded-r-full px-5 py-2.5 w-[95%] font-medium text-[14px] transition-colors focus:outline-none">
          <Star className="w-5 h-5" />
          Starred
        </button>
      </div>

      {/* Lists Accordion */}
      <div className="flex flex-col mt-4">
        <div className="flex items-center justify-between px-5 py-2 cursor-pointer group">
          <span className="text-[14px] font-bold text-gray-800 dark:text-[#E2E2E2]">Lists</span>
          <ChevronUp className="w-5 h-5 text-gray-500" />
        </div>
        
        <div className="flex flex-col mt-1">
          {lists.map(list => (
            <button key={list.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-[#E2E2E2] transition-colors w-[95%] rounded-r-full group">
              <div className="flex items-center gap-4">
                <CheckSquare className="w-5 h-5 text-gray-600 dark:text-[#A8C7FA]" />
                <span className="text-[14px] font-medium">{list.name}</span>
              </div>
              <span className="text-[12px] font-semibold">{list._count?.tasks || 0}</span>
            </button>
          ))}
          
          <button onClick={handleCreateList} className="flex items-center gap-4 px-5 py-2.5 mt-1 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-[#E2E2E2] transition-colors w-[95%] rounded-r-full">
            <Plus className="w-5 h-5 text-gray-500 dark:text-[#E2E2E2]" />
            <span className="text-[14px] font-medium">Create new list</span>
          </button>
        </div>
      </div>
    </div>
  );
}
