UPDATE public.players
SET image_url = REPLACE(image_url, 'https://dpykmhmdgvmqcehjuusn.supabase.co/storage/', 'https://pvpshyoaregroihwglye.supabase.co/storage/')
WHERE image_url LIKE 'https://dpykmhmdgvmqcehjuusn.supabase.co/storage/%';