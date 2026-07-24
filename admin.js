import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const contenido = document.getElementById("contenido");

// ===============================
// VERIFICAR SESIÓN
// ===============================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "index.html";

    }

});

// ===============================
// BOTONES
// ===============================

document.getElementById("btnProductos").onclick = cargarProductos;

document.getElementById("btnPedidos").onclick = cargarPedidos;

document.getElementById("btnSalir").onclick = async () => {

    try {

        await signOut(auth);

        window.location.href = "index.html";

    } catch (error) {

        console.error(error);

        alert("No se pudo cerrar la sesión.");

    }

};

// ===============================
// PRODUCTOS
// ===============================

async function cargarProductos() {

    contenido.innerHTML = "<h2>Productos</h2>";

    const productos = await getDocs(collection(db, "productos"));

    contenido.innerHTML += `
        <table border="1" width="100%" cellspacing="0" cellpadding="8">

            <tr>

                <th>Producto</th>

                <th>Precio</th>

                <th>Unidad</th>

                <th>Activo</th>

            </tr>
    `;

    productos.forEach(doc => {

        const p = doc.data();

        contenido.innerHTML += `
            <tr>

                <td>${p.nombre}</td>

                <td>$${p.precio}</td>

                <td>${p.unidad}</td>

                <td>${p.activo ? "Sí" : "No"}</td>

            </tr>
        `;

    });

    contenido.innerHTML += `
        </table>

        <br>

        <button id="btnNuevoProducto">

            Agregar producto

        </button>
    `;

}

// ===============================
// PEDIDOS
// ===============================

async function cargarPedidos() {

    contenido.innerHTML = `

        <h2>Pedidos</h2>

        <p>Todavía no hay pedidos.</p>

    `;

}

// ===============================
// INICIO
// ===============================

cargarProductos();

document.addEventListener("click",(e)=>{

    if(e.target.id==="btnNuevoProducto"){

        document.getElementById("modalProducto").style.display="flex";

    }

});

document.getElementById("cerrarProducto").onclick=()=>{

    document.getElementById("modalProducto").style.display="none";

};