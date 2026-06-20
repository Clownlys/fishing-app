import { useState } from 'react';
import { ArrowLeft, Search, MapPin, Loader2, Plus, Navigation } from 'lucide-react';
import type { Spot } from '../types';
import { searchLocation } from '../lib/weather';
import { saveSpot, generateId } from '../lib/storage';

interface Props {
  onBack: () => void;
  onSaved: () => void;
}

interface SearchResult {
  name: string;
  lat: number;
  lon: number;
  admin?: string;
}

export default function AddSpotPage({ onBack, onSaved }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [spotName, setSpotName] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [type, setType] = useState<'freshwater' | 'saltwater'>('freshwater');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await searchLocation(query);
      setResults(res);
    } catch (e) {
      console.error(e);
    }
    setSearching(false);
  };

  const handleSelectResult = (r: SearchResult) => {
    setSpotName(r.name);
    setLat(r.lat.toFixed(4));
    setLon(r.lon.toFixed(4));
    setManualMode(true);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert('你的设备不支持定位');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        if (!spotName) setSpotName('当前位置');
        setManualMode(true);
      },
      err => alert('定位失败: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = () => {
    if (!spotName.trim() || !lat || !lon) {
      alert('请填写完整信息');
      return;
    }
    const spot: Spot = {
      id: generateId(),
      name: spotName.trim(),
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      type,
      createdAt: new Date().toISOString(),
    };
    saveSpot(spot);
    onSaved();
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-100">
      <header className="bg-gradient-to-br from-water-600 to-water-800 text-white px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button onClick={onBack} className="p-1">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">添加钓点</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {/* 搜索 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="搜索地名，如：洞庭湖、橘子洲..."
              className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-gray-700 outline-none focus:ring-2 focus:ring-water-400"
            />
            <button
              onClick={handleSearch}
              className="bg-water-600 text-white px-4 rounded-xl hover:bg-water-700"
            >
              {searching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            </button>
          </div>

          {/* GPS */}
          <button
            onClick={handleGPS}
            className="w-full mt-2 flex items-center justify-center gap-2 text-water-600 text-sm font-medium py-2"
          >
            <Navigation size={16} />
            使用当前位置定位
          </button>

          {/* 搜索结果 */}
          {results.length > 0 && (
            <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectResult(r)}
                  className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-slate-50 text-left"
                >
                  <MapPin size={16} className="text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-700">{r.name}</div>
                    {r.admin && <div className="text-xs text-gray-400">{r.admin}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 手动填写 */}
        {manualMode && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 page-transition">
            <h2 className="font-semibold text-gray-700">确认钓点信息</h2>

            <div>
              <label className="text-xs text-gray-400">钓点名称</label>
              <input
                type="text"
                value={spotName}
                onChange={e => setSpotName(e.target.value)}
                placeholder="给这个钓点起个名字"
                className="w-full bg-slate-50 rounded-xl px-4 py-3 mt-1 text-gray-700 outline-none focus:ring-2 focus:ring-water-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">纬度</label>
                <input
                  type="text"
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 mt-1 text-gray-700 outline-none focus:ring-2 focus:ring-water-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">经度</label>
                <input
                  type="text"
                  value={lon}
                  onChange={e => setLon(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 mt-1 text-gray-700 outline-none focus:ring-2 focus:ring-water-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400">水域类型</label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setType('freshwater')}
                  className={`flex-1 py-3 rounded-xl font-medium ${
                    type === 'freshwater' ? 'bg-water-600 text-white' : 'bg-slate-50 text-gray-500'
                  }`}
                >
                  🏞️ 淡水
                </button>
                <button
                  onClick={() => setType('saltwater')}
                  className={`flex-1 py-3 rounded-xl font-medium ${
                    type === 'saltwater' ? 'bg-water-600 text-white' : 'bg-slate-50 text-gray-500'
                  }`}
                >
                  🌊 海水
                </button>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-water-600 text-white py-3.5 rounded-xl font-medium hover:bg-water-700 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              保存钓点
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
