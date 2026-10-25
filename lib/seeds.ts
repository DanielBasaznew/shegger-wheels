/**
 * Shegger Wheels — Demo Seed Data
 * 
 * Realistic, internally consistent demo data for Addis Ababa, Ethiopia.
 * Fictional identities and simulated operational data for frontend testing.
 */

import { User, Car, Booking, Review, Dispute, Announcement, Notification } from './types';

// ==========================================
// Seed Users
// ==========================================

export const SEED_USERS: User[] = [
  {
    id: 'user_admin_01',
    name: 'Yared Mulugeta (Admin)',
    email: 'admin@sheggerwheels.et',
    phone: '+251911000001',
    roles: ['admin'],
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    neighbourhood: 'Bole',
    createdAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'user_owner_01',
    name: 'Dawit Tadesse',
    email: 'dawit.tadesse@example.et',
    phone: '+251911223344',
    // Demonstrates coexisting roles: both owner and renter on one account
    roles: ['owner', 'renter'],
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    neighbourhood: 'Bole',
    createdAt: '2025-01-15T09:30:00Z',
  },
  {
    id: 'user_owner_02',
    name: 'Abebe Kebede',
    email: 'abebe.kebede@example.et',
    phone: '+251911556677',
    roles: ['owner'],
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    neighbourhood: 'Kazanchis',
    createdAt: '2025-01-20T11:15:00Z',
  },
  {
    id: 'user_renter_01',
    name: 'Sara Hailu',
    email: 'sara.hailu@example.et',
    phone: '+251922334455',
    roles: ['renter'],
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    neighbourhood: 'CMC',
    createdAt: '2025-02-01T14:20:00Z',
  },
  {
    id: 'user_suspended_01',
    name: 'Kibreab Tesfaye (Suspended)',
    email: 'kibreab.suspended@example.et',
    phone: '+251933445566',
    roles: ['renter'],
    status: 'suspended',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
    neighbourhood: 'Sarbet',
    createdAt: '2025-01-25T16:00:00Z',
  },
];

// ==========================================
// Seed Cars (Addis Ababa Neighbourhoods)
// ==========================================

export const SEED_CARS: Car[] = [
  {
    id: 'car_01',
    ownerId: 'user_owner_02', // Abebe Kebede
    make: 'Toyota',
    model: 'RAV4 Hybrid',
    year: 2022,
    transmission: 'Automatic',
    seats: 5,
    fuelType: 'Hybrid',
    city: 'Addis Ababa',
    neighbourhood: 'Bole',
    latitude: 8.9952,
    longitude: 38.7891,
    pricePerDay: 4500,
    photos: [
      '/cars/toyota-rav4-hybrid.jpg',
      '/cars/toyota-rav4-cockpit.jpg',
      '/cars/toyota-rav4-side.jpg',
      '/cars/toyota-rav4-rear.jpg',
    ],
    featuredImage: '/cars/toyota-rav4-hybrid.jpg',
    description: 'Immaculate condition Toyota RAV4 Hybrid with great fuel efficiency. Ideal for city commutes and family weekend outings around Addis Ababa and Bishoftu.',
    features: ['Air Conditioning', 'Bluetooth', 'Backup Camera', 'Apple CarPlay', 'Cruise Control'],
    status: 'approved',
    unavailableDates: ['2026-11-01', '2026-11-02'],
    createdAt: '2025-02-05T10:00:00Z',
  },
  {
    id: 'car_02',
    ownerId: 'user_owner_01', // Dawit Tadesse
    make: 'Hyundai',
    model: 'Tucson Executive',
    year: 2023,
    transmission: 'Automatic',
    seats: 5,
    fuelType: 'Petrol',
    city: 'Addis Ababa',
    neighbourhood: 'Kazanchis',
    latitude: 9.0185,
    longitude: 38.7667,
    pricePerDay: 5200,
    photos: [
      '/cars/hyundai-tucson.jpg',
    ],
    featuredImage: '/cars/hyundai-tucson.jpg',
    description: 'Modern executive SUV with leather interior, panoramic roof, and smooth suspension. Pick-up spot directly in Kazanchis near UNECA.',
    features: ['Panoramic Sunroof', 'Heated Seats', 'GPS Navigation', 'Parking Sensors', 'Leather Seats'],
    status: 'approved',
    unavailableDates: [],
    createdAt: '2025-02-06T11:30:00Z',
  },
  {
    id: 'car_03',
    ownerId: 'user_owner_02', // Abebe Kebede
    make: 'Suzuki',
    model: 'Dzire GLX',
    year: 2021,
    transmission: 'Manual',
    seats: 5,
    fuelType: 'Petrol',
    city: 'Addis Ababa',
    neighbourhood: 'Sarbet',
    latitude: 8.9892,
    longitude: 38.7429,
    pricePerDay: 2800,
    photos: [
      '/cars/suzuki-dzire.jpg',
    ],
    featuredImage: '/cars/suzuki-dzire.jpg',
    description: 'Extremely economical compact sedan. Agile in urban traffic, easy to park, and very reliable for everyday city errands in Sarbet and Mexico.',
    features: ['Air Conditioning', 'Power Steering', 'Bluetooth', 'Central Locking'],
    status: 'approved',
    unavailableDates: [],
    createdAt: '2025-02-10T14:00:00Z',
  },
  {
    id: 'car_04',
    ownerId: 'user_owner_01', // Dawit Tadesse
    make: 'Toyota',
    model: 'Land Cruiser Prado TX',
    year: 2020,
    transmission: 'Automatic',
    seats: 7,
    fuelType: 'Diesel',
    city: 'Addis Ababa',
    neighbourhood: 'Old Airport',
    latitude: 8.9781,
    longitude: 38.7354,
    pricePerDay: 9500,
    photos: [
      '/cars/toyota-landcruiser-prado.jpg',
    ],
    featuredImage: '/cars/toyota-landcruiser-prado.jpg',
    description: 'Rugged luxury 4x4 with 7 comfortable seats. High ground clearance, all-terrain capabilities, and roof rack ready for regional trips across Ethiopia.',
    features: ['Four-Wheel Drive', '7 Passenger Seating', 'Roof Rack', 'Tow Hook', 'Air Conditioning'],
    status: 'approved',
    unavailableDates: [],
    createdAt: '2025-02-12T09:00:00Z',
  },
  {
    id: 'car_05',
    ownerId: 'user_owner_01', // Dawit Tadesse
    make: 'Toyota',
    model: 'Corolla Prestige',
    year: 2020,
    transmission: 'Automatic',
    seats: 5,
    fuelType: 'Petrol',
    city: 'Addis Ababa',
    neighbourhood: 'CMC',
    latitude: 9.0234,
    longitude: 38.8251,
    pricePerDay: 3200,
    photos: [
      '/cars/toyota-corolla.jpg',
    ],
    featuredImage: '/cars/toyota-corolla.jpg',
    description: 'Dependable and smooth automatic Corolla. Clean interior, well-serviced, located convenient to CMC and Summit residential zones.',
    features: ['Air Conditioning', 'Keyless Entry', 'Bluetooth', 'USB Charger'],
    status: 'approved',
    unavailableDates: [],
    createdAt: '2025-02-15T15:20:00Z',
  },
  {
    id: 'car_06',
    ownerId: 'user_owner_02', // Abebe Kebede
    make: 'Volkswagen',
    model: 'ID.4 Pro EV',
    year: 2023,
    transmission: 'Automatic',
    seats: 5,
    fuelType: 'Electric',
    city: 'Addis Ababa',
    neighbourhood: 'Bole',
    latitude: 8.9981,
    longitude: 38.7845,
    pricePerDay: 6000,
    photos: [
      '/cars/volkswagen-id4.jpg',
    ],
    featuredImage: '/cars/volkswagen-id4.jpg',
    description: 'Fully electric zero-emission SUV with up to 480km range. Modern digital cockpit, wireless charging, and silent city driving.',
    features: ['100% Electric', 'Fast Charging Support', 'Lane Assist', 'Touchscreen Cockpit'],
    status: 'approved',
    unavailableDates: [],
    createdAt: '2025-02-18T16:45:00Z',
  },
  {
    id: 'car_07',
    ownerId: 'user_owner_01', // Dawit Tadesse
    make: 'Hyundai',
    model: 'Elantra GLS',
    year: 2022,
    transmission: 'Automatic',
    seats: 5,
    fuelType: 'Petrol',
    city: 'Addis Ababa',
    neighbourhood: 'Piassa',
    latitude: 9.0345,
    longitude: 38.7512,
    pricePerDay: 3800,
    photos: [
      '/cars/hyundai-elantra.jpg',
    ],
    featuredImage: '/cars/hyundai-elantra.jpg',
    description: 'Sharp-styled compact sedan with low mileage. Excellent sound system and responsive braking. Awaiting admin moderation review.',
    features: ['Air Conditioning', 'Bluetooth', 'Touchscreen', 'Reverse Sensors'],
    // Seeded with pending status for testing admin approval workflow
    status: 'pending',
    unavailableDates: [],
    createdAt: '2025-02-22T08:30:00Z',
  },
  {
    id: 'car_08',
    ownerId: 'user_owner_02', // Abebe Kebede
    make: 'Mitsubishi',
    model: 'Pajero Sport',
    year: 2019,
    transmission: 'Manual',
    seats: 7,
    fuelType: 'Diesel',
    city: 'Addis Ababa',
    neighbourhood: 'Lideta',
    latitude: 9.0112,
    longitude: 38.7398,
    pricePerDay: 7000,
    photos: [
      '/cars/mitsubishi-pajero.jpg',
    ],
    featuredImage: '/cars/mitsubishi-pajero.jpg',
    description: 'Robust 7-seater currently deactivated for scheduled brake service and scheduled maintenance.',
    features: ['4WD', '7 Seats', 'Heavy Duty Suspension'],
    // Seeded with inactive status for testing owner fleet filters
    status: 'inactive',
    unavailableDates: [],
    createdAt: '2025-01-05T12:00:00Z',
  },
  {
    id: 'car_09',
    ownerId: 'user_owner_02', // Abebe Kebede
    make: 'Mercedes-Benz',
    model: 'C200 Avantgarde',
    year: 2022,
    transmission: 'Automatic',
    seats: 5,
    fuelType: 'Petrol',
    city: 'Addis Ababa',
    neighbourhood: 'Old Airport',
    latitude: 8.9745,
    longitude: 38.7320,
    pricePerDay: 8200,
    photos: [
      '/cars/mercedes-c200.jpg',
    ],
    featuredImage: '/cars/mercedes-c200.jpg',
    description: 'Executive luxury sedan with AMG styling and premium leather interior. Ideal for diplomatic missions, VIP business guests, and upscale weddings in Addis Ababa.',
    features: ['Leather Interior', 'Sunroof', 'Burmester Sound System', 'Ambient Lighting', 'Cruise Control'],
    status: 'approved',
    unavailableDates: [],
    createdAt: '2025-02-24T10:00:00Z',
  },
  {
    id: 'car_10',
    ownerId: 'user_owner_01', // Dawit Tadesse
    make: 'Land Rover',
    model: 'Defender 110 SE',
    year: 2023,
    transmission: 'Automatic',
    seats: 7,
    fuelType: 'Diesel',
    city: 'Addis Ababa',
    neighbourhood: 'Bole',
    latitude: 8.9910,
    longitude: 38.7830,
    pricePerDay: 14000,
    photos: [
      '/cars/defender-110.jpg',
    ],
    featuredImage: '/cars/defender-110.jpg',
    description: 'Iconic modern expedition vehicle equipped with air suspension, 360-degree cameras, and terrain response. Unstoppable capability for countryside expeditions to Langano and Hawassa.',
    features: ['Air Suspension', 'All-Wheel Drive', 'Panoramic Roof', '360° Camera', 'Meridian Audio'],
    status: 'approved',
    unavailableDates: [],
    createdAt: '2025-02-25T11:00:00Z',
  },
  {
    id: 'car_11',
    ownerId: 'user_owner_02', // Abebe Kebede
    make: 'Toyota',
    model: 'Hilux Double Cab 4x4',
    year: 2021,
    transmission: 'Manual',
    seats: 5,
    fuelType: 'Diesel',
    city: 'Addis Ababa',
    neighbourhood: 'Bisrate Gabriel',
    latitude: 8.9812,
    longitude: 38.7295,
    pricePerDay: 6500,
    photos: [
      '/cars/toyota-hilux.jpg',
    ],
    featuredImage: '/cars/toyota-hilux.jpg',
    description: 'Renowned indestructible utility double cab with heavy-duty cargo bed and tow bar. Perfect for field operations, construction oversight, and rugged travel across Ethiopia.',
    features: ['4x4 High/Low Range', 'Heavy Duty Cargo Bed', 'Tow Bar', 'Reinforced Suspension', 'Bluetooth'],
    status: 'approved',
    unavailableDates: [],
    createdAt: '2025-02-26T09:30:00Z',
  },
  {
    id: 'car_12',
    ownerId: 'user_owner_01', // Dawit Tadesse
    make: 'BYD',
    model: 'Atto 3 Extended Range',
    year: 2024,
    transmission: 'Automatic',
    seats: 5,
    fuelType: 'Electric',
    city: 'Addis Ababa',
    neighbourhood: 'Kazanchis',
    latitude: 9.0205,
    longitude: 38.7690,
    pricePerDay: 5500,
    photos: [
      '/cars/byd-atto3.jpg',
    ],
    featuredImage: '/cars/byd-atto3.jpg',
    description: 'Ultra-modern electric crossover with rotating touchscreen display and ultra-safe Blade Battery. Zero emissions and complimentary charging cable for Addis urbanites.',
    features: ['Blade Battery', 'Rotating 15.6" Screen', 'Adaptive Cruise', 'Wireless Apple CarPlay', 'Panoramic Roof'],
    status: 'approved',
    unavailableDates: [],
    createdAt: '2025-02-27T14:15:00Z',
  },
  {
    id: 'car_13',
    ownerId: 'user_owner_02', // Abebe Kebede
    make: 'Peugeot',
    model: '3008 Allure',
    year: 2022,
    transmission: 'Automatic',
    seats: 5,
    fuelType: 'Petrol',
    city: 'Addis Ababa',
    neighbourhood: 'Gerji',
    latitude: 9.0020,
    longitude: 38.8050,
    pricePerDay: 4800,
    photos: [
      '/cars/peugeot-3008.jpg',
    ],
    featuredImage: '/cars/peugeot-3008.jpg',
    description: 'European styling and digital i-Cockpit. Refined fuel economy and compact dimensions, easy to navigate around Gerji, Imperial, and Bole airport expressway.',
    features: ['i-Cockpit Digital Dash', 'Lane Keeping Assist', 'Apple CarPlay', 'Blind Spot Monitor'],
    status: 'approved',
    unavailableDates: [],
    createdAt: '2025-02-28T16:00:00Z',
  },
  {
    id: 'car_14',
    ownerId: 'user_owner_01', // Dawit Tadesse
    make: 'Toyota',
    model: 'Land Cruiser 300 VXR',
    year: 2023,
    transmission: 'Automatic',
    seats: 7,
    fuelType: 'Petrol',
    city: 'Addis Ababa',
    neighbourhood: 'Bole',
    latitude: 8.9960,
    longitude: 38.7870,
    pricePerDay: 18500,
    photos: [
      '/cars/toyota-landcruiser-300.jpg',
    ],
    featuredImage: '/cars/toyota-landcruiser-300.jpg',
    description: 'Top-tier luxury flagship SUV with twin-turbo performance and VIP captain-style seating. Ideal for executive convoys, government delegates, and premium weddings.',
    features: ['Twin-Turbo V6', 'Rear Seat Entertainment', 'Ventilated Seats', 'Cool Box', 'JBL Premium Audio'],
    status: 'approved',
    unavailableDates: [],
    createdAt: '2025-03-01T08:00:00Z',
  },
];

// ==========================================
// Seed Bookings (Valid Lifecycle Transitions)
// ==========================================

export const SEED_BOOKINGS: Booking[] = [
  {
    id: 'booking_01',
    carId: 'car_01', // Toyota RAV4
    renterId: 'user_renter_01', // Sara Hailu
    ownerId: 'user_owner_02', // Abebe Kebede
    startDate: '2025-02-01',
    endDate: '2025-02-04',
    days: 3,
    pricePerDay: 4500,
    subtotal: 13500,
    fee: 1350,
    securityDeposit: 5000,
    total: 19850,
    paymentStatus: 'paid',
    paymentMethod: 'TeleBirr',
    paymentReference: 'TB-MOCK-771829',
    status: 'reviewed', // Completed and reviewed
    createdAt: '2025-01-28T10:00:00Z',
    updatedAt: '2025-02-05T12:00:00Z',
  },
  {
    id: 'booking_02',
    carId: 'car_02', // Hyundai Tucson
    renterId: 'user_renter_01', // Sara Hailu
    ownerId: 'user_owner_01', // Dawit Tadesse
    startDate: '2026-10-20',
    endDate: '2026-10-24',
    days: 4,
    pricePerDay: 5200,
    subtotal: 20800,
    fee: 2080,
    securityDeposit: 5000,
    total: 27880,
    paymentStatus: 'held_in_escrow',
    paymentMethod: 'TeleBirr',
    paymentReference: 'TB-MOCK-994812',
    status: 'in_progress', // Active ongoing rental, eligible for simulated tracking
    createdAt: '2026-10-18T14:30:00Z',
    updatedAt: '2026-10-20T08:00:00Z',
  },
  {
    id: 'booking_03',
    carId: 'car_03', // Suzuki Dzire
    renterId: 'user_renter_01', // Sara Hailu
    ownerId: 'user_owner_02', // Abebe Kebede
    startDate: '2026-11-05',
    endDate: '2026-11-08',
    days: 3,
    pricePerDay: 2800,
    subtotal: 8400,
    fee: 840,
    securityDeposit: 3000,
    total: 12240,
    paymentStatus: 'held_in_escrow',
    paymentMethod: 'TeleBirr',
    paymentReference: 'TB-MOCK-330192',
    status: 'confirmed', // Confirmed upcoming rental
    createdAt: '2026-10-19T16:00:00Z',
    updatedAt: '2026-10-19T17:15:00Z',
  },
  {
    id: 'booking_04',
    carId: 'car_04', // Toyota Land Cruiser Prado
    renterId: 'user_renter_01', // Sara Hailu
    ownerId: 'user_owner_01', // Dawit Tadesse
    startDate: '2026-11-15',
    endDate: '2026-11-17',
    days: 2,
    pricePerDay: 9500,
    subtotal: 19000,
    fee: 1900,
    securityDeposit: 10000,
    total: 30900,
    paymentStatus: 'held_in_escrow',
    paymentMethod: 'TeleBirr',
    paymentReference: 'TB-MOCK-661094',
    status: 'requested', // Newly requested, awaiting Dawit's approval
    createdAt: '2026-10-21T07:45:00Z',
    updatedAt: '2026-10-21T07:45:00Z',
  },
  {
    id: 'booking_05',
    carId: 'car_05', // Toyota Corolla
    renterId: 'user_renter_01', // Sara Hailu
    ownerId: 'user_owner_01', // Dawit Tadesse
    startDate: '2025-01-15',
    endDate: '2025-01-16',
    days: 1,
    pricePerDay: 3200,
    subtotal: 3200,
    fee: 320,
    total: 3520,
    paymentStatus: 'refunded',
    status: 'cancelled', // Cancelled rental demonstration
    cancellationReason: 'Renter trip schedule changed',
    createdAt: '2025-01-10T11:00:00Z',
    updatedAt: '2025-01-11T09:30:00Z',
  },
  {
    id: 'booking_06',
    carId: 'car_01', // Toyota RAV4
    renterId: 'user_owner_01', // Dawit acting as renter
    ownerId: 'user_owner_02', // Abebe Kebede
    startDate: '2025-02-10',
    endDate: '2025-02-12',
    days: 2,
    pricePerDay: 4500,
    subtotal: 9000,
    fee: 900,
    securityDeposit: 5000,
    total: 14900,
    paymentStatus: 'held_in_escrow',
    status: 'disputed', // Under dispute for admin resolution testing
    createdAt: '2025-02-08T14:00:00Z',
    updatedAt: '2025-02-13T10:00:00Z',
  },
];

// ==========================================
// Seed Reviews
// ==========================================

export const SEED_REVIEWS: Review[] = [
  {
    id: 'review_01',
    bookingId: 'booking_01',
    carId: 'car_01',
    renterId: 'user_renter_01', // Sara Hailu
    ownerId: 'user_owner_02', // Abebe Kebede
    rating: 5,
    comment: 'The RAV4 was immaculate and very fuel-efficient. Host Abebe was punctual for key handoff near Bole Medhanialem. Smooth, transparent experience!',
    ownerReply: 'Thank you Sara! You took great care of the vehicle. You are welcome back anytime.',
    createdAt: '2025-02-05T12:30:00Z',
  },
  {
    id: 'review_02',
    bookingId: 'booking_historic_00',
    carId: 'car_02',
    renterId: 'user_renter_01',
    ownerId: 'user_owner_01',
    rating: 5,
    comment: 'Comfortable executive ride for diplomatic meetings around Kazanchis. Clean interior and clear communication.',
    createdAt: '2025-01-30T16:00:00Z',
  },
];

// ==========================================
// Seed Disputes
// ==========================================

export const SEED_DISPUTES: Dispute[] = [
  {
    id: 'dispute_01',
    bookingId: 'booking_06',
    openedBy: 'user_owner_01', // Dawit (renter in this booking)
    openedByRole: 'renter',
    reason: 'Security Deposit Delay',
    description: 'Vehicle was returned without any scratches on Feb 12, but security deposit release has not yet been unlocked by the host.',
    status: 'open',
    createdAt: '2025-02-13T10:00:00Z',
  },
];

// ==========================================
// Seed Announcements
// ==========================================

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'announcement_01',
    title: 'Welcome to the Shegger Wheels Addis Ababa Prototype',
    message: 'Shegger Wheels is a frontend capstone project demonstrating peer-to-peer car sharing. All bookings, payments, and tracking are simulated using local browser storage.',
    active: true,
    category: 'info',
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user_admin_01',
  },
  {
    id: 'announcement_02',
    title: 'TeleBirr Escrow Simulation Active',
    message: 'Mock TeleBirr smart escrow verification is live across Bole, Kazanchis, Sarbet, Old Airport, and CMC hubs.',
    active: true,
    category: 'feature',
    createdAt: '2025-02-01T00:00:00Z',
    createdBy: 'user_admin_01',
  },
];

// ==========================================
// Seed Notifications
// ==========================================

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_01',
    recipientId: 'user_renter_01', // Sara Hailu
    type: 'booking_confirmed',
    title: 'Reservation Confirmed!',
    message: 'Your booking for the 2022 Hyundai Tucson has been approved by Dawit Tadesse. Digital QR pass is ready.',
    link: '/bookings/booking_01',
    read: false,
    bookingId: 'booking_01',
    carId: 'car_01',
    createdAt: '2025-02-18T10:30:00Z',
  },
  {
    id: 'notif_02',
    recipientId: 'user_renter_01', // Sara Hailu
    type: 'trip_completed',
    title: 'Trip Completed — Leave a Review',
    message: 'Your rental trip for the 2023 Suzuki Dzire is complete. Share your feedback and star rating!',
    link: '/bookings/booking_02',
    read: true,
    bookingId: 'booking_02',
    carId: 'car_02',
    createdAt: '2025-02-05T18:05:00Z',
  },
  {
    id: 'notif_03',
    recipientId: 'user_owner_01', // Dawit Tadesse
    type: 'booking_requested',
    title: 'New Booking Request',
    message: 'New reservation request received for your 2023 Toyota RAV4 from CMC hub.',
    link: '/dashboard/host',
    read: false,
    bookingId: 'booking_03',
    carId: 'car_03',
    createdAt: '2025-02-19T09:15:00Z',
  },
  {
    id: 'notif_04',
    recipientId: 'user_owner_01', // Dawit Tadesse
    type: 'trip_completed',
    title: 'TeleBirr Payout Disbursed',
    message: 'Simulated payout of 22,500 ETB has been credited to your account for completed booking #booking_01.',
    link: '/dashboard/host',
    read: true,
    bookingId: 'booking_01',
    carId: 'car_01',
    createdAt: '2025-02-14T19:00:00Z',
  },
  {
    id: 'notif_05',
    recipientId: 'user_owner_02', // Abebe Kebede
    type: 'review_received',
    title: 'New 5★ Review Received',
    message: 'A guest left an exceptional 5-star review on your 2023 Mercedes-Benz E-Class. Post your host response!',
    link: '/dashboard/host',
    read: false,
    carId: 'car_04',
    createdAt: '2025-01-30T16:05:00Z',
  },
];
