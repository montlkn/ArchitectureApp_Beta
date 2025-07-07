// =================================================================
// FILE: src/components/Auth.js
// =================================================================
import React, { useState } from 'react';
import { Text, View, TextInput, Button, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../config/supabase';
import { styles } from '../config/styles';

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

export default function AuthFlow() {
    const [view, setView] = useState('LOGIN');
    if (view === 'SIGNUP') return <SignUpScreen setView={setView} />;
    return <LoginScreen setView={setView} />;
}