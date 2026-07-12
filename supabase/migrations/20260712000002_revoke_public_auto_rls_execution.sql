-- PostgreSQL grants EXECUTE to PUBLIC by default; revoking only anon and
-- authenticated is insufficient because both roles inherit PUBLIC privileges.
revoke execute on function public.rls_auto_enable() from public;
