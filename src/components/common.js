// =================================================================
// FILE: src/components/common.js (Final Version)
// =================================================================
import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { styles } from '../config/styles';

export const LoadingView = ({ message }) => (
    <View style={styles.centerScreen}>
        <ActivityIndicator size="large" />
        <Text style={{marginTop: 10}}>{message || 'Loading...'}</Text>
    </View>
);

export const ErrorView = ({ message, setView }) => (
    <View style={styles.centerScreen}>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorMessage}>{message}</Text>
        <TouchableOpacity style={styles.button} onPress={() => setView('HOME')}>
            <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
    </View>
);

export const NavBar = ({ view, setView }) => (
    <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBarItem} onPress={() => setView('HOME')}>
            <Text style={[styles.icon, view === 'HOME' && styles.iconActive]}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBarItem} onPress={() => setView('PASSPORT')}>
            <Text style={[styles.icon, view === 'PASSPORT' && styles.iconActive]}>🎟️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBarItem} onPress={() => setView('CAMERA')}>
            <Text style={styles.cameraIconSpecial}>📸</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBarItem} onPress={() => setView('MAP')}>
            <Text style={[styles.icon, view === 'MAP' && styles.iconActive]}>🗺️</Text>
        </TouchableOpacity>
    </View>
);

// Corrected SwipeableListItem Component
export const SwipeableListItem = ({ item, onPress, onDelete, expanded, editMode, children }) => {
  
  const renderRightActions = () => (
    <TouchableOpacity onPress={onDelete} style={styles.deleteAction}>
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={editMode ? renderRightActions : null}>
      <TouchableOpacity onPress={onPress} style={styles.buildingItem}>
        {item.photo_url && (
          <Image
            source={{ uri: item.photo_url }}
            style={styles.listItemAvatar}
          />
        )}
        <View style={{ flex: 1, paddingVertical: 10, justifyContent: 'center' }}>
          {children}
        </View>
        <Text style={styles.arrowIcon}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
    </Swipeable>
  );
};

export const BookmarkIcon = () => (
  <Text style={{fontSize: 20}}>🔖</Text>
);

export const DirectionsIcon = () => (
  <Text style={{fontSize: 20}}>🗺️</Text>
);