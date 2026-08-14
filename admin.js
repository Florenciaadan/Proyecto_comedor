import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const contenido = document.getElementById("contenido");

let idProductoEditar = null;
let pedidosCache = [];


// =====================================================
// SESIÓN
// =====================================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "index.html";

    }

});


// =====================================================
// BOTONES PRINCIPALES
// =====================================================

document.getElementById("btnProductos").onclick = () => {

    cargarProductos();

};


document.getElementById("btnPedidos").onclick = () => {

    cargarPedidos();

};


document.getElementById("btnSalir").onclick = async () => {

    await signOut(auth);

    window.location.href = "index.html";

};


// =====================================================
// PRODUCTOS
// =====================================================

async function cargarProductos() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "productos")
            );


        let html = `

            <div class="cabeceraPedidos">

                <div>

                    <h2>Productos</h2>

                    <p class="subtituloPedidos">
                        Productos disponibles para el comedor
                    </p>

                </div>

            </div>


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


        snapshot.forEach(docProducto => {

            const p = docProducto.data();


            html += `

                <tr>

                    <td>
                        ${p.nombre || ""}
                    </td>


                    <td>
                        $ ${Number(
                            p.precio || 0
                        ).toLocaleString("es-AR")}
                    </td>


                    <td>
                        ${p.unidad || "Unidad"}
                    </td>


                    <td>

                        ${
                            p.activo
                                ? "🟢 Activo"
                                : "🔴 Inactivo"
                        }

                    </td>


                    <td>

                        <button
                            class="btnEditar"
                            data-id="${docProducto.id}"
                            data-nombre="${escapeHtml(p.nombre || "")}"
                            data-precio="${p.precio || 0}"
                            data-unidad="${escapeHtml(p.unidad || "Unidad")}"
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


            <button
                id="btnNuevoProducto"
                class="btnNuevoProducto"
            >
                + Agregar producto
            </button>

        `;


        contenido.innerHTML = html;


    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );

        contenido.innerHTML = `
            <p>Error cargando productos.</p>
        `;

    }

}


// =====================================================
// PEDIDOS
// =====================================================

async function cargarPedidos() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "pedidos")
            );


        pedidosCache = [];


        snapshot.forEach(docPedido => {

            pedidosCache.push({

                id: docPedido.id,

                ...docPedido.data()

            });

        });


        renderizarPedidos();


    } catch (error) {

        console.error(
            "Error cargando pedidos:",
            error
        );

        contenido.innerHTML = `
            <p>Error cargando pedidos.</p>
        `;

    }

}


// =====================================================
// RENDER PEDIDOS
// =====================================================

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
            new Date(
                pedido.fechaEvento + "T00:00:00"
            );


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
                    Gestión de pedidos
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
                "Pedidos futuros",
                false
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


// =====================================================
// TABLA PEDIDOS
// =====================================================

function generarTablaPedidos(
    pedidos,
    titulo,
    esPasado
) {

    let html = `

        <section
            class="seccionPedidos"
            data-pasado="${esPasado}"
        >

            <div class="tituloSeccionPedidos">

                <h2>${titulo}</h2>

                <span>
                    ${pedidos.length}
                    pedido${pedidos.length === 1 ? "" : "s"}
                </span>

            </div>


            <div class="tablaScroll">

                <table class="tablaProductos">

                    <thead>

                        <tr>

                            <th style="width:45px;">
                                ✓
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


        let textoEstado =
            estado;


        if (estado === "Aprobado") {

            textoEstado = "Aceptado";

        }


        html += `

            <tr
                class="filaPedido"
                data-id="${pedido.id}"
                data-pasado="${esPasado}"
            >

                <td>

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
                        class="estado ${estado}"
                    >
                        ${textoEstado}
                    </span>

                </td>


                <td>

                    <button
                        class="btnVerPedido"
                        data-id="${pedido.id}"
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


// =====================================================
// SELECCIÓN
// =====================================================

function actualizarBotonEliminar() {

    const seleccionados =
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


    if (boton) {

        boton.disabled =
            seleccionados.length === 0;

    }


    if (contador) {

        contador.innerText =
            `${seleccionados.length} seleccionado${seleccionados.length === 1 ? "" : "s"}`;

    }

}


// =====================================================
// CHECKBOX
// =====================================================

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

            document
                .querySelectorAll(
                    ".checkPedido"
                )
                .forEach(check => {

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


// =====================================================
// ELIMINAR SELECCIONADOS
// =====================================================

document.addEventListener(
    "click",
    async e => {

        const boton =
            e.target.closest(
                "#btnEliminarSeleccionados"
            );


        if (!boton) return;


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
                "Pedidos eliminados correctamente."
            );


            cargarPedidos();


        } catch (error) {

            console.error(
                "Error eliminando pedidos:",
                error
            );


            alert(
                "No se pudieron eliminar los pedidos."
            );

        }

    }
);


// =====================================================
// BUSCAR
// =====================================================

document.addEventListener(
    "input",
    e => {

        if (
            e.target.id ===
            "buscarPedido"
        ) {

            filtrarPedidos();

        }

    }
);


// =====================================================
// FILTRAR
// =====================================================

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


            if (!pedido) return;


            const esPasado =
                fila.dataset.pasado === "true";


            const coincideTexto =
                (
                    pedido.usuario ||
                    ""
                )
                    .toLowerCase()
                    .includes(texto)

                ||

                (
                    pedido.lugar ||
                    ""
                )
                    .toLowerCase()
                    .includes(texto);


            let coincideEstado =
                true;


            if (
                filtro === "Pasados"
            ) {

                coincideEstado =
                    esPasado;

            }

            else if (
                filtro === "Todos"
            ) {

                coincideEstado =
                    !esPasado;

            }

            else {

                coincideEstado =
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
                coincideEstado
                    ? ""
                    : "none";

        });


    document
        .querySelectorAll(
            ".seccionPedidos"
        )
        .forEach(seccion => {

            const filas =
                seccion.querySelectorAll(
                    ".filaPedido"
                );


            const visible =
                Array.from(filas)
                    .some(
                        fila =>
                            fila.style.display !==
                            "none"
                    );


            seccion.style.display =
                visible
                    ? ""
                    : "none";

        });

}


// =====================================================
// TARJETAS DE ESTADO
// =====================================================

document.addEventListener(
    "click",
    e => {

        const tarjeta =
            e.target.closest(
                ".cardEstado"
            );


        if (!tarjeta) return;


        const filtro =
            document.getElementById(
                "filtroEstado"
            );


        if (!filtro) return;


        filtro.value =
            tarjeta.dataset.estado;


        filtrarPedidos();

    }
);


// =====================================================
// NUEVO PRODUCTO
// =====================================================

document.addEventListener(
    "click",
    e => {

        if (
            e.target.id !==
            "btnNuevoProducto"
        ) {

            return;

        }


        idProductoEditar = null;


        document.getElementById(
            "nuevoNombre"
        ).value = "";


        document.getElementById(
            "nuevoPrecio"
        ).value = "";


        document.getElementById(
            "nuevaUnidad"
        ).selectedIndex = 0;


        document.getElementById(
            "nuevoEstado"
        ).value = "true";


        document.getElementById(
            "modalProducto"
        ).style.display = "flex";

    }
);


// =====================================================
// EDITAR PRODUCTO
// =====================================================

document.addEventListener(
    "click",
    e => {

        const boton =
            e.target.closest(
                ".btnEditar"
            );


        if (!boton) return;


        idProductoEditar =
            boton.dataset.id;


        document.getElementById(
            "nuevoNombre"
        ).value =
            boton.dataset.nombre;


        document.getElementById(
            "nuevoPrecio"
        ).value =
            boton.dataset.precio;


        document.getElementById(
            "nuevaUnidad"
        ).value =
            boton.dataset.unidad;


        document.getElementById(
            "nuevoEstado"
        ).value =
            boton.dataset.activo;


        document.getElementById(
            "modalProducto"
        ).style.display =
            "flex";

    }
);


// =====================================================
// CERRAR MODAL PRODUCTO
// =====================================================

const cerrarProducto =
    document.getElementById(
        "cerrarProducto"
    );


if (cerrarProducto) {

    cerrarProducto.onclick =
        () => {

            document.getElementById(
                "modalProducto"
            ).style.display =
                "none";

        };

}


// =====================================================
// GUARDAR PRODUCTO
// =====================================================

const guardarProducto =
    document.getElementById(
        "guardarProducto"
    );


if (guardarProducto) {

    guardarProducto.onclick =
        async () => {


            const nombre =
                document.getElementById(
                    "nuevoNombre"
                ).value.trim();


            const precio =
                Number(
                    document.getElementById(
                        "nuevoPrecio"
                    ).value
                );


            const unidad =
                document.getElementById(
                    "nuevaUnidad"
                ).value;


            const activo =
                document.getElementById(
                    "nuevoEstado"
                ).value === "true";


            if (!nombre) {

                alert(
                    "Ingrese el nombre del producto."
                );

                return;

            }


            if (
                !precio ||
                precio <= 0
            ) {

                alert(
                    "Ingrese un precio válido."
                );

                return;

            }


            try {

                if (idProductoEditar) {

                    await updateDoc(
                        doc(
                            db,
                            "productos",
                            idProductoEditar
                        ),
                        {
                            nombre,
                            precio,
                            unidad,
                            activo
                        }
                    );

                }

                else {

                    await addDoc(
                        collection(
                            db,
                            "productos"
                        ),
                        {
                            nombre,
                            precio,
                            unidad,
                            activo
                        }
                    );

                }


                idProductoEditar =
                    null;


                document.getElementById(
                    "modalProducto"
                ).style.display =
                    "none";


                alert(
                    "Producto guardado correctamente."
                );


                cargarProductos();


            } catch (error) {

                console.error(
                    "Error guardando producto:",
                    error
                );


                alert(
                    "No se pudo guardar el producto."
                );

            }

        };

}


// =====================================================
// VER DETALLE PEDIDO
// =====================================================

document.addEventListener(
    "click",
    async e => {

        const boton =
            e.target.closest(
                ".btnVerPedido"
            );


        if (!boton) return;


        const id =
            boton.dataset.id;


        try {

            const pedidoSnap =
                await getDocs(
                    collection(
                        db,
                        "pedidos"
                    )
                );


            pedidoSnap.forEach(
                docPedido => {

                    if (
                        docPedido.id !==
                        id
                    ) {

                        return;

                    }


                    const p =
                        docPedido.data();


                    const detalleUsuario =
                        document.getElementById(
                            "detalleUsuario"
                        );


                    const detalleFecha =
                        document.getElementById(
                            "detalleFecha"
                        );


                    const detalleHora =
                        document.getElementById(
                            "detalleHora"
                        );


                    const detalleLugar =
                        document.getElementById(
                            "detalleLugar"
                        );


                    const detallePersonas =
                        document.getElementById(
                            "detallePersonas"
                        );


                    const detalleTotal =
                        document.getElementById(
                            "detalleTotal"
                        );


                    const detalleDocumento =
                        document.getElementById(
                            "detalleDocumento"
                        );


                    const detalleComentarios =
                        document.getElementById(
                            "detalleComentarios"
                        );


                    const detalleProductos =
                        document.getElementById(
                            "detalleProductos"
                        );


                    if (detalleUsuario)
                        detalleUsuario.innerText =
                            p.usuario || "";


                    if (detalleFecha)
                        detalleFecha.innerText =
                            p.fechaEvento || "";


                    if (detalleHora)
                        detalleHora.innerText =
                            p.hora || "";


                    if (detalleLugar)
                        detalleLugar.innerText =
                            p.lugar || "";


                    if (detallePersonas)
                        detallePersonas.innerText =
                            p.personas || "";


                    if (detalleTotal)
                        detalleTotal.innerText =
                            p.total || "";


                    if (detalleDocumento)
                        detalleDocumento.innerText =
                            p.numeroDocumento || "";


                    if (detalleComentarios)
                        detalleComentarios.value =
                            p.comentarios || "";


                    let productosHTML = "";


                    if (
                        Array.isArray(
                            p.productos
                        )
                    ) {

                        p.productos.forEach(
                            producto => {

                                productosHTML += `

                                    <p>

                                        •
                                        ${producto.nombre}

                                        &nbsp;&nbsp;

                                        x${producto.cantidad}

                                        ${
                                            producto.unidad
                                                ? `(${producto.unidad})`
                                                : ""
                                        }

                                    </p>

                                `;

                            }
                        );

                    }


                    if (detalleProductos) {

                        detalleProductos.innerHTML =
                            productosHTML;

                    }


                    const modalPedido =
                        document.getElementById(
                            "modalPedido"
                        );


                    if (modalPedido) {

                        modalPedido.style.display =
                            "flex";

                    }

                }
            );


        } catch (error) {

            console.error(
                "Error mostrando pedido:",
                error
            );

        }

    }
);


// =====================================================
// CERRAR MODAL PEDIDO
// =====================================================

const cerrarPedido =
    document.getElementById(
        "cerrarPedido"
    );


if (cerrarPedido) {

    cerrarPedido.onclick =
        () => {

            document.getElementById(
                "modalPedido"
            ).style.display =
                "none";

        };

}


// =====================================================
// INICIO
// =====================================================

cargarProductos();


// =====================================================
// ESCAPAR HTML
// =====================================================

function escapeHtml(text) {

    return String(text || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}