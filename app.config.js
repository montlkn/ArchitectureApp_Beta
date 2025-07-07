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
      ...config.android, // Spread existing Android config
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.lucienmount.architectureexplorer",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
    },
    web: {
      ...config.web,
      favicon: "./assets/favicon.png"
    },

    // --- Plugins ---
    plugins: [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan landmarks."
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to find nearby landmarks."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos to let you select a profile picture."
        }
      ]
    ],

    // --- Extra Data (merged for secure key loading) ---
    extra: {
      ...config.extra, // Spread existing extra config
      // API Keys loaded securely from your .env file
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      googleCloudVisionApiKey: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY,
      // ================= FIX ================
      // Corrected the environment variable name to match .env file
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      
      // EAS Project ID
      eas: {
        "projectId": "f5983105-64ae-4406-ace3-b226b79c109b"
      }
    }
  };
};
