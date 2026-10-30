function crearAdministrador(config) {
  const formulario = document.querySelector('#' + config.formId);
  const cuerpoTabla = document.querySelector('#' + config.tbodyId);
  const buscador = config.buscarId ? document.querySelector('#' + config.buscarId) : null;
  const botonCancelar = formulario.querySelector('.cancelar-edicion');
  const campoId = formulario.elements[config.campoId];
  let idEditando = null;

  function salirEdicion() {
    idEditando = null;
    formulario.reset();
    limpiarErrores(formulario);
    if (campoId) {
      campoId.readOnly = false;
    }
    botonCancelar.classList.add('oculto');
  }

  function mostrar() {
    const texto = buscador ? buscador.value.trim().toLowerCase() : '';
    const lista = Almacenamiento.leer(config.clave)
      .filter((item) => config.textoBusqueda(item).toLowerCase().includes(texto));
    vaciar(cuerpoTabla);
    if (lista.length === 0) {
      agregarFilaVacia(cuerpoTabla, config.numColumnas + 1);
      return;
    }
    lista.forEach((item) => {
      agregarFila(cuerpoTabla, config.celdas(item), [
        crearBoton('Editar', 'boton-secundario', () => editar(item)),
        crearBoton('Eliminar', 'boton-peligro', () => eliminar(item))
      ]);
    });
  }

  function editar(item) {
    idEditando = item[config.campoId];
    Array.from(formulario.elements).forEach((elemento) => {
      if (elemento.name && item[elemento.name] !== undefined) {
        elemento.value = item[elemento.name];
      }
    });
    if (campoId) {
      campoId.readOnly = true;
    }
    botonCancelar.classList.remove('oculto');
    formulario.scrollIntoView();
  }

  function eliminar(item) {
    const motivo = config.motivoNoEliminar(item);
    if (motivo) {
      mostrarMensaje(motivo, 'error');
      return;
    }
    if (!confirm('¿Seguro que desea eliminar este registro?')) {
      return;
    }
    const lista = Almacenamiento.leer(config.clave).filter((i) => i[config.campoId] !== item[config.campoId]);
    Almacenamiento.guardar(config.clave, lista);
    mostrarMensaje('Registro eliminado', 'exito');
    refrescarVistas();
  }

  function guardar(evento) {
    evento.preventDefault();
    limpiarErrores(formulario);
    const datos = {};
    Array.from(formulario.elements).forEach((elemento) => {
      if (elemento.name) {
        datos[elemento.name] = elemento.value.trim();
      }
    });
    const lista = Almacenamiento.leer(config.clave);
    const errores = config.validar(datos, lista, idEditando);
    const camposConError = Object.keys(errores);
    if (camposConError.length > 0) {
      camposConError.forEach((campo) => marcarError(formulario, campo, errores[campo]));
      return;
    }
    if (config.convertir) {
      config.convertir(datos);
    }
    if (idEditando === null) {
      if (config.generarCodigo) {
        datos[config.campoId] = config.generarCodigo(lista);
      }
      lista.push(datos);
    } else {
      datos[config.campoId] = idEditando;
      const posicion = lista.findIndex((i) => i[config.campoId] === idEditando);
      lista[posicion] = datos;
    }
    if (!Almacenamiento.guardar(config.clave, lista)) {
      mostrarMensaje('No se pudo guardar en el navegador', 'error');
      return;
    }
    mostrarMensaje('Registro guardado correctamente', 'exito');
    salirEdicion();
    refrescarVistas();
  }

  formulario.addEventListener('submit', guardar);
  botonCancelar.addEventListener('click', salirEdicion);
  if (buscador) {
    buscador.addEventListener('input', mostrar);
  }
  return { mostrar };
}
