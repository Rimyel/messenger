import { useState } from "react";
import type { TaskStatus } from "@/services/task";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar } from "@/Components/ui/calendar";
import { Button } from "@/Components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";

interface ExportDateRangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExport: (startDate: Date | null, endDate: Date | null, status: TaskStatus | null, type: 'excel' | 'pdf') => Promise<void>;
    type: 'excel' | 'pdf';
}

export function ExportDateRangeDialog({
    open,
    onOpenChange,
    onExport,
    type
}: ExportDateRangeDialogProps) {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [status, setStatus] = useState<TaskStatus | null>(null);

    const statusOptions = [
        { value: '', label: 'Все статусы' },
        { value: 'pending' as const, label: 'Ожидает выполнения' },
        { value: 'in_progress' as const, label: 'В процессе' },
        { value: 'completed' as const, label: 'Завершено' },
        { value: 'revision' as const, label: 'На доработке' },
        { value: 'overdue' as const, label: 'Просрочено' }
    ];

    const handleExport = async () => {
        // Преобразуем undefined в null если даты не выбраны
        const start = startDate || null;
        const end = endDate || null;
        await onExport(start, end, status, type);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        Экспорт отчета в {type.toUpperCase()}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        Выберите период и/или статус для фильтрации. Если период не выбран, отчет будет создан за все время.
                    </p>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Период от</span>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={!startDate ? "text-muted-foreground" : ""}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? (
                                        format(startDate, "d MMMM yyyy", { locale: ru })
                                    ) : (
                                        "Выберите начальную дату"
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={startDate || undefined}
                                    onSelect={(date) => setStartDate(date || null)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Период до</span>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={!endDate ? "text-muted-foreground" : ""}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? (
                                        format(endDate, "d MMMM yyyy", { locale: ru })
                                    ) : (
                                        "Выберите конечную дату"
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDate || undefined}
                                    onSelect={(date) => setEndDate(date || null)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid items-center gap-4">
                        <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={status || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                setStatus(value ? value as typeof status : null);
                            }}
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Отмена
                    </Button>
                    <Button onClick={handleExport}>
                        Экспортировать
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}