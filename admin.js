import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const contenido = document.getElementById("contenido");
let idProductoEditar = null;
let pedidosCache = [];

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

async function cargarPedidos() {

    const snapshot = await getDocs(collection(db, "pedidos"));

    const pedidos = [];

    snapshot.forEach(doc => {

        pedidos.push({
            id: doc.id,
            ...doc.data()
        });

    });
        pedidosCache = pedidos;

    const pendientes = pedidos.filter(p => p.estado === "Pendiente").length;
    const aprobados = pedidos.filter(p => p.estado === "Aprobado").length;
    const entregados = pedidos.filter(p => p.estado === "Entregado").length;
    const rechazados = pedidos.filter(p => p.estado === "Rechazado").length;

    let html = `

    <div class="dashboard">

<div
    class="cardEstado pendiente"
    data-estado="Pendiente"
>

    <h3>Pendientes</h3>

    <h1>${pendientes}</h1>

</div>

        <div
    class="cardEstado aprobado"
    data-estado="Aprobado"
>

            <h3>Aprobados</h3>

            <h1>${aprobados}</h1>

        </div>

<div
    class="cardEstado entregado"
    data-estado="Entregado"
>

            <h3>Entregados</h3>

            <h1>${entregados}</h1>

        </div>

<div
    class="cardEstado rechazado"
    data-estado="Rechazado"
>

            <h3>Rechazados</h3>

            <h1>${rechazados}</h1>

        </div>

    </div>

    <div class="barraPedidos">

        <input
            id="buscarPedido"
            placeholder="Buscar usuario o lugar..."
        >

        <select id="filtroEstado">

            <option value="Todos">Todos</option>
            <option>Pendiente</option>
            <option>Aprobado</option>
            <option>Entregado</option>
            <option>Rechazado</option>

        </select>

    </div>

    <table class="tablaProductos">

        <thead>

            <tr>

                <th>Fecha</th>
                <th>Usuario</th>
                <th>Lugar</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>

            </tr>

        </thead>

        <tbody>

    `;

    pedidos.forEach(p => {

        html += `

        <tr>

            <td>${p.fechaEvento || "-"}</td>

            <td>${p.usuario || "-"}</td>

            <td>${p.lugar || "-"}</td>

            <td>${p.total || "-"}</td>

            <td>

                <span class="estado ${p.estado}">

                    ${p.estado}

                </span>

            </td>

            <td>

                <button
                    class="btnVerPedido"
                    data-id="${p.id}"
                >

                    👁

                </button>

            </td>

        </tr>

        `;

    });

    html += `

        </tbody>

    </table>

    `;

    contenido.innerHTML = html;

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

document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("btnVerPedido")) return;

    const id = e.target.dataset.id;

    const snapshot = await getDocs(collection(db, "pedidos"));

    snapshot.forEach(docPedido => {

        if (docPedido.id !== id) return;

        const p = docPedido.data();

        document.getElementById("detalleUsuario").innerText =
            p.usuario || "";

        document.getElementById("detalleFecha").innerText =
            p.fechaEvento || "";

        document.getElementById("detalleHora").innerText =
            p.hora || "";

        document.getElementById("detalleLugar").innerText =
            p.lugar || "";

        document.getElementById("detallePersonas").innerText =
            p.personas || "";

        document.getElementById("detalleTotal").innerText =
            p.total || "";

        document.getElementById("detalleDocumento").innerText =
            p.numeroDocumento || "";

        document.getElementById("detalleComentarios").value =
            p.comentarios || "";

        let productosHTML = "";

        if (p.productos) {

            p.productos.forEach(prod => {

                productosHTML += `
                    <p>
                        • ${prod.nombre}
                        &nbsp;&nbsp;
                        x${prod.cantidad}
                    </p>
                `;

            });

        }

        document.getElementById("detalleProductos").innerHTML =
            productosHTML;

        document.getElementById("modalPedido").style.display = "flex";

    });

});

document.getElementById("cerrarPedido").onclick = () => {

    document.getElementById("modalPedido").style.display = "none";

};

// ===============================
// BUSCADOR Y FILTRO
// ===============================

document.addEventListener("input", (e) => {

    if (e.target.id !== "buscarPedido") return;

    filtrarPedidos();

});

document.addEventListener("change", (e) => {

    if (e.target.id !== "filtroEstado") return;

    filtrarPedidos();

});

function filtrarPedidos() {

    const texto = document.getElementById("buscarPedido").value.toLowerCase();

    const estado = document.getElementById("filtroEstado").value;

    document.querySelectorAll(".tablaProductos tbody tr").forEach((fila, index) => {

        const pedido = pedidosCache[index];

        const coincideTexto =
            (pedido.usuario || "").toLowerCase().includes(texto) ||
            (pedido.lugar || "").toLowerCase().includes(texto);

        const coincideEstado =
            estado === "Todos" || pedido.estado === estado;

        fila.style.display =
            coincideTexto && coincideEstado ? "" : "none";

    });

}

// ===============================
// CLICK EN TARJETAS
// ===============================

document.addEventListener("click", (e) => {

    const tarjeta = e.target.closest(".cardEstado");

    if (!tarjeta) return;

    document.getElementById("filtroEstado").value =
        tarjeta.dataset.estado;

    filtrarPedidos();

});

// ===============================
// INICIO
// ===============================

cargarProductos();