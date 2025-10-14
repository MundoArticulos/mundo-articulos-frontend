import React, { useState, useEffect } from 'react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [backendUrl] = useState('http://localhost:4000');
  const [culqiKey, setCulqiKey] = useState(null);
  const [form, setForm] = useState({ title: '', price: '', image: '' });

  useEffect(() => {
    const saved = localStorage.getItem('mundo_products');
    if (saved) setProducts(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('mundo_products', JSON.stringify(products));
  }, [products]);

  const addProduct = (e) => {
    e.preventDefault();
    if (!form.title || !form.price) return alert('Completa título y precio');
    const newP = { id: Date.now(), ...form, price: parseFloat(form.price) };
    setProducts([newP, ...products]);
    setForm({ title: '', price: '', image: '' });
  };

  const addToCart = (p) => setCart([...cart, p]);
  const removeFromCart = (idx) => setCart(cart.filter((_, i) => i !== idx));
  const total = cart.reduce((s, c) => s + Number(c.price || 0), 0);

  const createOrder = async () => {
    if (cart.length === 0) return alert('Carrito vacío');
    const res = await fetch(`${backendUrl}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, amount: total, currency: 'PEN' }),
    });
    const data = await res.json();
    if (!data.ok) return alert('Error creando orden');
    setCulqiKey(data.culqiPublicKey);
    return data.order;
  };

  const payWithCard = async () => {
    const order = await createOrder();
    if (!order) return;
    if (!window.Culqi) {
      const s = document.createElement('script');
      s.src = 'https://checkout.culqi.com/js/v3';
      s.async = true;
      s.onload = () => openCulqi(order);
      document.body.appendChild(s);
    } else {
      openCulqi(order);
    }
  };

  const openCulqi = (order) => {
    const publicKey = culqiKey || window.__CULQI_PUBLIC__;
    if (!publicKey) {
      alert('No se encontró la public key de Culqi. Configura en backend.');
      return;
    }
    window.Culqi.publicKey = publicKey;
    window.Culqi.settings({
      title: 'Mundo Artículos',
      currency: 'PEN',
      description: `Pago Orden ${order.id}`,
      amount: Math.round(total * 100),
    });
    window.Culqi.open();
    window.Culqi.tokenListener = async function (token) {
      const tokenId = token.id || (token.card && token.card.id);
      if (!tokenId) return alert('No se generó token');
      const res = await fetch(`${backendUrl}/api/charge-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenId, amount: total, orderId: order.id, email: 'cliente@example.com' }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('Pago realizado correctamente (simulado).');
        console.log('charge response', data.data);
        setCart([]);
      } else alert('Error en el cargo');
    };
  };

  const payWithYape = async () => {
    const order = await createOrder();
    if (!order) return;
    const res = await fetch(`${backendUrl}/api/yape-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total, orderId: order.id, note: 'Pago Yape - Mundo Artículos' }),
    });
    const data = await res.json();
    if (!data.ok) return alert('Error generando QR');
    const win = window.open('', '_blank', 'width=400,height=700');
    win.document.write(`<h2>Pagar con Yape</h2><p>Escanea este QR con Yape</p><img src="${data.qrDataUrl}" />`);
    alert('Se abrió una ventana con el QR de Yape.');
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Mundo Artículos" className="w-16 h-16 rounded-md shadow" />
          <div>
            <h1 className="text-2xl font-bold">Mundo Artículos</h1>
            <p className="text-sm text-gray-600">Tienda moderna y elegante — vende tus productos</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-white shadow rounded">Iniciar sesión</button>
          <div className="text-right">
            <div className="text-sm text-gray-500">Carrito</div>
            <div className="font-medium">{cart.length} items — S/ {total.toFixed(2)}</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8 grid md:grid-cols-3 gap-8">
        <section className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">Añadir producto</h2>
            <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="Título" className="p-3 border rounded" />
              <input value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} placeholder="Precio (ej: 49.90)" className="p-3 border rounded" />
              <input value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} placeholder="URL imagen (opcional)" className="p-3 border rounded" />
              <button className="md:col-span-3 px-4 py-2 bg-green-600 text-white rounded">Agregar producto</button>
            </form>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            {products.map(p=> (
              <article key={p.id} className="bg-white rounded-xl p-4 shadow flex gap-4">
                <img src={p.image || 'https://via.placeholder.com/120'} alt="" className="w-28 h-28 rounded object-cover" />
                <div className="flex-1">
                  <h3 className="font-semibold">{p.title}</h3>
                  <div className="text-gray-500">S/ {Number(p.price).toFixed(2)}</div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={()=>addToCart(p)} className="px-3 py-1 bg-blue-600 text-white rounded">Agregar</button>
                    <button onClick={()=>setProducts(products.filter(x=>x.id!==p.id))} className="px-3 py-1 bg-gray-200 rounded">Eliminar</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold">Resumen del carrito</h3>
          <ul className="divide-y mt-4">
            {cart.map((c, i) => (
              <li key={i} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm text-gray-500">S/ {Number(c.price).toFixed(2)}</div>
                </div>
                <div>
                  <button onClick={()=>removeFromCart(i)} className="px-2 py-1 rounded bg-red-100 text-red-600">Quitar</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold">S/ {total.toFixed(2)}</div>
          </div>

          <div className="mt-6 grid gap-3">
            <button onClick={payWithCard} className="px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl">Pagar con tarjeta</button>
            <button onClick={payWithYape} className="px-4 py-3 border-2 border-dashed rounded-xl">Pagar con Yape (QR)</button>
          </div>
        </aside>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 text-center text-sm text-gray-500">© {new Date().getFullYear()} Mundo Artículos</footer>
    </div>
  );
}