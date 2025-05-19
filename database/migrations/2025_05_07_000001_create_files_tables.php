<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->id('id')->primary();
            $table->string('name'); // Оригинальное имя файла
            $table->string('path'); // Путь к файлу в хранилище
            $table->string('type'); // Тип файла (image, document, etc.)
            $table->string('mime_type')->nullable(); // MIME-тип файла
            $table->integer('size')->nullable(); // Размер файла в байтах
            $table->timestamps();
        });


        Schema::create('task_files', function (Blueprint $table) {
            $table->unsignedBigInteger('task_id');
            $table->unsignedBigInteger('file_id');
            $table->timestamps();

            $table->foreign('task_id')
                ->references('id')
                ->on('tasks')
                ->cascadeOnDelete();

            $table->foreign('file_id')
                ->references('id')
                ->on('files')
                ->cascadeOnDelete();

            $table->primary(['task_id', 'file_id']);
        });

        Schema::create('task_response_files', function (Blueprint $table) {
            $table->unsignedBigInteger('response_id');
            $table->unsignedBigInteger('file_id');
            $table->timestamps();

            $table->foreign('response_id')
                ->references('id')
                ->on('task_responses')
                ->cascadeOnDelete();

            $table->foreign('file_id')
                ->references('id')
                ->on('files')
                ->cascadeOnDelete();

            $table->primary(['response_id', 'file_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_response_files');
        Schema::dropIfExists('task_files');

        Schema::dropIfExists('files');
    }
};