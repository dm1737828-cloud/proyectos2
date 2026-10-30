const administradorServicios = crearAdministrador({
  clave: 'servicios',
  campoId: 'codigo',
  formId: 'formServicio',
  tbodyId: 'tbodyServicios',
  numColumnas: 5,
  textoBusqueda: (servicio) => servicio.nombre,
  celdas: (servicio) => [servicio.codigo, servicio.nombre, servicio.descripcion, formatoColones(servicio.precio), servicio.duracionMin + ' min'],
  generarCodigo(lista) {
    const mayor = lista.reduce((max, s) => Math.max(max, Number(s.codigo.slice(1))), 0);
    return 'S' + String(mayor + 1).padStart(3, '0');
  },
  validar(datos) {
    const errores = validarObligatorios(datos);
    if (datos.precio && !(Number(datos.precio) > 0)) {
      errores.precio = 'El precio debe ser mayor a 0';
    }
    if (datos.duracionMin && !(Number.isInteger(Number(datos.duracionMin)) && Number(datos.duracionMin) > 0)) {
      errores.duracionMin = 'La duración debe ser un entero positivo';
    }
    return errores;
  },
  convertir(datos) {
    datos.precio = Number(datos.precio);
    datos.duracionMin = Number(datos.duracionMin);
  },
  motivoNoEliminar: (servicio) => citasActivas().some((c) => c.servicio.includes(servicio.codigo))
    ? 'No se puede eliminar: el servicio está en citas pendientes o confirmadas' : null
});

function mostrarServicios() {
  administradorServicios.mostrar();
}
