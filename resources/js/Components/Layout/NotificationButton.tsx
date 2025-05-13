"use client"

import * as React from "react"
import { Bell } from "lucide-react"

import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"

type Notification = {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

export function NotificationButton() {
  const [notifications, setNotifications] = React.useState<Notification[]>([
    {
      id: "1",
      title: "Новое сообщение",
      message: "У вас новое сообщение от Анны",
      time: "Только что",
      read: false,
    },
    {
      id: "2",
      title: "Обновление чата",
      message: "Чат был обновлен",
      time: "2 часа назад",
      read: false,
    },
    {
      id: "3",
      title: "Напоминание",
      message: "Встреча с командой в 15:00",
      time: "Вчера",
      read: true,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    )
  }

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Уведомления</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-normal"
              onClick={markAllAsRead}
            >
              Отметить все как прочитанные
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex cursor-pointer flex-col items-start gap-1 p-3"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {notification.time}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                {!notification.read && (
                  <Badge
                    variant="secondary"
                    className="mt-1 bg-blue-100 text-xs dark:bg-blue-900"
                  >
                    Новое
                  </Badge>
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Нет уведомлений
            </div>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}