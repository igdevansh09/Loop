import React from "react";
import * as WebBrowser from "expo-web-browser";

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Pre-loads the browser engine in the background for zero-latency opening
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleans up memory when the component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};
