import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type Profile = {
  role: 'client' | 'driver' | 'admin';
  full_name: string | null;
  avatar_url: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('role, full_name, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (isMounted) {
          setProfile(data);
          setSession(session);
          setUser(session.user);
        }
      }
      if (isMounted) setIsLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('role, full_name, avatar_url')
          .eq('id', newSession.user.id)
          .single();

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

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
