"use client"

import { useState } from "react"
import { MoreHorizontal, Shield, ShieldAlert, ShieldCheck, UserX } from "lucide-react"

import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table"

// Типы данных
type UserRole = "admin" | "manager" | "member"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  joinDate: string
  avatar: string
}

// Примеры данных пользователей
const USERS_DATA: User[] = [
  {
    id: "1",
    name: "Иван Петров",
    email: "ivan@example.com",
    role: "admin",
    joinDate: "15.03.2023",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "2",
    name: "Анна Сидорова",
    email: "anna@example.com",
    role: "manager",
    joinDate: "22.05.2023",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "3",
    name: "Сергей Иванов",
    email: "sergey@example.com",
    role: "member",
    joinDate: "10.07.2023",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "4",
    name: "Мария Кузнецова",
    email: "maria@example.com",
    role: "member",
    joinDate: "05.09.2023",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "5",
    name: "Алексей Смирнов",
    email: "alexey@example.com",
    role: "manager",
    joinDate: "18.11.2023",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

// Компонент для отображения роли с иконкой
function RoleBadge({ role }: { role: UserRole }) {
  switch (role) {
    case "admin":
      return (
        <Badge className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
          <ShieldAlert className="mr-1 h-3 w-3" />
          Администратор
        </Badge>
      )
    case "manager":
      return (
        <Badge className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <ShieldCheck className="mr-1 h-3 w-3" />
          Менеджер
        </Badge>
      )
    case "member":
      return (
        <Badge className="border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
          <Shield className="mr-1 h-3 w-3" />
          Участник
        </Badge>
      )
  }
}

interface UserManagementTableProps {
  searchQuery: string
}

export function UserManagementTable({ searchQuery }: UserManagementTableProps) {
  const [users, setUsers] = useState<User[]>(USERS_DATA)
  const [userToRemove, setUserToRemove] = useState<User | null>(null)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Изменение роли пользователя
  const changeUserRole = (userId: string, newRole: UserRole) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
  }

  // Удаление пользователя
  const removeUser = () => {
    if (userToRemove) {
      setUsers(users.filter((user) => user.id !== userToRemove.id))
      setUserToRemove(null)
      setIsRemoveDialogOpen(false)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Дата вступления</TableHead>
              <TableHead className="w-[100px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="h-10 w-10 rounded-full" />
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role}
                      onValueChange={(value: UserRole) => changeUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue>
                          <RoleBadge role={user.role} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center">
                            <ShieldAlert className="mr-2 h-4 w-4 text-purple-600" />
                            Администратор
                          </div>
                        </SelectItem>
                        <SelectItem value="manager">
                          <div className="flex items-center">
                            <ShieldCheck className="mr-2 h-4 w-4 text-blue-600" />
                            Менеджер
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center">
                            <Shield className="mr-2 h-4 w-4 text-gray-600" />
                            Участник
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{user.joinDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Открыть меню</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Просмотреть профиль</DropdownMenuItem>
                        <DropdownMenuItem>Отправить сообщение</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setUserToRemove(user)
                            setIsRemoveDialogOpen(true)
                          }}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Исключить из компании
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Пользователи не найдены.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Диалог подтверждения удаления пользователя */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Исключить пользователя из компании</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите исключить пользователя <strong>{userToRemove?.name}</strong> из компании? Это
              действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={removeUser}>
              Исключить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}