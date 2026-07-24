import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const contenido = document.getElementById("contenido");
let idProductoEditar = null;

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

    await signOut(auth);

    window.location.href = "index.html";

};

// ===============================
// PRODUCTOS
// ===============================

async function cargarProductos(){

    const snapshot = await getDocs(collection(db,"productos"));

    let html = `

        <h2>Productos</h2>

        <table class="tablaProductos">

            <thead>

                <tr>

                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Unidad</th>
                    <th>Estado</th>
                    <th></th>

                </tr>

            </thead>

            <tbody>

    `;

    snapshot.forEach(doc=>{

        const p = doc.data();

        html += `

            <tr>

                <td>${p.nombre}</td>

                <td>$ ${Number(p.precio).toLocaleString("es-AR")}</td>

                <td>${p.unidad}</td>

                <td>${p.activo ? "🟢 Activo" : "🔴 Inactivo"}</td>

                <td>

                    <button
    class="btnEditar"
    data-id="${doc.id}"
    data-nombre="${p.nombre}"
    data-precio="${p.precio}"
    data-unidad="${p.unidad}"
    data-activo="${p.activo}"
>

✏️

</button>

                </td>

            </tr>

        `;

    });

    html += `

            </tbody>

        </table>

        <br>

        <button id="btnNuevoProducto">

            + Agregar producto
            

        </button>
        

    `;

    contenido.innerHTML = html;

}

// ===============================
// PEDIDOS
// ===============================

function cargarPedidos(){

    contenido.innerHTML = `

        <h2>Pedidos</h2>

        <p>No hay pedidos todavía.</p>

    `;

}

// ===============================
// MODAL
// ===============================

document.addEventListener("click",(e)=>{

    if(e.target.id==="btnNuevoProducto"){

        idProductoEditar = null;

        document.getElementById("nuevoNombre").value = "";
        document.getElementById("nuevoPrecio").value = "";
        document.getElementById("nuevaUnidad").selectedIndex = 0;
        document.getElementById("nuevoEstado").value = "true";

        document.getElementById("modalProducto").style.display="flex";

    }

});

document.getElementById("cerrarProducto").onclick=()=>{

    document.getElementById("modalProducto").style.display="none";

};
document.addEventListener("click",(e)=>{

    if(!e.target.classList.contains("btnEditar")) return;

    idProductoEditar = e.target.dataset.id;

    document.getElementById("nuevoNombre").value = e.target.dataset.nombre;

    document.getElementById("nuevoPrecio").value = e.target.dataset.precio;

    document.getElementById("nuevaUnidad").value = e.target.dataset.unidad;

    document.getElementById("nuevoEstado").value = e.target.dataset.activo;

    document.getElementById("modalProducto").style.display="flex";

});
document.getElementById("guardarProducto").onclick = async () => {

    const nombre = document.getElementById("nuevoNombre").value.trim();

    const precio = Number(document.getElementById("nuevoPrecio").value);

    const unidad = document.getElementById("nuevaUnidad").value;

    const activo = document.getElementById("nuevoEstado").value === "true";

    if(nombre===""){

        alert("Ingrese el nombre del producto.");

        return;

    }

    if(precio<=0){

        alert("Ingrese un precio válido.");

        return;

    }

if(idProductoEditar){

    await updateDoc(

        doc(db,"productos",idProductoEditar),

        {

            nombre,

            precio,

            unidad,

            activo

        }

    );

}
else{

    await addDoc(

        collection(db,"productos"),

        {

            nombre,

            precio,

            unidad,

            activo

        }

    );

}

idProductoEditar = null;

    document.getElementById("modalProducto").style.display="none";

    document.getElementById("nuevoNombre").value="";

    document.getElementById("nuevoPrecio").value="";

    document.getElementById("nuevaUnidad").selectedIndex=0;

    document.getElementById("nuevoEstado").selectedIndex=0;

    cargarProductos();

};

// ===============================
// INICIO
// ===============================

cargarProductos();