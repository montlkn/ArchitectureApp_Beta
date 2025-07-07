// =================================================================
// FILE: src/config/styles.js
// =================================================================
import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
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