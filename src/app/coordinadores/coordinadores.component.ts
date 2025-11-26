import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CoordinadorService } from '../services/coordinador.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { GoogleMapsService } from '../services/google-maps.service';
import { WhatsAppService, DestinatarioWhatsApp } from '../services/whatsapp.service';
import { Coordinador, Llamada, Estadisticas } from '../models/coordinador.model';
import { Evento } from '../models/evento.model';
import { EventoService } from '../services/evento.service';
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
    municipio: '',
    sector: '',
    nombreCompleto: '',
    celular: '',
    email: '',
    cedula: '',
    confirmado: false,
    numeroInvitados: 0,
    latitud: undefined,
    longitud: undefined
  };

  // Autocomplete Google Maps - Nuevo defensor
  municipioSugerencias: any[] = [];
  sectorSugerencias: any[] = [];
  mostrandoSugerenciasMunicipio: boolean = false;
  mostrandoSugerenciasSector: boolean = false;
  municipioSeleccionadoDeLista: boolean = false;
  municipioLatitud: number | undefined;
  municipioLongitud: number | undefined;

  // Autocomplete Google Maps - Editar defensor
  municipioSugerenciasEditar: any[] = [];
  sectorSugerenciasEditar: any[] = [];
  mostrandoSugerenciasMunicipioEditar: boolean = false;
  mostrandoSugerenciasSectorEditar: boolean = false;
  municipioSeleccionadoDeListaEditar: boolean = false;
  municipioLatitudEditar: number | undefined;
  municipioLongitudEditar: number | undefined;

  // Modal de historial de llamadas
  mostrarModalHistorial: boolean = false;
  coordinadorSeleccionadoHistorial: Coordinador | null = null;
  historialLlamadas: Llamada[] = [];
  nuevaLlamadaObservaciones: string = '';
  eventos: Evento[] = [];
  eventoSeleccionadoId: number | null = null;

  // Modal de registrar llamada rápida
  mostrarModalRegistrarLlamada: boolean = false;
  coordinadorSeleccionadoLlamada: Coordinador | null = null;
  observacionesLlamadaRapida: string = '';
  eventoSeleccionadoLlamada: number | null = null;

  // Modal de asignación de eventos
  mostrarModalEventos: boolean = false;
  coordinadorSeleccionadoEventos: Coordinador | null = null;

  // Modal de confirmación de eliminación
  mostrarModalEliminar: boolean = false;
  coordinadorAEliminar: Coordinador | null = null;

  // Modal de edición
  mostrarModalEditar: boolean = false;
  coordinadorEditando: Coordinador | null = null;

  // Modal de WhatsApp
  mostrarModalWhatsApp: boolean = false;
  mensajeWhatsApp: string = '';
  plantillaSeleccionada: string = '';
  defensoresSeleccionados: Set<number> = new Set();
  enviandoMensajes: boolean = false;
  
  // Plantillas predefinidas
  plantillas: { nombre: string; mensaje: string }[] = [
    {
      nombre: 'Saludo General',
      mensaje: 'Hola {{nombre}}, esperamos que esté muy bien. Queremos recordarle sobre nuestro evento.'
    },
    {
      nombre: 'Recordatorio de Evento',
      mensaje: 'Hola {{nombre}}, le recordamos que tenemos un evento próximo. Por favor confirme su asistencia.'
    },
    {
      nombre: 'Confirmación',
      mensaje: 'Hola {{nombre}}, queremos confirmar su participación en nuestro evento. Por favor responda este mensaje.'
    },
    {
      nombre: 'Información Importante',
      mensaje: 'Hola {{nombre}}, tenemos información importante que compartir con usted. Por favor contáctenos.'
    }
  ];

  constructor(
    private coordinadorService: CoordinadorService,
    public authService: AuthService,
    private toastService: ToastService,
    private googleMapsService: GoogleMapsService,
    private eventoService: EventoService,
    private whatsAppService: WhatsAppService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.nombreUsuario = this.authService.getNombreUsuario();
    this.cargarCoordinadores();
    this.cargarEventos();
  }

  cargarEventos(): void {
    this.eventoService.obtenerTodos().subscribe({
      next: (data) => {
        this.eventos = data;
      },
      error: (error) => {
        console.error('Error al cargar eventos:', error);
      }
    });
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
        (coord.municipio && coord.municipio.toLowerCase().includes(this.filtroMunicipio.toLowerCase())) ||
        (coord.sector && coord.sector.toLowerCase().includes(this.filtroMunicipio.toLowerCase())) ||
        coord.nombreCompleto.toLowerCase().includes(this.filtroMunicipio.toLowerCase()) ||
        coord.celular.includes(this.filtroMunicipio) ||
        (coord.email && coord.email.toLowerCase().includes(this.filtroMunicipio.toLowerCase())) ||
        (coord.cedula && coord.cedula.includes(this.filtroMunicipio)) ||
        (coord.observaciones && coord.observaciones.toLowerCase().includes(this.filtroMunicipio.toLowerCase()));

      return coincide;
    });

    // Ordenar por municipio y sector alfabéticamente
    return filtrados.sort((a, b) => {
      const municipioA = a.municipio || '';
      const municipioB = b.municipio || '';
      const sectorA = a.sector || '';
      const sectorB = b.sector || '';

      const municipioCompare = municipioA.localeCompare(municipioB);
      if (municipioCompare !== 0) return municipioCompare;
      return sectorA.localeCompare(sectorB);
    });
  }

  // Agrupar coordinadores por municipio y aplanar para mostrar en tabla
  get coordinadoresAgrupados(): Array<Coordinador & {mostrarMunicipio: boolean, municipioConCantidad: string, rowspan: number, esPrimeraFila: boolean}> {
    const agrupados = new Map<string, Coordinador[]>();
    
    this.coordinadoresFiltrados.forEach(coord => {
      const municipio = coord.municipio || 'Sin municipio';
      if (!agrupados.has(municipio)) {
        agrupados.set(municipio, []);
      }
      agrupados.get(municipio)!.push(coord);
    });

    // Aplanar y agregar información de agrupación
    const resultado: Array<Coordinador & {mostrarMunicipio: boolean, municipioConCantidad: string, rowspan: number, esPrimeraFila: boolean}> = [];
    
    Array.from(agrupados.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([municipio, coordinadores]) => {
        coordinadores.forEach((coord, index) => {
          resultado.push({
            ...coord,
            mostrarMunicipio: index === 0, // Solo mostrar municipio en la primera fila
            municipioConCantidad: index === 0 ? `${municipio} (${coordinadores.length})` : '',
            rowspan: coordinadores.length, // Número de filas que debe ocupar
            esPrimeraFila: index === 0 // Indica si es la primera fila del grupo
          });
        });
      });

    return resultado;
  }

  get coordinadoresPaginados(): Array<Coordinador & {mostrarMunicipio: boolean, municipioConCantidad: string, rowspan: number, esPrimeraFila: boolean}> {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    const paginados = this.coordinadoresAgrupados.slice(inicio, fin);
    
    if (paginados.length === 0) {
      return paginados;
    }
    
    // Crear una copia para modificar sin afectar el array original
    const resultado = paginados.map(coord => ({ ...coord }));
    
    // Determinar qué municipios deben mostrarse en esta página
    const municipiosEnPagina = new Map<string, { primeraFila: number, totalEnPagina: number, totalEnGrupo: number }>();
    
    resultado.forEach((coord, index) => {
      const municipio = coord.municipio || 'Sin municipio';
      
      if (!municipiosEnPagina.has(municipio)) {
        // Primera vez que vemos este municipio en esta página
        const totalEnGrupo = this.coordinadoresAgrupados.filter(c => (c.municipio || 'Sin municipio') === municipio).length;
        const totalEnPagina = resultado.filter(c => (c.municipio || 'Sin municipio') === municipio).length;
        
        municipiosEnPagina.set(municipio, {
          primeraFila: index,
          totalEnPagina: totalEnPagina,
          totalEnGrupo: totalEnGrupo
        });
      }
    });
    
    // Verificar si la primera fila de la página continúa un grupo de la página anterior
    if (inicio > 0) {
      const primeraFilaPagina = resultado[0];
      const filaAnterior = this.coordinadoresAgrupados[inicio - 1];
      const municipioPrimeraFila = primeraFilaPagina.municipio || 'Sin municipio';
      const municipioAnterior = filaAnterior.municipio || 'Sin municipio';
      
      // Si el municipio es el mismo, significa que continúa desde la página anterior
      if (municipioPrimeraFila === municipioAnterior) {
        const info = municipiosEnPagina.get(municipioPrimeraFila)!;
        primeraFilaPagina.esPrimeraFila = true;
        primeraFilaPagina.mostrarMunicipio = true;
        primeraFilaPagina.rowspan = info.totalEnPagina;
        primeraFilaPagina.municipioConCantidad = `${municipioPrimeraFila} (${info.totalEnGrupo})`;
      }
    }
    
    // Aplicar configuración a todos los grupos en esta página
    municipiosEnPagina.forEach((info, municipio) => {
      const primeraFila = resultado[info.primeraFila];
      
      // Si no se configuró arriba (nuevo grupo que empieza en esta página)
      if (!primeraFila.esPrimeraFila || !primeraFila.mostrarMunicipio) {
        primeraFila.esPrimeraFila = true;
        primeraFila.mostrarMunicipio = true;
        primeraFila.rowspan = info.totalEnPagina;
        primeraFila.municipioConCantidad = `${municipio} (${info.totalEnGrupo})`;
      }
      
      // Marcar las demás filas del mismo municipio como no primera fila
      resultado.forEach((coord, index) => {
        const coordMunicipio = coord.municipio || 'Sin municipio';
        if (coordMunicipio === municipio && index !== info.primeraFila) {
          coord.esPrimeraFila = false;
          coord.mostrarMunicipio = false;
        }
      });
    });
    
    return resultado;
  }

  get totalPaginas(): number {
    return Math.ceil(this.coordinadoresAgrupados.length / this.itemsPorPagina);
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


  abrirModalRegistrarLlamada(coordinador: Coordinador): void {
    this.coordinadorSeleccionadoLlamada = coordinador;
    this.observacionesLlamadaRapida = '';
    this.eventoSeleccionadoLlamada = null;
    this.mostrarModalRegistrarLlamada = true;
  }

  cerrarModalRegistrarLlamada(): void {
    this.mostrarModalRegistrarLlamada = false;
    this.coordinadorSeleccionadoLlamada = null;
    this.observacionesLlamadaRapida = '';
    this.eventoSeleccionadoLlamada = null;
  }

  registrarLlamadaRapida(): void {
    if (!this.coordinadorSeleccionadoLlamada || !this.eventoSeleccionadoLlamada) {
      this.toastService.warning('Debe seleccionar un evento para registrar la llamada');
      return;
    }

    this.coordinadorService.registrarLlamada(
      this.coordinadorSeleccionadoLlamada.id!,
      this.observacionesLlamadaRapida,
      this.eventoSeleccionadoLlamada
    ).subscribe({
      next: () => {
        this.toastService.success('📞 Llamada registrada exitosamente');
        this.cerrarModalRegistrarLlamada();
        this.cargarCoordinadores();
      },
      error: (error) => {
        this.toastService.error('Error al registrar llamada');
        console.error('Error:', error);
      }
    });
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
    this.historialLlamadas = [];
    this.nuevaLlamadaObservaciones = '';
    this.eventoSeleccionadoId = null;
  }

  registrarNuevaLlamada(): void {
    if (!this.coordinadorSeleccionadoHistorial) return;

    if (!this.eventoSeleccionadoId) {
      this.toastService.warning('Debe seleccionar un evento para registrar la llamada');
      return;
    }

    this.coordinadorService.registrarLlamada(
      this.coordinadorSeleccionadoHistorial.id!,
      this.nuevaLlamadaObservaciones,
      this.eventoSeleccionadoId
    ).subscribe({
      next: () => {
        this.toastService.success('📞 Llamada registrada exitosamente');
        this.nuevaLlamadaObservaciones = '';
        this.eventoSeleccionadoId = null;
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
      municipio: '',
      sector: '',
      nombreCompleto: '',
      celular: '',
      email: '',
      cedula: '',
      confirmado: false,
      numeroInvitados: 0,
      latitud: undefined,
      longitud: undefined
    };
    this.municipioSugerencias = [];
    this.sectorSugerencias = [];
    this.mostrandoSugerenciasMunicipio = false;
    this.mostrandoSugerenciasSector = false;
    this.municipioSeleccionadoDeLista = false;
    this.municipioLatitud = undefined;
    this.municipioLongitud = undefined;
    this.mostrarModalNuevo = true;
  }

  cerrarModalNuevo(): void {
    this.mostrarModalNuevo = false;
    this.municipioSugerencias = [];
    this.sectorSugerencias = [];
  }

  async buscarMunicipios(event: any): Promise<void> {
    const input = event.target.value;
    
    // Si el usuario está escribiendo y no hay coincidencias, marcar como no seleccionado de lista
    if (input.length < 2) {
      this.municipioSugerencias = [];
      this.mostrandoSugerenciasMunicipio = false;
      // Si el usuario borra o modifica el texto, invalidar la selección solo si no coincide con el municipio guardado
      if (this.municipioSeleccionadoDeLista && input !== this.nuevoCoordinador.municipio) {
        this.municipioSeleccionadoDeLista = false;
        this.municipioLatitud = undefined;
        this.municipioLongitud = undefined;
      }
      return;
    }

    try {
      const predictions = await this.googleMapsService.getCitySuggestions(input, 'CO');
      this.municipioSugerencias = predictions;
      this.mostrandoSugerenciasMunicipio = predictions.length > 0;
      
      // Si el usuario está escribiendo y no coincide con la selección anterior, invalidar
      if (this.municipioSeleccionadoDeLista && input !== this.nuevoCoordinador.municipio) {
        this.municipioSeleccionadoDeLista = false;
        this.municipioLatitud = undefined;
        this.municipioLongitud = undefined;
      }
    } catch (error) {
      console.error('Error al buscar municipios:', error);
      this.municipioSugerencias = [];
      this.mostrandoSugerenciasMunicipio = false;
    }
  }

  async seleccionarMunicipio(prediction: any): Promise<void> {
    // Extraer solo el nombre del municipio/ciudad (sin el país ni otros detalles)
    const nombreMunicipio = this.googleMapsService.extractCityName(prediction);
    this.nuevoCoordinador.municipio = nombreMunicipio;
    this.municipioSugerencias = [];
    this.mostrandoSugerenciasMunicipio = false;
    
    // Marcar como seleccionado de lista inmediatamente al hacer clic
    this.municipioSeleccionadoDeLista = true;

    // Obtener coordenadas del lugar seleccionado (obligatorio para municipio)
    if (prediction.place_id) {
      try {
        const coords = await this.googleMapsService.getPlaceCoordinates(prediction.place_id);
        if (coords) {
          // Guardar coordenadas del municipio
          this.municipioLatitud = coords.lat;
          this.municipioLongitud = coords.lng;
          // Si no hay sector o el sector no tiene coordenadas, usar las del municipio
          if (!this.nuevoCoordinador.sector || !this.nuevoCoordinador.sector.trim() || 
              !this.nuevoCoordinador.latitud || !this.nuevoCoordinador.longitud) {
            this.nuevoCoordinador.latitud = coords.lat;
            this.nuevoCoordinador.longitud = coords.lng;
          }
        } else {
          // Si no se obtienen coordenadas, mantener la selección pero mostrar advertencia
          this.toastService.warning('No se pudieron obtener las coordenadas del municipio. Por favor, intente nuevamente.');
          this.municipioSeleccionadoDeLista = false;
        }
      } catch (error) {
        console.error('Error al obtener coordenadas:', error);
        this.toastService.error('Error al obtener coordenadas del municipio');
        this.municipioSeleccionadoDeLista = false;
      }
    } else {
      this.toastService.warning('No se pudieron obtener las coordenadas del municipio');
      this.municipioSeleccionadoDeLista = false;
    }
  }

  async buscarSectores(event: any): Promise<void> {
    const input = event.target.value;
    
    // Requerir que haya un municipio seleccionado antes de buscar sectores
    if (!this.nuevoCoordinador.municipio || !this.nuevoCoordinador.municipio.trim()) {
      this.toastService.warning('Primero debe seleccionar un municipio');
      this.sectorSugerencias = [];
      this.mostrandoSugerenciasSector = false;
      return;
    }

    if (input.length < 2) {
      this.sectorSugerencias = [];
      this.mostrandoSugerenciasSector = false;
      return;
    }

    try {
      const predictions = await this.googleMapsService.getMunicipalitySuggestions(
        input, 
        'CO', 
        this.nuevoCoordinador.municipio
      );
      this.sectorSugerencias = predictions;
      this.mostrandoSugerenciasSector = predictions.length > 0;
    } catch (error) {
      console.error('Error al buscar sectores:', error);
      this.sectorSugerencias = [];
      this.mostrandoSugerenciasSector = false;
    }
  }

  async seleccionarSector(prediction: any): Promise<void> {
    this.nuevoCoordinador.sector = this.googleMapsService.extractMunicipalityName(prediction);
    this.sectorSugerencias = [];
    this.mostrandoSugerenciasSector = false;

    // Obtener coordenadas del lugar seleccionado
    if (prediction.place_id) {
      try {
        const coords = await this.googleMapsService.getPlaceCoordinates(prediction.place_id);
        if (coords) {
          // Si se obtienen coordenadas del sector, usarlas
          this.nuevoCoordinador.latitud = coords.lat;
          this.nuevoCoordinador.longitud = coords.lng;
        } else {
          // Si no se pueden obtener coordenadas del sector, usar las del municipio
          if (this.municipioLatitud && this.municipioLongitud) {
            this.nuevoCoordinador.latitud = this.municipioLatitud;
            this.nuevoCoordinador.longitud = this.municipioLongitud;
            this.toastService.info('No se pudieron obtener las coordenadas del sector. Se usarán las coordenadas del municipio.');
          } else {
            this.toastService.warning('No se pudieron obtener las coordenadas del sector. Por favor, intente nuevamente.');
          }
        }
      } catch (error) {
        console.error('Error al obtener coordenadas:', error);
        // Si hay error, usar coordenadas del municipio si están disponibles
        if (this.municipioLatitud && this.municipioLongitud) {
          this.nuevoCoordinador.latitud = this.municipioLatitud;
          this.nuevoCoordinador.longitud = this.municipioLongitud;
          this.toastService.info('Error al obtener coordenadas del sector. Se usarán las coordenadas del municipio.');
        } else {
          this.toastService.error('Error al obtener coordenadas del sector');
        }
      }
    } else {
      // Si no hay place_id, usar coordenadas del municipio
      if (this.municipioLatitud && this.municipioLongitud) {
        this.nuevoCoordinador.latitud = this.municipioLatitud;
        this.nuevoCoordinador.longitud = this.municipioLongitud;
        this.toastService.info('No se pudieron obtener las coordenadas del sector. Se usarán las coordenadas del municipio.');
      } else {
        this.toastService.warning('No se pudieron obtener las coordenadas del sector');
      }
    }
  }

  guardarNuevoCoordinador(): void {
    // Validaciones
    // Municipio es obligatorio y debe ser seleccionado de la lista
    if (!this.nuevoCoordinador.municipio.trim()) {
      this.toastService.warning('El municipio es obligatorio');
      return;
    }
    
    if (!this.municipioSeleccionadoDeLista) {
      this.toastService.warning('Debe seleccionar el municipio de la lista de sugerencias');
      return;
    }
    
    // Si no hay coordenadas del municipio, no se puede guardar
    if (!this.municipioLatitud || !this.municipioLongitud) {
      this.toastService.warning('No se pudieron obtener las coordenadas del municipio. Por favor, seleccione el municipio nuevamente.');
      return;
    }
    
    // Si hay sector pero no tiene coordenadas, usar las del municipio
    if (this.nuevoCoordinador.sector.trim() && (!this.nuevoCoordinador.latitud || !this.nuevoCoordinador.longitud)) {
      this.nuevoCoordinador.latitud = this.municipioLatitud;
      this.nuevoCoordinador.longitud = this.municipioLongitud;
    }
    
    // Asegurar que siempre haya coordenadas (del municipio al menos)
    if (!this.nuevoCoordinador.latitud || !this.nuevoCoordinador.longitud) {
      this.nuevoCoordinador.latitud = this.municipioLatitud;
      this.nuevoCoordinador.longitud = this.municipioLongitud;
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
        if (error.error && error.error.error) {
          if (error.error.error.includes('cédula ya existe')) {
            this.toastService.error('⚠️ Esta cédula ya existe. Por favor, use otra cédula.');
          } else {
            this.toastService.error('Error: ' + error.error.error);
          }
        } else {
          this.toastService.error('Error al crear defensor');
        }
        console.error('Error:', error);
      }
    });
  }


  eliminarCoordinador(coordinador: Coordinador): void {
    this.coordinadorAEliminar = coordinador;
    this.mostrarModalEliminar = true;
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

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return 'No contactado';
    return new Date(fecha).toLocaleString('es-ES');
  }

  exportarAExcel(): void {
    this.toastService.info('⏳ Generando archivo Excel...');

    // Obtener todos los coordinadores
    this.coordinadorService.obtenerTodos().subscribe({
      next: (coordinadores) => {
        const datosExcel: any[] = [];
        const datosLlamadas: any[] = [];

        // Agrupar por municipio
        const agrupados = new Map<string, Coordinador[]>();
        coordinadores.forEach(coord => {
          const municipio = coord.municipio || 'Sin municipio';
          if (!agrupados.has(municipio)) {
            agrupados.set(municipio, []);
          }
          agrupados.get(municipio)!.push(coord);
        });

        // Crear datos agrupados por municipio (Hoja 1) - Mostrar municipio con cantidad solo en primera fila
        Array.from(agrupados.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .forEach(([municipio, coordinadoresMunicipio]) => {
            coordinadoresMunicipio.forEach((coord, index) => {
              // Obtener última llamada
              const ultimaLlamada = coord.llamadas && coord.llamadas.length > 0
                ? coord.llamadas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
                : null;

              // Obtener eventos únicos de las llamadas
              const eventosLlamadas = coord.llamadas
                ? coord.llamadas
                    .filter(llamada => llamada.evento)
                    .map(llamada => llamada.evento?.nombre)
                    .filter((nombre, index, self) => nombre && self.indexOf(nombre) === index)
                    .join(', ')
                : '-';

              datosExcel.push({
                'Municipio': index === 0 ? `${municipio} (${coordinadoresMunicipio.length})` : '',
                'Sector': coord.sector || '-',
                'Nombre Completo': coord.nombreCompleto,
                'Cédula': coord.cedula || '-',
                'Celular': coord.celular,
                'Email': coord.email || '-',
                'Número de Llamadas': coord.llamadas ? coord.llamadas.length : 0,
                'Última Fecha de Llamada': ultimaLlamada ? this.formatearFecha(ultimaLlamada.fecha) : 'No contactado',
                'Eventos Asociados': eventosLlamadas
              });
            });
          });

        // Agregar detalle de llamadas para la segunda hoja
        coordinadores.forEach(coordinador => {
          if (coordinador.llamadas && coordinador.llamadas.length > 0) {
            coordinador.llamadas.forEach(llamada => {
              datosLlamadas.push({
                'Defensor': coordinador.nombreCompleto,
                'Cédula': coordinador.cedula || '-',
                'Celular': coordinador.celular,
                'Municipio': coordinador.municipio || '-',
                'Sector': coordinador.sector || '-',
                'Fecha Llamada': this.formatearFecha(llamada.fecha),
                'Evento': llamada.evento?.nombre || '-',
                'Lugar Evento': llamada.evento?.lugar || '-',
                'Fecha Evento': llamada.evento?.fecha ? this.formatearFecha(llamada.evento.fecha) : '-',
                'Observaciones Llamada': llamada.observaciones || '-'
              });
            });
          }
        });

        this.generarArchivoExcel(datosExcel, datosLlamadas);
      },
      error: (error) => {
        this.toastService.error('Error al obtener datos para exportar');
        console.error('Error:', error);
      }
    });
  }

  private generarArchivoExcel(datos: any[], datosLlamadas: any[] = []): void {
    // Crear libro de trabajo
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    // ===== HOJA 1: MUNICIPIOS (Resumen agrupado) =====
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos);

    // Ajustar ancho de columnas para la hoja de defensores
    const colWidths = [
      { wch: 30 }, // Municipio
      { wch: 20 }, // Sector
      { wch: 30 }, // Nombre Completo
      { wch: 15 }, // Cédula
      { wch: 15 }, // Celular
      { wch: 25 }, // Email
      { wch: 18 }, // Número de Llamadas
      { wch: 25 }, // Última Fecha de Llamada
      { wch: 30 }  // Eventos Asociados
    ];
    ws['!cols'] = colWidths;

    // Obtener el rango de celdas
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Aplicar estilos a las celdas de encabezado (primera fila) - Usar el nuevo color profesional
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!ws[address]) continue;

      ws[address].s = {
        fill: { fgColor: { rgb: "1E293B" } }, // Color gris oscuro profesional
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

        // Determinar alineación según la columna
        let horizontalAlign: "left" | "center" | "right" = "center";
        if (C === 0 || C === 2 || C === 8) { // Municipio, Nombre Completo, Eventos Asociados
          horizontalAlign = "left";
        }

        ws[address].s = {
          fill: { fgColor: { rgb: "FFFFFF" } },
          font: {
            sz: 11,
            name: "Calibri",
            bold: false
          },
          alignment: {
            horizontal: horizontalAlign,
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

    // Agregar hoja de defensores al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Defensores');

    // ===== HOJA 2: HISTORIAL DE LLAMADAS (si hay datos) =====
    if (datosLlamadas.length > 0) {
      const wsLlamadas: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosLlamadas);

      // Ajustar ancho de columnas para la hoja de llamadas
      const colWidthsLlamadas = [
        { wch: 30 }, // Defensor
        { wch: 15 }, // Cédula
        { wch: 15 }, // Celular
        { wch: 20 }, // Municipio
        { wch: 20 }, // Sector
        { wch: 25 }, // Fecha Llamada
        { wch: 30 }, // Evento
        { wch: 30 }, // Lugar Evento
        { wch: 25 }, // Fecha Evento
        { wch: 40 }  // Observaciones Llamada
      ];
      wsLlamadas['!cols'] = colWidthsLlamadas;

      // Obtener el rango de celdas
      const rangeLlamadas = XLSX.utils.decode_range(wsLlamadas['!ref'] || 'A1');

      // Aplicar estilos a las celdas de encabezado
      for (let C = rangeLlamadas.s.c; C <= rangeLlamadas.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!wsLlamadas[address]) continue;

        wsLlamadas[address].s = {
          fill: { fgColor: { rgb: "1E293B" } },
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
      for (let R = rangeLlamadas.s.r + 1; R <= rangeLlamadas.e.r; ++R) {
        for (let C = rangeLlamadas.s.c; C <= rangeLlamadas.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!wsLlamadas[address]) continue;

          let horizontalAlign: "left" | "center" | "right" = "center";
          if (C === 0 || C === 4 || C === 5 || C === 6 || C === 7 || C === 8 || C === 9) { // Columnas de texto
            horizontalAlign = "left";
          }

          wsLlamadas[address].s = {
            fill: { fgColor: { rgb: "FFFFFF" } },
            font: {
              sz: 11,
              name: "Calibri",
              bold: false
            },
            alignment: {
              horizontal: horizontalAlign,
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
      const rowHeightsLlamadas = [];
      for (let R = rangeLlamadas.s.r; R <= rangeLlamadas.e.r; ++R) {
        rowHeightsLlamadas.push({ hpx: R === 0 ? 30 : 25 });
      }
      wsLlamadas['!rows'] = rowHeightsLlamadas;

      // Agregar hoja de llamadas al libro
      XLSX.utils.book_append_sheet(wb, wsLlamadas, 'Historial de Llamadas');
    }

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
    this.router.navigate(['/mapa-calor']);
  }

  irAEventos(): void {
    this.router.navigate(['/eventos']);
  }

  irAUsuarios(): void {
    this.router.navigate(['/usuarios']);
  }

  irAAuditoria(): void {
    this.router.navigate(['/auditoria']);
  }

  // Funciones de WhatsApp
  abrirModalWhatsAppMasivo(): void {
    this.mensajeWhatsApp = '';
    this.plantillaSeleccionada = '';
    this.defensoresSeleccionados.clear();
    this.mostrarModalWhatsApp = true;
    this.enviandoMensajes = false;
  }

  cerrarModalWhatsApp(): void {
    if (this.enviandoMensajes) {
      return; // No permitir cerrar mientras se envían mensajes
    }
    this.mostrarModalWhatsApp = false;
    this.mensajeWhatsApp = '';
    this.plantillaSeleccionada = '';
    this.defensoresSeleccionados.clear();
  }

  aplicarPlantilla(): void {
    if (this.plantillaSeleccionada) {
      const plantilla = this.plantillas.find(p => p.nombre === this.plantillaSeleccionada);
      if (plantilla) {
        this.mensajeWhatsApp = plantilla.mensaje;
      }
    }
  }

  enviarWhatsApp(): void {
    if (!this.mensajeWhatsApp.trim()) {
      this.toastService.warning('Por favor, redacte un mensaje');
      return;
    }

    if (this.defensoresSeleccionados.size === 0) {
      this.toastService.warning('Por favor, seleccione al menos un defensor');
      return;
    }

    const coordinadoresSeleccionados = this.coordinadores.filter(c => 
      c.id && this.defensoresSeleccionados.has(c.id) && c.celular
    );

    if (coordinadoresSeleccionados.length === 0) {
      this.toastService.warning('No se encontraron defensores seleccionados con número de celular');
      return;
    }

    // Preparar destinatarios para el servicio
    const destinatarios: DestinatarioWhatsApp[] = coordinadoresSeleccionados.map(coord => ({
      celular: coord.celular!,
      nombre: coord.nombreCompleto,
      municipio: coord.municipio,
      sector: coord.sector
    }));

    // Enviar mensajes a través de Twilio
    this.enviandoMensajes = true;
    this.toastService.info('⏳ Enviando mensajes...');

    this.whatsAppService.enviarMensajesMasivos(destinatarios, this.mensajeWhatsApp).subscribe({
      next: (respuesta) => {
        this.enviandoMensajes = false;
        
        if (respuesta.success) {
          if (respuesta.fallidos === 0) {
            this.toastService.success(`✅ Se enviaron ${respuesta.exitosos} mensajes exitosamente`);
          } else {
            this.toastService.warning(
              `⚠️ Se enviaron ${respuesta.exitosos} mensajes, ${respuesta.fallidos} fallaron`
            );
          }
          this.cerrarModalWhatsApp();
        } else {
          this.toastService.error(respuesta.error || 'Error al enviar mensajes');
        }
      },
      error: (error) => {
        this.enviandoMensajes = false;
        console.error('Error al enviar mensajes:', error);
        
        if (error.error && error.error.error) {
          this.toastService.error('Error: ' + error.error.error);
        } else {
          this.toastService.error('Error al enviar mensajes. Verifique la configuración de Twilio.');
        }
      }
    });
  }

  toggleDefensorSeleccionado(id: number | undefined): void {
    if (id === undefined) return;
    if (this.defensoresSeleccionados.has(id)) {
      this.defensoresSeleccionados.delete(id);
    } else {
      this.defensoresSeleccionados.add(id);
    }
  }

  seleccionarTodosDefensores(): void {
    this.coordinadores.forEach(c => {
      if (c.id && c.celular) {
        this.defensoresSeleccionados.add(c.id);
      }
    });
  }

  deseleccionarTodosDefensores(): void {
    this.defensoresSeleccionados.clear();
  }

  abrirModalEditar(coordinador: Coordinador): void {
    this.coordinadorEditando = { ...coordinador };
    this.municipioSugerenciasEditar = [];
    this.sectorSugerenciasEditar = [];
    this.mostrandoSugerenciasMunicipioEditar = false;
    this.mostrandoSugerenciasSectorEditar = false;
    // Si el coordinador ya tiene coordenadas, asumir que el municipio fue seleccionado correctamente
    this.municipioSeleccionadoDeListaEditar = !!(coordinador.latitud && coordinador.longitud);
    this.municipioLatitudEditar = coordinador.latitud;
    this.municipioLongitudEditar = coordinador.longitud;
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.coordinadorEditando = null;
    this.municipioSugerenciasEditar = [];
    this.sectorSugerenciasEditar = [];
    this.municipioSeleccionadoDeListaEditar = false;
    this.municipioLatitudEditar = undefined;
    this.municipioLongitudEditar = undefined;
  }

  async buscarMunicipiosEditar(event: any): Promise<void> {
    if (!this.coordinadorEditando) return;
    const input = event.target.value;
    
    // Si el usuario está escribiendo y no hay coincidencias, marcar como no seleccionado de lista
    if (input.length < 2) {
      this.municipioSugerenciasEditar = [];
      this.mostrandoSugerenciasMunicipioEditar = false;
      // Si el usuario borra o modifica el texto, invalidar la selección solo si no coincide con el municipio guardado
      if (this.municipioSeleccionadoDeListaEditar && input !== this.coordinadorEditando.municipio) {
        this.municipioSeleccionadoDeListaEditar = false;
        this.municipioLatitudEditar = undefined;
        this.municipioLongitudEditar = undefined;
      }
      return;
    }

    try {
      const predictions = await this.googleMapsService.getCitySuggestions(input, 'CO');
      this.municipioSugerenciasEditar = predictions;
      this.mostrandoSugerenciasMunicipioEditar = predictions.length > 0;
      
      // Si el usuario está escribiendo y no coincide con la selección anterior, invalidar
      if (this.municipioSeleccionadoDeListaEditar && input !== this.coordinadorEditando.municipio) {
        this.municipioSeleccionadoDeListaEditar = false;
        this.municipioLatitudEditar = undefined;
        this.municipioLongitudEditar = undefined;
      }
    } catch (error) {
      console.error('Error al buscar municipios:', error);
      this.municipioSugerenciasEditar = [];
      this.mostrandoSugerenciasMunicipioEditar = false;
    }
  }

  async seleccionarMunicipioEditar(prediction: any): Promise<void> {
    if (!this.coordinadorEditando) return;
    
    // Extraer solo el nombre del municipio/ciudad (sin el país ni otros detalles)
    const nombreMunicipio = this.googleMapsService.extractCityName(prediction);
    this.coordinadorEditando.municipio = nombreMunicipio;
    this.municipioSugerenciasEditar = [];
    this.mostrandoSugerenciasMunicipioEditar = false;
    
    // Marcar como seleccionado de lista inmediatamente al hacer clic
    this.municipioSeleccionadoDeListaEditar = true;

    // Obtener coordenadas del lugar seleccionado (obligatorio para municipio)
    if (prediction.place_id) {
      try {
        const coords = await this.googleMapsService.getPlaceCoordinates(prediction.place_id);
        if (coords) {
          // Guardar coordenadas del municipio
          this.municipioLatitudEditar = coords.lat;
          this.municipioLongitudEditar = coords.lng;
          // Si no hay sector o el sector no tiene coordenadas, usar las del municipio
          if (!this.coordinadorEditando.sector || !this.coordinadorEditando.sector.trim() || 
              !this.coordinadorEditando.latitud || !this.coordinadorEditando.longitud) {
            this.coordinadorEditando.latitud = coords.lat;
            this.coordinadorEditando.longitud = coords.lng;
          }
        } else {
          // Si no se obtienen coordenadas, mantener la selección pero mostrar advertencia
          this.toastService.warning('No se pudieron obtener las coordenadas del municipio. Por favor, intente nuevamente.');
          this.municipioSeleccionadoDeListaEditar = false;
        }
      } catch (error) {
        console.error('Error al obtener coordenadas:', error);
        this.toastService.error('Error al obtener coordenadas del municipio');
        this.municipioSeleccionadoDeListaEditar = false;
      }
    } else {
      this.toastService.warning('No se pudieron obtener las coordenadas del municipio');
      this.municipioSeleccionadoDeListaEditar = false;
    }
  }

  async buscarSectoresEditar(event: any): Promise<void> {
    if (!this.coordinadorEditando) return;
    
    // Requerir que haya un municipio seleccionado antes de buscar sectores
    if (!this.coordinadorEditando.municipio || !this.coordinadorEditando.municipio.trim()) {
      this.toastService.warning('Primero debe seleccionar un municipio');
      this.sectorSugerenciasEditar = [];
      this.mostrandoSugerenciasSectorEditar = false;
      return;
    }

    const input = event.target.value;
    if (input.length < 2) {
      this.sectorSugerenciasEditar = [];
      this.mostrandoSugerenciasSectorEditar = false;
      return;
    }

    try {
      const predictions = await this.googleMapsService.getMunicipalitySuggestions(
        input, 
        'CO', 
        this.coordinadorEditando.municipio
      );
      this.sectorSugerenciasEditar = predictions;
      this.mostrandoSugerenciasSectorEditar = predictions.length > 0;
    } catch (error) {
      console.error('Error al buscar sectores:', error);
      this.sectorSugerenciasEditar = [];
      this.mostrandoSugerenciasSectorEditar = false;
    }
  }

  async seleccionarSectorEditar(prediction: any): Promise<void> {
    if (!this.coordinadorEditando) return;
    this.coordinadorEditando.sector = this.googleMapsService.extractMunicipalityName(prediction);
    this.sectorSugerenciasEditar = [];
    this.mostrandoSugerenciasSectorEditar = false;

    // Obtener coordenadas del lugar seleccionado
    if (prediction.place_id) {
      try {
        const coords = await this.googleMapsService.getPlaceCoordinates(prediction.place_id);
        if (coords) {
          // Si se obtienen coordenadas del sector, usarlas
          this.coordinadorEditando.latitud = coords.lat;
          this.coordinadorEditando.longitud = coords.lng;
        } else {
          // Si no se pueden obtener coordenadas del sector, usar las del municipio
          if (this.municipioLatitudEditar && this.municipioLongitudEditar) {
            this.coordinadorEditando.latitud = this.municipioLatitudEditar;
            this.coordinadorEditando.longitud = this.municipioLongitudEditar;
            this.toastService.info('No se pudieron obtener las coordenadas del sector. Se usarán las coordenadas del municipio.');
          } else {
            this.toastService.warning('No se pudieron obtener las coordenadas del sector. Por favor, intente nuevamente.');
          }
        }
      } catch (error) {
        console.error('Error al obtener coordenadas:', error);
        // Si hay error, usar coordenadas del municipio si están disponibles
        if (this.municipioLatitudEditar && this.municipioLongitudEditar) {
          this.coordinadorEditando.latitud = this.municipioLatitudEditar;
          this.coordinadorEditando.longitud = this.municipioLongitudEditar;
          this.toastService.info('Error al obtener coordenadas del sector. Se usarán las coordenadas del municipio.');
        } else {
          this.toastService.error('Error al obtener coordenadas del sector');
        }
      }
    } else {
      // Si no hay place_id, usar coordenadas del municipio
      if (this.municipioLatitudEditar && this.municipioLongitudEditar) {
        this.coordinadorEditando.latitud = this.municipioLatitudEditar;
        this.coordinadorEditando.longitud = this.municipioLongitudEditar;
        this.toastService.info('No se pudieron obtener las coordenadas del sector. Se usarán las coordenadas del municipio.');
      } else {
        this.toastService.warning('No se pudieron obtener las coordenadas del sector');
      }
    }
  }

  guardarEdicion(): void {
    if (!this.coordinadorEditando) return;

    // Validaciones
    // Municipio es obligatorio y debe ser seleccionado de la lista
    if (!this.coordinadorEditando.municipio.trim()) {
      this.toastService.warning('El municipio es obligatorio');
      return;
    }
    
    if (!this.municipioSeleccionadoDeListaEditar) {
      this.toastService.warning('Debe seleccionar el municipio de la lista de sugerencias');
      return;
    }
    
    // Si no hay coordenadas del municipio, no se puede guardar
    if (!this.municipioLatitudEditar || !this.municipioLongitudEditar) {
      this.toastService.warning('No se pudieron obtener las coordenadas del municipio. Por favor, seleccione el municipio nuevamente.');
      return;
    }
    
    // Si hay sector pero no tiene coordenadas, usar las del municipio
    if (this.coordinadorEditando.sector.trim() && (!this.coordinadorEditando.latitud || !this.coordinadorEditando.longitud)) {
      this.coordinadorEditando.latitud = this.municipioLatitudEditar;
      this.coordinadorEditando.longitud = this.municipioLongitudEditar;
    }
    
    // Asegurar que siempre haya coordenadas (del municipio al menos)
    if (!this.coordinadorEditando.latitud || !this.coordinadorEditando.longitud) {
      this.coordinadorEditando.latitud = this.municipioLatitudEditar;
      this.coordinadorEditando.longitud = this.municipioLongitudEditar;
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
        if (error.error && error.error.error) {
          if (error.error.error.includes('cédula ya existe')) {
            this.toastService.error('⚠️ Esta cédula ya existe. Por favor, use otra cédula.');
          } else {
            this.toastService.error('Error: ' + error.error.error);
          }
        } else {
          this.toastService.error('Error al actualizar defensor');
        }
        console.error('Error:', error);
      }
    });
  }

  // Gestión de Eventos del Coordinador
  abrirModalEventos(coordinador: Coordinador): void {
    this.coordinadorSeleccionadoEventos = coordinador;
    this.mostrarModalEventos = true;
  }

  cerrarModalEventos(): void {
    this.mostrarModalEventos = false;
    this.coordinadorSeleccionadoEventos = null;
  }

  estaAsignadoAEvento(eventoId: number): boolean {
    if (!this.coordinadorSeleccionadoEventos || !this.coordinadorSeleccionadoEventos.eventos) return false;
    return this.coordinadorSeleccionadoEventos.eventos.some(e => e.id === eventoId);
  }

  toggleAsignacionEvento(evento: Evento): void {
    if (!this.coordinadorSeleccionadoEventos || !evento.id) return;

    const estaAsignado = this.estaAsignadoAEvento(evento.id);
    const coordinadorId = this.coordinadorSeleccionadoEventos.id!;

    if (estaAsignado) {
      this.coordinadorService.desasignarEvento(coordinadorId, evento.id).subscribe({
        next: () => {
          this.toastService.success(`Desasignado del evento ${evento.nombre}`);
          this.actualizarCoordinadorLocal(coordinadorId);
        },
        error: (error) => {
          this.toastService.error('Error al desasignar evento');
          console.error(error);
        }
      });
    } else {
      this.coordinadorService.asignarEvento(coordinadorId, evento.id).subscribe({
        next: () => {
          this.toastService.success(`Asignado al evento ${evento.nombre}`);
          this.actualizarCoordinadorLocal(coordinadorId);
        },
        error: (error) => {
          this.toastService.error('Error al asignar evento');
          console.error(error);
        }
      });
    }
  }

  actualizarCoordinadorLocal(coordinadorId: number): void {
    this.coordinadorService.obtenerPorId(coordinadorId).subscribe(updatedCoord => {
      if (this.coordinadorSeleccionadoEventos && this.coordinadorSeleccionadoEventos.id === coordinadorId) {
        this.coordinadorSeleccionadoEventos = updatedCoord;
      }
      const index = this.coordinadores.findIndex(c => c.id === coordinadorId);
      if (index !== -1) {
        this.coordinadores[index] = updatedCoord;
      }
    });
  }
}
