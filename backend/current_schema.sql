-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_audit_logs (
  id text NOT NULL,
  user_id text NOT NULL,
  trip_id text NOT NULL,
  action text NOT NULL,
  metadata_json jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_audit_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ai_context_snapshots (
  id text NOT NULL,
  trip_id text NOT NULL,
  page_key text NOT NULL,
  context_json jsonb NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_context_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT ai_context_snapshots_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.ai_conversations (
  id text NOT NULL,
  trip_id text NOT NULL,
  user_id text NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT ai_conversations_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.ai_messages (
  id text NOT NULL,
  conversation_id text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  model text,
  token_usage_json jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id)
);
CREATE TABLE public.ai_tool_snapshots (
  id text NOT NULL,
  conversation_id text NOT NULL,
  page_key text NOT NULL,
  tool_name text NOT NULL,
  status text NOT NULL,
  payload_json jsonb,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_tool_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT ai_tool_snapshots_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id)
);
CREATE TABLE public.itinerary_items (
  id text NOT NULL,
  trip_id text NOT NULL,
  day_index integer NOT NULL CHECK (day_index >= 1),
  time_block text NOT NULL CHECK (time_block = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text])),
  status text NOT NULL DEFAULT 'planned'::text CHECK (status = ANY (ARRAY['planned'::text, 'todo'::text, 'finished'::text])),
  category text NOT NULL DEFAULT 'activities'::text CHECK (category = ANY (ARRAY['outbound_flight'::text, 'inbound_flight'::text, 'commute'::text, 'activities'::text, 'games'::text, 'food'::text, 'sightseeing'::text, 'shopping'::text, 'rest'::text, 'other'::text])),
  title text NOT NULL,
  location_label text NOT NULL DEFAULT ''::text,
  place_id text,
  lat double precision,
  lng double precision,
  location_link text,
  google_maps_link text,
  commute_details text,
  notes text,
  start_time_local text,
  end_time_local text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT itinerary_items_pkey PRIMARY KEY (id),
  CONSTRAINT itinerary_items_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.profiles (
  user_id text NOT NULL,
  country_code text NOT NULL DEFAULT ''::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id)
);
CREATE TABLE public.trip_collaborator_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trip_id text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'editor'::text CHECK (role = ANY (ARRAY['editor'::text, 'viewer'::text])),
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  CONSTRAINT trip_collaborator_invites_pkey PRIMARY KEY (id),
  CONSTRAINT trip_collaborator_invites_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.trip_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trip_id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['Flight'::text, 'Hotel'::text, 'ID/Visa'::text, 'Activity'::text, 'Other'::text])),
  file_size_bytes bigint NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trip_documents_pkey PRIMARY KEY (id),
  CONSTRAINT trip_documents_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.trip_flights (
  id text NOT NULL,
  trip_id text NOT NULL,
  source text NOT NULL CHECK (source = ANY (ARRAY['outbound'::text, 'inbound'::text, 'one_way'::text])),
  route text NOT NULL DEFAULT ''::text,
  flight_date text NOT NULL DEFAULT ''::text,
  departure text NOT NULL DEFAULT ''::text,
  arrival text NOT NULL DEFAULT ''::text,
  duration text NOT NULL DEFAULT ''::text,
  stops text NOT NULL DEFAULT ''::text,
  airline text NOT NULL DEFAULT ''::text,
  cost text NOT NULL DEFAULT ''::text,
  offer_id text,
  book_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  flight_number text NOT NULL DEFAULT ''::text,
  notes text NOT NULL DEFAULT ''::text,
  stop_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT trip_flights_pkey PRIMARY KEY (id),
  CONSTRAINT trip_flights_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.trip_ground_trips (
  id text NOT NULL,
  trip_id text NOT NULL,
  source text NOT NULL CHECK (source = ANY (ARRAY['outbound'::text, 'inbound'::text, 'one_way'::text, 'other'::text])),
  route text NOT NULL DEFAULT ''::text,
  travel_date text NOT NULL DEFAULT ''::text,
  departure text NOT NULL DEFAULT ''::text,
  arrival text NOT NULL DEFAULT ''::text,
  duration text NOT NULL DEFAULT ''::text,
  operator text NOT NULL DEFAULT ''::text,
  service_number text NOT NULL DEFAULT ''::text,
  cost text NOT NULL DEFAULT ''::text,
  notes text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trip_ground_trips_pkey PRIMARY KEY (id),
  CONSTRAINT trip_ground_trips_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.trip_hotel_stays (
  id text NOT NULL,
  trip_id text NOT NULL,
  property_name text NOT NULL DEFAULT ''::text,
  area text NOT NULL DEFAULT ''::text,
  check_in text NOT NULL DEFAULT ''::text,
  check_out text NOT NULL DEFAULT ''::text,
  address_note text NOT NULL DEFAULT ''::text,
  total_cost text NOT NULL DEFAULT ''::text,
  currency text NOT NULL DEFAULT 'CAD'::text,
  notes text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trip_hotel_stays_pkey PRIMARY KEY (id),
  CONSTRAINT trip_hotel_stays_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.trip_members (
  trip_id text NOT NULL,
  user_id text NOT NULL,
  role text NOT NULL DEFAULT 'viewer'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trip_members_pkey PRIMARY KEY (trip_id, user_id),
  CONSTRAINT trip_members_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.trip_packing_items (
  id text NOT NULL,
  trip_id text NOT NULL,
  user_id text,
  label text NOT NULL DEFAULT ''::text,
  is_checked boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trip_packing_items_pkey PRIMARY KEY (id),
  CONSTRAINT trip_packing_items_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.trip_share_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trip_id text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  label text,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  CONSTRAINT trip_share_links_pkey PRIMARY KEY (id),
  CONSTRAINT trip_share_links_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.trip_transit_routes (
  id text NOT NULL,
  trip_id text NOT NULL,
  day_index integer NOT NULL DEFAULT 1,
  from_label text NOT NULL DEFAULT ''::text,
  to_label text NOT NULL DEFAULT ''::text,
  from_place_id text NOT NULL DEFAULT ''::text,
  to_place_id text NOT NULL DEFAULT ''::text,
  mode text NOT NULL DEFAULT 'rail'::text,
  duration_minutes integer NOT NULL DEFAULT 0,
  departure_time_local text NOT NULL DEFAULT ''::text,
  arrival_time_local text NOT NULL DEFAULT ''::text,
  estimated_cost numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CAD'::text,
  provider text NOT NULL DEFAULT 'manual'::text CHECK (provider = ANY (ARRAY['google_maps'::text, 'manual'::text])),
  provider_route_ref text NOT NULL DEFAULT ''::text,
  reference_url text NOT NULL DEFAULT ''::text,
  transfers integer NOT NULL DEFAULT 0,
  walking_minutes integer NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trip_transit_routes_pkey PRIMARY KEY (id),
  CONSTRAINT trip_transit_routes_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);
CREATE TABLE public.trips (
  id text NOT NULL,
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  timezone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  travelers integer NOT NULL DEFAULT 1,
  is_group_trip boolean NOT NULL DEFAULT false,
  total_days integer NOT NULL DEFAULT 1,
  travel_scope text NOT NULL DEFAULT 'international'::text CHECK (travel_scope = ANY (ARRAY['domestic'::text, 'international'::text])),
  CONSTRAINT trips_pkey PRIMARY KEY (id)
);