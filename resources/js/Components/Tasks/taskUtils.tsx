import React from "react";
import { HourglassIcon, Clock, CheckCircle, RotateCcw, AlertTriangle, SendIcon } from "lucide-react";

export const getStatusText = (status: string): string => {
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

export const getStatusColor = (status: string): string => {
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

export const getStatusIcon = (status: string): React.ReactNode => {
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