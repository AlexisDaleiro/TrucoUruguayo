import type {CapacitorConfig} from '@capacitor/cli';

const config:CapacitorConfig={
 appId:'uy.trucodeboliche.app',
 appName:'Truco de Boliche',
 webDir:'apps/client/dist',
 server:{hostname:'localhost',androidScheme:'https',cleartext:false},
 android:{allowMixedContent:false},
 plugins:{SplashScreen:{launchAutoHide:false,backgroundColor:'#241c18',showSpinner:false}}
};
export default config;
