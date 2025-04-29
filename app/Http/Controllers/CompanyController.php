<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

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

        // Если нет поискового запроса - возвращаем только компанию пользователя (если она есть)
        $userCompany = $user->company;
        
        if ($userCompany) {
            // Если у пользователя есть компания, возвращаем только её
            return response()->json([
                'data' => [$userCompany],
                'total' => 1,
                'per_page' => 1,
                'current_page' => 1,
                'last_page' => 1
            ]);
        }

        // Если у пользователя нет компании и нет поискового запроса,
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

        // Проверяем, не состоит ли пользователь уже в компании
        if (auth()->user()->company_id !== null) {
            return response()->json(['message' => 'Вы уже состоите в компании'], 422);
        }

        $data = $validator->validated();

        // Обработка загрузки логотипа
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('company-logos', 'public');
            $data['logo_url'] = Storage::url($path);
        }

        $company = Company::create($data);

        // Устанавливаем company_id для владельца компании
        $user = auth()->user();
        $user->update(['company_id' => $company->id]);

        return response()->json($company, 201);
    }

    public function show(Company $company)
    {
        // Проверяем, принадлежит ли пользователь к этой компании
        if (auth()->user()->company_id !== $company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($company);
    }

    public function update(Request $request, Company $company)
    {
        // Проверяем, является ли пользователь первым участником (создателем) компании
        if ($company->id !== auth()->user()->company_id) {
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
        // Проверяем, является ли пользователь первым участником (создателем) компании
        if ($company->id !== auth()->user()->company_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Удаляем логотип, если он существует
        if ($company->logo_url) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $company->logo_url));
        }

        $company->delete();

        return response()->json(null, 204);
    }

    public function join(Company $company)
    {
        $user = auth()->user();
        
        // Проверяем, есть ли у пользователя уже компания
        if ($user->company_id !== null) {
            return response()->json(['message' => 'Вы уже являетесь участником другой компании'], 422);
        }

        // Присоединяем пользователя к компании
        $user->update(['company_id' => $company->id]);

        return response()->json(['message' => 'Вы успешно присоединились к компании']);
    }

    public function leave(Company $company)
    {
        $user = auth()->user();
        
        // Проверяем, принадлежит ли пользователь к этой компании
        if ($user->company_id !== $company->id) {
            return response()->json(['message' => 'Вы не являетесь участником этой компании'], 422);
        }

        // Проверяем, не является ли пользователь создателем компании
        if ($company->users()->orderBy('created_at')->first()->id === $user->id) {
            return response()->json(['message' => 'Вы не можете покинуть компанию, так как вы единственный владелец'], 422);
        }

        // Отсоединяем пользователя от компании
        $user->update(['company_id' => null]);

        return response()->json(['message' => 'Вы успешно покинули компанию']);
    }
}