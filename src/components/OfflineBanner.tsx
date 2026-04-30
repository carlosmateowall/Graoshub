import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const OfflineBanner = () => {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground text-center text-xs font-semibold py-2 px-4">
      📡 Sem conexão com a internet
    </div>
  );
};

export default OfflineBanner;
