const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

export const formatCurrency = (value: number): string => currencyFormatter.format(value);
