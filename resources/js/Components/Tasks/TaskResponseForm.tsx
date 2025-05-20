import React, { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Input } from "@/Components/ui/input";
import { TaskFileList } from "./TaskFileList";
import type { TaskFile } from "@/types/task";

interface TaskResponseFormProps {
    responseText: string;
    onResponseTextChange: (text: string) => void;
    existingFiles: TaskFile[];
    onExistingFileRemove: (fileId: string) => void;
    uploadedFiles: File[];
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUploadedFileRemove: (fileName: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    isLocked?: boolean;
    isExistingResponse?: boolean;
}

export function TaskResponseForm({
    responseText,
    onResponseTextChange,
    existingFiles,
    onExistingFileRemove,
    uploadedFiles,
    onFileUpload,
    onUploadedFileRemove,
    onSubmit,
    isSubmitting,
    isLocked = false,
    isExistingResponse = false,
}: TaskResponseFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const uploadedFilesFormatted: TaskFile[] = uploadedFiles.map((file) => ({
        id: file.name, // Используем имя файла как временный id
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        url: "#"
    }));

    return (
        <div className="space-y-4">
            <Textarea
                placeholder="Введите ваш ответ..."
                value={responseText}
                onChange={(e) => onResponseTextChange(e.target.value)}
                disabled={isLocked}
            />
            <div>
                <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={onFileUpload}
                />
                <Button
                    variant="outline"
                    className="mb-4"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLocked}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Прикрепить файлы
                </Button>

                {(existingFiles.length > 0 || uploadedFiles.length > 0) && (
                    <div className="space-y-2">
                        {existingFiles.length > 0 && (
                            <TaskFileList
                                files={existingFiles}
                                showDownload={true}
                                showRemove={!isLocked}
                                onRemove={onExistingFileRemove}
                            />
                        )}
                        {uploadedFiles.length > 0 && (
                            <TaskFileList
                                files={uploadedFilesFormatted}
                                showDownload={false}
                                showRemove={!isLocked}
                                onRemove={onUploadedFileRemove}
                            />
                        )}
                    </div>
                )}
            </div>

            {!isLocked && (
                <div className="flex justify-end">
                    <Button
                        onClick={onSubmit}
                        disabled={!responseText.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isExistingResponse ? "Сохранение..." : "Отправка..."}
                            </>
                        ) : (
                            isExistingResponse ? "Сохранить изменения" : "Отправить ответ"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}