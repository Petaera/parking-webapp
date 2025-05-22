import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  orderBy,
} from "firebase/firestore"
import { db } from "./firebase"

export interface UserData {
  uid: string
  email: string | null
  displayName: string | null
  role: string
  assignedLots?: string[]
  createdAt?: any
}

// Types
export interface Lot {
  id: string
  active?: boolean
  name: string
  address: string
  capacity: number
  updatedAt?: Timestamp
}
export type VehicleStatus = "active" | "exited" | "fraud"

export interface EntryDetails {
  createdBy?: string
  createdByName?: string
  enteredCreatedBy: string
  enteredCreatedByName: string
  duration: number
  entryTime?: Timestamp
  enteredEntryTime: Timestamp
  enteredPlate: string
  enteredType: string
  exitTime?: Timestamp
  enteredExitTime: Timestamp
  fee: number
  image?: string
  paymentSlab: string
  plate?: string
  status: VehicleStatus
  type?: string
}


export type TimeRangeType = "upTo" | "eachAdditional" | "between"

export interface Slab {
  id: string
  title?: string
  rangeType: TimeRangeType
  hours: number
  hoursEnd?: number // For "between" range type
  fee: number
}

export interface VehicleType {
  id: string
  name: string
  slabs: Slab[]
}

// Users
//TODO: Cache this
export async function getManagers(): Promise<UserData[]> {
  const managersRef = collection(db, "users")
  const q = query(managersRef, where("role", "==", "manager"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      assignedLots: data.assignedLots || [],
    };
  }) as UserData[];
}

// Lots
const CACHE_KEY = 'parking_lots_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getLots(forceFetch: boolean = false):Promise<Lot[]> {
  const now = Date.now();
  
  // Check localStorage cache if forceFetch is false
  if (!forceFetch) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if ((now - timestamp) < CACHE_DURATION) {
        return data;
      }
    }
  }

  const lotsRef = collection(db, "lots");
  const q = query(lotsRef, where("active", "==", true));
  const snapshot = await getDocs(q);
  
  const lots = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Lot[];

  // Update localStorage cache
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data: lots,
    timestamp: now
  }));

  return lots;
}


export function getApiUrl(lotId: string) {
  const docRef = doc(db, "lots", lotId, "device", "access")
  return getDoc(docRef).then((docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data()
      return data.apiUrl
    }
    return null
  })
}
export function addLot(lotData: Omit<Lot, "id" | "updatedAt">) {
  const lotsRef = collection(db, "lots")
  const newLot = {
    name: lotData.name,
    address: lotData.address,
    capacity: lotData.capacity,
    active: true,
    updatedAt: serverTimestamp(),
  }
  return addDoc(lotsRef, newLot)
}

export function editLot(id: string, lotData: Partial<Lot>) {
  const docRef = doc(db, "lots", id)
  return updateDoc(docRef, {
    ...lotData,
    updatedAt: serverTimestamp(),
  })
}

// export function deleteLotDocument(id: string) {
//   const docRef = doc(db, "lots", id)
//   return deleteDoc(docRef)
// }

export async function deleteLot(id: string) {
  //soft delete lot
  const docRef = doc(db, "lots", id)
  return updateDoc(docRef, {
    active: false,
    updatedAt: serverTimestamp(),
  });
}

export function addLotToManager(lot: string, managerId: string) {
  const docRef = doc(db, "users", managerId)
  return updateDoc(docRef, {
    assignedLots: arrayUnion(lot),
  })

}

export function removeLotFromManager(lot: string, managerId: string) {
  const docRef = doc(db, "users", managerId)
  return updateDoc(docRef, {
    assignedLots: arrayRemove(lot),
  })
}

export async function getLotsByManager(managerId: string) {
  const lotsRef = collection(db, "lots")
  const q = query(lotsRef, where("managerIds", "array-contains", managerId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Lot[]
}

export async function getLot(id: string) {
  const docRef = doc(db, "lots", id)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Lot
  }
  return null
}

export async function saveVehicleDetails(lotId: string, data: EntryDetails): Promise<string> {
  const activeCollection = collection(db, "lots", lotId, "vehicles");
  const docRef = await addDoc(activeCollection, data);
  return docRef.id;
}

export async function updateVehicleDetails(lotId: string, vehicleId: string, data: Partial<EntryDetails>) {
  const docRef = doc(db, "lots", lotId, "vehicles", vehicleId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}


export async function updateLot(id: string, data: Partial<Lot>) {
  const docRef = doc(db, "lots", id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function getSlabByLotId(lotId: string) {
  const col = collection(db, "lots", lotId, "pricing")
  const q = query(col)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as VehicleType[]
  
}

// export async function getPaymentSlabs(lotId: string) {
//   const docRef = doc(db, "lots", lotId, "pricing")
//   const docSnap = await getDoc(docRef)
//   if (docSnap.exists()) {
//     return {
//       id: docSnap.id,
//       ...docSnap.data(),
//     } as Lot
//   }
//   return null
// }

export async function getDefaultSlab(){
  const col = collection(db, "pricing", "default", "slabs")
  const q = query(col)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as VehicleType[]
}



export async function setSlabByLotId(lotId: string, slabs: VehicleType[]) {
  const batch = writeBatch(db)
  // Clear existing slabs
  const col = collection(db, "lots", lotId, "pricing")
  const existingSlabs = await getDocs(col)
  existingSlabs.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })

  // Add new slabs
  slabs.forEach((slab) => {
    const slabRef = doc(col)
    batch.set(slabRef, slab)
  })

  await batch.commit()
}

export async function getVehicle(lotId: string, license: string): Promise<(EntryDetails&{id:string})[]> {
  const col = collection(db, "lots", lotId, "vehicles")
  console.log("license", license, lotId)
  const q = query(
    col,
    where("enteredPlate", "==", license),
    where("status", "==", "active"),
    orderBy("enteredEntryTime", "desc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (EntryDetails&{id:string})[]
}

export async function getVehichles(lotId: string): Promise<(EntryDetails&{id:string})[]> {
  const col = collection(db, "lots", lotId, "vehicles")
  const q = query(col)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (EntryDetails&{id:string})[]
}




