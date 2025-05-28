<?php

namespace App\Http\Controllers;

use App\Models\{
    Company,
    User
};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        // Если есть поисковый запрос - ищем по всем компаниям
        if ($request->has('query') && !empty($request->get('query'))) {
            $searchQuery = $request->get('query');
            return Company::where(function($q) use ($searchQuery) {
                $q->where('companies.id', 'like', "%{$searchQuery}%")
                  ->orWhere('companies.name', 'like', "%{$searchQuery}%");
            })->latest()->paginate($request->get('per_page', 5));
        }

        // Если нет поискового запроса - возвращаем компании пользователя
        $userCompanies = $user->companies()->with('users')->get();

        if ($userCompanies->isNotEmpty()) {
            return response()->json([
                'data' => $userCompanies,
                'total' => $userCompanies->count(),
                'per_page' => $userCompanies->count(),
                'current_page' => 1,
                'last_page' => 1
            ]);
        }

        // Если у пользователя нет компаний и нет поискового запроса,
        // возвращаем пустой результат
        return response()->json([
            'data' => [],
            'total' => 0,
            'per_page' => $request->get('per_page', 5),
            'current_page' => 1,
            'last_page' => 1
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'logo' => 'nullable|image|max:2048', // максимум 2MB
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Обработка загрузки логотипа
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('company-logos', 'public');
            $data['logo_url'] = Storage::url($path);
        }

        $company = Company::create($data);

        // Добавляем создателя как владельца компании
        $company->users()->attach(auth()->id(), ['role' => 'owner']);

        return response()->json($company, 201);
    }

    public function show(Company $company)
    {
        $user = auth()->user();
        
        // Проверяем, принадлежит ли пользователь к этой компании
        if (!$user->belongsToCompany($company)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($company->load('users'));
    }

    public function update(Request $request, Company $company)
    {
        $user = auth()->user();
        
        // Проверяем, может ли пользователь управлять компанией
        if (!$user->canManageCompany($company)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->hasFile('logo')) {
            // Удаляем старый логотип, если он существует
            if ($company->logo_url) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $company->logo_url));
            }

            $path = $request->file('logo')->store('company-logos', 'public');
            $data['logo_url'] = Storage::url($path);
        }

        $company->update($data);

        return response()->json($company);
    }

    public function destroy(Company $company)
    {
        $user = auth()->user();
        
        // Проверяем, является ли пользователь владельцем компании
        if (!$user->isOwnerOfCompany($company)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Удаляем логотип, если он существует
        if ($company->logo_url) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $company->logo_url));
        }

        $company->delete();

        return response()->json(null, 204);
    }

    /**
     * Присоединиться к компании
     */
    public function join(Company $company)
    {
        $user = auth()->user();

        // Проверяем, не состоит ли пользователь уже в этой компании
        if ($user->belongsToCompany($company)) {
            return response()->json(['message' => 'Вы уже являетесь участником этой компании'], 422);
        }

        // Добавляем пользователя в компанию как обычного участника
        $company->addUser($user, 'member');

        return response()->json(['message' => 'Вы успешно присоединились к компании']);
    }

    /**
     * Покинуть компанию
     */
    public function leave(Company $company)
    {
        $user = auth()->user();

        // Проверяем, состоит ли пользователь в компании
        if (!$user->belongsToCompany($company)) {
            return response()->json(['message' => 'Вы не являетесь участником этой компании'], 422);
        }

        // Проверяем, не является ли пользователь владельцем компании
        if ($user->isOwnerOfCompany($company)) {
            return response()->json(['message' => 'Владелец компании не может покинуть её'], 422);
        }

        // Удаляем пользователя из компании
        $company->removeUser($user);

        return response()->json(['message' => 'Вы успешно покинули компанию']);
    }

    /**
     * Получить список пользователей компании
     */
    public function users(Company $company)
    {
        $user = auth()->user();
        
        // Проверяем, принадлежит ли пользователь к этой компании
        if (!$user->belongsToCompany($company)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $users = $company->users()
            ->select('users.id', 'users.name', 'users.email', 'users.avatar', 'company_users.role', 'company_users.created_at')
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'role' => $user->role,
                    'created_at' => $user->created_at
                ];
            });

        return response()->json($users);
    }
}