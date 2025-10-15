import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://mundo-articulos-backend.onrender.com"; // backend Render

function App() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/productos`)
      .then((res) => setProductos(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="app-container">
      {/* 🔹 Aquí puedes dejar tu navbar, hero, o componentes anteriores */}
      <h1>Mundo Artículos</h1>

      {/* 🔹 Mostrar productos traídos del backend */}
      <section className="productos">
        {productos.map((p) => (
          <div key={p.id} className="producto-card">
            <h3>{p.nombre}</h3>
            <p>{p.descripcion}</p>
            <strong>S/. {p.precio}</strong>
          </div>
        ))}
      </section>

      {/* 🔹 Resto de tus secciones anteriores */}
    </div>
  );
}

export default App;
