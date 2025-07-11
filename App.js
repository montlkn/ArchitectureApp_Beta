// =================================================================
// FILE: App.js (The NEW root file)
// =================================================================
import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Alert } from "react-native";
import * as Location from "expo-location";
import { supabase } from "./src/config/supabase";
import { styles } from "./src/config/styles";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Import all screen components from their separate files
import AuthFlow from "./src/components/Auth";
import HomeScreen from "./src/components/HomeScreen";
import MapScreen from "./src/components/MapScreen";
import PassportScreen from "./src/components/PassportScreen";
import CameraScreen from "./src/components/CameraScreen";
import BuildingInfoScreen from "./src/components/BuildingInfoScreen";
import { LoadingView, ErrorView, NavBar } from "./src/components/common";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, _setView] = useState("HOME");
  const [viewHistory, setViewHistory] = useState(["HOME"]);
  const [currentBuilding, setCurrentBuilding] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [nearbyBuildings, setNearbyBuildings] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(true);
  const [nearbyError, setNearbyError] = useState(null);
  const [mapBuildings, setMapBuildings] = useState([]);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [visitedCount, setVisitedCount] = useState(0);
  const [userLocation, setUserLocation] = useState(null);

  const setView = (newView) => {
    if (newView === view) return;
    setViewHistory((prev) => [...prev, newView]);
    _setView(newView);
  };

  const goBack = () => {
    if (viewHistory.length <= 1) return;
    const newHistory = [...viewHistory];
    newHistory.pop();
    _setView(newHistory[newHistory.length - 1]);
    setViewHistory(newHistory);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          const errorMsg = "Location permission denied.";
          setNearbyError(errorMsg);
          setIsLoadingNearby(false);
          setMapError(errorMsg);
          setIsLoadingMap(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
        fetchNearbyBuildings(location.coords);

        const { count } = await supabase
          .from("stamps")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id);
        setVisitedCount(count || 0);
      } else {
        setProfile(null);
        setNearbyBuildings([]);
        setMapBuildings([]);
        setVisitedCount(0);
        setUserLocation(null);
      }
    });

    (async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();
      if (!initialSession) setIsLoadingNearby(false);
    })();

    return () => subscription.unsubscribe();
  }, []);

  const fetchNearbyBuildings = async (coords) => {
    setIsLoadingNearby(true);
    try {
      const { data, error } = await supabase.rpc("nearby_buildings", {
        lat: coords.latitude,
        long: coords.longitude,
      });

      if (error) {
        // This will send the error to the catch block
        throw error;
      }

      setNearbyBuildings(data || []);
    } catch (err) {
      console.error("Error fetching nearby buildings:", err);
    } finally {
      // This block runs no matter what, ensuring the loader always stops.
      setIsLoadingNearby(false);
    }
  };

  const fetchMapData = async () => {
    if (!userLocation) {
      setMapError("Could not get user location for map.");
      setIsLoadingMap(false);
      return;
    }
    setIsLoadingMap(true);
    setMapError(null);
    try {
      const { data, error } = await supabase.rpc("buildings_in_radius", {
        lat: userLocation.latitude,
        long: userLocation.longitude,
        radius_meters: 1500,
      });
      if (error) throw error;
      setMapBuildings(data || []);
    } catch (err) {
      console.error("Error fetching map buildings:", err);
      setMapError("Failed to fetch map buildings.");
    } finally {
      setIsLoadingMap(false);
    }
  };

  useEffect(() => {
    if (view === "MAP" && userLocation) {
      fetchMapData();
    }
  }, [view, userLocation]);

  const handleCapture = async (base64Image, location) => {
    if (!session?.user)
      return Alert.alert("Authentication Error", "You must be logged in.");
    try {
      setView("LOADING");
      setLoadingMessage("Identifying landmark...");
      // Note: Google Vision API part is commented out for now to focus on Supabase logic
      const { data, error } = await supabase.rpc("match_building_by_landmark", {
        landmark_name: "some landmark",
        user_lat: location.latitude,
        user_long: location.longitude,
      });
      if (error) throw new Error(`Database search failed: ${error.message}`);
      if (!data || data.length === 0)
        throw new Error(`We could not identify this landmark.`);

      const matchedBuilding = data[0];
      const { error: stampError } = await supabase
        .from("stamps")
        .insert({ user_id: session.user.id, building_id: matchedBuilding.id });
      if (stampError && stampError.code !== "23505")
        console.error("Error creating stamp:", stampError);
      else if (!stampError) setVisitedCount((prev) => prev + 1);

      setCurrentBuilding(matchedBuilding);
      setView("BUILDING_INFO");
    } catch (err) {
      setErrorMessage(err.message);
      setView("ERROR");
    } finally {
      setLoadingMessage("");
    }
  };

  const renderView = () => {
    switch (view) {
      case "LOADING":
        return <LoadingView message={loadingMessage} />;
      case "ERROR":
        return <ErrorView message={errorMessage} setView={setView} />;
      case "CAMERA":
        return <CameraScreen goBack={goBack} handleCapture={handleCapture} />;
      case "BUILDING_INFO":
        return (
          <BuildingInfoScreen
            building={currentBuilding}
            goBack={goBack}
            session={session}
          />
        );
      case "PASSPORT":
        return (
          <PassportScreen
            setView={setView}
            setCurrentBuilding={setCurrentBuilding}
            profile={profile}
            setProfile={setProfile}
            session={session}
          />
        );
      case "MAP":
        return (
          <MapScreen
            setView={setView}
            setCurrentBuilding={setCurrentBuilding}
            buildings={mapBuildings}
            loading={isLoadingMap}
            error={mapError}
            userLocation={userLocation}
          />
        );
      default:
        return (
          <HomeScreen
            setView={setView}
            setCurrentBuilding={setCurrentBuilding}
            buildings={nearbyBuildings}
            loading={isLoadingNearby}
            error={nearbyError}
            visitedCount={visitedCount}
            profile={profile}
          />
        );
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {session && session.user ? (
        <SafeAreaView style={styles.container}>
          <View style={{ flex: 1 }}>{renderView()}</View>
          <NavBar view={view} setView={setView} />
        </SafeAreaView>
      ) : (
        <AuthFlow />
      )}
    </GestureHandlerRootView>
  );
}
