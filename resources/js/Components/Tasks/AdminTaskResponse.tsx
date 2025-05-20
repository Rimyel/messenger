import React from "react";
import { FileText } from "lucide-react";
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
    if (!assignment.response) {
        return (
            <div className="rounded-md bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                    Пользователь еще не отправил ответ
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Текст ответа
                </h3>
                <div className="rounded-md bg-muted p-4">
                    <p className="whitespace-pre-wrap">
                        {assignment.response.text}
                    </p>
                </div>
            </div>

            {assignment.response.files.length > 0 && (
                <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
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
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={() => onSetRevisionMode(false)}
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={() => onReviewResponse("revision")}
                                disabled={!revisionComment.trim() || isSubmitting}
                                variant="destructive"
                            >
                                {isSubmitting ? "Отправка..." : "Отправить на доработку"}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => onSetRevisionMode(true)}
                            disabled={isSubmitting}
                        >
                            На доработку
                        </Button>
                        <Button
                            onClick={() => onReviewResponse("completed")}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Обработка..." : "Принять ответ"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}