import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export function useStatusBar() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
      StatusBar.setBackgroundColor({ color: "#1a3a2a" });
      StatusBar.setStyle({ style: Style.Dark });
    }).catch(() => {});
  }, []);
}
