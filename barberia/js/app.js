function refrescarVistas() {
  mostrarClientes();
  mostrarBarberos();
  mostrarServicios();
  cargarOpcionesCita();
  mostrarCitas();
  mostrarInicio();
  mostrarReportes();
}

document.addEventListener('DOMContentLoaded', () => {
  cargarDatosIniciales();
  iniciarNavegacion();
  iniciarCitas();
  refrescarVistas();
  mostrarSeccion('inicio');
});
