// Small helper functions used across the app.

// Joins class names, skipping empty ones: cn("a", false && "b", "c") -> "a c"
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Formats a number as money: formatCurrency(1234.5) -> "$1,234.50"
export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount,
  );
}
