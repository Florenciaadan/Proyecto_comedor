import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const contenedor = document.getElementById("productos");
const numeroDocumento = document.getElementById("numeroDocumento");
const btnEnviar = document.getElementById("btnEnviar");
const totalHTML = document.getElementById("total");

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

btnEnviar.addEventListener("click",()=>{

    if(!documentoValido()){

        document.getElementById("modal").style.display="flex";

        return;

    }

    alert("Pedido listo para guardar en Firebase.");

});

// ============================
// MODAL
// ============================

document
.getElementById("cerrarModal")
.addEventListener("click",()=>{

    document.getElementById("modal").style.display="none";

});