<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Таблица задач с обычным автоинкрементным ID
        Schema::create('tasks', function (Blueprint $table) {
            $table->id(); 
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

        // Таблица назначений задач
        Schema::create('task_assignments', function (Blueprint $table) {
            $table->id(); 
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', [
                'not_started',
                'in_progress',
                'submitted',
                'revision',
                'completed'
            ])->default('not_started');
            $table->timestamps();
        });

        // Таблица ответов на задачи
        Schema::create('task_responses', function (Blueprint $table) {
            $table->id(); 
            $table->foreignId('assignment_id')->constrained('task_assignments')->cascadeOnDelete();
            $table->text('text');
            $table->enum('status', [
                'submitted',
                'revision',
                'approved'
            ])->default('submitted');
            $table->text('revision_comment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_responses');
        Schema::dropIfExists('task_assignments');
        Schema::dropIfExists('tasks');
    }
};