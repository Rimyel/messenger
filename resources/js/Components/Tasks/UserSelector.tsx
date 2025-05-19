"use client"

import { forwardRef, useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/Components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string
  avatar: string
}

interface UserSelectorProps {
  users: User[]
  selectedUserIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

export const UserSelector = forwardRef<HTMLDivElement, UserSelectorProps>(
  ({ users, selectedUserIds, onSelectionChange }, ref) => {
  const [open, setOpen] = useState(false)

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter((id) => id !== userId))
    } else {
      onSelectionChange([...selectedUserIds, userId])
    }
  }

  const removeUser = (userId: string) => {
    onSelectionChange(selectedUserIds.filter((id) => id !== userId))
  }

  const selectedUsers = users.filter((user) => selectedUserIds.includes(user.id))

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div ref={ref}>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
              Выбрать исполнителей
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Поиск пользователей..." />
            <CommandList>
              <CommandEmpty>Пользователи не найдены</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem key={user.id} value={user.name} onSelect={() => toggleUser(user.id)}>
                    <div className="flex items-center gap-2">
                      <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="h-6 w-6 rounded-full" />
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                    <Check
                      className={cn("ml-auto h-4 w-4", selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="mr-1 h-4 w-4 rounded-full" />
              {user.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeUser(user.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
  }
)

UserSelector.displayName = "UserSelector"