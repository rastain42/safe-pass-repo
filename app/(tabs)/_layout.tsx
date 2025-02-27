import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { db } from '@/firebase/config';
import { UserRole } from '@/types/enum';
import { getAuth } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isOrganizer, setIsOrganizer] = useState(false);


  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().role === UserRole.Organizer) {
      setIsOrganizer(true);
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: false,
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Événements',
          tabBarIcon: ({ color }) =>
            <FontAwesome name="calendar" size={24} color={color} />,
        }}
      />
      {isOrganizer && (
        <Tabs.Screen
          name="EventForm"
          options={{
            title: 'Événement +',
            tabBarIcon: ({ color }) =>
              <FontAwesome name="calendar-plus-o" size={24} color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="TicketList"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color }) =>
            <FontAwesome name="ticket" size={24} color={color} />,
        }}
      />
      {isOrganizer && (
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scanner',
            tabBarIcon: ({ color }) => (
              <FontAwesome name="qrcode" size={24} color={color} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) =>
            <FontAwesome name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
