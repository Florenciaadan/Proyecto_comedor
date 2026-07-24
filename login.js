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

    try{

        const credencial = await signInWithEmailAndPassword(

            auth,

            email.value,

            password.value

        );

        const usuario = credencial.user.email;

        const usuarios = await getDocs(collection(db,"usuarios"));

        let rol = "";

        usuarios.forEach(doc=>{

            if(doc.data().email === usuario){

                rol = doc.data().rol;

            }

        });

        if(rol==="admin"){

            window.location.href="admin.html";

        }
        else{

            window.location.href="index.html";

        }

    }
    catch(error){

        mensaje.innerHTML="Usuario o contraseña incorrectos.";

    }

});