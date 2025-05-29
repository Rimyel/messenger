# План тестирования мессенджера (PHPUnit)

## 1. Основные модули для тестирования

### 1.1 Аутентификация и авторизация
- Регистрация пользователей
- Аутентификация
- Управление сессиями
- Права доступа и политики

### 1.2 Управление чатами
- Создание чатов (приватные и групповые)
- Управление участниками
- Обмен сообщениями
- Обработка медиафайлов

### 1.3 Управление задачами
- Создание и назначение задач
- Отслеживание статуса
- Работа с дедлайнами
- Прикрепление файлов

### 1.4 Управление компаниями
- Создание компаний
- Управление пользователями
- Обработка заявок на вступление
- Роли и разрешения

## 2. Структура тестов

### 2.1 Unit тесты моделей
1. ChatTest
```php
class ChatTest extends TestCase
{
    /** @test */
    public function it_can_create_private_chat()
    /** @test */
    public function it_can_add_participants()
    /** @test */
    public function it_can_check_user_permissions()
}
```

2. TaskTest
```php
class TaskTest extends TestCase
{
    /** @test */
    public function it_can_create_task()
    /** @test */
    public function it_can_assign_users()
    /** @test */
    public function it_can_track_status()
}
```

3. CompanyTest
```php
class CompanyTest extends TestCase
{
    /** @test */
    public function it_can_create_company()
    /** @test */
    public function it_can_manage_users()
    /** @test */
    public function it_can_process_join_requests()
}
```

### 2.2 Unit тесты сервисов
1. ChatServiceTest
```php
class ChatServiceTest extends TestCase
{
    /** @test */
    public function it_can_send_message()
    /** @test */
    public function it_can_handle_media_files()
    /** @test */
    public function it_can_notify_participants()
}
```

2. TaskServiceTest
```php
class TaskServiceTest extends TestCase
{
    /** @test */
    public function it_can_create_task_with_files()
    /** @test */
    public function it_can_update_task_status()
    /** @test */
    public function it_can_generate_task_report()
}
```

### 2.3 Тесты контроллеров
1. ChatControllerTest
```php
class ChatControllerTest extends TestCase
{
    /** @test */
    public function it_can_list_user_chats()
    /** @test */
    public function it_can_create_group_chat()
    /** @test */
    public function it_can_manage_participants()
}
```

2. TaskControllerTest
```php
class TaskControllerTest extends TestCase
{
    /** @test */
    public function it_can_list_tasks()
    /** @test */
    public function it_can_assign_task()
    /** @test */
    public function it_can_update_task()
}
```

### 2.4 Тесты политик
1. ChatPolicyTest
```php
class ChatPolicyTest extends TestCase
{
    /** @test */
    public function user_can_view_chat()
    /** @test */
    public function user_can_manage_chat()
    /** @test */
    public function user_can_add_participants()
}
```

2. TaskPolicyTest
```php
class TaskPolicyTest extends TestCase
{
    /** @test */
    public function user_can_create_task()
    /** @test */
    public function user_can_assign_task()
    /** @test */
    public function user_can_view_task_reports()
}
```

## 3. Приоритеты тестирования

### Критический приоритет (P0)
1. Безопасность и авторизация
   - Проверка прав доступа в политиках
   - Валидация данных в контроллерах
   - Аутентификация пользователей

2. Бизнес-логика
   - Создание и управление чатами
   - Управление задачами
   - Управление компаниями

### Высокий приоритет (P1)
1. Работа с данными
   - Валидация входных данных
   - Обработка ошибок
   - Проверка возвращаемых значений

2. Интеграция компонентов
   - Взаимодействие сервисов
   - События и слушатели
   - Очереди и задачи

## 4. Настройка тестового окружения

### 4.1 Требования
- PHP 8.x
- SQLite для тестовой базы данных
- Настроенный phpunit.xml
- Фабрики для тестовых данных

### 4.2 База данных
- Использование SQLite in-memory
- Миграции для тестовой базы
- Фабрики моделей
- Сиды тестовых данных

### 4.3 Вспомогательные трейты
```php
trait RefreshDatabase
trait WithFaker
trait ActingAs
```

## 5. План реализации

### Этап 1: Подготовка (1 день)
- Настройка тестовой базы данных
- Создание фабрик моделей
- Настройка тестового окружения

### Этап 2: Базовые тесты (2-3 дня)
1. Тесты моделей
   - Отношения между моделями
   - Области видимости
   - Мутаторы и аксессоры

2. Тесты политик
   - Права доступа
   - Авторизация действий
   - Проверка ролей

### Этап 3: Бизнес-логика (3-4 дня)
1. Тесты сервисов
   - ChatService
   - TaskService
   - CompanyService

2. Тесты контроллеров
   - Валидация запросов
   - Обработка ответов
   - Обработка ошибок

## 6. Шаблоны тестов

### 6.1 Базовый тест модели
```php
use Tests\TestCase;
use App\Models\Chat;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Дополнительная настройка
    }

    /** @test */
    public function it_has_required_attributes()
    {
        $chat = Chat::factory()->create();
        
        $this->assertNotNull($chat->name);
        $this->assertNotNull($chat->type);
    }
}
```

### 6.2 Тест контроллера
```php
use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ChatControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function user_can_create_chat()
    {
        $this->actingAs($this->user)
            ->postJson('/api/chats', [
                'name' => 'Test Chat',
                'type' => 'private'
            ])
            ->assertStatus(201)
            ->assertJsonStructure(['id', 'name', 'type']);
    }
}