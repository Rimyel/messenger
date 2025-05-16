import React, { useState, useEffect } from "react";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Search, Plus, Loader2, UserPlus } from "lucide-react";
import {
    Company,
    CompanySearchParams,
    PaginatedCompanies,
} from "@/types/company";
import { toast } from "sonner";
import { CompanyApi } from "@/services/api";
import { joinRequestService } from "@/services/join-request";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Textarea } from "@/Components/ui/textarea";

interface SearchCompanyProps {
    onCreateClick: () => void;
}

const SearchCompany: React.FC<SearchCompanyProps> = ({ onCreateClick }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [companies, setCompanies] = useState<PaginatedCompanies | null>(null);
    const [loading, setLoading] = useState(false);
    const [joiningCompanyId, setJoiningCompanyId] = useState<number | null>(null);
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [joinMessage, setJoinMessage] = useState("");

    const searchCompanies = async (params: CompanySearchParams) => {
        try {
            setLoading(true);
            // Отправляем запрос только если есть поисковый запрос
            if (params.query?.trim()) {
                const data = await CompanyApi.search(params);
                setCompanies(data);
            } else {
                // Если поискового запроса нет, очищаем список компаний
                setCompanies({
                    data: [],
                    total: 0,
                    per_page: params.per_page || 5,
                    current_page: 1,
                    last_page: 1
                });
            }
        } catch (error) {
            console.error("Ошибка при поиске компаний:", error);
            toast.error("Не удалось загрузить список компаний");
        } finally {
            setLoading(false);
        }
    };

    const showJoinDialog = (company: Company) => {
        setSelectedCompany(company);
        setIsJoinDialogOpen(true);
    };

    const handleJoinCompany = async () => {
        if (!selectedCompany) return;

        try {
            setJoiningCompanyId(selectedCompany.id);
            await joinRequestService.create(selectedCompany.id, { message: joinMessage });
            toast.success("Запрос на вступление отправлен");
            setIsJoinDialogOpen(false);
            setJoinMessage("");
            setSelectedCompany(null);
        } catch (error: any) {
            if (error.response?.status === 422) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Не удалось отправить запрос на вступление");
                console.error("Ошибка при отправке запроса:", error);
            }
        } finally {
            setJoiningCompanyId(null);
        }
    };

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            searchCompanies({ query: searchQuery, page: 1, per_page: 5 });
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    return (
        <div className="flex flex-col space-y-4 p-6">
            <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Введите название компании для поиска..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button onClick={onCreateClick} className="ml-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Создать компанию
                </Button>
            </div>

            <div className="grid gap-4 mt-4">
                {loading ? (
                    <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">
                            Поиск компаний...
                        </p>
                    </div>
                ) : companies?.data.length ? (
                    companies.data.map((company) => (
                        <Card
                            key={company.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center">
                                    {company.logo_url ? (
                                        <img
                                            src={company.logo_url}
                                            alt={company.name}
                                            className="w-12 h-12 rounded-full object-cover mr-4"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                                            {company.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {company.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {company.description}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="ml-4"
                                    disabled={joiningCompanyId === company.id}
                                    onClick={() => showJoinDialog(company)}
                                >
                                    {joiningCompanyId === company.id ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Присоединение...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Присоединиться
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-gray-500">
                        {searchQuery.trim()
                            ? "Компании не найдены. Попробуйте изменить запрос."
                            : "Введите название компании для поиска"}
                    </div>
                )}
            </div>

            {companies && companies.total > companies.per_page && (
                <div className="flex justify-center mt-4">
                    <Button
                        variant="outline"
                        onClick={() =>
                            searchCompanies({
                                query: searchQuery,
                                page:
                                    companies.current_page < companies.last_page
                                        ? companies.current_page + 1
                                        : companies.current_page,
                                per_page: companies.per_page,
                            })
                        }
                        disabled={
                            companies.current_page === companies.last_page
                        }
                    >
                        Загрузить еще
                    </Button>
                </div>
            )}

            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Отправить запрос на вступление</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-4">
                            {selectedCompany?.logo_url ? (
                                <img
                                    src={selectedCompany.logo_url}
                                    alt={selectedCompany.name}
                                    className="w-12 h-12 rounded-full"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    {selectedCompany?.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h3 className="font-medium">{selectedCompany?.name}</h3>
                                <p className="text-sm text-gray-500">Отправить запрос на вступление в компанию</p>
                            </div>
                        </div>
                        <div>
                            <Textarea
                                value={joinMessage}
                                onChange={(e) => setJoinMessage(e.target.value)}
                                placeholder="Добавьте сообщение к вашему запросу (необязательно)"
                                className="resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleJoinCompany} disabled={joiningCompanyId === selectedCompany?.id}>
                            {joiningCompanyId === selectedCompany?.id ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Отправка...
                                </>
                            ) : (
                                'Отправить запрос'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SearchCompany;
