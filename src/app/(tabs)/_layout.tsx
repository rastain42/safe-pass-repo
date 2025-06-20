import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/basic/useColorScheme';
import { useUserRole } from '@/hooks/auth/useUserRole';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isOrganizer } = useUserRole();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>

      <Tabs.Screen name="Index"
        options={{
          title: 'Événements',
          tabBarIcon: ({ color }) =>
            <FontAwesome name="calendar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="EventForm"
        options={{
          href: isOrganizer ? '/EventForm' : null,
          title: 'Événement +',
          tabBarStyle: { display: isOrganizer ? 'flex' : 'none' },
          tabBarIcon: ({ color }) =>
            <FontAwesome name="calendar-plus-o" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Dashboard"
        options={{
          href: isOrganizer ? '/Dashboard' : null,
          title: 'Dashboard',
          tabBarStyle: { display: isOrganizer ? 'flex' : 'none' },
          tabBarIcon: ({ color }) =>
            <FontAwesome name="bar-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="TicketList"
        options={{
          href: isOrganizer ? null : '/TicketList',
          tabBarStyle: { display: isOrganizer ? 'none' : 'flex' },
          title: 'Tickets',
          tabBarIcon: ({ color }) =>
            <FontAwesome name="ticket" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ScanScreen"
        options={{
          title: 'Scanner',
          tabBarStyle: { display: isOrganizer ? 'flex' : 'none' },
          href: isOrganizer ? '/ScanScreen' : null,
          tabBarIcon: ({ color }) => (
            <FontAwesome name="qrcode" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) =>
            <FontAwesome name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}