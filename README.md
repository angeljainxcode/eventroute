# EventRoute — Feasibility-First Inter-College Event Discovery Platform

> **“Don’t just discover an event. Know whether you can actually attend it.”**

EventRoute is an engineering-first web platform for college students that solves a critical problem: discovering inter-college hackathons, robotics challenges, symposiums, and tech fests, while deterministically calculating whether the student can realistically attend based on travel duration, budget, required morning departure time, and confirmed return-trip transit availability.

---

## 1. Core Architecture & Features

### Screen A — Landing Page
- Product identity with clean location-pin/route motif.
- Highlight of the three feasibility verdicts: **FEASIBLE** (Green), **DIFFICULT** (Amber), and **NOT FEASIBLE** (Red).
- Central demonstration benchmark scenario preview.
- Interactive "How It Works" breakdown of the 4-step calculation engine.
- Direct quick-actions to explore events or publish an organizer fest.

### Screen B — Choose Location & Student Budget
- Allows choosing starting college: **ITM Gwalior (Default origin)**, **MITS Gwalior**, **Jiwaji University**, **RGPV Bhopal**, **BIET Jhansi**, or a **Custom Starting Location**.
- Configurable student travel budget slider (₹100 to ₹2,500).
- Configurable travel mode preferences: Transit (Bus/Train), Bus Only, Train Only, Bike/Two-wheeler, or Cab.
- Configurable safety buffers: Arrival buffer (15m, 30m, 48m benchmark preset, 60m) and post-event return buffer.

### Screen C — Map-Based Event Discovery
- Interactive **Leaflet with OpenStreetMap & CartoDB** map with custom feasibility-colored markers (Green/Amber/Red).
- Real-time search across event titles, colleges, keywords, and venues.
- Filters by category (Hackathon, Symposium, Technical Fest, Workshop, Coding Contest, Robotics).
- Filters by feasibility verdict and distance radius.
- Sort options: Soonest Date, Nearest Distance, Lowest Travel Cost, Most Feasible.
- Responsive View Switcher: Split view (Map + Cards side-by-side on desktop), Cards-only view, or Full-screen Map view.

### Screen D — Event Details
- Detailed event banner, host university, dates, session start and end times.
- Clear eligibility and fee indicators.
- Source verification and last-verified timestamps.
- Save/bookmark action and direct “Check Route & Feasibility” launcher.

### Screen E — Travel Feasibility Dashboard (The Core Feature)
- **Feasibility Verdict**: Prominent green, amber, or red status banner with comprehensive explanatory rationales.
- **Key Metrics**:
  - Distance (km) and estimated travel duration.
  - Required departure time (calculated: `eventStartTime - travelDuration - arrivalBuffer`).
  - Expected arrival time at venue.
  - Estimated one-way and roundtrip travel fare vs student budget.
  - Available on-ground participation time.
  - Return transit status (`CONFIRMED`, `UNKNOWN`, or `NO_VIABLE_RETURN`).
- **Interactive Journey Timeline**: Visual chronological itinerary from origin departure, transit travel, safety buffer, event duration, return transit, and estimated arrival back home.
- **Interactive Route Map (`RouteMap.tsx`)**: Renders origin marker, destination marker, and road corridor polyline using open OSRM routing with fallback road corridor interpolation.
- **Return Transit Timetable**: Complete schedule of confirmed/advisory bus and train services from venue to origin.
- **Live Sandbox Parameter Tuner**: Interactive sliders for arrival buffer, budget, mode, and starting college with instant live recalculation.

### Screen F — Organiser Event Publishing
- Form for college student bodies and clubs to submit events with title, venue, coordinates, date, timings, fee, eligibility, registration link, and source information.
- Saves to **Supabase PostgreSQL** if credentials are provided in `.env`, or seamless **Local Persistence** fallback.
- Newly published events immediately appear in discovery and map views.

### Screen G — Saved Itinerary & Events
- Shortlisted events dashboard with chronological list view and calendar grid view.
- Real-time departure warnings and one-click route inspection.

### Screen H — AI Assistant (with Graceful Fallbacks)
- **Poster-to-Event OCR Extractor**: Visual extraction of title, host college, date, time, and fee from event posters, with pre-loaded demo posters (RoboDrone Fest, DevSprint Hackathon, GenAI Showcase). Graceful fallback when Gemini API key is absent.
- **Natural-Language Query Search**: Deterministic semantic interpreter for complex queries such as:
  > *“Find technical events this Saturday that I can attend from Gwalior and return the same day under ₹500.”*
- **Personalized Recommender**: Recommendations matching technical interests (Hackathons, Robotics, etc.) and travel budgets.

---

## 2. Central Demonstration Benchmark Scenario

The platform comes calibrated with the benchmark scenario:
- **Student Origin**: ITM Gwalior (NH-75, Jhansi Road, Gwalior)
- **Event Destination**: Government Engineering College, Morena (~60.5 km away)
- **Event**: Chambal Tech Symposium & Hackathon 2026
- **Event Timing**: 10:00 AM – 5:00 PM
- **Illustrative Travel Duration**: 3 hours 32 minutes (212 minutes)
- **Illustrative One-Way Cost**: ₹180 (Roundtrip ₹360)
- **Arrival Safety Buffer**: 48 minutes
- **Required Departure Time**: **05:40 AM** (Calculated: 10:00 AM - 212m - 48m = 05:40 AM)
- **Expected Arrival Time**: **09:12 AM** (Calculated: 05:40 AM + 212m = 09:12 AM)
- **Return Availability**: Initially **UNKNOWN** (clearly labeled as unconfirmed in demo dataset rather than falsely claiming no return or guaranteeing one exists).

---

## 3. Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v3 with custom responsive theme tokens
- **Maps**: Leaflet + OpenStreetMap tiles with custom SVG marker icons
- **Routing**: Open Source Routing Machine (OSRM) with offline corridor polyline fallback
- **Icons**: Lucide React
- **Persistence**: Supabase JS Client with unified LocalStorage fallback
- **Testing**: Vitest for deterministic business logic unit tests

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js (v18 or higher, tested on Node v24)
- npm (v9 or higher)

### Installation
```bash
# Navigate to the project directory
cd scratch/eventroute

# Install dependencies
npm install

# Run Vitest unit tests
npm test

# Build for production
npm run build

# Start local development server
npm run dev
```

The application will launch at `http://localhost:5173/`.

---

## 5. Environment Variables

Create a `.env` file in the root directory (optional):

```env
# Supabase Configuration (Optional for remote PostgreSQL sync)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API Key (Optional for live multimodal poster vision)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

*Note: All core features (routing, feasibility calculations, interactive map, local event publishing, and demo OCR) work 100% locally without external API keys.*

---

## 6. Unit Tests Suite

Deterministic unit tests in `src/tests/feasibilityEngine.test.ts` verify the business logic:
- `converts HH:MM string to minutes correctly`
- `formats minutes to 12h time string correctly`
- `calculates departure 05:40 AM and arrival 09:12 AM for 60km benchmark scenario`
- `produces FEASIBLE verdict for local Gwalior events with confirmed return and budget`
- `flags budgetExceeded and marks DIFFICULT/NOT_FEASIBLE when budget is too low`
- `marks NOT_FEASIBLE when travel causes late arrival after event start`
- `marks NOT_FEASIBLE when all scheduled return transit departs before event conclusion`
- `reports UNKNOWN return availability when return schedule is missing without false claims`

Run tests anytime with:
```bash
npm test
```

---

## 7. Demo Limitations & Disclaimers

- Road distances and travel times are estimated using road networks and transit heuristics; actual travel conditions may vary with traffic and local transit schedules.
- Seed events are clearly labeled as demonstration data for testing the feasibility decision engine.
- EventRoute does not track background student GPS without explicit location selection.
