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
        $query = Company::query();

        if ($request->has('query')) {
            $searchQuery = $request->get('query');
            $query->where('name', 'like', "%{$searchQuery}%")
                ->orWhere('description', 'like', "%{$searchQuery}%");
        }

        $perPage = $request->get('per_page', 5);

        return $query->latest()->paginate($perPage);
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

        // Привязываем текущего пользователя к компании как владельца
        $company->users()->attach(auth()->id(), ['role' => 'owner']);

        return response()->json($company, 201);
    }

    public function show(Company $company)
    {
        // Проверяем, имеет ли пользователь доступ к компании
        if (!$company->users()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($company->load('users'));
    }

    public function update(Request $request, Company $company)
    {
        // Проверяем, является ли пользователь владельцем компании
        if (!$company->users()->where('user_id', auth()->id())->where('role', 'owner')->exists()) {
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
        // Проверяем, является ли пользователь владельцем компании
        if (!$company->users()->where('user_id', auth()->id())->where('role', 'owner')->exists()) {
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
     * Join a company as a member.
     */
    public function join(Company $company)
    {
        // Проверяем, не является ли пользователь уже участником компании
        if ($company->users()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Вы уже являетесь участником этой компании'], 422);
        }

        // Добавляем пользователя как участника
        $company->users()->attach(auth()->id(), ['role' => 'member']);

        return response()->json(['message' => 'Вы успешно присоединились к компании']);
    }
}