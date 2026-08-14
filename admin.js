import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
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

    const snapshot = await getDocs(
        collection(db, "pedidos")
    );

    const pedidos = [];

    snapshot.forEach(docPedido => {

        pedidos.push({
            id: docPedido.id,
            ...docPedido.data()
        });

    });

    pedidosCache = pedidos;

    renderizarPedidos();

}


// ===============================
// RENDERIZAR PEDIDOS
// ===============================

function renderizarPedidos() {

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const futuros = [];
    const pasados = [];

    pedidosCache.forEach(pedido => {

        if (!pedido.fechaEvento) {

            futuros.push(pedido);

            return;

        }

        const fechaEvento =
            new Date(pedido.fechaEvento + "T00:00:00");

        if (fechaEvento < hoy) {

            pasados.push(pedido);

        } else {

            futuros.push(pedido);

        }

    });


    const pendientes =
        futuros.filter(
            p => p.estado === "Pendiente"
        ).length;

    const aceptados =
        futuros.filter(
            p =>
                p.estado === "Aprobado" ||
                p.estado === "Aceptado"
        ).length;

    const rechazados =
        futuros.filter(
            p => p.estado === "Rechazado"
        ).length;


    let html = `

        <div class="cabeceraPedidos">

            <div>

                <h2>Pedidos</h2>

                <p class="subtituloPedidos">
                    Gestioná los pedidos del comedor
                </p>

            </div>

            <button
                id="btnEliminarSeleccionados"
                class="btnEliminarSeleccionados"
                disabled
            >
                🗑 Eliminar seleccionados
            </button>

        </div>


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

                <h3>Aceptados</h3>

                <h1>${aceptados}</h1>

            </div>


            <div
                class="cardEstado rechazado"
                data-estado="Rechazado"
            >

                <h3>Rechazados</h3>

                <h1>${rechazados}</h1>

            </div>


            <div
                class="cardEstado pasado"
                data-estado="Pasados"
            >

                <h3>Pasados</h3>

                <h1>${pasados.length}</h1>

            </div>

        </div>


        <div class="barraPedidos">

            <input
                id="buscarPedido"
                placeholder="Buscar usuario o lugar..."
            >

            <select id="filtroEstado">

                <option value="Todos">
                    Todos los futuros
                </option>

                <option value="Pendiente">
                    Pendientes
                </option>

                <option value="Aprobado">
                    Aceptados
                </option>

                <option value="Rechazado">
                    Rechazados
                </option>

                <option value="Pasados">
                    Pedidos pasados
                </option>

            </select>

        </div>


        <div class="seleccionPedidos">

            <label>

                <input
                    type="checkbox"
                    id="seleccionarTodos"
                >

                Seleccionar todos

            </label>

            <span id="cantidadSeleccionados">
                0 seleccionados
            </span>

        </div>


        <div id="contenedorPedidos">

            ${generarTablaPedidos(
                futuros,
                "Pedidos futuros"
            )}

            ${generarTablaPedidos(
                pasados,
                "Pedidos pasados",
                true
            )}

        </div>

    `;


    contenido.innerHTML = html;

    actualizarBotonEliminar();

}


// ===============================
// GENERAR TABLA
// ===============================

function generarTablaPedidos(
    pedidos,
    titulo,
    esPasados = false
) {

    let html = `

        <section
            class="seccionPedidos ${esPasados ? "seccionPasados" : ""}"
            data-seccion="${esPasados ? "Pasados" : "Futuros"}"
        >

            <div class="tituloSeccionPedidos">

                <div>

                    <h2>${titulo}</h2>

                    <span>
                        ${pedidos.length}
                        pedido${pedidos.length === 1 ? "" : "s"}
                    </span>

                </div>

            </div>


            <div class="tablaScroll">

                <table class="tablaProductos">

                    <thead>

                        <tr>

                            <th class="colSeleccion">

                                <span>✓</span>

                            </th>

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


    if (pedidos.length === 0) {

        html += `

            <tr>

                <td
                    colspan="7"
                    class="sinPedidos"
                >

                    No hay pedidos en esta sección.

                </td>

            </tr>

        `;

    }


    pedidos.forEach(pedido => {

        let estado =
            pedido.estado || "Pendiente";

        if (estado === "Aprobado") {
            estado = "Aceptado";
        }


        html += `

            <tr
                class="filaPedido"
                data-id="${pedido.id}"
                data-estado-original="${pedido.estado || "Pendiente"}"
                data-pasado="${esPasados}"
            >

                <td class="colSeleccion">

                    <input
                        type="checkbox"
                        class="checkPedido"
                        data-id="${pedido.id}"
                    >

                </td>


                <td>

                    ${pedido.fechaEvento || "-"}

                </td>


                <td>

                    ${pedido.usuario || "-"}

                </td>


                <td>

                    ${pedido.lugar || "-"}

                </td>


                <td>

                    ${pedido.total || "-"}

                </td>


                <td>

                    <span
                        class="estado ${pedido.estado || "Pendiente"}"
                    >

                        ${estado}

                    </span>

                </td>


                <td>

                    <button
                        class="btnVerPedido"
                        data-id="${pedido.id}"
                        title="Ver pedido"
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

            </div>

        </section>

    `;


    return html;

}


// ===============================
// ACTUALIZAR BOTON ELIMINAR
// ===============================

function actualizarBotonEliminar() {

    const checks =
        document.querySelectorAll(
            ".checkPedido:checked"
        );

    const boton =
        document.getElementById(
            "btnEliminarSeleccionados"
        );

    const contador =
        document.getElementById(
            "cantidadSeleccionados"
        );


    const cantidad =
        checks.length;


    if (boton) {

        boton.disabled =
            cantidad === 0;

    }


    if (contador) {

        contador.innerText =
            cantidad +
            (
                cantidad === 1
                    ? " seleccionado"
                    : " seleccionados"
            );

    }

}


// ===============================
// SELECCIONAR PEDIDOS
// ===============================

document.addEventListener(
    "change",
    e => {

        if (
            e.target.classList.contains(
                "checkPedido"
            )
        ) {

            actualizarBotonEliminar();

        }


        if (
            e.target.id ===
            "seleccionarTodos"
        ) {

            const checks =
                document.querySelectorAll(
                    ".checkPedido"
                );


            checks.forEach(check => {

                check.checked =
                    e.target.checked;

            });


            actualizarBotonEliminar();

        }


        if (
            e.target.id ===
            "filtroEstado"
        ) {

            filtrarPedidos();

        }

    }
);


// ===============================
// ELIMINAR SELECCIONADOS
// ===============================

document.addEventListener(
    "click",
    async e => {

        if (
            !e.target.closest(
                "#btnEliminarSeleccionados"
            )
        ) {
            return;
        }


        const seleccionados =
            Array.from(
                document.querySelectorAll(
                    ".checkPedido:checked"
                )
            ).map(
                check =>
                    check.dataset.id
            );


        if (
            seleccionados.length === 0
        ) {

            return;

        }


        const confirmar =
            confirm(
                `¿Está seguro de eliminar ${seleccionados.length} pedido${seleccionados.length === 1 ? "" : "s"}?\n\nEsta acción no se puede deshacer.`
            );


        if (!confirmar) {

            return;

        }


        try {

            for (
                const id of seleccionados
            ) {

                await deleteDoc(
                    doc(
                        db,
                        "pedidos",
                        id
                    )
                );

            }


            alert(
                "Los pedidos seleccionados fueron eliminados."
            );


            await cargarPedidos();


        } catch (error) {

            console.error(
                "Error eliminando pedidos:",
                error
            );


            alert(
                "Ocurrió un error al eliminar los pedidos."
            );

        }

    }
);


// ===============================
// BUSCADOR
// ===============================

document.addEventListener(
    "input",
    e => {

        if (
            e.target.id !==
            "buscarPedido"
        ) {

            return;

        }


        filtrarPedidos();

    }
);


// ===============================
// FILTRAR PEDIDOS
// ===============================

function filtrarPedidos() {

    const input =
        document.getElementById(
            "buscarPedido"
        );

    const select =
        document.getElementById(
            "filtroEstado"
        );


    if (!input || !select) {
        return;
    }


    const texto =
        input.value
            .toLowerCase()
            .trim();


    const filtro =
        select.value;


    document
        .querySelectorAll(
            ".filaPedido"
        )
        .forEach(fila => {


            const id =
                fila.dataset.id;


            const pedido =
                pedidosCache.find(
                    p => p.id === id
                );


            if (!pedido) {
                return;
            }


            const esPasado =
                fila.dataset.pasado === "true";


            const coincideTexto =
                (pedido.usuario || "")
                    .toLowerCase()
                    .includes(texto)

                ||

                (pedido.lugar || "")
                    .toLowerCase()
                    .includes(texto);


            let coincideFiltro = true;


            if (filtro === "Pasados") {

                coincideFiltro =
                    esPasado;

            }

            else if (filtro === "Todos") {

                coincideFiltro =
                    !esPasado;

            }

            else {

                coincideFiltro =
                    !esPasado &&
                    (
                        pedido.estado ===
                            filtro
                        ||

                        (
                            filtro === "Aprobado" &&
                            pedido.estado === "Aceptado"
                        )
                    );

            }


            fila.style.display =
                coincideTexto &&
                coincideFiltro
                    ? ""
                    : "none";

        });


    // Mostrar/ocultar secciones
    document
        .querySelectorAll(
            ".seccionPedidos"
        )
        .forEach(seccion => {

            const filas =
                seccion.querySelectorAll(
                    ".filaPedido"
                );


            const hayVisible =
                Array.from(filas)
                    .some(
                        fila =>
                            fila.style.display !==
                            "none"
                    );


            seccion.style.display =
                hayVisible
                    ? ""
                    : "none";

        });

}


// ===============================
// CLICK EN TARJETAS
// ===============================

document.addEventListener(
    "click",
    e => {

        const tarjeta =
            e.target.closest(
                ".cardEstado"
            );


        if (!tarjeta) {
            return;
        }


        const filtro =
            document.getElementById(
                "filtroEstado"
            );


        if (!filtro) {
            return;
        }


        filtro.value =
            tarjeta.dataset.estado;


        filtrarPedidos();

    }
);

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

    try {

        const nombre = document.getElementById("nuevoNombre").value.trim();

        const precio = Number(document.getElementById("nuevoPrecio").value);

        const unidad = document.getElementById("nuevaUnidad").value;

        const activo =
            document.getElementById("nuevoEstado").value === "true";

        if (nombre === "") {

            alert("Ingrese el nombre del producto.");

            return;

        }

        if (precio <= 0) {

            alert("Ingrese un precio válido.");

            return;

        }

        if (idProductoEditar) {

            await updateDoc(

                doc(db, "productos", idProductoEditar),

                {

                    nombre,
                    precio,
                    unidad,
                    activo

                }

            );

        } else {

            await addDoc(

                collection(db, "productos"),

                {

                    nombre,
                    precio,
                    unidad,
                    activo

                }

            );

        }

        idProductoEditar = null;

        document.getElementById("modalProducto").style.display = "none";

        cargarProductos();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

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