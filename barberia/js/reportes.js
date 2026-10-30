function crearReporte(titulo, encabezados, filas) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta';
  const encabezado = document.createElement('h3');
  encabezado.textContent = titulo;
  tarjeta.append(encabezado, crearTabla(encabezados, filas));
  return tarjeta;
}

function mostrarReportes() {
  const contenedor = document.querySelector('#contenidoReportes');
  const citas = Almacenamiento.leer('citas');
  const completadas = citas.filter((c) => c.estado === 'Completada');
  vaciar(contenedor);

  const porEstado = ESTADOS.map((estado) => [crearEtiquetaEstado(estado), citas.filter((c) => c.estado === estado).length]);
  contenedor.appendChild(crearReporte('Reporte 1 - Citas por estado', ['Estado', 'Cantidad'], porEstado));

  let ingresoTotal = 0;
  const porBarbero = Almacenamiento.leer('barberos').map((barbero) => {
    const propias = completadas.filter((c) => c.codigoBarbero === barbero.codigo);
    const ingreso = propias.reduce((suma, c) => suma + c.costoTotal, 0);
    ingresoTotal += ingreso;
    return [barbero.nombre, propias.length, formatoColones(ingreso)];
  });
  porBarbero.push(['Total', completadas.length, formatoColones(ingresoTotal)]);
  contenedor.appendChild(crearReporte('Reporte 2 - Ingresos por barbero (citas completadas)', ['Barbero', 'Citas completadas', 'Ingresos'], porBarbero));

  const vigentes = citas.filter((c) => c.estado !== 'Cancelada');
  const masSolicitados = Almacenamiento.leer('servicios')
    .map((servicio) => [servicio.nombre, vigentes.filter((c) => c.servicio.includes(servicio.codigo)).length])
    .sort((a, b) => b[1] - a[1]);
  contenedor.appendChild(crearReporte('Reporte 3 - Servicios más solicitados', ['Servicio', 'Veces solicitado'], masSolicitados));
}
