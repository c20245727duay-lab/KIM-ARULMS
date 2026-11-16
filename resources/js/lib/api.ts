export type ApiValidationErrors = Record<string, string[]>;

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly validationErrors: ApiValidationErrors = {},
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export type PaginatedResponse<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function parseValidationErrors(value: unknown): ApiValidationErrors {
    if (!isRecord(value)) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(value).map(([field, messages]) => [
            field,
            (Array.isArray(messages) ? messages : [messages]).filter((message): message is string => typeof message === 'string'),
        ]),
    );
}

export async function apiRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');

    if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, { ...init, headers });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        const body = isRecord(payload) ? payload : {};
        throw new ApiError(
            typeof body.message === 'string' ? body.message : `Request failed with status ${response.status}.`,
            parseValidationErrors(body.errors),
        );
    }

    return payload as T;
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return 'An unexpected error occurred.';
}
