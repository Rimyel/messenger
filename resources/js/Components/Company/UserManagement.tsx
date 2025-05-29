"use client"
import { lazy, Suspense } from "react"
import { JoinRequestsTable } from "@/Components/Company/JoinRequestsTable"
import { UserManagementTable } from "@/Components/Company/UserManagementTable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs"
import { Search, UserPlus, X } from "lucide-react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { useState } from "react"
import type { Company } from "@/types/company"

interface Props {
  company: Company
}

export default function UserManagement({ company }: Props) {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Управление пользователями</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Пользователи компании</TabsTrigger>
          <TabsTrigger value="requests">Запросы на вступление</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск пользователей..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 rounded-full p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
          </div>
          <UserManagementTable searchQuery={searchQuery} companyId={company.id} />
        </TabsContent> 

        <TabsContent value="requests" className="mt-6">
          <JoinRequestsTable companyId={company.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}