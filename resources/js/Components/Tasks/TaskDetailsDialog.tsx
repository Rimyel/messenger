"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/Components/ui/button";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { Separator } from "@/Components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { TaskApi } from "@/services/task";
import { toast } from "sonner";
import type {
    Task,
    TaskAssignment,
    TaskFile,
    AssignmentStatus,
    ResponseStatus,
} from "@/types/task";
import type { User } from "@/types/app";
import { TaskDetailsContent } from "./TaskDetailsContent";
import { UserTaskResponse } from "./UserTaskResponse";
import { AdminTaskResponse } from "./AdminTaskResponse";
import { getStatusColor, getStatusIcon, getStatusText } from "./taskUtils";

interface TaskDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task;
    onUpdateTask: (task: Task) => void;
    isUserTaskView?: boolean;
}

export function TaskDetailsDialog({
    open,
    onOpenChange,
    task,
    onUpdateTask,
    isUserTaskView = false,
}: TaskDetailsDialogProps) {
    const isMobile = useIsMobile();
    const { user } = useAuthStore();
    const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignment | null>(null);
    const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [revisionComment, setRevisionComment] = useState("");
    const [isRevisionMode, setIsRevisionMode] = useState(false);
    const [responseText, setResponseText] = useState<string>("");
    const [existingFiles, setExistingFiles] = useState<TaskFile[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    const getUserAssignment = (): TaskAssignment | null => {
        if (!isUserTaskView || !user) return null;
        return task.assignments.find(
            (assignment) => assignment.userId?.toString() === user.id?.toString()
        ) || null;
    };

    // Обновляем состояния при изменении задания или его данных
    useEffect(() => {
        const userAssignment = getUserAssignment();
        if (userAssignment) {
            setResponseText(userAssignment.response?.text || "");
            setExistingFiles(userAssignment.response?.files || []);
            setUploadedFiles([]); // Сбрасываем загруженные файлы
        }
    }, [task.id, task.assignments]);

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

    const handleRemoveExistingFile = (fileId: string) => {
        setExistingFiles((files) => files.filter((file) => file.id !== fileId));
    };

    const handleSubmitResponse = async () => {
        let currentAssignment = selectedAssignment;

        if (!currentAssignment && isUserTaskView && user) {
            currentAssignment = task.assignments.find(
                (assignment) => assignment.userId?.toString() === user.id?.toString()
            ) || null;

            if (!currentAssignment) {
                toast.error("Не удалось найти ваше назначение на задание");
                return;
            }
        }
        if (!currentAssignment) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("text", responseText);
            existingFiles.forEach(file => {
                formData.append("existing_files[]", file.id);
            });
            uploadedFiles.forEach((file) => {
                formData.append("files[]", file);
            });
            let response;
            const existingResponse = currentAssignment.response;
            if (existingResponse && existingResponse.status !== "approved") {
                response = await TaskApi.updateResponse(existingResponse.id, formData);
            } else {
                response = await TaskApi.submitResponse(currentAssignment.id, formData);
            }
            const responseData = {
                id: response.id,
                text: responseText,
                status: "submitted" as ResponseStatus,
                submittedAt: new Date().toISOString(),
                files: [
                    ...existingFiles,
                    ...uploadedFiles.map((file) => ({
                        id: response.files.find(
                            (f: { id: string; name: string }) =>
                                f.name === file.name
                        )?.id || Math.random().toString(),
                        name: file.name,
                        size: `${formatFileSize(file.size)}`,
                        type: file.type,
                        url: "#",
                    } as TaskFile)),
                ] as TaskFile[],
            };
            const updatedAssignment: TaskAssignment = {
                ...currentAssignment,
                status: currentAssignment.response ? currentAssignment.status : "submitted",
                response: responseData,
            };
            const updatedTask: Task = {
                ...task,
                assignments: task.assignments.map((assignment) =>
                    assignment.userId === currentAssignment?.userId
                        ? updatedAssignment
                        : assignment
                ),
            };
            onUpdateTask(updatedTask);
            setIsResponseDialogOpen(false);
            toast.success(currentAssignment.response ? "Изменения сохранены" : "Ответ успешно отправлен");
        } catch (error) {
            console.error("Failed to submit response:", error);
            toast.error("Не удалось отправить ответ");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const handleReviewResponse = async (status: "completed" | "revision") => {
        if (!selectedAssignment?.response) return;

        setIsSubmitting(true);
        try {
            const reviewStatus = status === "completed" ? "approved" : "revision";
            await TaskApi.reviewResponse(selectedAssignment.response.id, {
                status: reviewStatus,
                revision_comment: status === "revision" ? revisionComment : undefined,
            });

            const newAssignmentStatus = status === "completed" ? "completed" : "revision";

            const updatedAssignment: TaskAssignment = {
                ...selectedAssignment,
                status: newAssignmentStatus as AssignmentStatus,
                response: {
                    ...selectedAssignment.response,
                    status: reviewStatus as ResponseStatus,
                    revisionComment: status === "revision" ? revisionComment : undefined,
                },
            };

            const allAssignmentsCompleted = task.assignments.every(assignment =>
                assignment.userId === selectedAssignment.userId
                    ? newAssignmentStatus === "completed"
                    : assignment.status === "completed"
            );

            const updatedTask: Task = {
                ...task,
                status: allAssignmentsCompleted ? "completed" : task.status,
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

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={`
                    ${isMobile ? 'w-screen h-screen max-w-none p-4' : 'max-h-[90vh] max-w-4xl p-6'}
                    overflow-y-auto
                `}>
                    <TaskDetailsContent task={task} />

                    {isUserTaskView ? (
                        <UserTaskResponse
                            user={user as User}
                            assignment={getUserAssignment()}
                            responseText={responseText}
                            onResponseTextChange={setResponseText}
                            existingFiles={existingFiles}
                            onExistingFileRemove={handleRemoveExistingFile}
                            uploadedFiles={uploadedFiles}
                            onFileUpload={handleFileUpload}
                            onUploadedFileRemove={handleRemoveFile}
                            onSubmit={handleSubmitResponse}
                            isSubmitting={isSubmitting}
                        />
                    ) : (
                        <Tabs defaultValue="assignments" className="mt-4">
                            <TabsList className="grid w-full grid-cols-1">
                                <TabsTrigger value="assignments">
                                    Исполнители ({task.assignments.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="assignments" className="mt-4">
                                <div className="rounded-md border">
                                    {!isMobile && (
                                        <>
                                            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4 font-medium">
                                                <div>Исполнитель</div>
                                                <div>Статус</div>
                                                <div></div>
                                            </div>
                                            <Separator />
                                        </>
                                    )}
                                    {task.assignments.map((assignment) => (
                                        <div key={assignment.userId}>
                                            <div className={`
                                                ${isMobile
                                                    ? 'flex flex-col gap-3 p-3'
                                                    : 'grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4'
                                                }
                                            `}>
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={assignment.userAvatar || "/placeholder.svg"}
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
                                                    {getStatusIcon(assignment.status)}
                                                    {getStatusText(assignment.status)}
                                                </Badge>
                                                <div className="flex justify-end">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAssignment(assignment);
                                                            setIsResponseDialogOpen(true);
                                                        }}
                                                    >
                                                        {isMobile ? (
                                                            <div className="flex items-center">
                                                                {assignment.status === "not_started" ? "Детали" : "Просмотр"}
                                                                <ChevronRight className="ml-1 h-4 w-4" />
                                                            </div>
                                                        ) : (
                                                            assignment.status === "not_started" ? "Детали" : "Просмотреть ответ"
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                            <Separator />
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Закрыть
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {selectedAssignment && (
                <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
                    <DialogContent className={`
                        ${isMobile ? 'w-screen h-screen max-w-none p-4' : 'max-h-[90vh] max-w-3xl p-6'}
                        overflow-y-auto
                    `}>
                        <DialogHeader>
                            <DialogTitle>
                                Ответ пользователя: {selectedAssignment.userName}
                            </DialogTitle>
                        </DialogHeader>

                        <AdminTaskResponse
                            assignment={selectedAssignment}
                            isRevisionMode={isRevisionMode}
                            revisionComment={revisionComment}
                            onRevisionCommentChange={setRevisionComment}
                            onSetRevisionMode={setIsRevisionMode}
                            onReviewResponse={handleReviewResponse}
                            isSubmitting={isSubmitting}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
