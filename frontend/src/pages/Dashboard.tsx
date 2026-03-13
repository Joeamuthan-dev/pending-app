import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;
  order_index?: number;
}

interface SortableTaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      className={`glass-card task-card group ${task.status === 'completed' ? 'completed' : ''}`}
    >
      {/* Checkbox */}
      <div 
        className={`checkbox-custom flex-shrink-0 ${task.status === 'completed' ? 'checked' : ''}`} 
        onClick={(e) => { e.stopPropagation(); onToggle(task); }}
        style={{ width: '2rem', height: '2rem', borderRadius: '0.625rem', cursor: 'pointer', flexShrink: 0, marginTop: '2px' }}
      >
        {task.status === 'completed' && <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'white' }}>check</span>}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
        <h4 style={{ 
          fontSize: '0.95rem', 
          fontWeight: 700, 
          margin: '0 0 0.25rem 0', 
          color: task.status === 'completed' ? '#64748b' : '#f8fafc',
          textDecoration: task.status === 'completed' ? 'line-through' : 'none',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.35'
        }}>{task.title}</h4>
        {task.description && (
          <p style={{
            fontSize: '0.78rem',
            color: '#64748b',
            margin: '0 0 0.5rem 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4'
          }}>{task.description}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className={`category-tag category-${task.category || 'Business'}`}>
            {task.category || 'Business'}
          </span>
          <span className={`priority-tag priority-${task.priority || 'Medium'}`}>
            {task.priority || 'Medium'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
        <button 
          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          title="Delete task"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete</span>
        </button>
        {/* Drag handle — only this element has listeners */}
        <button 
          {...listeners}
          style={{ color: '#475569', background: 'none', border: 'none', cursor: 'grab', padding: '0.25rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}
          title="Drag to reorder"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>drag_indicator</span>
        </button>
      </div>
    </div>
  );
};

import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Business');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const { t, language } = useLanguage();
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [quote, setQuote] = useState('');

  const { user } = useAuth();
  
  const defaultCategories = ['Personal', 'Content', 'Health', 'Business'];
  const categories = Array.from(new Set([...defaultCategories, ...customCategories, ...tasks.map(t => t.category)]));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor)
  );

  const quotes = [
    "One day at a time.",
    "Small steps, big results.",
    "Make it happen.",
    "Eyes on the prize.",
    "Focus on progress, not perfection.",
    "Start where you are.",
    "Stay consistent.",
    "You've got this.",
    "Dream big, act daily.",
    "Today is yours."
  ];

  // REALTIME FIRESTORE TASKS
  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.id.toString()),
      orderBy('order_index', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(taskList);
    }, (err) => {
      console.error('Firestore tasks error:', err);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const totalCount = tasks.length;

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    // Optimistic closure for instant feedback
    const taskData = {
      title,
      description,
      category,
      priority,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editTask) {
        setTasks(prev => prev.map(t => t.id === editTask.id ? { ...t, ...taskData } : t));
        updateDoc(doc(db, 'tasks', editTask.id), taskData).catch(err => console.error('Error saving task:', err));
      } else {
        const newTask = {
          id: 'temp-' + Date.now().toString(),
          ...taskData,
          userId: user.id.toString(),
          status: 'pending' as const,
          order_index: tasks.length + 1,
          createdAt: new Date().toISOString()
        };
        setTasks(prev => [...prev, newTask]);
        addDoc(collection(db, 'tasks'), {
          ...taskData,
          userId: user.id.toString(),
          status: 'pending',
          order_index: tasks.length + 1,
          createdAt: newTask.createdAt
        }).catch(err => console.error('Error saving task:', err));
      }
      closeModal();
    } catch (err) {
      console.error('Error in handleCreateOrUpdate:', err);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending';
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };


  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      
      setTasks(newTasks);

      try {
        const batch = writeBatch(db);
        newTasks.forEach((t, idx) => {
          const taskRef = doc(db, 'tasks', t.id);
          batch.update(taskRef, { order_index: idx + 1 });
        });
        await batch.commit();
      } catch (err) {
        console.error('Firestore reorder error:', err);
      }
    }
  };

  const openModal = (task?: Task) => {
    if (task) {
      setEditTask(task);
      setTitle(task.title);
      setDescription(task.description);
      setCategory(task.category || 'Business');
      setPriority(task.priority || 'Medium');
    } else {
      setEditTask(null);
      setTitle('');
      setDescription('');
      setCategory('Business');
      setPriority('Medium');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTask(null);
    setTitle('');
    setDescription('');
    setIsAddingCategory(false);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'Tamil' ? 'காலை வணக்கம்' : 'Good Morning';
    if (hour < 18) return language === 'Tamil' ? 'மதிய வணக்கம்' : 'Good Afternoon';
    return language === 'Tamil' ? 'மாலை வணக்கம்' : 'Good Evening';
  };

  return (
    <div className="page-shell dashboard-layout">
      <div className="aurora-bg">
        <div className="aurora-gradient-1"></div>
        <div className="aurora-gradient-2"></div>
      </div>

      <header className="dashboard-header" style={{ marginBottom: '1.5rem', flexShrink: 0, padding: 0 }}>
        <div style={{ width: '100%' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'white' }}>
            {getTimeGreeting()}, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981', marginTop: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>format_quote</span>
            {quote}
          </p>
        </div>
      </header>

      <div className="stat-grid" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ef4444', marginBottom: '0.25rem', display: 'block' }}>
                {t('pending')}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{pendingCount}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>{t('active_tasks')}</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>assignment_late</span>
            </div>
          </div>
          
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', overflow: 'hidden' }}>
             <div 
               style={{ 
                 height: '100%', 
                 background: '#10b981', 
                 width: `${totalCount > 0 ? ((totalCount - pendingCount) / totalCount) * 100 : 0}%`,
                 transition: 'width 0.7s ease-out'
               }} 
             />
          </div>
        </div>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, paddingBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', margin: 0 }}>
            {showAllTasks ? t('all_milestones') : t('today_focus')}
          </h2>
          <button 
            onClick={() => setShowAllTasks(!showAllTasks)}
            style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {showAllTasks ? t('pending') : t('view_all')}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '6rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {showAllTasks 
            ? [...tasks].sort((a) => a.status === 'completed' ? 1 : -1).map(task => (
              <SortableTaskItem 
                key={task.id} 
                task={task} 
                onToggle={toggleTaskStatus} 
                onDelete={deleteTask} 
                onEdit={openModal} 
              />
            ))
            : (
              <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={tasks.filter(t => t.status === 'pending').map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tasks.filter(t => t.status === 'pending').map((t) => (
                      <SortableTaskItem 
                        key={t.id} 
                        task={t} 
                        onToggle={toggleTaskStatus} 
                        onDelete={deleteTask} 
                        onEdit={openModal} 
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {tasks.filter(t => t.status === 'pending').length === 0 && (
                  <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4, borderStyle: 'dashed', borderWidth: '2px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>task_alt</span>
                    <p style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>All caught up for today!</p>
                  </div>
                )}
              </div>
            )
          }
        </div>
      </section>

      <BottomNav onAddClick={() => openModal()} />

      {showModal && (
        <div className="premium-modal-overlay" onClick={closeModal}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0 }}>{editTask ? t('edit_task') : t('new_task')}</h2>
              <button onClick={closeModal} className="notification-btn">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="input-group">
                <label style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>{t('task_name')}</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontSize: '20px' }}>edit_note</span>
                  <input 
                    className="form-input" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                    autoFocus 
                    placeholder="Task name..."
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '1rem 1rem 1rem 3rem', fontSize: '1.1rem', borderRadius: '1rem', color: 'white', width: '100%', boxSizing: 'border-box', fontWeight: 'bold' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>{t('description')}</label>
                <textarea 
                  className="form-input" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Details..."
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', minHeight: '100px', padding: '1rem', fontSize: '0.9rem', borderRadius: '1rem', resize: 'none', color: 'white', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.75rem', display: 'block' }}>{t('categories')}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      type="button"
                      className={`tag-btn ${category === cat ? 'active' : ''}`}
                      onClick={() => { setCategory(cat); setIsAddingCategory(false); }}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '0.75rem' }}
                    >
                      {cat}
                    </button>
                  ))}
                  {!isAddingCategory ? (
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCategory(true)}
                      className="tag-btn"
                      style={{ background: '#10b981', color: '#064e3b', fontWeight: 'black', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}
                    >
                      + {t('add')}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                      <input 
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Group name..."
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #10b981', borderRadius: '0.75rem', padding: '0.5rem 1rem', color: 'white', flex: 1 }}
                        autoFocus
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            setCustomCategories(prev => [...prev, newCategoryName.trim()]);
                            setCategory(newCategoryName.trim());
                            setNewCategoryName('');
                            setIsAddingCategory(false);
                          }
                        }}
                        className="tag-btn active"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        {t('add')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.75rem', display: 'block' }}>{t('priority')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {([
                    { value: 'High', color: '#ef4444', icon: '🔴' },
                    { value: 'Medium', color: '#f59e0b', icon: '🟡' },
                    { value: 'Low', color: '#3b82f6', icon: '🔵' },
                  ] as const).map(({ value, color, icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPriority(value)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: '1rem',
                        fontWeight: 900,
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: '2px solid transparent',
                        background: 'rgba(255,255,255,0.03)',
                        color: priority === value ? color : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        opacity: priority === value ? 1 : 0.4,
                        ...(priority === value ? { borderColor: color, background: `${color}15` } : {})
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: '1rem' }}>
                <button 
                  type="submit" 
                  className="glow-btn-primary" 
                  style={{ width: '100%', height: '4rem', borderRadius: '1.25rem', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', gap: '0.75rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    add_task
                  </span>
                  <span>{editTask ? t('update_milestone') : t('save_task')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
