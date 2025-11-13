import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CoordinadorService } from '../services/coordinador.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { GoogleMapsService } from '../services/google-maps.service';
import { Coordinador, Llamada, Estadisticas } from '../models/coordinador.model';
import * as XLSX from 'xlsx-js-style';

@Component({
  selector: 'app-coordinadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coordinadores.component.html',
  styleUrl: './coordinadores.component.css'
})
export class CoordinadoresComponent implements OnInit {
  coordinadores: Coordinador[] = [];
  estadisticas: Estadisticas = { total: 0 };
  nombreUsuario: string = '';
  Math = Math; // Para usar Math en el template

  // Filtros
  filtroMunicipio: string = '';

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 10;

  // Modal de nuevo coordinador
  mostrarModalNuevo: boolean = false;
  nuevoCoordinador: Coordinador = {
    ciudad: '',
    municipio: '',
    nombreCompleto: '',
    celular: '',
    email: '',
    confirmado: false,
    numeroInvitados: 0,
    latitud: undefined,
    longitud: undefined
  };
  
  // Autocomplete Google Maps - Nuevo defensor
  ciudadSugerencias: any[] = [];
  municipioSugerencias: any[] = [];
  mostrandoSugerenciasCiudad: boolean = false;
  mostrandoSugerenciasMunicipio: boolean = false;
  
  // Autocomplete Google Maps - Editar defensor
  ciudadSugerenciasEditar: any[] = [];
  municipioSugerenciasEditar: any[] = [];
  mostrandoSugerenciasCiudadEditar: boolean = false;
  mostrandoSugerenciasMunicipioEditar: boolean = false;

  // Modal de historial de llamadas
  mostrarModalHistorial: boolean = false;
  coordinadorSeleccionadoHistorial: Coordinador | null = null;
  historialLlamadas: Llamada[] = [];
  nuevaLlamadaObservaciones: string = '';

  // Modal de confirmación de eliminación
  mostrarModalEliminar: boolean = false;
  coordinadorAEliminar: Coordinador | null = null;

  // Modal de edición
  mostrarModalEditar: boolean = false;
  coordinadorEditando: Coordinador | null = null;

  constructor(
    private coordinadorService: CoordinadorService,
    private authService: AuthService,
    private toastService: ToastService,
    private googleMapsService: GoogleMapsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.nombreUsuario = this.authService.getNombreUsuario();
    this.cargarCoordinadores();
  }

  cargarCoordinadores(): void {
    this.coordinadorService.obtenerTodos().subscribe({
      next: (data) => {
        // Calcular el número de llamadas para cada coordinador
        this.coordinadores = data.map(coord => ({
          ...coord,
          numeroLlamadas: coord.llamadas ? coord.llamadas.length : 0
        }));
        // Actualizar estadísticas
        this.estadisticas.total = this.coordinadores.length;
      },
      error: (error) => {
        this.toastService.error('Error al cargar defensores');
        console.error('Error:', error);
      }
    });
  }

  get coordinadoresFiltrados(): Coordinador[] {
    const filtrados = this.coordinadores.filter(coord => {
      const coincide = !this.filtroMunicipio ||
        (coord.ciudad && coord.ciudad.toLowerCase().includes(this.filtroMunicipio.toLowerCase())) ||
        (coord.municipio && coord.municipio.toLowerCase().includes(this.filtroMunicipio.toLowerCase())) ||
        coord.nombreCompleto.toLowerCase().includes(this.filtroMunicipio.toLowerCase()) ||
        coord.celular.includes(this.filtroMunicipio) ||
        (coord.email && coord.email.toLowerCase().includes(this.filtroMunicipio.toLowerCase())) ||
        (coord.observaciones && coord.observaciones.toLowerCase().includes(this.filtroMunicipio.toLowerCase()));

      return coincide;
    });

    // Ordenar por ciudad y municipio alfabéticamente
    return filtrados.sort((a, b) => {
      const ciudadA = a.ciudad || '';
      const ciudadB = b.ciudad || '';
      const municipioA = a.municipio || '';
      const municipioB = b.municipio || '';
      
      const ciudadCompare = ciudadA.localeCompare(ciudadB);
      if (ciudadCompare !== 0) return ciudadCompare;
      return municipioA.localeCompare(municipioB);
    });
  }

  get coordinadoresPaginados(): Coordinador[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.coordinadoresFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.coordinadoresFiltrados.length / this.itemsPorPagina);
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  cambiarItemsPorPagina(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.itemsPorPagina = parseInt(select.value);
    this.paginaActual = 1; // Volver a la primera página
  }

  resetearPaginacion(): void {
    this.paginaActual = 1;
  }


  verHistorialLlamadas(coordinador: Coordinador): void {
    this.coordinadorSeleccionadoHistorial = coordinador;
    this.mostrarModalHistorial = true;
    this.cargarHistorialLlamadas(coordinador.id!);
  }

  cargarHistorialLlamadas(coordinadorId: number): void {
    this.coordinadorService.obtenerLlamadasPorCoordinador(coordinadorId).subscribe({
      next: (data) => {
        this.historialLlamadas = data;
      },
      error: (error) => {
        this.toastService.error('Error al cargar historial de llamadas');
        console.error('Error:', error);
      }
    });
  }

  cerrarModalHistorial(): void {
    this.mostrarModalHistorial = false;
    this.coordinadorSeleccionadoHistorial = null;
    this.historialLlamadas = [];
    this.nuevaLlamadaObservaciones = '';
  }

  registrarNuevaLlamada(): void {
    if (!this.coordinadorSeleccionadoHistorial) return;

    this.coordinadorService.registrarLlamada(
      this.coordinadorSeleccionadoHistorial.id!,
      this.nuevaLlamadaObservaciones
    ).subscribe({
      next: () => {
        this.toastService.success('📞 Llamada registrada exitosamente');
        this.nuevaLlamadaObservaciones = '';
        this.cargarHistorialLlamadas(this.coordinadorSeleccionadoHistorial!.id!);
        this.cargarCoordinadores();
      },
      error: (error) => {
        this.toastService.error('Error al registrar llamada');
        console.error('Error:', error);
      }
    });
  }

  eliminarLlamada(llamadaId: number): void {
    if (!confirm('¿Está seguro de que desea eliminar esta llamada?')) return;

    this.coordinadorService.eliminarLlamada(llamadaId).subscribe({
      next: () => {
        this.toastService.success('🗑️ Llamada eliminada exitosamente');
        this.cargarHistorialLlamadas(this.coordinadorSeleccionadoHistorial!.id!);
        this.cargarCoordinadores();
      },
      error: (error) => {
        this.toastService.error('Error al eliminar llamada');
        console.error('Error:', error);
      }
    });
  }

  abrirModalNuevo(): void {
    this.nuevoCoordinador = {
      ciudad: '',
      municipio: '',
      nombreCompleto: '',
      celular: '',
      email: '',
      confirmado: false,
      numeroInvitados: 0,
      latitud: undefined,
      longitud: undefined
    };
    this.ciudadSugerencias = [];
    this.municipioSugerencias = [];
    this.mostrandoSugerenciasCiudad = false;
    this.mostrandoSugerenciasMunicipio = false;
    this.mostrarModalNuevo = true;
  }

  cerrarModalNuevo(): void {
    this.mostrarModalNuevo = false;
    this.ciudadSugerencias = [];
    this.municipioSugerencias = [];
  }

  async buscarCiudades(event: any): Promise<void> {
    const input = event.target.value;
    if (input.length < 2) {
      this.ciudadSugerencias = [];
      this.mostrandoSugerenciasCiudad = false;
      return;
    }

    try {
      const predictions = await this.googleMapsService.getCitySuggestions(input, 'CO');
      this.ciudadSugerencias = predictions;
      this.mostrandoSugerenciasCiudad = predictions.length > 0;
    } catch (error) {
      console.error('Error al buscar ciudades:', error);
      this.ciudadSugerencias = [];
      this.mostrandoSugerenciasCiudad = false;
    }
  }

  async seleccionarCiudad(prediction: any): Promise<void> {
    this.nuevoCoordinador.ciudad = this.googleMapsService.extractCityName(prediction);
    this.ciudadSugerencias = [];
    this.mostrandoSugerenciasCiudad = false;
    
    // Obtener coordenadas del lugar seleccionado
    if (prediction.place_id) {
      try {
        const coords = await this.googleMapsService.getPlaceCoordinates(prediction.place_id);
        if (coords) {
          this.nuevoCoordinador.latitud = coords.lat;
          this.nuevoCoordinador.longitud = coords.lng;
        }
      } catch (error) {
        console.error('Error al obtener coordenadas:', error);
      }
    }
  }

  async buscarMunicipios(event: any): Promise<void> {
    const input = event.target.value;
    if (input.length < 2) {
      this.municipioSugerencias = [];
      this.mostrandoSugerenciasMunicipio = false;
      return;
    }

    try {
      const predictions = await this.googleMapsService.getMunicipalitySuggestions(input, 'CO');
      this.municipioSugerencias = predictions;
      this.mostrandoSugerenciasMunicipio = predictions.length > 0;
    } catch (error) {
      console.error('Error al buscar municipios:', error);
      this.municipioSugerencias = [];
      this.mostrandoSugerenciasMunicipio = false;
    }
  }

  async seleccionarMunicipio(prediction: any): Promise<void> {
    this.nuevoCoordinador.municipio = this.googleMapsService.extractMunicipalityName(prediction);
    this.municipioSugerencias = [];
    this.mostrandoSugerenciasMunicipio = false;
    
    // Obtener coordenadas del lugar seleccionado
    if (prediction.place_id) {
      try {
        const coords = await this.googleMapsService.getPlaceCoordinates(prediction.place_id);
        if (coords) {
          this.nuevoCoordinador.latitud = coords.lat;
          this.nuevoCoordinador.longitud = coords.lng;
        }
      } catch (error) {
        console.error('Error al obtener coordenadas:', error);
      }
    }
  }

  guardarNuevoCoordinador(): void {
    // Validaciones
    if (!this.nuevoCoordinador.ciudad.trim() && !this.nuevoCoordinador.municipio.trim()) {
      this.toastService.warning('Debe ingresar al menos una ciudad o un municipio');
      return;
    }
    if (!this.nuevoCoordinador.nombreCompleto.trim()) {
      this.toastService.warning('El nombre completo es obligatorio');
      return;
    }
    if (!this.nuevoCoordinador.celular.trim()) {
      this.toastService.warning('El celular es obligatorio');
      return;
    }

    this.coordinadorService.crear(this.nuevoCoordinador).subscribe({
      next: () => {
        this.toastService.success('✅ Defensor creado exitosamente');
        this.cargarCoordinadores();
        this.cerrarModalNuevo();
      },
      error: (error) => {
        this.toastService.error('Error al crear defensor');
        console.error('Error:', error);
      }
    });
  }


  eliminarCoordinador(coordinador: Coordinador): void {
    // Verificación de permisos - funcionalidad deshabilitada
    this.toastService.error('❌ No tiene permisos para eliminar defensores');
    return;
    
    // Lógica original mantenida (no se ejecuta)
    this.coordinadorAEliminar = coordinador;
    this.mostrarModalEliminar = true;
  }

  confirmarEliminar(): void {
    if (!this.coordinadorAEliminar) return;

    this.coordinadorService.eliminar(this.coordinadorAEliminar.id!).subscribe({
      next: () => {
        this.toastService.success('🗑️ Defensor eliminado exitosamente');
        this.cargarCoordinadores();
        this.cerrarModalEliminar();
      },
      error: (error) => {
        this.toastService.error('Error al eliminar defensor');
        console.error('Error:', error);
        this.cerrarModalEliminar();
      }
    });
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.coordinadorAEliminar = null;
  }

  formatearFecha(fecha: Date | undefined): string {
    if (!fecha) return 'No contactado';
    return new Date(fecha).toLocaleString('es-ES');
  }

  exportarAExcel(): void {
    // Verificación de permisos - funcionalidad deshabilitada
    this.toastService.error('❌ No tiene permisos para exportar a Excel');
    return;
    
    // Lógica original mantenida (no se ejecuta)
    this.toastService.info('⏳ Generando archivo Excel...');

    // Obtener todos los coordinadores
    this.coordinadorService.obtenerTodos().subscribe({
      next: (coordinadores) => {
        const datosExcel: any[] = [];

        coordinadores.forEach(coordinador => {
          // Agregar fila del defensor
          datosExcel.push({
            'Ciudad': coordinador.ciudad || '-',
            'Municipio': coordinador.municipio || '-',
            'Nombre Completo': coordinador.nombreCompleto,
            'Celular': coordinador.celular,
            'Email': coordinador.email || '-',
            'Número de Llamadas': coordinador.llamadas ? coordinador.llamadas.length : 0,
            'Número de Invitados': coordinador.numeroInvitados,
            'Fecha Llamada': this.formatearFecha(coordinador.fechaLlamada),
            'Observaciones': coordinador.observaciones || '-'
          });
        });

        this.generarArchivoExcel(datosExcel);
      },
      error: (error) => {
        this.toastService.error('Error al obtener datos para exportar');
        console.error('Error:', error);
      }
    });
  }

  private generarArchivoExcel(datos: any[]): void {
    // Crear libro de trabajo
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos);

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 20 }, // Ciudad
      { wch: 20 }, // Municipio
      { wch: 30 }, // Nombre Completo
      { wch: 15 }, // Celular
      { wch: 25 }, // Email
      { wch: 18 }, // Número de Llamadas
      { wch: 18 }, // Número de Invitados
      { wch: 20 }, // Fecha Llamada
      { wch: 30 }  // Observaciones
    ];
    ws['!cols'] = colWidths;

    // Obtener el rango de celdas
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Aplicar estilos a las celdas de encabezado (primera fila)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!ws[address]) continue;

      ws[address].s = {
        fill: { fgColor: { rgb: "003893" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }

    // Aplicar estilos a las filas de datos
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[address]) continue;

        ws[address].s = {
          fill: { fgColor: { rgb: "FFFFFF" } },
          font: {
            sz: 11,
            name: "Calibri",
            bold: false
          },
          alignment: {
            horizontal: C === 2 ? "left" : "center",
            vertical: "center",
            wrapText: true
          },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          }
        };
      }
    }

    // Configurar altura de filas
    const rowHeights = [];
    for (let R = range.s.r; R <= range.e.r; ++R) {
      rowHeights.push({ hpx: R === 0 ? 30 : 25 });
    }
    ws['!rows'] = rowHeights;

    // Crear el libro y agregar la hoja
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Defensores');

    // Generar archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Defensores_${fecha}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);

    this.toastService.success('✅ Archivo Excel descargado exitosamente');
  }

  logout(): void {
    this.toastService.info('🚪 Se ha cerrado la sesión');
    this.authService.logout();
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 500);
  }

  irAMapaCalor(): void {
    // Verificación de permisos - funcionalidad deshabilitada
    this.toastService.error('❌ No tiene permisos para ver el mapa de calor');
    return;
    
    // Lógica original mantenida (no se ejecuta)
    this.router.navigate(['/mapa-calor']);
  }

  abrirModalEditar(coordinador: Coordinador): void {
    this.coordinadorEditando = { ...coordinador };
    this.ciudadSugerenciasEditar = [];
    this.municipioSugerenciasEditar = [];
    this.mostrandoSugerenciasCiudadEditar = false;
    this.mostrandoSugerenciasMunicipioEditar = false;
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.coordinadorEditando = null;
    this.ciudadSugerenciasEditar = [];
    this.municipioSugerenciasEditar = [];
  }

  async buscarCiudadesEditar(event: any): Promise<void> {
    const input = event.target.value;
    if (input.length < 2) {
      this.ciudadSugerenciasEditar = [];
      this.mostrandoSugerenciasCiudadEditar = false;
      return;
    }

    try {
      const predictions = await this.googleMapsService.getCitySuggestions(input, 'CO');
      this.ciudadSugerenciasEditar = predictions;
      this.mostrandoSugerenciasCiudadEditar = predictions.length > 0;
    } catch (error) {
      console.error('Error al buscar ciudades:', error);
      this.ciudadSugerenciasEditar = [];
      this.mostrandoSugerenciasCiudadEditar = false;
    }
  }

  async seleccionarCiudadEditar(prediction: any): Promise<void> {
    if (!this.coordinadorEditando) return;
    this.coordinadorEditando.ciudad = this.googleMapsService.extractCityName(prediction);
    this.ciudadSugerenciasEditar = [];
    this.mostrandoSugerenciasCiudadEditar = false;
    
    // Obtener coordenadas del lugar seleccionado
    if (prediction.place_id) {
      try {
        const coords = await this.googleMapsService.getPlaceCoordinates(prediction.place_id);
        if (coords) {
          this.coordinadorEditando.latitud = coords.lat;
          this.coordinadorEditando.longitud = coords.lng;
        }
      } catch (error) {
        console.error('Error al obtener coordenadas:', error);
      }
    }
  }

  async buscarMunicipiosEditar(event: any): Promise<void> {
    if (!this.coordinadorEditando) return;
    const input = event.target.value;
    if (input.length < 2) {
      this.municipioSugerenciasEditar = [];
      this.mostrandoSugerenciasMunicipioEditar = false;
      return;
    }

    try {
      const predictions = await this.googleMapsService.getMunicipalitySuggestions(input, 'CO');
      this.municipioSugerenciasEditar = predictions;
      this.mostrandoSugerenciasMunicipioEditar = predictions.length > 0;
    } catch (error) {
      console.error('Error al buscar municipios:', error);
      this.municipioSugerenciasEditar = [];
      this.mostrandoSugerenciasMunicipioEditar = false;
    }
  }

  async seleccionarMunicipioEditar(prediction: any): Promise<void> {
    if (!this.coordinadorEditando) return;
    this.coordinadorEditando.municipio = this.googleMapsService.extractMunicipalityName(prediction);
    this.municipioSugerenciasEditar = [];
    this.mostrandoSugerenciasMunicipioEditar = false;
    
    // Obtener coordenadas del lugar seleccionado
    if (prediction.place_id) {
      try {
        const coords = await this.googleMapsService.getPlaceCoordinates(prediction.place_id);
        if (coords) {
          this.coordinadorEditando.latitud = coords.lat;
          this.coordinadorEditando.longitud = coords.lng;
        }
      } catch (error) {
        console.error('Error al obtener coordenadas:', error);
      }
    }
  }

  guardarEdicion(): void {
    if (!this.coordinadorEditando) return;

    if (!this.coordinadorEditando.ciudad.trim() && !this.coordinadorEditando.municipio.trim()) {
      this.toastService.warning('Debe ingresar al menos una ciudad o un municipio');
      return;
    }
    if (!this.coordinadorEditando.nombreCompleto.trim()) {
      this.toastService.warning('El nombre completo es obligatorio');
      return;
    }
    if (!this.coordinadorEditando.celular.trim()) {
      this.toastService.warning('El celular es obligatorio');
      return;
    }

    this.coordinadorService.actualizar(this.coordinadorEditando.id!, this.coordinadorEditando).subscribe({
      next: () => {
        this.toastService.success('✏️ Defensor actualizado exitosamente');
        this.cargarCoordinadores();
        this.cerrarModalEditar();
      },
      error: (error) => {
        this.toastService.error('Error al actualizar defensor');
        console.error('Error:', error);
      }
    });
  }
}
