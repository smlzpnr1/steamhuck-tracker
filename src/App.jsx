import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Puan Tablosu
const WORKOUT_TYPES = [
  { id: 'sh_training', name: 'SH Antrenmanı', emoji: '🥏', points: 4 },
  { id: 'other_frisbee', name: 'Farklı Takım Frizbi Antrenmanı', emoji: '🥏', points: 2 },
  { id: 'upper_body', name: 'Üst Vücut Antrenmanı', emoji: '💪', points: 2 },
  { id: 'ultimate_lower', name: 'Ultimate-specific Alt Vücut/Core/HIIT', emoji: '🔥', points: 3 },
  { id: 'explosive', name: 'Koşu(5km+)/Bisiklet(10km+)/Plyometrics/Sprint', emoji: '⚡', points: 3 },
  { id: 'other_sport', name: 'Farklı Spor Dalı', emoji: '🏃', points: 1 },
  { id: 'mobility', name: 'Yoga/Pilates/Mobility', emoji: '🧘', points: 1 },
  { id: 'disc_throwing', name: 'Disk Atma', emoji: '🎯', points: 2 },
];

// Haftalık Hedefler
const WEEKLY_GOALS = [
  { id: 'goal_cardio', name: '2x Kardiyo (koşu/bisiklet)', emoji: '🏃' },
  { id: 'goal_strength', name: '2x Kuvvet antrenmanı', emoji: '💪' },
  { id: 'goal_mobility', name: '1x Mobility/Yoga', emoji: '🧘' },
  { id: 'goal_disc', name: '1x Disk atma', emoji: '🎯' },
];

// İlk Dönem Takımları
const INITIAL_TEAMS = {
  team_emir: {
    name: "Emir'in Takımı",
    captain: 'Emir',
    color: 'emerald',
    members: ['Emir', 'Simay', 'Kağan', 'İrem', 'Ayşenur', 'Tuti', 'Bilgecan', 'Aytaç', 'Ece', 'Deniz', 'Şevval']
  },
  team_ceyhun: {
    name: "Ceyhun'un Takımı",
    captain: 'Ceyhun',
    color: 'blue',
    members: ['Ceyhun', 'Efza', 'Tarık Zadil', 'Elif', 'Hüseyin', 'Azra', 'Emre', 'Şamil', 'Dilara', 'Aliberk', 'Şeyma']
  }
};

// 2 haftalık dönem başlangıcı
const SEASON_START = new Date('2025-02-17T00:00:00');
const SEASON_DURATION_DAYS = 14;

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('home');
  const [workouts, setWorkouts] = useState([]);
  const [tags, setTags] = useState([]);
  const [weeklyGoals, setWeeklyGoals] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [tagTarget, setTagTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [showTagModal, setShowTagModal] = useState(false);
  const [teams, setTeams] = useState(INITIAL_TEAMS);

  const allMembers = [...INITIAL_TEAMS.team_emir.members, ...INITIAL_TEAMS.team_ceyhun.members];

  useEffect(() => {
    const savedUser = localStorage.getItem('steamhuckUser');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      const [workoutsRes, tagsRes, goalsRes] = await Promise.all([
        supabase.from('workouts').select('*').order('created_at', { ascending: false }),
        supabase.from('tags').select('*').order('created_at', { ascending: false }),
        supabase.from('weekly_goals').select('*')
      ]);
      
      if (workoutsRes.data) setWorkouts(workoutsRes.data);
      if (tagsRes.data) setTags(tagsRes.data);
      if (goalsRes.data) setWeeklyGoals(goalsRes.data);
    } catch (err) {
      console.error(err);
    }
    setDataLoading(false);
  };

  // Kullanıcının takımını bul
  const getUserTeam = (userName) => {
    if (INITIAL_TEAMS.team_emir.members.includes(userName)) return 'team_emir';
    if (INITIAL_TEAMS.team_ceyhun.members.includes(userName)) return 'team_ceyhun';
    return null;
  };

  // Rakip takımı bul
  const getOpponentTeam = (userName) => {
    const userTeam = getUserTeam(userName);
    return userTeam === 'team_emir' ? 'team_ceyhun' : 'team_emir';
  };

  // Hafta başlangıcını hesapla
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Sezon içindeki hafta numarasını hesapla
  const getCurrentWeek = () => {
    const now = new Date();
    const diffTime = now - SEASON_START;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  };

  // Sezon bitiş tarihini hesapla
  const getSeasonEnd = () => {
    const end = new Date(SEASON_START);
    end.setDate(end.getDate() + SEASON_DURATION_DAYS);
    return end;
  };

  // Kalan günleri hesapla
  const getDaysRemaining = () => {
    const now = new Date();
    const end = getSeasonEnd();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Bu haftaki puanları hesapla
  const getWeeklyPoints = (userName) => {
    const weekStart = getWeekStart();
    return workouts
      .filter(w => w.user_name === userName && new Date(w.created_at) >= weekStart)
      .reduce((sum, w) => sum + w.points, 0);
  };

  // Sezon puanlarını hesapla (etiketleme bonusları/cezaları dahil)
  const getSeasonPoints = (userName) => {
    const seasonWorkouts = workouts
      .filter(w => w.user_name === userName && new Date(w.created_at) >= SEASON_START)
      .reduce((sum, w) => sum + w.points, 0);
    
    // Etiketleme bonusları
    const tagBonuses = tags
      .filter(t => t.target_user === userName && t.status === 'completed')
      .length * 1; // +1 puan başarılı savunma

    // Etiketleme cezaları
    const tagPenalties = tags
      .filter(t => t.target_user === userName && t.status === 'failed')
      .length * 3; // -3 puan başarısız

    // Haftalık minimum cezası (6 puan altı = -3)
    let weeklyPenalty = 0;
    const currentWeek = getCurrentWeek();
    for (let week = 1; week < currentWeek; week++) {
      const weekStartDate = new Date(SEASON_START);
      weekStartDate.setDate(weekStartDate.getDate() + (week - 1) * 7);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);
      
      const weekPoints = workouts
        .filter(w => {
          const wDate = new Date(w.created_at);
          return w.user_name === userName && wDate >= weekStartDate && wDate < weekEndDate;
        })
        .reduce((sum, w) => sum + w.points, 0);
      
      if (weekPoints < 6) weeklyPenalty += 3;
    }

    // Haftalık hedef bonusu
    const goalBonus = weeklyGoals
      .filter(g => g.user_name === userName && g.completed)
      .length > 0 ? 3 : 0;

    return seasonWorkouts + tagBonuses - tagPenalties - weeklyPenalty + goalBonus;
  };

  // Takım puanını hesapla
  const getTeamPoints = (teamId) => {
    const team = teams[teamId];
    return team.members.reduce((sum, member) => sum + getSeasonPoints(member), 0);
  };

  // Bireysel sıralama
  const getLeaderboard = () => {
    return allMembers
      .map(name => ({
        name,
        points: getSeasonPoints(name),
        weeklyPoints: getWeeklyPoints(name),
        team: getUserTeam(name),
        workoutCount: workouts.filter(w => w.user_name === name).length
      }))
      .sort((a, b) => b.points - a.points);
  };

  // Kullanıcı etiketlenebilir mi kontrol et
  const canBeTagged = (userName) => {
    const recentTags = tags.filter(t => {
      const tagDate = new Date(t.created_at);
      const hoursSince = (new Date() - tagDate) / (1000 * 60 * 60);
      return t.target_user === userName && hoursSince < 48;
    });
    return recentTags.length === 0;
  };

  // Aktif etiketleri kontrol et ve güncelle
  const checkAndUpdateTags = async () => {
    const now = new Date();
    const pendingTags = tags.filter(t => t.status === 'pending');
    
    for (const tag of pendingTags) {
      const tagDate = new Date(tag.created_at);
      const hoursSince = (now - tagDate) / (1000 * 60 * 60);
      
      if (hoursSince >= 48) {
        // 48 saat geçti, kontrol et
        const targetWorkouts = workouts.filter(w => {
          const wDate = new Date(w.created_at);
          return w.user_name === tag.target_user && 
                 wDate > tagDate && 
                 w.points >= 2;
        });
        
        const status = targetWorkouts.length > 0 ? 'completed' : 'failed';
        await supabase.from('tags').update({ status }).eq('id', tag.id);
      }
    }
  };

  // Antrenman kaydet
  const submitWorkout = async () => {
    if (!selectedWorkout || !currentUser) return;
    setIsLoading(true);
    
    const workout = WORKOUT_TYPES.find(w => w.id === selectedWorkout);
    
    const { error } = await supabase.from('workouts').insert({
      user_name: currentUser.name,
      workout_type: selectedWorkout,
      points: workout.points,
    });

    if (!error) {
      setSuccessMessage(`+${workout.points} PUAN`);
      setShowSuccess(true);
      await loadAllData();
      await checkAndUpdateTags();
      
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedWorkout(null);
        
        // 2+ puan aldıysa etiketleme seçeneği sun
        if (workout.points >= 2) {
          setShowTagModal(true);
        }
      }, 1500);
    }
    setIsLoading(false);
  };

  // Etiketleme yap
  const submitTag = async () => {
    if (!tagTarget || !currentUser) return;
    
    const { error } = await supabase.from('tags').insert({
      tagger_user: currentUser.name,
      target_user: tagTarget,
      status: 'pending'
    });

    if (!error) {
      setSuccessMessage(`${tagTarget} etiketlendi! 48 saat süresi başladı ⏰`);
      setShowSuccess(true);
      setShowTagModal(false);
      setTagTarget(null);
      await loadAllData();
      setTimeout(() => setShowSuccess(false), 2000);
    }
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

  // Rakip takım üyelerini getir (etiketlenebilir olanlar)
  const getTaggableOpponents = () => {
    const opponentTeamId = getOpponentTeam(currentUser?.name);
    if (!opponentTeamId) return [];
    
    return teams[opponentTeamId].members.filter(m => canBeTagged(m));
  };

  // Loading
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🥏</div>
          <p className="text-purple-400 text-lg">Steamhuck Tracker</p>
          <p className="text-slate-500 text-sm mt-2">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Giriş ekranı
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🥏</div>
            <h1 className="text-3xl font-bold text-white mb-2">STEAMHUCK</h1>
            <p className="text-purple-400 text-sm tracking-wider">CHALLENGE TRACKER</p>
            <div className="mt-4 px-4 py-2 bg-purple-500/20 rounded-xl border border-purple-500/30 inline-block">
              <p className="text-purple-300 text-sm">📅 {getDaysRemaining()} gün kaldı</p>
            </div>
          </div>

          {/* Takım Seçimi */}
          <div className="space-y-4">
            {Object.entries(teams).map(([teamId, team]) => (
              <div key={teamId} className={`bg-slate-800/50 rounded-2xl p-4 border ${
                teamId === 'team_emir' ? 'border-emerald-500/30' : 'border-blue-500/30'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{teamId === 'team_emir' ? '💚' : '💙'}</span>
                  <div>
                    <h3 className="text-white font-bold">{team.name}</h3>
                    <p className="text-slate-400 text-sm">Kaptan: {team.captain}</p>
                  </div>
                  <div className={`ml-auto px-3 py-1 rounded-full text-sm font-mono ${
                    teamId === 'team_emir' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {getTeamPoints(teamId)} puan
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {team.members.map(member => (
                    <button
                      key={member}
                      onClick={() => handleLogin(member)}
                      className={`p-2 rounded-xl text-sm transition-all ${
                        member === team.captain 
                          ? teamId === 'team_emir'
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                            : 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      }`}
                    >
                      {member === team.captain && '👑 '}{member}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const userTeamId = getUserTeam(currentUser.name);
  const userTeam = teams[userTeamId];
  const isTeamEmir = userTeamId === 'team_emir';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Header */}
      <header className={`bg-slate-800/80 backdrop-blur-xl border-b ${
        isTeamEmir ? 'border-emerald-500/30' : 'border-blue-500/30'
      } sticky top-0 z-50`}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={handleLogout} className="flex items-center gap-2 text-white">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isTeamEmir ? 'bg-emerald-600' : 'bg-blue-600'
              }`}>
                {currentUser.name.charAt(0)}
              </span>
              <div>
                <span className="font-medium block text-sm">{currentUser.name}</span>
                <span className="text-xs text-slate-400">{userTeam?.name}</span>
              </div>
            </button>
            <div className="text-right">
              <div className={`font-mono text-lg font-bold ${isTeamEmir ? 'text-emerald-400' : 'text-blue-400'}`}>
                {getSeasonPoints(currentUser.name)} puan
              </div>
              <div className="text-xs text-slate-400">Bu hafta: {getWeeklyPoints(currentUser.name)}/6</div>
            </div>
          </div>
          
          {/* Haftalık uyarı */}
          {getWeeklyPoints(currentUser.name) < 6 && (
            <div className="mt-2 px-3 py-1.5 bg-orange-500/20 rounded-lg border border-orange-500/30">
              <p className="text-orange-400 text-xs">
                ⚠️ Minimum 6 puan hedefi için {6 - getWeeklyPoints(currentUser.name)} puan daha gerekli!
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className={`bg-slate-800 rounded-3xl p-8 text-center border ${
            isTeamEmir ? 'border-emerald-500/30' : 'border-blue-500/30'
          }`}>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">{successMessage}</h2>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-purple-500/30">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🎯</div>
              <h2 className="text-xl font-bold text-white">Rakip Etiketle!</h2>
              <p className="text-slate-400 text-sm mt-1">
                48 saat içinde 2+ puan yapmazsa -3 puan!
              </p>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {getTaggableOpponents().length > 0 ? (
                getTaggableOpponents().map(opponent => (
                  <button
                    key={opponent}
                    onClick={() => setTagTarget(tagTarget === opponent ? null : opponent)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      tagTarget === opponent
                        ? 'bg-red-600/30 border-2 border-red-500'
                        : 'bg-slate-700/50 border border-slate-600 hover:border-red-500/50'
                    }`}
                  >
                    <span className="text-white">{opponent}</span>
                    <span className="text-slate-400 text-sm ml-2">
                      ({getSeasonPoints(opponent)} puan)
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4">
                  Şu an etiketlenebilecek rakip yok (48 saat kuralı)
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
                <button
                  onClick={submitTag}
                  className="flex-1 py-3 bg-red-600 rounded-xl text-white font-bold"
                >
                  Etiketle!
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-28">
        {view === 'home' && (
          <div className="space-y-6">
            {/* Takım Durumu */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(teams).map(([teamId, team]) => {
                const isUserTeam = teamId === userTeamId;
                const teamPoints = getTeamPoints(teamId);
                const otherTeamId = teamId === 'team_emir' ? 'team_ceyhun' : 'team_emir';
                const isWinning = teamPoints > getTeamPoints(otherTeamId);
                
                return (
                  <div
                    key={teamId}
                    className={`p-4 rounded-2xl border-2 ${
                      isUserTeam 
                        ? teamId === 'team_emir' 
                          ? 'bg-emerald-600/20 border-emerald-500' 
                          : 'bg-blue-600/20 border-blue-500'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span>{teamId === 'team_emir' ? '💚' : '💙'}</span>
                      <span className="text-white font-medium text-sm">{team.captain}</span>
                      {isWinning && <span className="ml-auto">👑</span>}
                    </div>
                    <div className={`text-2xl font-bold font-mono ${
                      teamId === 'team_emir' ? 'text-emerald-400' : 'text-blue-400'
                    }`}>
                      {teamPoints}
                    </div>
                    <div className="text-slate-400 text-xs">takım puanı</div>
                  </div>
                );
              })}
            </div>

            {/* Aktif Etiketler */}
            {tags.filter(t => t.status === 'pending' && 
              (t.target_user === currentUser.name || t.tagger_user === currentUser.name)
            ).length > 0 && (
              <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/30">
                <h3 className="text-red-400 font-medium mb-2">🎯 Aktif Etiketler</h3>
                {tags.filter(t => t.status === 'pending').map(tag => {
                  const tagDate = new Date(tag.created_at);
                  const hoursLeft = Math.max(0, 48 - ((new Date() - tagDate) / (1000 * 60 * 60)));
                  
                  if (tag.target_user === currentUser.name) {
                    return (
                      <div key={tag.id} className="bg-red-500/20 rounded-xl p-3 mb-2">
                        <p className="text-red-300 text-sm">
                          ⚠️ <strong>{tag.tagger_user}</strong> seni etiketledi!
                        </p>
                        <p className="text-red-400 text-xs mt-1">
                          {Math.floor(hoursLeft)} saat içinde 2+ puan yap, yoksa -3 puan!
                        </p>
                      </div>
                    );
                  } else if (tag.tagger_user === currentUser.name) {
                    return (
                      <div key={tag.id} className="bg-orange-500/20 rounded-xl p-3 mb-2">
                        <p className="text-orange-300 text-sm">
                          🎯 <strong>{tag.target_user}</strong>'i etiketledin
                        </p>
                        <p className="text-orange-400 text-xs mt-1">
                          {Math.floor(hoursLeft)} saat kaldı
                        </p>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* Antrenman Seçimi */}
            <div>
              <h2 className="text-white font-bold mb-3">💪 Antrenman Kaydet</h2>
              <div className="grid grid-cols-2 gap-3">
                {WORKOUT_TYPES.map((workout) => (
                  <button
                    key={workout.id}
                    onClick={() => setSelectedWorkout(selectedWorkout === workout.id ? null : workout.id)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedWorkout === workout.id
                        ? isTeamEmir
                          ? 'bg-emerald-600/30 border-emerald-500 scale-105'
                          : 'bg-blue-600/30 border-blue-500 scale-105'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{workout.emoji}</div>
                    <div className="text-white font-medium text-sm leading-tight">{workout.name}</div>
                    <div className={`text-sm font-mono mt-1 ${
                      isTeamEmir ? 'text-emerald-400' : 'text-blue-400'
                    }`}>+{workout.points}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Kaydet Butonu */}
            {selectedWorkout && (
              <button
                onClick={submitWorkout}
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition-all ${
                  isTeamEmir
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'
                } disabled:opacity-50`}
              >
                {isLoading ? 'Kaydediliyor...' : `✓ KAYDET (+${WORKOUT_TYPES.find(w => w.id === selectedWorkout)?.points} puan)`}
              </button>
            )}
          </div>
        )}

        {view === 'leaderboard' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">🏆 Bireysel Sıralama</h2>
              <p className="text-purple-400 text-sm mt-1">En çok puan alan kaptan olur!</p>
            </div>

            {getLeaderboard().map((player, index) => {
              const isTeamEmirMember = player.team === 'team_emir';
              const isMe = player.name === currentUser.name;
              
              return (
                <div
                  key={player.name}
                  className={`p-4 rounded-2xl flex items-center gap-3 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-600/30 to-amber-600/30 border-2 border-yellow-500/50' :
                    index === 1 ? 'bg-gradient-to-r from-slate-500/30 to-slate-600/30 border border-slate-400/30' :
                    index === 2 ? 'bg-gradient-to-r from-orange-700/30 to-orange-800/30 border border-orange-600/30' :
                    'bg-slate-800/50 border border-slate-700/30'
                  } ${isMe ? 'ring-2 ring-purple-500' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-slate-400 text-black' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-slate-700 text-white'
                  }`}>
                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${isTeamEmirMember ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                      <span className="text-white font-medium">{player.name}</span>
                      {isMe && <span className="text-purple-400 text-xs">(sen)</span>}
                    </div>
                    <div className="text-slate-400 text-xs">
                      {player.workoutCount} antrenman • Bu hafta: {player.weeklyPoints}
                    </div>
                  </div>
                  <div className={`font-mono font-bold text-xl ${
                    isTeamEmirMember ? 'text-emerald-400' : 'text-blue-400'
                  }`}>
                    {player.points}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'teams' && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">⚔️ Takım Savaşı</h2>
              <p className="text-slate-400 text-sm">{getDaysRemaining()} gün kaldı</p>
            </div>

            {/* Takım Karşılaştırması */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-4xl mb-2">💚</div>
                  <div className="text-emerald-400 font-bold">{teams.team_emir.captain}</div>
                  <div className="text-emerald-300 text-3xl font-mono font-bold mt-2">
                    {getTeamPoints('team_emir')}
                  </div>
                </div>
                <div className="text-4xl text-purple-400">VS</div>
                <div className="text-center">
                  <div className="text-4xl mb-2">💙</div>
                  <div className="text-blue-400 font-bold">{teams.team_ceyhun.captain}</div>
                  <div className="text-blue-300 text-3xl font-mono font-bold mt-2">
                    {getTeamPoints('team_ceyhun')}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="h-4 bg-slate-700 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                    style={{ 
                      width: `${(getTeamPoints('team_emir') / (getTeamPoints('team_emir') + getTeamPoints('team_ceyhun') || 1)) * 100}%` 
                    }}
                  />
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                    style={{ 
                      width: `${(getTeamPoints('team_ceyhun') / (getTeamPoints('team_emir') + getTeamPoints('team_ceyhun') || 1)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Etiket Geçmişi */}
            <div>
              <h3 className="text-white font-bold mb-3">🎯 Etiket Savaşları</h3>
              {tags.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Henüz etiketleme yok</p>
              ) : (
                <div className="space-y-2">
                  {tags.slice(0, 10).map(tag => (
                    <div 
                      key={tag.id}
                      className={`p-3 rounded-xl flex items-center justify-between ${
                        tag.status === 'pending' ? 'bg-orange-500/20 border border-orange-500/30' :
                        tag.status === 'completed' ? 'bg-green-500/20 border border-green-500/30' :
                        'bg-red-500/20 border border-red-500/30'
                      }`}
                    >
                      <div className="text-sm">
                        <span className="text-white">{tag.tagger_user}</span>
                        <span className="text-slate-400"> → </span>
                        <span className="text-white">{tag.target_user}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tag.status === 'pending' ? 'bg-orange-500/30 text-orange-300' :
                        tag.status === 'completed' ? 'bg-green-500/30 text-green-300' :
                        'bg-red-500/30 text-red-300'
                      }`}>
                        {tag.status === 'pending' ? '⏳ Bekliyor' : 
                         tag.status === 'completed' ? '✅ Savundu (+1)' : '❌ Kaybetti (-3)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white text-center mb-4">📋 Antrenmanlarım</h2>
            
            {workouts.filter(w => w.user_name === currentUser.name).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🏋️</div>
                <p className="text-slate-400">Henüz antrenman kaydın yok</p>
              </div>
            ) : (
              workouts
                .filter(w => w.user_name === currentUser.name)
                .slice(0, 20)
                .map((workout, i) => {
                  const type = WORKOUT_TYPES.find(w => w.id === workout.workout_type);
                  return (
                    <div key={i} className="bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4 border border-slate-700/50">
                      <div className="text-3xl">{type?.emoji || '💪'}</div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{type?.name || workout.workout_type}</div>
                        <div className="text-slate-500 text-sm">
                          {new Date(workout.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className={`font-mono font-bold px-3 py-1 rounded-lg ${
                        isTeamEmir ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        +{workout.points}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-xl border-t border-purple-500/20">
        <div className="max-w-lg mx-auto flex">
          {[
            { id: 'home', icon: '➕', label: 'Antrenman' },
            { id: 'leaderboard', icon: '🏆', label: 'Sıralama' },
            { id: 'teams', icon: '⚔️', label: 'Takımlar' },
            { id: 'history', icon: '📋', label: 'Geçmiş' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all ${
                view === tab.id ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
