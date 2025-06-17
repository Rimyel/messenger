"use client";

import { useEffect, useState } from "react";
import { ExportDateRangeDialog } from "@/Components/Tasks/ExportDateRangeDialog";

import type { DateRangeExport } from "@/services/task";
import {
    CalendarIcon,
    Download,
    FileText,
    Plus,
    Search,
    Users,
    ChevronRight,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Progress } from "@/Components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { CreateTaskDialog } from "@/Components/Tasks/CreateTaskDialog";
import { TaskDetailsDialog } from "@/Components/Tasks/TaskDetailsDialog";
import type { Task } from "@/types/task";
import { TaskApi } from "@/services/task";
import { toast } from "sonner";

export default function AdminTasksPage() {
    const isMobile = useIsMobile();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'completed_at'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportType, setExportType] = useState<"excel" | "pdf">("excel");

    // Функция форматирования даты
    const formatTaskDate = (date: string | null): string => {
        if (!date) return "-";
        try {
            return format(new Date(date), "dd.MM.yyyy", { locale: ru });
        } catch (error) {
            console.error("Error formatting date:", error);
            return "-";
        }
    };

    // Загрузка заданий
    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const data = await TaskApi.list({ sort_by: sortBy, sort_order: sortOrder });
            setTasks(data.data);
        } catch (error) {
            console.error("Failed to load tasks:", error);
            toast.error("Не удалось загрузить задания");
        } finally {
            setIsLoading(false);
        }
    };

    // Фильтрация задач по поисковому запросу
    const filteredTasks = tasks.filter(
        (task) =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Обработчик создания нового задания
    const handleCreateTask = async (formData: FormData): Promise<void> => {
        try {
            await TaskApi.create(formData);
            // После успешного создания перезагружаем список заданий
            await loadTasks();
            setIsCreateDialogOpen(false);
            toast.success("Задание успешно создано");
        } catch (error) {
            console.error("Failed to create task:", error);
            toast.error("Не удалось создать задание");
            throw error;
        }
    };

    // Обработчик обновления задания
    const handleUpdateTask = async (updatedTask: Task) => {
        try {
            await TaskApi.updateStatus(updatedTask.id, updatedTask.status);
            // После обновления перезагружаем список заданий
            await loadTasks();
            setSelectedTask(null);
            setIsDetailsDialogOpen(false);
            toast.success("Статус задания обновлен");
        } catch (error) {
            console.error("Failed to update task:", error);
            toast.error("Не удалось обновить задание");
        }
    };

    // Функция для получения текста статуса
    const getTaskStatusText = (status: string): string => {
        switch (status) {
            case "pending":
                return "Ожидает выполнения";
            case "in_progress":
                return "В процессе";
            case "completed":
                return "Завершено";
            case "revision":
                return "На доработке";
            case "overdue":
                return "Просрочено";
            default:
                return "Неизвестно";
        }
    };

    // Функция для получения цвета статуса
    const getTaskStatusColor = (status: string): string => {
        switch (status) {
            case "pending":
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
            case "in_progress":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "completed":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "revision":
                return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
            case "overdue":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    // Функция для подсчета прогресса выполнения задания
    const calculateTaskProgress = (task: Task): number => {
        const totalAssignments = task.assignments.length;
        if (totalAssignments === 0) return 0;

        const completedAssignments = task.assignments.filter(
            (assignment) =>
                assignment.status === "completed" ||
                assignment.status === "submitted"
        ).length;

        return Math.round((completedAssignments / totalAssignments) * 100);
    };

    // Фильтрация задач по вкладкам
    const filterTasksByTab = (tasks: Task[], tab: string) => {
        switch (tab) {
            case "active":
                return tasks.filter((task) =>
                    ["pending", "in_progress"].includes(task.status)
                );
            case "completed":
                return tasks.filter((task) => task.status === "completed");
            case "overdue":
                return tasks.filter((task) => task.status === "overdue");
            default:
                return tasks;
        }
    };

    return (
        <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="mb-4 sm:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold">
                    Управление заданиями
                </h1>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setExportType("excel");
                            setIsExportDialogOpen(true);
                        }}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Excel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setExportType("pdf");
                            setIsExportDialogOpen(true);
                        }}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Создать задание
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <div className="mb-4 sm:mb-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 w-full">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Сортировка:</span>
                                <select
                                    className="w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value as typeof sortBy);
                                        loadTasks();
                                    }}
                                >
                                    <option value="created_at">По дате создания</option>
                                    <option value="due_date">По дате дедлайна</option>
                                    <option value="completed_at">По дате выполнения</option>
                                </select>
                                <select
                                    className="w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value as typeof sortOrder);
                                        loadTasks();
                                    }}
                                >
                                    <option value="desc">По убыванию</option>
                                    <option value="asc">По возрастанию</option>
                                </select>
                            </div>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Поиск заданий..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <TabsList className="w-full grid grid-cols-4 gap-1">
                        <TabsTrigger value="all">
                            {isMobile ? `Все (${filteredTasks.length})` : `Все задания (${filteredTasks.length})`}
                        </TabsTrigger>
                        <TabsTrigger value="active">
                            {isMobile ? `Актив. (${filterTasksByTab(filteredTasks, 'active').length})` : `Активные (${filterTasksByTab(filteredTasks, 'active').length})`}
                        </TabsTrigger>
                        <TabsTrigger value="completed">
                            {isMobile ? `Заверш. (${filterTasksByTab(filteredTasks, 'completed').length})` : `Завершенные (${filterTasksByTab(filteredTasks, 'completed').length})`}
                        </TabsTrigger>
                        <TabsTrigger value="overdue">
                            {isMobile ? `Просроч. (${filterTasksByTab(filteredTasks, 'overdue').length})` : `Просроченные (${filterTasksByTab(filteredTasks, 'overdue').length})`}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {["all", "active", "completed", "overdue"].map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-0">
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {isLoading ? (
                                <div className="col-span-full flex h-40 items-center justify-center">
                                    <div className="text-center">
                                        <div className="mb-2 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                        <p className="text-sm text-muted-foreground">
                                            Загрузка заданий...
                                        </p>
                                    </div>
                                </div>
                            ) : filterTasksByTab(filteredTasks, tab).length >
                              0 ? (
                                filterTasksByTab(filteredTasks, tab).map(
                                    (task) => (
                                        <Card
                                            key={task.id}
                                            className="cursor-pointer transition-all hover:shadow-md"
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setIsDetailsDialogOpen(true);
                                            }}
                                        >
                                            <CardHeader className="pb-2 px-4">
                                                <div className="flex items-start justify-between">
                                                    <h3 className="line-clamp-2 text-lg font-medium">
                                                        {task.title}
                                                    </h3>
                                                    <Badge
                                                        className={`flex items-center ${getTaskStatusColor(
                                                            task.status
                                                        )}`}
                                                    >
                                                        {getTaskStatusText(
                                                            task.status
                                                        )}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pb-2 px-4">
                                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                                    {task.description}
                                                </p>
                                                <div className="mt-4 flex items-center gap-2">
                                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">
                                                        Срок:{" "}
                                                        {formatTaskDate(
                                                            task.dueDate
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">
                                                        Исполнители:{" "}
                                                        {
                                                            task.assignments
                                                                .length
                                                        }
                                                    </span>
                                                </div>
                                                {task.files.length > 0 && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">
                                                            Файлы:{" "}
                                                            {task.files.length}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="mt-4">
                                                    <div className="mb-1 flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">
                                                            Прогресс выполнения
                                                        </span>
                                                        <span className="text-xs font-medium">
                                                            {calculateTaskProgress(
                                                                task
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={calculateTaskProgress(
                                                            task
                                                        )}
                                                        className="h-2"
                                                    />
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex items-center justify-end pt-2 px-4">
                                                {isMobile && (
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </CardFooter>
                                        </Card>
                                    )
                                )
                            ) : (
                                <div className="col-span-full flex h-40 items-center justify-center rounded-lg border border-dashed">
                                    <div className="flex flex-col items-center text-center">
                                        <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
                                        <h3 className="text-lg font-medium">
                                            Нет заданий
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {searchQuery
                                                ? "По вашему запросу ничего не найдено"
                                                : "Создайте новое задание, нажав на кнопку выше"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Диалог создания задания */}
            <CreateTaskDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onCreateTask={handleCreateTask}
            />

            {/* Диалог просмотра деталей задания */}
            {selectedTask && (
                <TaskDetailsDialog
                    open={isDetailsDialogOpen}
                    onOpenChange={setIsDetailsDialogOpen}
                    task={selectedTask}
                    onUpdateTask={handleUpdateTask}
                />
            )}

            {/* Диалог выбора периода для экспорта */}
            <ExportDateRangeDialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                type={exportType}
                onExport={async (startDate: Date | null, endDate: Date | null, status: TaskStatus | null, type: 'excel' | 'pdf') => {
                    try {
                        const dateRange: DateRangeExport = {};
                        
                        // Если указаны обе даты, добавляем их в запрос
                        if (startDate && endDate) {
                            dateRange.start_date = startDate.toISOString().split("T")[0];
                            dateRange.end_date = endDate.toISOString().split("T")[0];
                        }

                        // Если указан статус, добавляем его в запрос
                        if (status) {
                            dateRange.status = status;
                        }

                        if (type === "excel") {
                            await TaskApi.exportToExcel(dateRange);
                            toast.success("Отчет Excel успешно скачан");
                        } else {
                            await TaskApi.exportToPDF(dateRange);
                            toast.success("Отчет PDF успешно скачан");
                        }
                    } catch (error) {
                        console.error("Failed to export tasks:", error);
                        toast.error(
                            `Не удалось скачать отчет ${type.toUpperCase()}`
                        );
                    }
                }}
            />
        </div>
    );
}
