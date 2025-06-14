<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CompanySeeder::class,    // Сначала создаем компании
            UserSeeder::class,       // Затем пользователей
            TaskSeeder::class,       // Создаем задачи для пользователей
        ]);
    }
}
