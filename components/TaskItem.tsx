
import React, { useState } from 'react';
import { Todo, Priority } from '../types';
import { breakdownTask } from '../services/geminiService';

interface TaskItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSubtasks: (id: string, subTasks: any[]) => void;
  onToggleSubtask: (taskId: string, subTaskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  todo, 
  onToggle, 
  onDelete, 
  onUpdateSubtasks,
  onToggleSubtask
}) => {
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(true);

  const handleBreakdown = async () => {
    if (todo.subTasks.length > 0 || isBreakingDown) return;
    setIsBreakingDown(true);
    try {
      const suggestedSubtasks = await breakdownTask(todo.text);
      const newSubtasks = suggestedSubtasks.map((s: any, index: number) => ({
        id: `${todo.id}-sub-${index}`,
        text: s.text,
        completed: false
      }));
      onUpdateSubtasks(todo.id, newSubtasks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBreakingDown(false);
    }
  };

  const priorityStyles = {
    [Priority.HIGH]: 'bg-red-100 text-red-700 border-red-200',
    [Priority.MEDIUM]: 'bg-amber-100 text-amber-700 border-amber-200',
    [Priority.LOW]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <div className={`p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md ${todo.completed ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <button 
            onClick={() => onToggle(todo.id)}
            className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${todo.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'}`}
          >
            {todo.completed && <i className="fas fa-check text-[10px] text-white"></i>}
          </button>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityStyles[todo.priority]}`}>
                {todo.priority}
              </span>
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {todo.category}
              </span>
            </div>
            <h3 className={`text-base font-medium transition-all ${todo.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {todo.text}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!todo.completed && todo.subTasks.length === 0 && (
            <button
              onClick={handleBreakdown}
              disabled={isBreakingDown}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors title='Break down with AI'"
            >
              {isBreakingDown ? (
                <i className="fas fa-circle-notch fa-spin"></i>
              ) : (
                <i className="fas fa-wand-magic-sparkles"></i>
              )}
            </button>
          )}
          <button
            onClick={() => onDelete(todo.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <i className="far fa-trash-alt"></i>
          </button>
        </div>
      </div>

      {todo.subTasks.length > 0 && (
        <div className="mt-4 ml-8 space-y-2 border-l-2 border-slate-100 pl-4">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600"
            >
              {showSubtasks ? 'Hide subtasks' : `Show ${todo.subTasks.length} subtasks`}
            </button>
            <div className="text-[10px] font-medium text-slate-400">
              {todo.subTasks.filter(s => s.completed).length} / {todo.subTasks.length} done
            </div>
          </div>
          
          {showSubtasks && todo.subTasks.map(sub => (
            <div key={sub.id} className="flex items-center gap-2">
              <button 
                onClick={() => onToggleSubtask(todo.id, sub.id)}
                className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${sub.completed ? 'bg-indigo-400 border-indigo-400' : 'border-slate-300 hover:border-indigo-400'}`}
              >
                {sub.completed && <i className="fas fa-check text-[8px] text-white"></i>}
              </button>
              <span className={`text-sm ${sub.completed ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                {sub.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
