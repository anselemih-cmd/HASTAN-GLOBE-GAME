/* =========================================================
   HASTAN GAME
   SUPABASE CONFIG
   ========================================================= */

import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


const SUPABASE_URL =
    "https://yhglpcabpbnvpetkoffa.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_GSTiOUbO2ZE73qc3lbNQBQ_8UKfu1Um";


export const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );