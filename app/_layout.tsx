import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from './theme';
import { User } from '@/types/user';
import { getAuth } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { StripeProvider } from '@stripe/stripe-react-native';


export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)/login',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [user, setUser] = useState<User | null>(null);

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const mappedUser: User = {
          id: firebaseUser.uid,
          role: 'user',
          verifiedStatus: firebaseUser.emailVerified,
          createdAt: firebaseUser.metadata.creationTime || '',
          updatedAt: firebaseUser.metadata.lastSignInTime || '',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
          firstName: '',
          lastName: '',
          birthDate: ''
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
  let pk: string = process.env.STRIPE_SECRET_KEY!
  return <StripeProvider publishableKey="$pk">
    <RootLayoutNav user={user} />

  </StripeProvider>
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