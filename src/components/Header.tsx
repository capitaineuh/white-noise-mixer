import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, SaveAll } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSoundContext } from '@/contexts/SoundContext';
import SaveMixDialog from '@/components/SaveMixDialog';
import LoadMixDialog from '@/components/LoadMixDialog';
import TimerDialog from '@/components/TimerDialog';
import TimerDisplay from '@/components/TimerDisplay';
import PWAInstallButton from '@/components/PWAInstallButton';

const Header: React.FC = () => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const location = useLocation();
  const { setTimer, remainingTime, clearTimer } = useSoundContext();
  
  return (
    <header className="w-full px-6 py-4 bg-mindful-900/50 backdrop-blur-md border-b border-mindful-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded flex items-center justify-center bg-gradient-to-br from-primary to-primary/70">
            <span className="text-white font-bold text-lg transform -translate-y-0.5">BB</span>
          </div>
          <h1 className="text-primary">
            Bruits<span className="text-xl font-semibold text-white">Blancs</span>
          </h1>
        </Link>
        
        <div className="flex items-center gap-3">
          <PWAInstallButton />
          
          {user && (
            <>
              {remainingTime !== null && (
                <TimerDisplay
                  remainingTime={remainingTime}
                  onClear={clearTimer}
                />
              )}
              <TimerDialog onSetTimer={setTimer} />
              <Link to="/saved-mixes">
                <Button 
                  variant="outline" 
                  className={`
                    flex items-center gap-2 border-mindful-700 
                    ${location.pathname === '/saved-mixes' 
                      ? 'bg-mindful-700 text-white' 
                      : 'bg-transparent text-white hover:bg-mindful-800'}
                  `}
                >
                  <SaveAll size={16} />
                  <span className="hidden sm:inline">Mes mixes</span>
                </Button>
              </Link>
            </>
          )}
          
          {loading ? (
            <Button 
              disabled
              className="bg-mindful-700 text-white/70"
            >
              <span className="animate-pulse">Chargement...</span>
            </Button>
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-white/70 pr-2">
                <User size={14} />
                <span className="text-sm truncate max-w-[100px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </div>
              
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent border-mindful-700 text-white hover:bg-mindful-800"
                onClick={() => signOut()}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          ) : (
            <Button
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
              onClick={() => signInWithGoogle()}
            >
              <LogIn size={16} />
              <span>Connexion</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
