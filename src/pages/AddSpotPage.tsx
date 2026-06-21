import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, MapPin, Loader2, Plus, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Spot } from '../types';
import { searchLocation } from '../lib/weather';
import { saveSpot, generateId } from '../lib/storage';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 天地图 token（浏览器端）
const TDT_TK = 'f5a8cc773db5eb97a2b5658939aeb549';

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
  const [locating, setLocating] = useState(false);

  // Map state
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [28.2, 112.9], // 默认长沙
      zoom: 11,
      zoomControl: false,
    });

    // 天地图矢量底图
    L.tileLayer(`https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=${TDT_TK}`, {
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maxZoom: 18,
      attribution: '© 天地图',
    }).addTo(map);

    // 天地图矢量注记（中文地名标注）
    L.tileLayer(`https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=${TDT_TK}`, {
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 点击地图选点
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: la, lng: ln } = e.latlng;
      setLat(la.toFixed(6));
      setLon(ln.toFixed(6));

      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        markerRef.current = L.marker(e.latlng).addTo(map);
      }

      if (!spotName) setSpotName('地图选点');
      setManualMode(true);
    });

    mapInstance.current = map;

    // 尝试定位到用户位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => map.setView([pos.coords.latitude, pos.coords.longitude], 13),
        () => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    }

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Search via multiple providers
  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      // Try Open-Meteo first
      let res = await searchLocation(query);

      // Fallback: OSM Nominatim for better Chinese support
      if (res.length === 0) {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&accept-language=zh&countrycodes=cn`
        ).then(r => r.json()).catch(() => []);

        res = osmRes.map((r: any) => ({
          name: r.display_name.split(',')[0],
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
          admin: r.display_name.split(',').slice(1, 3).join(',').trim(),
        }));
      }

      setResults(res);

      // 如果有结果，移动地图到第一个
      if (res.length > 0 && mapInstance.current) {
        mapInstance.current.setView([res[0].lat, res[0].lon], 14);
      }
    } catch (e) {
      console.error(e);
    }
    setSearching(false);
  };

  const handleSelectResult = (r: SearchResult) => {
    setSpotName(r.name);
    setLat(r.lat.toFixed(6));
    setLon(r.lon.toFixed(6));

    // 移动地图并放置标记
    if (mapInstance.current) {
      mapInstance.current.setView([r.lat, r.lon], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([r.lat, r.lon]);
      } else {
        markerRef.current = L.marker([r.lat, r.lon]).addTo(mapInstance.current);
      }
    }
    setManualMode(true);
  };

  // 两级 GPS 定位
  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert('你的设备不支持定位');
      return;
    }
    setLocating(true);

    // 第一级：低精度快速定位（Wi-Fi/基站）
    navigator.geolocation.getCurrentPosition(
      pos => {
        const la = pos.coords.latitude;
        const ln = pos.coords.longitude;
        setLat(la.toFixed(6));
        setLon(ln.toFixed(6));
        if (!spotName) setSpotName('当前位置');

        if (mapInstance.current) {
          mapInstance.current.setView([la, ln], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([la, ln]);
          } else {
            markerRef.current = L.marker([la, ln]).addTo(mapInstance.current);
          }
        }
        setManualMode(true);
        setLocating(false);
      },
      _err => {
        // 第二级：高精度 GPS 定位
        navigator.geolocation.getCurrentPosition(
          pos => {
            const la = pos.coords.latitude;
            const ln = pos.coords.longitude;
            setLat(la.toFixed(6));
            setLon(ln.toFixed(6));
            if (!spotName) setSpotName('当前位置');

            if (mapInstance.current) {
              mapInstance.current.setView([la, ln], 16);
              if (markerRef.current) {
                markerRef.current.setLatLng([la, ln]);
              } else {
                markerRef.current = L.marker([la, ln]).addTo(mapInstance.current);
              }
            }
            setManualMode(true);
            setLocating(false);
          },
          _err2 => {
            setLocating(false);
            alert('定位失败：请在下方地图上点击钓点位置');
          },
          { enableHighAccuracy: true, timeout: 15000 }
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
    );
  };

  const handleSave = () => {
    if (!spotName.trim() || !lat || !lon) {
      alert('请先在地图上点击选择钓点位置');
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
        <div className="bg-white rounded-2xl shadow-sm p-4" style={{ position: 'relative', zIndex: 1000 }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="搜索地名（水库、河流、村镇）"
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
            disabled={locating}
            className="w-full mt-2 flex items-center justify-center gap-2 text-water-600 text-sm font-medium py-2 disabled:opacity-50"
          >
            {locating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                正在定位...
              </>
            ) : (
              <>
                <Navigation size={16} />
                使用当前位置定位
              </>
            )}
          </button>

          {/* 搜索结果 */}
          {results.length > 0 && (
            <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectResult(r)}
                  className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-slate-50 text-left"
                >
                  <MapPin size={16} className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-700 truncate">{r.name}</div>
                    {r.admin && <div className="text-xs text-gray-400 truncate">{r.admin}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 地图选点 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-gray-700">📍 在地图上点击选择钓点</h2>
          </div>
          <div ref={mapRef} className="w-full" style={{ height: '300px' }} />
          <div className="px-4 py-3 text-xs text-gray-400 text-center">
            点击地图上的位置即可标记钓点
          </div>
        </div>

        {/* 已选钓点信息 */}
        {manualMode && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 page-transition" style={{ position: 'relative', zIndex: 500 }}>
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
