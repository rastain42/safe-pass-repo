import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Test component simple
const TestComponent = ({ children }: { children: React.ReactNode }) => (
    <View testID="test-component">
        <Text>{children}</Text>
    </View>
);

describe('Components Base Tests', () => {
    it('should render basic component', () => {
        const { getByTestId, getByText } = render(
            <TestComponent>Hello World</TestComponent>
        );

        expect(getByTestId('test-component')).toBeTruthy();
        expect(getByText('Hello World')).toBeTruthy();
    });

    it('should handle props correctly', () => {
        const { getByText } = render(
            <TestComponent>Test Props</TestComponent>
        );

        expect(getByText('Test Props')).toBeTruthy();
    });
});
