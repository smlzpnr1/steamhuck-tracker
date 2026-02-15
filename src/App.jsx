import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ SUPABASE AYARLARI - Vercel'de Environment Variables olarak eklenecek
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Demo modu kontrolü
const isDemo = !supabase;

// Puan Tablosu
const WORKOUT_TYPES = [
  { id: 'sh_training', name: 'SH Antrenmanı', emoji: '🥏', points: 4 },
  { id: 'other_frisbee', name: 'Farklı Takım Frizbi', emoji: '🥏', points: 2 },
  { id: 'upper_body', name: 'Üst Vücut', emoji: '💪', points: 2 },
  { id: 'ultimate_lower', name: 'Alt Vücut/Core/HIIT', emoji: '🔥', points: 3 },
  { id: 'explosive', name: 'Koşu 5km+ / Bisiklet 10km+', emoji: '🏃', points: 3 },
  { id: 'plyometrics', name: 'Plyometrics / Sprint', emoji: '⚡', points: 3 },
  { id: 'other_sport', name: 'Farklı Spor Dalı', emoji: '🎾', points: 1 },
  { id: 'mobility', name: 'Yoga / Pilates / Mobility', emoji: '🧘', points: 1 },
  { id: 'disc_throwing', name: 'Disk Atma', emoji: '🎯', points: 2 },
];

// Takımlar
const TEAMS = {
  team_emir: {
    name: "Emir'in Takımı",
    captain: 'Emir',
    emoji: '💚',
    members: ['Emir', 'Simay', 'Kağan', 'İrem', 'Ayşenur', 'Tuti', 'Bilgecan', 'Aytaç', 'Ece', 'Deniz', 'Şevval']
  },
  team_ceyhun: {
    name: "Ceyhun'un Takımı",
    captain: 'Ceyhun',
    emoji: '💙',
    members: ['Ceyhun', 'Efza', 'Tarık Zadil', 'Elif', 'Hüseyin', 'Azra', 'Emre', 'Şamil', 'Dilara', 'Aliberk', 'Şeyma']
  }
};

const SEASON_START = new Date('2026-02-16T00:00:00');
const SEASON_DURATION_DAYS = 14;

// Haftalık Hedefler
const WEEKLY_GOALS = {
  week1: {
    start: new Date('2026-02-16T00:00:00'),
    end: new Date('2026-02-23T00:00:00'),
    title: 'Hafta 1 Hedefleri',
    goals: [
      { id: 'sh_training', name: 'SH Antrenmanı', emoji: '🥏' },
      { id: 'explosive', name: 'Koşu 5km+ / Bisiklet 10km+', emoji: '🏃' },
      { id: 'plyometrics', name: 'Plyometrics / Sprint', emoji: '⚡' },
    ],
    bonus: 3
  }
};

export default function SteamhuckTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('feed');
  const [workouts, setWorkouts] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedWorkouts, setSelectedWorkouts] = useState([]);
  const [tagTarget, setTagTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Veri yükleme
  useEffect(() => {
    const savedUser = localStorage.getItem('steamhuckUser');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    loadData();
  }, []);

  // Otomatik yenileme (her 30 saniye)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDemo) loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setDataLoading(true);
    
    if (isDemo) {
      // Demo mod - localStorage
      const savedWorkouts = localStorage.getItem('steamhuckWorkouts');
      const savedTags = localStorage.getItem('steamhuckTags');
      if (savedWorkouts) setWorkouts(JSON.parse(savedWorkouts));
      if (savedTags) setTags(JSON.parse(savedTags));
    } else {
      // Supabase
      try {
        const [workoutsRes, tagsRes] = await Promise.all([
          supabase.from('workouts').select('*').order('created_at', { ascending: false }),
          supabase.from('tags').select('*').order('created_at', { ascending: false })
        ]);
        
        if (workoutsRes.data) setWorkouts(workoutsRes.data);
        if (tagsRes.data) setTags(tagsRes.data);
        setLastRefresh(new Date());
      } catch (err) {
        console.error('Veri yükleme hatası:', err);
      }
    }
    
    setDataLoading(false);
    updateTagStatuses();
  };

  const saveWorkout = async (workoutData) => {
    if (isDemo) {
      const newWorkouts = [workoutData, ...workouts];
      setWorkouts(newWorkouts);
      localStorage.setItem('steamhuckWorkouts', JSON.stringify(newWorkouts));
      return true;
    } else {
      const { error } = await supabase.from('workouts').insert(workoutData);
      if (!error) {
        await loadData();
        return true;
      }
      return false;
    }
  };

  const saveTag = async (tagData) => {
    if (isDemo) {
      const newTags = [tagData, ...tags];
      setTags(newTags);
      localStorage.setItem('steamhuckTags', JSON.stringify(newTags));
      return true;
    } else {
      const { error } = await supabase.from('tags').insert(tagData);
      if (!error) {
        await loadData();
        return true;
      }
      return false;
    }
  };

  const updateTag = async (tagId, updates) => {
    if (isDemo) {
      const newTags = tags.map(t => t.id === tagId ? { ...t, ...updates } : t);
      setTags(newTags);
      localStorage.setItem('steamhuckTags', JSON.stringify(newTags));
    } else {
      await supabase.from('tags').update(updates).eq('id', tagId);
      await loadData();
    }
  };

  // Yardımcı fonksiyonlar
  const getUserTeam = (userName) => {
    if (TEAMS.team_emir.members.includes(userName)) return 'team_emir';
    if (TEAMS.team_ceyhun.members.includes(userName)) return 'team_ceyhun';
    return null;
  };

  const getOpponentTeamId = (userName) => {
    return getUserTeam(userName) === 'team_emir' ? 'team_ceyhun' : 'team_emir';
  };

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const end = new Date(SEASON_START);
    end.setDate(end.getDate() + SEASON_DURATION_DAYS);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getWeeklyPoints = (userName) => {
    const weekStart = getWeekStart();
    return workouts
      .filter(w => w.user_name === userName && new Date(w.created_at) >= weekStart)
      .reduce((sum, w) => sum + w.points, 0);
  };

  const getCurrentWeekGoals = () => {
    const now = new Date();
    for (const [weekId, week] of Object.entries(WEEKLY_GOALS)) {
      if (now >= week.start && now < week.end) {
        return { weekId, ...week };
      }
    }
    return null;
  };

  const checkWeeklyGoalsCompleted = (userName) => {
    const currentWeek = getCurrentWeekGoals();
    if (!currentWeek) return { completed: false, progress: [] };

    const userWorkoutsThisWeek = workouts.filter(w => {
      const wDate = new Date(w.created_at);
      return w.user_name === userName && wDate >= currentWeek.start && wDate < currentWeek.end;
    });

    const progress = currentWeek.goals.map(goal => {
      const done = userWorkoutsThisWeek.some(w => w.workout_type === goal.id);
      return { ...goal, done };
    });

    const allCompleted = progress.every(g => g.done);
    return { completed: allCompleted, progress, bonus: currentWeek.bonus };
  };

  const getSeasonPoints = (userName) => {
    const basePoints = workouts
      .filter(w => w.user_name === userName && new Date(w.created_at) >= SEASON_START)
      .reduce((sum, w) => sum + w.points, 0);
    
    const tagBonus = tags.filter(t => t.target_user === userName && t.status === 'defended').length * 1;
    const tagPenalty = tags.filter(t => t.target_user === userName && t.status === 'failed').length * 3;
    const weeklyGoalBonus = checkWeeklyGoalsCompleted(userName).completed ? 3 : 0;

    return basePoints + tagBonus - tagPenalty + weeklyGoalBonus;
  };

  const getTeamPoints = (teamId) => {
    return TEAMS[teamId].members.reduce((sum, m) => sum + getSeasonPoints(m), 0);
  };

  const getLeaderboard = () => {
    const allMembers = [...TEAMS.team_emir.members, ...TEAMS.team_ceyhun.members];
    return allMembers
      .map(name => {
        const tagBonus = tags.filter(t => t.target_user === name && t.status === 'defended').length * 1;
        const tagPenalty = tags.filter(t => t.target_user === name && t.status === 'failed').length * 3;
        const weeklyGoalBonus = checkWeeklyGoalsCompleted(name).completed ? 3 : 0;
        
        return {
          name,
          basePoints: workouts.filter(w => w.user_name === name).reduce((sum, w) => sum + w.points, 0),
          tagBonus,
          tagPenalty,
          weeklyGoalBonus,
          totalPoints: getSeasonPoints(name),
          weeklyPoints: getWeeklyPoints(name),
          team: getUserTeam(name),
          workoutCount: workouts.filter(w => w.user_name === name).length,
          goalsCompleted: checkWeeklyGoalsCompleted(name).completed
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const canBeTagged = (userName) => {
    const pendingTag = tags.find(t => {
      const hours = (new Date() - new Date(t.created_at)) / (1000 * 60 * 60);
      return t.target_user === userName && t.status === 'pending' && hours < 48;
    });
    return !pendingTag;
  };

  const hasTaggedToday = () => {
    if (!currentUser) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tags.some(t => {
      const tagDate = new Date(t.created_at);
      tagDate.setHours(0, 0, 0, 0);
      return t.tagger_user === currentUser.name && tagDate.getTime() === today.getTime();
    });
  };

  const getTaggableOpponents = () => {
    if (!currentUser) return [];
    const oppTeam = TEAMS[getOpponentTeamId(currentUser.name)];
    return oppTeam.members.filter(m => canBeTagged(m));
  };

  const updateTagStatuses = async () => {
    const now = new Date();
    
    for (const tag of tags) {
      if (tag.status !== 'pending') continue;
      
      const hours = (now - new Date(tag.created_at)) / (1000 * 60 * 60);
      if (hours < 48) continue;
      
      const targetWorkouts = workouts.filter(w => {
        const wDate = new Date(w.created_at);
        return w.user_name === tag.target_user && 
               wDate > new Date(tag.created_at) && 
               w.points >= 2;
      });
      
      const newStatus = targetWorkouts.length > 0 ? 'defended' : 'failed';
      await updateTag(tag.id, { status: newStatus, resolved_at: now.toISOString() });
    }
  };

  const checkTagsAfterWorkout = async (userName, points) => {
    if (points < 2) return;
    
    const now = new Date();
    const pendingTags = tags.filter(t => 
      t.status === 'pending' && 
      t.target_user === userName
    );
    
    for (const tag of pendingTags) {
      const hours = (now - new Date(tag.created_at)) / (1000 * 60 * 60);
      if (hours < 48) {
        await updateTag(tag.id, { status: 'defended', resolved_at: now.toISOString() });
      }
    }
  };

  // Antrenman kaydet
  const submitWorkout = async () => {
    if (selectedWorkouts.length === 0 || !currentUser) return;
    setIsLoading(true);
    
    let totalPoints = 0;
    
    for (const workoutId of selectedWorkouts) {
      const workout = WORKOUT_TYPES.find(w => w.id === workoutId);
      const workoutData = {
        id: Date.now() + Math.random(),
        user_name: currentUser.name,
        workout_type: workoutId,
        points: workout.points,
        created_at: new Date().toISOString()
      };
      
      await saveWorkout(workoutData);
      totalPoints += workout.points;
      
      if (workout.points >= 2) {
        await checkTagsAfterWorkout(currentUser.name, workout.points);
      }
    }
    
    setSuccessMessage(`+${totalPoints} PUAN (${selectedWorkouts.length} antrenman)`);
    setShowSuccess(true);
    setShowWorkoutModal(false);
    setIsLoading(false);
    
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedWorkouts([]);
      if (!hasTaggedToday()) {
        setShowTagModal(true);
      }
    }, 1200);
  };

  // Etiketle
  const submitTag = async () => {
    if (!tagTarget || !currentUser) return;
    
    const tagData = {
      id: Date.now(),
      tagger_user: currentUser.name,
      target_user: tagTarget,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    await saveTag(tagData);
    
    setSuccessMessage(`${tagTarget} etiketlendi! ⏰ 48 saat`);
    setShowSuccess(true);
    setShowTagModal(false);
    setTagTarget(null);
    
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const handleLogin = (name) => {
    const user = { name };
    setCurrentUser(user);
    localStorage.setItem('steamhuckUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('steamhuckUser');
  };

  const resetAllData = () => {
    if (confirm('Tüm test verileri silinecek. Emin misin?')) {
      setWorkouts([]);
      setTags([]);
      localStorage.removeItem('steamhuckWorkouts');
      localStorage.removeItem('steamhuckTags');
    }
  };

  const getFeedItems = () => {
    const workoutItems = workouts.map(w => ({
      type: 'workout',
      id: `w_${w.id}`,
      user: w.user_name,
      team: getUserTeam(w.user_name),
      data: w,
      timestamp: new Date(w.created_at)
    }));
    
    const tagItems = tags.map(t => ({
      type: 'tag',
      id: `t_${t.id}`,
      user: t.tagger_user,
      target: t.target_user,
      team: getUserTeam(t.tagger_user),
      data: t,
      timestamp: new Date(t.created_at)
    }));
    
    const resolvedTagItems = tags
      .filter(t => t.status === 'defended' || t.status === 'failed')
      .map(t => ({
        type: 'tag_result',
        id: `tr_${t.id}`,
        user: t.target_user,
        tagger: t.tagger_user,
        team: getUserTeam(t.target_user),
        data: t,
        timestamp: new Date(t.resolved_at || t.created_at)
      }));
    
    return [...workoutItems, ...tagItems, ...resolvedTagItems]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'az önce';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
  };

  const userTeamId = currentUser ? getUserTeam(currentUser.name) : null;
  const isTeamEmir = userTeamId === 'team_emir';

  // Loading
  if (dataLoading && workouts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
          * { font-family: 'Space Grotesk', sans-serif; }
        `}</style>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🥏</div>
          <p className="text-purple-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Giriş Ekranı
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
          * { font-family: 'Space Grotesk', sans-serif; }
        `}</style>
        
        <div className="max-w-md mx-auto pt-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🥏</div>
            <h1 className="text-2xl font-bold text-white">STEAMHUCK</h1>
            <p className="text-purple-400 text-sm">CHALLENGE TRACKER</p>
            
            {isDemo && (
              <div className="mt-3 px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-300 text-xs inline-block">
                ⚠️ Demo Modu
              </div>
            )}
            
            <div className="mt-3 flex justify-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-300 text-xs">
                📅 {getDaysRemaining()} gün kaldı
              </span>
              <button 
                onClick={() => setShowRules(true)}
                className="px-3 py-1 bg-slate-700/50 rounded-full text-slate-300 text-xs hover:bg-slate-600/50"
              >
                📋 Kurallar
              </button>
            </div>
          </div>

          {/* Takım Skorları */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30 text-center">
              <div className="text-2xl mb-1">💚</div>
              <div className="text-emerald-400 font-bold">{TEAMS.team_emir.captain}</div>
              <div className="text-emerald-300 text-2xl font-bold">{getTeamPoints('team_emir')}</div>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30 text-center">
              <div className="text-2xl mb-1">💙</div>
              <div className="text-blue-400 font-bold">{TEAMS.team_ceyhun.captain}</div>
              <div className="text-blue-300 text-2xl font-bold">{getTeamPoints('team_ceyhun')}</div>
            </div>
          </div>

          {/* Takım Seçimi */}
          {Object.entries(TEAMS).map(([teamId, team]) => (
            <div 
              key={teamId} 
              className={`mb-4 rounded-2xl p-4 border ${
                teamId === 'team_emir' 
                  ? 'bg-emerald-500/5 border-emerald-500/20' 
                  : 'bg-blue-500/5 border-blue-500/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{team.emoji}</span>
                <span className="text-white font-bold">{team.name}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {team.members.map(member => (
                  <button
                    key={member}
                    onClick={() => handleLogin(member)}
                    className={`p-2 rounded-lg text-xs transition-all ${
                      member === team.captain
                        ? teamId === 'team_emir'
                          ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/50'
                          : 'bg-blue-600/40 text-blue-200 border border-blue-500/50'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    }`}
                  >
                    {member === team.captain && '👑'}{member}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {isDemo && (
            <button 
              onClick={resetAllData}
              className="w-full mt-4 py-2 text-slate-500 text-sm hover:text-red-400"
            >
              🗑️ Test verilerini sıfırla
            </button>
          )}
        </div>

        {/* Kurallar Modal */}
        {showRules && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-auto p-4">
            <div className="max-w-md mx-auto bg-slate-800 rounded-2xl p-6 my-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">📋 Kurallar</h2>
                <button onClick={() => setShowRules(false)} className="text-slate-400 text-2xl">×</button>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <h3 className="text-purple-400 font-bold mb-2">🏆 Puan Tablosu</h3>
                  <div className="space-y-1 text-slate-300">
                    {WORKOUT_TYPES.map(w => (
                      <div key={w.id} className="flex justify-between">
                        <span>{w.emoji} {w.name}</span>
                        <span className="text-emerald-400">+{w.points}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <h3 className="text-green-400 font-bold mb-2">🎯 Haftalık Hedefler</h3>
                  <p className="text-slate-300 mb-2">Bu haftanın hedeflerini tamamla:</p>
                  <ul className="text-slate-300 space-y-1 mb-2">
                    <li>• 🥏 SH Antrenmanı</li>
                    <li>• 🏃 Koşu 5km+ / Bisiklet 10km+</li>
                    <li>• ⚡ Plyometrics / Sprint</li>
                  </ul>
                  <p className="text-green-400 font-bold">Üçünü de yaparsan: +3 BONUS puan!</p>
                </div>

                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <h3 className="text-red-400 font-bold mb-2">🎯 Etiketleme</h3>
                  <ul className="text-slate-300 space-y-1">
                    <li>• Her antrenman sonrası rakipten birini etiketle</li>
                    <li>• <strong>Günde sadece 1 kişi</strong> etiketleyebilirsin</li>
                    <li>• Etiketlenen 48 saat içinde 2+ puan yapmalı</li>
                    <li>• Yapamazsa: <span className="text-red-400">-3 puan</span></li>
                    <li>• Yaparsa: <span className="text-green-400">+1 puan</span> bonus</li>
                  </ul>
                </div>

                <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                  <h3 className="text-orange-400 font-bold mb-2">⚠️ Haftalık Minimum</h3>
                  <p className="text-slate-300">Haftada minimum 6 puan toplanmalı. Altında kalırsan <span className="text-red-400">-3 puan</span> ceza!</p>
                </div>

                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                  <h3 className="text-purple-400 font-bold mb-2">🏅 2 Hafta Sonunda</h3>
                  <ul className="text-slate-300 space-y-1">
                    <li>• Kazanan takımın en çok puanlı oyuncusuna ödül</li>
                    <li>• Sonraki kaptanlar: En çok puan alan 2 kişi</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Ana Uygulama
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { font-family: 'Space Grotesk', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* Header */}
      <header className={`bg-slate-800/80 backdrop-blur-xl border-b sticky top-0 z-40 ${
        isTeamEmir ? 'border-emerald-500/30' : 'border-blue-500/30'
      }`}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={handleLogout} className="flex items-center gap-2">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                isTeamEmir ? 'bg-emerald-600' : 'bg-blue-600'
              }`}>
                {currentUser.name.charAt(0)}
              </span>
              <div className="text-left">
                <div className="text-white font-medium text-sm">{currentUser.name}</div>
                <div className="text-slate-400 text-xs">{TEAMS[userTeamId].name}</div>
              </div>
            </button>
            <div className="text-right">
              <div className={`mono text-xl font-bold ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>
                {getSeasonPoints(currentUser.name)}
              </div>
              <div className="text-slate-400 text-xs">Bu hafta: {getWeeklyPoints(currentUser.name)}/6</div>
            </div>
          </div>
          
          {getWeeklyPoints(currentUser.name) < 6 && (
            <div className="mt-2 px-3 py-1.5 bg-orange-500/20 rounded-lg border border-orange-500/30">
              <p className="text-orange-400 text-xs">
                ⚠️ Minimum 6 puan için {6 - getWeeklyPoints(currentUser.name)} puan daha lazım!
              </p>
            </div>
          )}
          
          {getCurrentWeekGoals() && (
            <div className={`mt-2 px-3 py-2 rounded-lg border ${
              checkWeeklyGoalsCompleted(currentUser.name).completed 
                ? 'bg-green-500/20 border-green-500/30' 
                : 'bg-purple-500/20 border-purple-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">🎯 Haftalık Hedefler</span>
                {checkWeeklyGoalsCompleted(currentUser.name).completed && (
                  <span className="text-green-400 text-xs font-bold">+3 BONUS ✓</span>
                )}
              </div>
              <div className="flex gap-2 mt-1">
                {checkWeeklyGoalsCompleted(currentUser.name).progress.map(goal => (
                  <span 
                    key={goal.id}
                    className={`text-lg ${goal.done ? 'opacity-100' : 'opacity-30'}`}
                    title={goal.name}
                  >
                    {goal.done ? '✅' : goal.emoji}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className={`bg-slate-800 rounded-3xl p-8 text-center border ${
            isTeamEmir ? 'border-emerald-500/50' : 'border-blue-500/50'
          }`}>
            <div className="text-5xl mb-3">✅</div>
            <div className={`text-2xl font-bold ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>
              {successMessage}
            </div>
          </div>
        </div>
      )}

      {/* Workout Modal */}
      {showWorkoutModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-sm max-h-[80vh] overflow-auto border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">💪 Antrenman Kaydet</h2>
              <button onClick={() => { setShowWorkoutModal(false); setSelectedWorkouts([]); }} className="text-slate-400 text-2xl">×</button>
            </div>
            
            <p className="text-slate-400 text-sm mb-3">Birden fazla seçebilirsin:</p>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {WORKOUT_TYPES.map(w => {
                const isSelected = selectedWorkouts.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedWorkouts(selectedWorkouts.filter(id => id !== w.id));
                      } else {
                        setSelectedWorkouts([...selectedWorkouts, w.id]);
                      }
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? isTeamEmir ? 'bg-emerald-600/30 border-emerald-500' : 'bg-blue-600/30 border-blue-500'
                        : 'bg-slate-700/50 border-slate-600 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{w.emoji}</span>
                      <span className={`text-sm font-bold ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>+{w.points}</span>
                      {isSelected && <span className="ml-auto">✓</span>}
                    </div>
                    <div className="text-white text-xs mt-1">{w.name}</div>
                  </button>
                );
              })}
            </div>

            {selectedWorkouts.length > 0 && (
              <div className="mb-4 p-3 bg-slate-700/50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">{selectedWorkouts.length} antrenman seçildi</span>
                  <span className={`font-bold ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>
                    +{selectedWorkouts.reduce((sum, id) => sum + WORKOUT_TYPES.find(w => w.id === id).points, 0)} puan
                  </span>
                </div>
              </div>
            )}

            {selectedWorkouts.length > 0 && (
              <button
                onClick={submitWorkout}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl text-white font-bold ${
                  isTeamEmir ? 'bg-emerald-600' : 'bg-blue-600'
                } disabled:opacity-50`}
              >
                {isLoading ? '⏳ Kaydediliyor...' : '✓ KAYDET'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-sm border border-red-500/30">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🎯</div>
              <h2 className="text-lg font-bold text-white">Rakip Etiketle!</h2>
              <p className="text-slate-400 text-sm">48 saat içinde 2+ puan yapmazsa -3!</p>
              <p className="text-orange-400 text-xs mt-1">⚠️ Günde sadece 1 kişi etiketleyebilirsin</p>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {getTaggableOpponents().length > 0 ? (
                getTaggableOpponents().map(opp => (
                  <button
                    key={opp}
                    onClick={() => setTagTarget(tagTarget === opp ? null : opp)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex justify-between items-center ${
                      tagTarget === opp
                        ? 'bg-red-600/30 border-2 border-red-500'
                        : 'bg-slate-700/50 border border-slate-600 hover:border-red-500/50'
                    }`}
                  >
                    <span className="text-white">{opp}</span>
                    <span className="text-slate-400 text-sm">{getSeasonPoints(opp)} puan</span>
                  </button>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4 text-sm">
                  Etiketlenebilir rakip yok
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowTagModal(false); setTagTarget(null); }}
                className="flex-1 py-3 bg-slate-700 rounded-xl text-slate-300"
              >
                Atla
              </button>
              {tagTarget && (
                <button onClick={submitTag} className="flex-1 py-3 bg-red-600 rounded-xl text-white font-bold">
                  Etiketle!
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="max-w-lg mx-auto px-4 py-5 pb-24">
        
        {/* FEED */}
        {view === 'feed' && (
          <div className="space-y-4">
            {/* Takım Durumu */}
            <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-lg">💚</div>
                  <div className="text-emerald-400 font-bold mono text-lg">{getTeamPoints('team_emir')}</div>
                </div>
                <div className="text-slate-500 text-sm">vs</div>
                <div className="text-center">
                  <div className="text-lg">💙</div>
                  <div className="text-blue-400 font-bold mono text-lg">{getTeamPoints('team_ceyhun')}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-xs">Kalan</div>
                <div className="text-purple-400 font-bold">{getDaysRemaining()} gün</div>
              </div>
            </div>

            {/* Etiketlendin Banner */}
            {tags.filter(t => t.status === 'pending' && t.target_user === currentUser.name).length > 0 && (
              <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">⚠️</span>
                  <span className="text-red-400 font-bold">Etiketlendin!</span>
                </div>
                {tags.filter(t => t.status === 'pending' && t.target_user === currentUser.name).map(tag => {
                  const hours = Math.max(0, 48 - ((new Date() - new Date(tag.created_at)) / (1000 * 60 * 60)));
                  return (
                    <p key={tag.id} className="text-red-300 text-sm">
                      {tag.tagger_user} tarafından • <span className="font-bold">{Math.floor(hours)} saat</span> kaldı
                    </p>
                  );
                })}
              </div>
            )}

            {/* Haftalık Hedefler */}
            {getCurrentWeekGoals() && (
              <div className={`rounded-xl p-4 border ${
                checkWeeklyGoalsCompleted(currentUser.name).completed 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-purple-500/10 border-purple-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <span className="text-white font-bold">Haftalık Hedefler</span>
                  </div>
                  {checkWeeklyGoalsCompleted(currentUser.name).completed ? (
                    <span className="text-green-400 text-sm font-bold px-2 py-1 bg-green-500/20 rounded-full">+3 BONUS ✓</span>
                  ) : (
                    <span className="text-purple-400 text-sm">Tamamla → +3</span>
                  )}
                </div>
                <div className="space-y-2">
                  {checkWeeklyGoalsCompleted(currentUser.name).progress.map(goal => (
                    <div 
                      key={goal.id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        goal.done ? 'bg-green-500/20' : 'bg-slate-700/30'
                      }`}
                    >
                      <span className="text-xl">{goal.done ? '✅' : goal.emoji}</span>
                      <span className={`flex-1 text-sm ${goal.done ? 'text-green-300' : 'text-slate-300'}`}>
                        {goal.name}
                      </span>
                      {goal.done && <span className="text-green-400 text-xs">Tamamlandı</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <span>📡</span> Canlı Akış
                </h2>
                <button 
                  onClick={loadData}
                  className="text-purple-400 text-xs hover:text-purple-300"
                >
                  🔄 Yenile
                </button>
              </div>
              
              {getFeedItems().length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🏋️</div>
                  <p className="text-slate-400">Henüz aktivite yok</p>
                  <p className="text-slate-500 text-sm mt-1">İlk antrenmanı sen kaydet!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getFeedItems().map(item => {
                    const isEmirTeam = item.team === 'team_emir';
                    
                    if (item.type === 'workout') {
                      const workout = WORKOUT_TYPES.find(w => w.id === item.data.workout_type);
                      return (
                        <div key={item.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                              isEmirTeam ? 'bg-emerald-600/30' : 'bg-blue-600/30'
                            }`}>
                              {workout?.emoji}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isEmirTeam ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                                <span className="text-white font-medium">{item.user}</span>
                                <span className="text-slate-500 text-xs">{getTimeAgo(item.timestamp)}</span>
                              </div>
                              <p className="text-slate-300 text-sm mt-1">{workout?.name} yaptı</p>
                            </div>
                            <div className={`mono font-bold px-2 py-1 rounded-lg text-sm ${
                              isEmirTeam ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              +{item.data.points}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (item.type === 'tag') {
                      return (
                        <div key={item.id} className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-lg">🎯</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{item.user}</span>
                                <span className="text-orange-400">→</span>
                                <span className="text-white font-medium">{item.target}</span>
                              </div>
                              <p className="text-orange-300 text-sm">
                                {item.data.status === 'pending' ? '⏳ 48 saat başladı!' : 
                                 item.data.status === 'defended' ? '✅ Savunuldu' : '❌ Başarısız'}
                              </p>
                            </div>
                            <span className="text-slate-500 text-xs">{getTimeAgo(item.timestamp)}</span>
                          </div>
                        </div>
                      );
                    }
                    
                    if (item.type === 'tag_result') {
                      const isDefended = item.data.status === 'defended';
                      return (
                        <div key={item.id} className={`rounded-xl p-4 border ${
                          isDefended ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                              isDefended ? 'bg-green-500/20' : 'bg-red-500/20'
                            }`}>
                              {isDefended ? '🛡️' : '💥'}
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium ${isDefended ? 'text-green-300' : 'text-red-300'}`}>
                                {item.user} {isDefended ? 'etiketi savundu!' : 'etikette kaybetti!'}
                              </p>
                              <p className="text-slate-400 text-sm">{item.tagger} tarafından etiketlenmişti</p>
                            </div>
                            <span className={`mono font-bold ${isDefended ? 'text-green-400' : 'text-red-400'}`}>
                              {isDefended ? '+1' : '-3'}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {view === 'leaderboard' && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white text-center mb-4">🏆 Bireysel Sıralama</h2>
            
            {getLeaderboard().map((p, i) => {
              const isEmirTeam = p.team === 'team_emir';
              const hasBonusOrPenalty = p.tagBonus > 0 || p.tagPenalty > 0 || p.weeklyGoalBonus > 0;
              
              return (
                <div key={p.name} className={`p-3 rounded-xl ${
                  i === 0 ? 'bg-yellow-600/20 border border-yellow-500/50' :
                  i === 1 ? 'bg-slate-500/20 border border-slate-400/30' :
                  i === 2 ? 'bg-orange-600/20 border border-orange-500/30' :
                  'bg-slate-800/50 border border-slate-700/30'
                } ${p.name === currentUser.name ? 'ring-2 ring-purple-500' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-yellow-500 text-black' :
                      i === 1 ? 'bg-slate-400 text-black' :
                      i === 2 ? 'bg-orange-500 text-white' :
                      'bg-slate-700 text-white'
                    }`}>
                      {i < 3 ? ['🥇','🥈','🥉'][i] : i+1}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isEmirTeam ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{p.name}</span>
                        {p.name === currentUser.name && <span className="text-purple-400 text-xs">(sen)</span>}
                        {p.goalsCompleted && <span className="text-green-400 text-xs">🎯</span>}
                      </div>
                      <div className="text-slate-500 text-xs">{p.workoutCount} antrenman</div>
                    </div>
                    <div className="text-right">
                      <div className={`mono font-bold text-lg ${isEmirTeam ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {p.totalPoints}
                      </div>
                    </div>
                  </div>
                  
                  {hasBonusOrPenalty && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-slate-700/50 flex-wrap">
                      {p.weeklyGoalBonus > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">🎯 +{p.weeklyGoalBonus}</span>
                      )}
                      {p.tagBonus > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">🛡️ +{p.tagBonus}</span>
                      )}
                      {p.tagPenalty > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">💥 -{p.tagPenalty}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            <div className="mt-4 p-3 bg-slate-800/30 rounded-xl text-xs text-slate-400">
              <div className="flex flex-wrap gap-3">
                <span>🎯 Haftalık hedef +3</span>
                <span>🛡️ Etiket savunma +1</span>
                <span>💥 Etiket kaybı -3</span>
              </div>
            </div>
          </div>
        )}

        {/* TEAMS */}
        {view === 'teams' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white text-center">⚔️ Takım Savaşı</h2>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-3xl mb-2">💚</div>
                  <div className="text-emerald-400 font-bold">{TEAMS.team_emir.captain}</div>
                  <div className="text-emerald-300 text-3xl font-bold mono mt-1">{getTeamPoints('team_emir')}</div>
                </div>
                <div className="text-3xl text-purple-400">VS</div>
                <div className="text-center">
                  <div className="text-3xl mb-2">💙</div>
                  <div className="text-blue-400 font-bold">{TEAMS.team_ceyhun.captain}</div>
                  <div className="text-blue-300 text-3xl font-bold mono mt-1">{getTeamPoints('team_ceyhun')}</div>
                </div>
              </div>
              
              <div className="mt-5 h-3 bg-slate-700 rounded-full overflow-hidden flex">
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                  style={{ width: `${(getTeamPoints('team_emir') / (getTeamPoints('team_emir') + getTeamPoints('team_ceyhun') || 1)) * 100}%` }}
                />
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                  style={{ width: `${(getTeamPoints('team_ceyhun') / (getTeamPoints('team_emir') + getTeamPoints('team_ceyhun') || 1)) * 100}%` }}
                />
              </div>
              
              <div className="mt-3 text-center text-slate-400 text-sm">
                {getDaysRemaining()} gün kaldı
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold mb-3">🎯 Tüm Etiketler</h3>
              {tags.length === 0 ? (
                <p className="text-slate-500 text-center py-4">Henüz etiketleme yok</p>
              ) : (
                <div className="space-y-2">
                  {tags.map(tag => (
                    <div key={tag.id} className={`p-3 rounded-xl flex items-center justify-between ${
                      tag.status === 'pending' ? 'bg-orange-500/10 border border-orange-500/30' :
                      tag.status === 'defended' ? 'bg-green-500/10 border border-green-500/30' :
                      'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <div className="text-sm">
                        <span className="text-white">{tag.tagger_user}</span>
                        <span className="text-slate-400"> → </span>
                        <span className="text-white">{tag.target_user}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tag.status === 'pending' ? 'bg-orange-500/20 text-orange-300' :
                        tag.status === 'defended' ? 'bg-green-500/20 text-green-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {tag.status === 'pending' ? '⏳ Bekliyor' : 
                         tag.status === 'defended' ? '✅ Savundu (+1)' : '❌ Kaybetti (-3)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {view === 'history' && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white text-center mb-4">📋 Antrenmanlarım</h2>
            
            {workouts.filter(w => w.user_name === currentUser.name).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🏋️</div>
                <p className="text-slate-400">Henüz antrenman yok</p>
              </div>
            ) : (
              workouts
                .filter(w => w.user_name === currentUser.name)
                .map(w => {
                  const type = WORKOUT_TYPES.find(t => t.id === w.workout_type);
                  return (
                    <div key={w.id} className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-slate-700/50">
                      <span className="text-2xl">{type?.emoji}</span>
                      <div className="flex-1">
                        <div className="text-white text-sm">{type?.name}</div>
                        <div className="text-slate-500 text-xs">
                          {new Date(w.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className={`mono font-bold px-2 py-1 rounded-lg text-sm ${
                        isTeamEmir ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>+{w.points}</span>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowWorkoutModal(true)}
        className={`fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-30 ${
          isTeamEmir 
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
            : 'bg-gradient-to-br from-blue-500 to-blue-600'
        }`}
      >
        ➕
      </button>

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-xl border-t border-purple-500/20">
        <div className="max-w-lg mx-auto flex">
          {[
            { id: 'feed', icon: '🏠', label: 'Anasayfa' },
            { id: 'leaderboard', icon: '🏆', label: 'Sıralama' },
            { id: 'teams', icon: '⚔️', label: 'Takımlar' },
            { id: 'history', icon: '📋', label: 'Geçmiş' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center ${
                view === tab.id ? 'text-purple-400' : 'text-slate-500'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
