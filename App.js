// =================================================================
// FILE: App.js (Final Version)
// =================================================================
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NavigationContainer>
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        {session && session.user ? (
                            <>
                                <Stack.Screen name="Main" component={MainTabs} />
                                <Stack.Screen name="BuildingInfo" component={BuildingInfoScreen} options={{ presentation: 'modal' }}/>
                                <Stack.Screen name="Camera" component={CameraScreen} options={{ presentation: 'modal' }}/>
                            </>
                        ) : (
                            <Stack.Screen name="Auth" component={AuthFlow} />
                        )}
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}