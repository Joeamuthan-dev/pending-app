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
  
  const defaultCategories = ['Personal', 'Content', 'Health', 'Business'];
  const categories = Array.from(new Set([...defaultCategories, ...customCategories, ...tasks.map(t => t.category)]));

  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor)
  );

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

  const [quote, setQuote] = useState('');

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

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const totalCount = tasks.length;

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    try {
      if (editTask) {
        await updateDoc(doc(db, 'tasks', editTask.id), {
          title,
          description,
          category,
          priority,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'tasks'), {
          userId: user.id.toString(),
          title,
          description,
          category,
          priority,
          status: 'pending',
          order_index: tasks.length + 1,
          createdAt: new Date().toISOString()
        });
      }
      closeModal();
    } catch (err) {
      console.error('Error saving task:', err);
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
      
      // Update local state immediately for smoothness
      setTasks(newTasks);

      // Persist reorder to Firestore using batch
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
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'Tamil') {
      if (hour < 12) return 'காலை வணக்கம்';
      if (hour < 18) return 'மதிய வணக்கம்';
      return 'மாலை வணக்கம்';
    }
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="page-shell" style={{ padding: '1rem' }}>
      <div className="aurora-bg">
        <div className="aurora-gradient-1"></div>
        <div className="aurora-gradient-2"></div>
      </div>

      {/* Header Section */}
      <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.025em', margin: 0, color: 'var(--text-main)' }}>{getTimeGreeting()}, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>format_quote</span>
            {quote}
          </p>
        </div>
      </header>

      {/* Quick Stats Row */}
      <div className="stat-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="glass-card stat-card-mini" style={{ padding: '1.25rem 1.5rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span className="stat-card-label" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 900, color: '#ef4444', letterSpacing: '0.1em' }}>{t('pending').toUpperCase()}</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="stat-card-value" style={{ fontSize: '2rem', color: 'var(--text-main)' }}>{pendingCount}</span>
                <span className="stat-card-sub" style={{ color: 'var(--text-secondary)' }}>{t('active_tasks')}</span>
              </div>
            </div>
          </div>
          
          <div style={{ width: '100%', height: '8px', background: 'rgba(239, 68, 68, 0.25)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
             {/* Total Tasks Base (Red) */}
             <div style={{ position: 'absolute', inset: 0, background: '#ef4444', opacity: 0.3 }} />
             
             {/* Completed Progress (Green) */}
             <div 
               style={{ 
                 position: 'relative',
                 height: '100%', 
                 width: `${totalCount > 0 ? ((totalCount - pendingCount) / totalCount) * 100 : 0}%`, 
                 background: '#22c55e',
                 boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)',
                 transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                 borderRadius: '10px'
               }} 
             />
          </div>
        </div>
      </div>



      {/* Today's Focus Section */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            {showAllTasks ? t('all_milestones') : t('today_focus')}
          </h2>
          <button 
            onClick={() => setShowAllTasks(!showAllTasks)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {showAllTasks ? t('pending') : t('view_all')}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {showAllTasks 
            ? [...tasks].sort((a) => a.status === 'completed' ? 1 : -1).map(task => (
              <div
                key={task.id}
                className={`glass-card task-card ${task.status === 'completed' ? 'completed' : ''}`}
              >
                {/* Checkbox */}
                <div 
                  className={`checkbox-custom flex-shrink-0 ${task.status === 'completed' ? 'checked' : ''}`}
                  onClick={() => toggleTaskStatus(task)}
                  style={{ width: '2rem', height: '2rem', borderRadius: '0.625rem' }}
                >
                  {task.status === 'completed' && <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'white' }}>check</span>}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openModal(task)}>
                  <h4 style={{ 
                    fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.25rem 0',
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
                    className="icon-btn" 
                    style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => deleteTask(task.id)}
                    title="Delete"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete</span>
                  </button>
                  <button 
                    className="icon-btn" 
                    style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => openModal(task)}
                    title="Edit"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>edit</span>
                  </button>
                </div>
              </div>
            ))
            : (
              <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
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
                  <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, borderStyle: 'dashed' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}>task_alt</span>
                    All caught up for today!
                  </div>
                )}
              </div>
            )
          }
        </div>
      </section>

      {/* Bottom Navigation */}
      <BottomNav onAddClick={() => openModal()} />

      {/* Modal */}
      {showModal && (
        <div className="premium-modal-overlay" onClick={closeModal}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.025em' }}>{editTask ? t('edit_task') : t('new_task')}</h2>
              <button 
                onClick={closeModal} 
                className="notification-btn"
                style={{ width: '36px', height: '36px', borderRadius: '50%' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', letterSpacing: '0.1em', fontWeight: 800, color: '#64748b', marginBottom: '0.75rem', display: 'block' }}>{t('task_name')}</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', fontSize: '24px' }}>edit_note</span>
                  <input 
                    className="form-input" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                    autoFocus 
                    placeholder="E.g. Website Rebranding"
                    style={{ background: 'rgba(255,255,255,0.03)', border: 'none', padding: '1.25rem 1.25rem 1.25rem 3.75rem', fontSize: '1.15rem', borderRadius: '1.5rem', color: 'white', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.75rem', letterSpacing: '0.1em', fontWeight: 800, color: '#64748b', marginBottom: '0.75rem', display: 'block' }}>{t('description')}</label>
                <textarea 
                  className="form-input" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Add more details about this task..."
                  style={{ background: 'rgba(255,255,255,0.03)', border: 'none', minHeight: '120px', padding: '1.25rem', fontSize: '1.05rem', borderRadius: '1.5rem', resize: 'none', color: 'white', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.75rem', letterSpacing: '0.1em', fontWeight: 800, color: '#64748b', marginBottom: '1rem', display: 'block' }}>{t('categories')}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      type="button"
                      className={`tag-btn ${category === cat ? 'active' : ''}`}
                      onClick={() => { setCategory(cat); setIsAddingCategory(false); }}
                    >
                      {cat}
                    </button>
                  ))}
                  {!isAddingCategory ? (
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCategory(true)}
                      className="tag-btn"
                      style={{ background: 'var(--primary)', color: 'white', fontWeight: 'bold' }}
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
                        autoFocus
                        style={{ 
                          background: 'rgba(255,255,255,0.05)', 
                          border: '1px solid var(--primary)', 
                          borderRadius: '1rem', 
                          padding: '0.75rem 1rem', 
                          color: 'white',
                          flex: 1
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                          style={{ minWidth: '60px' }}
                        >
                          {t('add')}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsAddingCategory(false)}
                          className="tag-btn"
                          style={{ minWidth: '70px' }}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.75rem', letterSpacing: '0.1em', fontWeight: 800, color: '#64748b', marginBottom: '1rem', display: 'block' }}>{t('priority')}</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {([
                    { value: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   icon: '🔴' },
                    { value: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  icon: '🟡' },
                    { value: 'Low',    color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)',  icon: '🔵' },
                  ] as const).map(({ value, color, bg, border, icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPriority(value)}
                      style={{
                        flex: 1,
                        padding: '0.75rem 0.5rem',
                        borderRadius: '1rem',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: `2px solid ${priority === value ? border : 'rgba(255,255,255,0.06)'}`,
                        background: priority === value ? bg : 'rgba(255,255,255,0.03)',
                        color: priority === value ? color : '#64748b',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        transform: priority === value ? 'translateY(-2px)' : 'none',
                        boxShadow: priority === value ? `0 4px 15px ${bg}` : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
                <button type="submit" className="glow-btn-primary" style={{ height: '4.5rem', borderRadius: '1.5rem', fontSize: '1.2rem', gap: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', fontWeight: 'bold' }}>add_task</span>
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
