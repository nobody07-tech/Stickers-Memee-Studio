// Jest setup file for React Native
/* global jest */
import 'react-native-gesture-handler/jestSetup';

// Mock animations
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
