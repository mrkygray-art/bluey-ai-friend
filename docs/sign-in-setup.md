# Turning on sign-in for Bluey

Bluey works without an account, and that never changes. Signing in is optional: it just lets
what Bluey remembers follow a person to their other devices. The code is already live (`account.js`);
the + menu item stays hidden until at least one sign-in method is switched on below.

To preview the sign-in screen on one device before then, open
`https://bluey-ai-friend.vercel.app/?signin=1`: it shows the methods already switched on (email first). `?signin=all` shows every button, and `?signin=0` hides it again.

All of this happens in the Supabase dashboard for the project **Bluey-AI-Friend**
(https://supabase.com/dashboard/project/pmvgicmongeqlgzfmqmj).

## 1. Create the tables (once, about 1 minute)

1. Left sidebar: **SQL Editor** → **New query**.
2. Open `supabase/accounts_v1.sql` from this repo, copy all of it, paste it in.
3. Click **Run**. You should see "Success. No rows returned".

This adds four tables (profiles, memories, conversations, messages). Each person can only see and
change their own rows; signed-out visitors can't read anything. It doesn't touch the old
`bluey_memories` beta table.

## 2. Tell Supabase where Bluey lives (once)

1. **Authentication** → **URL Configuration**.
2. **Site URL**: `https://bluey-ai-friend.vercel.app`
3. **Redirect URLs** → **Add URL**: `https://bluey-ai-friend.vercel.app/**`
   (and `http://localhost:3210/**` for testing with `vercel dev`).
4. **Save**.

## 3. Email sign-in (works with any email address, including iPhone users)

Email is switched on by default (**Authentication** → **Sign In / Providers** → **Email**).

1. **Authentication** → **Emails** → **Magic Link** template. Add this line to the message body,
   so people using Bluey from the iPhone home screen can type the code instead of tapping the link
   (a link opens Safari, which is a separate app on iPhone):

   `<p>Or type this code in Bluey: <strong>{{ .Token }}</strong></p>`

2. **Important:** Supabase's built-in email only sends to members of your Supabase team, and only a
   few per hour. It's fine for testing with your own address. Before inviting other people, set up
   your own email sender: **Authentication** → **Emails** → **SMTP Settings**. Resend
   (resend.com) has a free plan and a Supabase guide; it needs a domain you own to send from.

## 4. Google sign-in ("Continue with Google")

1. Go to https://console.cloud.google.com → create a project (for example "Bluey").
2. **APIs & Services** → **OAuth consent screen**: External, app name **Bluey**, your support email,
   then publish the app.
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID** →
   **Web application**.
   - Authorized JavaScript origins: `https://bluey-ai-friend.vercel.app`
   - Authorized redirect URIs: `https://pmvgicmongeqlgzfmqmj.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client secret**.
5. Supabase: **Authentication** → **Sign In / Providers** → **Google** → turn it on, paste both,
   **Save**.

## 5. Apple sign-in ("Continue with Apple")

Needs a paid Apple Developer Program membership ($99 a year, developer.apple.com/programs).
iPhone users can already sign in with email or Google without it.

1. developer.apple.com → **Certificates, Identifiers & Profiles** → **Identifiers** → **+** →
   **Services IDs** (for example `app.vercel.bluey.signin`). Turn on **Sign in with Apple** →
   **Configure**: domain `pmvgicmongeqlgzfmqmj.supabase.co`, return URL
   `https://pmvgicmongeqlgzfmqmj.supabase.co/auth/v1/callback`.
2. **Keys** → **+** → turn on **Sign in with Apple** → download the `.p8` key file. Note the Key ID
   and your Team ID.
3. Supabase: **Authentication** → **Sign In / Providers** → **Apple** → turn it on. Follow the
   screen to make the secret from the Services ID, Team ID, Key ID, and `.p8` file.
   Apple secrets expire after 6 months, so set a reminder to make a new one.

## 6. Switch the buttons on

Tell Claude which methods are ready. It changes one line in `account.js`
(`const READY=['email','google']`, for example), and the **Sign in (optional)** item appears in the
blue + menu for everyone.
