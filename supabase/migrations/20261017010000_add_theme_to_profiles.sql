-- Migration: Add theme column to profiles table for cross-device theme persistence
-- Safe, idempotent migration

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'warm-brass';
