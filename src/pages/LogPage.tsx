import { useState } from 'react';
import { Fish, Calendar, MapPin, Plus, Trash2, FileText } from 'lucide-react';
import type { LogEntry, Spot, FishingScore } from '../types';
import { getLogs, deleteLog, saveLog, generateId, getSpots } from '../lib/storage';

interface Props {
  refreshKey: number;
  onRefresh: () => void;
  prefillSpot?: Spot | null;
  prefillScore?: FishingScore | null;
  onConsumedPrefill?: () => void;
}

export default function LogPage({ refreshKey, onRefresh, prefillSpot, prefillScore, onConsumedPrefill }: Props) {
  const [showForm, setShowForm] = useState(!!prefillSpot);
  const logs = getLogs();

  return (
    <div className="min-h-screen pb-20 bg-slate-100">
      <header className="bg-gradient-to-br from-water-600 to-water-800 text-white px-5 pt-12 pb-8">
        <h1 className="text-2xl font-bold">📋 渔获记录</h1>
        <p className="text-water-100 text-sm mt-1">记录每次出钓，积累属于你的经验</p>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-4">
        {showForm ? (
          <LogForm
            spot={prefillSpot}
            score={prefillScore}
            onSave={() => {
              setShowForm(false);
              onConsumedPrefill?.();
              onRefresh();
            }}
            onCancel={() => {
              setShowForm(false);
              onConsumedPrefill?.();
            }}
          />
        ) : (
          <>
            {logs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="text-5xl mb-3">🐟</div>
                <h2 className="text-lg font-semibold text-gray-700">还没有渔获记录</h2>
                <p className="text-gray-400 text-sm mt-1 mb-4">记录每次出钓的收获</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-water-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-water-700"
                >
                  添加第一条记录
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {logs.map(log => (
                    <LogCard key={log.id} log={log} onDelete={() => {
                      deleteLog(log.id);
                      onRefresh();
                    }} />
                  ))}
                </div>

                <button
                  onClick={() => setShowForm(true)}
                  className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 text-gray-400 hover:border-water-400 hover:text-water-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  <span className="font-medium">添加记录</span>
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LogCard({ log, onDelete }: { log: LogEntry; onDelete: () => void }) {
  const date = new Date(log.date);
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 relative">
      <button
        onClick={() => {
          if (confirm('删除这条记录？')) onDelete();
        }}
        className="absolute top-3 right-3 text-gray-300 hover:text-red-400 p-1"
      >
        <Trash2 size={16} />
      </button>

      <div className="flex items-center gap-2 mb-2">
        <Calendar size={16} className="text-water-500" />
        <span className="text-sm font-medium text-gray-700">
          {date.getMonth() + 1}月{date.getDate()}日
        </span>
        <span className="text-xs text-gray-400">
          {date.getHours().toString().padStart(2, '0')}:{date.getMinutes().toString().padStart(2, '0')}
        </span>
        {log.score !== null && (
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-md" style={{
            backgroundColor: log.score >= 65 ? '#dcfce7' : log.score >= 45 ? '#fef9c3' : '#fee2e2',
            color: log.score >= 65 ? '#16a34a' : log.score >= 45 ? '#ca8a04' : '#dc2626',
          }}>
            指数 {log.score}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
        <MapPin size={14} className="text-gray-400" />
        {log.spotName}
      </div>

      <div className="flex items-center gap-2">
        <Fish size={16} className="text-water-400" />
        <span className="font-semibold text-gray-700">
          {log.fishType || '未记录'}
          {log.count > 0 && <span className="text-gray-400 font-normal"> × {log.count}条</span>}
        </span>
        {log.totalWeight && (
          <span className="text-sm text-gray-400">共 {log.totalWeight}</span>
        )}
      </div>

      {log.notes && (
        <div className="flex items-start gap-1.5 mt-2 text-sm text-gray-400">
          <FileText size={14} className="mt-0.5 shrink-0" />
          <span>{log.notes}</span>
        </div>
      )}

      {log.weatherSummary && (
        <div className="mt-2 text-xs text-gray-300 bg-slate-50 rounded-lg px-3 py-2">
          {log.weatherSummary}
        </div>
      )}
    </div>
  );
}

function LogForm({ spot, score, onSave, onCancel }: {
  spot?: Spot | null;
  score?: FishingScore | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const spots = getSpots();
  const [selectedSpotId, setSelectedSpotId] = useState(spot?.id || spots[0]?.id || '');
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [fishType, setFishType] = useState('');
  const [count, setCount] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const selectedSpot = spots.find(s => s.id === selectedSpotId);
    const entry: LogEntry = {
      id: generateId(),
      spotId: selectedSpotId,
      spotName: selectedSpot?.name || '未知钓点',
      date: new Date(date).toISOString(),
      fishType: fishType.trim(),
      count: parseInt(count) || 0,
      totalWeight: totalWeight.trim(),
      notes: notes.trim(),
      weatherSummary: score ? `${score.label}(${score.total}分): ${score.advice}` : '',
      score: score?.total ?? null,
      createdAt: new Date().toISOString(),
    };
    saveLog(entry);
    onSave();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4 page-transition">
      <h2 className="font-bold text-lg text-gray-800">记录渔获</h2>

      {/* 钓点选择 */}
      <div>
        <label className="text-xs text-gray-400">钓点</label>
        <select
          value={selectedSpotId}
          onChange={e => setSelectedSpotId(e.target.value)}
          className="w-full bg-slate-50 rounded-xl px-4 py-3 mt-1 text-gray-700 outline-none focus:ring-2 focus:ring-water-400"
        >
          {spots.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* 时间 */}
      <div>
        <label className="text-xs text-gray-400">出钓时间</label>
        <input
          type="datetime-local"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full bg-slate-50 rounded-xl px-4 py-3 mt-1 text-gray-700 outline-none focus:ring-2 focus:ring-water-400"
        />
      </div>

      {/* 鱼种 + 数量 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400">鱼种（如：鲫鱼）</label>
          <input
            type="text"
            value={fishType}
            onChange={e => setFishType(e.target.value)}
            placeholder="鲫鱼/鲤鱼/草鱼..."
            className="w-full bg-slate-50 rounded-xl px-4 py-3 mt-1 text-gray-700 outline-none focus:ring-2 focus:ring-water-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">数量</label>
          <input
            type="number"
            value={count}
            onChange={e => setCount(e.target.value)}
            placeholder="0"
            className="w-full bg-slate-50 rounded-xl px-4 py-3 mt-1 text-gray-700 outline-none focus:ring-2 focus:ring-water-400"
          />
        </div>
      </div>

      {/* 总重量 */}
      <div>
        <label className="text-xs text-gray-400">总重量（如：3.5斤）</label>
        <input
          type="text"
          value={totalWeight}
          onChange={e => setTotalWeight(e.target.value)}
          placeholder="选填"
          className="w-full bg-slate-50 rounded-xl px-4 py-3 mt-1 text-gray-700 outline-none focus:ring-2 focus:ring-water-400"
        />
      </div>

      {/* 备注 */}
      <div>
        <label className="text-xs text-gray-400">备注（饵料、心得...）</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="选填"
          rows={3}
          className="w-full bg-slate-50 rounded-xl px-4 py-3 mt-1 text-gray-700 outline-none focus:ring-2 focus:ring-water-400 resize-none"
        />
      </div>

      {score && (
        <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm">
          <span className="text-gray-400">当天钓鱼指数：</span>
          <span className="font-bold" style={{ color: score.color }}>{score.label}({score.total}分)</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-slate-100 text-gray-500 py-3 rounded-xl font-medium"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-water-600 text-white py-3 rounded-xl font-medium hover:bg-water-700"
        >
          保存
        </button>
      </div>
    </div>
  );
}
