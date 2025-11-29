"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

interface AdminNotification {
  id: string;
  type: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface AdminNotificationContextType {
  notifications: AdminNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    // Check if user is admin (simplified check, real check happens via RLS)
    // We try to fetch, if RLS fails we get error
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          const newNotif = payload.new as AdminNotification;
          setNotifications((prev) => [newNotif, ...prev]);
          
          // Show toast
          toast(newNotif.message, 'info');
          
          // Play sound (optional, simple beep)
          try {
            const audio = new Audio('/notification.mp3'); // Ensure this file exists or fail silently
            audio.play().catch(() => {});
          } catch (e) {
            // ignore
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (!error) {
      setNotifications((prev) => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AdminNotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationContext);
  if (context === undefined) {
    throw new Error("useAdminNotifications must be used within a AdminNotificationProvider");
  }
  return context;
}

