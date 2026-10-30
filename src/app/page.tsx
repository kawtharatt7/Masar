'use client';

import { ReactNode, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import type { ProfileRow } from '@/lib/types';
import Landing from '@/components/Landing';
import Welcome from '@/components/Welcome';
import Onboarding from '@/components/Onboarding';
import Profile from '@/components/Profile';
import Assess from '@/components/Assess';
import { Logo } from '@/components/Logo';

function Splash() {
  return (
    <div className="splash">
      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}>
        <Logo size={44} />
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { user, ready, signOut } = useAuth();
  const { t } = useI18n();
  const [showAuth, setShowAuth] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null | undefined>(undefined);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setProfile(undefined);
      setEditing(false);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setLoadError(error.message);
        else setProfile((data as ProfileRow | null) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  let key: string;
  let node: ReactNode;

  if (!ready) {
    key = 'splash';
    node = <Splash />;
  } else if (!user) {
    key = showAuth ? 'auth' : 'landing';
    node = showAuth ? <Welcome onBack={() => setShowAuth(false)} /> : <Landing onStart={() => setShowAuth(true)} />;
  } else if (loadError) {
    key = 'error';
    node = (
      <div className="shell narrow stack">
        <h2>{t('profileLoadFailed')}</h2>
        <p className="msg msg-error" role="alert">
          {loadError}
        </p>
        <div className="actions">
          <button className="btn btn-outline" type="button" onClick={signOut}>
            {t('signOut')}
          </button>
        </div>
      </div>
    );
  } else if (profile === undefined) {
    key = 'splash';
    node = <Splash />;
  } else if (!profile?.nickname || !profile?.avatar) {
    key = 'onboarding';
    node = <Onboarding initial={profile} onSaved={setProfile} />;
  } else if (!profile?.target_role || editing) {
    key = 'profile';
    node = (
      <Profile
        initial={profile}
        onSaved={(p) => {
          setProfile(p);
          setEditing(false);
        }}
        onCancel={profile?.target_role ? () => setEditing(false) : undefined}
      />
    );
  } else {
    key = 'assess';
    node = <Assess profile={profile} onEditProfile={() => setEditing(true)} onProfileUpdate={setProfile} />;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {node}
      </motion.div>
    </AnimatePresence>
  );
}
