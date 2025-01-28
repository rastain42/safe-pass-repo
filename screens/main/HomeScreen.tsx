import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../App';

const HomeScreen = () => {
    const { setIsAuthenticated } = useAuth();

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to SafePass</Text>
            <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
            >
                <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    logoutButton: {
        backgroundColor: '#ff4444',
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default HomeScreen;