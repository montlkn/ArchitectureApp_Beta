// =================================================================
// FILE: src/components/MainTabs.js (Final Version)
// =================================================================
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity } from 'react-native';

import HomeScreen from './HomeScreen';
import MapScreen from './MapScreen';
import PassportScreen from './PassportScreen';

const Tab = createBottomTabNavigator();

const EmptyScreen = () => null;

const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={{ flexDirection: 'row', height: 80, borderTopWidth: 1, borderTopColor: '#e0e0e0', backgroundColor: '#fff', paddingBottom: 20 }}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel;
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };
                
                let icon;
                if (label === 'Home') icon = '🏠';
                else if (label === 'Passport') icon = '🎟️';
                else if (label === 'Camera') icon = '📸';
                else if (label === 'Map') icon = '🗺️';

                return (
                    <TouchableOpacity key={index} onPress={onPress} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: label === 'Camera' ? 40 : 28, color: isFocused ? '#000' : '#aaa', transform: [{ translateY: label === 'Camera' ? -15 : 0 }] }}>
                            {icon}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const MainTabs = () => {
    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
            <Tab.Screen name="Passport" component={PassportScreen} options={{ tabBarLabel: 'Passport' }} />
            <Tab.Screen
                name="CameraTab"
                component={EmptyScreen}
                options={{ tabBarLabel: 'Camera' }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('Camera');
                    },
                })}
            />
            <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Map' }} />
        </Tab.Navigator>
    );
};

export default MainTabs;