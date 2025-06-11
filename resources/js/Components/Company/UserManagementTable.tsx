"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
    MoreHorizontal,
    Shield,
    ShieldAlert,
    ShieldCheck,
    UserX,
    Crown,
} from "lucide-react";
import { CompanyUserApi } from "@/services/company-user";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { CompanyRole, CompanyUser } from "@/types/company";

import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";

// Компонент для отображения роли с иконкой
function RoleBadge({ role }: { role: CompanyRole }) {
    switch (role) {
        case "owner":
            return (
                <Badge className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    <ShieldAlert className="mr-1 h-3 w-3" />
                    Владелец
                </Badge>
            );
        case "admin":
            return (
                <Badge className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Администратор
                </Badge>
            );
        default:
            return (
                <Badge className="border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                    <Shield className="mr-1 h-3 w-3" />
                    Участник
                </Badge>
            );
    }
}

interface UserManagementTableProps {
    searchQuery: string;
    companyId: number;
}

export function UserManagementTable({
    searchQuery,
    companyId,
}: UserManagementTableProps) {
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userToRemove, setUserToRemove] = useState<CompanyUser | null>(null);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [userToTransfer, setUserToTransfer] = useState<CompanyUser | null>(null);
    const [password, setPassword] = useState("");
    const [isTransferring, setIsTransferring] = useState(false);

    // Фильтрация пользователей по поисковому запросу
    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        loadUsers();
    }, [companyId]);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            const data = await CompanyUserApi.getUsers(companyId);
            setUsers(data);
        } catch (error) {
            console.error("Ошибка при загрузке пользователей:", error);
            toast.error("Не удалось загрузить список пользователей");
        } finally {
            setIsLoading(false);
        }
    };

    // Изменение роли пользователя
    const changeUserRole = async (
        userId: number,
        newRole: Exclude<CompanyRole, "owner">
    ) => {
        try {
            await CompanyUserApi.updateRole(companyId, userId, {
                role: newRole,
            });
            setUsers(
                users.map((user) =>
                    user.id === userId ? { ...user, role: newRole } : user
                )
            );
            toast.success("Роль пользователя успешно обновлена");
        } catch (error) {
            console.error("Ошибка при изменении роли:", error);
            toast.error("Не удалось изменить роль пользователя");
        }
    };

    // Удаление пользователя из компании
    const removeUser = async () => {
        if (!userToRemove) return;

        try {
            await CompanyUserApi.removeUser(companyId, userToRemove.id);
            setUsers(users.filter((user) => user.id !== userToRemove.id));
            toast.success("Пользователь исключен из компании");
            setIsRemoveDialogOpen(false);
            setUserToRemove(null);
        } catch (error) {
            console.error("Ошибка при исключении пользователя:", error);
            toast.error("Не удалось исключить пользователя из компании");
        }
    };

    // Передача прав владельца
    const transferOwnership = async (e: FormEvent) => {
        e.preventDefault();
        if (!userToTransfer) return;

        try {
            setIsTransferring(true);
            await CompanyUserApi.transferOwnership(companyId, userToTransfer.id, password);
            
            // Обновляем роли в локальном состоянии
            setUsers(users.map(user => {
                if (user.id === userToTransfer.id) {
                    return { ...user, role: "owner" };
                }
                if (user.role === "owner") {
                    return { ...user, role: "admin" };
                }
                return user;
            }));

            toast.success("Права владельца успешно переданы");
            setIsTransferDialogOpen(false);
            setUserToTransfer(null);
            setPassword("");
        } catch (error: any) {
            console.error("Ошибка при передаче прав владельца:", error);
            toast.error(error.response?.data?.message || "Не удалось передать права владельца");
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Пользователь</TableHead>
                            <TableHead>Роль</TableHead>
                            <TableHead>Дата вступления</TableHead>
                            <TableHead className="w-[100px]">
                                Действия
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={`https://www.gravatar.com/avatar/${user.email}?d=mp`}
                                                alt={user.name || ""}
                                                className="h-10 w-10 flex-shrink-0 rounded-full"
                                            />
                                            <div className="min-w-0">
                                                <div className="font-medium truncate">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.role === "owner" ? (
                                            <RoleBadge role={user.role} />
                                        ) : (
                                            <Select
                                                defaultValue={user.role}
                                                onValueChange={(
                                                    value: Exclude<
                                                        CompanyRole,
                                                        "owner"
                                                    >
                                                ) => {
                                                    const currentUser = useAuthStore.getState().user;
                                                    // Проверка, не пытается ли пользователь изменить свою роль
                                                    if (currentUser && currentUser.id === user.id) {
                                                        toast.error("Вы не можете изменить свою собственную роль");
                                                        return;
                                                    }
                                                    changeUserRole(user.id, value);
                                                }}
                                            >
                                                <SelectTrigger className="w-full max-w-[180px]">
                                                    <SelectValue>
                                                        <RoleBadge
                                                            role={user.role}
                                                        />
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Показывать опцию admin только для владельца компании */}
                                                    {users.find(u => u.role === "owner")?.id === useAuthStore.getState().user?.id && (
                                                        <SelectItem value="admin">
                                                            <div className="flex items-center">
                                                                <ShieldCheck className="mr-2 h-4 w-4 text-blue-600" />
                                                                Администратор
                                                            </div>
                                                        </SelectItem>
                                                    )}
                                                    <SelectItem value="member">
                                                        <div className="flex items-center">
                                                            <Shield className="mr-2 h-4 w-4 text-gray-600" />
                                                            Участник
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(user.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        {user.role !== "owner" && useAuthStore.getState().user?.id !== user.id && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Открыть меню
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {users.find(u => u.role === "owner")?.id === useAuthStore.getState().user?.id && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setUserToTransfer(user);
                                                                    setIsTransferDialogOpen(true);
                                                                }}
                                                            >
                                                                <Crown className="mr-2 h-4 w-4" />
                                                                Передать права владельца
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                        </>
                                                    )}
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => {
                                                            setUserToRemove(user);
                                                            setIsRemoveDialogOpen(true);
                                                        }}
                                                    >
                                                        <UserX className="mr-2 h-4 w-4" />
                                                        Исключить из компании
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-24 text-center"
                                >
                                    Пользователи не найдены.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Диалог подтверждения удаления пользователя */}
            <Dialog
                open={isRemoveDialogOpen}
                onOpenChange={setIsRemoveDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Исключить пользователя из компании
                        </DialogTitle>
                        <DialogDescription>
                            Вы уверены, что хотите исключить пользователя{" "}
                            <strong>{userToRemove?.name}</strong> из компании?
                            Это действие нельзя отменить.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRemoveDialogOpen(false)}
                        >
                            Отмена
                        </Button>
                        <Button variant="destructive" onClick={removeUser}>
                            Исключить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Диалог передачи прав владельца */}
            <Dialog
                open={isTransferDialogOpen}
                onOpenChange={(open) => {
                    setIsTransferDialogOpen(open);
                    if (!open) {
                        setPassword("");
                        setUserToTransfer(null);
                    }
                }}
            >
                <DialogContent>
                    <form onSubmit={transferOwnership}>
                        <DialogHeader>
                            <DialogTitle>
                                Передача прав владельца компании
                            </DialogTitle>
                            <DialogDescription>
                                Вы собираетесь передать права владельца пользователю{" "}
                                <strong>{userToTransfer?.name}</strong>. После передачи прав
                                вы станете администратором компании. Для подтверждения
                                введите ваш пароль.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="my-4">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Пароль
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setIsTransferDialogOpen(false)}
                                disabled={isTransferring}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                disabled={!password || isTransferring}
                            >
                                {isTransferring ? "Передача прав..." : "Передать права"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
