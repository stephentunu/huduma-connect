import { useState, useEffect } from "react";
import { Bell, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, format } from "date-fns";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_id: string | null;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    setupRealtime();
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("in_app_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "in_app_notifications",
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          // Check if this is for the current user
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && newNotification.user_id === user.id) {
              setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
              setUnreadCount((prev) => prev + 1);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("in_app_notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("in_app_notifications")
      .update({ is_read: true })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "appointment_booked":
        return "📅";
      case "appointment_approved":
        return "✅";
      case "appointment_rescheduled":
        return "🔄";
      case "appointment_cancelled":
        return "❌";
      case "id_ready":
        return "🪪";
      default:
        return "🔔";
    }
  };

  const isDownloadable = (type: string) =>
    type === "appointment_approved" || type === "appointment_rescheduled" || type === "id_ready";

  const handleDownload = (notification: Notification) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const dateStr = format(new Date(notification.created_at), "MMMM d, yyyy 'at' h:mm a");
    const titleMap: Record<string, string> = {
      appointment_approved: "Appointment Approval Notice",
      appointment_rescheduled: "Appointment Reschedule Notice",
      id_ready: "Document Collection Notice",
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${titleMap[notification.type] || notification.title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #1a1a1a; }
          .header { text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 20px; color: #16a34a; margin: 0 0 4px; }
          .header p { font-size: 12px; color: #666; margin: 0; }
          .badge { display: inline-block; background: #16a34a; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
          .content { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .content h2 { font-size: 16px; margin: 0 0 8px; }
          .content p { font-size: 14px; line-height: 1.6; margin: 0; }
          .meta { font-size: 12px; color: #666; margin-top: 16px; }
          .footer { text-align: center; font-size: 11px; color: #999; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🇰🇪 Huduma Centre</h1>
          <p>Government of Kenya — Official Notification</p>
        </div>
        <span class="badge">${titleMap[notification.type] || notification.title}</span>
        <div class="content">
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
        </div>
        <div class="meta">
          <p><strong>Date Issued:</strong> ${dateStr}</p>
          <p><strong>Reference ID:</strong> ${notification.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div class="footer">
          <p>This is an official notification from Huduma Centre. Please present this document at the centre.</p>
          <p>Generated on ${format(new Date(), "MMMM d, yyyy")}</p>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                    !notification.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex gap-2">
                    <span className="text-base mt-0.5">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.is_read ? "font-semibold" : "font-medium"}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                        {isDownloadable(notification.type) && (
                          <button
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(notification);
                            }}
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
