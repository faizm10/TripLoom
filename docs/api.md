# API references

- [SerpAPI Google Flights](https://serpapi.com/google-flights-api) – flight search, return flights, and booking options.

## SerpAPI Google Flights (how we use it)

We use three behaviours, all with `engine=google_flights` and `api_key`, `currency=USD`, `hl=en` where applicable.

### 1. Flights search (initial results)

- **SerpAPI:** [Google Flights API](https://serpapi.com/google-flights-api) (params: `departure_id`, `arrival_id`, `outbound_date`, `return_date` for round trip, `type`: 1 = round trip, 2 = one way).
- **Our route:** `POST /api/flights/serp/search` with `slices` and optional `return_date`.
- **Response:** We map `best_flights` and `other_flights` to normalized offers. Each offer can have `departure_token` (for fetching return leg) and `booking_token` (for booking options).

### 2. Return flights (after user selects an outbound)

- **SerpAPI:** Same engine with `departure_token` from the selected outbound offer, plus `outbound_date`, `return_date`, SerpAPI uses the **original round-trip** convention: `departure_id` = trip origin (return destination), `arrival_id` = trip destination (return origin). Our route swaps these when calling SerpAPI. See [Flights Results](https://serpapi.com/google-flights-results) and “Example for returning flights with booking token”.
- **Our route:** `POST /api/flights/serp/return-flights` with `departure_token`, `outbound_date`, `return_date`, `departure_id`, `arrival_id`, `adults`, optional `outbound_offer_id`.
- **Response:** We map `best_flights` and `other_flights` to return offers (often with `booking_token` for the combined trip).

### 3. Booking options (direct link to book)

- **SerpAPI:** [Google Flights Booking Options API](https://serpapi.com/google-flights-booking-options) – “Booking options shows only if you provide **booking_token** in the search parameters.”
- **Our route:** `POST /api/flights/serp/booking-options` with `booking_token` (or we try `departure_token`; SerpAPI may not return `booking_options` for that).
- **Response:** We return the first `booking_request.url` and `post_data` so the client can POST to Google and open the pre-selected flight.

### Token rules (SerpAPI)

- `departure_token`: from flight results; used to request **return** flights (or next leg). Must be complete (including base64 `==` padding if present).
- `booking_token`: from flight results (often return-leg or combined); used to get **booking_options** and thus a direct booking link.
