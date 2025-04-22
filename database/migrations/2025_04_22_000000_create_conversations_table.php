<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('participant1_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('participant2_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Ensure unique conversation pairs
            $table->unique(['participant1_id', 'participant2_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};