import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Users, PlusCircle, BarChart3, Settings } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/roster', icon: Users, label: 'Roster' },
  { path: '/new-outing', icon: PlusCircle, label: 'New', accent: true },
  { path: '/stats', icon: BarChart3, label: 'Stats' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all',
                item.accent && 'relative -mt-4',
                isActive && !item.accent && 'text-accent',
                !isActive && !item.accent && 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.accent ? (
                <div className={cn(
                  'flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95',
                  'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground'
                )}>
                  <Icon className="w-7 h-7" />
                </div>
              ) : (
                <>
                  <Icon className={cn('w-6 h-6', isActive && 'scale-110')} />
                  <span className="text-[10px] font-medium mt-1">{item.label}</span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
