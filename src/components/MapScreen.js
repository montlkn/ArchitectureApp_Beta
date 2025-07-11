// =================================================================
// FILE: src/components/MapScreen.js (Final Version with Labels & Legend)
// =================================================================
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { supabase } from "../config/supabase";
import { styles as externalStyles } from "../config/styles";
import { getColorForStyle, cleanMapStyle } from "../config/mapStyles";
import { capitalize } from "../utils/helpers";

// Memoized components prevent re-rendering if their props don't change
const ClusterMarker = React.memo(({ pointCount, coordinate, onPress }) => {
  const size = 35 + String(pointCount).length * 5;
  return (
    <Marker coordinate={coordinate} onPress={onPress} tracksViewChanges={false}>
      <View
        style={[
          styles.clusterContainer,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={styles.clusterText}>
          {pointCount > 99 ? "99+" : pointCount}
        </Text>
      </View>
    </Marker>
  );
});

// FIX: Building marker now accepts a zoom level to conditionally show its label
const BuildingMarker = React.memo(({ marker, zoom, onPress }) => {
  const color = getColorForStyle(marker.style_prim);
  return (
    <Marker
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={externalStyles.mapMarkerContainer}>
        {/* Show label only when zoomed in close (zoom level > 15) */}
        {zoom > 15 && (
          <Text
            style={[
              externalStyles.mapMarkerText,
              { backgroundColor: color, borderColor: color },
            ]}
            numberOfLines={1}
          >
            {marker.name}
          </Text>
        )}
        <View
          style={[externalStyles.mapMarkerPin, { backgroundColor: color }]}
        />
      </View>
    </Marker>
  );
});

const MapLegend = React.memo(({ markers }) => {
  // Create a list of unique styles currently on the map
  const activeStyles = markers.reduce((acc, marker) => {
    if (!marker.is_cluster && marker.style_prim) {
      const style = capitalize(marker.style_prim);
      acc[style] = (acc[style] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedStyles = Object.entries(activeStyles).sort((a, b) => b[1] - a[1]);
  return (
    <View style={externalStyles.mapLegend}>
      <Text style={externalStyles.legendTitle}>Building Styles</Text>
      {sortedStyles.slice(0, 5).map(
        (
          [name, count] // Show top 5 styles
        ) => (
          <View key={name} style={externalStyles.legendItem}>
            <View
              style={[
                externalStyles.legendColorBox,
                { backgroundColor: getColorForStyle(name) },
              ]}
            />
            <Text style={externalStyles.legendText}>
              {name} ({count})
            </Text>
          </View>
        )
      )}
    </View>
  );
});

const MapScreen = ({ setView, setCurrentBuilding, userLocation }) => {
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: userLocation?.latitude || 40.7128,
    longitude: userLocation?.longitude || -74.006,
    latitudeDelta: 0.1,
    longitudeDelta: 0.05,
  });

  const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);

  const fetchMapData = useCallback(async (currentRegion) => {
    if (!currentRegion) return;
    setLoading(true);

    const zoom = Math.round(
      Math.log(360 / currentRegion.longitudeDelta) / Math.LN2
    );
    const radiusMeters = (currentRegion.latitudeDelta * 111000) / 2;

    const { data, error } = await supabase.rpc("get_map_clusters", {
      center_lon: currentRegion.longitude,
      center_lat: currentRegion.latitude,
      p_zoom: zoom,
      radius_meters: radiusMeters,
    });

    if (error) console.error("Error fetching map clusters:", error);
    else setMarkers(data || []);

    setLoading(false);
  }, []);

  const onRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchMapData(newRegion);
    }, 300);
  };

  useEffect(() => {
    fetchMapData(region);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMarkerPress = (marker) => {
    if (marker.is_cluster && mapRef.current) {
      const newRegion = {
        latitude: marker.latitude,
        longitude: marker.longitude,
        latitudeDelta: region.latitudeDelta / (zoom > 10 ? 4 : 2.5),
        longitudeDelta: region.longitudeDelta / (zoom > 10 ? 4 : 2.5),
      };
      mapRef.current.animateToRegion(newRegion, 300);
    } else {
      setCurrentBuilding(marker);
      setView("BUILDING_INFO");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        customMapStyle={cleanMapStyle}
      >
        {markers.map((marker) =>
          marker.is_cluster ? (
            <ClusterMarker
              key={marker.id}
              pointCount={marker.point_count}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              onPress={() => handleMarkerPress(marker)}
            />
          ) : (
            <BuildingMarker
              key={marker.id}
              marker={marker}
              zoom={zoom}
              onPress={() => handleMarkerPress(marker)}
            />
          )
        )}
      </MapView>

      <TouchableOpacity
        onPress={() => setView("HOME")}
        style={externalStyles.mapCloseButton}
      >
        <Text style={{ color: "black", fontSize: 18, fontWeight: "bold" }}>
          X
        </Text>
      </TouchableOpacity>

      {/* FIX: Add the legend to the map UI */}
      <MapLegend markers={markers} />

      {loading && (
        <ActivityIndicator
          size="large"
          style={{ position: "absolute", top: "50%", alignSelf: "center" }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  clusterContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(23, 107, 135, 0.9)",
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 2,
  },
  clusterText: { color: "white", fontWeight: "bold", fontSize: 16 },
});

export default MapScreen;
