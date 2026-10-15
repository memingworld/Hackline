-- ==============================================================================
-- Hackline: Supabase Native pg_cron Telegram Dispatch Setup (Optional / Free Alternative)
-- ==============================================================================
-- If you are deploying on Vercel's Hobby (Free) tier which limits Vercel crons
-- to once per day, you can run this script directly in your Supabase SQL Editor
-- to trigger the dispatch endpoint every 10 minutes natively via Postgres.
-- ==============================================================================

-- 1. Enable pg_cron and pg_net extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Schedule the HTTP POST request every 10 minutes
-- REPLACE `https://your-domain.vercel.app` with your deployed Vercel URL
/*
select cron.schedule(
  'hackline-telegram-dispatch-10min',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://your-domain.vercel.app/api/notifications/telegram/dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-dispatch', 'true'
    ),
    body := '{}'::jsonb
  );
  $$
);
*/

-- To unschedule or inspect scheduled jobs:
-- select * from cron.job;
-- select cron.unschedule('hackline-telegram-dispatch-10min');
