import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    FlatList,
    StatusBar,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Switch
} from 'react-native';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// OneSignal App ID
const ONESIGNAL_APP_ID = "94bd650c-d137-4a46-9a2a-d0c6c1cbfb2a";

export default function App() {
    const [tagId, setTagId] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'history', 'settings'

    useEffect(() => {
        // OneSignal Initialization
        try {
            OneSignal.Debug.setLogLevel(LogLevel.Verbose);
            OneSignal.initialize(ONESIGNAL_APP_ID);
            OneSignal.Notifications.requestPermission(true);

            OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
                const newNotif = {
                    id: Date.now().toString(),
                    title: event.notification.title,
                    body: event.notification.body,
                    time: new Date().toLocaleTimeString(),
                    type: 'alert' as const
                };
                setNotifications((prev: any[]) => [newNotif, ...prev]);
            });

            return () => {
                // In OneSignal 5.x+, we don't have a simple removeEventListener usually 
                // but let's just make it a no-op if it errors to avoid crashing
                try {
                    // OneSignal.Notifications.clearAll();
                } catch (e) { }
            };
        } catch (e) {
            console.warn("OneSignal native module not loaded. Using Supabase Realtime as fallback for alerts.");
        }

        // FALLBACK: Supabase Realtime (Useful for testing in Expo Go)
        if (tagId) {
            const channel = supabase
                .channel('tag-alerts')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'tags',
                        filter: `tag_id=eq.${tagId.toUpperCase().trim()}`,
                    },
                    (payload) => {
                        // We check if push_enabled was toggled or some other metadata changed
                        // For a real alert, we should ideally have an 'alerts' table
                        // But for now, let's show a mock notification when the tag is updated
                        const newNotif = {
                            id: Date.now().toString(),
                            title: "FORESAFE Security Alert",
                            body: "A new scan has been detected for your vehicle.",
                            time: new Date().toLocaleTimeString(),
                            type: 'alert' as const
                        };
                        setNotifications((prev: any[]) => [newNotif, ...prev]);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isRegistered, tagId]);

    const handleLogin = async () => {
        const cleanId = tagId.trim().toUpperCase();
        if (!cleanId.startsWith('FS-')) {
            Alert.alert("Invalid ID", "Please enter a valid Tag ID (e.g., FS-0001)");
            return;
        }

        setIsLoading(true);
        try {
            // Simulated delay for premium feel
            await new Promise(resolve => setTimeout(resolve, 800));

            try {
                OneSignal.login(cleanId);
                OneSignal.User.addTag("tag_id", cleanId);
            } catch (e) {
                console.warn("OneSignal Login failed (Native module missing)");
            }

            // Sync with Supabase
            const { error } = await supabase
                .from('tags')
                .update({
                    push_enabled: true,
                    push_token: 'linked_via_onesignal'
                })
                .eq('tag_id', cleanId);

            if (error) console.warn("Supabase sync failed:", error.message);

            setIsRegistered(true);
            setTagId(cleanId);
        } catch (error) {
            Alert.alert("Error", "Failed to activate device. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleNotifications = async (value: boolean) => {
        try {
            // If value is true, alerts are ON (not paused)
            setIsPaused(!value);

            // Update OneSignal System
            try {
                if (value) {
                    OneSignal.User.pushSubscription.optIn();
                } else {
                    OneSignal.User.pushSubscription.optOut();
                }
            } catch (e) {
                console.warn("OneSignal opt-in/out failed: Native module not available.");
            }

            // Update Supabase so the web side knows
            if (tagId) {
                await supabase
                    .from('tags')
                    .update({ push_enabled: value })
                    .eq('tag_id', tagId);
            }
        } catch (error) {
            Alert.alert("Error", "Could not update settings.");
            setIsPaused(!value); // revert UI
        }
    };

    const handleLogout = () => {
        Alert.alert("Unlink Device", "Are you sure you want to stop receiving alerts for this tag?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Unlink",
                style: "destructive",
                onPress: () => {
                    try {
                        OneSignal.logout();
                    } catch (e) { }
                    setIsRegistered(false);
                    setTagId('');
                    setActiveTab('dashboard');
                }
            }
        ]);
    };

    const renderNotification = ({ item }: { item: any }) => (
        <View style={styles.notifCard}>
            <View style={styles.notifHeader}>
                <View style={styles.alertIndicator} />
                <Text style={styles.notifTitle}>{item.title}</Text>
            </View>
            <Text style={styles.notifBody}>{item.body}</Text>
            <Text style={styles.notifTime}>{item.time}</Text>
        </View>
    );

    if (!isRegistered) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.innerContainer}
                >
                    <View style={styles.headerSection}>
                        <Text style={styles.logoText}>FORE<Text style={{ color: '#1e40af' }}>SAFE</Text></Text>
                        <Text style={styles.tagline}>Intelligent Vehicle Protection</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Activate Owner Portal</Text>
                        <Text style={styles.cardSubtitle}>Enter your Tag ID to link this device and receive security alerts.</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="e.g. FS-0001"
                            placeholderTextColor="#94a3b8"
                            value={tagId}
                            onChangeText={setTagId}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Link Device</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footerNote}>Protected by FORESAFE Security Cloud</Text>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />

            {/* Top Branding Section */}
            <View style={styles.topBanner}>
                <View>
                    <Text style={styles.bannerLogo}>FORESAFE</Text>
                    <Text style={styles.statusLabel}>System Status</Text>
                </View>
                <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: isPaused ? '#f59e0b' : '#22c55e' }]} />
                    <Text style={styles.statusText}>{isPaused ? 'ALERTS MUTED' : 'SYSTEM ACTIVE'}</Text>
                </View>
            </View>

            <View style={styles.contentArea}>
                {activeTab === 'dashboard' && (
                    <View style={styles.tabContainer}>
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Ionicons name="shield-checkmark" size={24} color="#1e40af" />
                                <Text style={styles.statVal}>Active</Text>
                                <Text style={styles.statLabel}>Security</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Ionicons name="car" size={24} color="#1e40af" />
                                <Text style={styles.statVal}>{tagId}</Text>
                                <Text style={styles.statLabel}>Linked Tag</Text>
                            </View>
                        </View>

                        <View style={styles.quickTip}>
                            <Text style={styles.tipTitle}>🛡️ Real-time Protection</Text>
                            <Text style={styles.tipText}>Your device is successfully linked to the FORESAFE security cloud. You will receive an instant notification if someone scans your vehicle tag.</Text>
                        </View>

                        <View style={styles.dashboardIllustration}>
                            <Ionicons name="cellular" size={80} color="#e2e8f0" />
                            <Text style={styles.illustrationText}>Awaiting Security Signal</Text>
                        </View>
                    </View>
                )}

                {activeTab === 'history' && (
                    <View style={styles.tabContainer}>
                        <Text style={styles.sectionTitle}>Security Alert History</Text>
                        <FlatList
                            data={notifications}
                            keyExtractor={item => item.id}
                            renderItem={renderNotification}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <View style={styles.emptyIconCircle}>
                                        <Ionicons name="notifications-off-outline" size={40} color="#94a3b8" />
                                    </View>
                                    <Text style={styles.emptyText}>No alerts reported</Text>
                                    <Text style={styles.emptySubtext}>Your vehicle is currently safe.</Text>
                                </View>
                            }
                        />
                    </View>
                )}

                {activeTab === 'settings' && (
                    <View style={styles.tabContainer}>
                        <Text style={styles.sectionTitle}>Settings</Text>

                        <View style={styles.settingCard}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingLabelGroup}>
                                    <View style={styles.iconBox}>
                                        <Ionicons name="notifications" size={20} color="#1e40af" />
                                    </View>
                                    <View>
                                        <Text style={styles.settingLabel}>Push Notifications</Text>
                                        <Text style={styles.settingDesc}>{isPaused ? "Alerts are currently muted" : "Receiving real-time alerts"}</Text>
                                    </View>
                                </View>
                                <Switch
                                    trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                                    thumbColor={!isPaused ? '#1e40af' : '#f4f3f4'}
                                    onValueChange={toggleNotifications}
                                    value={!isPaused}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.settingCard} onPress={() => Alert.alert("Coming Soon", "Multi-tag support is in development.")}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingLabelGroup}>
                                    <View style={styles.iconBox}>
                                        <Ionicons name="pricetag" size={20} color="#1e40af" />
                                    </View>
                                    <Text style={styles.settingLabel}>Active Tag: {tagId}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.logoutButtonFinal} onPress={handleLogout}>
                            <Text style={styles.logoutTextFinal}>Unlink This Vehicle</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Bottom Navbar */}
            <View style={styles.navbar}>
                <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={styles.navItem}>
                    <Ionicons name={activeTab === 'dashboard' ? "home" : "home-outline"} size={24} color={activeTab === 'dashboard' ? "#1e40af" : "#94a3b8"} />
                    <Text style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('history')} style={styles.navItem}>
                    <Ionicons name={activeTab === 'history' ? "notifications" : "notifications-outline"} size={24} color={activeTab === 'history' ? "#1e40af" : "#94a3b8"} />
                    <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]}>Alerts</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('settings')} style={styles.navItem}>
                    <Ionicons name={activeTab === 'settings' ? "settings" : "settings-outline"} size={24} color={activeTab === 'settings' ? "#1e40af" : "#94a3b8"} />
                    <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>Settings</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    mainContainer: { flex: 1, backgroundColor: '#f1f5f9' },
    innerContainer: { flex: 1, padding: 30, justifyContent: 'center' },
    headerSection: { alignItems: 'center', marginBottom: 50 },
    logoText: { fontSize: 42, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
    tagline: { fontSize: 14, color: '#64748b', marginTop: 5, fontWeight: '500' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 30,
        shadowColor: '#1e40af',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10
    },
    cardTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 10 },
    cardSubtitle: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 25 },
    input: {
        backgroundColor: '#f1f5f9',
        padding: 18,
        borderRadius: 12,
        fontSize: 18,
        color: '#0f172a',
        fontWeight: '600',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    button: {
        backgroundColor: '#1e40af',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#1e40af',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
    footerNote: { textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 12, fontWeight: '500' },

    // Portal Top
    topBanner: {
        backgroundColor: '#1e40af',
        padding: 25,
        paddingTop: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    bannerLogo: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    statusLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
    statusBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '800' },

    contentArea: { flex: 1, paddingHorizontal: 20 },
    tabContainer: { flex: 1, paddingTop: 25 },

    // Dashboard Stats
    statsRow: { flexDirection: 'row', gap: 15 },
    statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    statVal: { fontSize: 18, fontWeight: '800', color: '#1e40af', marginTop: 10 },
    statLabel: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '600' },

    quickTip: { marginTop: 25, backgroundColor: '#e0f2fe', borderRadius: 20, padding: 20 },
    tipTitle: { fontSize: 15, fontWeight: '800', color: '#0369a1' },
    tipText: { fontSize: 13, color: '#0c4a6e', marginTop: 6, lineHeight: 20 },

    dashboardIllustration: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
    illustrationText: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginTop: 15 },

    // Settings
    sectionTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 25 },
    settingCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    settingLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconBox: { backgroundColor: '#eff6ff', padding: 10, borderRadius: 12 },
    settingLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    settingDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },

    logoutButtonFinal: { marginTop: 'auto', marginBottom: 40, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2', borderRadius: 16 },
    logoutTextFinal: { color: '#ef4444', fontWeight: '700' },

    // History
    listContent: { paddingBottom: 40 },
    notifCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15 },
    notifHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    alertIndicator: { width: 4, height: 20, backgroundColor: '#ef4444', borderRadius: 2, marginRight: 12 },
    notifTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    notifBody: { color: '#475569', fontSize: 14, lineHeight: 20, marginBottom: 10 },
    notifTime: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },

    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyText: { fontSize: 18, fontWeight: '700', color: '#64748b' },
    emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 5 },

    // Navbar
    navbar: { backgroundColor: '#fff', height: 90, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingBottom: 25, paddingTop: 10 },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    navText: { fontSize: 11, color: '#94a3b8', marginTop: 6, fontWeight: '700' },
    navTextActive: { color: '#1e40af' }
});
