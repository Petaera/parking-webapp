import { auth } from "./firebase";

export interface GetVehicleResponse {
    token: string;
    plate: string | null;
    type: string | null;
    image: string;
}

export interface SaveEntryPayload {
    duration: number;
    enteredPlate: string;
    enteredType: string;
    exitTime: string; // ISO formatted string
    fee: number;
    paymentSlab: string;
}

export interface SaveEntryResponse {
    status: string;
    record: string;
    print_success: boolean;
}

export interface SaveExitPayload {
    docId: string;
    feePaid: number;
    paymentMethod: string;
}

export interface SaveExitResponse {
    status: string;
    record: string;
}

// Updated: get the Firebase auth token using the auth instance from firebase.ts
async function getFirebaseToken(): Promise<string> {
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken();
    }
    return "";
}

export async function getVehicle(url: string, type: "entry" | "exit"): Promise<GetVehicleResponse> {
    console.log(url)
    const firebaseToken = await getFirebaseToken();
    const res = await fetch(`${url}/get_vehicle?type=${type}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${firebaseToken}`
        }
    });
    if (!res.ok) {
        throw new Error("Failed to get vehicle details");
    }
    return res.json();
}

export async function saveEntry(url: string, payload: SaveEntryPayload, vehicleToken?: string | null): Promise<SaveEntryResponse> {
    const firebaseToken = await getFirebaseToken();
    const res = await fetch(`${url}/entry`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({token:vehicleToken, ...payload})
    });
    if (!res.ok) {
        throw new Error("Failed to save entry details");
    }
    return res.json();
}

export async function saveExit(url: string, payload: SaveExitPayload, vehicleToken?: string | null): Promise<SaveExitResponse> {
    const firebaseToken = await getFirebaseToken();
    const res = await fetch(`${url}/exit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({token:vehicleToken, ...payload})
    });
    if (!res.ok) {
        throw new Error("Failed to save exit details");
    }
    return res.json();
}