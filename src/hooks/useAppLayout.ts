import { useOutletContext } from "react-router-dom";

interface AppLayoutContext {
  toast: (msg: string) => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
}

export function useAppLayout() {
  return useOutletContext<AppLayoutContext>();
}
