// =================================================================
// FILE: src/components/PassportScreen.js (Final Complete Version)
// =================================================================
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TouchableOpacity, Image, Modal, TextInput, Button, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { supabase } from '../config/supabase';
import { styles as externalStyles } from '../config/styles';
import { LoadingView, SwipeableListItem } from './common';
import { capitalize } from '../utils/helpers';

const PassportScreen = ({ navigation }) => {
    const [profile, setProfile] = useState(null);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedListId, setExpandedListId] = useState(null);
    const [buildingsInList, setBuildingsInList] = useState([]);
    const [loadingBuildings, setLoadingBuildings] = useState(false);
    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [stamps, setStamps] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    
    // Local state for UI updates
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);

    const isFocused = useIsFocused();

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");
            
            const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profileError) throw profileError;
            setProfile(profileData);
            setUsername(profileData?.username || '');
            setAvatarUrl(profileData?.avatar_url);

            const { data: listData, error: listError } = await supabase.from('lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            if (listError) throw listError;
            setLists(listData || []);

            const { data: stampData, error: stampError } = await supabase.rpc('get_passport_stamps');
            if (stampError) throw stampError;
            setStamps(stampData.map(s => ({...s, name: s.building_name, photo_url: s.building_photo_url, id: s.stamp_id})) || []);
            
            const { data: achievementData, error: achievementError } = await supabase.from('user_achievements').select('achievements (*)').eq('user_id', user.id);
            if(achievementError) throw achievementError;
            setAchievements(achievementData.map(a => a.achievements).filter(Boolean) || []);

        } catch (error) {
            console.error("Error fetching passport data:", error.message);
        } finally {
            setLoading(false);
        }
    };

    // This useEffect hook now re-fetches data every time the screen is focused
    useEffect(() => {
        if (isFocused) {
            fetchData();
        }
    }, [isFocused]);

    const handleUpdateProfile = async () => {
        if (!username.trim()) return Alert.alert("Username is required.");
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('profiles').update({ username }).eq('id', user.id);
        
        if (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Username may already be taken or is invalid.");
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setProfile({ ...profile, username });
            Alert.alert("Success", "Profile updated!");
            setEditMode(false);
        }
        setLoading(false);
    };

    const handleProfilePicPress = async () => {
        if (!editMode) return;
        if (isUploading) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Permission Denied", "We need photo library access.");
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType.Image, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
        if (result.canceled || !result.assets || result.assets.length === 0) return;
        try {
            setIsUploading(true);
            const image = result.assets[0];
            const base64 = await FileSystem.readAsStringAsync(image.uri, { encoding: 'base64' });
            const filePath = `${profile.id}/${new Date().getTime()}.png`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, base64, { contentType: 'image/png', upsert: true });
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
            if (updateError) throw updateError;
            setAvatarUrl(publicUrl);
            setProfile({ ...profile, avatar_url: publicUrl });
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Upload Failed", error.message);
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleCreateList = async () => {
        if (!newListName.trim()) return Alert.alert("Name required", "Please enter a name.");
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.from('lists').insert({ name: newListName, user_id: user.id }).select().single();
        if (error) { Alert.alert("Error", "Could not create list."); }
        else { setLists([data, ...lists]); setNewListName(''); setCreateModalVisible(false); }
    };

    const handleDeleteList = (listToDelete) => {
        Alert.alert("Delete List", `Are you sure you want to permanently delete "${listToDelete.name}"?`,
            [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => {
                const { error } = await supabase.from('lists').delete().eq('id', listToDelete.id);
                if (error) { Alert.alert("Error", "Could not delete list."); }
                else { setLists(lists.filter(list => list.id !== listToDelete.id)); }
            }}]);
    };

    const handleDeleteBuildingFromList = (buildingId, listId) => {
        Alert.alert("Remove Building", "Are you sure you want to remove this building from the list?",
            [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: async () => {
                const { error } = await supabase.from('list_buildings').delete().match({ building_id: buildingId, list_id: listId });
                if (error) { Alert.alert("Error", "Could not remove building."); }
                else { setBuildingsInList(buildingsInList.filter(b => b.id !== buildingId)); }
            }}]);
    };

    const handleListPress = async (listId) => {
        if (expandedListId === listId) return setExpandedListId(null);
        setExpandedListId(listId);
        setLoadingBuildings(true);
        const { data, error } = await supabase.rpc('get_list_buildings', { list_id_param: listId });
        if (error) console.error("Error fetching buildings in list:", error);
        else setBuildingsInList(data || []);
        setLoadingBuildings(false);
    };

    const handleBuildingPress = (building) => {
        navigation.navigate('BuildingInfo', { building });
    };

    if (loading) return <LoadingView message="Loading your passport..." />;

    return (
        <SafeAreaView style={externalStyles.container}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <ScrollView style={externalStyles.screen} contentContainerStyle={{ paddingBottom: 50 }}>
                    {editMode && (
                        <TouchableOpacity onPress={() => supabase.auth.signOut()} style={styles.signOutButton}>
                            <Text style={styles.signOutButtonText}>Sign Out</Text>
                        </TouchableOpacity>
                    )}

                    <Modal visible={isCreateModalVisible} transparent={true} animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
                        <View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Create New List</Text><TextInput style={externalStyles.textInput} placeholder="e.g., Art Deco Gems" value={newListName} onChangeText={setNewListName} /><Button title="Create List" onPress={handleCreateList} /><TouchableOpacity style={{marginTop: 10}} onPress={() => setCreateModalVisible(false)}><Text style={{textAlign: 'center', color: 'gray'}}>Cancel</Text></TouchableOpacity></View></View>
                    </Modal>

                    <View style={externalStyles.passportHeader}>
                        <TouchableOpacity onPress={handleProfilePicPress} disabled={!editMode || isUploading}>
                            <Image key={avatarUrl} source={avatarUrl ? { uri: avatarUrl } : require('../../assets/avatar-placeholder.png')} style={externalStyles.passportAvatar} />
                            {isUploading && <ActivityIndicator style={StyleSheet.absoluteFill} />}
                        </TouchableOpacity>
                        {editMode && <Text style={externalStyles.avatarEditText}>Tap to Edit</Text>}
                    </View>

                    <View style={externalStyles.passportTitleContainer}>
                        {editMode ? (
                            <TextInput style={styles.usernameInput} value={username} onChangeText={setUsername} placeholder="Enter a username" autoCapitalize="none" />
                        ) : (
                            <Text style={externalStyles.passportTitle}>{profile?.username || 'Your'} Passport</Text>
                        )}
                        <TouchableOpacity onPress={() => {
                            if (editMode) { handleUpdateProfile(); }
                            else { setUsername(profile?.username || ''); setEditMode(true); }
                        }}>
                            <Text style={externalStyles.editButton}>{editMode ? (loading ? 'Saving...' : 'Save') : 'Edit'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={externalStyles.section}>
                        <Text style={externalStyles.sectionTitle}>Stamps ({stamps.length})</Text>
                        {stamps.length > 0 ? (
                            stamps.map(stamp => (
                                <TouchableOpacity key={stamp.id} style={externalStyles.listItem} onPress={() => handleBuildingPress(stamp)}>
                                    <Image source={{ uri: stamp.photo_url || 'https://placehold.co/80x80' }} style={externalStyles.listItemAvatar} />
                                    <Text>{stamp.name}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (<Text style={externalStyles.placeholderText}>Go get exploring!</Text>)}
                    </View>

                    <View style={externalStyles.section}>
                        <Text style={externalStyles.sectionTitle}>Achievements ({achievements.length})</Text>
                        {achievements.length > 0 ? (
                            achievements.map(achievement => (
                                <View key={achievement.id} style={externalStyles.listItem}><Text style={{fontSize: 24, marginRight: 10}}>🏆</Text><Text>{achievement.name}</Text></View>
                            ))
                        ) : (<Text style={externalStyles.placeholderText}>Keep exploring to unlock achievements!</Text>)}
                    </View>

                    <View style={externalStyles.section}>
                        <View style={externalStyles.myListsHeader}>
                            <Text style={externalStyles.sectionTitle}>My Lists ({lists.length})</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(true)}><Text style={externalStyles.plusIcon}>+</Text></TouchableOpacity>
                        </View>
                        {lists.map(list => (
                            <View key={list.id} style={externalStyles.visitedContainer}>
                                <View style={styles.listItemContainer}>
                                    <TouchableOpacity style={styles.listTitleTouchable} onPress={() => handleListPress(list.id)}>
                                        <Text style={styles.listTitleText}>{list.name}</Text>
                                        <Text style={externalStyles.arrowIcon}>{expandedListId === list.id ? '▲' : '▼'}</Text>
                                    </TouchableOpacity>
                                    {editMode && (<TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteList(list)}><Text style={styles.deleteButtonText}>(delete)</Text></TouchableOpacity>)}
                                </View>
                                {expandedListId === list.id && (
                                    <View style={externalStyles.expandedList}>
                                        {loadingBuildings ? <ActivityIndicator /> : buildingsInList.length > 0 ?
                                            buildingsInList.map(building => (
                                                <SwipeableListItem key={building.id} item={building} onPress={() => handleBuildingPress(building)} onDelete={() => handleDeleteBuildingFromList(building.id, list.id)} editMode={true}>
                                                    <Text style={styles.buildingItemText}>{building.des_addres} {building.style_prim ? `| ${capitalize(building.style_prim)}` : ''}</Text>
                                                </SwipeableListItem>
                                            )) : <Text style={externalStyles.emptyListText}>This list is empty.</Text>
                                        }
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </GestureHandlerRootView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    signOutButton: { position: 'absolute', top: 10, right: 10, zIndex: 10 },
    signOutButtonText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 },
    usernameInput: { fontSize: 32, fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#ccc', flex: 1, marginRight: 15 },
    listItemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    listTitleTouchable: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 15 },
    listTitleText: { fontSize: 16, flex: 1 },
    deleteButton: { paddingVertical: 15, paddingLeft: 15 },
    deleteButtonText: { color: '#FF3B30', fontWeight: 'bold' },
    buildingItemText: { fontSize: 14, color: '#333', fontStyle: 'italic' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'stretch' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
});

export default PassportScreen;