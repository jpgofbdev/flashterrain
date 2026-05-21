import { CONFIG } from "./config.js";

let db;

export function openDatabase(){
  return new Promise((resolve,reject)=>{
    const request = indexedDB.open(CONFIG.dbName,1);

    request.onupgradeneeded = function(e){
      db = e.target.result;

      if(!db.objectStoreNames.contains(CONFIG.storeName)){
        db.createObjectStore(CONFIG.storeName,{keyPath:"id"});
      }
    };

    request.onsuccess = function(e){
      db = e.target.result;
      resolve();
    };

    request.onerror = function(e){
      reject(e);
    };
  });
}

export function saveCapsuleToDB(capsule){
  return new Promise((resolve,reject)=>{
    const transaction = db.transaction([CONFIG.storeName],"readwrite");
    const store = transaction.objectStore(CONFIG.storeName);
    const request = store.put(capsule);

    request.onsuccess = ()=>resolve();
    request.onerror = e => reject(e);
  });
}

export function getAllCapsules(){
  return new Promise((resolve,reject)=>{
    const transaction = db.transaction([CONFIG.storeName],"readonly");
    const store = transaction.objectStore(CONFIG.storeName);
    const request = store.getAll();

    request.onsuccess = ()=>resolve(request.result);
    request.onerror = e => reject(e);
  });
}

export function deleteCapsuleFromDB(id){
  return new Promise((resolve,reject)=>{
    const transaction = db.transaction([CONFIG.storeName],"readwrite");
    const store = transaction.objectStore(CONFIG.storeName);
    const request = store.delete(id);

    request.onsuccess = ()=>resolve();
    request.onerror = e => reject(e);
  });
}
