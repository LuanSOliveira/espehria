import { ICurrency } from '@/shared/interfaces';

const NOT_INFORMED = 'Não informado';

export const formatPriceWithCurrency = (
  price?: number | null,
  currency?: ICurrency | null,
): string => {
  if (price != null && currency) {
    return `${price} ${currency.abbreviation} - ${currency.name}`;
  }

  if (price != null) {
    return `${price}`;
  }

  if (currency) {
    return `${currency.abbreviation} - ${currency.name}`;
  }

  return NOT_INFORMED;
};
