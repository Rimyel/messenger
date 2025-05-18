<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        

        // Создаем связующую таблицу
        Schema::create('messages_media', function (Blueprint $table) {
            $table->foreignId('message_id')->constrained()->onDelete('cascade');
            $table->foreignId('media_id')->constrained('media')->onDelete('cascade');
            $table->timestamps();
            
            $table->primary(['message_id', 'media_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages_media');
    }
};