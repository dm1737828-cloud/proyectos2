const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^\d{8}$/;
let temporizadorMensaje = null;

function fechaHoy() {
  const hoy = new Date();
  return hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
}

function horaActual() {
  const ahora = new Date();
  return String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');
}

function aMinutos(hora) {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

function aHora(minutos) {
  return String(Math.floor(minutos / 60)).padStart(2, '0') + ':' + String(minutos % 60).padStart(2, '0');
}

function formatoColones(monto) {
  return '₡' + Number(monto).toLocaleString('es-CR');
}

function vaciar(elemento) {
  elemento.replaceChildren();
}

function crearBoton(texto, clase, alHacerClick) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'boton ' + clase;
  boton.textContent = texto;
  boton.addEventListener('click', alHacerClick);
  return boton;
}

function agregarFila(tbody, celdas, acciones) {
  const fila = document.createElement('tr');
  celdas.forEach((contenido) => {
    const celda = document.createElement('td');
    if (contenido instanceof Node) {
      celda.appendChild(contenido);
    } else {
      celda.textContent = contenido;
    }
    fila.appendChild(celda);
  });
  if (acciones) {
    const celda = document.createElement('td');
    celda.className = 'acciones';
    acciones.forEach((boton) => celda.appendChild(boton));
    fila.appendChild(celda);
  }
  tbody.appendChild(fila);
}

function agregarFilaVacia(tbody, columnas) {
  const fila = document.createElement('tr');
  const celda = document.createElement('td');
  celda.colSpan = columnas;
  celda.textContent = 'No hay registros para mostrar.';
  fila.appendChild(celda);
  tbody.appendChild(fila);
}

function crearTabla(encabezados, filas) {
  const contenedor = document.createElement('div');
  contenedor.className = 'tabla-scroll';
  const tabla = document.createElement('table');
  const cabecera = document.createElement('thead');
  const filaCabecera = document.createElement('tr');
  encabezados.forEach((texto) => {
    const th = document.createElement('th');
    th.textContent = texto;
    filaCabecera.appendChild(th);
  });
  cabecera.appendChild(filaCabecera);
  const cuerpo = document.createElement('tbody');
  if (filas.length === 0) {
    agregarFilaVacia(cuerpo, encabezados.length);
  }
  filas.forEach((celdas) => agregarFila(cuerpo, celdas));
  tabla.append(cabecera, cuerpo);
  contenedor.appendChild(tabla);
  return contenedor;
}

function crearEtiquetaEstado(estado) {
  const etiqueta = document.createElement('span');
  etiqueta.className = 'estado estado-' + estado.toLowerCase();
  etiqueta.textContent = estado;
  return etiqueta;
}

function llenarSelect(select, items, obtenerValor, obtenerTexto, textoInicial) {
  const valorActual = select.value;
  vaciar(select);
  select.appendChild(new Option(textoInicial, ''));
  items.forEach((item) => select.appendChild(new Option(obtenerTexto(item), obtenerValor(item))));
  if (items.some((item) => obtenerValor(item) === valorActual)) {
    select.value = valorActual;
  }
}

function validarObligatorios(datos) {
  const errores = {};
  Object.keys(datos).forEach((campo) => {
    if (!datos[campo]) {
      errores[campo] = 'Campo obligatorio';
    }
  });
  return errores;
}

function marcarError(formulario, campo, mensaje) {
  const espacio = formulario.querySelector('[data-error-para="' + campo + '"]');
  if (espacio) {
    espacio.textContent = mensaje;
  }
}

function limpiarErrores(formulario) {
  formulario.querySelectorAll('.error').forEach((espacio) => { espacio.textContent = ''; });
}

function mostrarMensaje(texto, tipo) {
  const caja = document.querySelector('#mensaje');
  caja.textContent = texto;
  caja.className = 'mensaje mensaje-' + tipo;
  clearTimeout(temporizadorMensaje);
  temporizadorMensaje = setTimeout(() => caja.classList.add('oculto'), 4000);
}

function mostrarSeccion(id) {
  document.querySelectorAll('.seccion').forEach((seccion) => {
    seccion.classList.toggle('oculto', seccion.id !== 'seccion-' + id);
  });
  document.querySelectorAll('.menu button').forEach((boton) => {
    boton.classList.toggle('activo', boton.dataset.seccion === id);
  });
  document.querySelector('#menuPrincipal').classList.remove('abierto');
  document.querySelector('#botonMenu').setAttribute('aria-expanded', 'false');
  window.scrollTo(0, 0);
}

function iniciarNavegacion() {
  document.querySelectorAll('[data-seccion]').forEach((boton) => {
    boton.addEventListener('click', () => mostrarSeccion(boton.dataset.seccion));
  });
  const botonMenu = document.querySelector('#botonMenu');
  botonMenu.addEventListener('click', () => {
    const abierto = document.querySelector('#menuPrincipal').classList.toggle('abierto');
    botonMenu.setAttribute('aria-expanded', String(abierto));
  });
}
