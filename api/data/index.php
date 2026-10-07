<?php

error_reporting(0);
date_default_timezone_set("America/Mexico_City");
header('Content-Type: application/json; charset=utf-8');

define('RUTA_DATOS', __DIR__ . '/tarjetas-usuarios.json');

function responder($statusCode, $payload){
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function responderExito($mensaje, $data = null){
    responder(200, [
        'success' => true,
        'message' => $mensaje,
        'data' => $data,
    ]);
}

function responderError($mensaje, $statusCode = 400){
    responder($statusCode, [
        'success' => false,
        'error' => $mensaje,
    ]);
}

function leerTarjetas(){
    if (!file_exists(RUTA_DATOS)) {
        return [];
    }
    $contenido = file_get_contents(RUTA_DATOS);
    $datos = json_decode($contenido, true);
    return is_array($datos) ? $datos : [];
}

function guardarTarjetas($tarjetas){
    return file_put_contents(RUTA_DATOS, json_encode($tarjetas, JSON_PRETTY_PRINT));
}

function accionCrearTarjeta(){
    if ($_SERVER['REQUEST_METHOD'] !== 'POST'){
        responderError('Metodo no permitido. Usa POST.', 405);
    }

    $inputJSON = $_POST['datos_tarjeta'] ?? file_get_contents('php://input');
    $nuevaTarjeta = json_decode($inputJSON, true);

    if (!$nuevaTarjeta || empty($nuevaTarjeta['name'])){
        responderError('Datos invalidos o incompletos', 400);
    }

    $nuevaTarjeta['id'] = uniqid('user_');
    $nuevaTarjeta['createdAt'] = date('Y-m-d H:i:s');

    $nuevaTarjeta['usuario_id'] = $nuevaTarjeta['usuario_id'] ?? null;

    $tarjetas = leerTarjetas();
    $tarjetas[] = $nuevaTarjeta;

    if (guardarTarjetas($tarjetas) === false){
        responderError('Error de permisos', 500);
    }

    responderExito('Tarjeta guardada', $nuevaTarjeta);
}

function accionListarTarjetas(){
    $tarjetas = leerTarjetas();
    responderExito('Tarjetas obtenidas', $tarjetas);
}

$action = $_GET['action'] ?? $_POST['action'] ?? null;
switch($action){
    case 'crear_tarjeta':
        accionCrearTarjeta();
        break;
    case 'listar_tarjetas':
        accionListarTarjetas();
        break;
    default:
        responderError('Accion no reconocida o especificada', 404);
}

