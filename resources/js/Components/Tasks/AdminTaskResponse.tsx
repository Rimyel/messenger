import React from "react";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { TaskFileList } from "./TaskFileList";
import type { TaskAssignment } from "@/types/task";

interface AdminTaskResponseProps {
    assignment: TaskAssignment;
    isRevisionMode: boolean;
    revisionComment: string;
    onRevisionCommentChange: (comment: string) => void;
    onSetRevisionMode: (mode: boolean) => void;
    onReviewResponse: (status: "completed" | "revision") => void;
    isSubmitting: boolean;
}

export function AdminTaskResponse({
    assignment,
    isRevisionMode,
    revisionComment,
    onRevisionCommentChange,
    onSetRevisionMode,
    onReviewResponse,
    isSubmitting
}: AdminTaskResponseProps) {
    const isMobile = useIsMobile();
    if (!assignment.response) {
        return (
            <div className="rounded-md bg-muted p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                    Пользователь еще не отправил ответ
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="mb-2 text-xs sm:text-sm font-medium text-muted-foreground">
                    Текст ответа
                </h3>
                <div className="rounded-md bg-muted p-3 sm:p-4">
                    <p className="whitespace-pre-wrap">
                        {assignment.response.text}
                    </p>
                </div>
            </div>

            {assignment.response.files.length > 0 && (
                <div>
                    <h3 className="mb-2 text-xs sm:text-sm font-medium text-muted-foreground">
                        Прикрепленные файлы
                    </h3>
                    <TaskFileList
                        files={assignment.response.files}
                        showDownload={true}
                        showRemove={false}
                    />
                </div>
            )}

            <div className="space-y-4">
                {isRevisionMode ? (
                    <>
                        <Textarea
                            placeholder="Введите комментарий для отправки на доработку..."
                            value={revisionComment}
                            onChange={(e) => onRevisionCommentChange(e.target.value)}
                        />
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                            <Button
                                variant="outline"
                                onClick={() => onSetRevisionMode(false)}
                                className="w-full sm:w-auto"
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={() => onReviewResponse("revision")}
                                disabled={!revisionComment.trim() || isSubmitting}
                                variant="destructive"
                                className="w-full sm:w-auto"
                            >
                                {isSubmitting ? (
                                    "Отправка..."
                                ) : isMobile ? (
                                    <div className="flex items-center">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        На доработку
                                    </div>
                                ) : (
                                    "Отправить на доработку"
                                )}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onSetRevisionMode(true)}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            {isMobile ? (
                                <div className="flex items-center">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    На доработку
                                </div>
                            ) : (
                                "На доработку"
                            )}
                        </Button>
                        <Button
                            onClick={() => onReviewResponse("completed")}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            {isSubmitting ? "Обработка..." : (
                                <div className="flex items-center">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {isMobile ? "Принять" : "Принять ответ"}
                                </div>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}