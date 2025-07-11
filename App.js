// =================================================================
// FILE: App.js (Final Navigation Version)
// =================================================================
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/config/supabase';

import AuthFlow from './src/components/Auth';
import MainTabs from './src/components/MainTabs';
import BuildingInfoScreen from './src/components/BuildingInfoScreen';
import CameraScreen from './src/components/CameraScreen';
import { LoadingView } from './src/components/common';

const Stack = createNativeStackNavigator();

export default function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };
        fetchSession();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <LoadingView />;
    }

    return (
        <GestureHandlerRootView style={{flex: 1}}>
            {session && session.user ? (
                // The MainTabs component now handles the nav bar and safe areas
                <MainTabs />
            ) : (
                <AuthFlow /> 
            )}
        </GestureHandlerRootView>
    );
}