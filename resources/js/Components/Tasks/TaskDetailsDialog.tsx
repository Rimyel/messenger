"use client";

import { useState, useRef } from "react";
import {
    AlertCircle,
    CalendarIcon,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    Loader2,
    RotateCcw,
    Upload,
    User,
    X,
    CheckCircle,
    AlertTriangle,
    HourglassIcon,
    SendIcon,
} from "lucide-react";

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
import { Separator } from "@/Components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Textarea } from "@/Components/ui/textarea";
import { Input } from "@/Components/ui/input";
import { formatDate } from "@/lib/utils";
import { TaskApi } from "@/services/task";
import { toast } from "sonner";
import type {
    Task,
    TaskAssignment,
    TaskResponse,
    TaskFile,
    AssignmentStatus,
    ResponseStatus,
} from "@/types/task";

interface TaskDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task;
    onUpdateTask: (task: Task) => void;
}

interface ApiResponse {
  id: string
  files: {
    id: string
    name: string
  }[]
}

interface ResponseFormData {
    id: string;
    text: string;
    files: TaskFile[];
    submittedAt: string;
    status: ResponseStatus;
}

export function TaskDetailsDialog({
    open,
    onOpenChange,
    task,
    onUpdateTask,
}: TaskDetailsDialogProps) {
    const [selectedAssignment, setSelectedAssignment] =
        useState<TaskAssignment | null>(null);
    const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [revisionComment, setRevisionComment] = useState("");
    const [isRevisionMode, setIsRevisionMode] = useState(false);
    const [responseText, setResponseText] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setUploadedFiles((prevFiles) => [...prevFiles, ...newFiles]);
        }
    };

    const handleRemoveFile = (fileName: string) => {
        setUploadedFiles((prevFiles) =>
            prevFiles.filter((file) => file.name !== fileName)
        );
    };

    const resetResponseForm = () => {
        setResponseText("");
        setUploadedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${
            sizes[i]
        }`;
    };

    const getFileType = (filename: string): string => {
        const extension = filename.split(".").pop()?.toLowerCase() || "";
        if (["doc", "docx"].includes(extension)) return "word";
        if (["xls", "xlsx"].includes(extension)) return "excel";
        if (["ppt", "pptx"].includes(extension)) return "powerpoint";
        if (["pdf"].includes(extension)) return "pdf";
        if (["jpg", "jpeg", "png", "gif"].includes(extension)) return "image";
        if (["zip", "rar", "7z"].includes(extension)) return "archive";
        return "other";
    };

    const handleSubmitResponse = async () => {
        if (!selectedAssignment) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("text", responseText);
            uploadedFiles.forEach((file) => {
                formData.append("files[]", file);
            });

            const response = await TaskApi.submitResponse(
                selectedAssignment.userId,
                formData
            );

            const responseData: ResponseFormData = {
                id: response.id,
                text: responseText,
                status: "submitted",
                submittedAt: new Date().toISOString(),
                files: uploadedFiles.map((file) => ({
                    id:
                        response.files.find((f: { id: string; name: string }) => f.name === file.name)?.id ||
                        Math.random().toString(),
                    name: file.name,
                    size: formatFileSize(file.size),
                    type: getFileType(file.name),
                    url: "#",
                })),
            };

            const updatedAssignment: TaskAssignment = {
                ...selectedAssignment,
                status: "submitted",
                response: responseData,
            };

            const updatedTask: Task = {
                ...task,
                assignments: task.assignments.map((assignment) =>
                    assignment.userId === selectedAssignment.userId
                        ? updatedAssignment
                        : assignment
                ),
            };

            onUpdateTask(updatedTask);
            setIsResponseDialogOpen(false);
            resetResponseForm();
            toast.success("Ответ успешно отправлен");
        } catch (error) {
            console.error("Failed to submit response:", error);
            toast.error("Не удалось отправить ответ");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReviewResponse = async (status: "completed" | "revision") => {
        if (!selectedAssignment?.response) return;

        setIsSubmitting(true);
        try {
            await TaskApi.reviewResponse(selectedAssignment.response.id, {
                status,
                revision_comment:
                    status === "revision" ? revisionComment : undefined,
            });

            const updatedAssignment: TaskAssignment = {
                ...selectedAssignment,
                status: status as AssignmentStatus,
                response: {
                    ...selectedAssignment.response,
                    status: (status === "completed"
                        ? "approved"
                        : "revision") as ResponseStatus,
                    revisionComment:
                        status === "revision" ? revisionComment : undefined,
                },
            };

            const updatedTask: Task = {
                ...task,
                status: status === "completed" ? "completed" : task.status,
                assignments: task.assignments.map((assignment) =>
                    assignment.userId === selectedAssignment.userId
                        ? updatedAssignment
                        : assignment
                ),
            };

            onUpdateTask(updatedTask);
            setSelectedAssignment(null);
            setIsRevisionMode(false);
            setRevisionComment("");
            toast.success(
                status === "completed"
                    ? "Задание успешно завершено"
                    : "Задание отправлено на доработку"
            );
        } catch (error) {
            console.error("Failed to review response:", error);
            toast.error("Не удалось обновить статус задания");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusText = (status: string): string => {
        switch (status) {
            case "pending":
            case "not_started":
                return "Ожидает выполнения";
            case "in_progress":
                return "В процессе";
            case "completed":
                return "Завершено";
            case "revision":
                return "На доработке";
            case "overdue":
                return "Просрочено";
            case "submitted":
                return "Отправлено";
            case "approved":
                return "Одобрено";
            default:
                return "Неизвестно";
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case "pending":
            case "not_started":
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
            case "in_progress":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "completed":
            case "approved":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "revision":
                return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
            case "overdue":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            case "submitted":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    const getStatusIcon = (status: string): JSX.Element => {
        switch (status) {
            case "pending":
            case "not_started":
                return <HourglassIcon className="mr-1.5 h-4 w-4" />;
            case "in_progress":
                return <Clock className="mr-1.5 h-4 w-4" />;
            case "completed":
            case "approved":
                return <CheckCircle className="mr-1.5 h-4 w-4" />;
            case "revision":
                return <RotateCcw className="mr-1.5 h-4 w-4" />;
            case "overdue":
                return <AlertTriangle className="mr-1.5 h-4 w-4" />;
            case "submitted":
                return <SendIcon className="mr-1.5 h-4 w-4" />;
            default:
                return <HourglassIcon className="mr-1.5 h-4 w-4" />;
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl">
                                {task.title}
                            </DialogTitle>
                            <Badge
                                className={`flex items-center ${getStatusColor(
                                    task.status
                                )}`}
                            >
                                {getStatusIcon(task.status)}
                                {getStatusText(task.status)}
                            </Badge>
                        </div>
                        <DialogDescription>
                            Создано: {task.createdBy} ·{" "}
                            {formatDate(task.createdAt)}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="details" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">
                                Детали задания
                            </TabsTrigger>
                            <TabsTrigger value="assignments">
                                Исполнители ({task.assignments.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="mt-4 space-y-4">
                            <div>
                                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                    Описание
                                </h3>
                                <div className="rounded-md bg-muted p-4">
                                    <p className="whitespace-pre-wrap">
                                        {task.description}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                        Дата начала
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {formatDate(task.startDate)}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                        Срок выполнения
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatDate(task.dueDate)}</span>
                                    </div>
                                </div>
                            </div>

                            {task.files.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                        Файлы
                                    </h3>
                                    <div className="space-y-2">
                                        {task.files.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center justify-between rounded-md border p-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <div>
                                                        <div className="text-sm font-medium">
                                                            {file.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {file.size}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Скачать
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="assignments" className="mt-4">
                            <div className="rounded-md border">
                                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4 font-medium">
                                    <div>Исполнитель</div>
                                    <div>Статус</div>
                                    <div></div>
                                </div>
                                <Separator />
                                {task.assignments.map((assignment) => (
                                    <div key={assignment.userId}>
                                        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={
                                                        assignment.userAvatar ||
                                                        "/placeholder.svg"
                                                    }
                                                    alt={assignment.userName}
                                                    className="h-10 w-10 rounded-full"
                                                />
                                                <div>
                                                    <div className="font-medium">
                                                        {assignment.userName}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge
                                                className={`flex items-center ${getStatusColor(
                                                    assignment.status
                                                )}`}
                                            >
                                                {getStatusIcon(
                                                    assignment.status
                                                )}
                                                {getStatusText(
                                                    assignment.status
                                                )}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedAssignment(
                                                        assignment
                                                    );
                                                    setIsResponseDialogOpen(
                                                        true
                                                    );
                                                }}
                                            >
                                                {assignment.status ===
                                                "not_started"
                                                    ? "Детали"
                                                    : "Просмотреть ответ"}
                                            </Button>
                                        </div>
                                        <Separator />
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Закрыть
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Диалог просмотра ответа пользователя */}
            {selectedAssignment && (
                <Dialog
                    open={isResponseDialogOpen}
                    onOpenChange={setIsResponseDialogOpen}
                >
                    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <DialogTitle>
                                    Ответ пользователя:{" "}
                                    {selectedAssignment.userName}
                                </DialogTitle>
                                <Badge
                                    className={`flex items-center ${getStatusColor(
                                        selectedAssignment.status
                                    )}`}
                                >
                                    {getStatusIcon(selectedAssignment.status)}
                                    {getStatusText(selectedAssignment.status)}
                                </Badge>
                            </div>
                        </DialogHeader>

                        <div className="mt-4 space-y-6">
                            <div>
                                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                    Задание
                                </h3>
                                <div className="rounded-md bg-muted p-4">
                                    <p className="whitespace-pre-wrap">
                                        {task.description}
                                    </p>
                                </div>
                            </div>

                            {task.files.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                        Файлы задания
                                    </h3>
                                    <div className="space-y-2">
                                        {task.files.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center justify-between rounded-md border p-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <div>
                                                        <div className="text-sm font-medium">
                                                            {file.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {file.size}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Скачать
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Separator />

                            {selectedAssignment.response ? (
                                <>
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Ответ пользователя
                                            </h3>
                                            <div className="text-sm text-muted-foreground">
                                                Отправлено:{" "}
                                                {formatDate(
                                                    selectedAssignment.response
                                                        .submittedAt
                                                )}
                                            </div>
                                        </div>
                                        <div className="rounded-md bg-muted p-4">
                                            <p className="whitespace-pre-wrap">
                                                {
                                                    selectedAssignment.response
                                                        .text
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {selectedAssignment.response.files.length >
                                        0 && (
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                                Файлы ответа
                                            </h3>
                                            <div className="space-y-2">
                                                {selectedAssignment.response.files.map(
                                                    (file) => (
                                                        <div
                                                            key={file.id}
                                                            className="flex items-center justify-between rounded-md border p-2"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4" />
                                                                <div>
                                                                    <div className="text-sm font-medium">
                                                                        {
                                                                            file.name
                                                                        }
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {
                                                                            file.size
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Скачать
                                                            </Button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {selectedAssignment.response.status ===
                                        "revision" && (
                                        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                                            <div className="mb-2 flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
                                                <AlertCircle className="h-4 w-4" />
                                                Комментарий к доработке
                                            </div>
                                            <p className="text-amber-800 dark:text-amber-300">
                                                {
                                                    selectedAssignment.response
                                                        .revisionComment
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {!isRevisionMode &&
                                        selectedAssignment.response.status ===
                                            "submitted" && (
                                            <div className="flex items-center justify-between">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        setIsRevisionMode(true)
                                                    }
                                                    disabled={isSubmitting}
                                                    className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
                                                >
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    Запросить доработку
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        handleReviewResponse(
                                                            "completed"
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                    className="bg-green-600 text-white hover:bg-green-700"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Обработка...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            Завершить задание
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}

                                    {isRevisionMode && (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                                    Комментарий к доработке
                                                </h3>
                                                <Textarea
                                                    placeholder="Опишите, что нужно доработать..."
                                                    value={revisionComment}
                                                    onChange={(e) =>
                                                        setRevisionComment(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="min-h-[100px]"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        setIsRevisionMode(false)
                                                    }
                                                    disabled={isSubmitting}
                                                >
                                                    Отмена
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleReviewResponse(
                                                            "revision"
                                                        )
                                                    }
                                                    disabled={
                                                        isSubmitting ||
                                                        !revisionComment
                                                    }
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Обработка...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RotateCcw className="mr-2 h-4 w-4" />
                                                            Отправить на
                                                            доработку
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                        Ответ на задание
                                    </h3>
                                    <div className="space-y-4">
                                        <Textarea
                                            placeholder="Введите ваш ответ..."
                                            value={responseText}
                                            onChange={(e) =>
                                                setResponseText(e.target.value)
                                            }
                                            className="min-h-[100px]"
                                        />
                                        <div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                multiple
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                Прикрепить файлы
                                            </Button>
                                        </div>
                                        {uploadedFiles.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {uploadedFiles.map((file) => (
                                                    <div
                                                        key={file.name}
                                                        className="flex items-center justify-between rounded-md border p-2"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4" />
                                                            <div>
                                                                <div className="text-sm font-medium">
                                                                    {file.name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {formatFileSize(
                                                                        file.size
                                                                    )}
                                                                </div>
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
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                disabled={
                                                    isSubmitting ||
                                                    !responseText.trim()
                                                }
                                                onClick={handleSubmitResponse}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Отправка...
                                                    </>
                                                ) : (
                                                    <>
                                                        <SendIcon className="mr-2 h-4 w-4" />
                                                        Отправить ответ
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsResponseDialogOpen(false)}
                            >
                                Закрыть
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
