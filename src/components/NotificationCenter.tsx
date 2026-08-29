import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../adminApi";

export type AdminNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  created_at: string;
  is_read: boolean;
};

export function NotificationCenter({ floating = false }: { floating?: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<{ notifications: AdminNotification[]; unread: number }>("/api/notifications.php?action=list");
      setItems(data.notifications || []);
      setUnread(Number(data.unread || 0));
    } catch { /* keep last state */ }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 20000);
    return () => window.clearInterval(timer);
  }, [load]);

  const markRead = async (id?: number) => {
    try {
      await apiJson("/api/notifications.php?action=read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { all: true }),
      });
      await load();
    } catch { /* ignore */ }
  };

  const openPanel = () => setOpen((value) => !value);

  return (
    <div className={floating ? "notification-float" : "notification-center"}>
      <button className={floating ? "notification-float-button" : "notification-button"} type="button" onClick={openPanel} aria-label="Notifications">
        <span>🔔</span>{unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
      </button>
      {open && (
        <div className={floating ? "notification-popover notification-popover-float" : "notification-popover"} role="dialog" aria-label="Notifications">
          <div className="notification-popover-head">
            <div><strong>নোটিফিকেশন</strong><small>{unread ? `${unread}টি নতুন` : "নতুন notification নেই"}</small></div>
            <button type="button" onClick={() => markRead()}>সব পড়া</button>
          </div>
          <div className="notification-list">
            {loading && <div className="notification-empty">লোড হচ্ছে...</div>}
            {!loading && items.length === 0 && <div className="notification-empty">কোনো notification পাওয়া যায়নি।</div>}
            {!loading && items.map((item) => (
              <button key={item.id} type="button" className={`notification-item ${item.is_read ? "is-read" : "is-unread"}`} onClick={() => markRead(item.id)}>
                <span className="notification-item-icon">{item.type === "blood" ? "🩸" : item.type === "member" ? "👤" : item.type === "donation" ? "৳" : "🔔"}</span>
                <span><strong>{item.title}</strong><small>{item.message}</small><em>{formatDate(item.created_at)}</em></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  try { return new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value.replace(" ", "T"))); }
  catch { return value; }
}
