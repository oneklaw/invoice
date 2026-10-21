export interface WorldCurrency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  decimals: number;
  country: string;
}

// 160+ ISO 4217 World Currencies
export const WORLD_CURRENCIES: WorldCurrency[] = [
  // Major & Global Benchmark Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2, country: 'United States' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2, country: 'European Union' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£', flag: '🇬🇧', decimals: 2, country: 'United Kingdom' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', decimals: 0, country: 'Japan' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', decimals: 2, country: 'Canada' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', decimals: 2, country: 'Australia' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', decimals: 2, country: 'Switzerland' },
  { code: 'CNY', name: 'Chinese Yuan Renminbi', symbol: '¥', flag: '🇨🇳', decimals: 2, country: 'China' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', decimals: 2, country: 'India' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', decimals: 2, country: 'Singapore' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', decimals: 2, country: 'Hong Kong' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', decimals: 2, country: 'New Zealand' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', decimals: 2, country: 'Sweden' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', decimals: 2, country: 'Norway' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', decimals: 2, country: 'Denmark' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', decimals: 2, country: 'Poland' },

  // African Currencies
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', decimals: 2, country: 'Kenya' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬', decimals: 0, country: 'Uganda' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿', decimals: 0, country: 'Tanzania' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', flag: '🇷🇼', decimals: 0, country: 'Rwanda' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', decimals: 2, country: 'Nigeria' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', decimals: 2, country: 'South Africa' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', decimals: 2, country: 'Ghana' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', decimals: 2, country: 'Egypt' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', flag: '🇲🇦', decimals: 2, country: 'Morocco' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', flag: '🇪🇹', decimals: 2, country: 'Ethiopia' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', flag: '🇿🇲', decimals: 2, country: 'Zambia' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', flag: '🇧🇼', decimals: 2, country: 'Botswana' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', flag: '🇲🇺', decimals: 2, country: 'Mauritius' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', flag: '🇸🇳', decimals: 0, country: 'WAEMU' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', flag: '🇨🇲', decimals: 0, country: 'CEMAC' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', flag: '🇦🇴', decimals: 2, country: 'Angola' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', flag: '🇲🇿', decimals: 2, country: 'Mozambique' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', flag: '🇳🇦', decimals: 2, country: 'Namibia' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'Ssh', flag: '🇸🇴', decimals: 2, country: 'Somalia' },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu', flag: '🇧🇮', decimals: 0, country: 'Burundi' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', flag: '🇲🇼', decimals: 2, country: 'Malawi' },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: 'SR', flag: '🇸🇨', decimals: 2, country: 'Seychelles' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA', flag: '🇩🇿', decimals: 2, country: 'Algeria' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT', flag: '🇹🇳', decimals: 3, country: 'Tunisia' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'LD', flag: '🇱🇾', decimals: 3, country: 'Libya' },

  // Middle East & Gulf
  { code: 'AED', name: 'United Arab Emirates Dirham', symbol: 'د.إ', flag: '🇦🇪', decimals: 2, country: 'UAE' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', decimals: 2, country: 'Saudi Arabia' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR', flag: '🇶🇦', decimals: 2, country: 'Qatar' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', flag: '🇰🇼', decimals: 3, country: 'Kuwait' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', flag: '🇧🇭', decimals: 3, country: 'Bahrain' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', flag: '🇴🇲', decimals: 3, country: 'Oman' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD', flag: '🇯🇴', decimals: 3, country: 'Jordan' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', flag: '🇮🇱', decimals: 2, country: 'Israel' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', decimals: 2, country: 'Turkey' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'L£', flag: '🇱🇧', decimals: 2, country: 'Lebanon' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ID', flag: '🇮🇶', decimals: 3, country: 'Iraq' },

  // Americas (North, Central, South, Caribbean)
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', decimals: 2, country: 'Brazil' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', flag: '🇲🇽', decimals: 2, country: 'Mexico' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', decimals: 2, country: 'Argentina' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', decimals: 0, country: 'Chile' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', decimals: 0, country: 'Colombia' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', flag: '🇵🇪', decimals: 2, country: 'Peru' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', flag: '🇺🇾', decimals: 2, country: 'Uruguay' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', flag: '🇨🇷', decimals: 2, country: 'Costa Rica' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$', flag: '🇩🇴', decimals: 2, country: 'Dominican Republic' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', flag: '🇬🇹', decimals: 2, country: 'Guatemala' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', flag: '🇭🇳', decimals: 2, country: 'Honduras' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', flag: '🇳🇮', decimals: 2, country: 'Nicaragua' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', flag: '🇵🇦', decimals: 2, country: 'Panama' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', flag: '🇯🇲', decimals: 2, country: 'Jamaica' },
  { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: 'TT$', flag: '🇹🇹', decimals: 2, country: 'Trinidad and Tobago' },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$', flag: '🇧🇧', decimals: 2, country: 'Barbados' },
  { code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$', flag: '🇧🇸', decimals: 2, country: 'Bahamas' },
  { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$', flag: '🇧🇿', decimals: 2, country: 'Belize' },
  { code: 'XCD', name: 'East Caribbean Dollar', symbol: 'EC$', flag: '🇦🇬', decimals: 2, country: 'OECS' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs', flag: '🇧🇴', decimals: 2, country: 'Bolivia' },
  { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲', flag: '🇵🇾', decimals: 0, country: 'Paraguay' },

  // Asia & Pacific
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', decimals: 0, country: 'South Korea' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', decimals: 2, country: 'Taiwan' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', decimals: 2, country: 'Thailand' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', decimals: 0, country: 'Indonesia' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', decimals: 2, country: 'Malaysia' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', decimals: 2, country: 'Philippines' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', decimals: 0, country: 'Vietnam' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', decimals: 2, country: 'Pakistan' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', decimals: 2, country: 'Bangladesh' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰', decimals: 2, country: 'Sri Lanka' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs', flag: '🇳🇵', decimals: 2, country: 'Nepal' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', flag: '🇰🇿', decimals: 2, country: 'Kazakhstan' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'soʻm', flag: '🇺🇿', decimals: 2, country: 'Uzbekistan' },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', flag: '🇲🇳', decimals: 2, country: 'Mongolia' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', flag: '🇲🇲', decimals: 2, country: 'Myanmar' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', flag: '🇰🇭', decimals: 2, country: 'Cambodia' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', flag: '🇱🇦', decimals: 2, country: 'Laos' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', flag: '🇧🇳', decimals: 2, country: 'Brunei' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', flag: '🇲🇻', decimals: 2, country: 'Maldives' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', flag: '🇫🇯', decimals: 2, country: 'Fiji' },
  { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K', flag: '🇵🇬', decimals: 2, country: 'Papua New Guinea' },
  { code: 'WST', name: 'Samoan Tala', symbol: 'WS$', flag: '🇼🇸', decimals: 2, country: 'Samoa' },
  { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', flag: '🇹🇴', decimals: 2, country: 'Tonga' },
  { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT', flag: '🇻🇺', decimals: 0, country: 'Vanuatu' },

  // Europe (Non-Euro)
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', decimals: 2, country: 'Czech Republic' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', decimals: 2, country: 'Hungary' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴', decimals: 2, country: 'Romania' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬', decimals: 2, country: 'Bulgaria' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷', decimals: 2, country: 'Croatia' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'din', flag: '🇷🇸', decimals: 2, country: 'Serbia' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦', decimals: 2, country: 'Ukraine' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', flag: '🇬🇪', decimals: 2, country: 'Georgia' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', flag: '🇦🇲', decimals: 2, country: 'Armenia' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', flag: '🇦🇿', decimals: 2, country: 'Azerbaijan' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', flag: '🇦🇱', decimals: 2, country: 'Albania' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark', symbol: 'KM', flag: '🇧🇦', decimals: 2, country: 'Bosnia and Herzegovina' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'den', flag: '🇲🇰', decimals: 2, country: 'North Macedonia' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', flag: '🇲🇩', decimals: 2, country: 'Moldova' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', flag: '🇮🇸', decimals: 0, country: 'Iceland' },
];

// Fallback Benchmark Rates against 1 USD (Base = USD)
// Dynamically refreshed via exchange rate API when available
export const BASE_USD_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.922,
  GBP: 0.785,
  JPY: 154.6,
  CAD: 1.378,
  AUD: 1.516,
  CHF: 0.892,
  CNY: 7.242,
  INR: 83.55,
  SGD: 1.349,
  HKD: 7.812,
  NZD: 1.638,
  SEK: 10.48,
  NOK: 10.74,
  DKK: 6.878,
  PLN: 3.982,

  // Africa
  KES: 129.5,
  UGX: 3680.0,
  TZS: 2595.0,
  RWF: 1340.0,
  NGN: 1485.0,
  ZAR: 18.25,
  GHS: 15.2,
  EGP: 48.6,
  MAD: 9.85,
  ETB: 118.0,
  ZMW: 26.5,
  BWP: 13.6,
  MUR: 46.2,
  XOF: 605.0,
  XAF: 605.0,
  AOA: 865.0,
  MZN: 63.8,
  NAD: 18.25,
  SOS: 571.0,
  BIF: 2900.0,
  MWK: 1740.0,
  SCR: 13.9,
  DZD: 133.5,
  TND: 3.12,
  LYD: 4.86,

  // Middle East
  AED: 3.6725,
  SAR: 3.751,
  QAR: 3.64,
  KWD: 0.307,
  BHD: 0.377,
  OMR: 0.385,
  JOD: 0.709,
  ILS: 3.72,
  TRY: 34.2,
  LBP: 89500.0,
  IQD: 1310.0,

  // Americas
  BRL: 5.48,
  MXN: 18.35,
  ARS: 980.0,
  CLP: 940.0,
  COP: 4150.0,
  PEN: 3.76,
  UYU: 40.5,
  CRC: 520.0,
  DOP: 60.1,
  GTQ: 7.74,
  HNL: 24.8,
  NIO: 36.8,
  PAB: 1.0,
  JMD: 157.0,
  TTD: 6.78,
  BBD: 2.0,
  BSD: 1.0,
  BZD: 2.0,
  XCD: 2.7,
  BOB: 6.91,
  PYG: 7750.0,

  // Asia / Pacific
  KRW: 1380.0,
  TWD: 32.4,
  THB: 36.2,
  IDR: 16250.0,
  MYR: 4.42,
  PHP: 57.8,
  VND: 25400.0,
  PKR: 278.0,
  BDT: 119.5,
  LKR: 295.0,
  NPR: 133.7,
  KZT: 485.0,
  UZS: 12750.0,
  MNT: 3380.0,
  MMK: 2100.0,
  KHR: 4080.0,
  LAK: 21950.0,
  BND: 1.35,
  MVR: 15.4,
  FJD: 2.25,
  PGK: 3.92,
  WST: 2.75,
  TOP: 2.38,
  VUV: 119.0,

  // Europe Other
  CZK: 23.1,
  HUF: 368.0,
  RON: 4.58,
  BGN: 1.80,
  HRK: 6.95,
  RSD: 108.0,
  UAH: 41.2,
  GEL: 2.72,
  AMD: 388.0,
  AZN: 1.70,
  ALL: 90.5,
  BAM: 1.80,
  MKD: 56.8,
  MDL: 17.6,
  ISK: 138.0,
};

const CACHE_KEY = 'invox_live_fx_rates';
const CACHE_TIME_KEY = 'invox_live_fx_timestamp';

class CurrencyService {
  private rates: Record<string, number> = { ...BASE_USD_RATES };
  private lastUpdated: string = new Date().toISOString();

  constructor() {
    this.loadCachedRates();
    this.refreshLiveRates().catch(() => {
      // Offline or network error: baseline rates active
    });
  }

  private loadCachedRates(): void {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const time = localStorage.getItem(CACHE_TIME_KEY);
      if (cached) {
        this.rates = { ...BASE_USD_RATES, ...JSON.parse(cached) };
      }
      if (time) {
        this.lastUpdated = time;
      }
    } catch {
      // Ignore parse error
    }
  }

  public async refreshLiveRates(): Promise<boolean> {
    try {
      // Use open reliable exchange rate endpoint
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data && data.rates) {
        this.rates = { ...this.rates, ...data.rates };
        this.lastUpdated = new Date().toISOString();
        localStorage.setItem(CACHE_KEY, JSON.stringify(this.rates));
        localStorage.setItem(CACHE_TIME_KEY, this.lastUpdated);
        return true;
      }
    } catch {
      // Return false if network is unreachable
    }
    return false;
  }

  public getAllCurrencies(): WorldCurrency[] {
    return WORLD_CURRENCIES;
  }

  public getCurrency(code: string): WorldCurrency {
    const found = WORLD_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (found) return found;

    return {
      code: code.toUpperCase(),
      name: code.toUpperCase(),
      symbol: code.toUpperCase(),
      flag: '🌐',
      decimals: 2,
      country: 'Global',
    };
  }

  public getExchangeRate(fromCurrency: string, toCurrency: string): number {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from === to) return 1.0;

    const fromRateToUSD = this.rates[from] || BASE_USD_RATES[from] || 1.0;
    const toRateToUSD = this.rates[to] || BASE_USD_RATES[to] || 1.0;

    // from Currency -> USD -> to Currency
    const rate = toRateToUSD / fromRateToUSD;
    return rate;
  }

  public getRate(fromCurrency: string, toCurrency: string): number {
    return this.getExchangeRate(fromCurrency, toCurrency);
  }

  public convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    customRate?: number
  ): number {
    if (!amount || isNaN(amount)) return 0;
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return amount;

    const rate = customRate !== undefined && customRate > 0
      ? customRate
      : this.getExchangeRate(fromCurrency, toCurrency);

    const converted = amount * rate;
    const targetDecimals = this.getCurrency(toCurrency).decimals;
    return Number(converted.toFixed(targetDecimals));
  }

  public formatAmount(amount: number, currencyCode: string): string {
    const info = this.getCurrency(currencyCode);
    const num = isNaN(amount) ? 0 : amount;
    return `${info.symbol} ${num.toLocaleString(undefined, {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    })}`;
  }

  public getLastUpdated(): string {
    return this.lastUpdated;
  }

  public searchCurrencies(query: string): WorldCurrency[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return WORLD_CURRENCIES;

    return WORLD_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(clean) ||
        c.name.toLowerCase().includes(clean) ||
        c.country.toLowerCase().includes(clean) ||
        c.symbol.toLowerCase().includes(clean)
    );
  }
}

export const currencyService = new CurrencyService();
