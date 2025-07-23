// NotificationSettingsScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext'; // Importar useAuth
import Colors from './constants/Colors';

const NotificationSettingsScreen = () => {
    const navigation = useNavigation();
    const { currentUser, updateNotificationSettings } = useAuth(); // Obter o utilizador e a nova função

    // Estados para controlar os interruptores
    const [likesNotifications, setLikesNotifications] = useState(true);
    const [commentsNotifications, setCommentsNotifications] = useState(true);
    const [followersNotifications, setFollowersNotifications] = useState(true);
    const [isLoading, setIsLoading] = useState(true); // Estado de carregamento

    // Efeito para carregar as definições guardadas quando o ecrã é montado
    useEffect(() => {
        if (currentUser?.profileData?.notificationSettings) {
            const settings = currentUser.profileData.notificationSettings;
            // Se a definição existir, usa o seu valor. Se não, assume 'true' como padrão.
            setLikesNotifications(settings.likes !== false);
            setCommentsNotifications(settings.comments !== false);
            setFollowersNotifications(settings.followers !== false);
        }
        setIsLoading(false); // Termina o carregamento
    }, [currentUser]);

    // Função para lidar com a alteração de um interruptor e salvar no Firestore
    const handleSettingChange = useCallback(async (key, value) => {
        // Atualiza o estado local primeiro (UI otimista)
        if (key === 'likes') setLikesNotifications(value);
        if (key === 'comments') setCommentsNotifications(value);
        if (key === 'followers') setFollowersNotifications(value);

        try {
            // Pega nas definições atuais para não apagar outras que não foram alteradas
            const currentSettings = currentUser?.profileData?.notificationSettings || {};
            const newSettings = {
                ...currentSettings,
                [key]: value, // Atualiza apenas a chave alterada
            };
            await updateNotificationSettings(newSettings);
        } catch (error) {
            // Se falhar, reverte a alteração na UI
            if (key === 'likes') setLikesNotifications(!value);
            if (key === 'comments') setCommentsNotifications(!value);
            if (key === 'followers') setFollowersNotifications(!value);
        }
    }, [currentUser, updateNotificationSettings]);


    // Componente reutilizável para cada linha de definição
    const SettingRow = ({ label, value, onValueChange }) => (
        <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{label}</Text>
            <Switch
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={"#ffffff"} // Cor da bola do interruptor
                onValueChange={onValueChange}
                value={value}
            />
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notificações</Text>
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
                <Text style={styles.headerTitle}>Notificações</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                <SettingRow
                    label="Notificações de Curtidas"
                    value={likesNotifications}
                    onValueChange={(newValue) => handleSettingChange('likes', newValue)}
                />
                <SettingRow
                    label="Notificações de Comentários"
                    value={commentsNotifications}
                    onValueChange={(newValue) => handleSettingChange('comments', newValue)}
                />
                <SettingRow
                    label="Notificações de Novos Seguidores"
                    value={followersNotifications}
                    onValueChange={(newValue) => handleSettingChange('followers', newValue)}
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
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    settingLabel: {
        fontSize: 16,
        color: Colors.text,
    },
});

export default NotificationSettingsScreen;