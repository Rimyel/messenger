import React from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/Components/ui/badge";
import { formatDate } from "@/lib/utils";
import { TaskFileList } from "./TaskFileList";
import { getStatusColor, getStatusIcon, getStatusText } from "./taskUtils";
import type { Task } from "@/types/task";

interface TaskDetailsContentProps {
    task: Task;
}

export function TaskDetailsContent({ task }: TaskDetailsContentProps) {
    const isMobile = useIsMobile();
    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-semibold">
                    {task.title}
                </h2>
                <Badge className={`flex items-center ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    {getStatusText(task.status)}
                </Badge>
            </div>

            <div className="text-xs sm:text-sm text-muted-foreground">
                Создано: {task.createdBy} · {formatDate(task.createdAt)}
            </div>

            <div>
                <h3 className="mb-2 text-xs sm:text-sm font-medium text-muted-foreground">
                    Описание
                </h3>
                <div className="rounded-md bg-muted p-3 sm:p-4">
                    <p className="whitespace-pre-wrap">
                        {task.description}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <h3 className="mb-2 text-xs sm:text-sm font-medium text-muted-foreground">
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
                    <h3 className="mb-2 text-xs sm:text-sm font-medium text-muted-foreground">
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
                    <h3 className="mb-2 text-xs sm:text-sm font-medium text-muted-foreground">
                        Файлы
                    </h3>
                    <TaskFileList files={task.files} showDownload={true} showRemove={false} />
                </div>
            )}
        </div>
    );
}