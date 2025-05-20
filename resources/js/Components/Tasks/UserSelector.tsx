"use client"

import { forwardRef, useState } from "react"
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react"

import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover"
import { cn } from "@/lib/utils"

import type { CompanyUser } from "@/types/company"

interface UserSelectorProps {
    users: CompanyUser[]
    selectedUserIds: number[]
    onSelectionChange: (selectedIds: number[]) => void
    isLoading?: boolean
}

export const UserSelector = forwardRef<HTMLDivElement, UserSelectorProps>(
    ({ users, selectedUserIds, onSelectionChange, isLoading = false }, ref) => {
        const [open, setOpen] = useState(false)
        const [searchQuery, setSearchQuery] = useState("")

        const toggleUser = (userId: number) => {
            if (selectedUserIds.includes(userId)) {
                onSelectionChange(selectedUserIds.filter(id => id !== userId))
            } else {
                onSelectionChange([...selectedUserIds, userId])
            }
        }

        const removeUser = (userId: number) => {
            onSelectionChange(selectedUserIds.filter(id => id !== userId))
        }

        const filteredUsers = users.filter(user =>
            (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        )

        const selectedUsers = users.filter(user => selectedUserIds.includes(user.id))

        return (
            <div className="flex flex-col gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <div ref={ref}>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                            >
                                <span>
                                    {selectedUsers.length > 0
                                        ? `Выбрано исполнителей: ${selectedUsers.length}`
                                        : "Выбрать исполнителей"}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-2">
                        <div className="flex items-center gap-2 mb-2 px-2">
                            <Search className="h-4 w-4 shrink-0 opacity-50" />
                            <Input
                                placeholder="Поиск пользователей..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 w-full border-none bg-transparent p-0 focus-visible:ring-0"
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="ml-2">Загрузка...</span>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-6 text-sm text-muted-foreground">
                                    {users.length > 0
                                        ? "Пользователи не найдены"
                                        : "Список пользователей пуст"}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleUser(user.id)}
                                            className={cn(
                                                "flex items-center justify-between px-2 py-1.5 rounded-sm",
                                                "cursor-pointer transition-colors",
                                                "hover:bg-accent hover:text-accent-foreground",
                                                selectedUserIds.includes(user.id) && "bg-accent text-accent-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={`https://www.gravatar.com/avatar/${user.email}?d=mp`}
                                                    alt={user.name}
                                                    className="h-6 w-6 rounded-full"
                                                />
                                                <div className="flex flex-col">
                                                    <span>{user.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                            {selectedUserIds.includes(user.id) && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((user) => (
                            <Badge
                                key={user.id}
                                variant="secondary"
                                className="flex items-center gap-1"
                            >
                                <img
                                    src={`https://www.gravatar.com/avatar/${user.email}?d=mp`}
                                    alt={user.name}
                                    className="mr-1 h-4 w-4 rounded-full"
                                />
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
