import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const btn = document.getElementById("btnIngresar");
const mensaje = document.getElementById("mensaje");

btn.addEventListener("click", async () => {

    mensaje.innerHTML = "";

    try {

        const credencial = await signInWithEmailAndPassword(

            auth,
            email.value.trim(),
            password.value

        );

        const emailUsuario = credencial.user.email;

        const usuarios = await getDocs(collection(db, "usuarios"));

        let rol = "";

        usuarios.forEach(doc => {

            const datos = doc.data();

            if (datos.email === emailUsuario) {

                rol = datos.rol;

            }

        });

        if (rol === "admin") {

            window.location.href = "admin.html";

        } else if (rol === "usuario") {

            window.location.href = "usuario.html";

        } else {

            mensaje.innerHTML = "El usuario no tiene un rol asignado.";

        }

    } catch (error) {

        console.error(error);

        mensaje.innerHTML = "Usuario o contraseña incorrectos.";

    }

});