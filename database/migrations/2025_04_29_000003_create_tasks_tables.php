<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('deadline')->nullable();
            $table->enum('priority', ['low', 'medium', 'high'])->nullable();
            $table->enum('status', ['open', 'in_progress', 'completed'])->default('open');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('task_user', function (Blueprint $table) {
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['task_id', 'user_id']);
        });

        Schema::create('task_role', function (Blueprint $table) {
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->primary(['task_id', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_role');
        Schema::dropIfExists('task_user');
        Schema::dropIfExists('tasks');
    }
};