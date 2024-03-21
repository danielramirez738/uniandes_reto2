const mysql = require("mysql");
const express = require("express");
const session = require("express-session");
const path = require("path");

const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "Password2024*",
  database: "login",
});

const app = express();

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "static")));

app.get("/", function (request, response) {
  // Render login template
  response.sendFile(path.join(__dirname + "/login.html"));
});

app.post("/auth", function (request, response) {
  // Captura campos login
  let username = request.body.username;
  let password = request.body.password;

  if (username && password) {
    connection.query(
      "SELECT * FROM accounts WHERE username = ? AND password = ?",
      [username, password],
      function (error, results, fields) {
        global.result_id;
        global.result_email;
        //Error
        if (error) throw error;
        // Cuenta existe
        if (results.length > 0) {
          // autenticación
          request.session.loggedin = true;
          request.session.username = username;
          result_id = results[0].id;
          result_email = results[0].email;
          // Redirección
          response.redirect("/logout");
        } else {
          response.send("Nombre de usuario y / o contraseña incorrectos!");
        }
        response.end();
      }
    );
  } else {
    response.send("Por favor ingrese nombre de usuario y contraseña.");
    response.end();
  }
});

//cierre sesion
app.get("/logout", function (request, response) {
  if (request.session.loggedin) {
    const consult_session =
      "SELECT * FROM session WHERE token = ? AND id_user = ? AND session_active= 1 ";
    const values_consult_session = [request.session.id, result_id];
    connection.query(
      consult_session,
      values_consult_session,
      (error, result) => {
        if (result.length == 0) {
          response.redirect("/home");
        }
        if (result.length > 0) {
          response.send("Ya existe una sesion abierta.");
          const update_sesion =
            "UPDATE session SET session_active = 0 WHERE token = ? AND id_user = ?";
          const values_update_session = [request.session.id, result_id];
          connection.query(update_sesion, values_update_session);
          request.session.destroy((err) => {
            if (err) {
              console.error("Error al destruir la sesión:", err);
            } else {
              console.log("sesion destruida correctamente");
            }
          });
        }
      }
    );
  }
});

// http://localhost:3000/home
app.get("/home", function (request, response) {
  if (request.session.loggedin) {
    // Consular sesiones
    const consult_session =
      "SELECT * FROM session WHERE token = ? AND id_user = ?";
    const values_consult_session = [request.session.id, result_id];
    connection.query(
      consult_session,
      values_consult_session,
      (error, result) => {
        global.ppal_result = result.length;

        if (global.ppal_result == 0) {
          const insert_session =
            "INSERT INTO session (id_user, token, date_created, session_active) VALUES (?, ?, NOW(), 1)";
          const values_session = [result_id, request.session.id];
          connection.query(insert_session, values_session, (error, result) => {
            if (error) {
              console.error("Error al insertar la sesión:", error);
              return;
            }
            console.log(
              "Sesión insertada correctamente en la tabla de sesiones."
            );
          });
        }
      }
    );
    response.send(
      "<h1>Bienvenido de nuevo, " + request.session.username + "!</h1>"
    );
    console.log("Sesión iniciada correctamente.");
  }
});

app.listen(3000);
