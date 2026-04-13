--
-- PostgreSQL database dump
--

\restrict 3XSl4bvhZ6xTOEncL5fGZvgAnTxyNRZCDJSjt1XbTlGGFRUD36ydDuZNRbSm7NV

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: ajustar_estoque(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ajustar_estoque(produto_id uuid, quantidade integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE produtos 
  SET estoque = estoque - quantidade,
      updated_at = NOW()
  WHERE id = produto_id;
END;
$$;


--
-- Name: atualizar_estoque_pedido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_estoque_pedido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Lógica para atualizar estoque aqui
    RETURN NEW;
END;
$$;


--
-- Name: atualizar_estoque_total(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_estoque_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    UPDATE produtos 
    SET estoque = (
      SELECT COALESCE(SUM(estoque), 0) 
      FROM produto_variacoes 
      WHERE produto_id = COALESCE(NEW.produto_id, OLD.produto_id)
    )
    WHERE id = COALESCE(NEW.produto_id, OLD.produto_id);
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: atualizar_estoque_total_produto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_estoque_total_produto() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Atualiza o estoque de TODOS os produtos que têm variações
  UPDATE produtos p
  SET estoque = (
    SELECT COALESCE(SUM(pv.estoque), 0)
    FROM produto_variacoes pv
    WHERE pv.produto_id = p.id
  ),
  updated_at = NOW()
  WHERE EXISTS (
    SELECT 1 FROM produto_variacoes pv WHERE pv.produto_id = p.id
  );
END;
$$;


--
-- Name: atualizar_estoque_variacao(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_estoque_variacao(p_variacao_id uuid, p_quantidade integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE produto_variacoes 
    SET estoque = estoque - p_quantidade
    WHERE id = p_variacao_id;
END;
$$;


--
-- Name: atualizar_pedido_handler(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_pedido_handler() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: atualizar_pedido_seguro(uuid, character varying, text, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_pedido_seguro(p_pedido_id uuid, p_status character varying DEFAULT NULL::character varying, p_observacoes text DEFAULT NULL::text, p_total numeric DEFAULT NULL::numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    UPDATE pedidos 
    SET 
        status = COALESCE(p_status, status),
        observacoes = COALESCE(p_observacoes, observacoes),
        total = COALESCE(p_total, total),
        updated_at = NOW()
    WHERE id = p_pedido_id;
END;
$$;


--
-- Name: atualizar_pre_pedido_apos_edicao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_pre_pedido_apos_edicao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Quando um pedido for atualizado, verificar se precisa atualizar o pre_pedido relacionado
    IF OLD.pre_pedido_id IS NOT NULL AND (OLD.status != NEW.status OR OLD.total != NEW.total) THEN
        -- Atualizar o status do pre_pedido para refletir mudanças
        UPDATE pre_pedidos 
        SET status = 'convertido',
            updated_at = NOW(),
            pedido_id = NEW.id
        WHERE id = OLD.pre_pedido_id;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: atualizar_produto_ml(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_produto_ml() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Sua lógica de integração com Mercado Livre aqui
    RETURN NEW;
END;
$$;


--
-- Name: atualizar_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: atualizar_variacao_ml(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_variacao_ml() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Insere ou atualiza registro na tabela processamento_ml
    INSERT INTO public.processamento_ml (produto_id, acao, processado, tentativas)
    VALUES (
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.produto_id
            ELSE NEW.produto_id
        END,
        CASE 
            WHEN TG_OP = 'DELETE' THEN 'DELETE'
            WHEN TG_OP = 'INSERT' THEN 'CREATE' 
            ELSE 'UPDATE'
        END,
        false,
        0
    )
    ON CONFLICT (produto_id) 
    DO UPDATE SET 
        acao = EXCLUDED.acao,
        processado = false,
        tentativas = 0,
        ultimo_erro = NULL,
        criado_em = now();
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: check_user_permissions(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_permissions(user_id uuid, table_name text, operation text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Se user_id for null, retorna false
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar se o usuário existe na tabela usuarios
  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = user_id) THEN
    -- Se não existe na tabela usuarios, criar registro básico
    INSERT INTO usuarios (id, tipo)
    VALUES (user_id, 'vendedor')
    ON CONFLICT (id) DO NOTHING;
    
    RETURN false; -- Usuário novo tem permissões mínimas
  END IF;

  -- Verificar se o usuário é admin (acesso total)
  IF EXISTS (SELECT 1 FROM usuarios WHERE id = user_id AND tipo = 'admin') THEN
    RETURN true;
  END IF;

  -- Permissões baseadas na tabela e operação
  CASE 
    WHEN table_name = 'pedido_itens' THEN
      CASE operation
        WHEN 'delete' THEN
          RETURN EXISTS (SELECT 1 FROM usuarios WHERE id = user_id AND tipo IN ('admin', 'gerente'));
        WHEN 'insert', 'update', 'select' THEN
          RETURN EXISTS (SELECT 1 FROM usuarios WHERE id = user_id AND tipo IN ('admin', 'gerente', 'vendedor'));
        ELSE
          RETURN false;
      END CASE;
    
    WHEN table_name IN ('pedidos', 'pre_pedidos') THEN
      RETURN EXISTS (SELECT 1 FROM usuarios WHERE id = user_id AND tipo IN ('admin', 'gerente', 'vendedor'));
    
    ELSE
      -- Para outras tabelas, apenas admin e gerente
      RETURN EXISTS (SELECT 1 FROM usuarios WHERE id = user_id AND tipo IN ('admin', 'gerente'));
  END CASE;
END;
$$;


--
-- Name: criar_movimento_financeiro_pedido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.criar_movimento_financeiro_pedido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Apenas processar quando o status for alterado para 'confirmado'
    IF NEW.status = 'confirmado'
       AND (OLD.status IS NULL OR OLD.status != 'confirmado') THEN

        -- Inserir movimento financeiro como receita
        INSERT INTO movimentos_financeiros (
            descricao,
            valor,
            categoria,
            tipo,
            data_movimento,
            pedido_id
        )
        VALUES (
            'Venda - Pedido ' || NEW.id,
            NEW.total,
            'Vendas',
            'receita',
            CURRENT_DATE,
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: decrementar_estoque(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrementar_estoque(produto_id uuid, quantidade integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE produtos 
  SET estoque = estoque - quantidade 
  WHERE id = produto_id;
END;
$$;


--
-- Name: decrementar_estoque(uuid, integer, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrementar_estoque(produto_id uuid, quantidade integer, tamanhos_json jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  tamanho_record RECORD;
  quantidade_tamanho INTEGER;
BEGIN
  -- Se não forem especificados tamanhos, decrementar apenas o estoque total
  IF tamanhos_json IS NULL THEN
    UPDATE produtos 
    SET estoque = estoque - quantidade 
    WHERE id = produto_id AND estoque >= quantidade;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %', produto_id;
    END IF;
  
  -- Se forem especificados tamanhos, decrementar cada tamanho individualmente
  ELSE
    FOR tamanho_record IN 
      SELECT * FROM jsonb_each_text(tamanhos_json)
    LOOP
      quantidade_tamanho := tamanho_record.value::INTEGER;
      
      -- Decrementar estoque do tamanho específico
      UPDATE produto_variacoes pv
      SET estoque = estoque - quantidade_tamanho
      WHERE pv.produto_id = decrementar_estoque.produto_id
        AND pv.tamanho_id IN (
          SELECT id FROM tamanhos WHERE nome = tamanho_record.key
        )
        AND estoque >= quantidade_tamanho;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Estoque insuficiente para o tamanho % do produto %', 
          tamanho_record.key, produto_id;
      END IF;
    END LOOP;
    
    -- Atualizar também o estoque total
    UPDATE produtos 
    SET estoque = estoque - quantidade 
    WHERE id = produto_id;
  END IF;
END;
$$;


--
-- Name: editar_itens_pedido_simples(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.editar_itens_pedido_simples(pedido_id_arg uuid, novos_itens jsonb) RETURNS void
    LANGUAGE sql
    AS $$
    DELETE FROM pedido_itens WHERE pedido_id = pedido_id_arg;
    
    INSERT INTO pedido_itens (
        pedido_id, produto_id, quantidade, preco_unitario,
        subtotal, desconto, tamanhos, filial, embargue
    )
    SELECT 
        pedido_id_arg,
        (item->>'produto_id')::UUID,
        (item->>'quantidade')::INTEGER,
        (item->>'preco_unitario')::NUMERIC,
        (item->>'subtotal')::NUMERIC,
        COALESCE((item->>'desconto')::NUMERIC, 0),
        COALESCE((item->>'tamanhos')::JSONB, '{}'::JSONB),
        COALESCE(item->>'filial', 'Matriz'),
        COALESCE(item->>'embargue', '30 dias')
    FROM jsonb_array_elements(novos_itens) AS item;
    
    UPDATE pedidos SET updated_at = NOW() WHERE id = pedido_id_arg;
$$;


--
-- Name: editar_pedido_supabase(uuid, character varying, text, numeric, character varying, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.editar_pedido_supabase(p_id uuid, p_status character varying DEFAULT NULL::character varying, p_observacoes text DEFAULT NULL::text, p_total numeric DEFAULT NULL::numeric, p_condicao_pagamento character varying DEFAULT NULL::character varying, p_cliente_id uuid DEFAULT NULL::uuid, p_usuario_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    UPDATE pedidos 
    SET 
        status = COALESCE(p_status, status),
        observacoes = COALESCE(p_observacoes, observacoes),
        total = COALESCE(p_total, total),
        condicao_pagamento = COALESCE(p_condicao_pagamento, condicao_pagamento),
        cliente_id = COALESCE(p_cliente_id, cliente_id),
        usuario_id = COALESCE(p_usuario_id, usuario_id),
        updated_at = NOW()
    WHERE id = p_id;
END;
$$;


--
-- Name: fill_usuario_nome(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fill_usuario_nome() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Esta função pode ser adaptada conforme necessidade específica
    -- Exemplo: garantir que nome não seja nulo
    IF NEW.nome IS NULL THEN
        NEW.nome = 'Usuário';
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: gerenciar_edicao_itens_pedido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerenciar_edicao_itens_pedido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE pedidos 
    SET updated_at = NOW()
    WHERE id = NEW.pedido_id;
    RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: incrementar_estoque(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.incrementar_estoque(produto_id uuid, quantidade integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE produtos 
  SET estoque = estoque + quantidade,
      updated_at = NOW()
  WHERE id = produto_id;
END;
$$;


--
-- Name: limpar_sessoes_expiradas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.limpar_sessoes_expiradas() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM cliente_sessoes 
  WHERE expira_em < NOW();
END;
$$;


--
-- Name: notify_estoque_baixo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_estoque_baixo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- Verificar se estoque ficou abaixo de 10 unidades
  if new.estoque < 10 and old.estoque >= 10 then
    insert into public.notifications (tipo, titulo, mensagem, metadata)
    values (
      'estoque',
      'Estoque Baixo',
      new.titulo || ' - Apenas ' || new.estoque || ' unidades',
      json_build_object(
        'produto_id', new.id,
        'produto_nome', new.titulo,
        'estoque_atual', new.estoque
      )
    );
  end if;
  
  -- Verificar se estoque ficou zerado
  if new.estoque = 0 and old.estoque > 0 then
    insert into public.notifications (tipo, titulo, mensagem, metadata)
    values (
      'estoque',
      'Produto sem Estoque',
      new.titulo || ' - Estoque esgotado',
      json_build_object(
        'produto_id', new.id,
        'produto_nome', new.titulo
      )
    );
  end if;
  
  return new;
end;
$$;


--
-- Name: notify_novo_cliente(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_novo_cliente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  cliente_nome text;
begin
  -- Determinar nome do cliente baseado no tipo
  if new.tipo_cliente = 'fisica' then
    cliente_nome := new.nome || ' ' || coalesce(new.sobrenome, '');
  else
    cliente_nome := new.razao_social;
  end if;
  
  insert into public.notifications (tipo, titulo, mensagem, metadata)
  values (
    'cliente',
    'Novo Cliente Cadastrado',
    cliente_nome || ' (' || new.tipo_cliente || ')',
    json_build_object(
      'cliente_id', new.id,
      'cliente_nome', cliente_nome,
      'tipo_cliente', new.tipo_cliente
    )
  );
  
  return new;
end;
$$;


--
-- Name: notify_novo_pedido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_novo_pedido() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
begin
  -- Inserir notificação
  insert into public.notifications (tipo, titulo, mensagem, metadata)
  values (
    'pedido',
    'Novo Pedido Recebido',
    'Pedido #' || substr(new.id::text, 25) || ' - R$ ' || new.total::numeric(10,2),
    json_build_object(
      'pedido_id', new.id,
      'total', new.total,
      'cliente_id', new.cliente_id,
      'status', new.status
    )
  );
  
  return new;
end;
$_$;


--
-- Name: pedido_item_estoque_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pedido_item_estoque_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Se tiver variacao_id, baixar da variação
    IF NEW.variacao_id IS NOT NULL THEN
        UPDATE produto_variacoes 
        SET estoque = estoque - NEW.quantidade
        WHERE id = NEW.variacao_id;
    ELSE
        -- Se não tiver variação, baixar do produto principal
        UPDATE produtos 
        SET estoque = estoque - NEW.quantidade
        WHERE id = NEW.produto_id;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: processar_ajuste_estoque_pedido_itens(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.processar_ajuste_estoque_pedido_itens() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- QUANDO UM ITEM É INSERIDO (baixa estoque)
    IF TG_OP = 'INSERT' THEN
        UPDATE produtos 
        SET estoque = estoque - NEW.quantidade,
            updated_at = NOW()
        WHERE id = NEW.produto_id;
        
        INSERT INTO baixas_estoque (
            produto_id, quantidade, motivo, preco_unitario,
            data_baixa, observacao, pedido_id, tipo_ajuste
        ) VALUES (
            NEW.produto_id, 
            NEW.quantidade, 
            'venda', 
            NEW.preco_unitario,
            NOW(), 
            'Pedido ' || NEW.pedido_id,
            NEW.pedido_id, 
            'saida'
        );

    -- QUANDO UM ITEM É EXCLUÍDO (restaura estoque)
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE produtos 
        SET estoque = estoque + OLD.quantidade,
            updated_at = NOW()
        WHERE id = OLD.produto_id;
        
        INSERT INTO baixas_estoque (
            produto_id, quantidade, motivo, preco_unitario,
            data_baixa, observacao, pedido_id, tipo_ajuste
        ) VALUES (
            OLD.produto_id, 
            OLD.quantidade, 
            'devolucao', 
            OLD.preco_unitario,
            NOW(), 
            'Estorno - Pedido ' || OLD.pedido_id,
            OLD.pedido_id, 
            'entrada'
        );

    -- QUANDO UM ITEM É ATUALIZADO (ajuste estoque)
    ELSIF TG_OP = 'UPDATE' THEN
        -- Restaurar quantidade antiga
        UPDATE produtos 
        SET estoque = estoque + OLD.quantidade,
            updated_at = NOW()
        WHERE id = OLD.produto_id;
        
        -- Baixar nova quantidade
        UPDATE produtos 
        SET estoque = estoque - NEW.quantidade,
            updated_at = NOW()
        WHERE id = NEW.produto_id;
        
        -- Registrar ajuste
        INSERT INTO baixas_estoque (
            produto_id, quantidade, motivo, preco_unitario,
            data_baixa, observacao, pedido_id, tipo_ajuste
        ) VALUES (
            NEW.produto_id, 
            NEW.quantidade, 
            'ajuste', 
            NEW.preco_unitario,
            NOW(), 
            'Ajuste pedido ' || NEW.pedido_id,
            NEW.pedido_id, 
            'saida'
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: processar_baixa_estoque_pedido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.processar_baixa_estoque_pedido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Apenas processar quando o status for alterado para 'confirmado'
    IF NEW.status = 'confirmado'
       AND (OLD.status IS NULL OR OLD.status != 'confirmado') THEN

        -- Inserir registros de baixa de estoque para cada item do pedido
        INSERT INTO baixas_estoque (
            produto_id,
            variacao_id,
            quantidade,
            motivo,
            observacao,
            preco_unitario,
            data_baixa,
            usuario_id,
            tipo_ajuste,
            pedido_id
        )
        SELECT
            pi.produto_id,
            NULL AS variacao_id, -- Ajustar conforme necessidade se usar variações
            pi.quantidade,
            'venda' AS motivo,
            'Baixa automática - Pedido ' || NEW.id AS observacao,
            pi.preco_unitario,
            NOW(),
            NEW.usuario_id,
            'saida' AS tipo_ajuste,
            NEW.id AS pedido_id
        FROM pedido_itens pi
        WHERE pi.pedido_id = NEW.id;

        -- Atualizar estoque dos produtos
        UPDATE produtos p
        SET estoque = p.estoque - pi.quantidade,
            updated_at = NOW()
        FROM pedido_itens pi
        WHERE p.id = pi.produto_id
          AND pi.pedido_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: processar_movimento_estoque(uuid, integer, text, uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.processar_movimento_estoque(p_produto_id uuid, p_quantidade integer, p_motivo text, p_pedido_item_id uuid, p_variacao_id uuid DEFAULT NULL::uuid, p_tipo_ajuste text DEFAULT 'saida'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_estoque_atual INTEGER;
    v_titulo TEXT;
    v_pedido_id UUID;
BEGIN
    -- Buscar o pedido_id associado ao pedido_item
    SELECT pedido_id INTO v_pedido_id FROM pedido_itens WHERE id = p_pedido_item_id;
    
    -- Atualizar estoque (considerando variação ou produto)
    IF p_variacao_id IS NOT NULL THEN
        -- Atualizar estoque da variação
        UPDATE produto_variacoes 
        SET estoque = estoque - p_quantidade 
        WHERE id = p_variacao_id
        RETURNING estoque INTO v_estoque_atual;
        
        SELECT titulo INTO v_titulo FROM produtos WHERE id = p_produto_id;
    ELSE
        -- Atualizar estoque do produto (para produtos sem variação)
        UPDATE produtos 
        SET estoque = estoque - p_quantidade 
        WHERE id = p_produto_id
        RETURNING estoque, titulo INTO v_estoque_atual, v_titulo;
    END IF;
    
    -- Registrar baixa de estoque na sua tabela EXATA
    INSERT INTO baixas_estoque (
        produto_id,
        variacao_id,
        quantidade,
        motivo,
        preco_unitario,
        data_baixa,
        created_at,
        pedido_item_id,
        pedido_id,
        tipo_ajuste
    )
    SELECT 
        p_produto_id,
        p_variacao_id,
        p_quantidade,
        p_motivo,
        pi.preco_unitario,
        NOW(),
        NOW(),
        p_pedido_item_id,
        v_pedido_id,
        p_tipo_ajuste
    FROM pedido_itens pi
    WHERE pi.id = p_pedido_item_id;
    
    RAISE NOTICE 'Estoque atualizado: % - % unidades restantes (ID: %)', 
        v_titulo, v_estoque_atual, p_pedido_item_id;
END;
$$;


--
-- Name: processar_movimento_estoque(uuid, uuid, integer, text, uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.processar_movimento_estoque(p_produto_id uuid, p_variacao_id uuid, p_quantidade integer, p_motivo text, p_pedido_item_id uuid DEFAULT NULL::uuid, p_tipo_ajuste character varying DEFAULT 'saida'::character varying) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_baixa_id uuid;
BEGIN
    -- 1. Criar registro em baixas_estoque
    INSERT INTO baixas_estoque (
        produto_id,
        variacao_id,
        quantidade,
        motivo,
        pedido_id,
        pedido_item_id,
        tipo_ajuste,
        usuario_id
    ) VALUES (
        p_produto_id,
        p_variacao_id,
        p_quantidade,
        p_motivo,
        (SELECT pedido_id FROM pedido_itens WHERE id = p_pedido_item_id),
        p_pedido_item_id,
        p_tipo_ajuste,
        current_setting('request.jwt.claims', true)::json->>'sub'::uuid
    ) RETURNING id INTO v_baixa_id;
    
    -- 2. Atualizar estoque da variação
    UPDATE produto_variacoes 
    SET estoque = CASE 
        WHEN p_tipo_ajuste = 'entrada' THEN estoque + p_quantidade
        ELSE estoque - p_quantidade
    END
    WHERE id = p_variacao_id;
    
    -- 3. Atualizar estoque do produto (somar todas variações)
    UPDATE produtos p
    SET estoque = (
        SELECT COALESCE(SUM(estoque), 0)
        FROM produto_variacoes pv
        WHERE pv.produto_id = p.id
    )
    WHERE p.id = p_produto_id;
    
    RETURN v_baixa_id;
END;
$$;


--
-- Name: registrar_estorno_cancelamento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_estorno_cancelamento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Quando um pedido é cancelado (status muda para cancelado)
    IF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
        
        -- Inserir estorno na tabela financeiro
        INSERT INTO financeiro (
            tipo,
            descricao,
            valor,
            categoria,
            data_movimento,
            pedido_id,
            usuario_id,
            tipo_movimento,
            status
        ) VALUES (
            'estorno',
            'Estorno - Cancelamento Pedido ' || NEW.id,
            -NEW.total, -- VALOR NEGATIVO
            'estornos',
            CURRENT_DATE,
            NEW.id,
            NEW.cancelado_por,
            'saida',
            'processado'
        );

        -- Inserir estorno na tabela movimentos_financeiros
        INSERT INTO movimentos_financeiros (
            descricao,
            valor,
            categoria,
            tipo,
            data_movimento,
            pedido_id
        ) VALUES (
            'Estorno - Cancelamento Pedido ' || NEW.id,
            -NEW.total, -- VALOR NEGATIVO
            'Estornos',
            'despesa',
            CURRENT_DATE,
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: registrar_movimento_financeiro_pedido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_movimento_financeiro_pedido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    movimento_tipo VARCHAR(20);
    movimento_categoria VARCHAR(100);
    movimento_descricao TEXT;
    tipo_pedido_nome VARCHAR(50);
    tipo_pedido_record RECORD;
BEGIN
    -- Buscar informações do tipo de pedido
    SELECT nome, descricao INTO tipo_pedido_record 
    FROM tipos_pedido 
    WHERE id = NEW.tipo_pedido_id;

    -- Se não encontrou, usar valor padrão
    IF NOT FOUND THEN
        tipo_pedido_record.nome := 'venda_normal';
        tipo_pedido_record.descricao := 'Venda Normal';
    END IF;

    -- Determinar tipo e categoria baseado no tipo_pedido_id e status
    IF NEW.status = 'confirmado' AND OLD.status != 'confirmado' THEN
        -- Mapear tipo de pedido para categoria financeira
        CASE tipo_pedido_record.nome
            WHEN 'venda_normal' THEN
                movimento_tipo := 'entrada';
                movimento_categoria := 'vendas';
                movimento_descricao := 'Venda - Pedido ' || NEW.id;
                
            WHEN 'orcamento' THEN
                movimento_tipo := 'entrada'; 
                movimento_categoria := 'orcamentos';
                movimento_descricao := 'Orçamento Aprovado - Pedido ' || NEW.id;
                
            WHEN 'garantia' THEN
                movimento_tipo := 'saida';
                movimento_categoria := 'garantias';
                movimento_descricao := 'Custo Garantia - Pedido ' || NEW.id;
                
            WHEN 'troca' THEN
                -- Para trocas, verificar se há diferença de valor
                IF NEW.total > 0 THEN
                    movimento_tipo := 'entrada';
                    movimento_categoria := 'trocas_entrada';
                    movimento_descricao := 'Troca com Complemento - Pedido ' || NEW.id;
                ELSE
                    movimento_tipo := 'saida';
                    movimento_categoria := 'trocas_saida';
                    movimento_descricao := 'Troca com Devolução - Pedido ' || NEW.id;
                END IF;
                
            WHEN 'bonificacao' THEN
                movimento_tipo := 'saida';
                movimento_categoria := 'bonificacoes';
                movimento_descricao := 'Bonificação - Pedido ' || NEW.id;
                
            WHEN 'doacao' THEN
                movimento_tipo := 'saida';
                movimento_categoria := 'doacoes';
                movimento_descricao := 'Doação - Pedido ' || NEW.id;
                
            WHEN 'defeito_fabricacao' THEN
                movimento_tipo := 'saida';
                movimento_categoria := 'garantias';
                movimento_descricao := 'Defeito Fabricação - Pedido ' || NEW.id;
                
            WHEN 'demonstracao' THEN
                movimento_tipo := 'saida';
                movimento_categoria := 'despesas_operacionais';
                movimento_descricao := 'Produto Demonstração - Pedido ' || NEW.id;
                
            ELSE
                movimento_tipo := 'entrada';
                movimento_categoria := 'outras_entradas';
                movimento_descricao := 'Pedido ' || NEW.id || ' - ' || tipo_pedido_record.descricao;
        END CASE;
        
        -- Inserir movimento financeiro
        INSERT INTO financeiro (
            tipo, descricao, valor, categoria, data_movimento, pedido_id, 
            usuario_id, tipo_movimento, status
        ) VALUES (
            'venda', movimento_descricao, NEW.total, movimento_categoria, 
            NEW.data_pedido::date, NEW.id, NEW.usuario_id, movimento_tipo, 'pendente'
        );
        
    ELSIF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
        -- Estorno para pedidos cancelados
        INSERT INTO financeiro (
            tipo, descricao, valor, categoria, data_movimento, pedido_id, tipo_movimento, status
        ) VALUES (
            'estorno', 'Estorno - Cancelamento Pedido ' || NEW.id, 
            -NEW.total, 'estornos', NOW()::date, NEW.id, 'saida', 'processado'
        );
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: registrar_movimentos_financeiros_pendentes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_movimentos_financeiros_pendentes() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    pedido_record RECORD;
BEGIN
    -- Para todos os pedidos confirmados que não têm movimento financeiro
    FOR pedido_record IN 
        SELECT p.* 
        FROM pedidos p
        LEFT JOIN movimentos_financeiros mf ON p.id = mf.pedido_id AND mf.tipo = 'receita'
        WHERE p.status = 'confirmado' AND mf.id IS NULL
    LOOP
        INSERT INTO movimentos_financeiros (
            descricao, valor, categoria, tipo, 
            data_movimento, pedido_id, created_at
        ) VALUES (
            'Venda - Pedido ' || pedido_record.id,
            pedido_record.total,
            'Vendas',
            'receita',
            COALESCE(pedido_record.data_pedido, NOW())::date,
            pedido_record.id,
            NOW()
        );
    END LOOP;
END;
$$;


--
-- Name: resetar_itens_pedido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.resetar_itens_pedido() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- DELETA TODOS OS ITENS DE TODOS OS PEDIDOS
    DELETE FROM pedido_itens;
END;
$$;


--
-- Name: sincronizar_estoque_produtos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sincronizar_estoque_produtos() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Atualiza o estoque de TODOS os produtos que têm variações
  UPDATE produtos p
  SET estoque = (
    SELECT COALESCE(SUM(pv.estoque), 0)
    FROM produto_variacoes pv
    WHERE pv.produto_id = p.id
  ),
  updated_at = NOW()
  WHERE EXISTS (
    SELECT 1 FROM produto_variacoes pv WHERE pv.produto_id = p.id
  );
END;
$$;


--
-- Name: sync_auth_user_to_usuarios(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_auth_user_to_usuarios() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, senha, tipo, ativo, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'name')::varchar, NEW.email),
    NEW.email,
    NEW.encrypted_password,
    -- Defina a lógica para tipos iniciais
    CASE 
      WHEN NEW.email IN ('anildofabiano@gmail.com', 'rioscalcadoseacessorios@gmail.com') 
      THEN 'admin' 
      ELSE 'usuario' 
    END,
    NEW.email_confirmed_at IS NOT NULL,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    nome = COALESCE((NEW.raw_user_meta_data->>'name')::varchar, NEW.email),
    email = NEW.email,
    updated_at = NEW.updated_at,
    ativo = NEW.email_confirmed_at IS NOT NULL;

  RETURN NEW;
END;
$$;


--
-- Name: sync_auth_users_to_usuarios(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_auth_users_to_usuarios() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Inserir ou atualizar na tabela usuarios quando um usuário for criado no auth
  INSERT INTO usuarios (id, email, nome, tipo, ativo, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    'vendedor',
    true,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = NEW.email,
    updated_at = NEW.updated_at;
  
  RETURN NEW;
END;
$$;


--
-- Name: trg_atualizar_estoque_total_produto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_atualizar_estoque_total_produto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE produtos 
  SET estoque = (
    SELECT COALESCE(SUM(estoque), 0) 
    FROM produto_variacoes 
    WHERE produto_id = COALESCE(NEW.produto_id, OLD.produto_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.produto_id, OLD.produto_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: trigger_atualizar_estoque_total_produto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_atualizar_estoque_total_produto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE produtos 
  SET estoque = (
    SELECT COALESCE(SUM(estoque), 0) 
    FROM produto_variacoes 
    WHERE produto_id = COALESCE(NEW.produto_id, OLD.produto_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.produto_id, OLD.produto_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_notifications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_notifications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: update_parcela_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_parcela_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL AND ppt.tablename NOT LIKE '% %'),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  -- Count raw slot entries before apply_rls/subscription filter
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  -- Apply RLS and filter as before
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  -- Real rows with slot count attached
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  -- Sentinel row: always returned when no real rows exist so Elixir can
  -- always read slot_changes_count. Identified by wal IS NULL.
  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: baixas_estoque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.baixas_estoque (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    variacao_id uuid,
    produto_id uuid,
    quantidade integer NOT NULL,
    motivo text NOT NULL,
    observacao text,
    preco_unitario numeric NOT NULL,
    data_baixa timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    usuario_nome text,
    usuario_email text,
    usuario_id uuid,
    tipo_ajuste character varying(10) DEFAULT 'saida'::character varying,
    pedido_id uuid,
    pedido_item_id uuid,
    CONSTRAINT baixas_estoque_motivo_check CHECK ((motivo = ANY (ARRAY['venda'::text, 'defeito'::text, 'doacao'::text, 'devolucao'::text, 'ajuste'::text, 'extorno'::text, 'extorno_cancelamento'::text, 'arrependimento'::text]))),
    CONSTRAINT baixas_estoque_quantidade_check CHECK ((quantidade > 0)),
    CONSTRAINT baixas_estoque_tipo_ajuste_check CHECK (((tipo_ajuste)::text = ANY (ARRAY[('entrada'::character varying)::text, ('saida'::character varying)::text])))
);


--
-- Name: banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(255) NOT NULL,
    subtitulo text,
    imagem_url character varying(500) NOT NULL,
    link character varying(500),
    texto_botao character varying(100),
    ativo boolean DEFAULT true,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    created_at timestamp with time zone DEFAULT now(),
    ml_category_id character varying(50),
    exibir_no_site boolean DEFAULT true,
    slug character varying(255),
    categoria_pai_id uuid
);


--
-- Name: certificados_a3; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificados_a3 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    arquivo_path text NOT NULL,
    validade timestamp without time zone NOT NULL,
    emissor character varying(255),
    ultimo_uso timestamp without time zone,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    senha character varying(255)
);


--
-- Name: cliente_sessoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cliente_sessoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid NOT NULL,
    token_sessao text NOT NULL,
    expira_em timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    razao_social character varying(255),
    nome_fantasia character varying(255),
    cnpj character varying(18),
    email character varying(255),
    telefone character varying(20),
    inscricao_estadual character varying(20),
    inscricao_municipal character varying(20),
    endereco text,
    numero character varying(10),
    complemento character varying(100),
    bairro character varying(100),
    cidade character varying(100),
    estado character varying(2),
    cep character varying(9),
    responsavel character varying(255),
    observacoes text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    tipo_cliente character varying(8) DEFAULT 'juridica'::character varying NOT NULL,
    nome character varying(255),
    sobrenome character varying(255),
    cpf character varying(14),
    local_trabalho character varying(255),
    senha character varying(255),
    ativo_login boolean DEFAULT false,
    data_cadastro_login timestamp with time zone,
    cliente_temporario boolean DEFAULT false,
    origem_cadastro character varying(20) DEFAULT 'ecommerce'::character varying,
    CONSTRAINT clientes_campos_obrigatorios_check CHECK (((((tipo_cliente)::text = 'juridica'::text) AND (razao_social IS NOT NULL) AND (cnpj IS NOT NULL)) OR (((tipo_cliente)::text = 'fisica'::text) AND (nome IS NOT NULL) AND (sobrenome IS NOT NULL) AND (cpf IS NOT NULL)))),
    CONSTRAINT clientes_tipo_check CHECK (((tipo_cliente)::text = ANY (ARRAY[('fisica'::character varying)::text, ('juridica'::character varying)::text])))
);


--
-- Name: clientes_dados_fiscais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes_dados_fiscais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid NOT NULL,
    cpf character varying(14),
    cnpj character varying(18),
    razao_social character varying(255),
    nome_fantasia character varying(255),
    ie character varying(20),
    telefone character varying(20),
    email character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: clientes_enderecos_fiscais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes_enderecos_fiscais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid NOT NULL,
    cep character varying(9),
    logradouro character varying(255),
    numero character varying(20),
    complemento character varying(100),
    bairro character varying(100),
    cidade character varying(100),
    estado character varying(2),
    pais character varying(50) DEFAULT 'Brasil'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: condicoes_pagamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.condicoes_pagamento (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    numero_parcelas integer NOT NULL,
    intervalo_dias integer DEFAULT 30 NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: configuracoes_fiscais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracoes_fiscais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    emitente_cnpj character varying(18) NOT NULL,
    emitente_razao_social character varying(255) NOT NULL,
    emitente_nome_fantasia character varying(255),
    emitente_ie character varying(20),
    emitente_regime_tributario character varying(50),
    emitente_crt character varying(10),
    emitente_cnae character varying(10),
    emitente_logradouro character varying(255),
    emitente_numero character varying(20),
    emitente_complemento character varying(100),
    emitente_bairro character varying(100),
    emitente_cep character varying(9),
    emitente_cidade character varying(100),
    emitente_estado character varying(2),
    emitente_telefone character varying(20),
    emitente_email character varying(255),
    ambiente_nfe character varying(20) DEFAULT 'homologacao'::character varying,
    sequencia_nfe integer DEFAULT 1,
    certificado_digital bytea,
    senha_certificado character varying(100),
    validade_certificado timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    emitente_codigo_municipio character varying(10),
    usuario_id uuid,
    certificado_a3_id uuid,
    serie_nfe integer DEFAULT 1,
    numero_ultima_nfe integer DEFAULT 0,
    responsavel_tecnico_cnpj character varying(14),
    responsavel_tecnico_contato character varying(60),
    responsavel_tecnico_email character varying(60),
    responsavel_tecnico_telefone character varying(11)
);


--
-- Name: cores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    codigo_hex character varying(7),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    slug character varying(255)
);


--
-- Name: financeiro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financeiro (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo character varying(50) NOT NULL,
    descricao character varying(255) NOT NULL,
    valor numeric(10,2) NOT NULL,
    categoria character varying(100),
    data_movimento date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    pedido_id uuid,
    usuario_id uuid,
    tipo_movimento character varying(20),
    status character varying(20) DEFAULT 'pendente'::character varying,
    payment_id text,
    CONSTRAINT financeiro_tipo_movimento_check CHECK (((tipo_movimento)::text = ANY (ARRAY[('entrada'::character varying)::text, ('saida'::character varying)::text])))
);


--
-- Name: generos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    slug character varying(255)
);


--
-- Name: marcas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marcas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    slug character varying(255),
    logo_url text
);


--
-- Name: mercado_livre_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mercado_livre_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_in integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    ml_user_id text,
    ml_nickname text
);


--
-- Name: movimentos_financeiros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimentos_financeiros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    descricao text NOT NULL,
    valor numeric(10,2) NOT NULL,
    categoria character varying(100) NOT NULL,
    tipo character varying(20),
    data_movimento date NOT NULL,
    pedido_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT movimentos_financeiros_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('receita'::character varying)::text, ('despesa'::character varying)::text])))
);


--
-- Name: newsletter_assinantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_assinantes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    nome character varying(255),
    ativo boolean DEFAULT true,
    origem character varying(50) DEFAULT 'site'::character varying,
    confirmado boolean DEFAULT false,
    token_confirmacao character varying(100),
    data_confirmacao timestamp with time zone,
    data_inscricao timestamp with time zone DEFAULT now(),
    data_cancelamento timestamp with time zone,
    ip_inscricao character varying(45),
    user_agent text
);


--
-- Name: newsletter_campanhas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_campanhas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(255) NOT NULL,
    assunto character varying(255) NOT NULL,
    conteudo_html text NOT NULL,
    conteudo_texto text,
    segmentacao jsonb,
    agendamento timestamp with time zone,
    status character varying(20) DEFAULT 'rascunho'::character varying,
    total_enviados integer DEFAULT 0,
    total_entregues integer DEFAULT 0,
    total_abertos integer DEFAULT 0,
    total_cliques integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    enviado_em timestamp with time zone,
    CONSTRAINT newsletter_campanhas_status_check CHECK (((status)::text = ANY (ARRAY[('rascunho'::character varying)::text, ('agendado'::character varying)::text, ('enviando'::character varying)::text, ('enviado'::character varying)::text, ('cancelado'::character varying)::text])))
);


--
-- Name: newsletter_estatisticas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_estatisticas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campanha_id uuid,
    assinante_id uuid,
    email character varying(255) NOT NULL,
    tipo_acao character varying(20) NOT NULL,
    data_acao timestamp with time zone DEFAULT now(),
    ip_acao character varying(45),
    user_agent text,
    link_url text,
    CONSTRAINT newsletter_estatisticas_tipo_acao_check CHECK (((tipo_acao)::text = ANY (ARRAY[('entrega'::character varying)::text, ('abertura'::character varying)::text, ('clique'::character varying)::text, ('cancelamento'::character varying)::text])))
);


--
-- Name: nfe_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfe_eventos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nfe_id uuid NOT NULL,
    tipo character varying(50) NOT NULL,
    descricao text,
    dados jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notas_fiscais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notas_fiscais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pedido_id uuid,
    ml_order_id character varying(100),
    numero_nf character varying(250),
    serie_nf character varying(10),
    chave_acesso character varying(44),
    status character varying(50) DEFAULT 'pendente'::character varying,
    data_emissao timestamp with time zone,
    data_cancelamento timestamp with time zone,
    xml_nf text,
    danfe_url text,
    motivo_cancelamento text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    destinatario_cpf_cnpj character varying(20),
    destinatario_nome character varying(255),
    emitido_automaticamente boolean DEFAULT false,
    numero integer,
    serie integer DEFAULT 1,
    valor_total numeric(10,2) DEFAULT 0,
    xml text,
    motivo_status text,
    protocolo text,
    data_autorizacao timestamp with time zone
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo text NOT NULL,
    titulo text NOT NULL,
    mensagem text NOT NULL,
    lida boolean DEFAULT false NOT NULL,
    user_id uuid,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_tipo_check CHECK ((tipo = ANY (ARRAY['pedido'::text, 'estoque'::text, 'financeiro'::text, 'cliente'::text, 'sistema'::text, 'mercadolivre'::text])))
);


--
-- Name: pedido_itens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedido_itens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pedido_id uuid,
    produto_id uuid,
    quantidade integer NOT NULL,
    preco_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    desconto numeric(5,2) DEFAULT 0,
    filial character varying(50),
    embargue character varying(50),
    tamanhos jsonb,
    ativo boolean DEFAULT true,
    variacao_id uuid
);


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid,
    total numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'pendente'::character varying,
    data_pedido timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    pre_pedido_id uuid,
    cancelado_em timestamp with time zone,
    cancelado_por uuid,
    motivo_cancelamento text,
    usuario_id uuid,
    condicao_pagamento character varying(100) DEFAULT 'À vista'::character varying,
    observacoes text,
    updated_at timestamp with time zone,
    tipo_cancelamento character varying(50),
    tipo_pedido_id uuid,
    status_pedido_id uuid,
    local_trabalho_ped character varying(255),
    vendedor_nome character varying(255),
    vendedor_email character varying(255),
    vendedor_telefone character varying(20),
    origem_pedido character varying(20) DEFAULT 'dashboard'::character varying,
    tipo_checkout character varying(20),
    payment_id text,
    frete_valor numeric(10,2) DEFAULT 0,
    frete_gratis boolean DEFAULT false,
    cep_entrega character varying(9),
    opcao_frete character varying(100),
    prazo_entrega character varying(50),
    payment_method character varying(50),
    qr_code text,
    qr_code_base64 text,
    pix_expiration timestamp with time zone,
    installments integer DEFAULT 1
);


--
-- Name: pre_pedido_parcelas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pre_pedido_parcelas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pre_pedido_id uuid NOT NULL,
    numero_parcela integer NOT NULL,
    valor_parcela numeric(10,2) NOT NULL,
    data_vencimento date NOT NULL,
    status character varying(20) DEFAULT 'pendente'::character varying,
    data_pagamento timestamp with time zone,
    valor_pago numeric(10,2),
    observacao text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pre_pedido_parcelas_status_check CHECK (((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('pago'::character varying)::text, ('atrasado'::character varying)::text, ('cancelado'::character varying)::text, ('vinculada'::character varying)::text])))
);


--
-- Name: pre_pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pre_pedidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid,
    itens jsonb NOT NULL,
    total numeric NOT NULL,
    observacoes text,
    condicao_pagamento character varying(100) DEFAULT '90/120/150'::character varying,
    status character varying(20) DEFAULT 'rascunho'::character varying,
    usuario_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cancelado_em timestamp with time zone,
    cancelado_por uuid,
    motivo_cancelamento text,
    pedido_id uuid,
    tipo_cancelamento text,
    local_trabalho_ped character varying(255),
    condicao_pagamento_id uuid,
    pedido_anterior_id uuid,
    saldo_pedido_anterior numeric(10,2) DEFAULT 0,
    valor_produtos_novos numeric(10,2) DEFAULT 0,
    tipo_pedido_id uuid DEFAULT '55cc482b-d6f3-487f-8d7c-615763f3a208'::uuid,
    justificativa_tipo text,
    CONSTRAINT pre_pedidos_status_check CHECK (((status)::text = ANY (ARRAY[('rascunho'::character varying)::text, ('confirmado'::character varying)::text, ('convertido'::character varying)::text, ('cancelado'::character varying)::text])))
);


--
-- Name: processamento_ml; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processamento_ml (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    produto_id uuid NOT NULL,
    acao text NOT NULL,
    processado boolean DEFAULT false,
    tentativas integer DEFAULT 0,
    ultimo_erro text,
    criado_em timestamp with time zone DEFAULT now(),
    processado_em timestamp with time zone,
    CONSTRAINT processamento_ml_acao_check CHECK ((acao = ANY (ARRAY['CREATE'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: produto_caracteristicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produto_caracteristicas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    produto_id uuid NOT NULL,
    nome character varying(100) NOT NULL,
    valor text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: produto_cores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produto_cores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    produto_id uuid NOT NULL,
    cor_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: produto_grade_tamanhos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produto_grade_tamanhos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    grade_id uuid,
    tamanho_id uuid,
    quantidade integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: produto_grades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produto_grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    produto_id uuid,
    nome_grade character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: produto_imagens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produto_imagens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    produto_id uuid NOT NULL,
    url character varying(500) NOT NULL,
    ordem integer DEFAULT 0,
    principal boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    cor_id uuid
);


--
-- Name: produto_sessoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produto_sessoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    produto_id uuid NOT NULL,
    sessao_id uuid NOT NULL,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: produto_variacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produto_variacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    produto_id uuid NOT NULL,
    estoque integer DEFAULT 0,
    preco numeric(10,2),
    codigo_ean character varying(20),
    sku character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    cor_id uuid,
    tamanho_id uuid,
    preco_prod numeric(10,2)
);


--
-- Name: produtos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produtos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(255) NOT NULL,
    descricao text,
    preco numeric(10,2) NOT NULL,
    estoque integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    preco_original numeric(10,2),
    categoria_id uuid,
    marca_id uuid,
    genero_id uuid,
    modelo character varying(100),
    condicao character varying(20) DEFAULT 'novo'::character varying,
    garantia character varying(100),
    codigo_ean character varying(20),
    ncm character varying(8),
    cest character varying(7),
    peso numeric(8,2),
    comprimento numeric(8,2),
    largura numeric(8,2),
    altura numeric(8,2),
    ativo boolean DEFAULT true,
    custo numeric DEFAULT 0,
    margem_lucro numeric DEFAULT 0,
    desativado_em timestamp with time zone,
    desativado_por uuid,
    motivo_desativacao text,
    publicar_ml boolean DEFAULT false,
    ml_item_id text,
    ml_status text,
    modelo_prod character varying(100) DEFAULT NULL::character varying,
    preco_prod numeric(10,2),
    slug character varying(255),
    visivel boolean DEFAULT true
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    name text,
    role text DEFAULT 'user'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    ml_user_id bigint
);


--
-- Name: sessoes_especiais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessoes_especiais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    descricao text,
    ativo boolean DEFAULT true,
    ordem integer DEFAULT 0,
    cor_fundo character varying(7) DEFAULT '#3B82F6'::character varying,
    cor_texto character varying(7) DEFAULT '#FFFFFF'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: status_pedido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_pedido (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(50) NOT NULL,
    categoria character varying(20) NOT NULL,
    descricao text,
    cor character varying(7),
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true
);


--
-- Name: subcategorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcategorias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    categoria_id uuid NOT NULL,
    descricao text,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tamanhos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tamanhos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(50) NOT NULL,
    tipo character varying(20),
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    slug character varying(255),
    CONSTRAINT tamanhos_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('numerico'::character varying)::text, ('textual'::character varying)::text])))
);


--
-- Name: tipos_pedido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_pedido (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(50) NOT NULL,
    descricao text,
    cor character varying(7) DEFAULT '#6B7280'::character varying,
    icone character varying(50),
    requer_justificativa boolean DEFAULT false,
    afeta_estoque boolean DEFAULT true,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    senha character varying(255) NOT NULL,
    tipo character varying(20) DEFAULT 'usuario'::character varying,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    local_trabalho character varying(255),
    phone character varying(20),
    ml_user_id text,
    CONSTRAINT usuarios_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('admin'::character varying)::text, ('usuario'::character varying)::text, ('vendedor'::character varying)::text, ('contador'::character varying)::text])))
);


--
-- Name: view_pedidos_com_frete; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.view_pedidos_com_frete AS
 SELECT id,
    cliente_id,
    total,
    status,
    data_pedido,
    created_at,
    pre_pedido_id,
    cancelado_em,
    cancelado_por,
    motivo_cancelamento,
    usuario_id,
    condicao_pagamento,
    observacoes,
    updated_at,
    tipo_cancelamento,
    tipo_pedido_id,
    status_pedido_id,
    local_trabalho_ped,
    vendedor_nome,
    vendedor_email,
    vendedor_telefone,
    origem_pedido,
    tipo_checkout,
    payment_id,
    frete_valor,
    frete_gratis,
    cep_entrega,
    opcao_frete,
    prazo_entrega
   FROM public.pedidos p;


--
-- Name: view_produtos_busca; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.view_produtos_busca AS
 SELECT p.id,
    p.titulo,
    p.descricao,
    p.preco,
    p.estoque,
    p.created_at,
    p.updated_at,
    p.preco_original,
    p.categoria_id,
    p.marca_id,
    p.genero_id,
    p.modelo,
    p.condicao,
    p.garantia,
    p.codigo_ean,
    p.ncm,
    p.cest,
    p.peso,
    p.comprimento,
    p.largura,
    p.altura,
    p.ativo,
    p.custo,
    p.margem_lucro,
    p.desativado_em,
    p.desativado_por,
    p.motivo_desativacao,
    c.nome AS categoria_nome,
    m.nome AS marca_nome,
    g.nome AS genero_nome
   FROM (((public.produtos p
     LEFT JOIN public.categorias c ON ((p.categoria_id = c.id)))
     LEFT JOIN public.marcas m ON ((p.marca_id = m.id)))
     LEFT JOIN public.generos g ON ((p.genero_id = g.id)))
  WHERE (p.ativo = true);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2026_04_10; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_10 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_04_11; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_11 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_04_12; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_12 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_04_13; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_13 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_04_14; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_14 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_04_15; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_15 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_04_16; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_16 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: messages_2026_04_10; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_10 FOR VALUES FROM ('2026-04-10 00:00:00') TO ('2026-04-11 00:00:00');


--
-- Name: messages_2026_04_11; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_11 FOR VALUES FROM ('2026-04-11 00:00:00') TO ('2026-04-12 00:00:00');


--
-- Name: messages_2026_04_12; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_12 FOR VALUES FROM ('2026-04-12 00:00:00') TO ('2026-04-13 00:00:00');


--
-- Name: messages_2026_04_13; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_13 FOR VALUES FROM ('2026-04-13 00:00:00') TO ('2026-04-14 00:00:00');


--
-- Name: messages_2026_04_14; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_14 FOR VALUES FROM ('2026-04-14 00:00:00') TO ('2026-04-15 00:00:00');


--
-- Name: messages_2026_04_15; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_15 FOR VALUES FROM ('2026-04-15 00:00:00') TO ('2026-04-16 00:00:00');


--
-- Name: messages_2026_04_16; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_16 FOR VALUES FROM ('2026-04-16 00:00:00') TO ('2026-04-17 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: baixas_estoque baixas_estoque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baixas_estoque
    ADD CONSTRAINT baixas_estoque_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_slug_key UNIQUE (slug);


--
-- Name: certificados_a3 certificados_a3_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificados_a3
    ADD CONSTRAINT certificados_a3_pkey PRIMARY KEY (id);


--
-- Name: cliente_sessoes cliente_sessoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_sessoes
    ADD CONSTRAINT cliente_sessoes_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_cnpj_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cnpj_unique EXCLUDE USING btree (cnpj WITH =) WHERE ((((tipo_cliente)::text = 'juridica'::text) AND (cnpj IS NOT NULL)));


--
-- Name: clientes clientes_cpf_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_unique EXCLUDE USING btree (cpf WITH =) WHERE ((((tipo_cliente)::text = 'fisica'::text) AND (cpf IS NOT NULL)));


--
-- Name: clientes_dados_fiscais clientes_dados_fiscais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes_dados_fiscais
    ADD CONSTRAINT clientes_dados_fiscais_pkey PRIMARY KEY (id);


--
-- Name: clientes_enderecos_fiscais clientes_enderecos_fiscais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes_enderecos_fiscais
    ADD CONSTRAINT clientes_enderecos_fiscais_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pj_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pj_pkey PRIMARY KEY (id);


--
-- Name: condicoes_pagamento condicoes_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condicoes_pagamento
    ADD CONSTRAINT condicoes_pagamento_pkey PRIMARY KEY (id);


--
-- Name: configuracoes_fiscais configuracoes_fiscais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes_fiscais
    ADD CONSTRAINT configuracoes_fiscais_pkey PRIMARY KEY (id);


--
-- Name: cores cores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cores
    ADD CONSTRAINT cores_pkey PRIMARY KEY (id);


--
-- Name: cores cores_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cores
    ADD CONSTRAINT cores_slug_key UNIQUE (slug);


--
-- Name: financeiro financeiro_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financeiro
    ADD CONSTRAINT financeiro_pkey PRIMARY KEY (id);


--
-- Name: generos generos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generos
    ADD CONSTRAINT generos_pkey PRIMARY KEY (id);


--
-- Name: generos generos_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generos
    ADD CONSTRAINT generos_slug_key UNIQUE (slug);


--
-- Name: marcas marcas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_pkey PRIMARY KEY (id);


--
-- Name: marcas marcas_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_slug_key UNIQUE (slug);


--
-- Name: mercado_livre_tokens mercado_livre_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mercado_livre_tokens
    ADD CONSTRAINT mercado_livre_tokens_pkey PRIMARY KEY (id);


--
-- Name: mercado_livre_tokens mercado_livre_tokens_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mercado_livre_tokens
    ADD CONSTRAINT mercado_livre_tokens_user_id_key UNIQUE (user_id);


--
-- Name: movimentos_financeiros movimentos_financeiros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentos_financeiros
    ADD CONSTRAINT movimentos_financeiros_pkey PRIMARY KEY (id);


--
-- Name: newsletter_assinantes newsletter_assinantes_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_assinantes
    ADD CONSTRAINT newsletter_assinantes_email_key UNIQUE (email);


--
-- Name: newsletter_assinantes newsletter_assinantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_assinantes
    ADD CONSTRAINT newsletter_assinantes_pkey PRIMARY KEY (id);


--
-- Name: newsletter_campanhas newsletter_campanhas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_campanhas
    ADD CONSTRAINT newsletter_campanhas_pkey PRIMARY KEY (id);


--
-- Name: newsletter_estatisticas newsletter_estatisticas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_estatisticas
    ADD CONSTRAINT newsletter_estatisticas_pkey PRIMARY KEY (id);


--
-- Name: nfe_eventos nfe_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfe_eventos
    ADD CONSTRAINT nfe_eventos_pkey PRIMARY KEY (id);


--
-- Name: notas_fiscais notas_fiscais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_fiscais
    ADD CONSTRAINT notas_fiscais_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pedido_itens pedido_itens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_itens
    ADD CONSTRAINT pedido_itens_pkey PRIMARY KEY (id);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- Name: pre_pedido_parcelas pre_pedido_parcelas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_pedido_parcelas
    ADD CONSTRAINT pre_pedido_parcelas_pkey PRIMARY KEY (id);


--
-- Name: pre_pedidos pre_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_pedidos
    ADD CONSTRAINT pre_pedidos_pkey PRIMARY KEY (id);


--
-- Name: processamento_ml processamento_ml_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processamento_ml
    ADD CONSTRAINT processamento_ml_pkey PRIMARY KEY (id);


--
-- Name: processamento_ml processamento_ml_produto_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processamento_ml
    ADD CONSTRAINT processamento_ml_produto_id_key UNIQUE (produto_id);


--
-- Name: produto_caracteristicas produto_caracteristicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_caracteristicas
    ADD CONSTRAINT produto_caracteristicas_pkey PRIMARY KEY (id);


--
-- Name: produto_cores produto_cores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_cores
    ADD CONSTRAINT produto_cores_pkey PRIMARY KEY (id);


--
-- Name: produto_cores produto_cores_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_cores
    ADD CONSTRAINT produto_cores_unique UNIQUE (produto_id, cor_id);


--
-- Name: produto_grade_tamanhos produto_grade_tamanhos_grade_id_tamanho_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_grade_tamanhos
    ADD CONSTRAINT produto_grade_tamanhos_grade_id_tamanho_id_key UNIQUE (grade_id, tamanho_id);


--
-- Name: produto_grade_tamanhos produto_grade_tamanhos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_grade_tamanhos
    ADD CONSTRAINT produto_grade_tamanhos_pkey PRIMARY KEY (id);


--
-- Name: produto_grades produto_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_grades
    ADD CONSTRAINT produto_grades_pkey PRIMARY KEY (id);


--
-- Name: produto_imagens produto_imagens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_imagens
    ADD CONSTRAINT produto_imagens_pkey PRIMARY KEY (id);


--
-- Name: produto_sessoes produto_sessoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_sessoes
    ADD CONSTRAINT produto_sessoes_pkey PRIMARY KEY (id);


--
-- Name: produto_sessoes produto_sessoes_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_sessoes
    ADD CONSTRAINT produto_sessoes_unique UNIQUE (produto_id, sessao_id);


--
-- Name: produto_variacoes produto_variacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_variacoes
    ADD CONSTRAINT produto_variacoes_pkey PRIMARY KEY (id);


--
-- Name: produto_variacoes produto_variacoes_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_variacoes
    ADD CONSTRAINT produto_variacoes_unique UNIQUE (produto_id, cor_id, tamanho_id);


--
-- Name: produtos produtos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT produtos_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_ml_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_ml_user_id_key UNIQUE (ml_user_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: sessoes_especiais sessoes_especiais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_especiais
    ADD CONSTRAINT sessoes_especiais_pkey PRIMARY KEY (id);


--
-- Name: sessoes_especiais sessoes_especiais_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_especiais
    ADD CONSTRAINT sessoes_especiais_slug_unique UNIQUE (slug);


--
-- Name: status_pedido status_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_pedido
    ADD CONSTRAINT status_pedido_pkey PRIMARY KEY (id);


--
-- Name: subcategorias subcategorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategorias
    ADD CONSTRAINT subcategorias_pkey PRIMARY KEY (id);


--
-- Name: tamanhos tamanhos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tamanhos
    ADD CONSTRAINT tamanhos_pkey PRIMARY KEY (id);


--
-- Name: tamanhos tamanhos_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tamanhos
    ADD CONSTRAINT tamanhos_slug_key UNIQUE (slug);


--
-- Name: tipos_pedido tipos_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_pedido
    ADD CONSTRAINT tipos_pedido_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_10 messages_2026_04_10_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_10
    ADD CONSTRAINT messages_2026_04_10_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_11 messages_2026_04_11_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_11
    ADD CONSTRAINT messages_2026_04_11_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_12 messages_2026_04_12_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_12
    ADD CONSTRAINT messages_2026_04_12_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_13 messages_2026_04_13_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_13
    ADD CONSTRAINT messages_2026_04_13_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_14 messages_2026_04_14_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_14
    ADD CONSTRAINT messages_2026_04_14_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_15 messages_2026_04_15_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_15
    ADD CONSTRAINT messages_2026_04_15_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_16 messages_2026_04_16_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_16
    ADD CONSTRAINT messages_2026_04_16_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: idx_baixas_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baixas_data ON public.baixas_estoque USING btree (data_baixa);


--
-- Name: idx_baixas_motivo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baixas_motivo ON public.baixas_estoque USING btree (motivo);


--
-- Name: idx_baixas_produto_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baixas_produto_id ON public.baixas_estoque USING btree (produto_id);


--
-- Name: idx_baixas_variacao_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baixas_variacao_id ON public.baixas_estoque USING btree (variacao_id);


--
-- Name: idx_categorias_exibir_no_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_exibir_no_site ON public.categorias USING btree (exibir_no_site);


--
-- Name: idx_certificados_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificados_ativo ON public.certificados_a3 USING btree (ativo);


--
-- Name: idx_certificados_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificados_usuario_id ON public.certificados_a3 USING btree (usuario_id);


--
-- Name: idx_cliente_sessoes_expira; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cliente_sessoes_expira ON public.cliente_sessoes USING btree (expira_em);


--
-- Name: idx_cliente_sessoes_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cliente_sessoes_token ON public.cliente_sessoes USING btree (token_sessao);


--
-- Name: idx_clientes_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_cnpj ON public.clientes USING btree (cnpj);


--
-- Name: idx_clientes_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_cpf ON public.clientes USING btree (cpf);


--
-- Name: idx_clientes_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_email ON public.clientes USING btree (email);


--
-- Name: idx_clientes_email_login; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_email_login ON public.clientes USING btree (email) WHERE (ativo_login = true);


--
-- Name: idx_clientes_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_nome ON public.clientes USING btree (nome);


--
-- Name: idx_clientes_razao_social; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_razao_social ON public.clientes USING btree (razao_social);


--
-- Name: idx_clientes_sobrenome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_sobrenome ON public.clientes USING btree (sobrenome);


--
-- Name: idx_clientes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_tipo ON public.clientes USING btree (tipo_cliente);


--
-- Name: idx_newsletter_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_ativo ON public.newsletter_assinantes USING btree (ativo);


--
-- Name: idx_newsletter_data_inscricao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_data_inscricao ON public.newsletter_assinantes USING btree (data_inscricao);


--
-- Name: idx_newsletter_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_email ON public.newsletter_assinantes USING btree (email);


--
-- Name: idx_newsletter_stats_assinante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_stats_assinante ON public.newsletter_estatisticas USING btree (assinante_id);


--
-- Name: idx_newsletter_stats_campanha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_stats_campanha ON public.newsletter_estatisticas USING btree (campanha_id);


--
-- Name: idx_newsletter_stats_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_stats_data ON public.newsletter_estatisticas USING btree (data_acao);


--
-- Name: idx_nfe_eventos_nfe_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfe_eventos_nfe_id ON public.nfe_eventos USING btree (nfe_id);


--
-- Name: idx_nfe_eventos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfe_eventos_tipo ON public.nfe_eventos USING btree (tipo);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_lida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_lida ON public.notifications USING btree (lida);


--
-- Name: idx_notifications_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_tipo ON public.notifications USING btree (tipo);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_pedido_itens_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedido_itens_ativo ON public.pedido_itens USING btree (ativo);


--
-- Name: idx_pedido_itens_pedido_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedido_itens_pedido_id ON public.pedido_itens USING btree (pedido_id);


--
-- Name: idx_pedidos_status_pedido_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_status_pedido_id ON public.pedidos USING btree (status_pedido_id);


--
-- Name: idx_pre_pedidos_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_pedidos_cliente_id ON public.pre_pedidos USING btree (cliente_id);


--
-- Name: idx_pre_pedidos_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_pedidos_created_at ON public.pre_pedidos USING btree (created_at);


--
-- Name: idx_pre_pedidos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_pedidos_status ON public.pre_pedidos USING btree (status);


--
-- Name: idx_pre_pedidos_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_pedidos_usuario_id ON public.pre_pedidos USING btree (usuario_id);


--
-- Name: idx_produtos_ml_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_ml_item_id ON public.produtos USING btree (ml_item_id);


--
-- Name: idx_produtos_visivel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_visivel ON public.produtos USING btree (visivel);


--
-- Name: idx_subcategorias_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategorias_ativo ON public.subcategorias USING btree (ativo);


--
-- Name: idx_subcategorias_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategorias_categoria ON public.subcategorias USING btree (categoria_id);


--
-- Name: idx_subcategorias_ordem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategorias_ordem ON public.subcategorias USING btree (ordem);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_10_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_10_inserted_at_topic_idx ON realtime.messages_2026_04_10 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_11_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_11_inserted_at_topic_idx ON realtime.messages_2026_04_11 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_12_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_12_inserted_at_topic_idx ON realtime.messages_2026_04_12 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_13_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_13_inserted_at_topic_idx ON realtime.messages_2026_04_13 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_14_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_14_inserted_at_topic_idx ON realtime.messages_2026_04_14 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_15_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_15_inserted_at_topic_idx ON realtime.messages_2026_04_15 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_16_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_16_inserted_at_topic_idx ON realtime.messages_2026_04_16 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: messages_2026_04_10_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_10_inserted_at_topic_idx;


--
-- Name: messages_2026_04_10_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_10_pkey;


--
-- Name: messages_2026_04_11_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_11_inserted_at_topic_idx;


--
-- Name: messages_2026_04_11_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_11_pkey;


--
-- Name: messages_2026_04_12_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_12_inserted_at_topic_idx;


--
-- Name: messages_2026_04_12_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_12_pkey;


--
-- Name: messages_2026_04_13_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_13_inserted_at_topic_idx;


--
-- Name: messages_2026_04_13_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_13_pkey;


--
-- Name: messages_2026_04_14_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_14_inserted_at_topic_idx;


--
-- Name: messages_2026_04_14_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_14_pkey;


--
-- Name: messages_2026_04_15_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_15_inserted_at_topic_idx;


--
-- Name: messages_2026_04_15_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_15_pkey;


--
-- Name: messages_2026_04_16_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_16_inserted_at_topic_idx;


--
-- Name: messages_2026_04_16_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_16_pkey;


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT OR UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_usuarios();


--
-- Name: profiles set_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: produto_variacoes trigger_atualizar_estoque_total; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_estoque_total AFTER INSERT OR DELETE OR UPDATE ON public.produto_variacoes FOR EACH ROW EXECUTE FUNCTION public.trg_atualizar_estoque_total_produto();


--
-- Name: produtos trigger_atualizar_ml; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_ml AFTER UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.atualizar_produto_ml();


--
-- Name: produtos trigger_atualizar_produtos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_produtos BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();


--
-- Name: produto_variacoes trigger_atualizar_variacao_ml; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_variacao_ml AFTER INSERT OR DELETE OR UPDATE ON public.produto_variacoes FOR EACH ROW EXECUTE FUNCTION public.atualizar_variacao_ml();


--
-- Name: pedidos trigger_estorno_cancelamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_estorno_cancelamento AFTER UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.registrar_estorno_cancelamento();


--
-- Name: usuarios trigger_fill_usuario_nome; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_fill_usuario_nome BEFORE INSERT ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.fill_usuario_nome();


--
-- Name: pedidos trigger_movimento_financeiro_pedido; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_movimento_financeiro_pedido AFTER INSERT OR UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.registrar_movimento_financeiro_pedido();


--
-- Name: produtos trigger_notify_estoque_baixo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notify_estoque_baixo AFTER UPDATE OF estoque ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.notify_estoque_baixo();


--
-- Name: clientes trigger_notify_novo_cliente; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notify_novo_cliente AFTER INSERT ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.notify_novo_cliente();


--
-- Name: pedidos trigger_notify_novo_pedido; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notify_novo_pedido AFTER INSERT ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.notify_novo_pedido();


--
-- Name: pedido_itens trigger_pedido_item_estoque; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_pedido_item_estoque AFTER INSERT ON public.pedido_itens FOR EACH ROW EXECUTE FUNCTION public.pedido_item_estoque_trigger();


--
-- Name: produto_variacoes trigger_sincronizar_estoque_produto; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sincronizar_estoque_produto AFTER INSERT OR DELETE OR UPDATE ON public.produto_variacoes FOR EACH ROW EXECUTE FUNCTION public.trigger_atualizar_estoque_total_produto();


--
-- Name: notifications trigger_update_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_notifications_updated_at();


--
-- Name: pre_pedido_parcelas trigger_update_parcela_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_parcela_updated_at BEFORE UPDATE ON public.pre_pedido_parcelas FOR EACH ROW EXECUTE FUNCTION public.update_parcela_updated_at();


--
-- Name: certificados_a3 update_certificados_a3_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_certificados_a3_updated_at BEFORE UPDATE ON public.certificados_a3 FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: baixas_estoque baixas_estoque_pedido_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baixas_estoque
    ADD CONSTRAINT baixas_estoque_pedido_item_id_fkey FOREIGN KEY (pedido_item_id) REFERENCES public.pedido_itens(id);


--
-- Name: baixas_estoque baixas_estoque_produto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baixas_estoque
    ADD CONSTRAINT baixas_estoque_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: baixas_estoque baixas_estoque_variacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baixas_estoque
    ADD CONSTRAINT baixas_estoque_variacao_id_fkey FOREIGN KEY (variacao_id) REFERENCES public.produto_variacoes(id) ON DELETE CASCADE;


--
-- Name: categorias categorias_categoria_pai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_categoria_pai_id_fkey FOREIGN KEY (categoria_pai_id) REFERENCES public.categorias(id);


--
-- Name: certificados_a3 certificados_a3_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificados_a3
    ADD CONSTRAINT certificados_a3_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: cliente_sessoes cliente_sessoes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_sessoes
    ADD CONSTRAINT cliente_sessoes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: clientes_dados_fiscais clientes_dados_fiscais_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes_dados_fiscais
    ADD CONSTRAINT clientes_dados_fiscais_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: clientes_enderecos_fiscais clientes_enderecos_fiscais_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes_enderecos_fiscais
    ADD CONSTRAINT clientes_enderecos_fiscais_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: clientes clientes_pj_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pj_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: configuracoes_fiscais configuracoes_fiscais_certificado_a3_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes_fiscais
    ADD CONSTRAINT configuracoes_fiscais_certificado_a3_id_fkey FOREIGN KEY (certificado_a3_id) REFERENCES public.certificados_a3(id);


--
-- Name: configuracoes_fiscais configuracoes_fiscais_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes_fiscais
    ADD CONSTRAINT configuracoes_fiscais_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: financeiro financeiro_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financeiro
    ADD CONSTRAINT financeiro_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id);


--
-- Name: financeiro financeiro_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financeiro
    ADD CONSTRAINT financeiro_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: pre_pedidos fk_pre_pedidos_usuario_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_pedidos
    ADD CONSTRAINT fk_pre_pedidos_usuario_id FOREIGN KEY (usuario_id) REFERENCES auth.users(id);


--
-- Name: mercado_livre_tokens mercado_livre_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mercado_livre_tokens
    ADD CONSTRAINT mercado_livre_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: movimentos_financeiros movimentos_financeiros_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentos_financeiros
    ADD CONSTRAINT movimentos_financeiros_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id);


--
-- Name: newsletter_estatisticas newsletter_estatisticas_assinante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_estatisticas
    ADD CONSTRAINT newsletter_estatisticas_assinante_id_fkey FOREIGN KEY (assinante_id) REFERENCES public.newsletter_assinantes(id) ON DELETE CASCADE;


--
-- Name: newsletter_estatisticas newsletter_estatisticas_campanha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_estatisticas
    ADD CONSTRAINT newsletter_estatisticas_campanha_id_fkey FOREIGN KEY (campanha_id) REFERENCES public.newsletter_campanhas(id) ON DELETE CASCADE;


--
-- Name: nfe_eventos nfe_eventos_nfe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfe_eventos
    ADD CONSTRAINT nfe_eventos_nfe_id_fkey FOREIGN KEY (nfe_id) REFERENCES public.notas_fiscais(id) ON DELETE CASCADE;


--
-- Name: notas_fiscais notas_fiscais_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_fiscais
    ADD CONSTRAINT notas_fiscais_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pedido_itens pedido_itens_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_itens
    ADD CONSTRAINT pedido_itens_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- Name: pedido_itens pedido_itens_produto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_itens
    ADD CONSTRAINT pedido_itens_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: pedido_itens pedido_itens_variacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_itens
    ADD CONSTRAINT pedido_itens_variacao_id_fkey FOREIGN KEY (variacao_id) REFERENCES public.produto_variacoes(id);


--
-- Name: pedidos pedidos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;


--
-- Name: pedidos pedidos_status_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_status_pedido_id_fkey FOREIGN KEY (status_pedido_id) REFERENCES public.status_pedido(id);


--
-- Name: pedidos pedidos_tipo_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_tipo_pedido_id_fkey FOREIGN KEY (tipo_pedido_id) REFERENCES public.tipos_pedido(id);


--
-- Name: pedidos pedidos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id);


--
-- Name: pre_pedido_parcelas pre_pedido_parcelas_pre_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_pedido_parcelas
    ADD CONSTRAINT pre_pedido_parcelas_pre_pedido_id_fkey FOREIGN KEY (pre_pedido_id) REFERENCES public.pre_pedidos(id) ON DELETE CASCADE;


--
-- Name: pre_pedidos pre_pedidos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_pedidos
    ADD CONSTRAINT pre_pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;


--
-- Name: pre_pedidos pre_pedidos_condicao_pagamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_pedidos
    ADD CONSTRAINT pre_pedidos_condicao_pagamento_id_fkey FOREIGN KEY (condicao_pagamento_id) REFERENCES public.condicoes_pagamento(id);


--
-- Name: pre_pedidos pre_pedidos_pedido_anterior_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_pedidos
    ADD CONSTRAINT pre_pedidos_pedido_anterior_id_fkey FOREIGN KEY (pedido_anterior_id) REFERENCES public.pedidos(id);


--
-- Name: pre_pedidos pre_pedidos_tipo_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_pedidos
    ADD CONSTRAINT pre_pedidos_tipo_pedido_id_fkey FOREIGN KEY (tipo_pedido_id) REFERENCES public.tipos_pedido(id);


--
-- Name: processamento_ml processamento_ml_produto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processamento_ml
    ADD CONSTRAINT processamento_ml_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: produto_caracteristicas produto_caracteristicas_produto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_caracteristicas
    ADD CONSTRAINT produto_caracteristicas_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: produto_cores produto_cores_cor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_cores
    ADD CONSTRAINT produto_cores_cor_id_fkey FOREIGN KEY (cor_id) REFERENCES public.cores(id);


--
-- Name: produto_cores produto_cores_produto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_cores
    ADD CONSTRAINT produto_cores_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: produto_grade_tamanhos produto_grade_tamanhos_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_grade_tamanhos
    ADD CONSTRAINT produto_grade_tamanhos_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.produto_grades(id) ON DELETE CASCADE;


--
-- Name: produto_grade_tamanhos produto_grade_tamanhos_tamanho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_grade_tamanhos
    ADD CONSTRAINT produto_grade_tamanhos_tamanho_id_fkey FOREIGN KEY (tamanho_id) REFERENCES public.tamanhos(id);


--
-- Name: produto_grades produto_grades_produto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_grades
    ADD CONSTRAINT produto_grades_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: produto_imagens produto_imagens_cor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_imagens
    ADD CONSTRAINT produto_imagens_cor_id_fkey FOREIGN KEY (cor_id) REFERENCES public.cores(id) ON DELETE SET NULL;


--
-- Name: produto_imagens produto_imagens_produto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_imagens
    ADD CONSTRAINT produto_imagens_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: produto_sessoes produto_sessoes_produto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_sessoes
    ADD CONSTRAINT produto_sessoes_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: produto_sessoes produto_sessoes_sessao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_sessoes
    ADD CONSTRAINT produto_sessoes_sessao_id_fkey FOREIGN KEY (sessao_id) REFERENCES public.sessoes_especiais(id) ON DELETE CASCADE;


--
-- Name: produto_variacoes produto_variacoes_cor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_variacoes
    ADD CONSTRAINT produto_variacoes_cor_id_fkey FOREIGN KEY (cor_id) REFERENCES public.cores(id);


--
-- Name: produto_variacoes produto_variacoes_produto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_variacoes
    ADD CONSTRAINT produto_variacoes_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: produto_variacoes produto_variacoes_tamanho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produto_variacoes
    ADD CONSTRAINT produto_variacoes_tamanho_id_fkey FOREIGN KEY (tamanho_id) REFERENCES public.tamanhos(id);


--
-- Name: produtos produtos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT produtos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id);


--
-- Name: produtos produtos_desativado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT produtos_desativado_por_fkey FOREIGN KEY (desativado_por) REFERENCES public.usuarios(id);


--
-- Name: produtos produtos_genero_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT produtos_genero_id_fkey FOREIGN KEY (genero_id) REFERENCES public.generos(id);


--
-- Name: produtos produtos_marca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT produtos_marca_id_fkey FOREIGN KEY (marca_id) REFERENCES public.marcas(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subcategorias subcategorias_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategorias
    ADD CONSTRAINT subcategorias_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: cores Apenas administradores podem atualizar cores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas administradores podem atualizar cores" ON public.cores FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: tamanhos Apenas administradores podem atualizar tamanhos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas administradores podem atualizar tamanhos" ON public.tamanhos FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: cores Apenas administradores podem deletar cores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas administradores podem deletar cores" ON public.cores FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- Name: tamanhos Apenas administradores podem deletar tamanhos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas administradores podem deletar tamanhos" ON public.tamanhos FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- Name: cores Apenas administradores podem inserir cores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas administradores podem inserir cores" ON public.cores FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: tamanhos Apenas administradores podem inserir tamanhos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas administradores podem inserir tamanhos" ON public.tamanhos FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: baixas_estoque Permitir atualização baixas_estoque; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir atualização baixas_estoque" ON public.baixas_estoque FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: produtos Permitir atualização de estoque; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir atualização de estoque" ON public.produtos FOR UPDATE USING (true);


--
-- Name: financeiro Permitir atualização financeiro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir atualização financeiro" ON public.financeiro FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: movimentos_financeiros Permitir atualização movimentos_financeiros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir atualização movimentos_financeiros" ON public.movimentos_financeiros FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: subcategorias Permitir atualização para usuários autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir atualização para usuários autenticados" ON public.subcategorias FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: pre_pedidos Permitir atualização pre_pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir atualização pre_pedidos" ON public.pre_pedidos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: produto_variacoes Permitir atualização produto_variacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir atualização produto_variacoes" ON public.produto_variacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: baixas_estoque Permitir exclusão baixas_estoque; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir exclusão baixas_estoque" ON public.baixas_estoque FOR DELETE TO authenticated USING (true);


--
-- Name: financeiro Permitir exclusão financeiro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir exclusão financeiro" ON public.financeiro FOR DELETE TO authenticated USING (true);


--
-- Name: movimentos_financeiros Permitir exclusão movimentos_financeiros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir exclusão movimentos_financeiros" ON public.movimentos_financeiros FOR DELETE TO authenticated USING (true);


--
-- Name: subcategorias Permitir exclusão para usuários autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir exclusão para usuários autenticados" ON public.subcategorias FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- Name: pre_pedidos Permitir exclusão pre_pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir exclusão pre_pedidos" ON public.pre_pedidos FOR DELETE TO authenticated USING (true);


--
-- Name: produto_variacoes Permitir exclusão produto_variacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir exclusão produto_variacoes" ON public.produto_variacoes FOR DELETE TO authenticated USING (true);


--
-- Name: usuarios Permitir inserts na tabela usuarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserts na tabela usuarios" ON public.usuarios FOR INSERT WITH CHECK (true);


--
-- Name: baixas_estoque Permitir inserção baixas_estoque; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserção baixas_estoque" ON public.baixas_estoque FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: financeiro Permitir inserção financeiro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserção financeiro" ON public.financeiro FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: movimentos_financeiros Permitir inserção movimentos_financeiros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserção movimentos_financeiros" ON public.movimentos_financeiros FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: subcategorias Permitir inserção para usuários autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserção para usuários autenticados" ON public.subcategorias FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: pre_pedidos Permitir inserção pre_pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserção pre_pedidos" ON public.pre_pedidos FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: produto_variacoes Permitir inserção produto_variacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserção produto_variacoes" ON public.produto_variacoes FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: baixas_estoque Permitir leitura baixas_estoque; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir leitura baixas_estoque" ON public.baixas_estoque FOR SELECT TO authenticated USING (true);


--
-- Name: pedidos Permitir leitura de pedidos para usuários autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir leitura de pedidos para usuários autenticados" ON public.pedidos FOR SELECT TO authenticated USING (true);


--
-- Name: financeiro Permitir leitura financeiro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir leitura financeiro" ON public.financeiro FOR SELECT TO authenticated USING (true);


--
-- Name: movimentos_financeiros Permitir leitura movimentos_financeiros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir leitura movimentos_financeiros" ON public.movimentos_financeiros FOR SELECT TO authenticated USING (true);


--
-- Name: subcategorias Permitir leitura para todos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir leitura para todos" ON public.subcategorias FOR SELECT USING (true);


--
-- Name: pre_pedidos Permitir leitura pre_pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir leitura pre_pedidos" ON public.pre_pedidos FOR SELECT TO authenticated USING (true);


--
-- Name: produto_variacoes Permitir leitura produto_variacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir leitura produto_variacoes" ON public.produto_variacoes FOR SELECT TO authenticated USING (true);


--
-- Name: pedidos Permitir_tudo_pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir_tudo_pedidos" ON public.pedidos USING (true) WITH CHECK (true);


--
-- Name: tamanhos Todos podem ver tamanhos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem ver tamanhos" ON public.tamanhos FOR SELECT USING (true);


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: produtos Usuários autenticados podem atualizar estoque; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem atualizar estoque" ON public.produtos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: pedidos Usuários autenticados podem criar pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem criar pedidos" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: pre_pedidos Usuários autenticados podem gerenciar pre_pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem gerenciar pre_pedidos" ON public.pre_pedidos TO authenticated USING (true) WITH CHECK (true);


--
-- Name: baixas_estoque Usuários autenticados podem inserir baixas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem inserir baixas" ON public.baixas_estoque FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: pedidos Usuários autenticados podem ler pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem ler pedidos" ON public.pedidos FOR SELECT TO authenticated USING (true);


--
-- Name: produtos Usuários autenticados podem ler produtos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem ler produtos" ON public.produtos FOR SELECT TO authenticated USING (true);


--
-- Name: usuarios Usuários autenticados podem visualizar usuarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem visualizar usuarios" ON public.usuarios FOR SELECT TO authenticated USING (true);


--
-- Name: usuarios Usuários podem atualizar apenas seus próprios dados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem atualizar apenas seus próprios dados" ON public.usuarios FOR UPDATE USING ((auth.uid() = id));


--
-- Name: usuarios Usuários podem ver apenas seu próprio perfil; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver apenas seu próprio perfil" ON public.usuarios FOR SELECT TO authenticated USING (((auth.uid())::text = (id)::text));


--
-- Name: usuarios Usuários podem ver apenas seus próprios dados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver apenas seus próprios dados" ON public.usuarios FOR SELECT USING ((auth.uid() = id));


--
-- Name: pedido_itens allow_all_on_pedido_itens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_on_pedido_itens ON public.pedido_itens USING (true) WITH CHECK (true);


--
-- Name: pedido_itens allow_crud_pedido_itens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_crud_pedido_itens ON public.pedido_itens USING (((auth.uid() IN ( SELECT pedidos.usuario_id
   FROM public.pedidos
  WHERE (pedidos.id = pedido_itens.pedido_id))) OR (auth.uid() IN ( SELECT pre_pedidos.usuario_id
   FROM public.pre_pedidos
  WHERE (pre_pedidos.id = ( SELECT pedidos.pre_pedido_id
           FROM public.pedidos
          WHERE (pedidos.id = pre_pedidos.pedido_id)))))));


--
-- Name: categorias allow_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_public_read ON public.categorias FOR SELECT USING (true);


--
-- Name: marcas allow_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_public_read ON public.marcas FOR SELECT USING (true);


--
-- Name: produtos allow_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_public_read ON public.produtos FOR SELECT USING (true);


--
-- Name: sessoes_especiais allow_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_public_read ON public.sessoes_especiais FOR SELECT USING (true);


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Bucket nfe-danfe público; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Bucket nfe-danfe público" ON storage.objects FOR SELECT USING ((bucket_id = 'nfe-danfe'::text));


--
-- Name: objects Bucket nfe-xml público; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Bucket nfe-xml público" ON storage.objects FOR SELECT USING ((bucket_id = 'nfe-xml'::text));


--
-- Name: objects Permitir exclusão para usuários autenticados; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Permitir exclusão para usuários autenticados" ON storage.objects FOR DELETE USING (((bucket_id = 'produtos'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Permitir leitura pública; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Permitir leitura pública" ON storage.objects FOR SELECT USING ((bucket_id = 'produtos'::text));


--
-- Name: objects Permitir upload para usuários autenticados; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Permitir upload para usuários autenticados" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'produtos'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Usuários autenticados podem atualizar; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Usuários autenticados podem atualizar" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = ANY (ARRAY['nfe-xml'::text, 'nfe-danfe'::text])));


--
-- Name: objects Usuários autenticados podem atualizar certificados; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Usuários autenticados podem atualizar certificados" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'certificados'::text));


--
-- Name: objects Usuários autenticados podem deletar; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Usuários autenticados podem deletar" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = ANY (ARRAY['nfe-xml'::text, 'nfe-danfe'::text])));


--
-- Name: objects Usuários autenticados podem deletar certificados; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Usuários autenticados podem deletar certificados" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'certificados'::text));


--
-- Name: objects Usuários autenticados podem fazer upload; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = ANY (ARRAY['nfe-xml'::text, 'nfe-danfe'::text])));


--
-- Name: objects Usuários autenticados podem inserir XML; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Usuários autenticados podem inserir XML" ON storage.objects FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: objects Usuários autenticados podem inserir certificados; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Usuários autenticados podem inserir certificados" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'certificados'::text));


--
-- Name: objects Usuários autenticados podem ler XML; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Usuários autenticados podem ler XML" ON storage.objects FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: objects Usuários autenticados podem ler certificados; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Usuários autenticados podem ler certificados" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'certificados'::text));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime notas_fiscais; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.notas_fiscais;


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: -
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict 3XSl4bvhZ6xTOEncL5fGZvgAnTxyNRZCDJSjt1XbTlGGFRUD36ydDuZNRbSm7NV

