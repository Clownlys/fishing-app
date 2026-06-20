import { Info, Wind, Droplets } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen pb-20 bg-slate-100">
      <header className="bg-gradient-to-br from-water-600 to-water-800 text-white px-5 pt-12 pb-8">
        <h1 className="text-2xl font-bold">⚙️ 设置</h1>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-4 space-y-4">
        {/* 数据来源 */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">📡 数据来源</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Wind size={16} className="text-gray-400" />
              <span className="text-gray-500">天气数据：</span>
              <a href="https://open-meteo.com" className="text-water-600 font-medium">Open-Meteo</a>
            </div>
            <div className="flex items-center gap-2">
              <Droplets size={16} className="text-gray-400" />
              <span className="text-gray-500">气压趋势：</span>
              <span className="text-gray-700">GFS 气象模型</span>
            </div>
          </div>
          <p className="text-xs text-gray-300 mt-2">所有天气数据免费提供，更新频率约1小时。</p>
        </section>

        {/* 关于 */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">ℹ️ 关于</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-gray-400" />
              <span>鱼讯 v1.0.0</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              一款为中国钓鱼爱好者设计的天气助手。融合气压、风力风向、温度、降水、云量等多因子分析，
              帮你判断"今天该不该出钓"。
            </p>
          </div>
        </section>

        {/* 钓鱼指数说明 */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">📖 钓鱼指数怎么算</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <span className="font-medium text-water-600">气压趋势（35%）</span>
              <p className="text-xs text-gray-400 mt-1">
                气压缓慢下降时鱼最活跃觅食；骤降会让鱼浮头；骤升让鱼不适应。稳定气压意味着正常鱼情。
              </p>
            </div>
            <div>
              <span className="font-medium text-water-600">风力风向（20%）</span>
              <p className="text-xs text-gray-400 mt-1">
                1-3级微风最佳，增加溶氧。东北风是中国钓友公认最佳风向；西南风最差。
              </p>
            </div>
            <div>
              <span className="font-medium text-water-600">温度（15%）</span>
              <p className="text-xs text-gray-400 mt-1">
                18-28°C最适。24小时内温差超过6°C鱼需要适应，不利。
              </p>
            </div>
            <div>
              <span className="font-medium text-water-600">降水（15%）</span>
              <p className="text-xs text-gray-400 mt-1">
                小雨增加溶氧和食物，是钓鱼好时机。大雨搅浑水质则不宜。
              </p>
            </div>
            <div>
              <span className="font-medium text-water-600">云量（15%）</span>
              <p className="text-xs text-gray-400 mt-1">
                阴天散射光下鱼更敢到浅水觅食。晴天光线强鱼偏深水。
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
