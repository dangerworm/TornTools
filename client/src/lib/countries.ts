/* Taken from https://wiki.torn.com/wiki/Travel */

export type TravelDestination = {
  city: string
  country: string
  countryDisplayName?: string
  flightTimesMinutes: { standard: number, airstrip: number, wlt: number, business: number }
  travelCost: number
}

export const travelDestinations: TravelDestination[] = [
  {
    city: 'Ciudad Juárez',
    country: 'Mexico',
    flightTimesMinutes: {
      standard: 26,
      airstrip: 18,
      wlt: 13,
      business: 8
    },
    travelCost: 6500
  },
  {
    city: 'George Town',
    country: 'Cayman Islands',
    countryDisplayName: 'Caymans',
    flightTimesMinutes: {
      standard: 35,
      airstrip: 25,
      wlt: 18,
      business: 11
    },
    travelCost: 10000
  },
  {
    city: 'Toronto',
    country: 'Canada',
    flightTimesMinutes: {
      standard: 41,
      airstrip: 29,
      wlt: 20,
      business: 12
    },
    travelCost: 9000
  },
  {
    city: 'Honolulu',
    country: 'Hawaii',
    flightTimesMinutes: {
      standard: 134,
      airstrip: 94,
      wlt: 67,
      business: 40
    },
    travelCost: 11000
  },
  {
    city: 'London',
    country: 'United Kingdom',
    countryDisplayName: 'UK',
    flightTimesMinutes: {
      standard: 159,
      airstrip: 111,
      wlt: 80,
      business: 48
    },
    travelCost: 18000
  },
  {
    city: 'Buenos Aires',
    country: 'Argentina',
    flightTimesMinutes: {
      standard: 167,
      airstrip: 117,
      wlt: 83,
      business: 50
    },
    travelCost: 21000
  },
  {
    city: 'Zurich',
    country: 'Switzerland',
    flightTimesMinutes: {
      standard: 175,
      airstrip: 123,
      wlt: 88,
      business: 53
    },
    travelCost: 27000
  },
  {
    city: 'Tokyo',
    country: 'Japan',
    flightTimesMinutes: {
      standard: 225,
      airstrip: 158,
      wlt: 113,
      business: 68
    },
    travelCost: 32000
  },
  {
    city: 'Beijing',
    country: 'China',
    flightTimesMinutes: {
      standard: 242,
      airstrip: 169,
      wlt: 121,
      business: 72
    },
    travelCost: 35000
  },
  {
    city: 'Dubai',
    country: 'UAE',
    flightTimesMinutes: {
      standard: 271,
      airstrip: 190,
      wlt: 135,
      business: 81
    },
    travelCost: 32000
  },
  {
    city: 'Johannesburg',
    country: 'South Africa',
    countryDisplayName: 'S. Africa',
    flightTimesMinutes: {
      standard: 297,
      airstrip: 208,
      wlt: 149,
      business: 89
    },
    travelCost: 40000
  },
]

export const travelDestinationsByCountry: Record<string, TravelDestination> = travelDestinations.reduce(
  (acc, dest) => {
    acc[dest.country] = dest
    return acc
  }, {} as Record<string, TravelDestination>,
)

export const prettyPrintFlightTime = (minutes: number) => {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hrs ? `${hrs}h ${mins}m` : `${mins} mins`
}