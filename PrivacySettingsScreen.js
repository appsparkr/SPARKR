// PrivacySettingsScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext'; // Importar useAuth
import Colors from './constants/Colors';

const PrivacySettingsScreen = () => {
    const navigation = useNavigation();
    const { currentUser, updatePrivacySettings } = useAuth(); // Obter o utilizador e a nova função

    // Estado para controlar a opção de conta privada
    const [isPrivateAccount, setIsPrivateAccount] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Estado de carregamento

    // Efeito para carregar as definições guardadas quando o ecrã é montado
    useEffect(() => {
        if (currentUser?.profileData?.privacySettings) {
            // Se a definição existir, usa o seu valor. Se não, assume 'false' (pública) como padrão.
            setIsPrivateAccount(currentUser.profileData.privacySettings.isPrivate === true);
        }
        setIsLoading(false);
    }, [currentUser]);

    // Função para lidar com a alteração do interruptor e salvar no Firestore
    const handleSettingChange = useCallback(async (value) => {
        // Atualiza o estado local primeiro (UI otimista)
        setIsPrivateAccount(value);
        try {
            // Pega nas definições atuais para não apagar outras que não foram alteradas
            const currentSettings = currentUser?.profileData?.privacySettings || {};
            const newSettings = {
                ...currentSettings,
                isPrivate: value, // Atualiza apenas a chave 'isPrivate'
            };
            await updatePrivacySettings(newSettings);
        } catch (error) {
            // Se falhar, reverte a alteração na UI
            setIsPrivateAccount(!value);
        }
    }, [currentUser, updatePrivacySettings]);

    // Componente reutilizável para cada linha de definição
    const SettingRow = ({ label, value, onValueChange, description }) => (
        <View style={styles.settingRowContainer}>
            <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{label}</Text>
                <Switch
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={"#ffffff"}
                    onValueChange={onValueChange}
                    value={value}
                />
            </View>
            {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Privacidade</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingView}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacidade</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                <SettingRow
                    label="Conta Privada"
                    value={isPrivateAccount}
                    onValueChange={handleSettingChange}
                    description="Quando a sua conta é privada, apenas as pessoas que você aprova podem ver as suas fotos e vídeos."
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    placeholder: {
        width: 24 + 10,
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    loadingView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingRowContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
        color: Colors.text,
    },
    settingDescription: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 5,
        marginRight: 40, // Para não ficar por baixo do Switch
    },
});

export default PrivacySettingsScreen;