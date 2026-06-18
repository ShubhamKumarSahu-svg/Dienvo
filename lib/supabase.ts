import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
export const createSupabaseClient = () => {
  const isServer = typeof window === 'undefined';
  const key = (isServer && process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const options = isServer && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? {}
    : {
        async accessToken() {
          return (await auth()).getToken();
        },
      };

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    options
  );
};
