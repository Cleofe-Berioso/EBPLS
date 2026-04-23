"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
} from "lucide-react";

/**
 * RenewalNotificationsContent — Displays renewal-related notifications
 * Shows updates about renewal applications, documents, and schedules
 */
export function RenewalNotificationsContent() {
  // Placeholder notifications - in a real implementation, these would come from the database
  const notifications = [
    {
      id: 1,
      type: "APPLICATION_APPROVED",
      title: "Your renewal application was approved",
      message: "Application #APP-2026-0001 has been approved. You can now proceed to payment.",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      read: false,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      id: 2,
      type: "DOCUMENT_VERIFIED",
      title: "Your documents have been verified",
      message: "All documents for your renewal have been verified successfully.",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      read: true,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      id: 3,
      type: "CLAIM_SCHEDULED",
      title: "Your claim appointment is scheduled",
      message: "Your permit claim is scheduled for April 20, 2026 at 10:00 AM.",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      read: true,
      icon: Clock,
      color: "text-blue-600",
    },
  ];

  const getNotificationIcon = (Icon: any) => <Icon className="h-5 w-5" />;

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">
                  Receive updates via email about your renewals
                </p>
              </div>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">SMS Notifications</p>
                <p className="text-sm text-gray-600">
                  Receive text alerts for important updates
                </p>
              </div>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-gray-900">In-App Notifications</p>
                <p className="text-sm text-gray-600">
                  See notifications when you&rsquo;re logged in
                </p>
              </div>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>

          <Button className="w-full">Save Preferences</Button>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Notifications
          </h2>
          <Button variant="ghost" size="sm">
            Mark all as read
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
                  <Bell className="mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    No Notifications
                  </h3>
                  <p className="text-sm text-gray-600">
                    You&rsquo;re all caught up! Check back later for updates.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <Card
                  key={notification.id}
                  className={`overflow-hidden border-l-4 ${
                    !notification.read ? "border-l-blue-600 bg-blue-50" : "border-l-gray-200"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 ${notification.color}`}
                      >
                        {getNotificationIcon(Icon)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <Badge className="flex-shrink-0">New</Badge>
                          )}
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                          {formatDate(notification.date)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
