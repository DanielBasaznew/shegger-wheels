'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Notification, NotificationType } from '@/lib/types';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/storage';
import { useSession, useNotifications } from '@/lib/swr';

function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const now = Date.now();
  const past = new Date(isoString).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'trip_started':
      return (
        <div className="w-8 h-8 rounded-full bg-[#111820] text-[#D5F36A] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      );
    case 'trip_completed':
      return (
        <div className="w-8 h-8 rounded-full bg-[#E5F5D5] text-[#2D5A1E] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case 'booking_requested':
      return (
        <div className="w-8 h-8 rounded-full bg-[#F3E8FF] text-[#6B21A8] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    case 'booking_confirmed':
      return (
        <div className="w-8 h-8 rounded-full bg-[#D5F36A]/25 text-[#374500] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'booking_declined':
    case 'booking_cancelled':
      return (
        <div className="w-8 h-8 rounded-full bg-[#FDE8E8] text-[#9B1C1C] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    case 'dispute_opened':
    case 'dispute_resolved':
      return (
        <div className="w-8 h-8 rounded-full bg-[#FBECE6] text-[#B9674B] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    case 'review_received':
    case 'review_response':
      return (
        <div className="w-8 h-8 rounded-full bg-[#FEF08A] text-[#854D0E] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-[#EBE8E1] text-[#44474B] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  const { session } = useSession();
  const userId = session?.userId || null;
  const { notifications, unreadCount } = useNotifications(userId);

  const bellButtonRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        bellButtonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!userId) {
    return null;
  }

  const displayedNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleItemClick = (notification: Notification) => {
    if (!notification.read && userId) {
      markNotificationAsRead(notification.id, userId);
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userId) {
      markAllNotificationsAsRead(userId);
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (userId) {
      deleteNotification(id, userId);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Live Region for Screen Reader Announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No unread notifications'}
      </div>

      {/* Bell Button */}
      <button
        ref={bellButtonRef}
        type="button"
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`In-App Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative w-10 h-10 rounded-full bg-white border border-[#66717D]/25 flex items-center justify-center text-[#111820] hover:border-[#111820] hover:bg-[#F5F2EB] transition-all cursor-pointer shadow-xs"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-[#111820]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-[#111820] text-[#D5F36A] font-specs-tabular text-[10px] font-bold flex items-center justify-center ring-2 ring-[#F5F2EB] shadow-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Inbox Panel */}
      {isOpen && (
        <div
          id="notification-inbox-panel"
          role="dialog"
          aria-label="In-App Notifications Inbox"
          className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-2xl bg-white border border-[#66717D]/20 shadow-2xl p-0 flex flex-col z-50 overflow-hidden animate-scale-in"
        >
          {/* Header */}
          <div className="p-4 bg-[#F5F2EB] border-b border-[#66717D]/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#111820]">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-[#111820] text-[#D5F36A] text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="text-[11px] text-[#66717D]">All caught up</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                id="notification-mark-all-btn"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-[#536600] hover:text-[#111820] hover:underline cursor-pointer transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex px-4 pt-2.5 pb-2 border-b border-[#66717D]/10 bg-white gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#111820] text-white shadow-xs'
                  : 'bg-[#F1EEE7] text-[#44474B] hover:bg-[#EBE8E1]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'bg-[#111820] text-white shadow-xs'
                  : 'bg-[#F1EEE7] text-[#44474B] hover:bg-[#EBE8E1]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#66717D]/10">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#F5F2EB] flex items-center justify-center text-[#66717D] mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-[#111820]">No notifications</p>
                <p className="text-xs text-[#66717D] mt-1">
                  {filter === 'unread'
                    ? "You don't have any unread updates."
                    : 'Your activity updates and booking notices will appear here.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleItemClick(notif)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(notif);
                    }
                  }}
                  className={`p-3.5 flex gap-3 items-start transition-colors cursor-pointer group focus:outline-hidden focus:bg-[#EBE8E1] ${
                    notif.read ? 'bg-white hover:bg-[#F9F7F2]' : 'bg-[#F5F2EB]/60 hover:bg-[#F5F2EB]'
                  }`}
                  aria-label={`${notif.title}. ${notif.message}. ${formatRelativeTime(notif.createdAt)}.`}
                >
                  {getNotificationIcon(notif.type)}

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-[#111820] truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] font-specs-tabular text-[#66717D] shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-[#44474B] line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#536600] group-hover:underline">
                        View details
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>

                      <div className="flex items-center gap-2">
                        {!notif.read && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#536600]"
                            title="Unread"
                            aria-label="Unread notification"
                          />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(e, notif.id)}
                          aria-label={`Dismiss notification: ${notif.title}`}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[#66717D] hover:text-[#111820] transition-opacity p-1 rounded-sm cursor-pointer flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[15px]">close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-[#F5F2EB]/60 border-t border-[#66717D]/12 text-center">
            <span className="text-[10px] text-[#66717D]">
              Shegger Wheels In-App Messenger • Storage Synced
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
