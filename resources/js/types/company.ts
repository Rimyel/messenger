export interface Company {
    id: number;
    name: string;
    description: string;
    logo_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateCompanyDTO {
    name: string;
    description: string;
    logo?: File;
}

export interface CompanySearchParams {
    query?: string;
    page?: number;
    per_page?: number;
}

export interface PaginatedCompanies {
    data: Company[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}