// =================================================================
// FILE: src/components/common.js
// =================================================================
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { styles } from '../config/styles';

export const LoadingView = ({ message }) => ( <View style={styles.centerScreen}><ActivityIndicator size="large" color="#000000" /><Text style={{ marginTop: 15, fontSize: 16 }}>{message}</Text></View> );
export const ErrorView = ({ message, setView }) => ( <View style={styles.centerScreen}><Text style={styles.errorTitle}>Scan Failed</Text><Text style={styles.errorMessage}>{message}</Text><TouchableOpacity onPress={() => setView('HOME')} style={styles.button}><Text style={styles.buttonText}>Try Again</Text></TouchableOpacity></View> );

export const HomeIcon = ({isActive}) => <Text style={[styles.icon, isActive && styles.iconActive]}>🏠</Text>;
export const BookmarkIcon = ({isActive}) => <Text style={[styles.icon, isActive && styles.iconActive]}>🔖</Text>;
export const CameraIcon = ({isActive}) => <Text style={[styles.icon, isActive && styles.iconActive, styles.cameraIconSpecial]}>📷</Text>;
export const MapIcon = ({isActive}) => <Text style={[styles.icon, isActive && styles.iconActive]}>🗺️</Text>;
export const DirectionsIcon = () => <Text style={styles.directionsIcon}>➤</Text>;

export const NavBar = ({ view, setView }) => ( <View style={styles.navBar}><TouchableOpacity onPress={() => setView('HOME')} style={styles.navBarItem}><HomeIcon isActive={view === 'HOME'} /></TouchableOpacity><TouchableOpacity onPress={() => setView('PASSPORT')} style={styles.navBarItem}><BookmarkIcon isActive={view === 'PASSPORT'} /></TouchableOpacity><TouchableOpacity onPress={() => setView('CAMERA')} style={styles.navBarItem}><CameraIcon isActive={view === 'CAMERA'} /></TouchableOpacity><TouchableOpacity onPress={() => setView('MAP')} style={styles.navBarItem}><MapIcon isActive={view === 'MAP'} /></TouchableOpacity></View> );

export const SwipeableListItem = ({ building, onBuildingPress, onDelete }) => {
    const renderRightActions = () => (<TouchableOpacity onPress={onDelete} style={styles.deleteAction}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>);
    return (
        <Swipeable renderRightActions={renderRightActions}>
            <TouchableOpacity onPress={() => onBuildingPress(building)} style={styles.buildingItem}>
                <Text style={styles.expandedListItemText} numberOfLines={1}>{building.des_addres || building.name}</Text>
                <View style={styles.swipeIconContainer}><Feather name="menu" size={24} color="#cccccc" /></View>
            </TouchableOpacity>
        </Swipeable>
    );
};