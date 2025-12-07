import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  Upload,
  ClipboardCheck,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Search,
  ChevronRight,
  ArrowDown,
  History,
  FileText,
  CheckCircle,
  FileUp,
  X,
  ListFilter,
  Save,
  Ban,
  BarChart3,
  Printer,
  ShoppingCart,
  Cloud,
  LogOut,
  User,
  Users,
  Lock,
  Shield,
  ShieldCheck,
  Loader2,
  Hash,            // For Smart Counting options
  ArrowDownCircle  // For Stock Receiving
} from 'lucide-react';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  setDoc,
  limit,
} from 'firebase/firestore';

// --- CONFIGURATION ---
// ⚠️ YOUR KEYS ARE PRESERVED HERE
const firebaseConfig = {
  apiKey: 'AIzaSyBI0XhRV9aSivFBnEMoFgLqux1WfMvn0sQ',
  authDomain: 'mozzinvent.firebaseapp.com',
  projectId: 'mozzinvent',
  storageBucket: 'mozzinvent.firebasestorage.app',
  messagingSenderId: '382778875688',
  appId: '1:382778875688:web:2ea29da2e91847191bba1d',
};

// Initialize Firebase
let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (e) {
  console.error('Firebase Init Error:', e);
}

const auth = getAuth(app);
const db = getFirestore(app);
const ORG_ID = 'my-restaurant';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

// --- AUTH SCREEN ---
const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const usersSnapshot = await getDocs(query(collection(db, `organizations/${ORG_ID}/users`), limit(1)));
        const isFirstUser = usersSnapshot.empty;
        await setDoc(doc(db, `organizations/${ORG_ID}/users`, userCred.user.uid), {
          email: email,
          role: isFirstUser ? 'owner' : 'staff',
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border-t-4 border-slate-800">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-100 p-4 rounded-full">
              <UtensilsCrossed className="w-10 h-10 text-orange-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">RestoStock</h1>
          <p className="text-slate-500">Secure Inventory Management</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" required className="w-full p-3 border rounded-lg" placeholder="admin@restaurant.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" required className="w-full p-3 border rounded-lg" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}
          <button disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:underline">
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
          </button>
        </div>
      </Card>
    </div>
  );
};

// --- SUB-COMPONENT: SMART COUNTER ---
const SmartCounter = ({ item, onCountChange }) => {
  const [subCounts, setSubCounts] = useState({});
  const [baseCount, setBaseCount] = useState('');

  useEffect(() => {
    let total = Number(baseCount) || 0;
    // Safety check for undefined subUnits
    if (item?.subUnits && Array.isArray(item.subUnits)) {
      item.subUnits.forEach(sub => {
        const qty = Number(subCounts[sub.name]) || 0;
        total += qty * (Number(sub.value) || 0);
      });
    }
    onCountChange(total);
  }, [subCounts, baseCount]);

  if (!item?.subUnits || !Array.isArray(item.subUnits) || item.subUnits.length === 0) {
    return (
      <input
        type="number"
        className="border w-24 p-2 rounded text-center font-bold"
        placeholder="0"
        value={baseCount}
        onChange={(e) => setBaseCount(e.target.value)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <div className="flex flex-wrap gap-2 justify-end">
        {item.subUnits.map((sub, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold">{sub.name}</span>
            <input
              type="number"
              className="border border-blue-200 bg-blue-50 w-20 p-1 rounded text-center text-sm"
              placeholder="0"
              onChange={(e) => setSubCounts({...subCounts, [sub.name]: e.target.value})}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <span className="text-[10px] text-slate-400">LOOSE ({item.unit})</span>
        <input
          type="number"
          className="border w-20 p-1 rounded text-center text-sm"
          placeholder="0"
          value={baseCount}
          onChange={(e) => setBaseCount(e.target.value)}
        />
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function RestaurantInventoryApp() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');

  const [inventory, setInventory] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [appUsers, setAppUsers] = useState([]);
  const [loadingMsg, setLoadingMsg] = useState('');

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userRef = doc(db, `organizations/${ORG_ID}/users`, u.uid);
          const unsubRole = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) setUserRole(docSnap.data().role);
            else {
              setDoc(userRef, { email: u.email, role: 'staff', createdAt: serverTimestamp() });
              setUserRole('staff');
            }
          });
          return () => unsubRole();
        } catch (e) { console.log('Role error', e); }
      } else {
        setUser(null);
        setUserRole(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const basePath = `organizations/${ORG_ID}`;
    const unsubs = [
      onSnapshot(collection(db, `${basePath}/inventory`), (s) => setInventory(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, `${basePath}/menu`), (s) => setMenuItems(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, `${basePath}/recipes`), (s) => setRecipes(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, `${basePath}/staff`), (s) => setStaffList(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, `${basePath}/logs`), orderBy('createdAt', 'desc')), (s) => setLogs(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
    ];
    if (userRole === 'owner') {
      unsubs.push(onSnapshot(collection(db, `${basePath}/users`), (s) => setAppUsers(s.docs.map((d) => ({ id: d.id, ...d.data() })))));
    }
    return () => unsubs.forEach(u => u());
  }, [user, userRole]);

  const addLog = async (type, message, staffName = user?.email) => {
    await addDoc(collection(db, `organizations/${ORG_ID}/logs`), {
      type, message, user: staffName, date: new Date().toLocaleString(), createdAt: serverTimestamp()
    });
  };

  const handleLogout = () => signOut(auth);

  const loadInitialMenu = async () => {
    // You can customize this list later
    const rawMenuList = ['Pizza Margherita', 'Pepperoni Pizza', 'Cola', 'Water'];
    setLoadingMsg('Initializing Menu...');
    const batch = writeBatch(db);
    const menuRef = collection(db, `organizations/${ORG_ID}/menu`);
    rawMenuList.forEach((name) => {
      const docRef = doc(menuRef);
      batch.set(docRef, { name, price: 0 });
    });
    await batch.commit();
    addLog('system', 'Initialized default menu items');
    setLoadingMsg('');
  };

  // --- VIEWS ---
  const Dashboard = () => {
    const lowStockItems = inventory.filter((i) => i.quantity <= i.threshold);
    const totalValue = inventory.reduce((acc, item) => acc + item.quantity * (item.cost || 0), 0);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 border-l-4 border-blue-500">
            <h3 className="text-slate-500 text-sm font-medium">Total Menu Items</h3>
            <p className="text-3xl font-bold text-slate-800">{menuItems.length}</p>
          </Card>
          <Card className="p-6 border-l-4 border-green-500">
            <h3 className="text-slate-500 text-sm font-medium">Inventory Value</h3>
            <p className="text-3xl font-bold text-slate-800">${totalValue.toLocaleString()}</p>
          </Card>
          <Card className={`p-6 border-l-4 ${lowStockItems.length > 0 ? 'border-red-500' : 'border-slate-300'}`}>
            <h3 className="text-slate-500 text-sm font-medium">Items to Order</h3>
            <p className={`text-3xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>{lowStockItems.length}</p>
          </Card>
        </div>
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Stock Alert</h3>
              <p className="text-red-600 text-sm">You have {lowStockItems.length} items below MOQ.</p>
            </div>
            <button onClick={() => setActiveTab('ordersheet')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition">View Order Sheet</button>
          </div>
        )}
      </div>
    );
  };

  const InventoryView = () => {
    const [formData, setFormData] = useState({ name: '', unit: 'g', quantity: 0, threshold: 0, cost: 0, subUnits: [] });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [tempSubName, setTempSubName] = useState('');
    const [tempSubValue, setTempSubValue] = useState('');

    const addSubUnit = () => {
      if(!tempSubName || !tempSubValue) return;
      setFormData({
        ...formData,
        subUnits: [...(formData.subUnits || []), { name: tempSubName, value: Number(tempSubValue) }]
      });
      setTempSubName('');
      setTempSubValue('');
    };

    const removeSubUnit = (idx) => {
      const updated = [...(formData.subUnits || [])];
      updated.splice(idx, 1);
      setFormData({...formData, subUnits: updated});
    };

    const handleSaveItem = async () => {
      if (!formData.name) return;
      const data = {
        name: formData.name,
        unit: formData.unit,
        quantity: Number(formData.quantity),
        threshold: Number(formData.threshold),
        cost: Number(formData.cost),
        subUnits: formData.subUnits || []
      };
      if (editingId) {
        await updateDoc(doc(db, `organizations/${ORG_ID}/inventory`, editingId), data);
        addLog('inventory', `Updated: ${formData.name}`);
      } else {
        await addDoc(collection(db, `organizations/${ORG_ID}/inventory`), data);
        addLog('inventory', `Added: ${formData.name}`);
      }
      setFormData({ name: '', unit: 'g', quantity: 0, threshold: 0, cost: 0, subUnits: [] });
      setIsFormOpen(false);
      setEditingId(null);
    };

    const handleDeleteClick = async (item) => {
        if (userRole !== 'owner') return alert('Only Owners can delete items.');
        if (confirm(`Delete ${item.name}?`)) {
          await deleteDoc(doc(db, `organizations/${ORG_ID}/inventory`, item.id));
          addLog('inventory', `Deleted: ${item.name}`);
        }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Raw Inventory</h2>
          {!isFormOpen && (
            <button onClick={() => setIsFormOpen(true)} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          )}
        </div>
        {isFormOpen && (
          <Card className="p-6 bg-slate-50 border-2 border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-500 uppercase text-xs">Basic Info</h3>
                <div><label className="text-xs font-bold">Name</label><input className="w-full p-2 border rounded" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-bold">Unit</label><input className="w-full p-2 border rounded" placeholder="e.g. g, ml, pcs" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} /></div>
                    <div><label className="text-xs font-bold">Current Stock</label><input type="number" className="w-full p-2 border rounded" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-bold text-blue-600">MOQ (Alert)</label><input type="number" className="w-full p-2 border border-blue-200 rounded" value={formData.threshold} onChange={(e) => setFormData({ ...formData, threshold: e.target.value })} /></div>
                    <div><label className="text-xs font-bold">Cost</label><input type="number" className="w-full p-2 border rounded" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} /></div>
                </div>
              </div>
              <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
                <h3 className="font-bold text-slate-500 uppercase text-xs flex items-center gap-2"><Hash className="w-4 h-4" /> Counting Options (Optional)</h3>
                <div className="flex gap-2">
                    <input className="flex-1 border rounded p-2 text-sm" placeholder="Name (e.g. Big Block)" value={tempSubName} onChange={e => setTempSubName(e.target.value)} />
                    <input type="number" className="w-20 border rounded p-2 text-sm" placeholder="Value" value={tempSubValue} onChange={e => setTempSubValue(e.target.value)} />
                    <button onClick={addSubUnit} className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                    {(formData.subUnits || []).map((sub, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm border">
                            <span><b>{sub.name}</b> = {sub.value} {formData.unit}</span>
                            <button onClick={() => removeSubUnit(idx)} className="text-red-400 hover:text-red-600"><Ban className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
                <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded text-slate-500 hover:bg-slate-200">Cancel</button>
                <button onClick={handleSaveItem} className="bg-green-600 text-white px-6 py-2 rounded font-bold shadow-lg hover:bg-green-700">Save Item</button>
            </div>
          </Card>
        )}
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Stock</th>
                <th className="p-3">MOQ</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">
                    {item.name}
                    {item.subUnits?.length > 0 && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1 rounded border border-blue-200">Smart Count</span>}
                  </td>
                  <td className="p-3 font-bold">{item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span></td>
                  <td className="p-3">{item.threshold}</td>
                  <td className="p-3 text-right flex justify-end gap-2">
                    <button onClick={() => { setFormData({...item, subUnits: item.subUnits || []}); setEditingId(item.id); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 className="w-4 h-4" /></button>
                    {userRole === 'owner' && <button onClick={() => handleDeleteClick(item)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // --- NEW: RECEIVING MODULE (CART STYLE) ---
  const StockReceiveView = () => {
    const [selectedId, setSelectedId] = useState('');
    const [qty, setQty] = useState('');
    const [cost, setCost] = useState('');
    const [cart, setCart] = useState([]);

    const selectedItem = inventory.find(i => i.id === selectedId);

    const addToCart = () => {
      if(!selectedId || !qty) return;
      const item = inventory.find(i => i.id === selectedId);
      if (!item) return; // Safety check
      setCart([...cart, { id: selectedId, name: item.name, qty: Number(qty), cost: Number(cost), unit: item.unit }]);
      setSelectedId('');
      setQty('');
      setCost('');
    };

    const removeFromCart = (idx) => {
        const newCart = [...cart];
        newCart.splice(idx, 1);
        setCart(newCart);
    };

    const processReceive = async () => {
        if(!cart.length) return;
        const batch = writeBatch(db);
        
        cart.forEach(item => {
            const currentItem = inventory.find(i => i.id === item.id);
            if(currentItem) {
                const newQty = (currentItem.quantity || 0) + item.qty;
                const updates = { quantity: newQty };
                if(item.cost > 0) updates.cost = item.cost;
                batch.update(doc(db, `organizations/${ORG_ID}/inventory`, item.id), updates);
            }
        });

        await batch.commit();
        addLog('receive', `Received delivery: ${cart.map(c => `${c.name} (+${c.qty})`).join(', ')}`);
        setCart([]);
        alert('Stock Received Successfully!');
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-slate-50 border-2 border-blue-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ArrowDownCircle className="w-5 h-5 text-blue-600"/> Incoming Delivery</h3>
                <div className="flex flex-col md:flex-row gap-2 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-slate-500">Item</label>
                        <select className="w-full p-2 border rounded" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                            <option value="">Select Item...</option>
                            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                        </select>
                    </div>
                    <div className="w-full md:w-32">
                        <label className="text-xs font-bold text-slate-500">Qty Added</label>
                        <input type="number" className="w-full p-2 border rounded" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} />
                    </div>
                    <div className="w-full md:w-32">
                        <label className="text-xs font-bold text-slate-500">New Cost (Opt)</label>
                        <input type="number" className="w-full p-2 border rounded" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} />
                    </div>
                    <button onClick={addToCart} className="bg-blue-600 text-white p-2 rounded w-full md:w-auto font-bold">Add to List</button>
                </div>
                {selectedItem?.subUnits?.length > 0 && (
                    <div className="mt-2 text-xs text-blue-600">
                        <b>Hint:</b> {selectedItem.subUnits.map(s => `${s.name} = ${s.value}${selectedItem.unit}`).join(', ')}
                    </div>
                )}
            </Card>

            {cart.length > 0 && (
                <Card className="p-6">
                    <h4 className="font-bold mb-4">Items to Receive</h4>
                    <table className="w-full text-sm text-left mb-6">
                        <thead className="bg-slate-100"><tr><th className="p-2">Item</th><th className="p-2">Adding</th><th className="p-2">New Cost</th><th className="p-2"></th></tr></thead>
                        <tbody>
                            {cart.map((item, idx) => (
                                <tr key={idx} className="border-b">
                                    <td className="p-2 font-medium">{item.name}</td>
                                    <td className="p-2 text-green-600">+{item.qty} {item.unit}</td>
                                    <td className="p-2">{item.cost ? item.cost : '-'}</td>
                                    <td className="p-2 text-right"><button onClick={() => removeFromCart(idx)} className="text-red-500"><Trash2 className="w-4 h-4"/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={processReceive} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-lg flex justify-center items-center gap-2">
                        <Save className="w-5 h-5"/> Confirm Receipt & Update Stock
                    </button>
                </Card>
            )}
        </div>
    );
  };


  // --- 4. Recipes (Updated with Search Bar) ---
  const RecipesView = () => {
    const [selId, setSelId] = useState(null);
    const [newIng, setNewIng] = useState('');
    const [amt, setAmt] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // New Search State

    // Filter the list based on search term
    const filteredMenuItems = menuItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addNewMenuItem = async () => {
      if (!newItemName.trim()) return;
      await addDoc(collection(db, `organizations/${ORG_ID}/menu`), {
        name: newItemName,
        price: 0,
      });
      setNewItemName('');
      addLog('menu', `Added new item: ${newItemName}`);
    };

    const addIng = async () => {
      if (!selId || !newIng || !amt) return;
      const recipe = recipes.find((r) => r.menuItemId === selId);
      const ingData = { inventoryId: newIng, amount: Number(amt) };
      const colRef = collection(db, `organizations/${ORG_ID}/recipes`);
      if (recipe) {
        const updated = [...recipe.ingredients];
        const idx = updated.findIndex((i) => i.inventoryId === newIng);
        if (idx > -1) updated[idx] = ingData;
        else updated.push(ingData);
        await updateDoc(doc(colRef, recipe.id), { ingredients: updated });
      } else
        await addDoc(colRef, { menuItemId: selId, ingredients: [ingData] });
      setNewIng('');
      setAmt('');
    };

    const remIng = async (rid, iid) => {
      const r = recipes.find((x) => x.id === rid);
      await updateDoc(doc(db, `organizations/${ORG_ID}/recipes`, rid), {
        ingredients: r.ingredients.filter((i) => i.inventoryId !== iid),
      });
    };

    const curRecipe = recipes.find((r) => r.menuItemId === selId);
    const selItem = menuItems.find((m) => m.id === selId);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        {/* LEFT COLUMN: Menu List */}
        <Card className="col-span-1 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b bg-slate-50 space-y-3">
            <h3 className="font-bold text-sm text-slate-500 uppercase">
              Menu Items
            </h3>
            
            {/* 1. ADD NEW ITEM BAR */}
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded p-2 text-sm"
                placeholder="Create New Item..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNewMenuItem()}
              />
              <button
                onClick={addNewMenuItem}
                className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700"
                title="Add New Menu Item"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* 2. NEW SEARCH BAR */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                className="w-full border rounded p-2 pl-8 text-sm bg-white"
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelId(item.id)}
                  className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${
                    selId === item.id
                      ? 'bg-blue-50 text-blue-800 border border-blue-100'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span className="font-medium text-sm">{item.name}</span>
                  <ChevronRight
                    className={`w-4 h-4 ${
                      selId === item.id ? 'text-blue-500' : 'text-slate-300'
                    }`}
                  />
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-slate-400 text-sm italic">
                No items match "{searchTerm}"
              </div>
            )}
          </div>
        </Card>

        {/* RIGHT COLUMN: Ingredients Editor */}
        <Card className="col-span-1 lg:col-span-2 flex flex-col h-full p-6">
          {selId ? (
            <>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-slate-400" />
                Recipe for:{' '}
                <span className="text-blue-600 underline decoration-blue-200">
                  {selItem?.name}
                </span>
              </h3>
              <div className="bg-slate-50 p-4 rounded-lg mb-6 flex gap-2 border border-slate-200">
                <select
                  className="w-full p-2 border rounded flex-1 bg-white"
                  value={newIng}
                  onChange={(e) => setNewIng(e.target.value)}
                >
                  <option value="">Select Raw Ingredient...</option>
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit})
                    </option>
                  ))}
                </select>
                <input
                  className="w-24 p-2 border rounded"
                  type="number"
                  placeholder="Qty"
                  value={amt}
                  onChange={(e) => setAmt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addIng()}
                />
                <button
                  onClick={addIng}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded font-bold shadow-sm transition"
                >
                  Add
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b">
                      <th className="py-2 pl-2">Ingredient</th>
                      <th className="py-2">Quantity Needed</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {curRecipe?.ingredients?.length > 0 ? (
                      curRecipe.ingredients.map((ing, idx) => {
                        const inv = inventory.find(
                          (i) => i.id === ing.inventoryId
                        );
                        return (
                          <tr
                            key={idx}
                            className="border-b hover:bg-slate-50 group"
                          >
                            <td className="py-3 pl-2 font-medium text-slate-700">
                              {inv?.name || (
                                <span className="text-red-400 italic">
                                  Deleted Item
                                </span>
                              )}
                            </td>
                            <td className="py-3 font-mono text-slate-500">
                              {ing.amount}{' '}
                              <span className="text-xs text-slate-400">
                                {inv?.unit}
                              </span>
                            </td>
                            <td className="text-right pr-2">
                              <button
                                onClick={() =>
                                  remIng(curRecipe.id, ing.inventoryId)
                                }
                                className="text-slate-300 hover:text-red-500 transition p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="text-center py-10 text-slate-400 italic"
                        >
                          No ingredients added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <UtensilsCrossed className="w-12 h-12 text-slate-300" />
              </div>
              <p className="font-medium">Select a menu item from the left</p>
              <p className="text-sm opacity-70">
                or create a new one to start.
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  };

  // --- 5. CSV IMPORT (SMART VERSION) ---
  const CSVImportView = () => {
    const fileInputRef = useRef(null);
    const [previewData, setPreviewData] = useState([]);
    const [importStatus, setImportStatus] = useState('');
    const [isReadyToImport, setIsReadyToImport] = useState(false);

    // ANALYZE
    const handleAnalyze = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        const lines = text.split(/\r\n|\n/);
        
        let salesSectionFound = false;
        let nameIdx = -1, qtyIdx = -1;
        let foundItems = [];

        // Scan lines to find the header "Items,name,total..."
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Split by comma, remove quotes
          const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

          // Phase A: Find Header
          if (!salesSectionFound) {
            const nIndex = cells.findIndex(c => c === 'name');
            const qIndex = cells.findIndex(c => c === 'Items');
            if (nIndex !== -1 && qIndex !== -1) {
              console.log(`Found Header at Line ${i}: Name[${nIndex}], Qty[${qIndex}]`);
              salesSectionFound = true;
              nameIdx = nIndex;
              qtyIdx = qIndex;
            }
            continue;
          }

          // Phase B: Capture Data
          if (salesSectionFound) {
            // Safety: Ensure enough columns
            if (cells.length <= Math.max(nameIdx, qtyIdx)) continue;
            
            const itemName = cells[nameIdx];
            const qtyStr = cells[qtyIdx];
            
            if (itemName && qtyStr && !isNaN(parseInt(qtyStr))) {
               const existsInMenu = menuItems.some(m => m.name.toLowerCase() === itemName.toLowerCase());
               foundItems.push({
                 name: itemName,
                 qty: parseInt(qtyStr),
                 status: existsInMenu ? 'Matched' : 'Unknown Item'
               });
            }
          }
        }

        if (foundItems.length > 0) {
          setPreviewData(foundItems);
          setIsReadyToImport(true);
          setImportStatus(`Analysis Complete. Found ${foundItems.length} sales items.`);
        } else {
          setImportStatus('Error: Could not find valid sales data in this CSV.');
          setIsReadyToImport(false);
        }
      };
      reader.readAsText(file);
    };

    // IMPORT
    const handleImport = async () => {
        if (!previewData.length) return;
        
        const batch = writeBatch(db);
        const menuMap = {};
        menuItems.forEach((m) => (menuMap[m.name.trim().toLowerCase()] = m.id));
        
        let updates = {};

        // Calculate deductions
        previewData.forEach(item => {
            if (item.status !== 'Matched') return;
            
            const menuId = menuMap[item.name.toLowerCase()];
            const r = recipes.find(x => x.menuItemId === menuId);
            
            if (r) {
                r.ingredients.forEach(ing => {
                    updates[ing.inventoryId] = (updates[ing.inventoryId] || 0) + (ing.amount * item.qty);
                });
            }
        });

        // Add updates to Batch
        let dbCount = 0;
        Object.keys(updates).forEach(invId => {
            const invItem = inventory.find(i => i.id === invId);
            if (invItem) {
                batch.update(doc(db, `organizations/${ORG_ID}/inventory`, invId), {
                    quantity: invItem.quantity - updates[invId]
                });
                dbCount++;
            }
        });

        if (dbCount > 0) {
            await batch.commit();
            setImportStatus(`Success! Updated inventory for ${dbCount} ingredients.`);
            addLog('sales', `Imported CSV: Processed ${previewData.length} sales.`);
            setIsReadyToImport(false);
            setPreviewData([]);
        } else {
            setImportStatus('No inventory deductions needed (maybe no recipes set up?).');
        }
    };

    return (
      <Card className="p-8 mt-10">
        <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Daily Sales Import</h3>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleAnalyze}
              className="hidden"
            />
            
            {!isReadyToImport && (
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="border-2 border-dashed border-slate-300 p-10 rounded-xl cursor-pointer hover:bg-slate-50 transition"
                >
                  <FileUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="font-bold text-slate-600">Select Sales CSV</p>
                  <p className="text-xs text-slate-400 mt-2">Analyzes file before importing</p>
                </div>
            )}

            {importStatus && (
              <div className={`mt-4 p-3 rounded text-sm font-medium ${
                importStatus.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {importStatus}
              </div>
            )}
        </div>

        {previewData.length > 0 && (
            <div className="mt-8 border-t pt-6">
                <h4 className="font-bold text-sm text-slate-500 mb-4 uppercase">File Preview (Mini Log)</h4>
                <div className="bg-slate-50 rounded-lg border max-h-60 overflow-y-auto mb-6">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                            <tr>
                                <th className="p-3">Item Name</th>
                                <th className="p-3">Sold</th>
                                <th className="p-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewData.map((row, idx) => (
                                <tr key={idx} className="border-b">
                                    <td className="p-3 font-medium">{row.name}</td>
                                    <td className="p-3">{row.qty}</td>
                                    <td className="p-3 text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            row.status === 'Matched' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {isReadyToImport && (
                    <button
                        onClick={handleImport}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 shadow-lg transition flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" /> Confirm & Deduct Inventory
                    </button>
                )}
            </div>
        )}
      </Card>
    );
  };

  const OrderSheetView = () => {
    const orderItems = inventory.filter((i) => i.quantity <= i.threshold);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Order Sheet</h2>
          <button
            onClick={() => window.print()}
            className="bg-slate-800 text-white px-4 py-2 rounded flex gap-2"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Current</th>
                <th className="p-3">Min</th>
                <th className="p-3">To Buy</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-3 font-bold">{item.name}</td>
                  <td className="p-3 text-red-600">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="p-3">{item.threshold}</td>
                  <td className="p-3">
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
                      +{item.threshold - item.quantity} {item.unit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  const StockCountView = () => {
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [counts, setCounts] = useState({});
    const submit = async () => {
      if (!selectedStaffId) return alert('Please select staff.');
      const staffMember = staffList.find((s) => s.id === selectedStaffId);
      const batch = writeBatch(db);
      let updates = false;
      inventory.forEach((item) => {
        if (counts[item.id] !== undefined && counts[item.id] !== '') {
          batch.update(doc(db, `organizations/${ORG_ID}/inventory`, item.id), {
            quantity: Number(counts[item.id]),
          });
          updates = true;
        }
      });
      if (updates) {
        await batch.commit();
        addLog('audit', `Stock take by ${staffMember.name}`, staffMember.name);
        setCounts({});
        alert('Stock Updated');
      } else alert('No changes');
    };
    return (
      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6 items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Stock Verification
            </h2>
            <p className="text-slate-500 text-sm">
              Select who is counting the stock.
            </p>
          </div>
          <select
            className="border p-2 rounded min-w-[200px]"
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
          >
            <option value="">-- Select Staff --</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>
        </div>
        {selectedStaffId ? (
          <>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">System</th>
                    <th className="p-2">Actual Count</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((i) => (
                    <tr key={i.id} className="border-b">
                      <td className="p-2 font-medium">{i.name}</td>
                      <td className="p-2 text-slate-500">
                        {i.quantity} {i.unit}
                      </td>
                      <td className="p-2">
                        {/* ⚠️ NOTE: This StockCountView needs updating to use the SmartCounter component */}
                        <input
                          type="number"
                          className="border w-24 p-1 rounded text-center"
                          placeholder="0"
                          value={counts[i.id] || ''}
                          onChange={(e) =>
                            setCounts({ ...counts, [i.id]: e.target.value })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={submit}
              className="bg-slate-800 text-white w-full py-3 rounded font-bold hover:bg-slate-900 transition"
            >
              Submit Count
            </button>
          </>
        ) : (
          <div className="bg-amber-50 p-8 text-center text-amber-800 rounded border border-amber-200">
            Please select a staff member to begin stock take.
          </div>
        )}
      </Card>
    );
  };

  const ReportsView = () => {
    const logsView = logs.map((l) => (
      <div key={l.id} className="border-b p-3 text-sm flex justify-between">
        <span>
          <span className="font-bold uppercase text-xs mr-2 p-1 bg-slate-100 rounded">
            {l.type}
          </span>
          {l.message}
        </span>
        <span className="text-slate-400 text-xs">
          {l.user} | {l.date}
        </span>
      </div>
    ));
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Activity Log</h3>
          <div className="h-96 overflow-y-auto">{logsView}</div>
        </Card>
      </div>
    );
  };

  if (!user) return <AuthScreen />;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      <div className="w-20 md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 font-bold text-xl flex items-center justify-center md:justify-start gap-2">
          <UtensilsCrossed className="text-orange-500" />
          <span className="hidden md:inline">RestoStock</span>
        </div>
        <nav className="flex-1 px-2 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'dashboard' ? 'bg-orange-600' : 'hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="hidden md:inline">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'inventory' ? 'bg-orange-600' : 'hover:bg-slate-800'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="hidden md:inline">Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('receive')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'receive' ? 'bg-orange-600' : 'hover:bg-slate-800'
            }`}
          >
            <ArrowDownCircle className="w-5 h-5" />
            <span className="hidden md:inline">Receive</span>
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'recipes' ? 'bg-orange-600' : 'hover:bg-slate-800'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="hidden md:inline">Recipes</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'upload' ? 'bg-orange-600' : 'hover:bg-slate-800'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span className="hidden md:inline">Import</span>
          </button>
          <button
            onClick={() => setActiveTab('ordersheet')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'ordersheet'
                ? 'bg-orange-600'
                : 'hover:bg-slate-800'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden md:inline">Order</span>
          </button>
          <button
            onClick={() => setActiveTab('stocktake')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'stocktake' ? 'bg-orange-600' : 'hover:bg-slate-800'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            <span className="hidden md:inline">Check</span>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'staff' ? 'bg-orange-600' : 'hover:bg-slate-800'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="hidden md:inline">Staff</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'reports' ? 'bg-orange-600' : 'hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden md:inline">Logs</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-sm text-slate-400">
            <User className="w-4 h-4" />{' '}
            <span className="truncate w-24 hidden md:block">{user.email}</span>
          </div>
          {userRole === 'owner' && (
            <div className="text-xs text-purple-400 mb-2 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Owner
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800 capitalize">
            {activeTab}
          </h1>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-600">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </header>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'receive' && <StockReceiveView />}
        {activeTab === 'recipes' && <RecipesView />}
        {activeTab === 'upload' && <CSVImportView />}
        {activeTab === 'ordersheet' && <OrderSheetView />}
        {activeTab === 'stocktake' && <StockCountView />}
        {activeTab === 'staff' && <StaffView />}
        {activeTab === 'reports' && <ReportsView />}
      </div>
    </div>
  );
}
