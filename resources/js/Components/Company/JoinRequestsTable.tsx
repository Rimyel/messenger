"use client"

import { useState, useEffect } from "react"
import { Check, Clock, MoreHorizontal, X } from "lucide-react"
import { joinRequestService } from "@/services/join-request"
import { AuthService } from "@/services/auth"
import { useAuthStore } from "@/stores/useAuthStore"
import type { JoinRequest, JoinRequestEvent } from "@/types/join-request"
import { toast } from "sonner"

import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/Components/ui/dialog"
import { Textarea } from "@/Components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table"

interface Props {
  companyId: number
}

function StatusBadge({ status }: { status: JoinRequest["status"] }) {
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

export function JoinRequestsTable({ companyId }: Props) {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState("")
  const { user } = useAuthStore()

  useEffect(() => {
    loadRequests()
    subscribeToUpdates()

    return () => {
      joinRequestService.unsubscribeFromCompanyRequests(companyId)
    }
  }, [companyId])

  const loadRequests = async () => {
    try {
      const requests = await joinRequestService.getCompanyRequests(companyId)
      setRequests(requests)
    } catch (error) {
      console.error('Ошибка при загрузке запросов:', error)
      toast.error('Не удалось загрузить запросы на вступление')
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToUpdates = () => {
    joinRequestService.subscribeToCompanyRequests(companyId, (event: JoinRequestEvent) => {
      setRequests(prev =>
        prev.map(request =>
          request.id === event.id
            ? { ...request, status: event.status, rejection_reason: event.rejection_reason }
            : request
        )
      )
    })
  }

const approveRequest = async (requestId: number) => {
  try {
    await joinRequestService.updateStatus(companyId, requestId, { status: 'approved' })
    setRequests(prev =>
      prev.map(request =>
        request.id === requestId
          ? { ...request, status: 'approved', rejection_reason: null }
          : request
      )
    )
    
    // Обновляем данные пользователя после успешного принятия в компанию
    try {
      const updatedUser = await AuthService.getCurrentUser()
      useAuthStore.getState().setUser(updatedUser)
    } catch (error) {
      console.error('Ошибка при обновлении данных пользователя:', error)
      // Не показываем ошибку пользователю, так как запрос уже был одобрен
    }

    toast.success('Запрос одобрен')
  } catch (error) {
    console.error('Ошибка при одобрении запроса:', error)
    toast.error('Не удалось одобрить запрос')
  }
}

  const rejectRequest = async (requestId: number) => {
    try {
      await joinRequestService.updateStatus(companyId, requestId, {
        status: 'rejected',
        rejection_reason: rejectionReason
      })
      toast.success('Запрос отклонен')
      setRejectionReason("")
    } catch (error) {
      console.error('Ошибка при отклонении запроса:', error)
      toast.error('Не удалось отклонить запрос')
    }
  }

  const showRequestDetails = (request: JoinRequest) => {
    setRejectionReason(request.rejection_reason || "")
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
                        src={`https://www.gravatar.com/avatar/${request.user?.email}?d=mp`}
                        alt={request.user?.name || 'User avatar'}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{request.user?.name}</div>
                        <div className="text-sm text-muted-foreground">{request.user?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString('ru-RU')}</TableCell>
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
                  src={`https://www.gravatar.com/avatar/${selectedRequest.user?.email}?d=mp&s=96`}
                  alt={selectedRequest.user?.name}
                  className="h-12 w-12 rounded-full"
                />
                <div>
                  <div className="text-lg font-medium">{selectedRequest.user?.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedRequest.user?.email}</div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-muted-foreground">Дата запроса</div>
                <div>{new Date(selectedRequest.created_at).toLocaleDateString('ru-RU')}</div>
              </div>

              {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                <div>
                  <div className="mb-1 text-sm font-medium text-muted-foreground">Причина отказа</div>
                  <div className="rounded-md bg-muted p-3">{selectedRequest.rejection_reason}</div>
                </div>
              )}

              <div>
                <div className="mb-1 text-sm font-medium text-muted-foreground">Статус</div>
                <StatusBadge status={selectedRequest.status} />
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-muted-foreground">Сообщение</div>
                <div className="rounded-md bg-muted p-3">{selectedRequest.message}</div>
              </div>

              {selectedRequest.status === 'pending' && (
                <div>
                  <div className="mb-1 text-sm font-medium text-muted-foreground">Причина отказа</div>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Укажите причину отказа..."
                    className="resize-none"
                  />
                </div>
              )}
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