import { db, auth } from "./firebase.js";

import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";

emailjs.init({
    publicKey: "bUNcS8Ra993mmhOA0"
});

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


// ======================================================
// ELEMENTOS
// ======================================================

const contenedor = document.getElementById("productos");
const numeroDocumento = document.getElementById("numeroDocumento");
const btnEnviar = document.getElementById("btnEnviar");
const totalHTML = document.getElementById("total");

const btnSalir = document.getElementById("btnSalir");
const btnMisPedidos = document.getElementById("btnMisPedidos");
const btnNuevoPedido = document.getElementById("btnNuevoPedido");

let productos = [];
let pedidoEliminar = null;


// ======================================================
// FECHA DEL PEDIDO
// ======================================================

const fechaPedido = document.getElementById("fechaPedido");

if (fechaPedido) {

    const hoy = new Date();

    fechaPedido.value =
        hoy.toLocaleDateString("es-AR");

}


// ======================================================
// CARGAR PRODUCTOS
// ======================================================

async function cargarProductos() {

    try {

        const querySnapshot =
            await getDocs(
                collection(db, "productos")
            );

        productos = [];

        querySnapshot.forEach(docProducto => {

            const producto =
                docProducto.data();

            // Mostrar solamente productos activos
            if (producto.activo !== false) {

                productos.push(producto);

            }

        });

        // Agregar una fila solamente si no existe ninguna
        if (
            contenedor &&
            document.querySelectorAll(".producto").length === 0
        ) {

            agregarFila();

        }

    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );

        alert(
            "No se pudieron cargar los productos."
        );

    }

}

cargarProductos();


// ======================================================
// AGREGAR FILA DE PRODUCTO
// ======================================================

function agregarFila() {

    if (!contenedor) {
        return;
    }

    if (productos.length === 0) {

        alert(
            "No hay productos activos disponibles."
        );

        return;

    }

    let opciones = "";

    productos.forEach((producto, index) => {

        opciones += `
            <option value="${index}">
                ${escapeHtml(producto.nombre)}
            </option>
        `;

    });

    contenedor.insertAdjacentHTML(
        "beforeend",
        `
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
        `
    );

    calcularTotal();

}

window.agregarFila = agregarFila;


const btnAgregarProducto =
    document.getElementById(
        "btnAgregarProducto"
    );

if (btnAgregarProducto) {

    btnAgregarProducto.addEventListener(
        "click",
        agregarFila
    );

}


// ======================================================
// CALCULAR TOTAL
// ======================================================

document.addEventListener(
    "input",
    calcularTotal
);

document.addEventListener(
    "change",
    calcularTotal
);


function calcularTotal() {

    if (!totalHTML) {
        return;
    }

    let total = 0;

    document
        .querySelectorAll(".producto")
        .forEach(fila => {

            const select =
                fila.querySelector(
                    ".productoSelect"
                );

            const cantidadInput =
                fila.querySelector(
                    ".cantidad"
                );

            const costoFila =
                fila.querySelector(
                    ".costoFila"
                );

            if (
                !select ||
                !cantidadInput
            ) {
                return;
            }

            const indice =
                Number(select.value);

            const producto =
                productos[indice];

            if (!producto) {
                return;
            }

            const precio =
                Number(producto.precio) || 0;

            const cantidad =
                Number(cantidadInput.value) || 0;

            const costo =
                precio * cantidad;

            if (costoFila) {

                costoFila.innerHTML =
                    "$" +
                    costo.toLocaleString(
                        "es-AR"
                    );

            }

            total += costo;

        });

    totalHTML.innerHTML =
        "$" +
        total.toLocaleString(
            "es-AR"
        );

}


// ======================================================
// NUMERO OC / PD
// ======================================================

if (numeroDocumento) {

    numeroDocumento.addEventListener(
        "input",
        () => {

            numeroDocumento.value =
                numeroDocumento.value.replace(
                    /\D/g,
                    ""
                );

            if (
                numeroDocumento.value.length > 10
            ) {

                numeroDocumento.value =
                    numeroDocumento.value.substring(
                        0,
                        10
                    );

            }

        }
    );

}


// ======================================================
// VALIDAR DOCUMENTO
// ======================================================

function documentoValido() {

    if (!numeroDocumento) {
        return false;
    }

    const n = numeroDocumento.value.trim();

    const tipo =
        document.getElementById("tipoDocumento")?.value || "";

    if (n.length !== 10) {
        return false;
    }

    const numero = Number(n);

    if (tipo === "PD") {

        return (
            numero >= 4700042009 &&
            numero <= 4700050000
        );

    }

    if (tipo === "OC") {

        return (
            numero >= 4500104325 &&
            numero <= 4500999999
        );

    }

    return false;
}


// ======================================================
// ENVIAR PEDIDO
// ======================================================

if (btnEnviar) {

    btnEnviar.addEventListener(
        "click",
        async () => {

            // ------------------------------------------
            // VALIDAR DOCUMENTO
            // ------------------------------------------

            if (!documentoValido()) {

                const modal =
                    document.getElementById(
                        "modal"
                    );

                if (modal) {

                    modal.style.display =
                        "flex";

                }

                return;

            }


            // ------------------------------------------
            // VALIDAR SESION
            // ------------------------------------------

            if (!auth.currentUser) {

                alert(
                    "La sesión expiró. Volvé a iniciar sesión."
                );

                return;

            }


            // ------------------------------------------
            // ARMAR LISTA DE PRODUCTOS
            // ------------------------------------------

            const listaProductos = [];

            document
                .querySelectorAll(".producto")
                .forEach(fila => {

                    const select =
                        fila.querySelector(
                            ".productoSelect"
                        );

                    const cantidadInput =
                        fila.querySelector(
                            ".cantidad"
                        );

                    if (
                        !select ||
                        !cantidadInput
                    ) {
                        return;
                    }

                    const indice =
                        Number(select.value);

                    const cantidad =
                        Number(
                            cantidadInput.value
                        );

                    const producto =
                        productos[indice];

                    if (
                        !producto ||
                        cantidad <= 0
                    ) {
                        return;
                    }

                    listaProductos.push({

                        nombre:
                            producto.nombre,

                        precio:
                            Number(
                                producto.precio
                            ) || 0,

                        unidad:
                            producto.unidad ||
                            "Unidad",

                        cantidad:
                            cantidad

                    });

                });


            if (
                listaProductos.length === 0
            ) {

                alert(
                    "Agregá al menos un producto con cantidad mayor a 0."
                );

                return;

            }


            // ------------------------------------------
            // DATOS DEL PEDIDO
            // ------------------------------------------

            const pedido = {

                fechaPedido:
                    document.getElementById(
                        "fechaPedido"
                    )?.value || "",

                fechaEvento:
                    document.getElementById(
                        "fecha"
                    )?.value || "",

                hora:
                    document.getElementById(
                        "hora"
                    )?.value || "",

                lugar:
                    document.getElementById(
                        "lugar"
                    )?.value || "",

                personas:
                    Number(
                        document.getElementById(
                            "personas"
                        )?.value
                    ) || 0,

                productos:
                    listaProductos,

                total:
                    totalHTML
                        ? totalHTML.innerText
                        : "$0",

                tipoDocumento:
                    document.getElementById(
                        "tipoDocumento"
                    )?.value || "",

                numeroDocumento:
                    numeroDocumento.value,

                comentarios:
                    document.getElementById(
                        "comentarios"
                    )?.value || "",

                usuario:
                    auth.currentUser.email,

                estado:
                    "Pendiente",

                // El comedor todavía no vio este pedido
                vistoPorComedor:
                    false,

                // Respuesta del comedor
                respuestaComedor:
                    "",

                fechaCreacion:
                    serverTimestamp()

            };


            // ------------------------------------------
            // GUARDAR EN FIRESTORE
            // ------------------------------------------

            try {

                console.log(
                    "Pedido a guardar:",
                    pedido
                );

                const docRef =
                    await addDoc(
                        collection(
                            db,
                            "pedidos"
                        ),
                        pedido
                    );

                console.log(
                    "Pedido guardado con ID:",
                    docRef.id
                );


                // --------------------------------------
                // ENVIAR EMAIL AL COMEDOR
                // --------------------------------------

                try {

                    const productosTexto =
                        listaProductos
                            .map(prod => {

                                const subtotal =
                                    Number(prod.precio) *
                                    Number(prod.cantidad);

                                return (
                                    `${prod.nombre} x${prod.cantidad}` +
                                    ` (${prod.unidad})` +
                                    ` - $${subtotal.toLocaleString("es-AR")}`
                                );

                            })
                            .join("\n");


                    await emailjs.send(
                        "service_comedorlasa",
                        "template_9w3ugxt",
                        {

                            usuario:
                                pedido.usuario,

                            fecha_evento:
                                pedido.fechaEvento ||
                                "-",

                            hora:
                                pedido.hora ||
                                "-",

                            lugar:
                                pedido.lugar ||
                                "-",

                            personas:
                                pedido.personas ||
                                "-",

                            tipo_documento:
                                pedido.tipoDocumento ||
                                "-",

                            numero_documento:
                                pedido.numeroDocumento ||
                                "-",

                            productos:
                                productosTexto ||
                                "-",

                            total:
                                pedido.total ||
                                "$0",

                            comentarios:
                                pedido.comentarios ||
                                "-"

                        }
                    );


                    console.log(
                        "Email enviado correctamente."
                    );


                    alert(
                        "Pedido enviado correctamente."
                    );


                    location.reload();


                } catch (emailError) {

                    // El pedido YA fue guardado.
                    // Si falla EmailJS no debemos decir
                    // que falló el pedido.

                    console.error(
                        "Error enviando email:",
                        emailError
                    );

                    alert(
                        "El pedido se guardó correctamente, " +
                        "pero no se pudo enviar el aviso por email."
                    );

                }


            } catch (error) {

                console.error(
                    "ERROR FIRESTORE:",
                    error
                );

                alert(
                    "Error al guardar el pedido."
                );

            }

        }
    );

}


// ======================================================
// MODAL DOCUMENTO
// ======================================================

const cerrarModal =
    document.getElementById(
        "cerrarModal"
    );

if (cerrarModal) {

    cerrarModal.addEventListener(
        "click",
        () => {

            const modal =
                document.getElementById(
                    "modal"
                );

            if (modal) {

                modal.style.display =
                    "none";

            }

        }
    );

}


// ======================================================
// CERRAR SESION
// ======================================================

if (btnSalir) {

    btnSalir.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Error cerrando sesión:",
                    error
                );

            }

        }
    );

}


// ======================================================
// ELEMENTOS DE NAVEGACION
// ======================================================

const formularioPedido =
    document.getElementById(
        "formularioPedido"
    );

const listaPedidos =
    document.getElementById(
        "listaPedidos"
    );


// ======================================================
// NUEVO PEDIDO
// ======================================================

if (btnNuevoPedido) {

    btnNuevoPedido.addEventListener(
        "click",
        () => {

            if (listaPedidos) {

                listaPedidos.style.display =
                    "none";

            }

            if (formularioPedido) {

                formularioPedido.style.display =
                    "block";

            }

        }
    );

}


// ======================================================
// MIS PEDIDOS
// ======================================================

if (btnMisPedidos) {

    btnMisPedidos.addEventListener(
        "click",
        () => {

            cargarMisPedidos();

        }
    );

}


// ======================================================
// CARGAR MIS PEDIDOS
// ======================================================

async function cargarMisPedidos() {

    if (!auth.currentUser) {

        alert(
            "La sesión expiró. Volvé a iniciar sesión."
        );

        return;

    }

    if (!listaPedidos) {
        return;
    }

    try {

        const q =
            query(
                collection(
                    db,
                    "pedidos"
                ),

                where(
                    "usuario",
                    "==",
                    auth.currentUser.email
                )
            );


        const snapshot =
            await getDocs(q);


        let pedidos = [];


        snapshot.forEach(
            docPedido => {

                pedidos.push({

                    id:
                        docPedido.id,

                    ...docPedido.data()

                });

            }
        );


        // Más nuevos primero
        pedidos.sort(
            (a, b) => {

                const fechaA =
                    a.fechaCreacion?.seconds ||
                    0;

                const fechaB =
                    b.fechaCreacion?.seconds ||
                    0;

                return fechaB - fechaA;

            }
        );


        let html = `

            <div class="listaPedidos">

                <h2>Mis pedidos</h2>

        `;


        if (pedidos.length === 0) {

            html += `

                <p>
                    No tenés pedidos realizados.
                </p>

            `;

        }


        pedidos.forEach(
            p => {

                const estado =
                    p.estado ||
                    "Pendiente";


                html += `

                    <div class="cardPedido">

                        <div class="cardCabecera">

                            <strong>
                                ${escapeHtml(
                                    p.fechaEvento || ""
                                )}
                            </strong>

                            <span
                                class="estado ${escapeHtml(
                                    estado
                                )}"
                            >
                                ${escapeHtml(
                                    estado
                                )}
                            </span>

                        </div>


                        <p>

                            <strong>
                                Lugar:
                            </strong>

                            ${escapeHtml(
                                p.lugar || ""
                            )}

                        </p>


                        <p>

                            <strong>
                                Personas:
                            </strong>

                            ${p.personas || 0}

                        </p>


                        <p>

                            <strong>
                                Total:
                            </strong>

                            ${escapeHtml(
                                p.total || "$0"
                            )}

                        </p>


                        ${
                            p.respuestaComedor
                                ? `
                                    <div
                                        class="respuestaComedor"
                                    >

                                        <strong>
                                            Respuesta del comedor:
                                        </strong>

                                        <p>
                                            ${escapeHtml(
                                                p.respuestaComedor
                                            )}
                                        </p>

                                    </div>
                                `
                                : ""
                        }


                        <button
                            class="btnDetallePedido"
                            data-pedido="${encodeURIComponent(
                                JSON.stringify(p)
                            )}"
                        >
                            Ver detalle
                        </button>


                        <button
                            class="btnEliminarPedido"
                            data-id="${escapeHtml(
                                p.id
                            )}"
                        >
                            Eliminar
                        </button>


                    </div>

                `;

            }
        );


        html += `

            </div>

        `;


        if (formularioPedido) {

            formularioPedido.style.display =
                "none";

        }


        listaPedidos.style.display =
            "block";


        listaPedidos.innerHTML =
            html;


    } catch (error) {

        console.error(
            "Error cargando pedidos:",
            error
        );

        alert(
            "No se pudieron cargar tus pedidos."
        );

    }

}


// ======================================================
// MODAL DETALLE DEL PEDIDO
// ======================================================

const modalDetallePedido =
    document.getElementById(
        "modalDetallePedido"
    );


const dFecha =
    document.getElementById(
        "dFecha"
    );


const dHora =
    document.getElementById(
        "dHora"
    );


const dLugar =
    document.getElementById(
        "dLugar"
    );


const dPersonas =
    document.getElementById(
        "dPersonas"
    );


const dProductos =
    document.getElementById(
        "dProductos"
    );


const dTotal =
    document.getElementById(
        "dTotal"
    );


const dDocumento =
    document.getElementById(
        "dDocumento"
    );


const dEstado =
    document.getElementById(
        "dEstado"
    );


const dComentarios =
    document.getElementById(
        "dComentarios"
    );


const cerrarDetallePedido =
    document.getElementById(
        "cerrarDetallePedido"
    );


// ======================================================
// VER DETALLE
// ======================================================

document.addEventListener(
    "click",
    event => {

        const boton =
            event.target.closest(
                ".btnDetallePedido"
            );


        if (!boton) {
            return;
        }


        try {

            const p =
                JSON.parse(
                    decodeURIComponent(
                        boton.dataset.pedido
                    )
                );


            if (dFecha) {

                dFecha.innerText =
                    p.fechaEvento || "";

            }


            if (dHora) {

                dHora.innerText =
                    p.hora || "";

            }


            if (dLugar) {

                dLugar.innerText =
                    p.lugar || "";

            }


            if (dPersonas) {

                dPersonas.innerText =
                    p.personas || "";

            }


            if (dTotal) {

                dTotal.innerText =
                    p.total || "";

            }


            if (dDocumento) {

                dDocumento.innerText =
                    p.numeroDocumento || "";

            }


            if (dComentarios) {

                dComentarios.value =
                    p.comentarios || "";

            }


            if (dEstado) {

                dEstado.innerText =
                    p.estado ||
                    "Pendiente";


                dEstado.className =
                    "estado " +
                    (
                        p.estado ||
                        "Pendiente"
                    );

            }


            let html = "";


            if (
                Array.isArray(
                    p.productos
                )
            ) {

                p.productos.forEach(
                    prod => {

                        html += `

                            <p>

                                •
                                ${escapeHtml(
                                    prod.nombre || ""
                                )}

                                &nbsp;&nbsp;

                                x${prod.cantidad || 0}

                                ${
                                    prod.unidad
                                        ? ` (${escapeHtml(
                                            prod.unidad
                                        )})`
                                        : ""
                                }

                            </p>

                        `;

                    }
                );

            }


            if (dProductos) {

                dProductos.innerHTML =
                    html;

            }


            const dRespuestaComedor =
                document.getElementById(
                    "dRespuestaComedor"
                );


            if (dRespuestaComedor) {

                dRespuestaComedor.value =
                    p.respuestaComedor ||
                    "";

            }


            if (modalDetallePedido) {

                modalDetallePedido.style.display =
                    "flex";

            }


        } catch (error) {

            console.error(
                "Error mostrando detalle:",
                error
            );

        }

    }
);


// ======================================================
// CERRAR DETALLE
// ======================================================

if (cerrarDetallePedido) {

    cerrarDetallePedido.onclick =
        () => {

            if (modalDetallePedido) {

                modalDetallePedido.style.display =
                    "none";

            }

        };

}


// ======================================================
// ELIMINAR PEDIDO
// ======================================================

const modalEliminar =
    document.getElementById(
        "modalEliminar"
    );


const claveEliminar =
    document.getElementById(
        "claveEliminar"
    );


const cancelarEliminar =
    document.getElementById(
        "cancelarEliminar"
    );


const confirmarEliminar =
    document.getElementById(
        "confirmarEliminar"
    );


// ======================================================
// ABRIR MODAL ELIMINAR
// ======================================================

document.addEventListener(
    "click",
    event => {

        const boton =
            event.target.closest(
                ".btnEliminarPedido"
            );


        if (!boton) {
            return;
        }


        pedidoEliminar =
            boton.dataset.id;


        if (claveEliminar) {

            claveEliminar.value =
                "";

        }


        if (modalEliminar) {

            modalEliminar.style.display =
                "flex";

        }

    }
);


// ======================================================
// CANCELAR ELIMINACION
// ======================================================

if (cancelarEliminar) {

    cancelarEliminar.onclick =
        () => {

            if (modalEliminar) {

                modalEliminar.style.display =
                    "none";

            }


            pedidoEliminar =
                null;

        };

}


// ======================================================
// CONFIRMAR ELIMINACION
// ======================================================

if (confirmarEliminar) {

    confirmarEliminar.onclick =
        async () => {

            if (!pedidoEliminar) {
                return;
            }


            try {

                const configRef =
                    doc(
                        db,
                        "configuracion",
                        "seguridad"
                    );


                const configSnap =
                    await getDoc(
                        configRef
                    );


                if (
                    !configSnap.exists()
                ) {

                    alert(
                        "No existe la configuración de seguridad."
                    );

                    return;

                }


                const config =
                    configSnap.data();


                if (
                    !config.permitirEliminarUsuario
                ) {

                    alert(
                        "La eliminación de pedidos está deshabilitada."
                    );

                    return;

                }


                if (
                    !claveEliminar ||
                    claveEliminar.value !==
                    config.claveEliminar
                ) {

                    alert(
                        "Clave incorrecta."
                    );

                    return;

                }


                await deleteDoc(
                    doc(
                        db,
                        "pedidos",
                        pedidoEliminar
                    )
                );


                if (modalEliminar) {

                    modalEliminar.style.display =
                        "none";

                }


                pedidoEliminar =
                    null;


                alert(
                    "Pedido eliminado correctamente."
                );


                cargarMisPedidos();


            } catch (error) {

                console.error(
                    "Error eliminando pedido:",
                    error
                );


                alert(
                    "Error al eliminar el pedido."
                );

            }

        };

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}