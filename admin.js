import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    addDoc,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";


// =====================================================
// CONFIGURACIÓN EMAILJS
// =====================================================

const EMAILJS_SERVICE_ID = "service_comedorlasa";
const EMAILJS_TEMPLATE_ID = "template_9w3ugxt";
const EMAILJS_RESPUESTA_TEMPLATE_ID = "template_wrbm6sm";
const EMAILJS_PUBLIC_KEY = "bUNcS8Ra993mmhOA0";

emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY
});


// =====================================================
// VARIABLES
// =====================================================

const contenido = document.getElementById("contenido");

let idProductoEditar = null;
let pedidosCache = [];
let productosCache = [];
let pedidoActualId = null;


// =====================================================
// SESIÓN
// =====================================================

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
    }

});


// =====================================================
// BOTONES PRINCIPALES
// =====================================================

const btnProductos = document.getElementById("btnProductos");

if (btnProductos) {
    btnProductos.onclick = () => {
        cargarProductos();
    };
}


const btnPedidos = document.getElementById("btnPedidos");

if (btnPedidos) {
    btnPedidos.onclick = () => {
        cargarPedidos();
    };
}


const btnSalir = document.getElementById("btnSalir");

if (btnSalir) {

    btnSalir.onclick = async () => {

        try {

            await signOut(auth);

            window.location.href = "login.html";

        } catch (error) {

            console.error(
                "Error cerrando sesión:",
                error
            );

        }

    };

}


// =====================================================
// PRODUCTOS
// =====================================================

async function cargarProductos() {

    try {

        const snapshot = await getDocs(
            collection(db, "productos")
        );

        productosCache = [];

        snapshot.forEach(docProducto => {

            productosCache.push({
                id: docProducto.id,
                ...docProducto.data()
            });

        });


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


        productosCache.forEach(producto => {

            html += `

                <tr>

                    <td>
                        ${escapeHtml(producto.nombre || "")}
                    </td>

                    <td>
                        $ ${Number(
                            producto.precio || 0
                        ).toLocaleString("es-AR")}
                    </td>

                    <td>
                        ${escapeHtml(
                            producto.unidad || "Unidad"
                        )}
                    </td>

                    <td>

                        ${
                            producto.activo
                                ? "🟢 Activo"
                                : "🔴 Inactivo"
                        }

                    </td>

                    <td>

                        <button
                            class="btnEditar"
                            data-id="${producto.id}"
                            data-nombre="${escapeHtml(producto.nombre || "")}"
                            data-precio="${producto.precio || 0}"
                            data-unidad="${escapeHtml(producto.unidad || "Unidad")}"
                            data-activo="${producto.activo}"
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
            <p class="error">
                Error cargando productos.
            </p>
        `;

    }

}


// =====================================================
// PEDIDOS
// =====================================================

async function cargarPedidos() {

    try {

        const snapshot = await getDocs(
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
            <p class="error">
                Error cargando pedidos.
            </p>
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


        const fechaEvento = new Date(
            pedido.fechaEvento + "T00:00:00"
        );


        if (fechaEvento < hoy) {

            pasados.push(pedido);

        } else {

            futuros.push(pedido);

        }

    });


    const pendientes = futuros.filter(
        p => p.estado === "Pendiente"
    ).length;


    const aceptados = futuros.filter(
        p =>
            p.estado === "Aprobado" ||
            p.estado === "Aceptado"
    ).length;


    const rechazados = futuros.filter(
        p => p.estado === "Rechazado"
    ).length;


    const nuevos = futuros.filter(
        p =>
            p.estado === "Pendiente" &&
            p.vistoComedor !== true
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


        <div class="nuevosPedidosBanner ${nuevos > 0 ? "hayNuevos" : ""}">

            <div>

                <strong>
                    ${
                        nuevos > 0
                            ? "⚠️ Hay pedidos nuevos para revisar"
                            : "Pedidos nuevos"
                    }
                </strong>

                <span>
                    ${nuevos}
                </span>

            </div>

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


function obtenerTotalNumerico(pedido) {

    // 1. Primero intentamos calcular el total desde los productos
    if (Array.isArray(pedido.productos) && pedido.productos.length > 0) {

        const totalProductos = pedido.productos.reduce(
            (suma, producto) => {

                const precio = Number(producto.precio);

                const cantidad = Number(producto.cantidad);

                const precioSeguro =
                    Number.isFinite(precio) ? precio : 0;

                const cantidadSegura =
                    Number.isFinite(cantidad) ? cantidad : 0;

                return suma + (precioSeguro * cantidadSegura);
            },
            0
        );

        if (Number.isFinite(totalProductos) && totalProductos > 0) {
            return totalProductos;
        }
    }

    // 2. Si existe pedido.total como número válido
    if (
        typeof pedido.total === "number" &&
        Number.isFinite(pedido.total)
    ) {
        return pedido.total;
    }

    // 3. Si pedido.total viene como texto
    if (typeof pedido.total === "string") {

        const texto = pedido.total
            .replace(/\$/g, "")
            .replace(/\s/g, "")
            .replace(/\./g, "")
            .replace(",", ".");

        const numero = Number(texto);

        if (Number.isFinite(numero)) {
            return numero;
        }
    }

    // 4. Nunca mostrar NaN
    return 0;
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

        const estado =
            pedido.estado || "Pendiente";


        let textoEstado =
            estado;


        if (estado === "Aprobado") {
            textoEstado = "Aceptado";
        }


        const esNuevo =
            !esPasado &&
            estado === "Pendiente" &&
            pedido.vistoComedor !== true;


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

                    ${
                        pedido.fechaEvento
                            ? formatearFecha(
                                pedido.fechaEvento
                            )
                            : "-"
                    }

                </td>


                <td>

                    ${escapeHtml(
                        pedido.usuario || "-"
                    )}

                    ${
                        esNuevo
                            ? `<span class="badgeNuevo">
                                NUEVO
                               </span>`
                            : ""
                    }

                </td>


                <td>

                    ${escapeHtml(
                        pedido.lugar || "-"
                    )}

                </td>


<td>
    $ ${obtenerTotalNumerico(pedido).toLocaleString("es-AR")}
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
            `${seleccionados.length} seleccionado${
                seleccionados.length === 1
                    ? ""
                    : "s"
            }`;

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
                `¿Está seguro de eliminar ${seleccionados.length} pedido${
                    seleccionados.length === 1
                        ? ""
                        : "s"
                }?\n\nEsta acción no se puede deshacer.`
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


            let coincideEstado = true;


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
                            filtro ===
                                "Aprobado" &&
                            pedido.estado ===
                                "Aceptado"
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
// CERRAR PRODUCTO
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
// ABRIR PEDIDO
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


        pedidoActualId = id;


        const pedido =
            pedidosCache.find(
                p => p.id === id
            );


        if (!pedido) {

            alert(
                "No se encontró el pedido."
            );

            return;

        }


        try {

            // -----------------------------------------
            // MARCAR COMO VISTO
            // -----------------------------------------

            if (
                pedido.vistoComedor !== true
            ) {

                await updateDoc(
                    doc(
                        db,
                        "pedidos",
                        id
                    ),
                    {
                        vistoComedor: true
                    }
                );


                pedido.vistoComedor = true;

            }


            // -----------------------------------------
            // DATOS
            // -----------------------------------------

            setText(
                "detalleUsuario",
                pedido.usuario || ""
            );


            setText(
                "detalleFecha",
                pedido.fechaEvento || ""
            );


            setText(
                "detalleHora",
                pedido.hora || ""
            );


            setText(
                "detalleLugar",
                pedido.lugar || ""
            );


            setText(
                "detallePersonas",
                pedido.personas || ""
            );


            setText(
                "detalleDocumento",
                pedido.numeroDocumento || ""
            );


            const comentarios =
                document.getElementById(
                    "detalleComentarios"
                );


            if (comentarios) {

                comentarios.value =
                    pedido.comentarios || "";

            }


            const respuesta =
                document.getElementById(
                    "detalleRespuesta"
                );


            if (respuesta) {

                respuesta.value =
                    pedido.respuestaComedor || "";

            }


            const estado =
                document.getElementById(
                    "detalleEstado"
                );


            if (estado) {

                estado.value =
                    pedido.estado || "Pendiente";

            }


            // -----------------------------------------
            // PRODUCTOS
            // -----------------------------------------

            await cargarProductosSiEsNecesario();


            renderizarProductosPedido(
                pedido.productos || []
            );


            calcularTotalPedido();


            document.getElementById(
                "modalPedido"
            ).style.display =
                "flex";


        } catch (error) {

            console.error(
                "Error mostrando pedido:",
                error
            );


            alert(
                "No se pudo abrir el pedido."
            );

        }

    }
);


// =====================================================
// CARGAR PRODUCTOS PARA MODIFICAR PEDIDO
// =====================================================

async function cargarProductosSiEsNecesario() {

    if (
        productosCache.length > 0
    ) {

        return;

    }


    const snapshot =
        await getDocs(
            collection(
                db,
                "productos"
            )
        );


    productosCache = [];


    snapshot.forEach(
        docProducto => {

            productosCache.push({

                id:
                    docProducto.id,

                ...docProducto.data()

            });

        }
    );

}


// =====================================================
// RENDER PRODUCTOS DEL PEDIDO
// =====================================================

function renderizarProductosPedido(
    productos
) {

    const contenedor =
        document.getElementById(
            "detalleProductos"
        );


    if (!contenedor) return;


    contenedor.innerHTML = "";


    if (
        !Array.isArray(productos) ||
        productos.length === 0
    ) {

        agregarFilaProductoPedido();

        return;

    }


    productos.forEach(
        producto => {

            agregarFilaProductoPedido(
                producto
            );

        }
    );

}


// =====================================================
// AGREGAR FILA PRODUCTO
// =====================================================

function agregarFilaProductoPedido(
    producto = null
) {

    const contenedor =
        document.getElementById(
            "detalleProductos"
        );


    if (!contenedor) return;


    const fila =
        document.createElement(
            "div"
        );


    fila.className =
        "productoPedidoEditable";


    fila.dataset.productoId =
        producto?.id || "";


    // -----------------------------------------
    // SELECT PRODUCTO
    // -----------------------------------------

    const selectProducto =
        document.createElement(
            "select"
        );


    selectProducto.className =
        "productoSelect";


    const opcionVacia =
        document.createElement(
            "option"
        );


    opcionVacia.value = "";

    opcionVacia.textContent =
        "Seleccionar producto";


    selectProducto.appendChild(
        opcionVacia
    );


    productosCache
        .filter(
            p =>
                p.activo !== false
        )
        .forEach(
            p => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    p.id;


                option.textContent =
                    p.nombre;


                option.dataset.precio =
                    p.precio || 0;


                option.dataset.unidad =
                    p.unidad ||
                    "Unidad";


                selectProducto.appendChild(
                    option
                );

            }
        );


    // -----------------------------------------
    // CANTIDAD
    // -----------------------------------------

    const inputCantidad =
        document.createElement(
            "input"
        );


    inputCantidad.type =
        "number";


    inputCantidad.min = "1";


    inputCantidad.step = "1";


    inputCantidad.className =
        "cantidadProducto";


    inputCantidad.value =
        producto?.cantidad || 1;


    // -----------------------------------------
    // UNIDAD
    // -----------------------------------------

    const selectUnidad =
        document.createElement(
            "select"
        );


    selectUnidad.className =
        "unidadProducto";


    [
        "Unidad",
        "Kilo",
        "Docena",
        "Persona",
        "Bandeja",
        "Litro"
    ].forEach(
        unidad => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                unidad;


            option.textContent =
                unidad;


            selectUnidad.appendChild(
                option
            );

        }
    );


    selectUnidad.value =
        producto?.unidad ||
        "Unidad";


    // -----------------------------------------
    // PRECIO
    // -----------------------------------------

    const spanPrecio =
        document.createElement(
            "span"
        );


    spanPrecio.className =
        "precioProducto";


    // -----------------------------------------
    // SUBTOTAL
    // -----------------------------------------

    const spanSubtotal =
        document.createElement(
            "span"
        );


    spanSubtotal.className =
        "subtotalProducto";


    // -----------------------------------------
    // QUITAR
    // -----------------------------------------

    const botonQuitar =
        document.createElement(
            "button"
        );


    botonQuitar.type =
        "button";


    botonQuitar.className =
        "btnQuitarProducto";


    botonQuitar.textContent =
        "✕";


    botonQuitar.title =
        "Quitar producto";


    botonQuitar.onclick =
        () => {

            fila.remove();

            calcularTotalPedido();

        };


    // -----------------------------------------
    // AGREGAR TODO
    // -----------------------------------------

    fila.appendChild(
        selectProducto
    );


    fila.appendChild(
        inputCantidad
    );


    fila.appendChild(
        selectUnidad
    );


    fila.appendChild(
        spanPrecio
    );


    fila.appendChild(
        spanSubtotal
    );


    fila.appendChild(
        botonQuitar
    );


    contenedor.appendChild(
        fila
    );


    // -----------------------------------------
    // SELECCIONAR PRODUCTO EXISTENTE
    // -----------------------------------------

    if (producto) {

        const productoEncontrado =
            productosCache.find(
                p =>
                    p.id ===
                        producto.id

                    ||

                    p.nombre ===
                        producto.nombre
            );


        if (productoEncontrado) {

            selectProducto.value =
                productoEncontrado.id;


            spanPrecio.innerText =
                formatoMoneda(
                    productoEncontrado.precio
                );

        }

    }


    // -----------------------------------------
    // CAMBIO PRODUCTO
    // -----------------------------------------

    selectProducto.addEventListener(
        "change",
        () => {

            const option =
                selectProducto.options[
                    selectProducto.selectedIndex
                ];


            if (!option || !option.value) {

                spanPrecio.innerText =
                    "$ 0";


                spanSubtotal.innerText =
                    "$ 0";


                calcularTotalPedido();

                return;

            }


            const precio =
                Number(
                    option.dataset.precio ||
                    0
                );


            spanPrecio.innerText =
                formatoMoneda(
                    precio
                );


            if (
                !producto ||
                selectUnidad.value ===
                    "Unidad"
            ) {

                selectUnidad.value =
                    option.dataset.unidad ||
                    "Unidad";

            }


            calcularSubtotalFila(
                fila
            );


            calcularTotalPedido();

        }
    );


    inputCantidad.addEventListener(
        "input",
        () => {

            calcularSubtotalFila(
                fila
            );


            calcularTotalPedido();

        }
    );


    selectUnidad.addEventListener(
        "change",
        () => {

            calcularSubtotalFila(
                fila
            );


            calcularTotalPedido();

        }
    );


    calcularSubtotalFila(
        fila
    );

}


// =====================================================
// CALCULAR SUBTOTAL
// =====================================================

function calcularSubtotalFila(
    fila
) {

    const selectProducto =
        fila.querySelector(
            ".productoSelect"
        );


    const cantidad =
        Number(
            fila.querySelector(
                ".cantidadProducto"
            )?.value || 0
        );


    const spanSubtotal =
        fila.querySelector(
            ".subtotalProducto"
        );


    if (
        !selectProducto ||
        !spanSubtotal
    ) {

        return;

    }


    const option =
        selectProducto.options[
            selectProducto.selectedIndex
        ];


    const precio =
        Number(
            option?.dataset?.precio ||
            0
        );


    const subtotal =
        precio * cantidad;


    spanSubtotal.innerText =
        formatoMoneda(
            subtotal
        );

}


// =====================================================
// CALCULAR TOTAL
// =====================================================

function calcularTotalPedido() {

    const filas =
        document.querySelectorAll(
            "#detalleProductos .productoPedidoEditable"
        );


    let total = 0;


    filas.forEach(
        fila => {

            const selectProducto =
                fila.querySelector(
                    ".productoSelect"
                );


            const cantidad =
                Number(
                    fila.querySelector(
                        ".cantidadProducto"
                    )?.value || 0
                );


            const option =
                selectProducto?.options[
                    selectProducto.selectedIndex
                ];


            const precio =
                Number(
                    option?.dataset?.precio ||
                    0
                );


            total +=
                precio * cantidad;

        }
    );


    const elemento =
        document.getElementById(
            "detalleTotalEditar"
        );


    if (elemento) {

        elemento.innerText =
            formatoMoneda(
                total
            );

    }


    return total;

}


// =====================================================
// AGREGAR PRODUCTO AL PEDIDO
// =====================================================

document.addEventListener(
    "click",
    e => {

        if (
            e.target.id !==
            "btnAgregarProductoPedido"
        ) {

            return;

        }


        agregarFilaProductoPedido();

    }
);


// =====================================================
// GUARDAR CAMBIOS DEL PEDIDO
// =====================================================

const guardarCambiosPedido =
    document.getElementById(
        "guardarCambiosPedido"
    );


if (guardarCambiosPedido) {

    guardarCambiosPedido.onclick =
        async () => {

            if (!pedidoActualId) {

                alert(
                    "No hay ningún pedido seleccionado."
                );

                return;

            }


            const pedido =
                pedidosCache.find(
                    p =>
                        p.id ===
                        pedidoActualId
                );


            if (!pedido) {

                alert(
                    "No se encontró el pedido."
                );

                return;

            }


            const estado =
                document.getElementById(
                    "detalleEstado"
                ).value;


            const comentarios =
                document.getElementById(
                    "detalleComentarios"
                ).value.trim();


            const respuesta =
                document.getElementById(
                    "detalleRespuesta"
                ).value.trim();


            const productos =
                obtenerProductosEditados();


            if (
                productos.length === 0
            ) {

                alert(
                    "El pedido debe tener al menos un producto."
                );

                return;

            }


            if (
                estado === "Rechazado" &&
                !respuesta
            ) {

                const continuar =
                    confirm(
                        "Está rechazando el pedido sin escribir una respuesta. ¿Desea continuar?"
                    );


                if (!continuar) {

                    return;

                }

            }


            const total =
                productos.reduce(
                    (suma, producto) =>
                        suma +
                        Number(
                            producto.subtotal || 0
                        ),
                    0
                );


            try {

                guardarCambiosPedido.disabled =
                    true;


                guardarCambiosPedido.innerText =
                    "Guardando...";


                // -----------------------------------------
                // FIREBASE
                // -----------------------------------------

                await updateDoc(
                    doc(
                        db,
                        "pedidos",
                        pedidoActualId
                    ),
                    {

                        estado,

                        comentarios,

                        respuestaComedor:
                            respuesta,

                        productos,

                        total,

                        vistoComedor:
                            true,

                        modificadoPorComedor:
                            true,

                        fechaModificacion:
                            new Date().toISOString()

                    }
                );


                // -----------------------------------------
                // EMAIL
                // -----------------------------------------

                await enviarNotificacionEmail(
                    pedido,
                    estado,
                    respuesta,
                    productos,
                    total
                );


                alert(
                    "Pedido actualizado y notificación enviada correctamente."
                );


                document.getElementById(
                    "modalPedido"
                ).style.display =
                    "none";


                pedidoActualId = null;


                await cargarPedidos();


            } catch (error) {

                console.error(
                    "ERROR GUARDANDO PEDIDO:",
                    error
                );


                alert(
                    "El pedido NO pudo guardarse o enviarse.\n\nRevisá la consola para ver el error."
                );


            } finally {

                guardarCambiosPedido.disabled =
                    false;


                guardarCambiosPedido.innerText =
                    "Guardar y notificar";

            }

        };

}


// =====================================================
// OBTENER PRODUCTOS EDITADOS
// =====================================================

function obtenerProductosEditados() {

    const filas =
        document.querySelectorAll(
            "#detalleProductos .productoPedidoEditable"
        );


    const productos = [];


    filas.forEach(
        fila => {

            const selectProducto =
                fila.querySelector(
                    ".productoSelect"
                );


            const cantidad =
                Number(
                    fila.querySelector(
                        ".cantidadProducto"
                    )?.value || 0
                );


            const unidad =
                fila.querySelector(
                    ".unidadProducto"
                )?.value ||
                "Unidad";


            if (
                !selectProducto ||
                !selectProducto.value ||
                cantidad <= 0
            ) {

                return;

            }


            const producto =
                productosCache.find(
                    p =>
                        p.id ===
                        selectProducto.value
                );


            if (!producto) {

                return;

            }


            const precio =
                Number(
                    producto.precio || 0
                );


            const subtotal =
                precio * cantidad;


            productos.push({

                id:
                    producto.id,

                nombre:
                    producto.nombre,

                cantidad,

                unidad,

                precio,

                subtotal

            });

        }
    );


    return productos;

}


// =====================================================
// ENVIAR EMAIL
// =====================================================

async function enviarNotificacionEmail(
    pedido,
    estado,
    respuesta,
    productos,
    total
) {

    /*
     * Buscamos primero pedido.email.
     *
     * Si el pedido viejo no tiene ese campo,
     * usamos pedido.usuario siempre que tenga formato
     * de correo electrónico.
     */

    const email =
        pedido.email ||
        (
            typeof pedido.usuario === "string" &&
            pedido.usuario.includes("@")
                ? pedido.usuario
                : ""
        );


    if (!email) {

        console.warn(
            "El pedido no tiene email de usuario."
        );

        return;

    }


    const productosTexto =
        productos
            .map(
                producto =>
                    `• ${producto.nombre} x${producto.cantidad} (${producto.unidad}) - ${formatoMoneda(producto.subtotal)}`
            )
            .join("\n");


    let asunto = "";
    let mensaje = "";


    if (estado === "Aprobado") {

        asunto =
            "Tu pedido fue aceptado";


        mensaje =
            "Tu pedido fue aceptado por el comedor.";

    }

    else if (estado === "Rechazado") {

        asunto =
            "Tu pedido fue rechazado";


        mensaje =
            "Tu pedido fue rechazado por el comedor.";

    }

    else {

        asunto =
            "Actualización de tu pedido";


        mensaje =
            "Tu pedido fue actualizado por el comedor.";

    }


    const params = {

        to_email:
            email,

        asunto:
            asunto,

        mensaje:
            mensaje,

        usuario:
            email,

        fecha_evento:
            formatearFecha(
                pedido.fechaEvento
            ),

        hora:
            pedido.hora || "",

        lugar:
            pedido.lugar || "",

        personas:
            pedido.personas || "",

        numero_documento:
            pedido.numeroDocumento || "",

        productos:
            productosTexto,

        total:
            formatoMoneda(total),

        respuesta_comedor:
            respuesta ||
            "Sin comentarios."

    };


    console.log(
        "Enviando respuesta al solicitante:",
        params
    );


    /*
     * IMPORTANTE:
     * Este es el único envío que hacemos desde acá.
     *
     * Usamos el template:
     * template_wrbm6sm
     */

    await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_RESPUESTA_TEMPLATE_ID,
        params
    );

}


// =====================================================
// CERRAR PEDIDO
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


            pedidoActualId = null;

        };

}


// =====================================================
// UTILIDADES
// =====================================================

function setText(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.innerText =
            valor;

    }

}


function formatoMoneda(
    valor
) {

    return `$ ${Number(
        valor || 0
    ).toLocaleString(
        "es-AR"
    )}`;

}


function formatearFecha(
    fecha
) {

    if (!fecha) {

        return "-";

    }


    const partes =
        fecha.split("-");


    if (
        partes.length !== 3
    ) {

        return fecha;

    }


    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


function escapeHtml(
    text
) {

    return String(
        text || ""
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


function formatearFechaAsunto(
    fecha
) {

    if (!fecha) {
        return "";
    }


    const partes =
        fecha.split("-");


    if (
        partes.length !== 3
    ) {

        return fecha;

    }


    return `${partes[2]}-${partes[1]}-${partes[0]}`;

}


// =====================================================
// INICIO
// =====================================================

cargarProductos();