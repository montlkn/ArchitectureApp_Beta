// =================================================================
// FILE: src/components/HomeScreen.js (Functionality Restored)
// =================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { supabase } from '../config/supabase';
import { styles } from '../config/styles';
import { capitalize } from '../utils/helpers';

const HomeScreen = ({ navigation }) => {
    const [profile, setProfile] = useState(null);
    const [visitedCount, setVisitedCount] = useState(0);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profileError) throw profileError;
            setProfile(profileData);

            const { count, error: countError } = await supabase.from('stamps').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            if (countError) throw countError;
            setVisitedCount(count || 0);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') throw new Error('Location permission is required.');
            
            const location = await Location.getCurrentPositionAsync({});
            const { data: buildingsData, error: buildingsError } = await supabase.rpc('nearby_buildings', {
                lat: location.coords.latitude,
                long: location.coords.longitude,
            });
            if (buildingsError) throw buildingsError;
            setBuildings(buildingsData || []);

        } catch (err) {
            setError(err.message);
            console.error("Error fetching home screen data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await fetchData();
        setRefreshing(false);
    }, []);

    const handleBuildingPress = (building) => {
        navigation.navigate('BuildingInfo', { building });
    };

    const renderContent = () => {
        if (loading && !refreshing) return <ActivityIndicator size="large" color="#000000" style={{marginTop: 20}}/>;
        if (error) return <Text style={styles.errorMessage}>{error}</Text>;
        
        const groupedBuildings = buildings.reduce((acc, building) => {
            const style = capitalize(building.style_prim) || 'Miscellaneous';
            if (!acc[style]) acc[style] = [];
            acc[style].push(building);
            return acc;
        }, {});

        if (Object.keys(groupedBuildings).length === 0) return <Text style={{textAlign: 'center', marginTop: 20, color: 'gray'}}>No notable buildings found near you.</Text>;
        
        return Object.keys(groupedBuildings).map(style => (
            <View key={style} style={styles.styleGroupContainer}>
                <Text style={styles.styleGroupTitle}>{style}</Text>
                {groupedBuildings[style].map(building => {
                    const walkTime = building.distance_meters ? Math.round(building.distance_meters / 80) : 0;
                    const walkTimeText = walkTime < 1 ? '< 1 min walk' : `${walkTime} min walk`;
                    return (
                        <TouchableOpacity key={building.id} style={styles.listItem} onPress={() => handleBuildingPress(building)}>
                            <Image source={{ uri: building.photo_url || 'https://placehold.co/80x80' }} style={styles.listItemAvatar} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: 'bold' }}>{building.name || building.des_addres}</Text>
                                {/* FIX: This line restores the architect and date info */}
                                <Text style={{ color: 'gray' }}>{[capitalize(building.arch_build), building.date_combo].filter(Boolean).join(' | ')}</Text>
                                <Text style={styles.walkTimeText}>{walkTimeText}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        ));
    };

    return (
        <ScrollView 
            style={styles.screen}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                 <TouchableOpacity onPress={() => navigation.navigate('Passport')} style={styles.profileLinkGray}>
                    <Image
                        source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../../assets/avatar-placeholder.png')}
                        style={styles.avatarGray}
                    />
                    <Text style={styles.profileTextGray}>HI {profile?.username?.toUpperCase() || 'EXPLORER'}!</Text>
                </TouchableOpacity>
                <View style={styles.visitedCountContainer}>
                    <Text style={styles.visitedCount}>{visitedCount}</Text>
                    <Text style={styles.visitedCountLabel}>VISITED</Text>
                </View>
            </View>
            <View style={[styles.section, { paddingTop: 20 }]}>
                <TouchableOpacity onPress={() => navigation.navigate('Map')} style={styles.sectionHeader}>
                    <Text style={styles.title}>Architecture Around You</Text>
                    <Feather name="arrow-right" size={32} color="black" />
                </TouchableOpacity>
                {renderContent()}
            </View>
        </ScrollView>
    );
};

export default HomeScreen;