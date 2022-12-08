// import { createClient } from '@supabase/supabase-js'

// const supabaseClient = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// )

// export { supabaseClient }

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
// import { Database } from '../db_types';

export default createBrowserSupabaseClient();