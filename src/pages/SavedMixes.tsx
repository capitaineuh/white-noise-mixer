
import React from 'react';
import { useSoundContext } from '../contexts/SoundContext';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Play, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const SavedMixes: React.FC = () => {
  const { savedMixes, loadMix, setSavedMixes, sounds } = useSoundContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Rediriger vers la page d'accueil si l'utilisateur n'est pas connecté
  React.useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleLoadMix = (mixId: string) => {
    loadMix(mixId);
    navigate('/');
  };

  const handleDeleteMix = (mixId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSavedMixes(prev => prev.filter(mix => mix.id !== mixId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-mindful">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Mes mixes sauvegardés</h1>
          <p className="text-mindful-300">
            Retrouvez vos combinaisons de sons préférées
          </p>
        </div>

        {savedMixes.length === 0 ? (
          <div className="text-center py-16 bg-mindful-800/50 rounded-lg border border-mindful-700">
            <p className="text-xl text-mindful-300 mb-4">
              Vous n'avez pas encore de mixes sauvegardés
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Créer un mix
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedMixes.map(mix => (
              <div 
                key={mix.id}
                onClick={() => handleLoadMix(mix.id)}
                className="glass-card p-5 rounded-lg cursor-pointer hover:bg-mindful-700/50 transition-all animate-fade-in"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-medium text-white">{mix.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeleteMix(mix.id, e)}
                    className="text-mindful-400 hover:text-white hover:bg-destructive/20"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                
                <div className="text-sm text-mindful-300 mb-4">
                  Créé le {new Date(mix.date).toLocaleDateString()}
                </div>
                
                <div className="mb-5">
                  <h4 className="text-mindful-200 mb-2 text-sm">Sons inclus:</h4>
                  <div className="flex flex-wrap gap-2">
                    {mix.sounds.map(sound => {
                      const soundInfo = sounds.find(s => s.id === sound.id);
                      return (
                        <span 
                          key={sound.id}
                          className="px-2 py-1 text-xs rounded-full bg-mindful-700 text-mindful-200"
                        >
                          {soundInfo?.name || sound.id}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  <span>Charger ce mix</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedMixes;
