"use client"

import { useState } from "react"
import {
  AlertCircle,
  CalendarIcon,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  User,
  CheckCircle,
  AlertTriangle,
  HourglassIcon,
  SendIcon,
} from "lucide-react"

import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog"
import { Separator } from "@/Components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs"
import { Textarea } from "@/Components/ui/textarea"
import { formatDate } from "@/lib/utils"
import type { Task, TaskAssignment } from "@/types/task"

interface TaskDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  onUpdateTask: (task: Task) => void
}

export function TaskDetailsDialog({ open, onOpenChange, task, onUpdateTask }: TaskDetailsDialogProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignment | null>(null)
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [revisionComment, setRevisionComment] = useState("")
  const [isRevisionMode, setIsRevisionMode] = useState(false)

  // Обработчик обновления статуса задания
  const handleUpdateTaskStatus = (newStatus: "completed" | "revision") => {
    if (!selectedAssignment || !selectedAssignment.response) return

    setIsSubmitting(true)

    // Обновляем статус ответа пользователя
    const updatedAssignments = task.assignments.map((assignment) => {
      if (assignment.userId === selectedAssignment.userId) {
        return {
          ...assignment,
          status: newStatus === "completed" ? "completed" as const : "revision" as const,
          response: {
            ...assignment.response!,
            status: newStatus === "completed" ? "approved" as const : "revision" as const,
            revisionComment: newStatus === "revision" ? revisionComment : undefined,
          },
        }
      }
      return assignment
    })

    // Проверяем, все ли задания выполнены
    const allCompleted = updatedAssignments.every((assignment) => assignment.status === "completed")

    // Обновляем статус задания
    const updatedTask: Task = {
      ...task,
      status: allCompleted ? "completed" : task.status,
      assignments: updatedAssignments,
    }

    // Имитация задержки для демонстрации состояния загрузки
    setTimeout(() => {
      onUpdateTask(updatedTask)
      setSelectedAssignment(null)
      setIsSubmitting(false)
      setIsRevisionMode(false)
      setRevisionComment("")
    }, 1000)
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
      case "not_started":
        return "Не начато"
      case "submitted":
        return "Отправлено"
      case "approved":
        return "Одобрено"
      default:
        return "Неизвестно"
    }
  }

  // Функция для получения цвета статуса
  const getTaskStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
      case "not_started":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "completed":
      case "approved":
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

  // Функция для получения иконки статуса
  const getTaskStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case "pending":
      case "not_started":
        return <HourglassIcon className="mr-1.5 h-4 w-4" />
      case "in_progress":
        return <Clock className="mr-1.5 h-4 w-4" />
      case "completed":
      case "approved":
        return <CheckCircle className="mr-1.5 h-4 w-4" />
      case "revision":
        return <RotateCcw className="mr-1.5 h-4 w-4" />
      case "overdue":
        return <AlertTriangle className="mr-1.5 h-4 w-4" />
      case "submitted":
        return <SendIcon className="mr-1.5 h-4 w-4" />
      default:
        return <HourglassIcon className="mr-1.5 h-4 w-4" />
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              <Badge className={`flex items-center ${getTaskStatusColor(task.status)}`}>
                {getTaskStatusIcon(task.status)}
                {getTaskStatusText(task.status)}
              </Badge>
            </div>
            <DialogDescription>
              Создано: {task.createdBy} · {formatDate(task.createdAt)}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Детали задания</TabsTrigger>
              <TabsTrigger value="assignments">Исполнители ({task.assignments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Описание</h3>
                <div className="rounded-md bg-muted p-4">
                  <p className="whitespace-pre-wrap">{task.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Дата начала</h3>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(task.startDate)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Срок выполнения</h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                </div>
              </div>

              {task.files.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Файлы</h3>
                  <div className="space-y-2">
                    {task.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-md border p-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">{file.name}</div>
                            <div className="text-xs text-muted-foreground">{file.size}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Скачать
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="assignments" className="mt-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4 font-medium">
                  <div>Исполнитель</div>
                  <div>Статус</div>
                  <div></div>
                </div>
                <Separator />
                {task.assignments.map((assignment) => (
                  <div key={assignment.userId}>
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={assignment.userAvatar || "/placeholder.svg"}
                          alt={assignment.userName}
                          className="h-10 w-10 rounded-full"
                        />
                        <div>
                          <div className="font-medium">{assignment.userName}</div>
                        </div>
                      </div>
                      <Badge className={`flex items-center ${getTaskStatusColor(assignment.status)}`}>
                        {getTaskStatusIcon(assignment.status)}
                        {getTaskStatusText(assignment.status)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setIsResponseDialogOpen(true)
                        }}
                      >
                        {assignment.status === "not_started" ? "Детали" : "Просмотреть ответ"}
                      </Button>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра ответа пользователя */}
      {selectedAssignment && (
        <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Ответ пользователя: {selectedAssignment.userName}</DialogTitle>
                <Badge className={`flex items-center ${getTaskStatusColor(selectedAssignment.status)}`}>
                  {getTaskStatusIcon(selectedAssignment.status)}
                  {getTaskStatusText(selectedAssignment.status)}
                </Badge>
              </div>
            </DialogHeader>

            <div className="mt-4 space-y-6">
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Задание</h3>
                <div className="rounded-md bg-muted p-4">
                  <p className="whitespace-pre-wrap">{task.description}</p>
                </div>
              </div>

              {task.files.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Файлы задания</h3>
                  <div className="space-y-2">
                    {task.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-md border p-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">{file.name}</div>
                            <div className="text-xs text-muted-foreground">{file.size}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Скачать
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {selectedAssignment.response ? (
                <>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">Ответ пользователя</h3>
                      <div className="text-sm text-muted-foreground">
                        Отправлено: {formatDate(selectedAssignment.response.submittedAt)}
                      </div>
                    </div>
                    <div className="rounded-md bg-muted p-4">
                      <p className="whitespace-pre-wrap">{selectedAssignment.response.text}</p>
                    </div>
                  </div>

                  {selectedAssignment.response.files.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-muted-foreground">Файлы ответа</h3>
                      <div className="space-y-2">
                        {selectedAssignment.response.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between rounded-md border p-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <div>
                                <div className="text-sm font-medium">{file.name}</div>
                                <div className="text-xs text-muted-foreground">{file.size}</div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              Скачать
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAssignment.response.status === "revision" && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                      <div className="mb-2 flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4" />
                        Комментарий к доработке
                      </div>
                      <p className="text-amber-800 dark:text-amber-300">
                        {selectedAssignment.response.revisionComment}
                      </p>
                    </div>
                  )}

                  {!isRevisionMode && selectedAssignment.response.status === "submitted" && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setIsRevisionMode(true)}
                        disabled={isSubmitting}
                        className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Запросить доработку
                      </Button>
                      <Button
                        onClick={() => handleUpdateTaskStatus("completed")}
                        disabled={isSubmitting}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Обработка...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Завершить задание
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {isRevisionMode && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Комментарий к доработке</h3>
                        <Textarea
                          placeholder="Опишите, что нужно доработать..."
                          value={revisionComment}
                          onChange={(e) => setRevisionComment(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={() => setIsRevisionMode(false)} disabled={isSubmitting}>
                          Отмена
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleUpdateTaskStatus("revision")}
                          disabled={isSubmitting || !revisionComment}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Обработка...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Отправить на доработку
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                  <div className="flex flex-col items-center text-center">
                    <User className="mb-2 h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Нет ответа</h3>
                    <p className="text-sm text-muted-foreground">Пользователь еще не отправил ответ на это задание</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}