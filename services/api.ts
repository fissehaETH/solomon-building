
import { Product, Sale, Customer, User, Category, Purchase, Credit, CreditPayment } from '../types';
import pkg from '../package.json';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  writeBatch, 
  query, 
  where, 
  updateDoc,
  increment,
  deleteDoc
} from 'firebase/firestore';

const APP_VERSION = pkg.version;
const DB_NAME = 'SolomonBuildingMaterialsDB';
const STORE_NAME = 'app_state';
const DB_VERSION = 1;

class SolomonDB {
  private idb: IDBDatabase | null = null;
  private cache: any = null;
  private queue: Promise<any> = Promise.resolve();

  private generateId(prefix: string): string {
    return `${prefix}-${Math.floor(Date.now() / 1000)}-${Math.floor(Math.random() * 1000)}`;
  }

  private async ensureInitialized() {
    if (!this.cache) {
      await this.initialize();
    }
  }

  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(task);
    this.queue = result.catch(() => {});
    return result;
  }

  private async hashString(str: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.error("Hashing failed:", e);
      return str;
    }
  }

  // --- INDEXEDDB CORE ---

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  private async getFromDB(key: string): Promise<any> {
    if (!this.idb) this.idb = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = this.idb!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async saveToDB(key: string, data: any): Promise<void> {
    if (!this.idb) this.idb = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = this.idb!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // --- PUBLIC API ---

  public async initialize(): Promise<void> {
    return this.enqueue(async () => {
      let data = await this.getFromDB('current_state');
      
      if (!data) {
        const defaultPass = await this.hashString('admin123');
        data = {
          products: [],
          sales: [],
          purchases: [],
          customers: [],
          credits: [],
          credit_payments: [],
          categories: [
            {
              catagory_id: 'CAT-001',
              catagoryName: 'Cement (ሲሚንቶ)',
              purchasingUnit: 'Quintal, Bag',
              brand: 'Dangote, Derba, Muger, Habesha, National',
              sellingUnit: 'Bag, kg',
              ConvertionRate: '1:1, 1:50'
            },
            {
              catagory_id: 'CAT-002',
              catagoryName: 'Rebar (ብረት)',
              purchasingUnit: 'Piece, Bundle',
              brand: 'Abyssinia, Steely, Zuquala, C&E',
              sellingUnit: 'Piece, Meter',
              ConvertionRate: '1:1, 1:12'
            },
            {
              catagory_id: 'CAT-003',
              catagoryName: 'Nails (ምስማር)',
              purchasingUnit: 'Box, Packet',
              brand: 'Standard, Local, Imported',
              sellingUnit: 'kg, Packet',
              ConvertionRate: '1:50, 1:1'
            },
            {
              catagory_id: 'CAT-004',
              catagoryName: 'Paint (ቀለም)',
              purchasingUnit: 'Gallon, Drum',
              brand: 'Nefas Silk, Kadisco, Zemex',
              sellingUnit: 'Litre, Gallon',
              ConvertionRate: '1:4, 1:1'
            },
            {
              catagory_id: 'CAT-005',
              catagoryName: 'Roofing (ቆርቆሮ)',
              purchasingUnit: 'Piece, Bundle',
              brand: 'Kality, Akaki, Kombolcha',
              sellingUnit: 'Piece',
              ConvertionRate: '1:1'
            }
          ],
          users: [{
            user_id: 'SEED-001',
            firstName: 'Solomon',
            lastName: 'Admin',
            username: 'admin',
            password: defaultPass,
            role: 'Admin',
            created_at: new Date().toISOString()
          }],
          lastSynced: null,
          lastUpdated: new Date().toISOString()
        };
        await this.saveToDB('current_state', data);
      }
      this.cache = data;
      
      if (navigator.onLine) {
        this.syncWithRemote().catch(console.error);
      }
    });
  }

  public getFullState() {
    return this.cache;
  }

  private async persistCache() {
    this.cache.lastUpdated = new Date().toISOString();
    await this.saveToDB('current_state', this.cache);
  }

  private normalizeData(data: any): any {
    if (!data) return data;
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeData(item));
    }
    if (typeof data === 'object') {
      const normalized: any = {};
      for (const key in data) {
        const value = data[key];
        // Convert Firestore Timestamp to ISO string
        if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
          normalized[key] = new Date(value.seconds * 1000).toISOString();
        } else if (value && typeof value === 'object' && value.toDate instanceof Function) {
          normalized[key] = value.toDate().toISOString();
        } else if (Array.isArray(value)) {
          normalized[key] = value.map(v => this.normalizeData(v));
        } else if (value !== undefined) {
          normalized[key] = value;
        }
      }
      return normalized;
    }
    return data;
  }

  async syncWithRemote(): Promise<boolean> {
    return this.enqueue(() => this._syncWithRemote());
  }

  private async _syncWithRemote(): Promise<boolean> {
    await this.ensureInitialized();
    if (!db) return false;

    try {
      const collections = ['products', 'sales', 'customers', 'users', 'categories', 'purchases', 'credits', 'credit_payments'];
      const remoteData: any = {};

      for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        remoteData[colName] = snapshot.docs.map(doc => this.normalizeData(doc.data()));
      }

      const isFirstSync = !this.cache.lastSynced;

      const syncCollection = (colName: string) => {
        const remoteItems = remoteData[colName];
        if (isFirstSync) {
          // On first sync, only overwrite if remote has data
          if (remoteItems && remoteItems.length > 0) {
            this.cache[colName] = remoteItems;
          }
        } else {
          // On subsequent syncs, remote is the source of truth
          if (remoteItems) {
            this.cache[colName] = remoteItems;
          }
        }
      };

      syncCollection('products');
      syncCollection('sales');
      syncCollection('customers');
      syncCollection('users');
      syncCollection('categories');
      syncCollection('purchases');
      syncCollection('credits');
      syncCollection('credit_payments');

      this.cache.lastSynced = new Date().toISOString();
      await this.persistCache();
      return true;
    } catch (e) {
      console.error("Sync failed:", e);
      return false;
    }
  }

  getProducts(): Product[] { return this.cache?.products || []; }
  getCategories(): Category[] { return this.cache?.categories || []; }
  getSales(): Sale[] { return this.cache?.sales || []; }
  getPurchases(): Purchase[] { return this.cache?.purchases || []; }
  getCustomers(): Customer[] { return this.cache?.customers || []; }
  getCredits(): Credit[] { return this.cache?.credits || []; }
  getCreditPayments(): CreditPayment[] { return this.cache?.credit_payments || []; }

  async addCategory(category: Omit<Category, 'catagory_id'>): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      const newCategory: Category = { 
        ...category, 
        catagory_id: this.generateId('CAT')
      };
      
      if (!this.cache.categories) this.cache.categories = [];
      this.cache.categories.push(newCategory);
      await this.persistCache();
      
      if (db) {
        await setDoc(doc(db, 'categories', newCategory.catagory_id), newCategory);
      }
    });
  }

  async deleteCategory(categoryId: string): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      
      // Check if any products are using this category
      const category = this.cache.categories.find((c: any) => c.catagory_id === categoryId);
      if (!category) return;

      const productsUsingCategory = this.cache.products.filter((p: any) => p.category === category.catagoryName);
      if (productsUsingCategory.length > 0) {
        throw new Error(`Cannot delete category "${category.catagoryName}" because it is being used by ${productsUsingCategory.length} products.`);
      }

      this.cache.categories = (this.cache.categories || []).filter((c: any) => c.catagory_id !== categoryId);
      await this.persistCache();

      if (db) {
        await deleteDoc(doc(db, 'categories', categoryId));
      }
    });
  }

  async addProduct(product: Omit<Product, 'product_id' | 'created_at'>): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      const newProduct: Product = { 
        ...product, 
        product_id: this.generateId('PR'), 
        created_at: new Date().toISOString() 
      };
      
      this.cache.products.push(newProduct);
      await this.persistCache();
      
      if (db) {
        await setDoc(doc(db, 'products', newProduct.product_id), newProduct);
      }
    });
  }

  async deleteProduct(productId: string): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      
      // Check if product has any sales or purchases
      const hasSales = this.cache.sales.some((s: any) => s.product_id === productId);
      const hasPurchases = this.cache.purchases.some((p: any) => p.product_id === productId);
      
      if (hasSales || hasPurchases) {
        throw new Error("Cannot delete product with transaction history (sales or purchases).");
      }

      this.cache.products = this.cache.products.filter((p: any) => p.product_id !== productId);
      await this.persistCache();

      if (db) {
        await deleteDoc(doc(db, 'products', productId));
      }
    });
  }

  async addCustomer(customer: Omit<Customer, 'customer_id' | 'created_at'>): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      const newCustomer: Customer = { 
        ...customer, 
        customer_id: this.generateId('C'), 
        created_at: new Date().toISOString() 
      };
      
      this.cache.customers.push(newCustomer);
      await this.persistCache();
      
      if (db) {
        await setDoc(doc(db, 'customers', newCustomer.customer_id), newCustomer);
      }
    });
  }

  async addSales(salesItems: Omit<Sale, 'sale_id' | 'date'>[]): Promise<string> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      const date = new Date().toISOString();
      const receiptId = this.generateId('S');
      const newSales = salesItems.map(item => ({ ...item, sale_id: receiptId, date }));
      
      this.cache.sales.push(...newSales);
      
      // Check for negative stock before proceeding
      for (const item of newSales) {
        const p = this.cache.products.find((x: any) => x.product_id === item.product_id);
        if (p && Number(p.stock_qty) < Number(item.base_quantity)) {
          throw new Error(`Insufficient stock for ${p.product_name}. Available: ${p.stock_qty}, Requested: ${item.base_quantity}`);
        }
      }

      const isCredit = newSales[0]?.payment_method === 'Credit';
      let creditRecord: Credit | null = null;

      if (isCredit) {
        const customerName = newSales[0]?.customer_name || 'Walk-in';
        let customer = this.cache.customers.find((c: any) => c.customer_name === customerName);
        
        // If customer doesn't exist, create a temporary one or use a placeholder
        let customerId = customer?.customer_id;
        if (!customerId) {
          customerId = this.generateId('C');
          const newCustomer: Customer = {
            customer_id: customerId,
            customer_name: customerName,
            phone: '',
            address: '',
            created_at: date
          };
          this.cache.customers.push(newCustomer);
          if (db) await setDoc(doc(db, 'customers', customerId), newCustomer);
        }

        const totalAmount = newSales.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
        
        creditRecord = {
          id: this.generateId('CR'),
          credit_number: `CR-${receiptId.split('-')[1]}`,
          customer_id: customerId,
          sale_id: receiptId,
          total_amount: totalAmount,
          remaining_amount: totalAmount,
          status: 'Pending',
          credit_date: date,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
          note: `Credit sale for receipt ${receiptId}`,
          created_by: newSales[0]?.recorded_by || 'Admin',
          created_at: date,
          updated_at: date
        };

        if (!this.cache.credits) this.cache.credits = [];
        this.cache.credits.push(creditRecord);
      }

      if (db) {
        const firestore = db;
        const batch = writeBatch(firestore);
        
        newSales.forEach(item => {
          const p = this.cache.products.find((x: any) => x.product_id === item.product_id);
          if (p) {
            p.stock_qty = Number(p.stock_qty) - Number(item.base_quantity);
            batch.update(doc(firestore, 'products', p.product_id), {
              stock_qty: increment(-Number(item.base_quantity))
            });
          }
          batch.set(doc(collection(firestore, 'sales')), item);
        });

        if (creditRecord) {
          batch.set(doc(firestore, 'credits', creditRecord.id), creditRecord);
        }
        
        await batch.commit();
      } else {
        // Handle local-only update if db is missing
        newSales.forEach(item => {
          const p = this.cache.products.find((x: any) => x.product_id === item.product_id);
          if (p) p.stock_qty = Number(p.stock_qty) - Number(item.base_quantity);
        });
      }
      
      await this.persistCache();
      return receiptId;
    });
  }

  async addPurchases(purchaseItems: Omit<Purchase, 'purchase_id' | 'date'>[]): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      const date = new Date().toISOString();
      const restockId = this.generateId('R');
      const newPurchases = purchaseItems.map(item => ({ ...item, purchase_id: restockId, date }));
      
      this.cache.purchases.push(...newPurchases);
      
      if (db) {
        const firestore = db;
        const batch = writeBatch(firestore);
        
        newPurchases.forEach(item => {
          const p = this.cache.products.find((x: any) => x.product_id === item.product_id);
          if (p) {
            p.stock_qty = Number(p.stock_qty) + Number(item.base_quantity);
            p.unit_price = Number(item.unitPrice);
            batch.update(doc(firestore, 'products', p.product_id), {
              stock_qty: increment(Number(item.base_quantity)),
              unit_price: Number(item.unitPrice)
            });
          }
          batch.set(doc(collection(firestore, 'purchases')), item);
        });
        
        await batch.commit();
      } else {
        // Handle local-only update
        newPurchases.forEach(item => {
          const p = this.cache.products.find((x: any) => x.product_id === item.product_id);
          if (p) {
            p.stock_qty = Number(p.stock_qty) + Number(item.base_quantity);
            p.unit_price = Number(item.unitPrice);
          }
        });
      }
      
      await this.persistCache();
    });
  }

  async adjustStock(productId: string, change: number, reason: string): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      const p = this.cache.products.find((x: any) => x.product_id === productId);
      if (p) {
        if (Number(p.stock_qty) + change < 0) {
          throw new Error(`Cannot adjust stock below zero. Current: ${p.stock_qty}, Adjustment: ${change}`);
        }
        p.stock_qty = Number(p.stock_qty) + change;
        await this.persistCache();
        
        if (db) {
          await updateDoc(doc(db, 'products', productId), {
            stock_qty: increment(change)
          });
          await setDoc(doc(collection(db, 'adjustments')), {
            productId,
            change,
            reason,
            date: new Date().toISOString()
          });
        }
      }
    });
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    await this.ensureInitialized();
    
    const inputHash = await this.hashString(password);
    const cleanInputName = String(username || '').toLowerCase().trim();
    const cleanInputPass = String(password || '').trim();

    const checkUserMatch = (u: any) => {
      if (!u) return false;
      const uName = String(u.username || '').toLowerCase().trim();
      const uPass = String(u.password || '').trim();
      if (uName !== cleanInputName) return false;
      return uPass === inputHash || uPass === cleanInputPass;
    };

    if (navigator.onLine && db) {
      try {
        console.log(`Attempting remote login for: ${cleanInputName}`);
        const q = query(collection(db, 'users'), where('username', '==', cleanInputName));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const matchedUser = snapshot.docs[0].data() as User;
          const uPass = String(matchedUser.password || '').trim();
          
          console.log(`User found in Firestore. Checking password...`);
          if (uPass === inputHash || uPass === cleanInputPass) {
            console.log(`Password match! Updating local cache...`);
            await this.enqueue(async () => {
              const userToSave = { ...matchedUser };
              if (userToSave.password && String(userToSave.password).length < 64) {
                userToSave.password = await this.hashString(String(userToSave.password));
              }
              
              if (!this.cache.users) this.cache.users = [];
              const existingIndex = this.cache.users.findIndex((u: any) => 
                String(u.username).toLowerCase() === cleanInputName
              );
              
              if (existingIndex > -1) {
                this.cache.users[existingIndex] = userToSave;
              } else {
                this.cache.users.push(userToSave);
              }
              await this.persistCache();
            });

            const { password: _, ...cleanUser } = matchedUser;
            return cleanUser as User;
          } else {
            console.warn(`Password mismatch for user: ${cleanInputName}`);
          }
        } else {
          console.log(`User ${cleanInputName} not found in Firestore. Checking local cache...`);
        }
      } catch (e) {
        console.error("Remote login failed:", e);
      }
    }

    console.log(`Checking local cache for user: ${cleanInputName}`);
    const matchedUser = (this.cache?.users || []).find(checkUserMatch);
    
    if (matchedUser) {
      const { password: _, ...cleanUser } = matchedUser;
      return cleanUser as User;
    }

    // Safety fallback: If no users match, always allow the default admin for recovery
    const defaultPass = await this.hashString('admin123');
    if (cleanInputName === 'admin' && (inputHash === defaultPass || cleanInputPass === 'admin123')) {
      return {
        user_id: 'SEED-001',
        firstName: 'Solomon',
        lastName: 'Admin',
        username: 'admin',
        role: 'Admin',
        created_at: new Date().toISOString()
      } as User;
    }

    return null;
  }

  async migrateFromGoogleSheets(): Promise<{ success: boolean; message: string }> {
    return this.enqueue(async () => {
      const OLD_APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwP_CQFcCQtUDBa0bYsnRzWJChTpx7MWxT-DLJypzW45JQczSlXxVUbakwFJIRCIORg/exec';
      
      console.log("Starting migration from:", OLD_APPS_SCRIPT_URL);
      
      if (!navigator.onLine) {
        return { success: false, message: "No internet connection. Please check your network." };
      }

      if (!db) {
        return { success: false, message: "Firebase is not initialized. Please check your API keys." };
      }

      try {
        // 1. Fetch data from Google Sheets
        console.log("Fetching data from Google Sheets...");
        const response = await fetch(OLD_APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'getAllData', appVersion: APP_VERSION }),
          redirect: 'follow'
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const remoteData = await response.json();
        console.log("Data received from Google Sheets:", remoteData);

        if (!remoteData || remoteData.status === 'error') {
          throw new Error(remoteData?.message || "The Google Sheet script returned an error.");
        }

        // 2. Prepare Firestore Batches
        const collections = ['products', 'sales', 'customers', 'users', 'categories', 'purchases', 'credits', 'credit_payments'];
        const firestore = db;
        let totalMigrated = 0;

        for (const colName of collections) {
          const items = remoteData[colName];
          if (items && Array.isArray(items) && items.length > 0) {
            console.log(`Migrating ${items.length} items to '${colName}'...`);
            
            const chunkSize = 400;
            for (let i = 0; i < items.length; i += chunkSize) {
              const chunk = items.slice(i, i + chunkSize);
              const batch = writeBatch(firestore);
              
              chunk.forEach(item => {
                const normalized = this.normalizeData(item);
                let id: any = '';
                
                // Use existing IDs if available to prevent duplicates
                if (colName === 'products') id = normalized.product_id;
                else if (colName === 'categories') id = normalized.catagory_id;
                else if (colName === 'customers') id = normalized.customer_id;
                else if (colName === 'users') {
                  id = normalized.user_id;
                  if (normalized.username) {
                    normalized.username = String(normalized.username).toLowerCase().trim();
                  }
                }
                else if (colName === 'sales') id = normalized.sale_id;
                else if (colName === 'purchases') id = normalized.purchase_id;
                else if (colName === 'credits') id = normalized.id;
                else if (colName === 'credit_payments') id = normalized.id;
                
                // Ensure ID is a string and not empty
                if (id !== undefined && id !== null && id !== '') {
                   id = String(id).trim();
                } else {
                   id = this.generateId(colName.substring(0, 2).toUpperCase());
                }

                // Firestore doesn't allow 'undefined' values
                const cleanData: any = {};
                Object.keys(normalized).forEach(key => {
                  if (normalized[key] !== undefined) {
                    cleanData[key] = normalized[key];
                  }
                });

                const docRef = doc(firestore, colName, id);
                batch.set(docRef, cleanData);
                totalMigrated++;
              });
              
              await batch.commit();
            }
          }
        }

        console.log(`Migration complete. Total items migrated: ${totalMigrated}`);

        // 3. Refresh local cache - Call internal method to avoid deadlock
        await this._syncWithRemote();
        return { 
          success: true, 
          message: `Migration successful! ${totalMigrated} items moved to Firebase.` 
        };
      } catch (e: any) {
        console.error("Migration failed detailed error:", e);
        return { 
          success: false, 
          message: `Migration failed: ${e.message || "Unknown error"}. Check browser console for details.` 
        };
      }
    });
  }

  isUserValid(userId: string): boolean {
    if (userId === 'SEED-001') return true;
    if (!this.cache?.users) return false;
    return this.cache.users.some((u: any) => u.user_id === userId);
  }

  async addUser(user: Omit<User, 'user_id' | 'created_at'>): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      const hashedPassword = await this.hashString(user.password);
      const newUser: User = { 
        ...user, 
        password: hashedPassword,
        user_id: this.generateId('U'), 
        created_at: new Date().toISOString() 
      };
      
      if (!this.cache.users) this.cache.users = [];
      this.cache.users.push(newUser);
      await this.persistCache();
      
      if (db) {
        await setDoc(doc(db, 'users', newUser.user_id), newUser);
      }
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      if (userId === 'SEED-001') {
        throw new Error("Cannot delete the default admin user.");
      }

      this.cache.users = (this.cache.users || []).filter((u: any) => u.user_id !== userId);
      await this.persistCache();

      if (db) {
        await deleteDoc(doc(db, 'users', userId));
      }
    });
  }

  async addCredit(credit: Omit<Credit, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      const now = new Date().toISOString();
      const newCredit: Credit = { 
        ...credit, 
        id: this.generateId('CR'), 
        created_at: now,
        updated_at: now
      };
      
      if (!this.cache.credits) this.cache.credits = [];
      this.cache.credits.push(newCredit);
      await this.persistCache();
      
      if (db) {
        await setDoc(doc(db, 'credits', newCredit.id), newCredit);
      }
    });
  }

  async addCreditPayment(payment: Omit<CreditPayment, 'id' | 'created_at'>): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      const now = new Date().toISOString();
      const newPayment: CreditPayment = { 
        ...payment, 
        id: this.generateId('CP'), 
        created_at: now
      };
      
      if (!this.cache.credit_payments) this.cache.credit_payments = [];
      this.cache.credit_payments.push(newPayment);

      // Update the credit remaining amount
      const credit = this.cache.credits.find((c: any) => c.id === payment.credit_id);
      if (credit) {
        credit.remaining_amount = Number(credit.remaining_amount) - Number(payment.amount);
        if (credit.remaining_amount <= 0) {
          credit.remaining_amount = 0;
          credit.status = 'Paid';
        }
        credit.updated_at = now;
      }

      await this.persistCache();
      
      if (db) {
        const batch = writeBatch(db);
        batch.set(doc(collection(db, 'credit_payments')), newPayment);
        if (credit) {
          batch.update(doc(db, 'credits', credit.id), {
            remaining_amount: credit.remaining_amount,
            status: credit.status,
            updated_at: now
          });
        }
        await batch.commit();
      }
    });
  }

  async addBulkCreditPayment(data: {
    customer_id: string;
    amount: number;
    payment_method: 'Cash' | 'Bank Transfer';
    note: string;
    received_by: string;
  }): Promise<void> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      const now = new Date().toISOString();
      let remainingPayment = Number(data.amount);

      // Get all pending/overdue credits for this customer, sorted by date (oldest first)
      const customerCredits = this.cache.credits
        .filter((c: any) => c.customer_id === data.customer_id && c.status !== 'Paid')
        .sort((a: any, b: any) => new Date(a.credit_date).getTime() - new Date(b.credit_date).getTime());

      if (customerCredits.length === 0) return;

      const newPayments: CreditPayment[] = [];
      const updatedCredits: Credit[] = [];

      for (const credit of customerCredits) {
        if (remainingPayment <= 0) break;

        const paymentForThisCredit = Math.min(remainingPayment, Number(credit.remaining_amount));
        
        const newPayment: CreditPayment = {
          id: this.generateId('CP'),
          credit_id: credit.id,
          amount: paymentForThisCredit,
          payment_method: data.payment_method,
          payment_date: now,
          note: data.note || `Bulk payment for customer`,
          received_by: data.received_by,
          created_at: now
        };

        newPayments.push(newPayment);
        
        credit.remaining_amount = Number(credit.remaining_amount) - paymentForThisCredit;
        if (credit.remaining_amount <= 0) {
          credit.remaining_amount = 0;
          credit.status = 'Paid';
        }
        credit.updated_at = now;
        updatedCredits.push(credit);

        remainingPayment -= paymentForThisCredit;
      }

      if (newPayments.length === 0) return;

      if (!this.cache.credit_payments) this.cache.credit_payments = [];
      this.cache.credit_payments.push(...newPayments);

      await this.persistCache();

      if (db) {
        const firestore = db;
        const batch = writeBatch(firestore);
        newPayments.forEach(p => {
          batch.set(doc(collection(firestore, 'credit_payments')), p);
        });
        updatedCredits.forEach(c => {
          batch.update(doc(firestore, 'credits', c.id), {
            remaining_amount: c.remaining_amount,
            status: c.status,
            updated_at: now
          });
        });
        await batch.commit();
      }
    });
  }
}

export const api = new SolomonDB();
