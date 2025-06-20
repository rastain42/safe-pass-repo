import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from './theme';
import { User } from '@/types/user';
import { StripeProvider } from '@stripe/stripe-react-native';

// Importer depuis votre fichier de configuration personnalisé
import { auth, getAuthData } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)/Login',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {    // Utiliser l'instance auth de votre configuration
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Récupérer les données additionnelles enregistrées dans SecureStore si nécessaire
        const firstName = await getAuthData('userFirstName') || '';
        const lastName = await getAuthData('userLastName') || '';
        const birthDate = await getAuthData('userBirthDate') || '';

        const mappedUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
          role: 'user',

          // Données initiales depuis SecureStore (migration legacy)
          initialData: {
            firstName,
            lastName,
            birthDate
          },

          // Statut de vérification basé sur l'email pour l'instant
          verification: {
            verification_status: firebaseUser.emailVerified ? 'verified' : 'pending',
          },

          created_at: firebaseUser.metadata.creationTime || '',
          updated_at: firebaseUser.metadata.lastSignInTime || '',
        };
        setUser(mappedUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!loaded) {
    return null;
  }

  const publishableKey = process.env.STRIPE_PUBLIC_KEY || "pk_test_51QwQLRQWcv6PLtrYa32YumVBYQPUHpBPazKdVyveRKVpad74Rcj7b1GENohzQNGfoBPnZSkKhSYpf8hdy4jgdKxG00lCpuu2mX";

  return (
    <StripeProvider
      publishableKey={publishableKey}
      urlScheme="safepass"
      merchantIdentifier="merchant.com.safepass"
    >
      <RootLayoutNav user={user} />
    </StripeProvider>
  );
}

interface RootLayoutNavProps {
  user: User | null;
}

function RootLayoutNav({ user }: RootLayoutNavProps) {
  const { colorScheme } = useColorScheme();

  return (
    <>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
            },
            headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
            contentStyle: {
              backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
            }
          }}
        >
          <Stack.Screen
            name="index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />

        </Stack>
      </ThemeProvider>
    </>
  );
}