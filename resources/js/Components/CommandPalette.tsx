import * as React from "react"
import { router } from '@inertiajs/react'
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Building2,
  Users,
  ShieldCheck,
  Group,
  ClipboardList,
  MessageSquare,
  Phone,
  UserCircle,
  LogOut,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/Components/ui/command"

const CommandPalette: React.FC = () => {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Введите команду или выполните поиск..." />
      <CommandList>
        <CommandEmpty>Результатов не найдено.</CommandEmpty>
        <CommandGroup heading="Основное">
          <CommandItem
            onSelect={() => runCommand(() => router.get('/dashboard'))}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span>Главная (Dashboard)</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.get('/company'))}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span>Моя компания</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Управление">
          <CommandItem
            onSelect={() => runCommand(() => router.get('/users'))}
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Пользователи</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.get('/roles'))}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Роли и права</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.get('/groups'))}
          >
            <Group className="mr-2 h-4 w-4" />
            <span>Группы</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Коммуникации">
          <CommandItem
            onSelect={() => runCommand(() => router.get('/tasks'))}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            <span>Задания</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.get('/chats'))}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Чаты</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.get('/calls'))}
          >
            <Phone className="mr-2 h-4 w-4" />
            <span>Звонки</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Профиль">
          <CommandItem
            onSelect={() => runCommand(() => router.get('/profile'))}
          >
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Личный кабинет</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.post('/logout'))}
            className="text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Выйти из компании</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export default CommandPalette;