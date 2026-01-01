
import React, { useState, useEffect, useCallback } from 'react';
import { Todo, Priority, AISuggestion } from './types';
import { TaskItem } from './components/TaskItem';
import { categorizeTask, getSmartSuggestions } from './services/geminiService';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('gemini-tasks');
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch (e) {
        console.error("Storage error", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gemini-tasks', JSON.stringify(todos));
  }, [todos]);

  const addTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isAdding) return;

    setIsAdding(true);
    const text = inputValue.trim();
    setInputValue('');

    try {
      const { priority, category } = await categorizeTask(text);
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        priority: priority as Priority,
        category,
        subTasks: [],
        createdAt: Date.now()
      };
      setTodos(prev => [newTodo, ...prev]);
    } catch (err) {
      const fallbackTodo: Todo = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        priority: Priority.MEDIUM,
        category: 'General',
        subTasks: [],
        createdAt: Date.now()
      };
      setTodos(prev => [fallbackTodo, ...prev]);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = (id: string) => {
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleDelete = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateSubtasks = (id: string, subTasks: any[]) => {
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, subTasks } : t
    ));
  };

  const handleToggleSubtask = (taskId: string, subTaskId: string) => {
    setTodos(prev => prev.map(t => 
      t.id === taskId ? {
        ...t,
        subTasks: t.subTasks.map(s => 
          s.id === subTaskId ? { ...s, completed: !s.completed } : s
        )
      } : t
    ));
  };

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const res = await getSmartSuggestions(todos.slice(0, 5).map(t => t.text));
      setSuggestions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const addSuggestedTask = async (s: AISuggestion) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: s.text,
      completed: false,
      priority: s.priority,
      category: s.category,
      subTasks: [],
      createdAt: Date.now()
    };
    setTodos(prev => [newTodo, ...prev]);
    setSuggestions(prev => prev.filter(item => item.text !== s.text));
  };

  const filteredTodos = todos.filter(t => {
    if (activeTab === 'active') return !t.completed;
    if (activeTab === 'completed') return t.completed;
    return true;
  });

  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 pb-32">
      {/* Header */}
      <header className="mb-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
          <i className="fas fa-layer-group text-white text-3xl"></i>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Task Orchestrator</h1>
        <p className="text-slate-500 max-w-sm">
          Optimize your workflow with AI-powered task analysis and suggestions.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total</div>
          <div className="text-xl font-bold text-indigo-600">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pending</div>
          <div className="text-xl font-bold text-amber-600">{stats.active}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Done</div>
          <div className="text-xl font-bold text-emerald-600">{stats.completed}</div>
        </div>
      </div>

      {/* Input */}
      <form onSubmit={addTask} className="relative mb-8 group">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="What needs to be done? Gemini will analyze it."
          className="w-full pl-6 pr-16 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all text-lg placeholder:text-slate-400"
          disabled={isAdding}
        />
        <button 
          type="submit"
          disabled={!inputValue.trim() || isAdding}
          className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl transition-colors flex items-center gap-2"
        >
          {isAdding ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
          <span className="font-semibold hidden sm:inline">Add</span>
        </button>
      </form>

      {/* AI Suggestions Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-sparkles text-amber-500"></i>
            <h2 className="font-bold text-slate-700">AI Smart Suggestions</h2>
          </div>
          <button 
            onClick={fetchSuggestions}
            disabled={isLoadingSuggestions}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
          >
            <i className={`fas fa-sync-alt ${isLoadingSuggestions ? 'animate-spin' : ''}`}></i>
            Refresh
          </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
          {suggestions.length === 0 && !isLoadingSuggestions && (
            <div className="text-sm text-slate-400 italic py-2">Click refresh for smart task ideas...</div>
          )}
          {isLoadingSuggestions && (
            <div className="flex gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="min-w-[200px] h-20 bg-slate-100 animate-pulse rounded-xl"></div>
              ))}
            </div>
          )}
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => addSuggestedTask(s)}
              className="flex-shrink-0 min-w-[200px] p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-left hover:bg-indigo-100 transition-colors group"
            >
              <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">{s.category}</div>
              <div className="text-sm font-medium text-slate-700 line-clamp-2">{s.text}</div>
              <div className="mt-2 text-[10px] text-indigo-400 group-hover:text-indigo-600 flex items-center gap-1">
                <i className="fas fa-plus"></i> Add to list
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* List Filters */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          All
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'active' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          Active
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'completed' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          Completed
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="far fa-clipboard text-slate-300 text-2xl"></i>
            </div>
            <p className="text-slate-500 font-medium">No tasks found here.</p>
            <p className="text-sm text-slate-400">Add a new task above to get started.</p>
          </div>
        ) : (
          filteredTodos.map(todo => (
            <TaskItem 
              key={todo.id} 
              todo={todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onUpdateSubtasks={handleUpdateSubtasks}
              onToggleSubtask={handleToggleSubtask}
            />
          ))
        )}
      </div>

      {/* Footer Branding */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-bolt text-white text-xs"></i>
          </div>
          <span className="text-sm font-bold text-slate-800">Gemini Powered</span>
        </div>
        <div className="text-xs text-slate-400">
          Built with Gemini 3 Pro
        </div>
      </footer>
    </div>
  );
};

export default App;
