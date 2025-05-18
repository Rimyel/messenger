"use client"

import type React from "react"
import { useState } from "react"
import { CalendarIcon, Loader2, Plus, Upload, X } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/Components/ui/button"
import { Calendar } from "@/Components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog"
import { FormLabel } from "@/Components/ui/form"
import { Input } from "@/Components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover"
import { Textarea } from "@/Components/ui/textarea"
import { cn, formatDate } from "@/lib/utils"
import type { Task, TaskFile } from "@/types/task"
import { UserSelector } from "@/Components/Tasks/UserSelector"


interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTask: (task: Task) => void
}

// Примеры данных пользователей для выбора
const USERS_DATA = [
  {
    id: "user1",
    name: "Мария Кузнецова",
    email: "maria@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "user2",
    name: "Дмитрий Петров",
    email: "dmitry@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  // Добавьте больше пользователей по необходимости
]

export function CreateTaskDialog({ open, onOpenChange, onCreateTask }: CreateTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [dueDate, setDueDate] = useState<Date>(new Date())
  const [files, setFiles] = useState<TaskFile[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: TaskFile[] = Array.from(e.target.files).map((file) => ({
        id: uuidv4(),
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileType(file.name),
        url: "#",
      }))
      setFiles([...files, ...newFiles])
    }
  }

  const handleRemoveFile = (fileId: string) => {
    setFiles(files.filter((file) => file.id !== fileId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const newTask: Task = {
      id: uuidv4(),
      title,
      description,
      files,
      startDate: startDate.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      status: "pending",
      createdBy: "Александр Иванов", // В реальном приложении здесь будет имя текущего пользователя
      createdAt: new Date().toISOString().split("T")[0],
      assignments: selectedUsers.map((userId) => {
        const user = USERS_DATA.find((u) => u.id === userId)
        return {
          userId,
          userName: user?.name || "",
          userAvatar: user?.avatar || "",
          status: "not_started",
        }
      }),
    }

    setTimeout(() => {
      onCreateTask(newTask)
      resetForm()
      setIsSubmitting(false)
    }, 1000)
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setStartDate(new Date())
    setDueDate(new Date())
    setFiles([])
    setSelectedUsers([])
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileType = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase() || ""
    if (["doc", "docx"].includes(extension)) return "word"
    if (["xls", "xlsx"].includes(extension)) return "excel"
    if (["ppt", "pptx"].includes(extension)) return "powerpoint"
    if (["pdf"].includes(extension)) return "pdf"
    if (["jpg", "jpeg", "png", "gif"].includes(extension)) return "image"
    if (["zip", "rar", "7z"].includes(extension)) return "archive"
    return "other"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание нового задания</DialogTitle>
          <DialogDescription>
            Заполните форму для создания нового задания. Вы можете назначить задание одному или нескольким
            пользователям.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <FormLabel htmlFor="title">Название задания</FormLabel>
              <Input
                id="title"
                placeholder="Введите название задания"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <FormLabel htmlFor="description">Описание задания</FormLabel>
              <Textarea
                id="description"
                placeholder="Введите описание задания"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FormLabel>Дата начала</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? formatDate(startDate.toISOString()) : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <FormLabel>Срок выполнения</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? formatDate(dueDate.toISOString()) : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => date && setDueDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <FormLabel>Файлы</FormLabel>
              <div className="flex items-center gap-2">
                <Input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} multiple />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground">
                    <Upload className="mr-2 h-4 w-4" />
                    Загрузить файлы
                  </div>
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-2 space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-md border p-2">
                      <div className="flex items-center gap-2">
                        <div className="text-sm">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{file.size}</div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(file.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <FormLabel>Исполнители</FormLabel>
              <UserSelector users={USERS_DATA} selectedUserIds={selectedUsers} onSelectionChange={setSelectedUsers} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || title === "" || description === "" || selectedUsers.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать задание
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}