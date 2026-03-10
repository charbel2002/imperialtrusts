"use client";

import { useDict } from "@/components/shared/dict-provider";

import { useState } from "react";
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import {
  Bell, CheckCheck, Trash2, Info, CheckCircle,
  AlertTriangle, XCircle, Filter,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  notifications: Notification[];
  unreadCount: number;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  success: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  danger: { icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-100" },
};

type FilterType = "all" | "unread" | "success" | "danger" | "warning" | "info";

export function NotificationList({ notifications: initial, unreadCount: initialUnread }: Props) {
  const [notifications, setNotifications] = useState(initial);
  const [filter, setFilter] = useState<FilterType>("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingRead, setDeletingRead] = useState(false);

  const unread = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  async function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await markNotificationRead(id);
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsRead();
    setMarkingAll(false);
  }

  async function handleDelete(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
  }

  async function handleDeleteAllRead() {
    if (!confirm(tn.deleteConfirm || "Delete all read notifications?")) return;
    setDeletingRead(true);
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    await deleteAllReadNotifications();
    setDeletingRead(false);
  }

  const d = useDict();
  const tn = d.notificationsPage || {};
  const locale = d._locale || "en";

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: tn.all || "All" },
    { value: "unread", label: `${tn.unreadFilter || "Unread"} (${unread})` },
    { value: "success", label: tn.success || "Success" },
    { value: "warning", label: tn.warning || "Warning" },
    { value: "danger", label: tn.alerts || "Alerts" },
    { value: "info", label: tn.info || "Info" },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Filters */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                filter === f.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={handleMarkAllRead} loading={markingAll} className="text-secondary">
              <CheckCheck size={14} /> {tn.markAllRead || "Mark all read"}
            </Button>
          )}
          {readCount > 0 && (
            <Button size="sm" variant="ghost" onClick={handleDeleteAllRead} loading={deletingRead} className="text-red-500 hover:bg-red-50">
              <Trash2 size={14} /> {tn.clearRead || "Clear read"}
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">
            {filter === "all" ? (tn.noNotifications || "No notifications") : (tn.noFilteredNotifications || "No {{filter}} notifications").replace("{{filter}}", filter)}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.info;
            const Icon = config.icon;

            return (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all group",
                  notif.isRead
                    ? "bg-white border-slate-200 hover:border-slate-300"
                    : "bg-blue-50/40 border-blue-200/60 hover:border-blue-300"
                )}
              >
                {/* Icon */}
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", config.bg)}>
                  <Icon size={18} className={config.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn("text-sm font-semibold", notif.isRead ? "text-slate-600" : "text-slate-800")}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2">{timeAgo(new Date(notif.createdAt), locale)}</p>
                    </div>

                    {/* Unread dot */}
                    {!notif.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-secondary hover:bg-blue-50 transition-colors"
                      title={tn.markAllRead || "Mark as read"}
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title={tn.clearRead || "Delete"}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
