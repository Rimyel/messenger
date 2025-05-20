import { Button } from "@/Components/ui/button";
import { FileText, Download, X } from "lucide-react";
import type { TaskFile } from "@/types/task";

interface TaskFileListProps {
    files: TaskFile[];
    onRemove?: (fileId: string) => void;
    showDownload?: boolean;
    showRemove?: boolean;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export function TaskFileList({ 
    files, 
    onRemove,
    showDownload = true,
    showRemove = false 
}: TaskFileListProps) {
    return (
        <div className="space-y-2">
            {files.map((file) => (
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
                            {file.size && (
                                <div className="text-xs text-muted-foreground">
                                    {typeof file.size === 'number' ? formatFileSize(file.size) : file.size}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {showDownload && (
                            <Button
                                variant="ghost"
                                size="sm"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Скачать
                            </Button>
                        )}
                        {showRemove && onRemove && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemove(file.id)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}