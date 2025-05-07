<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('messages')->onDelete('cascade');
            $table->string('type'); // For file type identification (image, document, etc.)
            $table->string('link'); // File storage path
            $table->string('name_file'); // Original filename
            $table->string('mime_type')->nullable(); // MIME type of the file
            $table->integer('size')->nullable(); // File size in bytes
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages_media');
    }
};