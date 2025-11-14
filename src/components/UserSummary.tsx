import { useState, useEffect } from 'react';
import { X, Loader2, User, FileText, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface UserSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  character_mode: string;
  profile_summary: string;
  case_file: any;
  personal_notes: any;
  chaos_profile: any;
  conversation_count: number;
  last_updated: string;
}

const characterConfig = {
  batman: {
    title: "BATMAN'S CASE FILE",
    icon: '🦇',
    color: 'text-yellow-400',
    bgGradient: 'from-slate-900 via-slate-800 to-yellow-900/20',
    borderColor: 'border-yellow-400/30',
    emptyMessage: 'Case file not yet initiated. Begin conversation to build intelligence.',
  },
  alfred: {
    title: "ALFRED'S PERSONAL DIARY",
    icon: '🎩',
    color: 'text-gray-300',
    bgGradient: 'from-slate-900 via-slate-700 to-gray-800/30',
    borderColor: 'border-gray-400/30',
    emptyMessage: 'Personal file not yet created. I shall begin observations upon our first conversation.',
  },
  joker: {
    title: "JOKER'S CHAOS PROFILE",
    icon: '🃏',
    color: 'text-purple-400',
    bgGradient: 'from-slate-900 via-purple-900/30 to-green-900/20',
    borderColor: 'border-purple-400/30',
    emptyMessage: 'HAHAHA! No chaos profile yet! Let\'s have some FUN first!',
  },
};

export default function UserSummary({ isOpen, onClose, userId }: UserSummaryProps) {
  const { theme } = useTheme();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'batman' | 'alfred' | 'joker'>('batman');

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfiles();
    }
  }, [isOpen, userId]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/get-user-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profiles');
      }

      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getProfileForCharacter = (character: string): UserProfile | undefined => {
    return profiles.find(p => p.character_mode === character);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  const config = characterConfig[activeTab];
  const currentProfile = getProfileForCharacter(activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-xl border-2 ${config.borderColor} bg-gradient-to-br ${config.bgGradient} shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <User className={`w-6 h-6 ${config.color}`} />
            <h2 className={`text-2xl font-bold ${config.color} tracking-wider`}>
              USER INTELLIGENCE PROFILES
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Character Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-900/80">
          {(['batman', 'alfred', 'joker'] as const).map((char) => {
            const charConfig = characterConfig[char];
            const charProfile = getProfileForCharacter(char);
            const isActive = activeTab === char;

            return (
              <button
                key={char}
                onClick={() => setActiveTab(char)}
                className={`flex-1 px-6 py-4 text-center font-bold tracking-wide transition-all border-b-2 ${
                  isActive
                    ? `${charConfig.color} ${charConfig.borderColor} bg-slate-800/50`
                    : 'text-gray-500 border-transparent hover:bg-slate-800/30 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">{charConfig.icon}</span>
                  <span>{char.toUpperCase()}</span>
                  {charProfile && (
                    <span className="ml-2 text-xs bg-slate-700 px-2 py-1 rounded-full">
                      {charProfile.conversation_count} conv.
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className={`w-12 h-12 ${config.color} animate-spin`} />
              <p className="text-gray-400">Loading intelligence data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-red-400 text-center">
                <p className="text-lg font-bold">ERROR</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : currentProfile ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div>
                  <h3 className={`text-xl font-bold ${config.color} mb-1`}>
                    {config.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Last Updated: {formatDate(currentProfile.last_updated)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total Conversations</p>
                  <p className={`text-3xl font-bold ${config.color}`}>
                    {currentProfile.conversation_count}
                  </p>
                </div>
              </div>

              {/* Profile Summary */}
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className={`w-5 h-5 ${config.color}`} />
                  <h4 className={`font-bold ${config.color} text-lg`}>
                    PROFILE SUMMARY
                  </h4>
                </div>
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 leading-relaxed">
                    {currentProfile.profile_summary}
                  </pre>
                </div>
              </div>

              {/* Character-specific metadata */}
              {activeTab === 'batman' && currentProfile.case_file && Object.keys(currentProfile.case_file).length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-6 border border-yellow-400/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h4 className="font-bold text-yellow-400 text-lg">CASE FILE DATA</h4>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300">
                    {JSON.stringify(currentProfile.case_file, null, 2)}
                  </pre>
                </div>
              )}

              {activeTab === 'alfred' && currentProfile.personal_notes && Object.keys(currentProfile.personal_notes).length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-6 border border-gray-400/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-gray-400" />
                    <h4 className="font-bold text-gray-400 text-lg">PERSONAL NOTES</h4>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300">
                    {JSON.stringify(currentProfile.personal_notes, null, 2)}
                  </pre>
                </div>
              )}

              {activeTab === 'joker' && currentProfile.chaos_profile && Object.keys(currentProfile.chaos_profile).length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-400/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <h4 className="font-bold text-purple-400 text-lg">CHAOS DATA</h4>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300">
                    {JSON.stringify(currentProfile.chaos_profile, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="text-6xl mb-4">{config.icon}</div>
              <p className="text-lg text-gray-400 max-w-md">
                {config.emptyMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
