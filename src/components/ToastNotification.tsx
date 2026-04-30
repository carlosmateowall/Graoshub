import { useEffect, useState } from "react";

interface ToastNotificationProps {
  message: string;
}

const ToastNotification = ({ message }: ToastNotificationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [message]);

  return (
    <div
      className={`fixed top-[68px] left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-[13px] font-semibold z-[99999] whitespace-nowrap pointer-events-none transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
      }`}
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
    >
      {message}
    </div>
  );
};

export default ToastNotification;
