
import { Text } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';

import Navigator from './Navigator';
import { CommonProvider } from './src/Context';

export default function App() {
	return (
		<NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
			<CommonProvider>
				<Navigator />
			</CommonProvider>
		</NavigationContainer>
	);
}

const linking = {
	prefixes: ["myapp://"],
	config: {
		screens: {
			connect: "connect/:type",
		},
	},
};
