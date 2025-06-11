"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, FileText, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/types/task";
import { TaskDetailsDialog } from "@/Components/Tasks/TaskDetailsDialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { TaskApi } from "@/services/task";

export function UserTasksPage() {
    const { user } = useAuthStore();
    const isMobile = useIsMobile();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Загрузка заданий
    const loadTasks = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await TaskApi.listUserTasks();
            setTasks(response.data || []);
        } catch (err) {
            setError("Не удалось загрузить задания");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    // Обновление статуса задания
    const handleUpdateTaskStatus = async (taskId: string, status: string) => {
        try {
            const updatedTask = await TaskApi.updateStatus(taskId, status);
            setTasks(
                tasks.map((task) =>
                    task.id === updatedTask.id ? updatedTask : task
                )
            );
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    // Вспомогательные функции
    const getTaskStatusText = (status: string): string => {
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
            default:
                return "Неизвестно";
        }
    };

    const getTaskStatusColor = (status: string): string => {
        switch (status) {
            case "pending":
            case "not_started":
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
            case "in_progress":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "completed":
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

    // Получаем статус задания для текущего пользователя
    const getUserTaskStatus = (task: Task): string => {
        // Если задание завершено, возвращаем completed независимо от статуса назначения
        if (task.status === "completed") {
            return "completed";
        }

        const assignment = task.assignments.find(
            (a) => a.userId === user?.id.toString()
        );

        // Если есть назначение и у него есть ответ
        if (assignment?.response) {
            if (assignment.response.status === "approved") {
                return "completed";
            }
            if (assignment.response.status === "revision") {
                return "revision";
            }
            if (assignment.response.status === "submitted") {
                return "submitted";
            }
        }

        return assignment?.status || "not_started";
    };

    // Компонент карточки задания
    const TaskCard = ({ task }: { task: Task }) => {
        const isMobile = useIsMobile();

        return (
            <Card key={task.id} className="overflow-hidden">
                <CardHeader className={`pb-2 ${isMobile ? "px-4" : ""}`}>
                    <div className="flex items-start justify-between">
                        <h3 className="line-clamp-2 text-lg font-medium">
                            {task.title}
                        </h3>
                        <Badge
                            className={`flex items-center ${getTaskStatusColor(
                                getUserTaskStatus(task)
                            )}`}
                        >
                            {getTaskStatusText(getUserTaskStatus(task))}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className={`pb-2 ${isMobile ? "px-4" : ""}`}>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {task.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Срок: {formatDate(task.dueDate)}
                        </span>
                    </div>
                    {task.files.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Файлы: {task.files.length}
                            </span>
                        </div>
                    )}
                </CardContent>
                <CardFooter
                    className={`flex items-center justify-end gap-2 pt-2 ${
                        isMobile ? "px-4" : ""
                    }`}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedTask(task);
                            setIsDetailsDialogOpen(true);
                        }}
                    >
                        {isMobile ? (
                            <div className="flex items-center">
                                Далее
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </div>
                        ) : (
                            "Просмотреть"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        );
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex h-40 items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="mt-4 text-muted-foreground">
                            Загрузка заданий...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex h-40 items-center justify-center">
                    <div className="text-center text-red-500">
                        <p>{error}</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => loadTasks()}
                        >
                            Повторить попытку
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-4 sm:py-6">
            <div className="mb-4 sm:mb-6 px-4 sm:px-0">
                <h1 className="text-2xl sm:text-3xl font-bold">Мои задания</h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
                    Список заданий, назначенных вам
                </p>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full grid grid-cols-4 gap-1">
                    <TabsTrigger value="all">
                        {isMobile ? "Все" : "Все задания"}
                    </TabsTrigger>
                    <TabsTrigger value="active">
                        {isMobile ? "Актив." : "Активные"}
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        {isMobile ? "Заверш." : "Завершенные"}
                    </TabsTrigger>
                    <TabsTrigger value="revision">
                        {isMobile ? "Доработка" : "На доработке"}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.isArray(tasks) && tasks.length > 0 ? (
                            tasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))
                        ) : (
                            <div className="col-span-full flex h-40 items-center justify-center rounded-lg border border-dashed">
                                <div className="flex flex-col items-center text-center">
                                    <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
                                    <h3 className="text-lg font-medium">
                                        Нет заданий
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        У вас пока нет назначенных заданий
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {tasks
                            .filter((task) => {
                                const status = getUserTaskStatus(task);
                                return (
                                    status === "not_started" ||
                                    status === "in_progress" ||
                                    status === "submitted" ||
                                    (status !== "completed" &&
                                        status !== "revision")
                                );
                            })
                            .map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                    </div>
                </TabsContent>

                <TabsContent value="completed" className="mt-6">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {tasks
                            .filter((task) => {
                                const status = getUserTaskStatus(task);
                                return (
                                    status === "completed" ||
                                    task.status === "completed" ||
                                    task.assignments.find(
                                        (a) => a.userId === user?.id?.toString()
                                    )?.response?.status === "approved"
                                );
                            })
                            .map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                    </div>
                </TabsContent>

                <TabsContent value="revision" className="mt-6">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {tasks
                            .filter((task) => {
                                const status = getUserTaskStatus(task);
                                return (
                                    status === "revision" ||
                                    task.assignments.find(
                                        (a) => a.userId === user?.id?.toString()
                                    )?.response?.status === "revision"
                                );
                            })
                            .map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Диалог просмотра задания */}
            {selectedTask && (
                <TaskDetailsDialog
                    open={isDetailsDialogOpen}
                    onOpenChange={setIsDetailsDialogOpen}
                    task={selectedTask as Task}
                    isUserTaskView={true}
                    onUpdateTask={async (updatedTask) => {
                        // Перезагружаем все задания для получения актуальных данных
                        await loadTasks();
                        setIsDetailsDialogOpen(false);
                    }}
                />
            )}
        </div>
    );
}
export default UserTasksPage;
