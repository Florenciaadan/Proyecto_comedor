import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
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

    window.location.href = "index.html";

});

btnMisPedidos.addEventListener("click", () => {

    alert("Próximamente se mostrarán los pedidos realizados.");

});