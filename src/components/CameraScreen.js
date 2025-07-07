// =================================================================
// FILE: src/components/CameraScreen.js
// =================================================================
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Button, Alert, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { styles } from '../config/styles';
import { LoadingView } from './common';

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

export default CameraScreen;
