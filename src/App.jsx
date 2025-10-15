import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://mundo-articulos-backend.onrender.com"; // ✅ tu backend en Render

function App() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/productos`)
      .then((res) => setProductos(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Mundo Artículos</h1>
      {productos.map((p) => (
        <div key={p.id}>{p.nombre}</div>
      ))}
    </div>
  );
}

export default App;
