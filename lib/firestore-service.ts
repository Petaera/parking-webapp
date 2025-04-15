import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  DocumentSnapshot,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "./firebase"
import { withTimeout } from "./utils"
import { get } from "http"

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

export interface ParkingSlip {
  id?: string
  lotId: string
  createdBy: string
  systemRecordedPlate: string
  enteredPlate: string
  vehicleType: string
  entryTime: Timestamp
  exitTime?: Timestamp
  duration?: number
  paymentSlab?: string
  feePaid?: number
  status: "active" | "exited" | "fraud"
  photoUrl?: string
  notes?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

interface VehicleDetails {
  plate: string
  vehicleType: string
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
export async function getLots() {

  const lotsRef = collection(db, "lots")
  // also check the active flag
  const q = query(lotsRef, where("active", "==", true))
  const snapshot = await getDocs(q)
  //TODO: add occupied
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Lot[]
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

export function deleteLotDocument(id: string) {
  const docRef = doc(db, "lots", id)
  return deleteDoc(docRef)
}

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

export async function getEntryVehicleDetails(lotId: string): Promise<VehicleDetails> {
  const deviceRef = collection(db, "lots", lotId, "device");
  //watch for entry doc
  const entryDocRef = doc(deviceRef, "entry");

  // Set up a real-time listener
  const ret = new Promise<VehicleDetails>((resolve, reject) => {
    //update entry doc
    updateDoc(entryDocRef, {
      scannedAt: serverTimestamp(),
    }).catch((e) => reject(e));

    const unsubscribe = onSnapshot(entryDocRef, (docSnap: DocumentSnapshot) => {
      if (docSnap.exists()) {
        const data: Record<string, any> = docSnap.data() as Record<string, any>;
        if (data.recordedLicense && !data.scannedAt  && !docSnap.metadata.fromCache) {
          unsubscribe(); // Stop listening after resolving
          resolve({
            plate: data.recordedLicense,
            vehicleType: data.recordedType
          });
        }
      } else {
        unsubscribe()
        reject(new Error("NO_DOC"));
      }
    });
  })

  return withTimeout<VehicleDetails>(ret, 7000);

}

export async function updateLot(id: string, data: Partial<Lot>) {
  const docRef = doc(db, "lots", id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}


// Parking Slips
export async function getActiveVehicles(lotId?: string) {
  const slipsRef = collection(db, "parking_slips")
  let q = query(slipsRef, where("status", "==", "active"), orderBy("entryTime", "desc"))

  if (lotId) {
    q = query(slipsRef, where("status", "==", "active"), where("lotId", "==", lotId), orderBy("entryTime", "desc"))
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ParkingSlip[]
}

export async function getParkingSlip(id: string) {
  const docRef = doc(db, "parking_slips", id)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ParkingSlip
  }
  return null
}

export async function createParkingSlip(
  slip: Omit<ParkingSlip, "id" | "createdAt" | "updatedAt">,
  vehicleImage?: File,
) {
  // Upload image if provided
  let photoUrl = undefined
  if (vehicleImage) {
    const storageRef = ref(storage, `vehicle_images/${Date.now()}_${vehicleImage.name}`)
    await uploadBytes(storageRef, vehicleImage)
    photoUrl = await getDownloadURL(storageRef)
  }

  const slipsRef = collection(db, "parking_slips")
  const newSlip = {
    ...slip,
    photoUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(slipsRef, newSlip)
  return {
    id: docRef.id,
    ...newSlip,
  }
}

export async function updateParkingSlip(id: string, data: Partial<ParkingSlip>) {
  const docRef = doc(db, "parking_slips", id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// Rate Configuration
export async function updatePricingForLot(lotId: string, pricingData: Record<string, any>) {
  const docRef = doc(db, "lots", lotId)
  await updateDoc(docRef, {
    pricing: pricingData,
    updatedAt: serverTimestamp(),
  })
}

// Reports
export async function getRevenueData(startDate: Date, endDate: Date, lotId?: string) {
  const slipsRef = collection(db, "parking_slips")
  let q = query(
    slipsRef,
    where("status", "==", "exited"),
    where("exitTime", ">=", Timestamp.fromDate(startDate)),
    where("exitTime", "<=", Timestamp.fromDate(endDate)),
    orderBy("exitTime", "asc"),
  )

  if (lotId) {
    q = query(
      slipsRef,
      where("status", "==", "exited"),
      where("lotId", "==", lotId),
      where("exitTime", ">=", Timestamp.fromDate(startDate)),
      where("exitTime", "<=", Timestamp.fromDate(endDate)),
      orderBy("exitTime", "asc"),
    )
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ParkingSlip[]
}

