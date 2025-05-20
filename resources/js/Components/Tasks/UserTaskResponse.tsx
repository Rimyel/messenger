import React from "react";
import { TaskResponseForm } from "./TaskResponseForm";
import type { User } from "@/types/app";
import type { TaskAssignment } from "@/types/task";

interface UserTaskResponseProps {
    user: User;
    assignment: TaskAssignment | null;
    responseText: string;
    onResponseTextChange: (text: string) => void;
    existingFiles: any[];
    onExistingFileRemove: (fileId: string) => void;
    uploadedFiles: File[];
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUploadedFileRemove: (fileName: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export function UserTaskResponse({
    user,
    assignment,
    responseText,
    onResponseTextChange,
    existingFiles,
    onExistingFileRemove,
    uploadedFiles,
    onFileUpload,
    onUploadedFileRemove,
    onSubmit,
    isSubmitting
}: UserTaskResponseProps) {
    const isResponseLocked = () => {
        return assignment?.status === "completed" || assignment?.response?.status === "approved";
    };

    const getResponseHeaderText = () => {
        if (isResponseLocked()) {
            return assignment?.status === "completed"
                ? "Ваш ответ (задание завершено)"
                : "Ваш ответ (принят администратором)";
        }
        return assignment?.response
            ? "Ваш ответ (на рассмотрении)"
            : "Ваш ответ";
    };

    return (
        <div className="space-y-4">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {getResponseHeaderText()}
            </h3>
            
            {assignment?.response?.status === "revision" && (
                <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-900/20">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        Требуется доработка: {assignment.response.revisionComment}
                    </p>
                </div>
            )}

            <TaskResponseForm
                responseText={responseText}
                onResponseTextChange={onResponseTextChange}
                existingFiles={existingFiles}
                onExistingFileRemove={onExistingFileRemove}
                uploadedFiles={uploadedFiles}
                onFileUpload={onFileUpload}
                onUploadedFileRemove={onUploadedFileRemove}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                isLocked={isResponseLocked()}
                isExistingResponse={Boolean(assignment?.response)}
            />
        </div>
    );
}