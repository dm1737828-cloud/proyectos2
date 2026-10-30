const ESTADOS = ['Pendiente', 'Confirmada', 'Completada', 'Cancelada'];
const TRANSICIONES = {
  Pendiente: ['Confirmada', 'Cancelada'],
  Confirmada: ['Completada', 'Cancelada'],
  Completada: [],
  Cancelada: []
};
let codigoCitaEditando = null;

function citasActivas() {
  return Almacenamiento.leer('citas').filter((c) => c.estado === 'Pendiente' || c.estado === 'Confirmada');
}

function tieneCitasActivas(campo, valor) {
  return citasActivas().some((cita) => cita[campo] === valor);
}

function generarCodigoCita(citas) {
  const mayor = citas.reduce((max, c) => Math.max(max, Number(c.codigo.slice(4))), 0);
  return 'CIT-' + String(mayor + 1).padStart(4, '0');
}

function calcularResumen(codigosServicios) {
  const elegidos = Almacenamiento.leer('servicios').filter((s) => codigosServicios.includes(s.codigo));
  return {
    costo: elegidos.reduce((total, s) => total + s.precio, 0),
    duracion: elegidos.reduce((total, s) => total + s.duracionMin, 0)
  };
}

function obtenerServiciosMarcados() {
  return Array.from(document.querySelectorAll('#serviciosCita input:checked')).map((i) => i.value);
}

function actualizarResumenCita() {
  const resumen = calcularResumen(obtenerServiciosMarcados());
  document.querySelector('#resumenCita').textContent =
    'Total: ' + formatoColones(resumen.costo) + ' - Duración: ' + resumen.duracion + ' min';
}

function cargarOpcionesCita() {
  const clientes = Almacenamiento.leer('clientes');
  const barberos = Almacenamiento.leer('barberos');
  llenarSelect(document.querySelector('#citCliente'), clientes, (c) => c.cedula, (c) => c.nombre + ' (' + c.cedula + ')', 'Seleccione un cliente');
  llenarSelect(document.querySelector('#citBarbero'), barberos, (b) => b.codigo, (b) => b.nombre, 'Seleccione un barbero');
  llenarSelect(document.querySelector('#filtroBarbero'), barberos, (b) => b.codigo, (b) => b.nombre, 'Todos');
  llenarSelect(document.querySelector('#filtroEstado'), ESTADOS, (e) => e, (e) => e, 'Todos');

  const contenedor = document.querySelector('#serviciosCita');
  const marcados = obtenerServiciosMarcados();
  const bloqueado = codigoCitaEditando !== null;
  vaciar(contenedor);
  Almacenamiento.leer('servicios').forEach((servicio) => {
    const etiqueta = document.createElement('label');
    etiqueta.className = 'opcion';
    const casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.value = servicio.codigo;
    casilla.checked = marcados.includes(servicio.codigo);
    casilla.disabled = bloqueado;
    casilla.addEventListener('change', actualizarResumenCita);
    etiqueta.append(casilla, servicio.nombre + ' (' + formatoColones(servicio.precio) + ', ' + servicio.duracionMin + ' min)');
    contenedor.appendChild(etiqueta);
  });
  actualizarResumenCita();
}

function buscarChoque(datos, inicio, fin) {
  const otras = Almacenamiento.leer('citas').filter((c) =>
    c.fecha === datos.fecha && c.estado !== 'Cancelada' && c.codigo !== codigoCitaEditando);
  for (const otra of otras) {
    const seSolapan = inicio < aMinutos(otra.horaFin) && fin > aMinutos(otra.horaInicio);
    if (seSolapan && otra.codigoBarbero === datos.codigoBarbero) {
      return 'El barbero ya tiene una cita de ' + otra.horaInicio + ' a ' + otra.horaFin;
    }
    if (seSolapan && otra.cedulaCliente === datos.cedulaCliente) {
      return 'El cliente ya tiene una cita en ese horario';
    }
  }
  return null;
}

function validarCita(datos) {
  const errores = {};
  const barbero = Almacenamiento.leer('barberos').find((b) => b.codigo === datos.codigoBarbero);
  if (!Almacenamiento.leer('clientes').some((c) => c.cedula === datos.cedulaCliente)) {
    errores.cedulaCliente = 'Seleccione un cliente existente';
  }
  if (!barbero) {
    errores.codigoBarbero = 'Seleccione un barbero existente';
  }
  if (datos.servicio.length === 0) {
    errores.servicio = 'Seleccione al menos un servicio';
  }
  if (!datos.fecha) {
    errores.fecha = 'Seleccione una fecha';
  } else if (datos.fecha < fechaHoy()) {
    errores.fecha = 'La fecha no puede ser pasada';
  }
  if (!datos.hora) {
    errores.hora = 'Seleccione una hora';
  }
  if (Object.keys(errores).length > 0) {
    return errores;
  }
  const inicio = aMinutos(datos.hora);
  const fin = inicio + datos.duracion;
  if (datos.fecha === fechaHoy() && inicio < aMinutos(horaActual())) {
    errores.hora = 'Esa hora ya pasó';
  } else if (inicio < aMinutos(barbero.horaInicio) || fin > aMinutos(barbero.horaFin)) {
    errores.hora = 'Fuera del horario del barbero (' + barbero.horaInicio + ' - ' + barbero.horaFin + ')';
  } else {
    const choque = buscarChoque(datos, inicio, fin);
    if (choque) {
      errores.hora = choque;
    }
  }
  return errores;
}

function guardarCita(evento) {
  evento.preventDefault();
  const formulario = evento.target;
  limpiarErrores(formulario);
  const servicio = obtenerServiciosMarcados();
  const resumen = calcularResumen(servicio);
  const datos = {
    cedulaCliente: formulario.elements.cedulaCliente.value,
    codigoBarbero: formulario.elements.codigoBarbero.value,
    servicio,
    fecha: formulario.elements.fecha.value,
    hora: formulario.elements.hora.value,
    duracion: resumen.duracion
  };
  const errores = validarCita(datos);
  const camposConError = Object.keys(errores);
  if (camposConError.length > 0) {
    camposConError.forEach((campo) => marcarError(formulario, campo, errores[campo]));
    mostrarMensaje('No se pudo guardar la cita: revise los datos', 'error');
    return;
  }
  const citas = Almacenamiento.leer('citas');
  const horaFin = aHora(aMinutos(datos.hora) + resumen.duracion);
  if (codigoCitaEditando === null) {
    citas.push({
      codigo: generarCodigoCita(citas),
      fechaRegistro: new Date().toISOString(),
      cedulaCliente: datos.cedulaCliente,
      codigoBarbero: datos.codigoBarbero,
      servicio,
      fecha: datos.fecha,
      horaInicio: datos.hora,
      horaFin,
      costoTotal: resumen.costo,
      estado: 'Pendiente'
    });
  } else {
    const cita = citas.find((c) => c.codigo === codigoCitaEditando);
    Object.assign(cita, { codigoBarbero: datos.codigoBarbero, fecha: datos.fecha, horaInicio: datos.hora, horaFin });
  }
  if (!Almacenamiento.guardar('citas', citas)) {
    mostrarMensaje('No se pudo guardar en el navegador', 'error');
    return;
  }
  mostrarMensaje(codigoCitaEditando === null ? 'Cita agendada correctamente' : 'Cita reprogramada', 'exito');
  salirReprogramacion();
  refrescarVistas();
  mostrarSeccion('citas');
}

function reprogramarCita(cita) {
  const formulario = document.querySelector('#formCita');
  codigoCitaEditando = cita.codigo;
  formulario.elements.cedulaCliente.value = cita.cedulaCliente;
  formulario.elements.cedulaCliente.disabled = true;
  formulario.elements.codigoBarbero.value = cita.codigoBarbero;
  formulario.elements.fecha.value = cita.fecha;
  formulario.elements.hora.value = cita.horaInicio;
  document.querySelectorAll('#serviciosCita input').forEach((casilla) => {
    casilla.checked = cita.servicio.includes(casilla.value);
    casilla.disabled = true;
  });
  document.querySelector('#tituloFormCita').textContent = 'Reprogramar cita ' + cita.codigo;
  document.querySelector('#botonGuardarCita').textContent = 'Guardar cambios';
  document.querySelector('#cancelarReprogramacion').classList.remove('oculto');
  actualizarResumenCita();
  mostrarSeccion('nueva-cita');
}

function salirReprogramacion() {
  const formulario = document.querySelector('#formCita');
  codigoCitaEditando = null;
  formulario.reset();
  formulario.elements.cedulaCliente.disabled = false;
  document.querySelectorAll('#serviciosCita input').forEach((casilla) => { casilla.disabled = false; });
  limpiarErrores(formulario);
  document.querySelector('#tituloFormCita').textContent = 'Nueva cita';
  document.querySelector('#botonGuardarCita').textContent = 'Agendar cita';
  document.querySelector('#cancelarReprogramacion').classList.add('oculto');
  actualizarResumenCita();
}

function cambiarEstado(codigo, nuevoEstado) {
  const citas = Almacenamiento.leer('citas');
  const cita = citas.find((c) => c.codigo === codigo);
  if (!cita || !TRANSICIONES[cita.estado].includes(nuevoEstado)) {
    mostrarMensaje('Cambio de estado no permitido', 'error');
    return;
  }
  if (nuevoEstado === 'Cancelada' && !confirm('¿Seguro que desea cancelar la cita ' + codigo + '?')) {
    return;
  }
  cita.estado = nuevoEstado;
  Almacenamiento.guardar('citas', citas);
  mostrarMensaje('La cita ' + codigo + ' ahora está ' + nuevoEstado.toLowerCase(), 'exito');
  refrescarVistas();
}

function nombreCliente(cedula) {
  const cliente = Almacenamiento.leer('clientes').find((c) => c.cedula === cedula);
  return cliente ? cliente.nombre : cedula;
}

function nombreBarbero(codigo) {
  const barbero = Almacenamiento.leer('barberos').find((b) => b.codigo === codigo);
  return barbero ? barbero.nombre : codigo;
}

function nombresServicios(codigos) {
  const servicios = Almacenamiento.leer('servicios');
  return codigos.map((codigo) => {
    const servicio = servicios.find((s) => s.codigo === codigo);
    return servicio ? servicio.nombre : codigo;
  }).join(', ');
}

function crearBotonesCita(cita) {
  const botones = TRANSICIONES[cita.estado].map((estado) =>
    crearBoton(estado === 'Cancelada' ? 'Cancelar' : estado === 'Confirmada' ? 'Confirmar' : 'Completar',
      estado === 'Cancelada' ? 'boton-peligro' : '', () => cambiarEstado(cita.codigo, estado)));
  if (cita.estado === 'Pendiente' || cita.estado === 'Confirmada') {
    botones.push(crearBoton('Reprogramar', 'boton-secundario', () => reprogramarCita(cita)));
  }
  return botones;
}

function mostrarCitas() {
  const fecha = document.querySelector('#filtroFecha').value;
  const barbero = document.querySelector('#filtroBarbero').value;
  const estado = document.querySelector('#filtroEstado').value;
  const cuerpo = document.querySelector('#tbodyCitas');
  const citas = Almacenamiento.leer('citas')
    .filter((c) => (!fecha || c.fecha === fecha) && (!barbero || c.codigoBarbero === barbero) && (!estado || c.estado === estado))
    .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio));
  vaciar(cuerpo);
  if (citas.length === 0) {
    agregarFilaVacia(cuerpo, 9);
    return;
  }
  citas.forEach((cita) => {
    agregarFila(cuerpo, [
      cita.codigo, nombreCliente(cita.cedulaCliente), nombreBarbero(cita.codigoBarbero), nombresServicios(cita.servicio),
      cita.fecha, cita.horaInicio + ' - ' + cita.horaFin, formatoColones(cita.costoTotal), crearEtiquetaEstado(cita.estado)
    ], crearBotonesCita(cita));
  });
}

function buscarCitaPorCodigo(evento) {
  evento.preventDefault();
  const codigo = document.querySelector('#buscarCodigo').value.trim().toUpperCase();
  const detalle = document.querySelector('#detalleCita');
  vaciar(detalle);
  const cita = Almacenamiento.leer('citas').find((c) => c.codigo === codigo);
  const caja = document.createElement('div');
  caja.className = 'detalle';
  if (!cita) {
    caja.textContent = 'Cita no encontrada';
  } else {
    [
      ['Código', cita.codigo], ['Cliente', nombreCliente(cita.cedulaCliente)], ['Barbero', nombreBarbero(cita.codigoBarbero)],
      ['Servicios', nombresServicios(cita.servicio)], ['Fecha', cita.fecha], ['Horario', cita.horaInicio + ' - ' + cita.horaFin],
      ['Costo total', formatoColones(cita.costoTotal)], ['Estado', cita.estado]
    ].forEach(([titulo, valor]) => {
      const linea = document.createElement('p');
      const negrita = document.createElement('strong');
      negrita.textContent = titulo + ': ';
      linea.append(negrita, valor);
      caja.appendChild(linea);
    });
  }
  detalle.appendChild(caja);
}

function mostrarInicio() {
  const cuerpo = document.querySelector('#tbodyInicio');
  const citas = Almacenamiento.leer('citas')
    .filter((c) => c.fecha === fechaHoy() && c.estado !== 'Cancelada')
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  vaciar(cuerpo);
  if (citas.length === 0) {
    agregarFilaVacia(cuerpo, 5);
    return;
  }
  citas.forEach((cita) => agregarFila(cuerpo, [
    cita.horaInicio + ' - ' + cita.horaFin, nombreCliente(cita.cedulaCliente), nombreBarbero(cita.codigoBarbero),
    nombresServicios(cita.servicio), crearEtiquetaEstado(cita.estado)
  ]));
}

function iniciarCitas() {
  document.querySelector('#citFecha').min = fechaHoy();
  document.querySelector('#formCita').addEventListener('submit', guardarCita);
  document.querySelector('#cancelarReprogramacion').addEventListener('click', salirReprogramacion);
  document.querySelector('#formBuscarCodigo').addEventListener('submit', buscarCitaPorCodigo);
  ['#filtroFecha', '#filtroBarbero', '#filtroEstado'].forEach((id) => {
    document.querySelector(id).addEventListener('change', mostrarCitas);
  });
  document.querySelector('#limpiarFiltros').addEventListener('click', () => {
    document.querySelector('#filtroFecha').value = '';
    document.querySelector('#filtroBarbero').value = '';
    document.querySelector('#filtroEstado').value = '';
    mostrarCitas();
  });
}
