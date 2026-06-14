'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function ResetPage() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    // 1. מחק את הקוקי
    document.cookie = 'onboarding_done=; path=/; max-age=0';

    // 2. מחק מ-localStorage
    localStorage.removeItem('easyprep_profile');

    // 3. מחק מ-Clerk unsafeMetadata
    user?.update({ unsafeMetadata: { profile: null } }).catch(() => {});

    // 4. עבור לאונבורדינג
    router.push('/onboarding');
  }, [user, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
      <p style={{ color: '#14422d', fontSize: 16 }}>מאפס...</p>
    </div>
  );
}
