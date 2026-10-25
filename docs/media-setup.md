# Making pictures: setup

Steps for turning on picture-making (branch `media`). Videos come later and will add `FAL_KEY`.

1. **Supabase SQL editor** (project Bluey-AI-Friend): paste and run `supabase/media_v1.sql`.
   It creates the `creations` table, the `reserve_creation` function, and the private `creations` bucket.
   Running it twice is safe. Undo: `supabase/media_v1_down.sql` (empty the bucket first).
2. **Supabase → Project Settings → API Keys**: copy a **secret** key (`sb_secret_…`).
3. **Vercel → bluey-ai-friend → Settings → Environment Variables**, for **Production and Preview**:
   - `SUPABASE_SECRET_KEY` = that secret key (mark it Sensitive). It stays on the server.
   - `SUPABASE_URL` is already set for Production; add it for Preview too (`https://pmvgicmongeqlgzfmqmj.supabase.co`).
   - Optional, the code has these defaults: `MEDIA_IMAGE_MODEL=gpt-image-2.5-flare`, `MEDIA_IMAGE_QUALITY=medium`,
     `MEDIA_DAILY_LIMIT_IMAGE=10`, `MEDIA_DAILY_LIMIT_VIDEO=2`.
4. **To test on a preview link**, Google sign-in has to be allowed to come back to it:
   Supabase → Authentication → URL Configuration → Redirect URLs → add
   `https://bluey-ai-friend-*-power-quote.vercel.app/**`.
5. Open the preview, sign in, and say "make me a picture of a golden retriever in a red canoe at sunrise".

Cost: about 1 cent per picture at medium quality (measured 2026-10-25: $0.0108 for a 1536×1024 picture).
Each picture's model and cost estimate are saved in `creations.cost_estimate` and in the Vercel logs
(`Bluey media made`).
