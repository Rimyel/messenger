<?php

namespace App\Http\Controllers;

use App\Models\Task;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TaskReportController extends Controller
{
    public function exportToExcel(Request $request)
    {
        $user = $request->user();
        $company = $user->companies()->first();
        
        if (!$company) {
            return response()->json(['message' => 'Пользователь не принадлежит ни к одной компании'], 403);
        }

        // Получаем все задачи компании с необходимыми связями
        $tasks = Task::with(['creator', 'assignments.user', 'assignments.response'])
            ->where('company_id', $company->id)
            ->latest()
            ->get();

        // Создаем новый Excel документ
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Устанавливаем заголовки
        $sheet->setCellValue('A1', 'Название задачи');
        $sheet->setCellValue('B1', 'Описание');
        $sheet->setCellValue('C1', 'Дата начала');
        $sheet->setCellValue('D1', 'Дата окончания');
        $sheet->setCellValue('E1', 'Статус задачи');
        $sheet->setCellValue('F1', 'Создатель');
        $sheet->setCellValue('G1', 'Исполнитель');
        $sheet->setCellValue('H1', 'Статус выполнения');

        // Стиль для заголовков
        $headerStyle = [
            'font' => ['bold' => true],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'color' => ['rgb' => 'E0E0E0']
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN
                ]
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ];
        
        $sheet->getStyle('A1:H1')->applyFromArray($headerStyle);

        // Заполняем данные
        $row = 2;
        foreach ($tasks as $task) {
            $isFirstAssignment = true;
            
            foreach ($task->assignments as $assignment) {
                if ($isFirstAssignment) {
                    // Основная информация о задаче
                    $sheet->setCellValue('A' . $row, $task->title);
                    $sheet->setCellValue('B' . $row, $task->description);
                    $sheet->setCellValue('C' . $row, Carbon::parse($task->start_date)->format('d.m.Y'));
                    $sheet->setCellValue('D' . $row, Carbon::parse($task->due_date)->format('d.m.Y'));
                    $sheet->setCellValue('E' . $row, $this->translateStatus($task->status));
                    $sheet->setCellValue('F' . $row, $task->creator->name);
                    $isFirstAssignment = false;
                } else {
                    // Очищаем ячейки для дополнительных исполнителей
                    $sheet->setCellValue('A' . $row, '');
                    $sheet->setCellValue('B' . $row, '');
                    $sheet->setCellValue('C' . $row, '');
                    $sheet->setCellValue('D' . $row, '');
                    $sheet->setCellValue('E' . $row, '');
                    $sheet->setCellValue('F' . $row, '');
                }

                // Информация о назначении
                $sheet->setCellValue('G' . $row, $assignment->user->name);
                $sheet->setCellValue('H' . $row, $this->translateAssignmentStatus($assignment->status));
                
                $row++;
            }

            // Добавляем пустую строку между задачами
            $row++;
        }

        // Автоматическая ширина столбцов
        foreach (range('A', 'H') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Создаем временный файл
        $fileName = 'tasks_report_' . date('Y-m-d_H-i-s') . '.xlsx';
        $filePath = storage_path('app/public/' . $fileName);

        // Сохраняем файл
        $writer = new Xlsx($spreadsheet);
        $writer->save($filePath);

        // Возвращаем файл для скачивания
        return response()->download($filePath)->deleteFileAfterSend();
    }

    /**
     * Переводит статус задачи на русский язык
     */
    private function translateStatus($status): string
    {
        return match ($status) {
            'pending' => 'Ожидает',
            'in_progress' => 'В работе',
            'completed' => 'Завершено',
            'revision' => 'На доработке',
            'overdue' => 'Просрочено',
            default => $status,
        };
    }

    /**
     * Переводит статус назначения на русский язык
     */
    private function translateAssignmentStatus($status): string
    {
        return match ($status) {
            'not_started' => 'Не начато',
            'in_progress' => 'В работе',
            'submitted' => 'На проверке',
            'revision' => 'На доработке',
            'completed' => 'Выполнено',
            default => $status,
        };
    }
}