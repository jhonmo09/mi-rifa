-- Dinamica del sorteo: como se elige al ganador.
-- Se muestra en la pagina publica de la rifa, debajo del bloque de datos.
alter table public.raffles add column if not exists draw_rules text;
