<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        $companies = [
            [
                'name' => 'Инновационные Технологии',
                'description' => 'Компания, специализирующаяся на разработке инновационных программных решений',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Цифровые Системы',
                'description' => 'Ведущий поставщик IT-услуг и цифровых решений для бизнеса',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'ТехноПрогресс',
                'description' => 'Разработка и внедрение передовых технологических решений',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Смарт Солюшенс',
                'description' => 'Интеллектуальные решения для умного бизнеса',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Кибер Защита',
                'description' => 'Эксперты в области кибербезопасности и защиты данных',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        DB::table('companies')->insert($companies);
    }
}