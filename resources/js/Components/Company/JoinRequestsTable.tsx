"use client"

import { useState } from "react"
import { Check, Clock, MoreHorizontal, X } from "lucide-react"

import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/Components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table"

// Типы данных
type RequestStatus = "pending" | "approved" | "rejected"

interface JoinRequest {
  id: string
  userId: string
  name: string
  email: string
  requestDate: string
  message: string
  status: RequestStatus
  avatar: string
}

// Примеры данных запросов на вступление
const REQUESTS_DATA: JoinRequest[] = [
  {
    id: "req1",
    userId: "u1",
    name: "Дмитрий Козлов",
    email: "dmitry@example.com",
    requestDate: "12.05.2024",
    message: "Хочу присоединиться к вашей компании в качестве разработчика.",
    status: "pending",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "req2",
    userId: "u2",
    name: "Елена Морозова",
    email: "elena@example.com",
    requestDate: "10.05.2024",
    message: "Имею 5 лет опыта в маркетинге, хочу стать частью вашей команды.",
    status: "pending",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "req3",
    userId: "u3",
    name: "Павел Соколов",
    email: "pavel@example.com",
    requestDate: "08.05.2024",
    message: "Ищу работу в сфере дизайна, заинтересован в долгосрочном сотрудничестве.",
    status: "pending",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

function StatusBadge({ status }: { status: RequestStatus }) {
  switch (status) {
    case "pending":
      return (
        <Badge className="border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
          <Clock className="mr-1 h-3 w-3" />
          Ожидает рассмотрения
        </Badge>
      )
    case "approved":
      return (
        <Badge className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <Check className="mr-1 h-3 w-3" />
          Одобрено
        </Badge>
      )
    case "rejected":
      return (
        <Badge className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <X className="mr-1 h-3 w-3" />
          Отклонено
        </Badge>
      )
  }
}

export function JoinRequestsTable() {
  const [requests, setRequests] = useState<JoinRequest[]>(REQUESTS_DATA)
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const approveRequest = (requestId: string) => {
    setRequests(requests.map((request) => (request.id === requestId ? { ...request, status: "approved" } : request)))
  }

  const rejectRequest = (requestId: string) => {
    setRequests(requests.map((request) => (request.id === requestId ? { ...request, status: "rejected" } : request)))
  }

  const showRequestDetails = (request: JoinRequest) => {
    setSelectedRequest(request)
    setIsDetailsDialogOpen(true)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Дата запроса</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[200px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={request.avatar || "/placeholder.svg"}
                        alt={request.name}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{request.name}</div>
                        <div className="text-sm text-muted-foreground">{request.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{request.requestDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900"
                            onClick={() => approveRequest(request.id)}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Принять
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
                            onClick={() => rejectRequest(request.id)}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Отклонить
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Открыть меню</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => showRequestDetails(request)}>
                            Просмотреть детали
                          </DropdownMenuItem>
                          <DropdownMenuItem>Просмотреть профиль</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {request.status === "pending" ? (
                            <>
                              <DropdownMenuItem
                                className="text-green-600 focus:text-green-600"
                                onClick={() => approveRequest(request.id)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Принять запрос
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => rejectRequest(request.id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Отклонить запрос
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Запросов на вступление нет.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Детали запроса на вступление</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedRequest.avatar || "/placeholder.svg"}
                  alt={selectedRequest.name}
                  className="h-12 w-12 rounded-full"
                />
                <div>
                  <div className="text-lg font-medium">{selectedRequest.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedRequest.email}</div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-muted-foreground">Дата запроса</div>
                <div>{selectedRequest.requestDate}</div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-muted-foreground">Статус</div>
                <StatusBadge status={selectedRequest.status} />
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-muted-foreground">Сообщение</div>
                <div className="rounded-md bg-muted p-3">{selectedRequest.message}</div>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            {selectedRequest?.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900"
                  onClick={() => {
                    approveRequest(selectedRequest.id)
                    setIsDetailsDialogOpen(false)
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Принять
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
                  onClick={() => {
                    rejectRequest(selectedRequest.id)
                    setIsDetailsDialogOpen(false)
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Отклонить
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}