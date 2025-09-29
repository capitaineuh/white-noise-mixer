import React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme === 'dark') || (theme === 'system' && resolvedTheme === 'dark');

  return (
    <Button
      variant="outline"
      className="flex items-center gap-2 border-mindful-700 bg-transparent text-foreground hover:bg-muted"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Basculer le thème"
      title="Basculer le thème"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="hidden sm:inline">{isDark ? 'Clair' : 'Sombre'}</span>
    </Button>
  );
};

export default ThemeToggle;


