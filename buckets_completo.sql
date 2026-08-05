--
-- PostgreSQL database dump
--

\restrict ZsrSsTsg8dXK89d0ZrxSzlArcOae7xgyQtoZYKNva99VgBemVSqoQhdhdNrQ8b1

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-1.pgdg24.04+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
certificados	certificados	\N	2026-03-21 15:58:01.477283+00	2026-03-21 15:58:01.477283+00	f	f	5242880	{application/x-pkcs12,application/octet-stream}	\N	STANDARD
nfe-danfe	nfe-danfe	\N	2026-03-21 15:58:01.477283+00	2026-03-21 15:58:01.477283+00	t	f	5242880	{application/pdf}	\N	STANDARD
nfe-xml	nfe-xml	\N	2026-03-21 15:58:01.477283+00	2026-03-21 15:58:01.477283+00	t	f	10485760	{application/xml,text/xml}	\N	STANDARD
banners	banners	\N	2026-03-21 15:58:01.477283+00	2026-03-21 15:58:01.477283+00	t	f	\N	\N	\N	STANDARD
images-marcas	images-marcas	\N	2026-03-21 15:58:01.477283+00	2026-03-21 15:58:01.477283+00	t	f	\N	\N	\N	STANDARD
produtos	produtos	\N	2026-03-23 12:50:24.916843+00	2026-03-23 12:50:24.916843+00	t	f	\N	\N	\N	STANDARD
\.


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict ZsrSsTsg8dXK89d0ZrxSzlArcOae7xgyQtoZYKNva99VgBemVSqoQhdhdNrQ8b1

