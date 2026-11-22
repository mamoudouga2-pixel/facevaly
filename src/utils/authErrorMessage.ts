export function authErrorMessage(
    exception: any,
    fallback = "Something went wrong."
): string {
    const data =
        exception?.response?.data
        || exception?.data;

    if (data?.errors && typeof data.errors === "object") {
        const first = Object.values(data.errors)
            .flat()
            .find(Boolean);

        if (first) {
            return String(first);
        }
    }

    return (
        data?.message
        || exception?.message
        || fallback
    );
}
