import { createClient } from '@supabase/supabase-js';

// Using the keys provided in the prompt
const supabaseUrl = 'https://ofizytudknfdaevhfqdj.supabase.co';
const supabaseKey = 'sb_publishable__viaQHb3aVkGFC0xx0YD0w_BoEAQmN7'; // Normally this would be in process.env

export const supabase = createClient(supabaseUrl, supabaseKey);