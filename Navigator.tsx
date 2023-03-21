

import { createStackNavigator } from '@react-navigation/stack';

import Connect from './src/Connect';
import Dummy from './src/Dummy';

export default function Navigator() {

    const Stack = createStackNavigator();

  return (
    <Stack.Navigator>
      <Stack.Screen name="Connect" component={Connect} />
      <Stack.Screen name="Dummy" component={Dummy} />
    </Stack.Navigator>
  )
}
