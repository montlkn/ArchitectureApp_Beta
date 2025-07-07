# Architecture Explorer

**Discover the stories behind the buildings around you. Point, scan, and learn about your architectural surroundings!**

## Overview

Architecture Explorer is a mobile app that helps users discover and learn about notable buildings and landmarks in their vicinity. By using your device’s camera and location, the app identifies nearby architecture, provides detailed information, and lets you collect “stamps” for places you visit.

## Features

- **Point & Scan Discovery:** Use your camera to scan buildings and instantly get information about them.
- **Interactive Map:** View nearby architectural landmarks on a map, color-coded by style.
- **Building Details:** See rich details about each building, including architect, style, date, materials, and more.
- **Personal Passport:** Track your visited buildings, collect digital “stamps,” and view your achievements.
- **Custom Lists:** Save favorite buildings to custom lists for future reference.
- **Profile & Achievements:** Set a profile picture and unlock achievements as you explore.
- **Authentication:** Secure login and signup powered by Supabase.

## Screenshots

*(Add screenshots here if available)*

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A Supabase project (for backend/database)
- Google Cloud Vision API key (optional, for advanced landmark recognition)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/architecture-explorer.git
   cd architecture-explorer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory with the following keys (see `app.config.js` for details):

   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY=your_google_vision_api_key
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Start the app:**
   ```bash
   npm start
   ```
   Then follow the Expo instructions to run on iOS, Android, or web.

## Project Structure

- `App.js` — Main app logic and navigation
- `src/components/` — All major screens and UI components:
  - `HomeScreen.js` — List of nearby buildings
  - `MapScreen.js` — Interactive map view
  - `CameraScreen.js` — Camera interface for scanning
  - `BuildingInfoScreen.js` — Detailed info for a building
  - `PassportScreen.js` — User’s passport, lists, and achievements
  - `Auth.js` — Authentication flow
- `src/config/` — Styles, map styles, and Supabase config
- `image_fetcher/` — Scripts for importing and managing building images
- `database/` — Landmark data and data dictionary

## Data & Backend

- **Supabase** is used for authentication, user profiles, building data, and user achievements.
- **Database files** in `/database/` can be used to seed or update your Supabase tables.
- **Image fetcher scripts** in `/image_fetcher/` help automate the process of attaching images to buildings.

## Permissions

The app requests the following permissions:
- Camera (for scanning buildings)
- Location (to find nearby landmarks)
- Photos (to set a profile picture)

## Customization

- Update the app’s branding in `app.config.js` and `assets/`.
- Add or update building data in the `/database/` folder.
- Adjust styles in `src/config/styles.js`.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

0BSD 