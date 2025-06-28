import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Modal,
    FlatList,
    TextInput,
    Text,
    View,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Platform,
    Linking,
    SafeAreaView,
    ScrollView,
    Alert,
    Button
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { createClient } from '@supabase/supabase-js';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// --- DATABASE & API CONFIGURATION ---
const SUPABASE_URL = 'https://gzzvhmmywaaxljpmoacm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6enZobW15d2FheGxqcG1vYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODA4NTYsImV4cCI6MjA2NjQ1Njg1Nn0.Euv81JmeXShGmyyXcD7Am3Gi0SjsLqMLSevC1PZVBaA';
const GOOGLE_CLOUD_VISION_API_KEY = 'AIzaSyCn7WGMhVsSOioKIk22wPHZTtOspKVncjE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Icons ---
const HomeIcon = ({isActive}) => <Text style={[styles.icon, isActive && styles.iconActive]}>🏠</Text>;
const BookmarkIcon = ({isActive}) => <Text style={[styles.icon, isActive && styles.iconActive]}>🔖</Text>;
const CameraIcon = ({isActive}) => <Text style={[styles.icon, isActive && styles.iconActive, styles.cameraIconSpecial]}>📷</Text>;
const MapIcon = ({isActive}) => <Text style={[styles.icon, isActive && styles.iconActive]}>🗺️</Text>;
const DirectionsIcon = () => <Text style={styles.directionsIcon}>➤</Text>;

const capitalize = (str) => {
    if (!str || str === '0') return '';
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

// --- AUTH COMPONENTS ---
const SignUpScreen = ({ setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });
        if (error) Alert.alert('Error', error.message);
        else if (!data.session) Alert.alert("Success!", "Please check your email for a confirmation link.");
        setLoading(false);
    };

    return (
        <View style={styles.centerScreen}>
            <Text style={styles.title}>Create Account</Text>
            <TextInput style={styles.textInput} placeholder="Email" value={email} onChangeText={setEmail} autoComplete="email" autoCapitalize="none" />
            <TextInput style={styles.textInput} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <Button title={loading ? "Loading..." : "Sign Up"} onPress={handleSignUp} disabled={loading} />
            <TouchableOpacity onPress={() => setView('LOGIN')}>
                <Text style={{marginTop: 20}}>Already have an account? Login</Text>
            </TouchableOpacity>
        </View>
    );
};

const LoginScreen = ({ setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    };

    return (
        <View style={styles.centerScreen}>
            <Text style={styles.title}>Welcome Back</Text>
            <TextInput style={styles.textInput} placeholder="Email" value={email} onChangeText={setEmail} autoComplete="email" autoCapitalize="none" />
            <TextInput style={styles.textInput} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <Button title={loading ? "Loading..." : "Login"} onPress={handleLogin} disabled={loading} />
            <TouchableOpacity onPress={() => setView('SIGNUP')}>
                <Text style={{marginTop: 20}}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
};

const AuthFlow = () => {
    const [view, setView] = useState('LOGIN');
    if (view === 'SIGNUP') return <SignUpScreen setView={setView} />;
    return <LoginScreen setView={setView} />;
}

// --- MAIN APP COMPONENTS ---
const HomeScreen = ({ setView, setCurrentBuilding, buildings, loading, error, visitedCount, profile }) => {
    const AVERAGE_WALKING_FEET_PER_MINUTE = 270;

    const groupedBuildings = buildings.reduce((acc, building) => {
        const style = capitalize(building.style_prim) || 'Miscellaneous';
        if (!acc[style]) acc[style] = [];
        acc[style].push(building);
        return acc;
    }, {});

    const handleBuildingPress = (building) => {
        setCurrentBuilding(building);
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
                                <Text style={{ fontWeight: 'bold' }}>{building.name}</Text>
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
                        source={profile?.avatar_url ? { uri: profile.avatar_url } : require('./assets/avatar-placeholder.png')}
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
                <TouchableOpacity onPress={() => setView('MAP')} style={styles.sectionHeader}>
                    <Text style={styles.title}>Architecture Around You</Text>
                    <Feather name="arrow-right" size={32} color="black" />
                </TouchableOpacity>
                {renderContent()}
            </View>
        </ScrollView>
    );
};

const CameraScreen = ({ goBack, handleCapture }) => {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [locationPermissionStatus, setLocationPermissionStatus] = useState(null);
    const cameraRef = useRef(null);

    useEffect(() => {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermissionStatus(status);
      })();
    }, []);

    if (!cameraPermission || !locationPermissionStatus) return <LoadingView message="Requesting permissions..." />;
    if (!cameraPermission.granted) return (<View style={styles.centerScreen}><Text style={styles.errorMessage}>We need camera permission.</Text><Button onPress={requestCameraPermission} title="Grant Permission" /><TouchableOpacity onPress={goBack} style={styles.button}><Text style={styles.buttonText}>Back</Text></TouchableOpacity></View>);
    if (locationPermissionStatus !== 'granted') return (<View style={styles.centerScreen}><Text style={styles.errorMessage}>Location permission is required.</Text><TouchableOpacity onPress={goBack} style={styles.button}><Text style={styles.buttonText}>Back</Text></TouchableOpacity></View>);
    
    const onCapture = async () => {
        if (!cameraRef.current) return;
        try {
            const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
            if (photo) {
                const location = await Location.getCurrentPositionAsync({});
                handleCapture(photo.base64, location.coords);
            }
        } catch(e) {
            Alert.alert("Capture Failed", "Could not take picture. Please try again.");
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <CameraView style={StyleSheet.absoluteFillObject} facing={'back'} ref={cameraRef} />
            <View style={styles.cameraContainer}>
                <TouchableOpacity onPress={goBack} style={styles.cameraCloseButton}><Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>X</Text></TouchableOpacity>
                <TouchableOpacity onPress={onCapture} style={styles.captureButton}><View style={styles.captureButtonInner} /></TouchableOpacity>
            </View>
        </View>
    );
};

const BuildingInfoScreen = ({ building, goBack, session }) => {
    const [isSaveModalVisible, setSaveModalVisible] = useState(false);
    const [lists, setLists] = useState([]);
    const [newListName, setNewListName] = useState('');

    if (!building) return <LoadingView message="Loading building data..." />;

    const fetchLists = async () => {
        if (!session?.user) return;
        const { data, error } = await supabase.from('lists').select('*').eq('user_id', session.user.id);
        if (error) console.error("Error fetching lists:", error);
        else setLists(data || []);
    };

    const openSaveModal = () => {
        fetchLists();
        setSaveModalVisible(true);
    };

    const handleSaveToList = async (listId) => {
        const { error } = await supabase.from('list_items').insert({ list_id: listId, building_id: building.id });
        if (error) {
            if (error.code === '23505') Alert.alert("Already Saved", "This building is in that list.");
            else Alert.alert("Error", "Could not save to list.");
        } else {
            Alert.alert("Success!", "Building saved.");
            setSaveModalVisible(false);
        }
    };

    const handleCreateAndSave = async () => {
        if (!newListName.trim() || !session?.user) return;
        const { data: newListData, error: newListError } = await supabase
            .from('lists').insert({ name: newListName, user_id: session.user.id }).select().single();
        if (newListError) Alert.alert("Error", "Could not create list.");
        else if (newListData) {
            await handleSaveToList(newListData.id);
            setNewListName('');
        }
    };

    const materials = [building.mat_prim, building.mat_sec, building.mat_third].filter(mat => mat && mat !== '0').join(', ');
    const mapsUrl = Platform.select({
        ios: `maps:0,0?q=${encodeURIComponent(building.des_addres || building.name)}`,
        android: `geo:0,0?q=${encodeURIComponent(building.des_addres || building.name)}`,
    });
    const renderInfoRow = (label, value) => {
        if (!value || value === '0') return null;
        return <Text style={styles.infoText}><Text style={styles.infoLabel}>{label}:</Text> {value}</Text>;
    };

    return (
        <View style={{flex: 1}}>
            <ScrollView style={styles.screen}>
                <Image source={{ uri: building.photo_url || 'https://placehold.co/600x400/e2e8f0/e2e8f0?text=.' }} style={styles.buildingImage} />
                {building.photo_attribution && <Text style={styles.attributionText}>{building.photo_attribution.replace(/<[^>]*>?/gm, '')}</Text>}
                <Text style={styles.buildingTitle}>{building.name || building.des_addres || "Building Details"}</Text>
                <View style={styles.infoBox}>
                     {renderInfoRow("Architect", capitalize(building.arch_build))}
                     {renderInfoRow("Style", capitalize(building.style_prim))}
                     {renderInfoRow("Date", building.date_combo)}
                     {renderInfoRow("Materials", materials)}
                     {renderInfoRow("Original Use", capitalize(building.use_orig))}
                     {renderInfoRow("Building Type", capitalize(building.build_type))}
                </View>
                <View style={styles.actionsContainer}>
                    <TouchableOpacity onPress={openSaveModal} style={styles.actionButton}><BookmarkIcon/><Text style={styles.actionButtonText}> Save to List</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openURL(mapsUrl)} style={styles.actionButton}><DirectionsIcon /><Text style={styles.actionButtonText}> Directions</Text></TouchableOpacity>
                </View>
            </ScrollView>
            <TouchableOpacity onPress={goBack} style={styles.screenCloseButton}><Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>X</Text></TouchableOpacity>
            <Modal transparent={true} animationType="fade" visible={isSaveModalVisible} onRequestClose={() => setSaveModalVisible(false)}>
                 <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity onPress={() => setSaveModalVisible(false)} style={styles.modalCloseButton}><Text style={{fontSize: 22, color: '#555'}}>X</Text></TouchableOpacity>
                        <Text style={styles.modalTitle}>Save to a List</Text>
                        <Text style={styles.sectionTitle}>Create a New List</Text>
                        <TextInput style={styles.textInput} placeholder="e.g., 'Midtown Marvels'" value={newListName} onChangeText={setNewListName} />
                        <Button title="Create & Save" onPress={handleCreateAndSave} />
                        <View style={{height: 20}} />
                        <Text style={styles.sectionTitle}>Add to Existing List</Text>
                        <FlatList data={lists} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => ( <TouchableOpacity style={styles.listSelectItem} onPress={() => handleSaveToList(item.id)}><Text>{item.name}</Text></TouchableOpacity> )} ListEmptyComponent={<Text style={{color: 'gray', marginVertical: 10}}>No lists found.</Text>}/>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styleColors = { 'Art Deco': '#00A896', 'Beaux-Arts': '#A4243B', 'Modern': '#033F63', 'Gothic Revival': '#7A306C', 'Neoclassical': '#F4A261', 'Simplified Colonial Revival Or Art Deco': '#2A9D8F', 'Neo-Gothic': '#6A0572', 'French Second Empire': '#E76F51', 'Modified Classical': '#264653', 'Renaissance Revival': '#D81159', 'Romanesque Revival': '#FFBC42' };
const defaultColor = '#95a5a6';
const getColorForStyle = (style) => styleColors[capitalize(style)] || defaultColor;

const cleanMapStyle = [ { stylers: [{ saturation: -100 }] }, { featureType: "all", elementType: "labels.icon", stylers: [{ visibility: "off" }] }, { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] }, { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] }, { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] }, { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e3e3e3" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#d5d5d5" }] }, { featureType: "road.local", elementType: "geometry.fill", stylers: [{ color: "#f2f2f2" }] }, { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#f5f5f5" }] }, ];

const MapScreen = ({ setView, setCurrentBuilding, buildings, loading, error, userLocation }) => {
    const mapRef = useRef(null);
    const [region, setRegion] = useState(null);
    const [clusters, setClusters] = useState([]);
    const [clusterData, setClusterData] = useState({});

    const getClusters = (points, currentRegion) => {
        if (!points || points.length === 0 || !currentRegion) return { visibleMarkers: [], newClusterData: {} };
        const zoom = Math.round(Math.log(360 / currentRegion.longitudeDelta) / Math.LN2);
        if (zoom > 16) return { visibleMarkers: points.map(p => ({ ...p, isCluster: false })), newClusterData: {} };
        
        const clusterMap = {};
        const newClusterData = {};
        const clusterSize = 0.04 * Math.pow(0.5, zoom - 10);
        points.forEach(point => {
            const gridX = Math.round(point.latitude / clusterSize);
            const gridY = Math.round(point.longitude / clusterSize);
            const key = `${gridX}-${gridY}`;
            if (!clusterMap[key]) clusterMap[key] = { points: [] };
            clusterMap[key].points.push(point);
        });
        const finalClusters = [];
        for (const key in clusterMap) {
            const cluster = clusterMap[key];
            if (cluster.points.length === 1) {
                finalClusters.push({ ...cluster.points[0], isCluster: false });
            } else {
                const centerLat = cluster.points.reduce((sum, p) => sum + p.latitude, 0) / cluster.points.length;
                const centerLon = cluster.points.reduce((sum, p) => sum + p.longitude, 0) / cluster.points.length;
                finalClusters.push({ id: key, isCluster: true, count: cluster.points.length, latitude: centerLat, longitude: centerLon });
                newClusterData[key] = cluster.points;
            }
        }
        return { visibleMarkers: finalClusters, newClusterData };
    };

    const onMarkerPress = (building) => {
        setCurrentBuilding(building);
        setView('BUILDING_INFO');
    };

    const handleClusterPress = (clusterId) => {
        const points = clusterData[clusterId];
        if (points && points.length > 0 && mapRef.current) {
            const coordinates = points.map(p => ({ latitude: p.latitude, longitude: p.longitude }));
            mapRef.current.fitToCoordinates(coordinates, { edgePadding: { top: 100, right: 100, bottom: 150, left: 100 }, animated: true });
        }
    };

    useEffect(() => {
        if (userLocation && !region) {
            setRegion({ latitude: userLocation.latitude, longitude: userLocation.longitude, latitudeDelta: 0.05, longitudeDelta: 0.02 });
        }
    }, [userLocation]);

    useEffect(() => {
        if (!buildings || !Array.isArray(buildings)) return;
        const buildingPoints = buildings.filter(b => b.latitude && b.longitude);
        if (region) {
            const { visibleMarkers, newClusterData } = getClusters(buildingPoints, region);
            setClusters(visibleMarkers);
            setClusterData(newClusterData);
        }
    }, [buildings, region]);

    if (loading) return <LoadingView message="Loading map..." />;
    if (error) return <View style={styles.centerScreen}><Text style={styles.errorMessage}>{error}</Text></View>;
    if (!region) return <LoadingView message="Getting location..." />;
    if (!buildings) return <LoadingView message="Loading map data..." />;

    const styleCounts = buildings.reduce((acc, building) => {
        const style = capitalize(building.style_prim) || 'Miscellaneous';
        acc[style] = (acc[style] || 0) + 1;
        return acc;
    }, {});
    
    const activeStyles = Object.keys(styleCounts);

    return (
        <View style={{flex: 1}}>
            <MapView ref={mapRef} style={StyleSheet.absoluteFillObject} customMapStyle={cleanMapStyle} region={region} onRegionChangeComplete={setRegion} provider={PROVIDER_GOOGLE} showsUserLocation={true}>
                {clusters.map(marker => {
                    if (marker.isCluster) {
                        return (
                            <Marker key={marker.id} coordinate={{ latitude: marker.latitude, longitude: marker.longitude }} onPress={() => handleClusterPress(marker.id)}>
                                <View style={styles.clusterMarker}><Text style={styles.clusterText}>{marker.count}</Text></View>
                            </Marker>
                        );
                    }
                    const style = capitalize(marker.style_prim) || 'Miscellaneous';
                    const color = getColorForStyle(style);
                    return (
                        <Marker key={marker.id} coordinate={{ latitude: marker.latitude, longitude: marker.longitude }} onPress={() => onMarkerPress(marker)}>
                            <View style={styles.mapMarkerContainer}>
                                <Text style={[styles.mapMarkerText, { backgroundColor: color, borderColor: color }]} numberOfLines={1}>{marker.name || 'Building'}</Text>
                                <View style={[styles.mapMarkerPin, { backgroundColor: color }]} />
                            </View>
                        </Marker>
                    );
                })}
            </MapView>
            <TouchableOpacity onPress={() => setView('HOME')} style={styles.mapCloseButton}><Text style={{color: 'black', fontSize: 18, fontWeight: 'bold'}}>X</Text></TouchableOpacity>
            <View style={styles.mapLegend}>
                <Text style={styles.legendTitle}>Building Styles</Text>
                {activeStyles.map(name => {
                    const color = getColorForStyle(name);
                    const count = styleCounts[name];
                    if (!name || name === 'Not Determined' || name === 'Miscellaneous') return null;
                    return ( <View key={name} style={styles.legendItem}><View style={[styles.legendColorBox, { backgroundColor: color }]} /><Text style={styles.legendText}>{name} ({count})</Text></View> );
                })}
            </View>
        </View>
    );
};

const SwipeableListItem = ({ building, onBuildingPress, onDelete }) => {
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

const PassportScreen = ({ setView, setCurrentBuilding, profile, setProfile, session }) => {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedListId, setExpandedListId] = useState(null);
    const [buildingsInList, setBuildingsInList] = useState([]);
    const [loadingBuildings, setLoadingBuildings] = useState(false);
    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const [isRenameModalVisible, setRenameModalVisible] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [listToEdit, setListToEdit] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [stamps, setStamps] = useState([]);
    const [achievements, setAchievements] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const { data: listData, error: listError } = await supabase.from('lists').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
                if(listError) throw listError;
                setLists(listData || []);

                const { data: stampData, error: stampError } = await supabase.from('stamps').select('id, buildings(name, photo_url)').eq('user_id', session.user.id);
                if(stampError) throw stampError;
                setStamps(stampData || []);

                const { data: achievementData, error: achievementError } = await supabase.rpc('get_user_achievements');
                if(achievementError) throw achievementError;
                setAchievements(achievementData || []);

            } catch (error) {
                console.error("Error fetching passport data:", error.message);
                Alert.alert("Error", "Could not load passport data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session]);

    const handleProfilePicPress = async () => {
        if (!editMode || !session?.user) return;
        
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Permission Denied", "We need access to photos.");
    
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
        if (result.canceled || !result.assets?.[0]) return;
        
        const image = result.assets[0];
        setLoading(true);
        try {
            const base64 = await FileSystem.readAsStringAsync(image.uri, { encoding: 'base64' });
            const filePath = `${session.user.id}/${new Date().getTime()}.png`;
            const contentType = 'image/png';
        
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, base64, { contentType, upsert: true });
            if (uploadError) throw uploadError;
        
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
            if (updateError) throw updateError;
            
            setProfile({ ...profile, avatar_url: publicUrl });
        } catch (error) {
            Alert.alert("Upload Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateList = async () => {
        if (!newListName.trim() || !session?.user) return Alert.alert("Invalid Name", "Please enter a name.");
        const { error } = await supabase.from('lists').insert({ name: newListName, user_id: session.user.id });
        if (error) Alert.alert("Error", "Could not create list.");
        else {
            setNewListName('');
            setCreateModalVisible(false);
            // Re-fetch lists after creating a new one
            const { data, error } = await supabase.from('lists').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
            if (!error) setLists(data || []);
        }
    };

    const handleRenameList = async () => {
        if (!newListName.trim() || !listToEdit) return Alert.alert("Invalid Name", "Please enter a new name.");
        const { error } = await supabase.from('lists').update({ name: newListName }).eq('id', listToEdit.id);
        if (error) Alert.alert("Error", "Could not rename list.");
        else {
            setNewListName('');
            setRenameModalVisible(false);
            setListToEdit(null);
            // Re-fetch lists after renaming
            const { data, error } = await supabase.from('lists').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
            if (!error) setLists(data || []);
        }
    };

    const handleDeleteList = (listId) => {
        Alert.alert( "Delete List", "Are you sure?", [ { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => {
            const { error } = await supabase.from('lists').delete().eq('id', listId);
            if (error) Alert.alert("Error", "Could not delete list.");
            else setLists(lists.filter(l => l.id !== listId));
        }}]);
    };

    const handleDeleteItem = (listId, buildingId) => {
        Alert.alert("Remove Building", "Are you sure?", [ { text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: async () => {
            const { error } = await supabase.from('list_items').delete().match({ list_id: listId, building_id: buildingId });
            if (error) Alert.alert("Error", "Could not remove building.");
            else handleListPress(listId);
        }}]);
    };

    const handleListPress = async (listId) => {
        if (expandedListId === listId) { setExpandedListId(null); return; }
        setExpandedListId(listId);
        setLoadingBuildings(true);
        const { data, error } = await supabase.from('list_items').select(`buildings(*)`).eq('list_id', listId);
        if (error) console.error("Error fetching buildings in list:", error);
        else setBuildingsInList(data.map(item => item.buildings).filter(Boolean));
        setLoadingBuildings(false);
    };

    const openRenameModal = (list) => {
        setListToEdit(list);
        setNewListName(list.name);
        setRenameModalVisible(true);
    };

    const handleBuildingPress = (building) => {
        setCurrentBuilding(building);
        setView('BUILDING_INFO');
    };

    if (loading) return <LoadingView message="Loading your passport..." />;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ScrollView style={styles.screen}>
                <Modal transparent visible={isCreateModalVisible} animationType="fade" onRequestClose={() => setCreateModalVisible(false)}><View style={styles.modalOverlay}><View style={styles.modalContent}><TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.modalCloseButton}><Text style={{fontSize: 22}}>X</Text></TouchableOpacity><Text style={styles.modalTitle}>Create List</Text><TextInput style={styles.textInput} placeholder="e.g., 'Brooklyn Heights Walk'" value={newListName} onChangeText={setNewListName} /><Button title="Create List" onPress={handleCreateList} /></View></View></Modal>
                <Modal transparent visible={isRenameModalVisible} animationType="fade" onRequestClose={() => setRenameModalVisible(false)}><View style={styles.modalOverlay}><View style={styles.modalContent}><TouchableOpacity onPress={() => setRenameModalVisible(false)} style={styles.modalCloseButton}><Text style={{fontSize: 22}}>X</Text></TouchableOpacity><Text style={styles.modalTitle}>Rename List</Text><TextInput style={styles.textInput} value={newListName} onChangeText={setNewListName} /><Button title="Save Changes" onPress={handleRenameList} /></View></View></Modal>

                <View style={styles.passportHeader}>
                    <TouchableOpacity onPress={handleProfilePicPress} disabled={!editMode}>
                        <Image source={profile?.avatar_url ? { uri: profile.avatar_url } : require('./assets/avatar-placeholder.png')} style={styles.passportAvatar} />
                    </TouchableOpacity>
                    {editMode && <Text style={styles.avatarEditText}>Edit</Text>}
                </View>

                <View style={styles.passportTitleContainer}>
                    <Text style={styles.passportTitle}>Passport</Text>
                     <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <TouchableOpacity onPress={() => setEditMode(!editMode)}><Text style={styles.editButton}>{editMode ? 'Done' : 'Edit'}</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => supabase.auth.signOut()} style={{marginLeft: 15}}><Text style={{color: '#FF3B30'}}>Sign Out</Text></TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Stamps ({stamps.length})</Text>
                    {stamps.length > 0 ? (
                        stamps.map(stamp => stamp.buildings ? (
                            <View key={stamp.id} style={styles.listItem}>
                                <Image source={{ uri: stamp.buildings.photo_url || 'https://placehold.co/80x80/e2e8f0/e2e8f0?text=.' }} style={styles.listItemAvatar} />
                                <Text>{stamp.buildings.name}</Text>
                            </View>
                        ) : null)
                    ) : (
                        <View style={styles.visitedContainer}><Text style={styles.placeholderText}>Go get exploring!</Text></View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Achievements</Text>
                    {achievements.length > 0 ? (
                        achievements.map(ach => (
                            <View key={ach.name} style={{paddingVertical: 5}}>
                                <Text style={{fontWeight: 'bold'}}>🏆 {ach.name}</Text>
                                <Text style={{color: 'gray'}}>{ach.description}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.visitedContainer}><Text style={styles.placeholderText}>Visit buildings to earn achievements!</Text></View>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.myListsHeader}>
                        <Text style={styles.sectionTitle}>My Lists</Text>
                        <TouchableOpacity onPress={() => setCreateModalVisible(true)}><Text style={styles.plusIcon}>+</Text></TouchableOpacity>
                    </View>
                    {lists.length === 0 ? <Text style={styles.placeholderText}>No lists yet. Tap '+' to start.</Text> : lists.map(list => (
                        <View key={list.id} style={styles.listContainer}>
                            <TouchableOpacity onPress={() => !editMode && handleListPress(list.id)} style={styles.listItem}>
                                <View style={{ flex: 1 }}><Text style={{ fontWeight: 'bold' }}>{list.name}</Text></View>
                                {editMode ? ( <View style={styles.editListActions}><TouchableOpacity onPress={() => openRenameModal(list)}><Text style={styles.renameButton}>Rename</Text></TouchableOpacity><TouchableOpacity onPress={() => handleDeleteList(list.id)}><Text style={styles.deleteButton}>Delete</Text></TouchableOpacity></View> ) : ( <Text style={styles.arrowIcon}>{expandedListId === list.id ? '↓' : '→'}</Text> )}
                            </TouchableOpacity>
                            {!editMode && expandedListId === list.id && ( <View style={styles.expandedList}>{loadingBuildings ? <ActivityIndicator/> : ( buildingsInList.length > 0 ? buildingsInList.map(building => ( <SwipeableListItem key={building.id} building={building} onBuildingPress={handleBuildingPress} onDelete={() => handleDeleteItem(list.id, building.id)}/> )) : <Text style={styles.emptyListText}>This list is empty.</Text> )} </View> )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </GestureHandlerRootView>
    );
};

const LoadingView = ({ message }) => ( <View style={styles.centerScreen}><ActivityIndicator size="large" color="#000000" /><Text style={{ marginTop: 15, fontSize: 16 }}>{message}</Text></View> );
const ErrorView = ({ message, setView }) => ( <View style={styles.centerScreen}><Text style={styles.errorTitle}>Scan Failed</Text><Text style={styles.errorMessage}>{message}</Text><TouchableOpacity onPress={() => setView('HOME')} style={styles.button}><Text style={styles.buttonText}>Try Again</Text></TouchableOpacity></View> );
const NavBar = ({ view, setView }) => ( <View style={styles.navBar}><TouchableOpacity onPress={() => setView('HOME')} style={styles.navBarItem}><HomeIcon isActive={view === 'HOME'} /></TouchableOpacity><TouchableOpacity onPress={() => setView('PASSPORT')} style={styles.navBarItem}><BookmarkIcon isActive={view === 'PASSPORT'} /></TouchableOpacity><TouchableOpacity onPress={() => setView('CAMERA')} style={styles.navBarItem}><CameraIcon isActive={view === 'CAMERA'} /></TouchableOpacity><TouchableOpacity onPress={() => setView('MAP')} style={styles.navBarItem}><MapIcon isActive={view === 'MAP'} /></TouchableOpacity></View> );

export default function App() {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [view, _setView] = useState('HOME');
    const [viewHistory, setViewHistory] = useState(['HOME']);
    const [currentBuilding, setCurrentBuilding] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
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
        setViewHistory(prev => [...prev, newView]);
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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session?.user) {
                // Fetch profile
                const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setProfile(profileData);

                // Get Location
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setNearbyError('Location permission denied.');
                    setIsLoadingNearby(false);
                    return;
                }
                const location = await Location.getCurrentPositionAsync({});
                setUserLocation(location.coords);
                fetchNearbyBuildings(location.coords);
                
                // Get visited count
                const { count } = await supabase.from('stamps').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id);
                setVisitedCount(count || 0);

            } else {
                // Clear user-specific data on sign out
                setProfile(null);
                setNearbyBuildings([]);
                setMapBuildings([]);
                setVisitedCount(0);
                setUserLocation(null);
            }
        });

        // Initial session check
        (async () => {
            const { data: { session: initialSession } } = await supabase.auth.getSession();
            if(!initialSession) setIsLoadingNearby(false); // If no session, stop loading
        })();

        return () => subscription.unsubscribe();
    }, []);

    const fetchNearbyBuildings = async (coords) => {
        setIsLoadingNearby(true);
        try {
            const { data, error } = await supabase.rpc('nearby_buildings', { lat: coords.latitude, long: coords.longitude });
            if (error) throw error;
            setNearbyBuildings(data || []);
        } catch (err) {
            setNearbyError("Failed to fetch nearby buildings.");
        } finally {
            setIsLoadingNearby(false);
        }
    };

    const fetchMapData = async () => {
        if (!userLocation) return setIsLoadingMap(false);
        setIsLoadingMap(true);
        try {
            const { data, error } = await supabase.rpc('buildings_in_radius', { lat: userLocation.latitude, long: userLocation.longitude, radius_meters: 1500 });
            if (error) throw error;
            setMapBuildings(data || []);
        } catch (err) {
            setMapError("Failed to fetch map buildings.");
        } finally {
            setIsLoadingMap(false);
        }
    };
    
    useEffect(() => {
        if (view === 'MAP' && userLocation) fetchMapData();
    }, [view, userLocation]);

    const handleCapture = async (base64Image, location) => {
        if (!session?.user) return Alert.alert("Authentication Error", "You must be logged in.");
        try {
            setView('LOADING'); setLoadingMessage('Identifying landmark...');
            const requestBody = { requests: [{ image: { content: base64Image }, features: [{ type: 'LANDMARK_DETECTION', maxResults: 5 }] }] };
            const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
            if (!visionResponse.ok) throw new Error(`Google Vision API request failed: ${visionResponse.status} ${await visionResponse.text()}`);
            const result = await visionResponse.json();
            const landmark = result.responses?.[0]?.landmarkAnnotations?.[0];
            if (!landmark || landmark.score < 0.2) throw new Error("Could not identify a landmark. Please try another angle.");
            
            setLoadingMessage(`Matching "${landmark.description}"...`);
            const { data, error } = await supabase.rpc('match_building_by_landmark', { landmark_name: landmark.description, user_lat: location.latitude, user_long: location.longitude });
            if (error) throw new Error(`Database search failed: ${error.message}`);
            if (!data || data.length === 0) throw new Error(`We know this is "${landmark.description}," but we don't have detailed records for it yet.`);
            
            const matchedBuilding = data[0];
            const { error: stampError } = await supabase.from('stamps').insert({ user_id: session.user.id, building_id: matchedBuilding.id });
            if (stampError && stampError.code !== '23505') console.error("Error creating stamp:", stampError);
            else if (!stampError) setVisitedCount(prev => prev + 1); // Increment count on new stamp
    
            setCurrentBuilding(matchedBuilding);
            setView('BUILDING_INFO');
        } catch (err) {
            setErrorMessage(err.message);
            setView('ERROR');
        } finally {
            setLoadingMessage('');
        }
    };

    const renderView = () => {
        switch (view) {
            case 'LOADING': return <LoadingView message={loadingMessage} />;
            case 'ERROR': return <ErrorView message={errorMessage} setView={setView} />;
            case 'CAMERA': return <CameraScreen goBack={goBack} handleCapture={handleCapture} />;
            case 'BUILDING_INFO': return <BuildingInfoScreen building={currentBuilding} goBack={goBack} session={session} />;
            case 'PASSPORT': return <PassportScreen setView={setView} setCurrentBuilding={setCurrentBuilding} profile={profile} setProfile={setProfile} session={session} />;
            case 'MAP': return <MapScreen setView={setView} setCurrentBuilding={setCurrentBuilding} buildings={mapBuildings} loading={isLoadingMap} error={mapError} userLocation={userLocation}/>;
            default: return <HomeScreen setView={setView} setCurrentBuilding={setCurrentBuilding} buildings={nearbyBuildings} loading={isLoadingNearby} error={nearbyError} visitedCount={visitedCount} profile={profile} />;
        }
    };

    return (
        <GestureHandlerRootView style={{flex: 1}}>
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

// --- Styles ---
const styles = StyleSheet.create({
    // --- Global & Layout ---
    container: { flex: 1, backgroundColor: '#fff' },
    screen: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    section: { marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold' },

    // --- HomeScreen ---
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    profileLinkGray: {},
    avatarGray: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#cccccc', marginBottom: 5, },
    profileTextGray: { fontSize: 24, fontWeight: 'bold', color: 'gray' },
    visitedCountContainer: { alignItems: 'flex-end', paddingTop: 5 },
    visitedCount: { fontSize: 54, fontWeight: 'bold' },
    visitedCountLabel: { fontSize: 14, color: 'gray' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, },
    styleGroupContainer: { marginBottom: 20, },
    styleGroupTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#eee', },
    walkTimeText: { fontStyle: 'italic', color: '#666', marginTop: 4, },

    // --- PassportScreen ---
    passportHeader: { alignItems: 'center', marginBottom: 20, },
    passportAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e0e0e0', marginBottom: 8 },
    avatarEditText: { color: 'black', fontWeight: 'bold' },
    passportTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, },
    passportTitle: { fontSize: 32, fontWeight: 'bold' },
    myListsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, },
    sectionTitle: { fontSize: 24, fontWeight: 'bold' },
    plusIcon: { fontSize: 36, fontWeight: '300', color: '#000000', }, 
    editButton: { fontSize: 18, color: '#000000', }, 
    
    // --- BuildingInfoScreen ---
    screenCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 20, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    buildingImage: { width: '100%', height: 280, borderRadius: 12, marginBottom: 5, backgroundColor: '#f0f0f0' },
    attributionText: { fontSize: 10, color: 'gray', textAlign: 'right', marginBottom: 15, fontStyle: 'italic' },
    buildingTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, },
    infoBox: { marginVertical: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, },
    infoText: { fontSize: 16, marginVertical: 5, },
    infoLabel: { fontWeight: 'bold' },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, },
    actionButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: '#f0f0f0', },
    actionButtonText: { fontWeight: '600' },
    
    // --- MapScreen ---
    mapCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 20, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3, },
    mapMarkerContainer: { flexDirection: 'column', alignItems: 'center', },
    mapMarkerText: { color: 'white', fontWeight: 'bold', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1.5, marginBottom: 4, maxWidth: 150, textAlign: 'center', },
    mapMarkerPin: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: 'white', transform: [{translateY: -2}] },
    mapLegend: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 10, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3, },
    legendTitle: { fontWeight: 'bold', marginBottom: 5 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
    legendColorBox: { width: 15, height: 15, marginRight: 8, borderRadius: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    legendText: { fontSize: 12 },
    clusterMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center', borderColor: 'white', borderWidth: 2, },
    clusterText: { color: 'white', fontWeight: 'bold', },

    // --- Lists & Swipeable Items ---
    listContainer: {},
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    listItemAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 15, },
    expandedList: { paddingLeft: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    expandedListItemText: { fontStyle: 'italic', color: '#333', fontSize: 10, flex: 1, paddingVertical: 14, },
    arrowIcon: { fontSize: 20, color: '#ccc' },
    buildingItem: { backgroundColor: 'white', paddingLeft: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', },
    swipeIconContainer: { paddingHorizontal: 15, },
    deleteAction: { backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', width: 80, },
    deleteText: { color: 'white', fontWeight: 'bold', },
    editListActions: { flexDirection: 'row', },
    renameButton: { color: '#000000', fontWeight: 'bold', marginRight: 15, }, 
    deleteButton: { color: '#FF3B30', fontWeight: 'bold', },
    placeholderText: { color: 'gray', paddingVertical: 20, textAlign: 'center' },
    emptyListText: { paddingVertical: 15, color: 'gray', fontStyle: 'italic', },
    visitedContainer: { borderBottomWidth: 1, borderBottomColor: '#eee', },

    // --- Navigation ---
    navBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 80, borderTopWidth: 1, borderTopColor: '#e0e0e0', backgroundColor: '#fff', paddingBottom: Platform.OS === 'ios' ? 20 : 0, },
    navBarItem: { flex: 1, justifyContent: 'center', alignItems: 'center', },
    icon: { fontSize: 28, color: '#aaa' },
    iconActive: { color: '#000' },
    cameraIconSpecial: { fontSize: 40, transform: [{ translateY: -15 }], color: '#000' },
    
    // --- Camera ---
    cameraContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'space-between', },
    captureButton: { alignSelf: 'center', marginBottom: 40, width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', },
    captureButtonInner: { flex: 1, margin: 4, borderRadius: 40, borderWidth: 4, borderColor: 'black', },
    cameraCloseButton: { marginTop: Platform.OS === 'ios' ? 50 : 20, marginLeft: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },

    // --- Modal Styles ---
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)', },
    modalContent: { backgroundColor: 'white', borderRadius: 10, padding: 20, width: '85%', maxHeight: '70%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', },
    modalCloseButton: { position: 'absolute', top: 10, right: 10, padding: 5, },
    textInput: { height: 40, borderColor: '#ddd', borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, marginBottom: 15, },
    listSelectItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', },

    // --- Error & Button Styles ---
    button: { marginTop: 20, backgroundColor: '#000', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, },
    buttonText: { color: '#fff', fontWeight: 'bold', },
    errorTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', },
    errorMessage: { textAlign: 'center', marginHorizontal: 20, fontSize: 16, marginBottom: 20, },
    directionsIcon: { fontSize: 20, marginRight: 5, },
});
