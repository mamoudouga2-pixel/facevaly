import {
    Suspense,
    lazy,
    type ComponentType,
    type LazyExoticComponent,
    type ReactNode,
} from "react";

export function lazyPage<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
    return lazy(factory);
}

export function lazyNamedPage<T extends ComponentType<any>>(
    factory: () => Promise<Record<string, T>>,
    name: string
): LazyExoticComponent<T> {
    return lazy(() =>
        factory().then((module) => ({
            default: module[name],
        }))
    );
}

export function RouteFallback() {
    return (
        <div
            className="route-loading"
            aria-busy="true"
            aria-live="polite"
        >
            <div className="route-loading-spinner" />
        </div>
    );
}

export function Lazy({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<RouteFallback />}>
            {children}
        </Suspense>
    );
}
