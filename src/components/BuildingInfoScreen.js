// =================================================================
// FILE: src/components/BuildingInfoScreen.js (Final, Complete Version)
// =================================================================
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, Modal, TextInput, Button, FlatList, Alert, Linking, Platform, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../config/supabase';
import { styles as externalStyles } from '../config/styles';
import { LoadingView, BookmarkIcon, DirectionsIcon } from './common';
import { capitalize } from '../utils/helpers';

// The component now receives the 'route' and 'navigation' props from React Navigation
const BuildingInfoScreen = ({ route, navigation }) => {
    // The 'building' object is passed as a parameter in the route
    const { building } = route.params;

    const [isSaveModalVisible, setSaveModalVisible] = useState(false);
    const [lists, setLists] = useState([]);
    const [newListName, setNewListName] = useState('');
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Get the current user session to associate lists with a user
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        };
        fetchSession();
    }, []);

    if (!building) {
        return <LoadingView message="Loading building data..." />;
    }

    const goBack = () => navigation.goBack();

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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (error.code === '23505') {
                Alert.alert("Already Saved", "This building is already in that list.");
            } else {
                Alert.alert("Error", "Could not save to list.");
            }
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success!", "Building saved.");
            setSaveModalVisible(false);
        }
    };

    const handleCreateAndSave = async () => {
        if (!newListName.trim() || !session?.user) return;
        const { data: newListData, error: newListError } = await supabase.from('lists').insert({ name: newListName, user_id: session.user.id }).select().single();
        if (newListError) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Could not create list.");
        } else if (newListData) {
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
        return <Text style={externalStyles.infoText}><Text style={externalStyles.infoLabel}>{label}:</Text> {value}</Text>;
    };

    return (
        <View style={{flex: 1}}>
            <ScrollView style={externalStyles.screen}>
                <Image source={{ uri: building.photo_url || 'https://placehold.co/600x400/e2e8f0/e2e8f0?text=.' }} style={externalStyles.buildingImage} />
                {building.photo_attribution && <Text style={externalStyles.attributionText}>{building.photo_attribution.replace(/<[^>]*>?/gm, '')}</Text>}
                <Text style={externalStyles.buildingTitle}>{building.name || building.des_addres || "Building Details"}</Text>
                
                <View style={externalStyles.infoBox}>
                     {renderInfoRow("Architect", capitalize(building.arch_build))}
                     {renderInfoRow("Style", capitalize(building.style_prim))}
                     {renderInfoRow("Date", building.date_combo)}
                     {renderInfoRow("Materials", materials)}
                     {renderInfoRow("Original Use", capitalize(building.use_orig))}
                     {renderInfoRow("Building Type", capitalize(building.build_type))}
                </View>

                <View style={externalStyles.actionsContainer}>
                    <TouchableOpacity onPress={openSaveModal} style={externalStyles.actionButton}><BookmarkIcon/><Text style={externalStyles.actionButtonText}> Save to List</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openURL(mapsUrl)} style={externalStyles.actionButton}><DirectionsIcon /><Text style={externalStyles.actionButtonText}> Directions</Text></TouchableOpacity>
                </View>
            </ScrollView>

            <TouchableOpacity onPress={goBack} style={externalStyles.screenCloseButton}><Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>X</Text></TouchableOpacity>

            <Modal transparent={true} animationType="fade" visible={isSaveModalVisible} onRequestClose={() => setSaveModalVisible(false)}>
                 <View style={externalStyles.modalOverlay}>
                    <View style={externalStyles.modalContent}>
                        <TouchableOpacity onPress={() => setSaveModalVisible(false)} style={externalStyles.modalCloseButton}><Text style={{fontSize: 22, color: '#555'}}>X</Text></TouchableOpacity>
                        <Text style={externalStyles.modalTitle}>Save to a List</Text>
                        <Text style={externalStyles.sectionTitle}>Create a New List</Text>
                        <TextInput style={externalStyles.textInput} placeholder="e.g., 'Midtown Marvels'" value={newListName} onChangeText={setNewListName} />
                        <Button title="Create & Save" onPress={handleCreateAndSave} />
                        <View style={{height: 20}} />
                        <Text style={externalStyles.sectionTitle}>Add to Existing List</Text>
                        <FlatList data={lists} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => ( <TouchableOpacity style={externalStyles.listSelectItem} onPress={() => handleSaveToList(item.id)}><Text>{item.name}</Text></TouchableOpacity> )} ListEmptyComponent={<Text style={{color: 'gray', marginVertical: 10}}>No lists found.</Text>}/>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default BuildingInfoScreen;