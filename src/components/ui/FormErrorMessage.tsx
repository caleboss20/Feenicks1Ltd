/**
 * FormErrorMessage: a red box for a whole-form problem (server or network
 * failure, wrong code, etc.), shown above the form's main button.
 *
 * Renders nothing when `message` is empty. `role="alert"` makes screen
 * readers announce it as soon as it appears.
 *
 * For a problem with ONE field, use that field's own `error` prop instead.
 */
export function FormErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400"
    >
      {message}
    </p>
  );
}
