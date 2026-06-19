'use client';
import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, MoreVertical, Circle, Clock, Check, GripVertical, Trash2, Paperclip, AlignLeft } from 'lucide-react';
import { isToday, isTomorrow, format, parseISO } from 'date-fns';

import { getTasks, createTask, toggleTask as apiToggleTask, deleteTask as apiDeleteTask, deleteCompletedTasks as apiDeleteCompletedTasks } from '../actions';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  date?: string;
  details?: string | null;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
  dueTime?: string | null;
  hasAttachment?: boolean;
}

export function TasksMain() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpandedForm, setIsExpandedForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetails, setNewTaskDetails] = useState('');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [newTaskHasAttachment, setNewTaskHasAttachment] = useState(false);
  
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tasks on mount
  useEffect(() => {
    getTasks().then(data => {
      setTasks(data as unknown as Task[]);
      setIsLoading(false);
    });
  }, []);

  const handleSaveTask = async () => {
    if (newTaskTitle.trim() !== '') {
      const data = {
        title: newTaskTitle.trim(),
        details: newTaskDetails.trim() || undefined,
        startDate: newTaskStartDate ? new Date(newTaskStartDate) : undefined,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate) : undefined,
        dueTime: newTaskDueTime || undefined,
        hasAttachment: newTaskHasAttachment,
      };
      
      // Optimistic update
      const optimisticTask = {
        id: Date.now().toString(),
        ...data,
        startDate: data.startDate?.toISOString(),
        dueDate: data.dueDate?.toISOString(),
        completed: false,
      };
      setTasks([optimisticTask as Task, ...tasks]);
      
      setIsExpandedForm(false);
      setNewTaskTitle('');
      setNewTaskDetails('');
      setNewTaskStartDate('');
      setNewTaskDueDate('');
      setNewTaskDueTime('');
      setNewTaskHasAttachment(false);

      const created = await createTask(data);
      setTasks(prev => prev.map(t => t.id === optimisticTask.id ? (created as unknown as Task) : t));
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    await apiToggleTask(id, !task.completed);
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await apiDeleteTask(id);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetId) return;

    const oldIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const newIndex = tasks.findIndex(t => t.id === targetId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newTasks = [...tasks];
    const [removed] = newTasks.splice(oldIndex, 1);
    newTasks.splice(newIndex, 0, removed);
    
    setTasks(newTasks);
    setDraggedTaskId(null);
  };

  const getTaskDisplayDate = (task: Task) => {
    if (!task.dueDate && !task.dueTime) return task.date; // Fallback to 'Today'

    if (task.dueDate) {
      const dateObj = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
      let dateStr = '';
      
      if (isToday(dateObj)) {
        dateStr = 'Today';
      } else if (isTomorrow(dateObj)) {
        dateStr = 'Tomorrow';
      } else {
        dateStr = format(dateObj, 'EEE, MMM d');
      }

      if (task.dueTime) {
        const [hours, minutes] = task.dueTime.split(':');
        const timeObj = new Date();
        timeObj.setHours(parseInt(hours, 10));
        timeObj.setMinutes(parseInt(minutes, 10));
        return `${dateStr}, ${format(timeObj, 'h:mm a')}`;
      }
      return dateStr;
    }

    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':');
      const timeObj = new Date();
      timeObj.setHours(parseInt(hours, 10));
      timeObj.setMinutes(parseInt(minutes, 10));
      return `Today, ${format(timeObj, 'h:mm a')}`;
    }

    return '';
  };

  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-[#141A13] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col relative z-10 p-0 sm:p-0">
      <div className="flex-1 flex justify-center py-8 sm:py-12 overflow-y-auto calendar-scroll">
        <div className="w-full px-4 sm:px-8 max-w-4xl">
          
          {/* Header */}
          <div className="flex items-center justify-end mb-6 border-b border-gray-100 dark:border-white/10 pb-4 relative" ref={menuRef}>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-full transition-colors focus:outline-none ${isMenuOpen ? 'bg-gray-200 dark:bg-white/20 text-gray-800 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500'}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-12 w-[260px] bg-white dark:bg-[#343539] rounded-lg shadow-xl border border-gray-200 dark:border-[#4B4C50] py-2 z-50 text-[14px] font-sans">
                
                {/* Sort by section */}
                <div className="px-4 py-2">
                  <div className="text-gray-500 dark:text-gray-400 font-semibold mb-2 text-[12px] tracking-wide uppercase">Sort by</div>
                  <button className="w-full flex items-center justify-between py-1.5 text-gray-700 dark:text-[#E2E2E2] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none">
                    <span className="font-medium">My order</span>
                    <Check className="w-4 h-4 text-blue-500" />
                  </button>
                  <button className="w-full flex items-center justify-between py-1.5 text-gray-700 dark:text-[#E2E2E2] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none">
                    <span>Date</span>
                  </button>
                  <button className="w-full flex items-center justify-between py-1.5 text-gray-700 dark:text-[#E2E2E2] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none">
                    <span>Deadline</span>
                  </button>
                  <button className="w-full flex items-center justify-between py-1.5 text-gray-700 dark:text-[#E2E2E2] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none">
                    <span>Starred recently</span>
                  </button>
                  <button className="w-full flex items-center justify-between py-1.5 text-gray-700 dark:text-[#E2E2E2] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none">
                    <span>Title</span>
                  </button>
                </div>

                <div className="h-px bg-gray-200 dark:bg-white/10 my-1"></div>

                {/* List management section */}
                <div className="px-4 py-2">
                  <button className="w-full flex items-center justify-between py-1.5 text-gray-700 dark:text-[#E2E2E2] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none">
                    <span>Rename list</span>
                  </button>
                  <button className="w-full flex items-center justify-between py-1.5 text-gray-400 dark:text-gray-500 cursor-not-allowed focus:outline-none">
                    <span>Delete list</span>
                  </button>
                </div>

                <div className="h-px bg-gray-200 dark:bg-white/10 my-1"></div>

                {/* Utilities section */}
                <div className="px-4 py-2">
                  <button className="w-full flex items-center justify-between py-1.5 text-gray-700 dark:text-[#E2E2E2] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none">
                    <span>Print list</span>
                  </button>
                  <button 
                    onClick={async () => {
                      setIsMenuOpen(false);
                      setTasks(tasks.filter(t => !t.completed));
                      await apiDeleteCompletedTasks();
                    }}
                    className="w-full flex items-center justify-between py-1.5 text-gray-700 dark:text-[#E2E2E2] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
                  >
                    <span>Delete all completed tasks</span>
                  </button>
                  <button className="w-full flex items-center justify-between py-1.5 text-gray-700 dark:text-[#E2E2E2] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none">
                    <span>Clean up old tasks</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add a task input */}
          {!isExpandedForm ? (
            <div 
              onClick={() => setIsExpandedForm(true)}
              className="flex items-center gap-4 py-3 group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors mb-2"
            >
              <PlusCircle className="w-5 h-5 text-blue-500" />
              <div className="flex-1 text-[15px] font-sans text-gray-500 dark:text-[#A3B19B]">Add a task</div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A2118] border border-gray-200 dark:border-white/10 rounded-xl p-4 mb-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
              <input 
                autoFocus
                type="text" 
                placeholder="Task title" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTask();
                }}
                className="w-full bg-transparent border-none outline-none text-[16px] font-medium text-gray-800 dark:text-[#F4F4F0] placeholder-gray-400 mb-3"
              />
              <textarea
                placeholder="Details"
                value={newTaskDetails}
                onChange={(e) => setNewTaskDetails(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[14px] text-gray-600 dark:text-[#A3B19B] placeholder-gray-400 mb-4 resize-none h-20"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-[#A3B19B]/80 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={newTaskStartDate} 
                    onChange={e => setNewTaskStartDate(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-[#F4F4F0] outline-none focus:border-blue-500 dark:focus:border-[#D4AF37] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-[#A3B19B]/80 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    value={newTaskDueDate} 
                    onChange={e => setNewTaskDueDate(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-[#F4F4F0] outline-none focus:border-blue-500 dark:focus:border-[#D4AF37] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-[#A3B19B]/80 mb-1">Due Time</label>
                  <input 
                    type="time" 
                    value={newTaskDueTime} 
                    onChange={e => setNewTaskDueTime(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-[#F4F4F0] outline-none focus:border-blue-500 dark:focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                <button 
                  onClick={() => setNewTaskHasAttachment(!newTaskHasAttachment)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors focus:outline-none ${newTaskHasAttachment ? 'text-blue-600 dark:text-[#D4AF37]' : 'text-gray-500 dark:text-[#A3B19B] hover:text-gray-700 dark:hover:text-[#F4F4F0]'}`}
                >
                  <Paperclip className="w-4 h-4" />
                  {newTaskHasAttachment ? 'File attached' : 'Attach file'}
                </button>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button 
                    onClick={() => setIsExpandedForm(false)} 
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-[#A3B19B] hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveTask} 
                    disabled={!newTaskTitle.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-[#D4AF37] dark:hover:bg-[#E8D579] dark:text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                  >
                    Save Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="mt-2 flex flex-col">
            {tasks.map((task) => (
              <div 
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, task.id)}
                className={`flex items-start gap-3 py-3 group cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors rounded-lg px-2 -mx-2 ${draggedTaskId === task.id ? 'opacity-50 bg-gray-50 dark:bg-white/5' : ''}`}
              >
                <div className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4" />
                </div>
                
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors focus:outline-none flex-shrink-0
                    ${task.completed ? 'bg-blue-500 border-blue-500 dark:bg-[#D6B53B] dark:border-[#D6B53B]' : 'border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}
                  `}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <span className={`text-[15px] font-sans truncate ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-[#F4F4F0]'}`}>
                    {task.title}
                  </span>
                  {task.details && (
                    <span className={`text-[13px] font-sans truncate ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-500 dark:text-[#A3B19B]'}`}>
                      {task.details}
                    </span>
                  )}
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {(task.dueDate || task.dueTime || task.date) && !task.completed && (
                      <div className="flex items-center gap-1.5 bg-transparent w-fit px-2.5 py-0.5 rounded-full border border-gray-300 dark:border-gray-500/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group/pill cursor-pointer">
                        <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-[12px] font-medium text-gray-600 dark:text-[#E2E2E2]">{getTaskDisplayDate(task)}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Logic to remove date could go here
                          }}
                          className="opacity-0 group-hover/pill:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-white ml-0.5 transition-opacity focus:outline-none"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    )}
                    {task.hasAttachment && !task.completed && (
                      <div className="flex items-center gap-1.5 bg-transparent w-fit px-2.5 py-0.5 rounded-full border border-gray-300 dark:border-gray-500/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group/pill cursor-pointer">
                        <Paperclip className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-[12px] font-medium text-gray-600 dark:text-[#E2E2E2]">1 Attachment</span>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className="mt-0.5 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                No tasks found. Add a task above to get started.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
