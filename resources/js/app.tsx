import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import '../assets/styles/ichava.scss';

void createInertiaApp({
    title: (title) => (title ? `${title} - Ichava` : 'Ichava'),

    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx', { eager: true }) as Record<
            string,
            { default: React.ComponentType }
        >;

        const page = pages[`./pages/${name}.tsx`];

        if (!page) {
            throw new Error(`Unknown Inertia page component: ${name}`);
        }

        return page;
    },

    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },

    progress: {
        color: '#8b5cf6',
    },
});
