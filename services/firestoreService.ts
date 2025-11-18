
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, increment, setDoc, getDoc } from 'firebase/firestore';
import type { Company, Warehouse, Nomenclature, ProcessedInvoice, UserProfile, UserSubscription, PlanId } from '../types';

// Company Management
export const createCompany = async (company: Omit<Company, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'companies'), company);
  return docRef.id;
};

export const getCompaniesByOwner = async (ownerId: string): Promise<Company[]> => {
  const q = query(collection(db, 'companies'), where('ownerId', '==', ownerId));
  const querySnapshot = await getDocs(q);
  const companies: Company[] = [];
  querySnapshot.forEach((doc) => {
    companies.push({ id: doc.id, ...doc.data() } as Company);
  });
  return companies;
};

export const updateCompany = async (companyId: string, company: Partial<Company>): Promise<void> => {
  const companyRef = doc(db, 'companies', companyId);
  await updateDoc(companyRef, company);
};

export const deleteCompany = async (companyId: string): Promise<void> => {
  await deleteDoc(doc(db, 'companies', companyId));
};

// Warehouse Management
export const createWarehouse = async (warehouse: Omit<Warehouse, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'warehouses'), warehouse);
    return docRef.id;
};

export const getWarehousesByCompany = async (companyId: string): Promise<Warehouse[]> => {
    const q = query(collection(db, 'warehouses'), where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
    const warehouses: Warehouse[] = [];
    querySnapshot.forEach((doc) => {
        warehouses.push({ id: doc.id, ...doc.data() } as Warehouse);
    });
    return warehouses;
};

export const updateWarehouse = async (warehouseId: string, warehouse: Partial<Warehouse>): Promise<void> => {
    const warehouseRef = doc(db, 'warehouses', warehouseId);
    await updateDoc(warehouseRef, warehouse);
};

export const deleteWarehouse = async (warehouseId: string): Promise<void> => {
    await deleteDoc(doc(db, 'warehouses', warehouseId));
};

// Nomenclature Management
export const createNomenclature = async (nomenclature: Omit<Nomenclature, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'nomenclatures'), nomenclature);
    return docRef.id;
};

export const getNomenclaturesByCompany = async (companyId: string): Promise<Nomenclature[]> => {
    const q = query(collection(db, 'nomenclatures'), where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
    const nomenclatures: Nomenclature[] = [];
    querySnapshot.forEach((doc) => {
        nomenclatures.push({ id: doc.id, ...doc.data() } as Nomenclature);
    });
    return nomenclatures;
};

export const updateNomenclature = async (nomenclatureId: string, nomenclature: Partial<Nomenclature>): Promise<void> => {
    const nomenclatureRef = doc(db, 'nomenclatures', nomenclatureId);
    await updateDoc(nomenclatureRef, nomenclature);
};

export const deleteNomenclature = async (nomenclatureId: string): Promise<void> => {
    await deleteDoc(doc(db, 'nomenclatures', nomenclatureId));
};

// User Profile Management
export const createUserProfile = async (user: { uid: string, email: string | null, displayName: string | null, photoURL: string | null }): Promise<void> => {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        await setDoc(userRef, {
            id: user.uid,
            email: user.email,
            name: user.displayName,
            picture: user.photoURL,
            companyIds: [],
        });
        // Create a default subscription for the new user
        await createUserSubscription(user.uid, 'free');
    }
};


// User Subscription Management
export const createUserSubscription = async (userId: string, planId: PlanId): Promise<void> => {
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const newSubscription: UserSubscription = {
      planId,
      invoiceCount: 0,
      startDate: Date.now(),
      endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // Default to 30 days for now
    };
    await setDoc(subscriptionRef, newSubscription);
};

export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const docSnap = await getDoc(subscriptionRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserSubscription;
    }
    return null;
};

export const incrementInvoiceCount = async (userId: string): Promise<void> => {
    const subscriptionRef = doc(db, 'subscriptions', userId);
    await updateDoc(subscriptionRef, {
        invoiceCount: increment(1)
    });
};


// Processed Invoice Management
export const saveProcessedInvoice = async (invoice: Omit<ProcessedInvoice, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'processedInvoices'), invoice);
    // Increment the user's invoice count after saving an invoice
    await incrementInvoiceCount(invoice.userId);
    return docRef.id;
};

export const getProcessedInvoicesByUser = async (userId: string): Promise<ProcessedInvoice[]> => {
    const q = query(collection(db, 'processedInvoices'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const invoices: ProcessedInvoice[] = [];
    querySnapshot.forEach((doc) => {
        invoices.push({ id: doc.id, ...doc.data() } as ProcessedInvoice);
    });
    return invoices;
};
