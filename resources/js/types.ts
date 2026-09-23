export interface AuthUser {
    id: number;
    name: string;
    email: string;
}

export interface FlashMessages {
    success?: string;
    error?: string;
}

export interface IchavaShared {
    prefix: string;
    perPage: number;
    defaultTheme: string;
    routes: {
        browser: string;
        stats: string;
        packages: string;
        favorites: string;
        collections: string;
        history: string;
        commands: string;
        settings: string;
        cache: {
            clear: string;
            rebuild: string;
        };
    };
}

export interface SharedProps {
    auth: AuthUser | null;
    flash: FlashMessages;
    preferences: Record<string, unknown>;
    ichava: IchavaShared;
    errors: Record<string, string>;
    [key: string]: unknown;
}
