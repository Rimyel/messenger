"use client"

import { useState } from "react"
import { CalendarIcon, Clock, Download, FileText, Plus, Send, Upload, X } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/Components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs"
import { formatDate } from "@/lib/utils"
import type { Task, TaskAssignment, TaskFile, TaskResponse } from "@/types/task"
import { TaskDetailsDialog } from "@/Components/Tasks/TaskDetailsDialog"

// Для демонстрации используем захардкоженный ID пользователя
const CURRENT_USER_ID = "user1"

// В реальном приложении данные будут загружаться с сервера
const TASKS_DATA: Task[] = [
  {
    id: "task1",
    title: "Подготовка квартального отчета",
    description:
      "Необходимо подготовить финансовый отчет за третий квартал 2024 года. Отчет должен включать анализ доходов и расходов, сравнение с предыдущими периодами и прогноз на следующий квартал.",
    files: [
      {
        id: "file1",
        name: "Шаблон отчета.xlsx",
        size: "245 KB",
        type: "excel",
        url: "#",
      },
    ],
    startDate: "2024-05-15",
    dueDate: "2024-05-25",
    status: "in_progress",
    createdBy: "Александр Иванов",
    createdAt: "2024-05-14",
    assignments: [
      {
        userId: "user1",
        userName: "Павел Соколов",
        userAvatar: "/placeholder.svg",
        status: "in_progress",
      },
    ],
  },
]

// Получаем задания текущего пользователя
const MY_TASKS = TASKS_DATA.filter((task) =>
  task.assignments.some((assignment) => assignment.userId === CURRENT_USER_ID),
)

export function UserTasksPage() {
  const [tasks, setTasks] = useState<Task[]>(MY_TASKS)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  // Вспомогательные функции
  const getTaskStatusText = (status: string): string => {
    switch (status) {
      case "pending":
      case "not_started":
        return "Ожидает выполнения"
      case "in_progress":
        return "В процессе"
      case "completed":
        return "Завершено"
      case "revision":
        return "На доработке"
      case "overdue":
        return "Просрочено"
      case "submitted":
        return "Отправлено"
      default:
        return "Неизвестно"
    }
  }

  const getTaskStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
      case "not_started":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "revision":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "submitted":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Получаем статус задания для текущего пользователя
  const getUserTaskStatus = (task: Task): string => {
    const assignment = task.assignments.find((a) => a.userId === CURRENT_USER_ID)
    return assignment ? assignment.status : "not_started"
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Мои задания</h1>
        <p className="mt-2 text-muted-foreground">Список заданий, назначенных вам</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Все задания</TabsTrigger>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="completed">Завершенные</TabsTrigger>
          <TabsTrigger value="revision">На доработке</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <h3 className="line-clamp-2 text-lg font-medium">{task.title}</h3>
                      <Badge className={`flex items-center ${getTaskStatusColor(getUserTaskStatus(task))}`}>
                        {getTaskStatusText(getUserTaskStatus(task))}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Срок: {formatDate(task.dueDate)}</span>
                    </div>
                    {task.files.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Файлы: {task.files.length}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task)
                        setIsDetailsDialogOpen(true)
                      }}
                    >
                      Просмотреть
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex h-40 items-center justify-center rounded-lg border border-dashed">
                <div className="flex flex-col items-center text-center">
                  <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Нет заданий</h3>
                  <p className="text-sm text-muted-foreground">У вас пока нет назначенных заданий</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks
              .filter((task) => {
                const status = getUserTaskStatus(task)
                return ["not_started", "in_progress"].includes(status)
              })
              .map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <h3 className="line-clamp-2 text-lg font-medium">{task.title}</h3>
                      <Badge className={`flex items-center ${getTaskStatusColor(getUserTaskStatus(task))}`}>
                        {getTaskStatusText(getUserTaskStatus(task))}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Срок: {formatDate(task.dueDate)}</span>
                    </div>
                    {task.files.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Файлы: {task.files.length}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task)
                        setIsDetailsDialogOpen(true)
                      }}
                    >
                      Просмотреть
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks
              .filter((task) => getUserTaskStatus(task) === "completed")
              .map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  {/* Такой же контент карточки, как и выше */}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <h3 className="line-clamp-2 text-lg font-medium">{task.title}</h3>
                      <Badge className={`flex items-center ${getTaskStatusColor(getUserTaskStatus(task))}`}>
                        {getTaskStatusText(getUserTaskStatus(task))}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Срок: {formatDate(task.dueDate)}</span>
                    </div>
                    {task.files.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Файлы: {task.files.length}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task)
                        setIsDetailsDialogOpen(true)
                      }}
                    >
                      Просмотреть
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="revision" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks
              .filter((task) => getUserTaskStatus(task) === "revision")
              .map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <h3 className="line-clamp-2 text-lg font-medium">{task.title}</h3>
                      <Badge className={`flex items-center ${getTaskStatusColor(getUserTaskStatus(task))}`}>
                        {getTaskStatusText(getUserTaskStatus(task))}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Срок: {formatDate(task.dueDate)}</span>
                    </div>
                    {task.files.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Файлы: {task.files.length}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task)
                        setIsDetailsDialogOpen(true)
                      }}
                    >
                      Просмотреть
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Диалог просмотра задания */}
      {selectedTask && (
        <TaskDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          task={selectedTask}
          onUpdateTask={(updatedTask) => {
            setTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
            setIsDetailsDialogOpen(false)
          }}
        />
      )}
    </div>
  )
}