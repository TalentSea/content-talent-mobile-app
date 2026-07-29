import HomeScreen from '../screens/HomeScreen/HomeScreen';

// ... inside your Stack.Navigator:
<Stack.Navigator initialRouteName="Home">
  <Stack.Screen 
    name="Home" 
    component={HomeScreen} 
    options={{ headerShown: false }} 
  />
  {/* Other screens */}
</Stack.Navigator>