// NotificationIconWithBadge.js (na raiz do seu projeto)
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from './AuthContext'; // Caminho para AuthContext na mesma pasta
import Colors from './constants/Colors'; // Caminho para Colors dentro da pasta constants

const NotificationIconWithBadge = ({ color, size }) => {
    // Adicionado console.log para verificar se o componente está sendo renderizado
    console.log('NotificationIconWithBadge: Renderizando com cor:', color, 'e tamanho:', size);
    const { unreadNotificationsCount } = useAuth();

    return (
        <View style={styles.iconContainer}>
            {/* VOLTANDO A USAR A COR PASSADA PELO TABBARICON */}
            <Ionicons name="notifications-outline" size={size} color={color} />
            {unreadNotificationsCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        position: 'relative',
        // Opcional: Adicione um background temporário para ver a área do ícone
        // backgroundColor: 'blue', // Descomente para depuração
    },
    badge: {
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: Colors.red,
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        zIndex: 1,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default NotificationIconWithBadge;