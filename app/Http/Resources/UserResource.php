<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        // Если загружены компании, добавляем их в ресурс
        if ($this->relationLoaded('companies')) {
            $data['companies'] = $this->companies->map(function ($company) {
                return [
                    'id' => $company->id,
                    'name' => $company->name,
                    'logo_url' => $company->logo_url,
                    'role' => $company->pivot->role
                ];
            });
        }

        return $data;
    }
}