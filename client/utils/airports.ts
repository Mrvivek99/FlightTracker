export interface Airport {
  code: string;
  city: string;
  name: string;
  country: string;
}

export const popularAirports: Airport[] = [
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy International', country: 'USA' },
  { code: 'EWR', city: 'New York', name: 'Newark Liberty International', country: 'USA' },
  { code: 'LGA', city: 'New York', name: 'LaGuardia', country: 'USA' },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International', country: 'USA' },
  { code: 'ORD', city: 'Chicago', name: "O'Hare International", country: 'USA' },
  { code: 'DFW', city: 'Dallas', name: 'Dallas/Fort Worth International', country: 'USA' },
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco International', country: 'USA' },
  { code: 'LHR', city: 'London', name: 'Heathrow', country: 'UK' },
  { code: 'LGW', city: 'London', name: 'Gatwick', country: 'UK' },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle', country: 'France' },
  { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport', country: 'Germany' },
  { code: 'DXB', city: 'Dubai', name: 'Dubai International', country: 'UAE' },
  { code: 'HND', city: 'Tokyo', name: 'Haneda', country: 'Japan' },
  { code: 'NRT', city: 'Tokyo', name: 'Narita International', country: 'Japan' },
  { code: 'HKG', city: 'Hong Kong', name: 'Hong Kong International', country: 'Hong Kong' },
  { code: 'SIN', city: 'Singapore', name: 'Changi Airport', country: 'Singapore' },
  { code: 'AMS', city: 'Amsterdam', name: 'Amsterdam Airport Schiphol', country: 'Netherlands' },
  { code: 'MAD', city: 'Madrid', name: 'Adolfo Suárez Madrid–Barajas', country: 'Spain' },
  { code: 'BCN', city: 'Barcelona', name: 'Josep Tarradellas Barcelona-El Prat', country: 'Spain' },
  { code: 'YYZ', city: 'Toronto', name: 'Toronto Pearson International', country: 'Canada' },
  { code: 'SYD', city: 'Sydney', name: 'Sydney Airport', country: 'Australia' },
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International', country: 'India' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International', country: 'India' }
];
