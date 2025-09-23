--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-09-21 18:38:47 UTC

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
-- TOC entry 219 (class 1259 OID 81949)
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    id integer NOT NULL,
    code integer NOT NULL,
    expired timestamp with time zone NOT NULL,
    userid integer NOT NULL,
    uuid character varying NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 81947)
-- Name: session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.session_id_seq OWNER TO postgres;

--
-- TOC entry 3457 (class 0 OID 0)
-- Dependencies: 217
-- Name: session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.session_id_seq OWNED BY public.session.id;


--
-- TOC entry 218 (class 1259 OID 81948)
-- Name: session_userid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.session_userid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.session_userid_seq OWNER TO postgres;

--
-- TOC entry 3458 (class 0 OID 0)
-- Dependencies: 218
-- Name: session_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.session_userid_seq OWNED BY public.session.userid;


--
-- TOC entry 221 (class 1259 OID 81957)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    airport character varying DEFAULT 'VIE'::character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 81956)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 3459 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 224 (class 1259 OID 81967)
-- Name: ways; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ways (
    id integer NOT NULL,
    userid integer NOT NULL,
    departure character varying NOT NULL,
    arrival character varying NOT NULL,
    arrivaltime timestamp without time zone NOT NULL,
    completed boolean DEFAULT false
);


ALTER TABLE public.ways OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 81965)
-- Name: ways_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ways_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ways_id_seq OWNER TO postgres;

--
-- TOC entry 3460 (class 0 OID 0)
-- Dependencies: 222
-- Name: ways_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ways_id_seq OWNED BY public.ways.id;


--
-- TOC entry 223 (class 1259 OID 81966)
-- Name: ways_userid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ways_userid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ways_userid_seq OWNER TO postgres;

--
-- TOC entry 3461 (class 0 OID 0)
-- Dependencies: 223
-- Name: ways_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ways_userid_seq OWNED BY public.ways.userid;


--
-- TOC entry 3286 (class 2604 OID 81952)
-- Name: session id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session ALTER COLUMN id SET DEFAULT nextval('public.session_id_seq'::regclass);


--
-- TOC entry 3287 (class 2604 OID 81953)
-- Name: session userid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session ALTER COLUMN userid SET DEFAULT nextval('public.session_userid_seq'::regclass);


--
-- TOC entry 3288 (class 2604 OID 81960)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3290 (class 2604 OID 81970)
-- Name: ways id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ways ALTER COLUMN id SET DEFAULT nextval('public.ways_id_seq'::regclass);


--
-- TOC entry 3291 (class 2604 OID 81971)
-- Name: ways userid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ways ALTER COLUMN userid SET DEFAULT nextval('public.ways_userid_seq'::regclass);


--
-- TOC entry 3446 (class 0 OID 81949)
-- Dependencies: 219
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres

--
-- TOC entry 3451 (class 0 OID 81967)
-- Dependencies: 224
-- Data for Name: ways; Type: TABLE DATA; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.session_id_seq', 32, true);


--
-- TOC entry 3463 (class 0 OID 0)
-- Dependencies: 218
-- Name: session_userid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.session_userid_seq', 1, false);


--
-- TOC entry 3464 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- TOC entry 3465 (class 0 OID 0)
-- Dependencies: 222
-- Name: ways_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ways_id_seq', 34, true);


--
-- TOC entry 3466 (class 0 OID 0)
-- Dependencies: 223
-- Name: ways_userid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ways_userid_seq', 1, false);


--
-- TOC entry 3294 (class 2606 OID 81955)
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- TOC entry 3296 (class 2606 OID 81964)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3298 (class 2606 OID 81976)
-- Name: ways ways_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ways
    ADD CONSTRAINT ways_pkey PRIMARY KEY (id);


-- Completed on 2025-09-21 18:38:48 UTC

--
-- PostgreSQL database dump complete
--
