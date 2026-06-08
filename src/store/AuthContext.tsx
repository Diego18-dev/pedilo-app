import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type Profile = {
  role: 'client' | 'driver' | 'admin';
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name, phone, avatar_url')
      .eq('id', userId)
      .single();
    return data as Profile | null;
  };

  const refreshProfile = async () => {
    if (!user) return;
    const data = await fetchProfile(user.id);
    setProfile(data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        const data = await fetchProfile(newSession.user.id);
        setProfile(data);
        setSession(newSession);
        setUser(newSession.user);
      } else {
        setProfile(null);
        setSession(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
