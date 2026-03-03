import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const isDemo = !supabase;

// Puan Tablosu
const WORKOUT_TYPES = [
  { id: 'sh_training', name: 'SH Antrenmanı', emoji: '🥏', points: 4 },
  { id: 'tournament', name: 'Turnuvaya Katılım', emoji: '🏆', points: 3 },
  { id: 'other_frisbee', name: 'Farklı Takım Frizbi', emoji: '🥏', points: 2 },
  { id: 'upper_body', name: 'Üst Vücut', emoji: '💪', points: 2 },
  { id: 'ultimate_lower', name: 'Alt Vücut/Core/HIIT', emoji: '🔥', points: 3 },
  { id: 'explosive', name: 'Koşu 5km+ / Bisiklet 10km+', emoji: '🏃', points: 3 },
  { id: 'plyometrics', name: 'Plyometrics / Sprint', emoji: '⚡', points: 3 },
  { id: 'other_sport', name: 'Farklı Spor Dalı', emoji: '🎾', points: 2 },
  { id: 'mobility', name: 'Yoga / Pilates / Mobility', emoji: '🧘', points: 1 },
  { id: 'match_watch', name: 'Maç İzleme', emoji: '📺', points: 1, weeklyLimit: 2 },
  { id: 'disc_throwing', name: 'Disk Atma', emoji: '🎯', points: 2 },
];

// Takımlar (varsayılan)
const DEFAULT_TEAMS = {
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

// Seviye Sistemi
const LEVELS = [
  { name: 'Çaylak', minPoints: 0, emoji: '🌱', color: 'slate' },
  { name: 'Başlangıç', minPoints: 10, emoji: '🌿', color: 'green' },
  { name: 'Orta', minPoints: 25, emoji: '🌳', color: 'emerald' },
  { name: 'İyi', minPoints: 50, emoji: '⭐', color: 'yellow' },
  { name: 'Pro', minPoints: 75, emoji: '🌟', color: 'orange' },
  { name: 'Efsane', minPoints: 100, emoji: '👑', color: 'purple' },
];

// Rozetler
const BADGES = [
  { id: 'first_workout', name: 'İlk Adım', desc: 'İlk antrenmanını yaptın!', emoji: '🎯', check: (w) => w.length >= 1 },
  { id: 'streak_3', name: '3 Gün Streak', desc: '3 gün üst üste antrenman', emoji: '🔥', check: (w, streakDays) => streakDays >= 3 },
  { id: 'streak_7', name: '7 Gün Streak', desc: '7 gün üst üste antrenman', emoji: '🔥🔥', check: (w, streakDays) => streakDays >= 7 },
  { id: 'week_10', name: 'Haftalık Kahraman', desc: 'Haftada 10+ puan', emoji: '💪', check: (w, s, weeklyPts) => weeklyPts >= 10 },
  { id: 'week_15', name: 'Haftalık Efsane', desc: 'Haftada 15+ puan', emoji: '🏆', check: (w, s, weeklyPts) => weeklyPts >= 15 },
  { id: 'goals_complete', name: 'Hedef Avcısı', desc: 'Tüm haftalık hedefleri tamamla', emoji: '🎯', check: (w, s, wp, goalsOk) => goalsOk },
  { id: 'defender', name: 'Savunma Ustası', desc: 'Bir etiketi savun', emoji: '🛡️', check: (w, s, wp, g, defends) => defends >= 1 },
  { id: 'tagger', name: 'Etiket Avcısı', desc: '3 başarılı etiketleme', emoji: '🎯', check: (w, s, wp, g, d, tags) => tags >= 3 },
];

// Emoji Tepkileri
const REACTIONS = ['🔥', '💪', '👏', '⚡', '🎉'];

// Motivasyon Mesajları
const MOTIVATION_MESSAGES = [
  "Harika gidiyorsun! 💪",
  "Takım seninle gurur duyuyor! 🏆",
  "Bugün de form tutuyorsun! 🔥",
  "Efsane performans! ⭐",
  "Durdurulamıyorsun! ⚡",
  "Devam et şampiyon! 👑",
];

const DEFAULT_SEASON_START = '2026-02-16T00:00:00';
const SEASON_DURATION_DAYS = 14;
const APP_SETTINGS_ID = 'global';

// Varsayılan Haftalık Hedefler
const DEFAULT_WEEKLY_GOALS = {
  week1: {
    start: new Date('2026-02-16T00:00:00'),
    end: new Date('2026-02-23T00:00:00'),
    goals: [
      { id: 'sh_training', name: 'SH Antrenmanı', emoji: '🥏' },
      { id: 'explosive', name: 'Koşu 5km+ / Bisiklet 10km+', emoji: '🏃' },
      { id: 'plyometrics', name: 'Plyometrics / Sprint', emoji: '⚡' },
    ]
  },
  week2: {
    start: new Date('2026-02-23T00:00:00'),
    end: new Date('2026-03-02T00:00:00'),
    goals: [] // Kaptan belirleyecek
  }
};

export default function SteamhuckTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('feed');
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('steamhuckTeams');
    return saved ? JSON.parse(saved) : DEFAULT_TEAMS;
  });
  const [seasonStart, setSeasonStart] = useState(() => {
    const saved = localStorage.getItem('steamhuckSeasonStart');
    return saved || DEFAULT_SEASON_START;
  });
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [newSeasonDate, setNewSeasonDate] = useState('');
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingTeamName, setEditingTeamName] = useState({ team_emir: false, team_ceyhun: false });
  const [teamNameInput, setTeamNameInput] = useState({ team_emir: '', team_ceyhun: '' });
  const [editingTeam, setEditingTeam] = useState('team_emir');
  const [workouts, setWorkouts] = useState([]);
  const [tags, setTags] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [weeklyGoals, setWeeklyGoals] = useState(DEFAULT_WEEKLY_GOALS);
  const [selectedWorkouts, setSelectedWorkouts] = useState([]);
  const [tagTarget, setTagTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showCaptainPanel, setShowCaptainPanel] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [dataLoading, setDataLoading] = useState(true);
  const [newGoals, setNewGoals] = useState([]);
  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Sayaç için her dakika güncelle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Her dakika
    return () => clearInterval(timer);
  }, []);

  // Veri yükleme
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDemo) loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Hafta bitince ceza kontrolü - sadece veri ilk yüklenince çalış
  useEffect(() => {
    if (workouts.length > 0 && !dataLoading) applyWeeklyPenalties(workouts, teams);
  }, [dataLoading]);

  // 48 saat geçen etiketleri kontrol et
  useEffect(() => {
    if (tags.length === 0) return;
    
    const checkExpiredTags = async () => {
      const now = new Date();
      let hasChanges = false;
      
      const updatedTags = tags.map(tag => {
        if (tag.status !== 'pending') return tag;
        
        const tagTime = new Date(tag.created_at);
        const hoursPassed = (now - tagTime) / (1000 * 60 * 60);
        
        // 48 saat geçtiyse
        if (hoursPassed >= 48) {
          hasChanges = true;
          return { ...tag, status: 'failed', resolved_at: now.toISOString() };
        }
        return tag;
      });
      
      if (hasChanges) {
        setTags(updatedTags);
        
        if (isDemo) {
          localStorage.setItem('steamhuckTags', JSON.stringify(updatedTags));
        } else {
          // Supabase'de expired etiketleri güncelle
          const expiredTags = updatedTags.filter(t => t.status === 'failed' && !tags.find(ot => ot.id === t.id && ot.status === 'failed'));
          for (const tag of expiredTags) {
            await supabase.from('tags').update({ 
              status: 'failed', 
              resolved_at: now.toISOString() 
            }).eq('id', tag.id);
          }
        }
      }
    };
    
    // Sayfa yüklendiğinde kontrol et
    checkExpiredTags();
    
    // Her dakika kontrol et
    const interval = setInterval(checkExpiredTags, 60000);
    return () => clearInterval(interval);
  }, [tags]);

  const loadData = async () => {
    setDataLoading(true);
    
    if (isDemo) {
      const savedWorkouts = localStorage.getItem('steamhuckWorkouts');
      const savedTags = localStorage.getItem('steamhuckTags');
      const savedReactions = localStorage.getItem('steamhuckReactions');
      const savedMessages = localStorage.getItem('steamhuckMessages');
      const savedGoals = localStorage.getItem('steamhuckWeeklyGoals');
      
      if (savedWorkouts) setWorkouts(JSON.parse(savedWorkouts));
      if (savedTags) setTags(JSON.parse(savedTags));
      if (savedReactions) setReactions(JSON.parse(savedReactions));
      if (savedMessages) setMessages(JSON.parse(savedMessages));
      if (savedGoals) setWeeklyGoals(JSON.parse(savedGoals));
    } else {
      // Ortak uygulama ayarları (takımlar + sezon başlangıcı)
      try {
        const settingsRes = await supabase
          .from('app_settings')
          .select('teams_json, season_start')
          .eq('id', APP_SETTINGS_ID)
          .maybeSingle();

        if (settingsRes.data) {
          const dbTeams = settingsRes.data.teams_json;
          const hasValidTeams = dbTeams?.team_emir?.members && dbTeams?.team_ceyhun?.members;

          if (hasValidTeams) {
            setTeams(dbTeams);
          } else {
            await supabase.from('app_settings').upsert({
              id: APP_SETTINGS_ID,
              teams_json: DEFAULT_TEAMS,
              season_start: settingsRes.data.season_start || DEFAULT_SEASON_START
            });
            setTeams(DEFAULT_TEAMS);
          }

          if (settingsRes.data.season_start) setSeasonStart(settingsRes.data.season_start);
        } else {
          // İlk kurulumda varsayılan ayarları oluştur
          await supabase.from('app_settings').upsert({
            id: APP_SETTINGS_ID,
            teams_json: DEFAULT_TEAMS,
            season_start: DEFAULT_SEASON_START
          });
          setTeams(DEFAULT_TEAMS);
          setSeasonStart(DEFAULT_SEASON_START);
        }
      } catch (err) {
        console.error('App settings yükleme hatası:', err);
      }

      // Her tabloyu ayrı ayrı çek - biri hata verse diğerleri çalışsın
      try {
        const workoutsRes = await supabase.from('workouts').select('*').order('created_at', { ascending: false });
        if (workoutsRes.data) setWorkouts(workoutsRes.data);
        if (workoutsRes.error) console.error('Workouts hatası:', workoutsRes.error);
      } catch (err) {
        console.error('Workouts yükleme hatası:', err);
      }

      try {
        const tagsRes = await supabase.from('tags').select('*').order('created_at', { ascending: false });
        if (tagsRes.data) setTags(tagsRes.data);
        if (tagsRes.error) console.error('Tags hatası:', tagsRes.error);
      } catch (err) {
        console.error('Tags yükleme hatası:', err);
      }

      try {
        const reactionsRes = await supabase.from('reactions').select('*');
        if (reactionsRes.data) setReactions(reactionsRes.data);
      } catch (err) {
        console.error('Reactions yükleme hatası:', err);
      }

      try {
        const messagesRes = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(50);
        if (messagesRes.data) setMessages(messagesRes.data);
      } catch (err) {
        console.error('Messages yükleme hatası:', err);
      }

      try {
        const goalsRes = await supabase.from('weekly_goals').select('*');
        if (goalsRes.data && goalsRes.data.length > 0) {
          setWeeklyGoals(JSON.parse(goalsRes.data[0].goals_json));
        }
      } catch (err) {
        console.error('Weekly goals yükleme hatası:', err);
      }
    }
    
    setDataLoading(false);
  };

  // Kaydetme fonksiyonları
  const saveWorkout = async (workoutData) => {
    if (isDemo) {
      const newWorkouts = [workoutData, ...workouts];
      setWorkouts(newWorkouts);
      localStorage.setItem('steamhuckWorkouts', JSON.stringify(newWorkouts));
      return true;
    } else {
      const { error } = await supabase.from('workouts').insert(workoutData);
      if (!error) { await loadData(); return true; }
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
      const { id, ...supabaseData } = tagData;
      const { error } = await supabase.from('tags').insert(supabaseData);
      if (error) console.error('Tag kayıt hatası:', error);
      if (!error) { await loadData(); return true; }
      return false;
    }
  };

  const saveReaction = async (workoutId, emoji) => {
    const reactionData = {
      id: Math.floor(Date.now() * 1000 + Math.random() * 1000),
      workout_id: workoutId,
      user_name: currentUser.name,
      emoji,
      created_at: new Date().toISOString()
    };
    
    if (isDemo) {
      const newReactions = [...reactions, reactionData];
      setReactions(newReactions);
      localStorage.setItem('steamhuckReactions', JSON.stringify(newReactions));
    } else {
      const { id: _rid, ...supabaseReaction } = reactionData;
      await supabase.from('reactions').insert(supabaseReaction);
      await loadData();
    }
  };

  const saveMessage = async () => {
    if (!newMessage.trim()) return;
    
    const messageData = {
      id: Math.floor(Date.now() * 1000 + Math.random() * 1000),
      user_name: currentUser.name,
      text: newMessage.trim(),
      created_at: new Date().toISOString()
    };
    
    if (isDemo) {
      const newMessages = [messageData, ...messages];
      setMessages(newMessages);
      localStorage.setItem('steamhuckMessages', JSON.stringify(newMessages));
    } else {
      const { id: _mid, ...supabaseMessage } = messageData;
      await supabase.from('messages').insert(supabaseMessage);
      await loadData();
    }
    
    setNewMessage('');
    setShowMessageModal(false);
  };

  const saveWeeklyGoals = async (goals) => {
    const weekKey = `week${getCurrentWeekNumber()}`;
    const updatedGoals = { ...weeklyGoals, [weekKey]: { ...weeklyGoals[weekKey], goals } };
    setWeeklyGoals(updatedGoals);
    
    if (isDemo) {
      localStorage.setItem('steamhuckWeeklyGoals', JSON.stringify(updatedGoals));
    } else {
      await supabase.from('weekly_goals').upsert({ id: 1, goals_json: JSON.stringify(updatedGoals) });
    }
  };

  // Yardımcı fonksiyonlar
  const getUserTeam = (userName) => {
    if (teams.team_emir.members.includes(userName)) return 'team_emir';
    if (teams.team_ceyhun.members.includes(userName)) return 'team_ceyhun';
    return null;
  };

  const getOpponentTeamId = (userName) => {
    return getUserTeam(userName) === 'team_emir' ? 'team_ceyhun' : 'team_emir';
  };

  const isCaptain = (userName) => {
    return teams.team_emir.captain === userName || teams.team_ceyhun.captain === userName;
  };

  const saveTeams = async (newTeams) => {
    setTeams(newTeams);
    localStorage.setItem('steamhuckTeams', JSON.stringify(newTeams));

    if (!isDemo) {
      const { error } = await supabase.from('app_settings').upsert({
        id: APP_SETTINGS_ID,
        teams_json: newTeams,
        season_start: seasonStart
      });
      if (error) console.error('Takım ayarları kayıt hatası:', error);
    }
  };

  const saveSeasonStart = async (newStart) => {
    setSeasonStart(newStart);
    localStorage.setItem('steamhuckSeasonStart', newStart);

    if (!isDemo) {
      const { error } = await supabase.from('app_settings').upsert({
        id: APP_SETTINGS_ID,
        teams_json: teams,
        season_start: newStart
      });
      if (error) console.error('Sezon ayarı kayıt hatası:', error);
    }
  };

  const startNewSeason = async (startDate) => {
    const newStart = new Date(startDate).toISOString();
    await saveSeasonStart(newStart);
    // Tüm verileri sıfırla
    setWorkouts([]);
    setTags([]);
    setReactions([]);
    setMessages([]);
    setWeeklyGoals({
      week1: {
        start: new Date(startDate),
        end: new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000),
        goals: []
      },
      week2: {
        start: new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000),
        end: new Date(new Date(startDate).getTime() + 14 * 24 * 60 * 60 * 1000),
        goals: []
      }
    });
    ['steamhuckWorkouts','steamhuckTags','steamhuckReactions','steamhuckMessages',
     'steamhuckWeeklyGoals','steamhuckWeekPenalties','steamhuckLastPenaltyCheck'].forEach(k => localStorage.removeItem(k));
    setShowSeasonModal(false);
    setSuccessMessage('🏆 Yeni sezon başladı!');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleTeamReset = (newTeams) => {
    saveTeams(newTeams);
    setWorkouts([]);
    setTags([]);
    setReactions([]);
    setMessages([]);
    ['steamhuckWorkouts', 'steamhuckTags', 'steamhuckReactions', 'steamhuckMessages', 'steamhuckWeeklyGoals', 'steamhuckWeekPenalties', 'steamhuckLastPenaltyCheck'].forEach(k => localStorage.removeItem(k));
    setSuccessMessage('Takım güncellendi!');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const moveMember = (member, fromTeam, toTeam) => {
    const newTeams = {
      ...teams,
      [fromTeam]: { ...teams[fromTeam], members: teams[fromTeam].members.filter(m => m !== member) },
      [toTeam]: { ...teams[toTeam], members: [...teams[toTeam].members, member] }
    };
    handleTeamReset(newTeams);
  };

  const removeMember = (member, teamId) => {
    const newTeams = {
      ...teams,
      [teamId]: { ...teams[teamId], members: teams[teamId].members.filter(m => m !== member) }
    };
    handleTeamReset(newTeams);
  };

  const addMember = (teamId) => {
    if (!newMemberName.trim()) return;
    const name = newMemberName.trim();
    if (teams.team_emir.members.includes(name) || teams.team_ceyhun.members.includes(name)) {
      alert('Bu isim zaten mevcut!');
      return;
    }
    const newTeams = {
      ...teams,
      [teamId]: { ...teams[teamId], members: [...teams[teamId].members, name] }
    };
    handleTeamReset(newTeams);
    setNewMemberName('');
  };

  const changeTeamName = (teamId, newName) => {
    if (!newName.trim()) return;
    const newTeams = { ...teams, [teamId]: { ...teams[teamId], name: newName.trim() } };
    saveTeams(newTeams);
    setEditingTeamName(prev => ({ ...prev, [teamId]: false }));
  };

  const changeCaptain = (teamId, newCaptain) => {
    const newTeams = { ...teams, [teamId]: { ...teams[teamId], captain: newCaptain, name: `${newCaptain}'in Takımı` } };
    handleTeamReset(newTeams);
  };

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now); // orijinali mutate etme
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getWeeklyWorkoutCount = (workoutTypeId) => {
    if (!currentUser) return 0;
    const weekStart = getWeekStart();
    return workouts.filter(w =>
      w.user_name === currentUser.name &&
      w.workout_type === workoutTypeId &&
      new Date(w.created_at) >= weekStart
    ).length;
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const end = new Date(seasonStart);
    end.setDate(end.getDate() + SEASON_DURATION_DAYS);
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  };

  const getWeeklyPoints = (userName) => {
    const weekStart = getWeekStart();
    return workouts
      .filter(w => w.user_name === userName && new Date(w.created_at) >= weekStart)
      .reduce((sum, w) => sum + w.points, 0);
  };


  const getCurrentWeekNumber = () => {
    const now = new Date();
    const week2Start = weeklyGoals.week2?.start ? new Date(weeklyGoals.week2.start) : null;
    if (week2Start && now >= week2Start) return 2;
    return 1;
  };

  const getCurrentWeekGoals = () => {
    const weekNum = getCurrentWeekNumber();
    const week = weeklyGoals[`week${weekNum}`];
    if (!week || !week.goals || week.goals.length === 0) return null;
    return week;
  };

  const checkWeeklyGoalsCompleted = (userName) => {
    const currentWeek = getCurrentWeekGoals();
    if (!currentWeek) return { completed: false, progress: [] };

    const userWorkoutsThisWeek = workouts.filter(w => {
      const wDate = new Date(w.created_at);
      return w.user_name === userName && wDate >= new Date(currentWeek.start) && wDate < new Date(currentWeek.end);
    });

    const progress = currentWeek.goals.map(goal => ({
      ...goal,
      done: userWorkoutsThisWeek.some(w => w.workout_type === goal.id)
    }));

    return { completed: progress.every(g => g.done), progress };
  };

  const checkWeekGoalsCompleted = (userName, weekKey) => {
    const week = weeklyGoals[weekKey];
    if (!week || !week.goals || week.goals.length === 0) return false;

    const userWorkoutsThisWeek = workouts.filter(w => {
      const wDate = new Date(w.created_at);
      return w.user_name === userName && wDate >= new Date(week.start) && wDate < new Date(week.end);
    });

    return week.goals.every(goal =>
      userWorkoutsThisWeek.some(w => w.workout_type === goal.id)
    );
  };

  const getWeeklyMinPenalty = (userName) => {
    // localStorage'da saklanan kalıcı cezaları oku
    const stored = JSON.parse(localStorage.getItem('steamhuckWeekPenalties') || '{}');
    return (stored[userName] || 0);
  };

  const applyWeeklyPenalties = (currentWorkouts, currentTeams) => {
    // Veriler yüklenince çağrılır - geçen haftayı kontrol eder
    // Güvenlik: workouts boşsa çalışma
    if (!currentWorkouts || currentWorkouts.length === 0) return;

    const currentWeekStart = getWeekStart();
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(currentWeekStart);

    // Geçen hafta sezon içinde mi?
    const seasonEnd = new Date(seasonStart);
    seasonEnd.setDate(seasonEnd.getDate() + SEASON_DURATION_DAYS);

    // prevWeekEnd en az seasonStart'tan sonra olmalı
    // ve prevWeekStart sezon bitmeden önce olmalı
    if (prevWeekEnd <= new Date(seasonStart) || prevWeekStart >= seasonEnd) return;

    // Son kontrol edilen hafta bu mu?
    const lastChecked = localStorage.getItem('steamhuckLastPenaltyCheck');
    const prevWeekKey = prevWeekStart.toISOString().split('T')[0];
    if (lastChecked === prevWeekKey) return; // Zaten kontrol edildi

    const stored = JSON.parse(localStorage.getItem('steamhuckWeekPenalties') || '{}');
    let changed = false;

    const activeTeams = currentTeams || teams;
    const allMembers = [...activeTeams.team_emir.members, ...activeTeams.team_ceyhun.members];
    allMembers.forEach(userName => {
      const weekPoints = currentWorkouts
        .filter(w => {
          const d = new Date(w.created_at);
          return w.user_name === userName && d >= prevWeekStart && d < prevWeekEnd;
        })
        .reduce((sum, w) => sum + w.points, 0);

      if (weekPoints < 6) {
        stored[userName] = (stored[userName] || 0) + 3;
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem('steamhuckWeekPenalties', JSON.stringify(stored));
    }
    localStorage.setItem('steamhuckLastPenaltyCheck', prevWeekKey);
  };

  const getSeasonPoints = (userName) => {
    const basePoints = workouts
      .filter(w => w.user_name === userName && new Date(w.created_at) >= new Date(seasonStart))
      .reduce((sum, w) => sum + w.points, 0);

    const tagBonus = tags.filter(t => t.target_user === userName && t.status === 'defended').length;
    const tagPenalty = tags.filter(t => t.target_user === userName && t.status === 'failed').length * 3;

    // Her hafta ayrı ayrı +3 — tamamlandığında kalıcı
    const weeklyGoalBonus = Object.keys(weeklyGoals).reduce((sum, weekKey) => {
      return sum + (checkWeekGoalsCompleted(userName, weekKey) ? 3 : 0);
    }, 0);

    // Geçmiş haftalarda 6 puan altı → -3 ceza
    const minWeeklyPenalty = getWeeklyMinPenalty(userName);

    return basePoints + tagBonus - tagPenalty + weeklyGoalBonus - minWeeklyPenalty;
  };

  const getTeamPoints = (teamId) => {
    return teams[teamId].members.reduce((sum, m) => sum + getSeasonPoints(m), 0);
  };

  // Seviye hesaplama
  const getLevel = (points) => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (points >= LEVELS[i].minPoints) return LEVELS[i];
    }
    return LEVELS[0];
  };

  // Streak hesaplama
  const getStreak = (userName) => {
    const userWorkouts = workouts
      .filter(w => w.user_name === userName)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (userWorkouts.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasWorkout = userWorkouts.some(w => {
        const wDate = new Date(w.created_at);
        wDate.setHours(0, 0, 0, 0);
        return wDate.getTime() === checkDate.getTime();
      });

      if (hasWorkout) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  // Rozet kontrolü
  const getUserBadges = (userName) => {
    const userWorkouts = workouts.filter(w => w.user_name === userName);
    const streak = getStreak(userName);
    const weeklyPts = getWeeklyPoints(userName);
    const goalsOk = checkWeeklyGoalsCompleted(userName).completed;
    const defends = tags.filter(t => t.target_user === userName && t.status === 'defended').length;
    const successfulTags = tags.filter(t => t.tagger_user === userName && t.status === 'defended').length;

    return BADGES.filter(b => b.check(userWorkouts, streak, weeklyPts, goalsOk, defends, successfulTags));
  };

  // Bugün antrenman yapanlar
  const getTodayWorkoutCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayUsers = new Set(
      workouts
        .filter(w => {
          const wDate = new Date(w.created_at);
          wDate.setHours(0, 0, 0, 0);
          return wDate.getTime() === today.getTime();
        })
        .map(w => w.user_name)
    );
    return todayUsers.size;
  };

  // Takvim için antrenmanları grupla
  const getWorkoutsForMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    return workouts.filter(w => {
      if (currentUser && w.user_name !== currentUser.name) return false;
      const wDate = new Date(w.created_at);
      return wDate.getFullYear() === year && wDate.getMonth() === month;
    });
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
    const oppTeam = teams[getOpponentTeamId(currentUser.name)];
    return oppTeam.members.filter(m => canBeTagged(m));
  };

  const getLeaderboard = () => {
    const allMembers = [...teams.team_emir.members, ...teams.team_ceyhun.members];
    return allMembers
      .map(name => ({
        name,
        totalPoints: getSeasonPoints(name),
        weeklyPoints: getWeeklyPoints(name),
        team: getUserTeam(name),
        workoutCount: workouts.filter(w => w.user_name === name).length,
        goalsCompleted: checkWeeklyGoalsCompleted(name).completed,
        level: getLevel(getSeasonPoints(name)),
        streak: getStreak(name),
        badges: getUserBadges(name)
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  };

  // Antrenman kaydet
  const submitWorkout = async () => {
    if (selectedWorkouts.length === 0 || !currentUser) return;
    setIsLoading(true);

    const now = new Date().toISOString();
    const newEntries = selectedWorkouts.map((workoutId, i) => {
      const workout = WORKOUT_TYPES.find(w => w.id === workoutId);
      return {
        id: Date.now() + i,
        user_name: currentUser.name,
        workout_type: workoutId,
        points: workout.points,
        created_at: now
      };
    });

    const totalPoints = newEntries.reduce((s, e) => s + e.points, 0);

    if (isDemo) {
      const newWorkouts = [...newEntries, ...workouts];
      setWorkouts(newWorkouts);
      localStorage.setItem('steamhuckWorkouts', JSON.stringify(newWorkouts));
    } else {
      // Supabase'e id olmadan gönder - otomatik oluşsun
      const supabaseEntries = newEntries.map(({ id, ...rest }) => rest);
      const { error } = await supabase.from('workouts').insert(supabaseEntries);
      if (error) console.error('Workout kayıt hatası:', error);
      await loadData();
    }
    
    // Etiket savunma kontrolü - 2+ puan yaptıysa pending etiketleri "defended" yap
    if (totalPoints >= 2) {
      const pendingTags = tags.filter(t => t.status === 'pending' && t.target_user === currentUser.name);
      if (pendingTags.length > 0) {
        const updatedTags = tags.map(t => {
          if (t.status === 'pending' && t.target_user === currentUser.name) {
            return { ...t, status: 'defended', resolved_at: new Date().toISOString() };
          }
          return t;
        });
        setTags(updatedTags);
        
        if (isDemo) {
          localStorage.setItem('steamhuckTags', JSON.stringify(updatedTags));
        } else {
          // Supabase'de her pending etiketi güncelle
          for (const tag of pendingTags) {
            await supabase.from('tags').update({ 
              status: 'defended', 
              resolved_at: new Date().toISOString() 
            }).eq('id', tag.id);
          }
        }
      }
    }
    
    // Rastgele motivasyon mesajı
    const randomMsg = MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)];
    setSuccessMessage(`+${totalPoints} PUAN\n${randomMsg}`);
    setShowSuccess(true);
    setShowWorkoutModal(false);
    setSelectedWorkouts([]);
    setIsLoading(false);
    
    setTimeout(() => {
      setShowSuccess(false);
      if (!hasTaggedToday()) setShowTagModal(true);
    }, 1500);
  };

  const submitTag = async () => {
    if (!tagTarget || !currentUser) return;
    
    await saveTag({
      id: Date.now(),
      tagger_user: currentUser.name,
      target_user: tagTarget,
      status: 'pending',
      created_at: new Date().toISOString()
    });
    
    setSuccessMessage(`${tagTarget} etiketlendi! ⏰ 48 saat`);
    setShowSuccess(true);
    setShowTagModal(false);
    setTagTarget(null);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const handleLogin = (name) => {
    setCurrentUser({ name });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const resetAllData = () => {
    if (confirm('Tüm veriler silinecek. Emin misin?')) {
      setWorkouts([]);
      setTags([]);
      setReactions([]);
      setMessages([]);
      ['steamhuckWorkouts', 'steamhuckTags', 'steamhuckReactions', 'steamhuckMessages', 'steamhuckWeeklyGoals'].forEach(k => localStorage.removeItem(k));
    }
  };

  const getFeedItems = () => {
    const workoutItems = workouts.map(w => ({
      type: 'workout', id: `w_${w.id}`, user: w.user_name, team: getUserTeam(w.user_name), data: w, timestamp: new Date(w.created_at)
    }));
    const tagItems = tags.map(t => ({
      type: 'tag', id: `t_${t.id}`, user: t.tagger_user, target: t.target_user, team: getUserTeam(t.tagger_user), data: t, timestamp: new Date(t.created_at)
    }));
    const msgItems = messages.map(m => ({
      type: 'message', id: `m_${m.id}`, user: m.user_name, team: getUserTeam(m.user_name), data: m, timestamp: new Date(m.created_at)
    }));

    return [...workoutItems, ...tagItems, ...msgItems].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'az önce';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    return `${Math.floor(hours / 24)} gün önce`;
  };

  const getWorkoutReactions = (workoutId) => {
    return reactions.filter(r => r.workout_id === workoutId);
  };

  const userTeamId = currentUser ? getUserTeam(currentUser.name) : null;
  const isTeamEmir = userTeamId === 'team_emir';
  const userIsCaptain = currentUser && isCaptain(currentUser.name);

  // Loading
  if (dataLoading && workouts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
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
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'); * { font-family: 'Space Grotesk', sans-serif; }`}</style>
        
        <div className="max-w-md mx-auto pt-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🥏</div>
            <h1 className="text-2xl font-bold text-white">STEAMHUCK</h1>
            <p className="text-purple-400 text-sm">CHALLENGE TRACKER</p>
            
            {/* Bugün antrenman yapanlar */}
            {getTodayWorkoutCount() > 0 && (
              <div className="mt-3 px-4 py-2 bg-green-500/20 rounded-full text-green-300 text-sm inline-block">
                🎉 Bugün {getTodayWorkoutCount()} kişi antrenman yaptı!
              </div>
            )}
            
            <div className="mt-3 flex justify-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-300 text-xs">📅 {getDaysRemaining()} gün kaldı</span>
              <button onClick={() => setShowRules(true)} className="px-3 py-1 bg-slate-700/50 rounded-full text-slate-300 text-xs">📋 Kurallar</button>
            </div>
          </div>

          {/* Takımlar */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {Object.entries(teams).map(([teamId, team]) => (
              <div key={teamId} className={`rounded-xl p-4 border text-center ${teamId === 'team_emir' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                <div className="text-2xl mb-1">{team.emoji}</div>
                <div className={`font-bold ${teamId === 'team_emir' ? 'text-emerald-400' : 'text-blue-400'}`}>{team.captain}</div>
                <div className={`text-2xl font-bold ${teamId === 'team_emir' ? 'text-emerald-300' : 'text-blue-300'}`}>{getTeamPoints(teamId)}</div>
              </div>
            ))}
          </div>

          {/* Üye Seçimi */}
          {Object.entries(teams).map(([teamId, team]) => (
            <div key={teamId} className={`mb-4 rounded-2xl p-4 border ${teamId === 'team_emir' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{team.emoji}</span>
                <span className="text-white font-bold">{team.name}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {team.members.map(member => (
                  <button key={member} onClick={() => handleLogin(member)} className={`p-2 rounded-lg text-xs transition-all ${member === team.captain ? (teamId === 'team_emir' ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/50' : 'bg-blue-600/40 text-blue-200 border border-blue-500/50') : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}>
                    {member === team.captain && '👑'}{member}
                  </button>
                ))}
              </div>
            </div>
          ))}


        </div>

        {/* Kurallar Modal */}
        {showRules && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-auto p-4">
            <div className="max-w-md mx-auto bg-slate-800 rounded-2xl p-6 my-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">📋 Kurallar</h2>
                <button onClick={() => setShowRules(false)} className="text-slate-400 text-2xl">×</button>
              </div>
              <div className="space-y-3 text-sm max-h-[60vh] overflow-auto">
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <h3 className="text-purple-400 font-bold mb-2">🏆 Puanlar</h3>
                  {WORKOUT_TYPES.map(w => (<div key={w.id} className="flex justify-between text-slate-300"><span>{w.emoji} {w.name}</span><span className="text-emerald-400">+{w.points}</span></div>))}
                </div>
                <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
                  <h3 className="text-green-400 font-bold mb-1">🎯 Haftalık Hedef</h3>
                  <p className="text-slate-300">3 hedefi tamamla → <span className="text-green-400">+3 bonus</span></p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                  <h3 className="text-red-400 font-bold mb-1">🎯 Etiketleme</h3>
                  <p className="text-slate-300">Günde 1 rakip etiketle. 48 saat içinde 2+ puan yapmazsa <span className="text-red-400">-3</span>, yaparsa <span className="text-green-400">+1</span></p>
                </div>
                <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/20">
                  <h3 className="text-orange-400 font-bold mb-1">⚠️ Minimum</h3>
                  <p className="text-slate-300">Haftada 6 puan altı → <span className="text-red-400">-3 ceza</span></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Ana Uygulama
  const userLevel = getLevel(getSeasonPoints(currentUser.name));
  const userStreak = getStreak(currentUser.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'); * { font-family: 'Space Grotesk', sans-serif; } .mono { font-family: 'JetBrains Mono', monospace; }`}</style>

      {/* Header */}
      <header className={`bg-slate-800/80 backdrop-blur-xl border-b sticky top-0 z-40 ${isTeamEmir ? 'border-emerald-500/30' : 'border-blue-500/30'}`}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={handleLogout} className="flex items-center gap-2">
              <div className="relative">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isTeamEmir ? 'bg-emerald-600' : 'bg-blue-600'}`}>{currentUser.name.charAt(0)}</span>
                <span className="absolute -bottom-1 -right-1 text-sm">{userLevel.emoji}</span>
              </div>
              <div className="text-left">
                <div className="text-white font-medium text-sm flex items-center gap-1">
                  {currentUser.name}
                  {userStreak >= 3 && <span className="text-orange-400 text-xs">🔥{userStreak}</span>}
                </div>
                <div className="text-slate-400 text-xs">{userLevel.name} • {teams[userTeamId].name}</div>
              </div>
            </button>
            <div className="flex items-center gap-2">
              {userIsCaptain && (
                <button onClick={() => setShowCaptainPanel(true)} className="p-2 bg-purple-500/20 rounded-lg text-purple-400">👑</button>
              )}
              <button onClick={() => setShowBadges(true)} className="p-2 bg-slate-700/50 rounded-lg text-yellow-400">🏅</button>
              <div className="text-right">
                <div className={`mono text-xl font-bold ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>{getSeasonPoints(currentUser.name)}</div>
                <div className={`text-xs ${getWeeklyPoints(currentUser.name) >= 6 ? 'text-green-400' : 'text-orange-400'}`}>Bu hafta: {getWeeklyPoints(currentUser.name)}/6{getWeeklyPoints(currentUser.name) < 6 ? ' ⚠️' : ' ✓'}</div>
              </div>
            </div>
          </div>

          {/* Haftalık Hedefler Mini */}
          {getCurrentWeekGoals() && (
            <div className={`mt-2 px-3 py-2 rounded-lg flex items-center justify-between ${checkWeeklyGoalsCompleted(currentUser.name).completed ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm">🎯</span>
                {checkWeeklyGoalsCompleted(currentUser.name).progress.map(g => (
                  <span key={g.id} className={`text-base ${g.done ? '' : 'opacity-30'}`}>{g.done ? '✅' : g.emoji}</span>
                ))}
              </div>
              {checkWeeklyGoalsCompleted(currentUser.name).completed && <span className="text-green-400 text-xs font-bold">+3 ✓</span>}
            </div>
          )}
        </div>
      </header>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className={`bg-slate-800 rounded-3xl p-8 text-center border ${isTeamEmir ? 'border-emerald-500/50' : 'border-blue-500/50'}`}>
            <div className="text-5xl mb-3">✅</div>
            <div className={`text-xl font-bold whitespace-pre-line ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>{successMessage}</div>
          </div>
        </div>
      )}

      {/* Workout Modal */}
      {showWorkoutModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-sm max-h-[80vh] overflow-auto border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">💪 Antrenman</h2>
              <button onClick={() => { setShowWorkoutModal(false); setSelectedWorkouts([]); }} className="text-slate-400 text-2xl">×</button>
            </div>
            <p className="text-slate-400 text-sm mb-3">Birden fazla seçebilirsin:</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {WORKOUT_TYPES.map(w => {
                const isSelected = selectedWorkouts.includes(w.id);
                const weekCount = getWeeklyWorkoutCount(w.id);
                const weekLimit = w.weeklyLimit || null;
                const limitReached = weekLimit !== null && weekCount >= weekLimit && !isSelected;
                return (
                  <button key={w.id} onClick={() => { if (limitReached) return; setSelectedWorkouts(isSelected ? selectedWorkouts.filter(id => id !== w.id) : [...selectedWorkouts, w.id]); }} className={`p-3 rounded-xl border-2 text-left ${isSelected ? (isTeamEmir ? 'bg-emerald-600/30 border-emerald-500' : 'bg-blue-600/30 border-blue-500') : limitReached ? 'bg-slate-800/30 border-slate-700 opacity-40 cursor-not-allowed' : 'bg-slate-700/50 border-slate-600'}`}>
                    <div className="flex items-center gap-1">
                      <span className="text-lg">{w.emoji}</span>
                      <span className={`text-sm font-bold ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>+{w.points}</span>
                      {isSelected && <span className="ml-auto">✓</span>}
                      {limitReached && <span className="ml-auto text-xs text-red-400">Limit!</span>}
                    </div>
                    <div className="text-white text-xs mt-1">{w.name}</div>
                    {weekLimit && <div className="text-slate-500 text-xs">{weekCount}/{weekLimit} bu hafta</div>}
                  </button>
                );
              })}
            </div>
            {selectedWorkouts.length > 0 && (
              <>
                <div className="mb-3 p-3 bg-slate-700/50 rounded-xl flex justify-between">
                  <span className="text-slate-300 text-sm">{selectedWorkouts.length} seçildi</span>
                  <span className={`font-bold ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>+{selectedWorkouts.reduce((s, id) => s + WORKOUT_TYPES.find(w => w.id === id).points, 0)}</span>
                </div>
                <button onClick={submitWorkout} disabled={isLoading} className={`w-full py-3 rounded-xl text-white font-bold ${isTeamEmir ? 'bg-emerald-600' : 'bg-blue-600'}`}>{isLoading ? '⏳' : '✓ KAYDET'}</button>
              </>
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
              <p className="text-orange-400 text-xs">Günde 1 kişi</p>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {getTaggableOpponents().map(opp => (
                <button key={opp} onClick={() => setTagTarget(tagTarget === opp ? null : opp)} className={`w-full p-3 rounded-xl flex justify-between ${tagTarget === opp ? 'bg-red-600/30 border-2 border-red-500' : 'bg-slate-700/50 border border-slate-600'}`}>
                  <span className="text-white">{opp}</span>
                  <span className="text-slate-400 text-sm">{getSeasonPoints(opp)}p</span>
                </button>
              ))}
              {getTaggableOpponents().length === 0 && <p className="text-slate-400 text-center py-4 text-sm">Etiketlenebilir rakip yok</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowTagModal(false); setTagTarget(null); }} className="flex-1 py-3 bg-slate-700 rounded-xl text-slate-300">Atla</button>
              {tagTarget && <button onClick={submitTag} className="flex-1 py-3 bg-red-600 rounded-xl text-white font-bold">Etiketle!</button>}
            </div>
          </div>
        </div>
      )}

      {/* Badges Modal */}
      {showBadges && (
        <div className="fixed inset-0 bg-black/90 z-50 overflow-auto p-4">
          <div className="max-w-md mx-auto bg-slate-800 rounded-2xl p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">🏅 Rozetler & Seviye</h2>
              <button onClick={() => setShowBadges(false)} className="text-slate-400 text-2xl">×</button>
            </div>
            
            {/* Seviye */}
            <div className="bg-purple-500/20 rounded-xl p-4 mb-4 text-center">
              <div className="text-4xl mb-2">{userLevel.emoji}</div>
              <div className="text-white font-bold text-lg">{userLevel.name}</div>
              <div className="text-purple-300 text-sm">{getSeasonPoints(currentUser.name)} puan</div>
              {userStreak >= 3 && <div className="text-orange-400 mt-2">🔥 {userStreak} gün streak!</div>}
            </div>

            {/* Seviyeler */}
            <div className="mb-4">
              <h3 className="text-slate-400 text-sm mb-2">Seviyeler</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {LEVELS.map(l => (
                  <div key={l.name} className={`flex-shrink-0 px-3 py-2 rounded-lg text-center ${getSeasonPoints(currentUser.name) >= l.minPoints ? 'bg-purple-500/30' : 'bg-slate-700/30 opacity-50'}`}>
                    <div className="text-xl">{l.emoji}</div>
                    <div className="text-white text-xs">{l.name}</div>
                    <div className="text-slate-400 text-xs">{l.minPoints}+</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rozetler */}
            <h3 className="text-slate-400 text-sm mb-2">Rozetler</h3>
            <div className="grid grid-cols-2 gap-2">
              {BADGES.map(badge => {
                const earned = getUserBadges(currentUser.name).some(b => b.id === badge.id);
                return (
                  <div key={badge.id} className={`p-3 rounded-xl ${earned ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-slate-700/30 opacity-50'}`}>
                    <div className="text-2xl mb-1">{badge.emoji}</div>
                    <div className="text-white text-sm font-medium">{badge.name}</div>
                    <div className="text-slate-400 text-xs">{badge.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Captain Panel */}
      {showCaptainPanel && userIsCaptain && (
        <div className="fixed inset-0 bg-black/90 z-50 overflow-auto p-4">
          <div className="max-w-md mx-auto bg-slate-800 rounded-2xl p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">👑 Kaptan Paneli</h2>
              <button onClick={() => setShowCaptainPanel(false)} className="text-slate-400 text-2xl">×</button>
            </div>

            {/* Yeni Sezon Başlat */}
            <div className="bg-red-500/10 rounded-xl p-4 mb-4 border border-red-500/30">
              <h3 className="text-red-400 font-bold mb-2">🏆 Sezon Yönetimi</h3>
              <div className="text-slate-300 text-xs mb-3">
                <div>Mevcut sezon: <span className="text-white font-bold">{new Date(seasonStart).toLocaleDateString('tr-TR')} — {new Date(new Date(seasonStart).getTime() + 14*24*60*60*1000).toLocaleDateString('tr-TR')}</span></div>
                <div className="mt-1">Kalan: <span className="text-purple-400 font-bold">{getDaysRemaining()} gün</span></div>
              </div>
              {showSeasonModal ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Yeni sezon başlangıç tarihi:</label>
                    <input
                      type="date"
                      value={newSeasonDate}
                      onChange={e => setNewSeasonDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 rounded-lg text-white text-sm"
                    />
                  </div>
                  {newSeasonDate && (
                    <div className="bg-slate-800/50 rounded-lg p-2 text-xs text-slate-300">
                      📅 {new Date(newSeasonDate).toLocaleDateString('tr-TR')} → {new Date(new Date(newSeasonDate).getTime() + 14*24*60*60*1000).toLocaleDateString('tr-TR')}
                      <span className="text-red-400 block mt-1">⚠️ Tüm veriler silinecek!</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setShowSeasonModal(false)} className="flex-1 py-2 bg-slate-700 rounded-lg text-slate-300 text-sm">İptal</button>
                    <button
                      onClick={() => {
                        if (!newSeasonDate) return;
                        if (confirm('Yeni sezon başlatılacak ve TÜM veriler silinecek. Emin misin?')) {
                          startNewSeason(newSeasonDate);
                        }
                      }}
                      disabled={!newSeasonDate}
                      className="flex-1 py-2 bg-red-600 rounded-lg text-white text-sm font-bold disabled:opacity-40"
                    >🚀 Başlat</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setNewSeasonDate(''); setShowSeasonModal(true); }} className="w-full py-2 bg-red-600/30 border border-red-500/50 text-red-400 text-sm rounded-lg hover:bg-red-600/50">
                  🚀 Yeni Sezon Başlat
                </button>
              )}
            </div>

            {/* Haftalık Hedefler */}
            <div className="bg-purple-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-purple-400 font-bold mb-1">🎯 Hafta {getCurrentWeekNumber()} Hedeflerini Belirle</h3>
              <p className="text-slate-400 text-xs mb-3">Tüm takımlar için ortak hedef (3 seç)</p>
              <div className="space-y-2">
                {WORKOUT_TYPES.map(w => {
                  const isSelected = newGoals.some(g => g.id === w.id);
                  return (
                    <button key={w.id} onClick={() => setNewGoals(isSelected ? newGoals.filter(g => g.id !== w.id) : [...newGoals, { id: w.id, name: w.name, emoji: w.emoji }])} disabled={!isSelected && newGoals.length >= 3} className={`w-full p-2 rounded-lg flex items-center gap-2 ${isSelected ? 'bg-purple-600/40' : 'bg-slate-700/50'} ${!isSelected && newGoals.length >= 3 ? 'opacity-30' : ''}`}>
                      <span>{w.emoji}</span>
                      <span className="text-white text-sm">{w.name}</span>
                      {isSelected && <span className="ml-auto text-purple-400">✓</span>}
                    </button>
                  );
                })}
              </div>
              {newGoals.length === 3 && (
                <button onClick={() => { saveWeeklyGoals(newGoals); setShowCaptainPanel(false); setSuccessMessage(`Hafta ${getCurrentWeekNumber()} hedefleri kaydedildi!`); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 1500); }} className="w-full mt-3 py-2 bg-purple-600 rounded-xl text-white font-bold">Hedefleri Kaydet</button>
              )}
              <p className="text-slate-400 text-xs mt-2 text-center">{newGoals.length}/3 seçildi</p>
            </div>

            {/* Takım Yönetimi */}
            <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold">⚙️ Takım Yönetimi</h3>
                <div className="flex gap-1">
                  <button onClick={() => setEditingTeam('team_emir')} className={`px-2 py-1 rounded-lg text-xs ${editingTeam === 'team_emir' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-slate-300'}`}>💚 {teams.team_emir.captain}</button>
                  <button onClick={() => setEditingTeam('team_ceyhun')} className={`px-2 py-1 rounded-lg text-xs ${editingTeam === 'team_ceyhun' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`}>💙 {teams.team_ceyhun.captain}</button>
                </div>
              </div>

              {/* Takım İsmi Düzenle */}
              <div className="mb-3">
                <p className="text-slate-400 text-xs mb-2">Takım adı:</p>
                {editingTeamName[editingTeam] ? (
                  <div className="flex gap-2">
                    <input
                      value={teamNameInput[editingTeam]}
                      onChange={e => setTeamNameInput(prev => ({ ...prev, [editingTeam]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && changeTeamName(editingTeam, teamNameInput[editingTeam])}
                      className="flex-1 px-3 py-2 bg-slate-800 rounded-lg text-white text-sm"
                      placeholder="Yeni takım adı..."
                      autoFocus
                    />
                    <button onClick={() => changeTeamName(editingTeam, teamNameInput[editingTeam])}
                      className={`px-3 py-2 rounded-lg text-white text-sm font-bold ${editingTeam === 'team_emir' ? 'bg-emerald-600' : 'bg-blue-600'}`}>✓</button>
                    <button onClick={() => setEditingTeamName(prev => ({ ...prev, [editingTeam]: false }))}
                      className="px-3 py-2 rounded-lg text-slate-300 text-sm bg-slate-600">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-white text-sm">{teams[editingTeam].name}</span>
                    <button onClick={() => {
                      setTeamNameInput(prev => ({ ...prev, [editingTeam]: teams[editingTeam].name }));
                      setEditingTeamName(prev => ({ ...prev, [editingTeam]: true }));
                    }} className="text-slate-400 text-xs hover:text-white">✏️ Düzenle</button>
                  </div>
                )}
              </div>

              {/* Kaptan Değiştir */}
              <div className="mb-3">
                <p className="text-slate-400 text-xs mb-2">Kaptan seç:</p>
                <div className="flex flex-wrap gap-1">
                  {teams[editingTeam].members.map(m => (
                    <button key={m} onClick={() => changeCaptain(editingTeam, m)}
                      className={`px-2 py-1 rounded-lg text-xs ${teams[editingTeam].captain === m ? (editingTeam === 'team_emir' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white') : 'bg-slate-600 text-slate-300'}`}>
                      {teams[editingTeam].captain === m && '👑 '}{m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Üye Listesi */}
              <p className="text-slate-400 text-xs mb-2">Üyeler:</p>
              <div className="space-y-1 mb-3">
                {teams[editingTeam].members.map(member => {
                  const otherTeam = editingTeam === 'team_emir' ? 'team_ceyhun' : 'team_emir';
                  return (
                    <div key={member} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-2 py-1">
                      <span className="text-white text-sm">{member}</span>
                      <div className="flex gap-1">
                        <button onClick={() => moveMember(member, editingTeam, otherTeam)}
                          className="text-xs px-2 py-1 bg-purple-600/40 text-purple-300 rounded-lg">
                          → {editingTeam === 'team_emir' ? '💙' : '💚'}
                        </button>
                        {member !== 'Ceyhun' && (
                          <button onClick={() => removeMember(member, editingTeam)}
                            className="text-xs px-2 py-1 bg-red-600/40 text-red-300 rounded-lg">✕</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Yeni Üye Ekle */}
              <div className="flex gap-2">
                <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
                  placeholder="Yeni üye adı..." onKeyDown={e => e.key === 'Enter' && addMember(editingTeam)}
                  className="flex-1 px-3 py-2 bg-slate-800 rounded-lg text-white text-sm placeholder-slate-500" />
                <button onClick={() => addMember(editingTeam)} className={`px-3 py-2 rounded-lg text-white text-sm font-bold ${editingTeam === 'team_emir' ? 'bg-emerald-600' : 'bg-blue-600'}`}>+</button>
              </div>
              <p className="text-red-400 text-xs mt-2 text-center">⚠️ Değişiklikler tüm verileri sıfırlar</p>
            </div>

            {/* Tüm Üyeler Özet */}
            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold">📊 Puan Durumu</h3>
                <button onClick={() => {
                  if (confirm('Tüm puanlar, antrenmanlar ve etiketler silinecek. Emin misin?')) {
                    setWorkouts([]);
                    setTags([]);
                    setReactions([]);
                    setMessages([]);
                    ['steamhuckWorkouts','steamhuckTags','steamhuckReactions','steamhuckMessages','steamhuckWeeklyGoals','steamhuckWeekPenalties','steamhuckLastPenaltyCheck'].forEach(k => localStorage.removeItem(k));
                    setSuccessMessage('Tüm puanlar sıfırlandı!');
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 1500);
                  }
                }} className="px-3 py-1 bg-red-600/30 border border-red-500/50 text-red-400 text-xs rounded-lg hover:bg-red-600/50">
                  🗑️ Sıfırla
                </button>
              </div>
              {[...teams.team_emir.members, ...teams.team_ceyhun.members].map(member => {
                const mTeam = getUserTeam(member);
                return (
                <div key={member} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${mTeam === 'team_emir' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                    <span className="text-white text-sm">{isCaptain(member) && '👑 '}{member}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Hafta: {getWeeklyPoints(member)}</span>
                    <span className={`font-bold text-sm ${mTeam === 'team_emir' ? 'text-emerald-400' : 'text-blue-400'}`}>{getSeasonPoints(member)}</span>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-3">💬 Motivasyon Mesajı</h2>
            <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Takıma mesaj yaz..." className="w-full p-3 bg-slate-700 rounded-xl text-white text-sm resize-none h-24 mb-3" maxLength={150} />
            <div className="flex gap-2">
              <button onClick={() => setShowMessageModal(false)} className="flex-1 py-2 bg-slate-700 rounded-xl text-slate-300">İptal</button>
              <button onClick={saveMessage} className="flex-1 py-2 bg-purple-600 rounded-xl text-white font-bold">Gönder</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-5 pb-24">
        
        {/* FEED */}
        {view === 'feed' && (
          <div className="space-y-4">
            {/* Bugün bildirimi */}
            {getTodayWorkoutCount() > 0 && (
              <div className="bg-green-500/20 rounded-xl p-3 text-center border border-green-500/30">
                <span className="text-green-300">🎉 Bugün {getTodayWorkoutCount()} kişi antrenman yaptı!</span>
              </div>
            )}

            {/* Takım Durumu */}
            <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="text-center"><div className="text-lg">💚</div><div className="text-emerald-400 font-bold mono">{getTeamPoints('team_emir')}</div></div>
                <div className="text-slate-500">vs</div>
                <div className="text-center"><div className="text-lg">💙</div><div className="text-blue-400 font-bold mono">{getTeamPoints('team_ceyhun')}</div></div>
              </div>
              <div className="text-right">
                <div className="text-purple-400 font-bold">{getDaysRemaining()} gün</div>
                <button onClick={() => setShowMessageModal(true)} className="text-slate-400 text-xs hover:text-purple-400">💬 Mesaj yaz</button>
              </div>
            </div>

            {/* Haftalık Hedefler */}
            {getCurrentWeekGoals() && (
              <div className={`rounded-xl p-4 border ${checkWeeklyGoalsCompleted(currentUser.name).completed ? 'bg-green-500/10 border-green-500/30' : 'bg-purple-500/10 border-purple-500/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-bold">🎯 Hafta {getCurrentWeekNumber()} Hedefleri</span>
                  {checkWeeklyGoalsCompleted(currentUser.name).completed && <span className="text-green-400 text-sm font-bold">+3 ✓</span>}
                </div>
                <div className="space-y-2">
                  {checkWeeklyGoalsCompleted(currentUser.name).progress.map(g => (
                    <div key={g.id} className={`flex items-center gap-3 p-2 rounded-lg ${g.done ? 'bg-green-500/20' : 'bg-slate-700/30'}`}>
                      <span className="text-lg">{g.done ? '✅' : g.emoji}</span>
                      <span className={`text-sm ${g.done ? 'text-green-300' : 'text-slate-300'}`}>{g.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feed */}
            <div>
              <h2 className="text-white font-bold mb-3 flex items-center gap-2">📡 Canlı Akış <button onClick={loadData} className="text-purple-400 text-xs ml-auto">🔄</button></h2>
              
              {getFeedItems().length === 0 ? (
                <div className="text-center py-12"><div className="text-4xl mb-3">🏋️</div><p className="text-slate-400">Henüz aktivite yok</p></div>
              ) : (
                <div className="space-y-3">
                  {getFeedItems().map(item => {
                    const isEmirTeam = item.team === 'team_emir';
                    
                    if (item.type === 'workout') {
                      const workout = WORKOUT_TYPES.find(w => w.id === item.data.workout_type);
                      const itemReactions = getWorkoutReactions(item.data.id);
                      
                      return (
                        <div key={item.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isEmirTeam ? 'bg-emerald-600/30' : 'bg-blue-600/30'}`}>{workout?.emoji}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isEmirTeam ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                                <span className="text-white font-medium">{item.user}</span>
                                <span className="text-slate-500 text-xs">{getTimeAgo(item.timestamp)}</span>
                              </div>
                              <p className="text-slate-300 text-sm mt-1">{workout?.name}</p>
                              
                              {/* Tepkiler */}
                              <div className="flex items-center gap-1 mt-2 flex-wrap">
                                {REACTIONS.map(emoji => {
                                  const count = itemReactions.filter(r => r.emoji === emoji).length;
                                  const userReacted = itemReactions.some(r => r.emoji === emoji && r.user_name === currentUser.name);
                                  return (
                                    <button key={emoji} onClick={() => !userReacted && saveReaction(item.data.id, emoji)} className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 ${count > 0 ? 'bg-slate-700' : 'bg-slate-800 opacity-50 hover:opacity-100'} ${userReacted ? 'ring-1 ring-purple-500' : ''}`}>
                                      {emoji}{count > 0 && <span className="text-xs text-slate-400">{count}</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`mono font-bold px-2 py-1 rounded-lg text-sm ${isEmirTeam ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>+{item.data.points}</div>
                              {userIsCaptain && (
                                <button onClick={() => {
                                  const updated = workouts.filter(w => w.id !== item.data.id);
                                  setWorkouts(updated);
                                  if (isDemo) localStorage.setItem('steamhuckWorkouts', JSON.stringify(updated));
                                  else supabase.from('workouts').delete().eq('id', item.data.id);
                                }} className="text-red-400 text-xs px-1 hover:text-red-300">🗑️</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (item.type === 'tag') {
                      const tagTime = new Date(item.data.created_at);
                      const now = new Date();
                      const hoursPassed = (now - tagTime) / (1000 * 60 * 60);
                      const hoursLeft = Math.max(0, 48 - hoursPassed);
                      const hoursDisplay = Math.floor(hoursLeft);
                      const minutesDisplay = Math.floor((hoursLeft - hoursDisplay) * 60);
                      
                      return (
                        <div key={item.id} className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-lg">🎯</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2"><span className="text-white font-medium">{item.user}</span><span className="text-orange-400">→</span><span className="text-white font-medium">{item.target}</span></div>
                              {item.data.status === 'pending' ? (
                                <div className="text-orange-300 text-sm">
                                  <span>⏳ Kalan: </span>
                                  <span className="font-bold">{hoursDisplay}s {minutesDisplay}dk</span>
                                  <span className="text-orange-400/60 text-xs ml-2">
                                    ({tagTime.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })})
                                  </span>
                                </div>
                              ) : (
                                <p className="text-sm">{item.data.status === 'defended' ? <span className="text-green-400">✅ Savunuldu +1</span> : <span className="text-red-400">❌ Başarısız -3</span>}</p>
                              )}
                            </div>
                          {userIsCaptain && (
                              <button onClick={() => {
                                const updated = tags.filter(t => t.id !== item.data.id);
                                setTags(updated);
                                if (isDemo) localStorage.setItem('steamhuckTags', JSON.stringify(updated));
                                else supabase.from('tags').delete().eq('id', item.data.id);
                              }} className="text-red-400 text-xs px-2 hover:text-red-300">🗑️</button>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    if (item.type === 'message') {
                      return (
                        <div key={item.id} className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${isEmirTeam ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                            <span className="text-white font-medium text-sm">{item.user}</span>
                            <span className="text-slate-500 text-xs">{getTimeAgo(item.timestamp)}</span>
                          </div>
                          <p className="text-purple-200">{item.data.text}</p>
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

        {/* CALENDAR */}
        {view === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() - 1)))} className="text-slate-400 p-2">←</button>
              <h2 className="text-white font-bold">{calendarMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h2>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() + 1)))} className="text-slate-400 p-2">→</button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-2">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const year = calendarMonth.getFullYear();
                const month = calendarMonth.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const startOffset = firstDay === 0 ? 6 : firstDay - 1;
                const monthWorkouts = getWorkoutsForMonth(calendarMonth);
                
                const days = [];
                for (let i = 0; i < startOffset; i++) days.push(<div key={`empty-${i}`} />);
                
                for (let day = 1; day <= daysInMonth; day++) {
                  const dayWorkouts = monthWorkouts.filter(w => new Date(w.created_at).getDate() === day);
                  const totalPoints = dayWorkouts.reduce((s, w) => s + w.points, 0);
                  const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                  
                  days.push(
                    <div key={day} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs ${isToday ? 'ring-2 ring-purple-500' : ''} ${totalPoints > 0 ? (isTeamEmir ? 'bg-emerald-500/30' : 'bg-blue-500/30') : 'bg-slate-800/50'}`}>
                      <span className="text-white">{day}</span>
                      {totalPoints > 0 && <span className={`text-xs ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>+{totalPoints}</span>}
                    </div>
                  );
                }
                return days;
              })()}
            </div>
            
            {/* Ay Özeti */}
            <div className="bg-slate-800/50 rounded-xl p-4 mt-4">
              <h3 className="text-white font-bold mb-2">📊 Bu Ay</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><div className={`text-2xl font-bold ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>{getWorkoutsForMonth(calendarMonth).length}</div><div className="text-slate-400 text-xs">Antrenman</div></div>
                <div><div className={`text-2xl font-bold ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>{getWorkoutsForMonth(calendarMonth).reduce((s, w) => s + w.points, 0)}</div><div className="text-slate-400 text-xs">Puan</div></div>
                <div><div className="text-2xl font-bold text-orange-400">{getStreak(currentUser.name)}</div><div className="text-slate-400 text-xs">Streak 🔥</div></div>
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {view === 'leaderboard' && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white text-center mb-4">🏆 Sıralama</h2>
            {getLeaderboard().map((p, i) => (
              <div key={p.name} className={`p-3 rounded-xl ${i === 0 ? 'bg-yellow-600/20 border border-yellow-500/50' : i === 1 ? 'bg-slate-500/20' : i === 2 ? 'bg-orange-600/20' : 'bg-slate-800/50'} ${p.name === currentUser.name ? 'ring-2 ring-purple-500' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-400 text-black' : i === 2 ? 'bg-orange-500 text-white' : 'bg-slate-700 text-white'}`}>{i < 3 ? ['🥇','🥈','🥉'][i] : i+1}</div>
                  <div className={`w-2 h-2 rounded-full ${p.team === 'team_emir' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{p.name}</span>
                      <span className="text-sm">{p.level.emoji}</span>
                      {p.streak >= 3 && <span className="text-orange-400 text-xs">🔥{p.streak}</span>}
                      {p.badges.length > 0 && <span className="text-yellow-400 text-xs">🏅{p.badges.length}</span>}
                    </div>
                    <div className="text-slate-500 text-xs">{p.level.name} • {p.workoutCount} antrenman</div>
                  </div>
                  <div className={`mono font-bold text-lg ${p.team === 'team_emir' ? 'text-emerald-400' : 'text-blue-400'}`}>{p.totalPoints}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TEAMS */}
        {view === 'teams' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white text-center">⚔️ Takım Savaşı</h2>
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="text-center"><div className="text-3xl mb-2">💚</div><div className="text-emerald-400 font-bold">{teams.team_emir.captain}</div><div className="text-emerald-300 text-3xl font-bold mono">{getTeamPoints('team_emir')}</div></div>
                <div className="text-3xl text-purple-400">VS</div>
                <div className="text-center"><div className="text-3xl mb-2">💙</div><div className="text-blue-400 font-bold">{teams.team_ceyhun.captain}</div><div className="text-blue-300 text-3xl font-bold mono">{getTeamPoints('team_ceyhun')}</div></div>
              </div>
              <div className="mt-5 h-3 bg-slate-700 rounded-full overflow-hidden flex">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${(getTeamPoints('team_emir') / (getTeamPoints('team_emir') + getTeamPoints('team_ceyhun') || 1)) * 100}%` }} />
                <div className="bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${(getTeamPoints('team_ceyhun') / (getTeamPoints('team_emir') + getTeamPoints('team_ceyhun') || 1)) * 100}%` }} />
              </div>
              <div className="mt-3 text-center text-slate-400 text-sm">{getDaysRemaining()} gün kaldı</div>
            </div>

            {/* Etiketler */}
            <div>
              <h3 className="text-white font-bold mb-3">🎯 Etiketler</h3>
              {tags.length === 0 ? <p className="text-slate-500 text-center py-4">Henüz etiket yok</p> : (
                <div className="space-y-2">
                  {tags.slice(0, 10).map(tag => {
                    const tagTime = new Date(tag.created_at);
                    const now = new Date();
                    const hoursPassed = (now - tagTime) / (1000 * 60 * 60);
                    const hoursLeft = Math.max(0, 48 - hoursPassed);
                    const hoursDisplay = Math.floor(hoursLeft);
                    const minutesDisplay = Math.floor((hoursLeft - hoursDisplay) * 60);
                    
                    return (
                      <div key={tag.id} className={`p-3 rounded-xl ${tag.status === 'pending' ? 'bg-orange-500/10 border border-orange-500/30' : tag.status === 'defended' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm"><span className="text-white">{tag.tagger_user}</span> → <span className="text-white">{tag.target_user}</span></div>
                          {tag.status === 'pending' ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">
                              ⏳ {hoursDisplay}s {minutesDisplay}dk
                            </span>
                          ) : (
                            <span className={`text-xs px-2 py-1 rounded-full ${tag.status === 'defended' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                              {tag.status === 'defended' ? '✅ +1' : '❌ -3'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* FAB */}
      <button onClick={() => setShowWorkoutModal(true)} className={`fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-30 ${isTeamEmir ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>➕</button>

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-xl border-t border-purple-500/20">
        <div className="max-w-lg mx-auto flex">
          {[
            { id: 'feed', icon: '🏠', label: 'Ana' },
            { id: 'calendar', icon: '📅', label: 'Takvim' },
            { id: 'leaderboard', icon: '🏆', label: 'Sıralama' },
            { id: 'teams', icon: '⚔️', label: 'Takım' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} className={`flex-1 py-3 flex flex-col items-center ${view === tab.id ? 'text-purple-400' : 'text-slate-500'}`}>
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
