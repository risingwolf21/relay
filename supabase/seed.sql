SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict pvPPFyaZ6nOWhxW9Gefv55jt4HsnurlISQ5HmgjJrpU3nKJBiIKvHbWzsDOCq7P

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '1f44f854-76f9-4f1c-9fb4-b752e4fb454f', '{"action":"user_signedup","actor_id":"980ee21b-c6fa-44f4-8e7b-23489e32bfa6","actor_name":"Karl Wolf","actor_username":"karl.wolf2706@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-06-04 10:31:42.258106+00', ''),
	('00000000-0000-0000-0000-000000000000', '3d9b1ad4-9b2f-4643-9413-cf868a5f07ef', '{"action":"login","actor_id":"980ee21b-c6fa-44f4-8e7b-23489e32bfa6","actor_name":"Karl Wolf","actor_username":"karl.wolf2706@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-06-04 10:31:42.262846+00', '');


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', 'authenticated', 'authenticated', 'karl.wolf2706@gmail.com', '$2a$10$7yu9n1xa/Jt26OxcEMAJHOiUi8vCCR3ZQPIVLkClIthjZuh/WaYLq', '2026-06-04 10:31:42.258609+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-06-04 10:31:42.263316+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "980ee21b-c6fa-44f4-8e7b-23489e32bfa6", "email": "karl.wolf2706@gmail.com", "full_name": "Karl Wolf", "email_verified": true, "phone_verified": false}', NULL, '2026-06-04 10:31:42.253889+00', '2026-06-04 10:31:42.265056+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('980ee21b-c6fa-44f4-8e7b-23489e32bfa6', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', '{"sub": "980ee21b-c6fa-44f4-8e7b-23489e32bfa6", "email": "karl.wolf2706@gmail.com", "full_name": "Karl Wolf", "email_verified": false, "phone_verified": false}', 'email', '2026-06-04 10:31:42.256924+00', '2026-06-04 10:31:42.256954+00', '2026-06-04 10:31:42.256954+00', 'e4cceb25-6ca8-4564-ab57-417420f2de44');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('968124ed-6694-4a5f-b751-2436aea5c1ed', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', '2026-06-04 10:31:42.263359+00', '2026-06-04 10:31:42.263359+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '192.168.65.1', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('968124ed-6694-4a5f-b751-2436aea5c1ed', '2026-06-04 10:31:42.265241+00', '2026-06-04 10:31:42.265241+00', 'password', 'c35b264c-94f0-4bc7-a32c-164e14168c02');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'ugtr3jlvfkd5', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', false, '2026-06-04 10:31:42.264342+00', '2026-06-04 10:31:42.264342+00', NULL, '968124ed-6694-4a5f-b751-2436aea5c1ed');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "email", "full_name", "avatar_url", "created_at", "updated_at") VALUES
	('980ee21b-c6fa-44f4-8e7b-23489e32bfa6', 'karl.wolf2706@gmail.com', 'Karl Wolf', NULL, '2026-06-04 10:31:42.253696+00', '2026-06-04 10:31:42.253696+00');


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."projects" ("id", "name", "description", "slug", "created_by", "created_at", "updated_at") VALUES
	('01355b3d-8754-4168-b751-6e7966713389', 'Relay', 'Everything about this project', 'relay', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', '2026-06-04 10:31:53.688011+00', '2026-06-04 10:31:53.688011+00');


--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."project_members" ("project_id", "user_id", "role", "invited_by", "joined_at") VALUES
	('01355b3d-8754-4168-b751-6e7966713389', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', 'admin', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', '2026-06-04 10:31:53.688011+00');


--
-- Data for Name: saved_searches; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."saved_searches" ("id", "user_id", "name", "filters", "created_at", "updated_at") VALUES
	('e4b69038-cec9-4ffe-b533-ca173cc56c7c', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', 'My open tickets', '{"text": "", "statuses": [], "priorities": [], "assignee_me": true, "project_ids": []}', '2026-06-04 10:32:16.480227+00', '2026-06-04 10:32:16.480227+00');


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tickets" ("id", "project_id", "title", "description", "status", "priority", "assignee_id", "created_by", "position", "created_at", "updated_at") VALUES
	('3801c903-3583-4f4a-b4ed-d7e1a6d5fbac', '01355b3d-8754-4168-b751-6e7966713389', 'Initial Ticket', 'Das ist das erste TIckets', 'backlog', 'medium', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', 0, '2026-06-04 10:32:57.166168+00', '2026-06-04 10:32:57.166168+00'),
	('a7f937b9-0a52-47a5-b7e1-b1a1b033d27c', '01355b3d-8754-4168-b751-6e7966713389', 'todo', 'regelmäßige aufgaben
bis wann es erledigt sein muss
wann zu letzt gemacht', 'todo', 'urgent', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', 0, '2026-06-04 10:39:12.814179+00', '2026-06-04 10:39:12.814179+00');


--
-- Data for Name: ticket_activity; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ticket_activity" ("id", "ticket_id", "user_id", "type", "old_value", "new_value", "created_at") VALUES
	('0232d971-7e85-4e5d-95f5-b5998489e1ff', '3801c903-3583-4f4a-b4ed-d7e1a6d5fbac', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', 'created', NULL, NULL, '2026-06-04 10:32:57.166168+00'),
	('d8419aea-3e42-4698-bb04-6321f03f5673', 'a7f937b9-0a52-47a5-b7e1-b1a1b033d27c', '980ee21b-c6fa-44f4-8e7b-23489e32bfa6', 'created', NULL, NULL, '2026-06-04 10:39:12.814179+00');


--
-- Data for Name: ticket_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict pvPPFyaZ6nOWhxW9Gefv55jt4HsnurlISQ5HmgjJrpU3nKJBiIKvHbWzsDOCq7P

RESET ALL;
