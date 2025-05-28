"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, Download, FileText, Plus, Search, Users } from "lucide-react"

import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Progress } from "@/Components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs"
import { CreateTaskDialog } from "@/Components/Tasks/CreateTaskDialog"
import { TaskDetailsDialog } from "@/Components/Tasks/TaskDetailsDialog"
import { formatDate } from "@/lib/utils"
import type { Task } from "@/types/task"
import { TaskApi } from "@/services/task"
import { toast } from "sonner"

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  // Загрузка заданий
  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const data = await TaskApi.list()
      setTasks(data.data)
    } catch (error) {
      console.error("Failed to load tasks:", error)
      toast.error("Не удалось загрузить задания")
    } finally {
      setIsLoading(false)
    }
  }

  // Фильтрация задач по поисковому запросу
  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Обработчик создания нового задания
  const handleCreateTask = async (formData: FormData): Promise<void> => {
    try {
      const newTask = await TaskApi.create(formData)
      setTasks([newTask, ...tasks])
      setIsCreateDialogOpen(false)
      toast.success("Задание успешно создано")
    } catch (error) {
      console.error("Failed to create task:", error)
      toast.error("Не удалось создать задание")
      throw error // Пробрасываем ошибку дальше для обработки в компоненте CreateTaskDialog
    }
  }

  // Обработчик обновления задания
  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await TaskApi.updateStatus(updatedTask.id, updatedTask.status)
      setTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
      setSelectedTask(null)
      setIsDetailsDialogOpen(false)
      toast.success("Статус задания обновлен")
    } catch (error) {
      console.error("Failed to update task:", error)
      toast.error("Не удалось обновить задание")
    }
  }

  // Функция для получения текста статуса
  const getTaskStatusText = (status: string): string => {
    switch (status) {
      case "pending":
        return "Ожидает выполнения"
      case "in_progress":
        return "В процессе"
      case "completed":
        return "Завершено"
      case "revision":
        return "На доработке"
      case "overdue":
        return "Просрочено"
      default:
        return "Неизвестно"
    }
  }

  // Функция для получения цвета статуса
  const getTaskStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "revision":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Функция для подсчета прогресса выполнения задания
  const calculateTaskProgress = (task: Task): number => {
    const totalAssignments = task.assignments.length
    if (totalAssignments === 0) return 0

    const completedAssignments = task.assignments.filter(
      (assignment) => assignment.status === "completed" || assignment.status === "submitted",
    ).length

    return Math.round((completedAssignments / totalAssignments) * 100)
  }

  // Фильтрация задач по вкладкам
  const filterTasksByTab = (tasks: Task[], tab: string) => {
    switch (tab) {
      case "active":
        return tasks.filter((task) => ["pending", "in_progress"].includes(task.status))
      case "completed":
        return tasks.filter((task) => task.status === "completed")
      case "overdue":
        return tasks.filter((task) => task.status === "overdue")
      default:
        return tasks
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Задания</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={async () => {
            try {
              await TaskApi.exportToExcel()
              toast.success("Отчет успешно скачан")
            } catch (error) {
              console.error("Failed to export tasks:", error)
              toast.error("Не удалось скачать отчет")
            }
          }}>
            <Download className="mr-2 h-4 w-4" />
            Экспорт в Excel
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать задание
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">Все задания</TabsTrigger>
            <TabsTrigger value="active">Активные</TabsTrigger>
            <TabsTrigger value="completed">Завершенные</TabsTrigger>
            <TabsTrigger value="overdue">Просроченные</TabsTrigger>
          </TabsList>

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

        {["all", "active", "completed", "overdue"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <div className="col-span-full flex h-40 items-center justify-center">
                  <div className="text-center">
                    <div className="mb-2 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Загрузка заданий...</p>
                  </div>
                </div>
              ) : filterTasksByTab(filteredTasks, tab).length > 0 ? (
                filterTasksByTab(filteredTasks, tab).map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => {
                      setSelectedTask(task)
                      setIsDetailsDialogOpen(true)
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <h3 className="line-clamp-2 text-lg font-medium">{task.title}</h3>
                        <Badge className={`flex items-center ${getTaskStatusColor(task.status)}`}>
                          {getTaskStatusText(task.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Срок: {formatDate(task.dueDate)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Исполнители: {task.assignments.length}
                        </span>
                      </div>
                      {task.files.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Файлы: {task.files.length}</span>
                        </div>
                      )}
                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Прогресс выполнения</span>
                          <span className="text-xs font-medium">{calculateTaskProgress(task)}%</span>
                        </div>
                        <Progress value={calculateTaskProgress(task)} className="h-2" />
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-end pt-2">
                      <div className="flex -space-x-2">
                        {task.assignments.slice(0, 3).map((assignment) => (
                          <img
                            key={assignment.userId}
                            src={assignment.userAvatar}
                            alt={assignment.userName}
                            className="h-6 w-6 rounded-full border-2 border-background"
                          />
                        ))}
                        {task.assignments.length > 3 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                            +{task.assignments.length - 3}
                          </div>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex h-40 items-center justify-center rounded-lg border border-dashed">
                  <div className="flex flex-col items-center text-center">
                    <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Нет заданий</h3>
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
    </div>
  )
}