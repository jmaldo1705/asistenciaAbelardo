import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CoordinadorService } from '../services/coordinador.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Coordinador, Estadisticas } from '../models/coordinador.model';
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
  estadisticas: Estadisticas = { total: 0, confirmados: 0, pendientes: 0 };
  nombreUsuario: string = '';
  Math = Math; // Para usar Math en el template
  
  // Filtros
  filtroMunicipio: string = '';
  filtroEstado: string = 'todos';
  
  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  
  // Modal de confirmación
  mostrarModal: boolean = false;
  coordinadorSeleccionado: Coordinador | null = null;
  numeroInvitados: number = 0;
  observaciones: string = '';
  
  // Modal de nuevo coordinador
  mostrarModalNuevo: boolean = false;
  nuevoCoordinador: Coordinador = {
    municipio: '',
    nombreCompleto: '',
    celular: '',
    confirmado: false,
    numeroInvitados: 0
  };
  
  // Modal de confirmación de eliminación
  mostrarModalEliminar: boolean = false;
  coordinadorAEliminar: Coordinador | null = null;
  
  // Modal de confirmación de desmarcar
  mostrarModalDesmarcar: boolean = false;
  coordinadorADesmarcar: Coordinador | null = null;

  constructor(
    private coordinadorService: CoordinadorService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.nombreUsuario = this.authService.getNombreUsuario();
    this.cargarCoordinadores();
    this.cargarEstadisticas();
  }

  cargarCoordinadores(): void {
    this.coordinadorService.obtenerTodos().subscribe({
      next: (data) => {
        this.coordinadores = data;
      },
      error: (error) => {
        this.toastService.error('Error al cargar coordinadores');
        console.error('Error:', error);
      }
    });
  }

  cargarEstadisticas(): void {
    this.coordinadorService.obtenerEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas = data;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  get coordinadoresFiltrados(): Coordinador[] {
    const filtrados = this.coordinadores.filter(coord => {
      const coincideMunicipio = !this.filtroMunicipio || 
        coord.municipio.toLowerCase().includes(this.filtroMunicipio.toLowerCase());
      
      const coincideEstado = this.filtroEstado === 'todos' ||
        (this.filtroEstado === 'confirmados' && coord.confirmado) ||
        (this.filtroEstado === 'pendientes' && !coord.confirmado);
      
      return coincideMunicipio && coincideEstado;
    });

    // Ordenar por: 1) Estado (pendientes primero), 2) Municipio alfabéticamente
    return filtrados.sort((a, b) => {
      // Primero ordenar por estado (no confirmados primero)
      if (a.confirmado !== b.confirmado) {
        return a.confirmado ? 1 : -1;
      }
      // Si tienen el mismo estado, ordenar por municipio alfabéticamente
      return a.municipio.localeCompare(b.municipio);
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

  abrirModalConfirmacion(coordinador: Coordinador): void {
    this.coordinadorSeleccionado = coordinador;
    this.numeroInvitados = coordinador.numeroInvitados || 0;
    this.observaciones = coordinador.observaciones || '';
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.coordinadorSeleccionado = null;
    this.numeroInvitados = 0;
    this.observaciones = '';
  }

  confirmarLlamada(): void {
    if (!this.coordinadorSeleccionado || this.numeroInvitados < 0) {
      this.toastService.warning('Por favor, ingrese un número válido de invitados');
      return;
    }

    const coordinadorId = this.coordinadorSeleccionado.id!;
    
    this.coordinadorService.confirmarLlamada(
      coordinadorId,
      this.numeroInvitados,
      this.observaciones
    ).subscribe({
      next: () => {
        this.toastService.success('✅ Llamada confirmada exitosamente');
        this.cerrarModal();
        this.cargarCoordinadores();
        this.cargarEstadisticas();
        // Redirigir automáticamente a la pantalla de invitados
        setTimeout(() => {
          this.router.navigate(['/coordinadores', coordinadorId, 'invitados']);
        }, 1000);
      },
      error: (error) => {
        this.toastService.error('Error al confirmar llamada');
        console.error('Error:', error);
      }
    });
  }

  verInvitados(coordinador: Coordinador): void {
    this.router.navigate(['/coordinadores', coordinador.id, 'invitados']);
  }

  abrirModalNuevo(): void {
    this.nuevoCoordinador = {
      municipio: '',
      nombreCompleto: '',
      celular: '',
      confirmado: false,
      numeroInvitados: 0
    };
    this.mostrarModalNuevo = true;
  }

  cerrarModalNuevo(): void {
    this.mostrarModalNuevo = false;
  }

  guardarNuevoCoordinador(): void {
    // Validaciones
    if (!this.nuevoCoordinador.municipio.trim()) {
      this.toastService.warning('El municipio es obligatorio');
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
        this.toastService.success('✅ Coordinador creado exitosamente');
        this.cargarCoordinadores();
        this.cargarEstadisticas();
        this.cerrarModalNuevo();
      },
      error: (error) => {
        this.toastService.error('Error al crear coordinador');
        console.error('Error:', error);
      }
    });
  }

  desmarcarConfirmacion(coordinador: Coordinador): void {
    this.coordinadorADesmarcar = coordinador;
    this.mostrarModalDesmarcar = true;
  }

  confirmarDesmarcar(): void {
    if (!this.coordinadorADesmarcar) return;
    
    this.coordinadorService.desmarcarConfirmacion(this.coordinadorADesmarcar.id!).subscribe({
      next: () => {
        this.toastService.success('↺ Confirmación desmarcada exitosamente');
        this.cargarCoordinadores();
        this.cargarEstadisticas();
        this.cerrarModalDesmarcar();
      },
      error: (error) => {
        this.toastService.error('Error al desmarcar confirmación');
        console.error('Error:', error);
        this.cerrarModalDesmarcar();
      }
    });
  }

  cerrarModalDesmarcar(): void {
    this.mostrarModalDesmarcar = false;
    this.coordinadorADesmarcar = null;
  }

  eliminarCoordinador(coordinador: Coordinador): void {
    this.coordinadorAEliminar = coordinador;
    this.mostrarModalEliminar = true;
  }

  confirmarEliminar(): void {
    if (!this.coordinadorAEliminar) return;
    
    this.coordinadorService.eliminar(this.coordinadorAEliminar.id!).subscribe({
      next: () => {
        this.toastService.success('🗑️ Coordinador eliminado exitosamente');
        this.cargarCoordinadores();
        this.cargarEstadisticas();
        this.cerrarModalEliminar();
      },
      error: (error) => {
        this.toastService.error('Error al eliminar coordinador');
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
    this.toastService.info('⏳ Generando archivo Excel...');
    
    // Obtener todos los coordinadores con sus invitados
    this.coordinadorService.obtenerTodos().subscribe({
      next: (coordinadores) => {
        const datosExcel: any[] = [];
        
        coordinadores.forEach(coordinador => {
          // Agregar fila del coordinador
          datosExcel.push({
            'Tipo': 'COORDINADOR',
            'Municipio': coordinador.municipio,
            'Nombre Completo': coordinador.nombreCompleto,
            'Celular': coordinador.celular,
            'Estado': coordinador.confirmado ? 'Confirmado' : 'Pendiente',
            'Número de Invitados': coordinador.numeroInvitados,
            'Fecha Llamada': this.formatearFecha(coordinador.fechaLlamada),
            'Observaciones': coordinador.observaciones || '-'
          });
          
          // Agregar filas de invitados si existen
          if (coordinador.invitados && coordinador.invitados.length > 0) {
            coordinador.invitados.forEach(invitado => {
              datosExcel.push({
                'Tipo': 'INVITADO',
                'Municipio': coordinador.municipio,
                'Nombre Completo': invitado.nombre,
                'Celular': invitado.telefono,
                'Cédula': invitado.cedula,
                'Estado': 'Registrado',
                'Coordinador': coordinador.nombreCompleto,
                'Observaciones': '-'
              });
            });
          }
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
      { wch: 15 }, // Tipo
      { wch: 20 }, // Municipio
      { wch: 30 }, // Nombre Completo
      { wch: 15 }, // Celular
      { wch: 12 }, // Estado o Cédula
      { wch: 18 }, // Número de Invitados o Estado
      { wch: 20 }, // Fecha Llamada o Coordinador
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
      const tipoCell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
      const tipo = tipoCell?.v;
      
      // Obtener el valor de estado (puede estar en diferentes columnas)
      let estado = '';
      const estadoCell4 = ws[XLSX.utils.encode_cell({ r: R, c: 4 })];
      const estadoCell5 = ws[XLSX.utils.encode_cell({ r: R, c: 5 })];
      
      if (estadoCell4?.v === 'Confirmado' || estadoCell4?.v === 'Pendiente') {
        estado = estadoCell4.v;
      } else if (estadoCell5?.v === 'Confirmado' || estadoCell5?.v === 'Pendiente' || estadoCell5?.v === 'Registrado') {
        estado = estadoCell5.v;
      }
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[address]) continue;
        
        // Color de fondo según el tipo
        let fillColor = "FFFFFF";
        let fontBold = false;
        
        if (tipo === "COORDINADOR") {
          if (estado === "Confirmado") {
            fillColor = "D4EDDA"; // Verde claro
          } else if (estado === "Pendiente") {
            fillColor = "FFF3CD"; // Amarillo claro
          }
          fontBold = true;
        } else if (tipo === "INVITADO") {
          fillColor = "E7F3FF"; // Azul muy claro
        }
        
        ws[address].s = {
          fill: { fgColor: { rgb: fillColor } },
          font: { 
            sz: 11, 
            name: "Calibri",
            bold: fontBold
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
        
        // Estilo especial para la columna de Estado
        const cellValue = ws[address].v;
        if (cellValue === "Confirmado") {
          ws[address].s.font = { 
            ...ws[address].s.font, 
            color: { rgb: "155724" }, 
            bold: true 
          };
        } else if (cellValue === "Pendiente") {
          ws[address].s.font = { 
            ...ws[address].s.font, 
            color: { rgb: "856404" }, 
            bold: true 
          };
        } else if (cellValue === "Registrado") {
          ws[address].s.font = { 
            ...ws[address].s.font, 
            color: { rgb: "004085" }, 
            bold: true 
          };
        }
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
    XLSX.utils.book_append_sheet(wb, ws, 'Coordinadores e Invitados');
    
    // Generar archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Coordinadores_Invitados_${fecha}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
    
    this.toastService.success('✅ Archivo Excel descargado exitosamente');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
