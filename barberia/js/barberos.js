const administradorBarberos = crearAdministrador({
  clave: 'barberos',
  campoId: 'codigo',
  formId: 'formBarbero',
  tbodyId: 'tbodyBarberos',
  numColumnas: 4,
  textoBusqueda: (barbero) => barbero.nombre,
  celdas: (barbero) => [barbero.codigo, barbero.nombre, barbero.especialidad, barbero.horaInicio + ' - ' + barbero.horaFin],
  validar(datos, lista, idEditando) {
    const errores = validarObligatorios(datos);
    if (datos.codigo && idEditando === null && lista.some((b) => b.codigo.toLowerCase() === datos.codigo.toLowerCase())) {
      errores.codigo = 'El código ya existe';
    }
    if (datos.horaInicio && datos.horaFin && aMinutos(datos.horaFin) <= aMinutos(datos.horaInicio)) {
      errores.horaFin = 'La hora de fin debe ser mayor a la de inicio';
    }
    return errores;
  },
  motivoNoEliminar: (barbero) => tieneCitasActivas('codigoBarbero', barbero.codigo)
    ? 'No se puede eliminar: el barbero tiene citas pendientes o confirmadas' : null
});

function mostrarBarberos() {
  administradorBarberos.mostrar();
}
