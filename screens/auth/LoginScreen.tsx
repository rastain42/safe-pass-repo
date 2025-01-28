import { View, Text, Button, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation, setIsAuthenticated }) {
  return (
    <View style={styles.container}>
      <Text>Login Screen</Text>
      <Button 
        title="Aller à l'inscription" 
        onPress={() => navigation.navigate('Register')} 
      />
      <Button
        title="Debug: Accès direct à l'app"
        onPress={() => setIsAuthenticated(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
