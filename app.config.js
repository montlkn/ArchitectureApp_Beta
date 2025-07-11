// Use require for this config file
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Export a function that returns the configuration object
export default ({ config }) => {
  // The 'config' argument contains the default expo configuration
  // We will now merge our custom settings into it
  return {
    // Spread the default config to preserve its properties
    ...config,

    // --- Overwrite with your App's Metadata ---
    name: "Architecture Explorer",
    slug: "architectureappbeta",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],

    // --- iOS Configuration ---
    ios: {
      ...config.ios, // Spread existing iOS config
      supportsTablet: true,
      bundleIdentifier: "com.lucienmount.architectureexplorer",
      buildNumber: "2",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },

    // --- Android Configuration ---
    android: {
      // ... your existing android config
    },
    web: {
      // ... your existing web config
    },

    // --- Plugins ---
    plugins: [
      // ... your existing plugins
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ],
      ["expo-camera", { /* ... */ }],
      ["expo-location", { /* ... */ }],
      ["expo-image-picker", { /* ... */ }]
    ],

    // --- Extra Data (merged for secure key loading) ---
    extra: {
      ...config.extra, // Spread existing extra config
      // API Keys loaded securely from your .env file
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      googleCloudVisionApiKey: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY,
      googleMapsApiKey: process.env.EXPO_PUBLIC_Maps_API_KEY,
      
      // FIX: Add this block as requested by the error message
      eas: {
        "projectId": "f5983105-64ae-4406-ace3-b226b79c109b"
      }
    }
  };
};