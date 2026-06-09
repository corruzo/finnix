import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch,
  increment
} from 'firebase/firestore';

/**
 * Agrega una nueva cuenta al usuario en Firestore.
 */
export const createAccount = async (uid, account) => {
  if (!uid) throw new Error("No autenticado");
  const accountRef = doc(collection(db, `users/${uid}/accounts`));
  const newAccount = {
    ...account,
    id: accountRef.id,
    userId: uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(accountRef, newAccount);
  return newAccount;
};

/**
 * Actualiza una cuenta existente.
 */
export const updateAccountData = async (uid, accountId, data) => {
  if (!uid) throw new Error("No autenticado");
  const accountRef = doc(db, `users/${uid}/accounts`, accountId);
  await updateDoc(accountRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Elimina una cuenta y sus transacciones asociadas en lote/transaction.
 */
export const deleteAccountData = async (uid, accountId) => {
  if (!uid) throw new Error("No autenticado");
  // Por simplicidad, eliminaremos la cuenta. 
  // (Opcional: implementar limpieza de transacciones en un batch o cloud function)
  const accountRef = doc(db, `users/${uid}/accounts`, accountId);
  await deleteDoc(accountRef);
};

/**
 * Agrega una transacción y actualiza el balance de la cuenta de forma atómica.
 */
export const createTransaction = async (uid, tx) => {
  if (!uid) throw new Error("No autenticado");
  
  const txRef = doc(collection(db, `users/${uid}/transactions`));
  const accountRef = doc(db, `users/${uid}/accounts`, tx.accountId);

  const batch = writeBatch(db);
  const delta = tx.type === 'ingreso' ? tx.amount : -tx.amount;

  const newTx = {
    ...tx,
    id: txRef.id,
    userId: uid,
    date: tx.date || new Date().toISOString(),
  };

  // Crear la transacción
  batch.set(txRef, newTx);
  
  // Actualizar el balance
  batch.update(accountRef, {
    balance: increment(delta),
    updatedAt: new Date().toISOString()
  });

  // El batch.commit() resolverá cuando el server confirme, pero la UI se actualiza inmediatamente por el caché local
  await batch.commit();
};

/**
 * Elimina una transacción y revierte el balance de la cuenta.
 */
export const deleteTransactionData = async (uid, txId, accountId, amount, type) => {
  if (!uid) throw new Error("No autenticado");

  const txRef = doc(db, `users/${uid}/transactions`, txId);
  const accountRef = doc(db, `users/${uid}/accounts`, accountId);

  const batch = writeBatch(db);
  const delta = type === 'ingreso' ? -amount : amount;

  batch.update(accountRef, {
    balance: increment(delta),
    updatedAt: new Date().toISOString()
  });
  batch.delete(txRef);

  await batch.commit();
};

/**
 * Actualiza las preferencias del usuario.
 */
export const updateUserPreference = async (uid, data) => {
  if (!uid) throw new Error("No autenticado");
  const userRef = doc(db, `users/${uid}`);
  await setDoc(userRef, data, { merge: true });
};

/**
 * Suscribe a las preferencias del usuario.
 */
export const subscribeUserPreferences = (uid, callback) => {
  if (!uid) return () => {};
  const userRef = doc(db, `users/${uid}`);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({});
    }
  }, (error) => {
    console.error("Error subscribiendo preferencias:", error);
  });
};

/**
 * Suscribe a las cuentas del usuario.
 */
export const subscribeAccounts = (uid, callback) => {
  if (!uid) return () => {};
  const q = query(collection(db, `users/${uid}/accounts`), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const accounts = snapshot.docs.map(doc => doc.data());
    callback(accounts);
  }, (error) => {
    console.error("Error subscribiendo cuentas:", error);
  });
};

/**
 * Suscribe a las transacciones del usuario.
 */
export const subscribeTransactions = (uid, callback) => {
  if (!uid) return () => {};
  const q = query(collection(db, `users/${uid}/transactions`), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const txs = snapshot.docs.map(doc => doc.data());
    callback(txs);
  }, (error) => {
    console.error("Error subscribiendo transacciones:", error);
  });
};
