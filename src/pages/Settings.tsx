import { BottomNav } from '@/components/hitting/BottomNav';
import { PageHeader } from '@/components/hitting/PageHeader';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronRight, Moon, Download, Trash2, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Settings" />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Preferences</h3>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <Label htmlFor="darkMode">Dark Mode</Label>
              </div>
              <Switch
                id="darkMode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </div>
        </div>

        {/* Data */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Data</h3>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            <button className="flex items-center justify-between p-4 w-full text-left hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-muted-foreground" />
                <span>Export Data</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="flex items-center justify-between p-4 w-full text-left hover:bg-muted/50 transition-colors text-destructive">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5" />
                <span>Clear All Data</span>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* About */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">About</h3>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            <button className="flex items-center justify-between p-4 w-full text-left hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-muted-foreground" />
                <span>About Bat Trax</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Version */}
        <div className="text-center pt-8">
          <p className="text-sm text-muted-foreground">Bat Trax v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">Built with ❤️ for baseball</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
