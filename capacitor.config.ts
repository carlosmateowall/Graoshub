import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.graoshub.app',
  appName: 'GrãoHub',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      backgroundColor: '#1a3a2a',
      style: 'LIGHT',
    },
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      backgroundColor: '#1a3a2a',
    },
  },
};

export default config;
