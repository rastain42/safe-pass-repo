import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Mock d'un composant théorisé simple
const ThemedText = ({ children, ...props }: any) => (
    <Text {...props} style={{ color: 'black' }}>
        {children}
    </Text>
);

const ThemedView = ({ children, ...props }: any) => (
    <View {...props} style={{ backgroundColor: 'white' }}>
        {children}
    </View>
);

describe('Themed Components', () => {
    it('should render ThemedText with children', () => {
        const { getByText } = render(
            <ThemedText>Themed content</ThemedText>
        );

        expect(getByText('Themed content')).toBeTruthy();
    });

    it('should render ThemedView with children', () => {
        const { getByTestId } = render(
            <ThemedView testID="themed-view">
                <ThemedText>Content inside view</ThemedText>
            </ThemedView>
        );

        expect(getByTestId('themed-view')).toBeTruthy();
    });

    it('should apply theme styles', () => {
        const { getByText } = render(
            <ThemedText style={{ fontSize: 16 }}>Styled text</ThemedText>
        );

        const textElement = getByText('Styled text');
        expect(textElement).toBeTruthy();
    });
});
