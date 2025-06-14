import { useState } from "react";
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
    onExport: (startDate: Date, endDate: Date, type: 'excel' | 'pdf') => Promise<void>;
    type: 'excel' | 'pdf';
}

export function ExportDateRangeDialog({
    open,
    onOpenChange,
    onExport,
    type
}: ExportDateRangeDialogProps) {
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    const handleExport = async () => {
        if (startDate && endDate) {
            await onExport(startDate, endDate, type);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        Экспорт отчета в {type.toUpperCase()}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid items-center gap-4">
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
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid items-center gap-4">
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
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Отмена
                    </Button>
                    <Button onClick={handleExport} disabled={!startDate || !endDate}>
                        Экспортировать
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}