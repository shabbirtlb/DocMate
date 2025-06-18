export interface Country {
  code: string;
  name: string;
  flag: string;
  documents: string[];
}

export const countries: Country[] = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    documents: [
      'Aadhaar Card',
      'PAN Card',
      'Passport',
      'Driving License',
      'Voter ID',
      'Ration Card',
      'Education Certificates',
      'Insurance Documents',
      'Bank Statements'
    ]
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    documents: [
      'Social Security Card',
      'Passport',
      'Driver\'s License',
      'Birth Certificate',
      'State ID',
      'Tax Documents',
      'Insurance Cards',
      'Education Transcripts',
      'Immigration Documents'
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    documents: [
      'Passport',
      'Driving Licence',
      'National Insurance Number',
      'Birth Certificate',
      'NHS Card',
      'Council Tax Documents',
      'Bank Statements',
      'University Certificates',
      'Tenancy Agreement'
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    documents: [
      'Passport',
      'Driver\'s License',
      'Social Insurance Number',
      'Birth Certificate',
      'Health Card',
      'Tax Documents',
      'Immigration Documents',
      'Education Certificates',
      'Employment Records'
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    documents: [
      'Passport',
      'Driver\'s License',
      'Tax File Number',
      'Birth Certificate',
      'Medicare Card',
      'Centrelink Documents',
      'Education Certificates',
      'Bank Statements',
      'Immigration Documents'
    ]
  }
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find(country => country.code === code);
}

export function getSelectedCountry(): Country {
  // This will be replaced by async version from settings
  return countries[0]; // Default to India
}

export function setSelectedCountry(countryCode: string): void {
  // This will be replaced by async version from settings
  console.log('Setting country to:', countryCode);
}