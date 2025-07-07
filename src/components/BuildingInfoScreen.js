// =================================================================
// FILE: src/components/BuildingInfoScreen.js
// =================================================================
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, Modal, TextInput, Button, FlatList, Alert, Linking, Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { styles } from '../config/styles';
import { LoadingView, BookmarkIcon, DirectionsIcon } from './common';
import { capitalize } from '../utils/helpers';

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

export default BuildingInfoScreen;