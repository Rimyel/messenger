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
use Barryvdh\DomPDF\Facade\Pdf;

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
        // Получаем даты из запроса, если они есть
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = Task::with(['creator', 'assignments.user', 'assignments.response'])
            ->where('company_id', $company->id)
            ->where('created_by', $user->id);

        // Применяем фильтр по датам, если они указаны
        if ($startDate && $endDate) {
            $query->whereBetween('start_date', [$startDate, $endDate]);
        }

        $tasks = $query->latest()->get();

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

    public function exportToPDF(Request $request)
    {
        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['message' => 'Пользователь не принадлежит ни к одной компании'], 403);
        }

        // Получаем все задачи компании с необходимыми связями
        // Получаем даты из запроса, если они есть
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = Task::with(['creator', 'assignments.user', 'assignments.response'])
            ->where('company_id', $company->id)
            ->where('created_by', $user->id);

        // Применяем фильтр по датам, если они указаны
        if ($startDate && $endDate) {
            $query->whereBetween('start_date', [$startDate, $endDate]);
        }

        $tasks = $query->latest()->get();

        // Формируем HTML для PDF
        $html = '<html><head>';
        $html .= '<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>';
        $html .= '<style>
            body {
                font-family: DejaVu Sans, sans-serif;
                font-size: 10px;
                margin: 10px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 5px 0;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 3px;
                text-align: left;
                word-break: break-word;
            }
            th {
                background-color: #f5f5f5;
                font-size: 10px;
            }
            .header {
                text-align: center;
                margin-bottom: 10px;
            }
            .header h2 {
                font-size: 14px;
                margin: 5px 0;
            }
            .header p {
                font-size: 11px;
                margin: 3px 0;
            }
        </style>';
        $html .= '</head><body>';

        // Заголовок отчета
        $html .= '<div class="header">';
        $html .= '<h2>Отчет по задачам</h2>';
        $html .= '<p>Компания: ' . $company->name . '</p>';
        $html .= '<p>Дата формирования: ' . Carbon::now()->format('d.m.Y') . '</p>';
        $html .= '</div>';

        // Таблица с задачами
        $html .= '<table>';
        $html .= '<tr>
            <th>Название задачи</th>
            <th>Описание</th>
            <th>Дата начала</th>
            <th>Дата окончания</th>
            <th>Статус</th>
            <th>Создатель</th>
            <th>Исполнители</th>
        </tr>';

        foreach ($tasks as $task) {
            $executors = $task->assignments->map(function ($assignment) {
                return $assignment->user->name;
            })->implode(", ");

            $html .= '<tr>';
            $html .= '<td>' . $task->title . '</td>';
            $html .= '<td>' . $task->description . '</td>';
            $html .= '<td>' . Carbon::parse($task->start_date)->format('d.m.Y') . '</td>';
            $html .= '<td>' . Carbon::parse($task->due_date)->format('d.m.Y') . '</td>';
            $html .= '<td>' . $this->translateStatus($task->status) . '</td>';
            $html .= '<td>' . $task->creator->name . '</td>';
            $html .= '<td>' . $executors . '</td>';
            $html .= '</tr>';
        }

        $html .= '</table></body></html>';

        // Создаем PDF из HTML с альбомной ориентацией
        $pdf = PDF::loadHTML($html)->setPaper('a4', 'landscape');

        // Возвращаем PDF для скачивания
        return $pdf->download('tasks_report_' . date('Y-m-d_H-i-s') . '.pdf');
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