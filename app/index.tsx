import { Redirect } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

export default function Index() {
  useEffect(() => {
    // Keep splash screen visible a bit longer for smooth transition
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return <Redirect href="/(auth)/login" />;
}
