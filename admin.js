import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from "./firebase.js";

import { db } from "./firebase.js";

import {

collection,

getDocs

} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const contenido = document.getElementById("contenido");

document
.getElementById("btnProductos")
.onclick = cargarProductos;

document
.getElementById("btnPedidos")
.onclick = cargarPedidos;

async function cargarProductos(){

    contenido.innerHTML="<h2>Productos</h2>";

    const productos = await getDocs(collection(db,"productos"));

    contenido.innerHTML+=`

        <table border="1" width="100%" cellspacing="0">

            <tr>

                <th>Producto</th>

                <th>Precio</th>

                <th>Unidad</th>

                <th>Activo</th>

            </tr>

        `;

    productos.forEach(doc=>{

        const p = doc.data();

        contenido.innerHTML+=`

            <tr>

                <td>${p.nombre}</td>

                <td>$${p.precio}</td>

                <td>${p.unidad}</td>

                <td>${p.activo?"Sí":"No"}</td>

            </tr>

        `;

    });

    contenido.innerHTML+=`

        </table>

        <br>

        <button>

            Agregar producto

        </button>

    `;

}

async function cargarPedidos(){

    contenido.innerHTML=`

        <h2>

            Pedidos

        </h2>

        <p>

            Todavía no hay pedidos.

        </p>

    `;

}

cargarProductos();