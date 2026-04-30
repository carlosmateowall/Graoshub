import { useEffect, useState } from "react";

interface StatusBarProps {
  isDark: boolean;
}

const StatusBar = ({ isDark }: StatusBarProps) => {
  const [time, setTime] = useState("09:41");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0")
      );
    };
    tick();
    const iv = setInterval(tick, 20000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className={`h-[50px] flex items-center justify-between px-7 pt-[14px] flex-shrink-0 relative z-10 ${isDark ? "text-white" : "text-foreground"}`}>
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[34px] bg-[#1C1C1C] rounded-b-[20px]" />
      <span className="font-display text-[15px] font-bold relative z-10">{time}</span>
      <div className="flex gap-1.5 items-center text-xs relative z-10">
        <span>●●●</span>
        <span>WiFi</span>
        <span>🔋</span>
      </div>
    </div>
  );
};

export default StatusBar;
