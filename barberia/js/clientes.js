const administradorClientes = crearAdministrador({
  clave: 'clientes',
  campoId: 'cedula',
  formId: 'formCliente',
  tbodyId: 'tbodyClientes',
  buscarId: 'buscarCliente',
  numColumnas: 5,
  textoBusqueda: (cliente) => cliente.nombre + ' ' + cliente.cedula,
  celdas: (cliente) => [cliente.cedula, cliente.nombre, cliente.telefono, cliente.correo, cliente.fechaNacimiento],
  validar(datos, lista, idEditando) {
    const errores = validarObligatorios(datos);
    if (datos.correo && !REGEX_CORREO.test(datos.correo)) {
      errores.correo = 'Correo no válido';
    }
    if (datos.telefono && !REGEX_TELEFONO.test(datos.telefono)) {
      errores.telefono = 'Debe tener 8 dígitos';
    }
    if (datos.fechaNacimiento && (isNaN(new Date(datos.fechaNacimiento)) || datos.fechaNacimiento > fechaHoy())) {
      errores.fechaNacimiento = 'Fecha no válida';
    }
    if (datos.cedula && idEditando === null && lista.some((c) => c.cedula === datos.cedula)) {
      errores.cedula = 'La cédula ya está registrada';
    }
    return errores;
  },
  motivoNoEliminar: (cliente) => tieneCitasActivas('cedulaCliente', cliente.cedula)
    ? 'No se puede eliminar: el cliente tiene citas pendientes o confirmadas' : null
});

function mostrarClientes() {
  administradorClientes.mostrar();
}
