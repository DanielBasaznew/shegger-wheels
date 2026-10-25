import { initializeDemoData, getCarById, getCars, setCurrentSession, getCurrentSession } from '../lib/storage';
import { moderateCarListing } from '../lib/fleet';
import { signInAsDemoUser } from '../lib/auth';

// Setup fake localStorage for node environment
const storage = new Map();
global.window = {
  localStorage: {
    getItem: (k) => storage.get(k) || null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  },
  sessionStorage: {
    getItem: (k) => storage.get('sess_' + k) || null,
    setItem: (k, v) => storage.set('sess_' + k, String(v)),
    removeItem: (k) => storage.delete('sess_' + k),
  },
  dispatchEvent: () => true,
};

initializeDemoData(true);

console.log('1. Initial car_07 status:', getCarById('car_07')?.status);

// Sign in as Admin
const authAdmin = signInAsDemoUser('user_admin_01', 'admin');
console.log('2. Signed in as admin:', authAdmin.success, getCurrentSession()?.activeRole);

// Moderate car_07
const res = moderateCarListing('car_07', { userId: 'user_admin_01', role: 'admin' }, { action: 'approve' });
console.log('3. Approval result:', res.success, res.error, 'Car status:', res.car?.status);

console.log('4. Stored car_07 status after approval:', getCarById('car_07')?.status);

// Sign in as Dawit Tadesse (Owner)
const authOwner = signInAsDemoUser('user_owner_01', 'owner');
console.log('5. Signed in as Dawit Tadesse:', authOwner.success, getCurrentSession()?.activeRole);

const dawitCars = getCars().filter(c => c.ownerId === 'user_owner_01');
const elantra = dawitCars.find(c => c.id === 'car_07');
console.log('6. Dawit Elantra status:', elantra?.status);
