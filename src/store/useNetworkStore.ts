import { create } from "zustand";
import NetInfo from "@react-native-community/netinfo";

interface NetworkState {
  isOffline: boolean;
  initNetworkListener: ()=> () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOffline: false, 

  initNetworkListener: () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      set({ isOffline: state.isConnected === false });
    });

    return unsubscribe;
  },
}));
