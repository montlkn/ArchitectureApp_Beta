// =================================================================
// FILE: src/components/HomeScreen.js
// =================================================================
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../config/styles';
import { capitalize } from '../utils/helpers';

const HomeScreen = ({ setView, setCurrentBuilding, buildings, loading, error, visitedCount, profile }) => {
    const AVERAGE_WALKING_FEET_PER_MINUTE = 270;

    const groupedBuildings = buildings.reduce((acc, building) => {
        const style = capitalize(building.style_prim) || 'Miscellaneous';
        if (!acc[style]) acc[style] = [];
        acc[style].push(building);
        return acc;
    }, {});

    const handleBuildingPress = (building) => {
        setCurrentBuilding({...building, name: building.name || building.des_addres});
        setView('BUILDING_INFO');
    };

    const renderContent = () => {
        if (loading) return <ActivityIndicator size="large" color="#000000" />;
        if (error) return <Text style={styles.errorMessage}>{error}</Text>;
        if (Object.keys(groupedBuildings).length === 0) return <Text>No notable buildings found near you.</Text>;
        
        return Object.keys(groupedBuildings).map(style => (
            <View key={style} style={styles.styleGroupContainer}>
                <Text style={styles.styleGroupTitle}>{style}</Text>
                {groupedBuildings[style].map(building => {
                    const distanceInFeet = Math.round(building.distance_meters * 3.28084);
                    const walkTime = Math.round(distanceInFeet / AVERAGE_WALKING_FEET_PER_MINUTE);
                    const walkTimeText = walkTime < 1 ? '< 1 min walk' : `${walkTime} min walk`;
                    return (
                        <TouchableOpacity key={building.id} style={styles.listItem} onPress={() => handleBuildingPress(building)}>
                            <Image source={{ uri: building.photo_url || 'https://placehold.co/80x80/e2e8f0/e2e8f0?text=.' }} style={styles.listItemAvatar} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: 'bold' }}>{building.name || building.des_addres}</Text>
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
        <ScrollView style={styles.screen}>
            <View style={styles.header}>
                 <TouchableOpacity onPress={() => setView('PASSPORT')} style={styles.profileLinkGray}>
                    <Image
                        source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../../assets/avatar-placeholder.png')}
                        style={styles.avatarGray}
                    />
                    <Text style={styles.profileTextGray}>HI {profile?.username?.toUpperCase() }!</Text>
                </TouchableOpacity>
                <View style={styles.visitedCountContainer}>
                    <Text style={styles.visitedCount}>{visitedCount}</Text>
                    <Text style={styles.visitedCountLabel}>VISITED</Text>
                </View>
            </View>
            <View style={[styles.section, { paddingTop: 20 }]}>
                <TouchableOpacity onPress={() => setView('MAP')} style={styles.sectionHeader}>
                    <Text style={styles.title}>Architecture Around You</Text>
                    <Feather name="arrow-right" size={32} color="black" />
                </TouchableOpacity>
                {renderContent()}
            </View>
        </ScrollView>
    );
};

export default HomeScreen;