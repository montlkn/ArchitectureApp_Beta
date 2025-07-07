// =================================================================
// FILE: src/components/MapScreen.js
// =================================================================
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { styles } from '../config/styles';
import { LoadingView } from './common';
import { getColorForStyle, cleanMapStyle } from '../config/mapStyles';
import { capitalize } from '../utils/helpers';

const MapScreen = ({ setView, setCurrentBuilding, buildings, loading, error, userLocation }) => {
    const mapRef = useRef(null);
    const [region, setRegion] = useState(null);

    useEffect(() => {
        if (userLocation && !region) {
            setRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.02,
            });
        }
    }, [userLocation]);

    const onMarkerPress = (building) => {
        setCurrentBuilding({ ...building, name: building.name || building.des_addres });
        setView('BUILDING_INFO');
    };

    if (loading) return <LoadingView message="Loading map..." />;
    if (error) return <View style={styles.centerScreen}><Text style={styles.errorMessage}>{error}</Text></View>;
    if (!userLocation) return <LoadingView message="Getting your location..." />;

    const styleCounts = buildings.reduce((acc, building) => {
        const style = capitalize(building.style_prim) || 'Miscellaneous';
        acc[style] = (acc[style] || 0) + 1;
        return acc;
    }, {});
    
    const activeStyles = Object.keys(styleCounts);

    return (
        <View style={{flex: 1}}>
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                customMapStyle={cleanMapStyle}
                initialRegion={region}
                provider={PROVIDER_GOOGLE}
                showsUserLocation={true}
            >
                {buildings.map(marker => {
                    if (!marker.latitude || !marker.longitude) return null;
                    const style = capitalize(marker.style_prim) || 'Miscellaneous';
                    const color = getColorForStyle(style);
                    return (
                        <Marker
                            key={marker.id}
                            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                            onPress={() => onMarkerPress(marker)}
                        >
                            <View style={styles.mapMarkerContainer}>
                                <Text style={[styles.mapMarkerText, { backgroundColor: color, borderColor: color }]} numberOfLines={1}>
                                    {marker.name || marker.des_addres || 'Building'}
                                </Text>
                                <View style={[styles.mapMarkerPin, { backgroundColor: color }]} />
                            </View>
                        </Marker>
                    );
                })}
            </MapView>
            <TouchableOpacity onPress={() => setView('HOME')} style={styles.mapCloseButton}>
                <Text style={{color: 'black', fontSize: 18, fontWeight: 'bold'}}>X</Text>
            </TouchableOpacity>
            <View style={styles.mapLegend}>
                <Text style={styles.legendTitle}>Building Styles</Text>
                {activeStyles.map(name => {
                    const color = getColorForStyle(name);
                    const count = styleCounts[name];
                    if (!name || name === 'Not Determined' || name === 'Miscellaneous') return null;
                    return (
                        <View key={name} style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: color }]} />
                            <Text style={styles.legendText}>{name} ({count})</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

export default MapScreen;