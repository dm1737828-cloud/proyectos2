const Almacenamiento = {
  leer(clave) {
    try {
      const texto = localStorage.getItem(clave);
      return texto ? JSON.parse(texto) : [];
    } catch (error) {
      return [];
    }
  },
  guardar(clave, datos) {
    try {
      localStorage.setItem(clave, JSON.stringify(datos));
      return true;
    } catch (error) {
      return false;
    }
  }
};

function cargarDatosIniciales() {
  const iniciales = {
    barberos: [
      { codigo: 'B001', nombre: 'Carlos Ramírez', especialidad: 'Corte clásico', horaInicio: '09:00', horaFin: '18:00' },
      { codigo: 'B002', nombre: 'Luis Fernández', especialidad: 'Barba y perfilado', horaInicio: '10:00', horaFin: '19:00' },
      { codigo: 'B003', nombre: 'Andrés Solano', especialidad: 'Degradados', horaInicio: '08:00', horaFin: '16:00' }
    ],
    servicios: [
      { codigo: 'S001', nombre: 'Corte de cabello', descripcion: 'Corte con máquina y tijera', precio: 5000, duracionMin: 30 },
      { codigo: 'S002', nombre: 'Barba', descripcion: 'Perfilado y arreglo de barba', precio: 3000, duracionMin: 20 },
      { codigo: 'S003', nombre: 'Corte + barba', descripcion: 'Combo de corte y barba', precio: 7500, duracionMin: 45 },
      { codigo: 'S004', nombre: 'Cejas', descripcion: 'Perfilado de cejas', precio: 1500, duracionMin: 10 },
      { codigo: 'S005', nombre: 'Lavado y peinado', descripcion: 'Lavado con peinado final', precio: 2500, duracionMin: 15 }
    ],
    clientes: [
      { cedula: '101110111', nombre: 'Mario Vargas', telefono: '88881111', correo: 'mario@correo.com', fechaNacimiento: '1998-05-12' },
      { cedula: '202220222', nombre: 'Ana Jiménez', telefono: '88882222', correo: 'ana@correo.com', fechaNacimiento: '2000-09-30' }
    ],
    citas: []
  };
  Object.keys(iniciales).forEach((clave) => {
    if (localStorage.getItem(clave) === null) {
      Almacenamiento.guardar(clave, iniciales[clave]);
    }
  });
}
