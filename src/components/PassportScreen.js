// =================================================================
// FILE: src/components/PassportScreen.js
// =================================================================
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, Modal, TextInput, Button, ActivityIndicator, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../config/supabase';
import { styles } from '../config/styles';
import { LoadingView, SwipeableListItem } from './common';

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
                const [listRes, stampRes, achievementRes] = await Promise.all([
                    supabase.from('lists').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
                    supabase.rpc('get_passport_stamps'),
                    supabase.from('user_achievements').select('achievements (*)').eq('user_id', session.user.id)
                ]);

                if(listRes.error) throw listRes.error;
                setLists(listRes.data || []);

                if (stampRes.error) throw stampRes.error;
                const transformedStamps = stampRes.data.map(stamp => ({
                    id: stamp.id,
                    building_id: stamp.building_id,
                    buildings: {
                        id: stamp.building_id,
                        name: stamp.building_name,
                        photo_url: stamp.building_photo_url,
                    }
                }));
                setStamps(transformedStamps || []);

                if(achievementRes.error) throw achievementRes.error;
                setAchievements(achievementRes.data.map(a => a.achievements).filter(Boolean) || []);

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
        if (!editMode) {
            Alert.alert("Edit Mode Required", "Please tap 'Edit' first to change your profile picture.");
            return;
        }
        if (!session?.user) return;
        
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return Alert.alert("Permission Denied", "We need access to your photos.");
        
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaType.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5
            });

            if (result.canceled || !result.assets?.[0]) return;
            
            const image = result.assets[0];
            setLoading(true);

            const base64 = await FileSystem.readAsStringAsync(image.uri, { encoding: 'base64' });
            const filePath = `${session.user.id}/${new Date().getTime()}.png`;
            const contentType = 'image/png';
        
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, base64, { contentType, upsert: true });
            if (uploadError) throw uploadError;
        
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
            if (updateError) throw updateError;
            
            setProfile({ ...profile, avatar_url: publicUrl });
            Alert.alert("Success", "Profile picture updated!");

        } catch (error) {
            Alert.alert("Upload Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleListPress = async (listId) => {
        if (expandedListId === listId) {
            setExpandedListId(null);
            return;
        }
        setExpandedListId(listId);
        setLoadingBuildings(true);
        const { data, error } = await supabase.rpc('get_list_buildings', { list_id_param: listId });
        if (error) console.error("Error fetching buildings in list:", error);
        else setBuildingsInList(data || []);
        setLoadingBuildings(false);
    };

    const handleBuildingPress = (building) => {
        setCurrentBuilding({...building, name: building.name || building.des_addres});
        setView('BUILDING_INFO');
    };

    if (loading) return <LoadingView message="Loading your passport..." />;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ScrollView style={styles.screen}>
                {/* Modals would go here */}
                <View style={styles.passportHeader}>
                    <TouchableOpacity onPress={handleProfilePicPress}>
                        <Image source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../../assets/avatar-placeholder.png')} style={styles.passportAvatar} />
                    </TouchableOpacity>
                    {editMode && <Text style={styles.avatarEditText}>Edit</Text>}
                </View>

                <View style={styles.passportTitleContainer}>
                    <Text style={styles.passportTitle}>Passport</Text>
                     <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <TouchableOpacity onPress={() => setEditMode(!editMode) }>
                           <Text style={styles.editButton}>{editMode ? 'Done' : 'Edit'}</Text>
                        </TouchableOpacity>
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

                {/* Achievements and Lists sections would go here */}
            </ScrollView>
        </GestureHandlerRootView>
    );
};

export default PassportScreen;