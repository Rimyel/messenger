import type { JoinRequest } from './join-request'

export type CompanyRole = 'owner' | 'admin' | 'member'

export interface CompanyUser {
    id: number;
    name: string;
    email: string;
    role: CompanyRole;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Company {
    id: number;
    name: string;
    description: string;
    logo_url: string | null;
    created_at: string;
    updated_at: string;
    users?: CompanyUser[];
    join_requests?: JoinRequest[];
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