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
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const contenedor = document.getElementById("productos");
const numeroDocumento = document.getElementById("numeroDocumento");
const btnEnviar = document.getElementById("btnEnviar");
const totalHTML = document.getElementById("total");
const btnSalir = document.getElementById("btnSalir");
const btnMisPedidos = document.getElementById("btnMisPedidos");
const btnNuevoPedido = document.getElementById("btnNuevoPedido");

let productos = [];
let pedidoEliminar = null;

// ============================
// FECHA DEL PEDIDO
// ============================

const hoy = new Date();

document.getElementById("fechaPedido").value =
    hoy.toLocaleDateString("es-AR");

// ============================
// CARGAR PRODUCTOS
// ============================

async function cargarProductos(){

    const querySnapshot = await getDocs(collection(db,"productos"));

    productos = [];

    querySnapshot.forEach(doc=>{

        productos.push(doc.data());

    });

    agregarFila();

}

cargarProductos();

// ============================
// AGREGAR FILA
// ============================

function agregarFila(){

    let opciones="";

    productos.forEach(p=>{

        opciones += `
            <option
                value="${p.precio}"
            >
                ${p.nombre}
            </option>
        `;

    });

    contenedor.innerHTML += `

    <div class="producto">

        <select class="productoSelect">

            ${opciones}

        </select>

        <input
            type="number"
            class="cantidad"
            min="0"
            value="1"
        >

        <span class="costoFila">

            $0

        </span>

    </div>

    `;

    calcularTotal();

}

window.agregarFila = agregarFila;
document
    .getElementById("btnAgregarProducto")
    .addEventListener("click", agregarFila);

// ============================
// TOTAL
// ============================

document.addEventListener("input",calcularTotal);

document.addEventListener("change",calcularTotal);

function calcularTotal(){

    let total=0;

    document.querySelectorAll(".producto").forEach(fila=>{

        const precio = Number(fila.querySelector("select").value);

        const cantidad = Number(fila.querySelector(".cantidad").value);

        const costo = precio*cantidad;

        fila.querySelector(".costoFila").innerHTML =
            "$"+costo.toLocaleString("es-AR");

        total += costo;

    });

    totalHTML.innerHTML =
        "$"+total.toLocaleString("es-AR");

}

// ============================
// NUMERO OC
// ============================

numeroDocumento.addEventListener("input",()=>{

    numeroDocumento.value =
        numeroDocumento.value.replace(/\D/g,"");

    if(numeroDocumento.value.length>10){

        numeroDocumento.value =
            numeroDocumento.value.substring(0,10);

    }

});

// ============================
// VALIDAR
// ============================

function documentoValido(){

    const n=numeroDocumento.value;

    return(

        (n.startsWith("47000") && n.length===10)

        ||

        (n.startsWith("4500") && n.length===10)

    );

}

// ============================
// BOTON
// ============================

btnEnviar.addEventListener("click", async () => {

    if (!documentoValido()) {

        document.getElementById("modal").style.display = "flex";

        return;

    }

    const listaProductos = [];

    document.querySelectorAll(".producto").forEach(fila => {

        const select = fila.querySelector(".productoSelect");
        const cantidad = Number(fila.querySelector(".cantidad").value);

        const producto = productos.find(p => p.nombre === select.options[select.selectedIndex].text);

        listaProductos.push({

            nombre: producto.nombre,
            precio: producto.precio,
            unidad: producto.unidad,
            cantidad: cantidad

        });

    });

    const pedido = {

        fechaPedido: document.getElementById("fechaPedido").value,
        fechaEvento: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value,
        lugar: document.getElementById("lugar").value,
        personas: Number(document.getElementById("personas").value),

        productos: listaProductos,

        total: totalHTML.innerText,

        tipoDocumento: document.getElementById("tipoDocumento").value,
        numeroDocumento: numeroDocumento.value,
        comentarios: document.getElementById("comentarios").value,

        usuario: auth.currentUser.email,

        estado: "Pendiente",

        fechaCreacion: serverTimestamp()

    };

    try {

    console.log("Pedido a guardar:", pedido);

    const docRef = await addDoc(collection(db, "pedidos"), pedido);

    console.log("Pedido guardado con ID:", docRef.id);

    alert("Pedido enviado correctamente.");

    location.reload();

    } catch (error) {

    console.error("ERROR FIRESTORE:", error);

    alert("Error al guardar el pedido.");

    }

});

// ============================
// MODAL
// ============================

document
.getElementById("cerrarModal")
.addEventListener("click",()=>{

    document.getElementById("modal").style.display="none";

});
// ============================
// CERRAR SESIÓN
// ============================

btnSalir.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "login.html";

});

// ============================
// MENÚ
// ============================

btnNuevoPedido.addEventListener("click", () => {

    listaPedidos.style.display = "none";

    formularioPedido.style.display = "block";

});

btnMisPedidos.addEventListener("click", () => {

    console.log("CLICK");

    cargarMisPedidos();

});

async function cargarMisPedidos() {

    const q = query(

        collection(db, "pedidos"),

        where("usuario", "==", auth.currentUser.email)

    );

    const snapshot = await getDocs(q);

let html = `

<div class="listaPedidos">

    <h2>Mis pedidos</h2>

`;

    if (snapshot.empty) {

        html += `

            <p>No tenés pedidos realizados.</p>

        `;

    }

    snapshot.forEach(doc => {

        const p = doc.data();

        html += `

        <div class="cardPedido">

            <div class="cardCabecera">

                <strong>${p.fechaEvento}</strong>

                <span class="estado ${p.estado}">

                    ${p.estado}

                </span>

            </div>

            <p>

                <strong>Lugar:</strong>

                ${p.lugar}

            </p>

            <p>

                <strong>Personas:</strong>

                ${p.personas}

            </p>

            <p>

                <strong>Total:</strong>

                ${p.total}

            </p>

<button
    class="btnDetallePedido"
    data-pedido='${JSON.stringify(p)}'
>
    Ver detalle
</button>

<button
    class="btnEliminarPedido"
    data-id="${doc.id}"
>
    Eliminar
</button>

        </div>

        `;

    });
    html += "</div>";

    formularioPedido.style.display = "none";

listaPedidos.style.display = "block";

listaPedidos.innerHTML = html;

}
// ============================
// MODAL DETALLE
// ============================

const modalDetallePedido = document.getElementById("modalDetallePedido");

const dFecha = document.getElementById("dFecha");
const dHora = document.getElementById("dHora");
const dLugar = document.getElementById("dLugar");
const dPersonas = document.getElementById("dPersonas");
const dProductos = document.getElementById("dProductos");
const dTotal = document.getElementById("dTotal");
const dDocumento = document.getElementById("dDocumento");
const dEstado = document.getElementById("dEstado");
const dComentarios = document.getElementById("dComentarios");
const formularioPedido =
    document.getElementById("formularioPedido");

const listaPedidos =
    document.getElementById("listaPedidos");

const cerrarDetallePedido =
    document.getElementById("cerrarDetallePedido");
document.addEventListener("click", (e) => {

    if (!e.target.classList.contains("btnDetallePedido")) return;

    const p = JSON.parse(e.target.dataset.pedido);

    dFecha.innerText = p.fechaEvento || "";
    dHora.innerText = p.hora || "";
    dLugar.innerText = p.lugar || "";
    dPersonas.innerText = p.personas || "";
    dTotal.innerText = p.total || "";
    dDocumento.innerText = p.numeroDocumento || "";
    dComentarios.value = p.comentarios || "";

    dEstado.innerText = p.estado;
    dEstado.className = "estado " + p.estado;

    let html = "";

    p.productos.forEach(prod => {

        html += `
            <p>
                • ${prod.nombre}
                &nbsp;&nbsp;x${prod.cantidad}
            </p>
        `;

    });

    dProductos.innerHTML = html;

    modalDetallePedido.style.display = "flex";

});

cerrarDetallePedido.onclick = () => {

    modalDetallePedido.style.display = "none";

};

// ============================
// ELIMINAR PEDIDO
// ============================

const modalEliminar = document.getElementById("modalEliminar");
const claveEliminar = document.getElementById("claveEliminar");
const cancelarEliminar = document.getElementById("cancelarEliminar");
const confirmarEliminar = document.getElementById("confirmarEliminar");

document.addEventListener("click", (e) => {

    if (!e.target.classList.contains("btnEliminarPedido")) return;

    pedidoEliminar = e.target.dataset.id;

    claveEliminar.value = "";

    modalEliminar.style.display = "flex";

});

cancelarEliminar.onclick = () => {

    modalEliminar.style.display = "none";

    pedidoEliminar = null;

};

confirmarEliminar.onclick = async () => {

    if (!pedidoEliminar) return;

    try {

        const configRef = doc(db, "configuracion", "seguridad");

        const configSnap = await getDoc(configRef);

        if (!configSnap.exists()) {

            alert("No existe la configuración de seguridad.");

            return;

        }

        const config = configSnap.data();

        if (!config.permitirEliminarUsuario) {

            alert("La eliminación de pedidos está deshabilitada.");

            return;

        }

        if (claveEliminar.value !== config.claveEliminar) {

            alert("Clave incorrecta.");

            return;

        }

        await deleteDoc(doc(db, "pedidos", pedidoEliminar));

        modalEliminar.style.display = "none";

        pedidoEliminar = null;

        alert("Pedido eliminado correctamente.");

        cargarMisPedidos();

    } catch (error) {

        console.error(error);

        alert("Error al eliminar el pedido.");

    }

};