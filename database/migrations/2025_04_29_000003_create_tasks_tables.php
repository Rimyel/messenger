<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // UUID используется для:
        // 1. Обеспечения уникальности ID даже в распределенной системе
        // 2. Повышения безопасности (нельзя угадать следующий ID)
        // 3. Возможности генерации ID на клиенте до отправки на сервер
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->date('start_date');
            $table->date('due_date');
            $table->enum('status', [
                'pending',
                'in_progress',
                'completed',
                'revision',
                'overdue'
            ])->default('pending');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('task_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('task_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', [
                'not_started',
                'in_progress',
                'submitted',
                'revision',
                'completed'
            ])->default('not_started');
            $table->timestamps();

            $table->foreign('task_id')
                ->references('id')
                ->on('tasks')
                ->cascadeOnDelete();
        });

        Schema::create('task_responses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('assignment_id');
            $table->text('text');
            $table->enum('status', [
                'submitted',
                'revision',
                'approved'
            ])->default('submitted');
            $table->text('revision_comment')->nullable();
            $table->timestamps();

            $table->foreign('assignment_id')
                ->references('id')
                ->on('task_assignments')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_responses');
        Schema::dropIfExists('task_assignments');
        Schema::dropIfExists('tasks');
    }
};