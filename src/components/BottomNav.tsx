import { Home, ClipboardList, Settings } from 'lucide-react';

interface Props {
  active: string;
  onChange: (tab: string) => void;
}

const TABS = [
  { id: 'home', label: '钓点', icon: Home },
  { id: 'log', label: '渔获', icon: ClipboardList },
  { id: 'settings', label: '设置', icon: Settings },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center justify-center gap-1 w-20 h-full transition-colors ${
                isActive ? 'text-water-600' : 'text-gray-400'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
