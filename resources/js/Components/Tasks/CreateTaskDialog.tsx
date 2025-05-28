"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
    AlertCircle,
    CalendarIcon,
    Loader2,
    Plus,
    Upload,
    X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { CompanyUserApi } from "@/services/company-user";
import type { CompanyUser } from "@/types/company";

import { Alert, AlertDescription } from "@/Components/ui/alert";
import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/Components/ui/form";
import { Input } from "@/Components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { Textarea } from "@/Components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";
import { UserSelector } from "@/Components/Tasks/UserSelector";

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateTask: (formData: FormData) => Promise<void>;
}

const taskFormSchema = z.object({
    title: z.string().min(1, "Название обязательно"),
    description: z.string().min(1, "Описание обязательно"),
    startDate: z.date(),
    dueDate: z.date(),
    userIds: z.array(z.number()).min(1, "Выберите хотя бы одного исполнителя"),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export function CreateTaskDialog({
    open,
    onOpenChange,
    onCreateTask,
}: CreateTaskDialogProps) {
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            const data = await CompanyUserApi.getCompanyUsers();
            setUsers(data);
        } catch (error) {
            console.error("Ошибка при загрузке пользователей:", error);
            toast.error("Не удалось загрузить список пользователей");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadUsers();
        }
    }, [open]);

    useEffect(() => {
        console.log("Users state updated:", {
            usersCount: users.length,
            users,
        });
    }, [users]);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [dueDateOpen, setDueDateOpen] = useState(false);

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            title: "",
            description: "",
            startDate: new Date(),
            dueDate: new Date(),
            userIds: [],
        },
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setUploadedFiles([...uploadedFiles, ...files]);
        }
    };

    const handleRemoveFile = (fileName: string) => {
        setUploadedFiles(
            uploadedFiles.filter((file) => file.name !== fileName)
        );
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
            " " +
            sizes[i]
        );
    };

    const onSubmit = async (values: TaskFormValues) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("description", values.description);
            formData.append(
                "start_date",
                values.startDate.toISOString().split("T")[0]
            );
            formData.append(
                "due_date",
                values.dueDate.toISOString().split("T")[0]
            );

            values.userIds.forEach((userId) => {
                formData.append("user_ids[]", userId.toString());
            });

            uploadedFiles.forEach((file) => {
                formData.append("files[]", file);
            });

            await onCreateTask(formData);
            form.reset();
            setUploadedFiles([]);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to create task:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl">Создание задания</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                        Заполните необходимые поля для создания нового задания
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4 mt-4"
                    >
                        <div className="grid gap-4 py-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Название задания</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Введите название задания"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Описание задания</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Введите описание задания"
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-col gap-4">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Дата начала</FormLabel>
                                            <Popover
                                                open={startDateOpen}
                                                onOpenChange={setStartDateOpen}
                                            >
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal",
                                                                !field.value &&
                                                                    "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value
                                                                ? formatDate(
                                                                      field.value
                                                                  )
                                                                : "Выберите дату"}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="center"
                                                    side="bottom"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={(
                                                            date:
                                                                | Date
                                                                | undefined
                                                        ) => {
                                                            if (date) {
                                                                field.onChange(
                                                                    date
                                                                );
                                                                setStartDateOpen(
                                                                    false
                                                                );
                                                            }
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dueDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Срок выполнения
                                            </FormLabel>
                                            <Popover
                                                open={dueDateOpen}
                                                onOpenChange={setDueDateOpen}
                                            >
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal",
                                                                !field.value &&
                                                                    "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value
                                                                ? formatDate(
                                                                      field.value
                                                                  )
                                                                : "Выберите дату"}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="center"
                                                    side="bottom"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={(
                                                            date:
                                                                | Date
                                                                | undefined
                                                        ) => {
                                                            if (date) {
                                                                field.onChange(
                                                                    date
                                                                );
                                                                setDueDateOpen(
                                                                    false
                                                                );
                                                            }
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-2">
                                <FormLabel>Файлы</FormLabel>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        multiple
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer w-full sm:w-auto"
                                    >
                                        <div className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground w-full sm:w-auto">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Загрузить файлы
                                        </div>
                                    </label>
                                </div>
                                {uploadedFiles.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {uploadedFiles.map((file) => (
                                            <div
                                                key={file.name}
                                                className="flex items-center justify-between rounded-md border p-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm">
                                                        {file.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatFileSize(
                                                            file.size
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleRemoveFile(
                                                            file.name
                                                        )
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <FormField
                                control={form.control}
                                name="userIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Исполнители</FormLabel>
                                        <FormControl>
                                            <>
                                                <UserSelector
                                                    users={users}
                                                    selectedUserIds={field.value || []}
                                                    onSelectionChange={(selectedIds) => {
                                                        console.log('Selected users:', selectedIds);
                                                        field.onChange(selectedIds);
                                                    }}
                                                    isLoading={isLoading}
                                                />
                                            </>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    isSubmitting || !form.formState.isValid
                                }
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Создание...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Создать задание
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
