import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Usuario, Rol, UsuarioCreate } from '../models/user.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  cargando: boolean = false;
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;

  // Formulario
  usuarioForm: any = {
    id: null,
    username: '',
    password: '',
    email: '',
    nombreCompleto: '',
    activo: true,
    rolId: null as number | null
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.userService.obtenerTodos().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.toastService.show('Error al cargar usuarios', 'error');
        this.cargando = false;
      }
    });

    this.userService.obtenerRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
      }
    });
  }

  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.usuarioForm = {
      id: null,
      username: '',
      password: '',
      email: '',
      nombreCompleto: '',
      activo: true,
      rolId: null
    };
    this.mostrarModal = true;
  }

  abrirModalEditar(usuario: Usuario): void {
    this.modoEdicion = true;
    this.usuarioForm = {
      id: usuario.id,
      username: usuario.username,
      password: '',
      email: usuario.email,
      nombreCompleto: usuario.nombreCompleto,
      activo: usuario.activo,
      rolId: usuario.roles.length > 0 ? usuario.roles[0].id : null
    };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  guardar(): void {
    if (!this.usuarioForm.rolId) {
      this.toastService.show('Debe seleccionar un rol', 'error');
      return;
    }
    
    if (this.modoEdicion) {
      this.actualizar();
    } else {
      this.crear();
    }
  }

  crear(): void {
    const usuarioCreate: UsuarioCreate = {
      username: this.usuarioForm.username,
      password: this.usuarioForm.password,
      email: this.usuarioForm.email,
      nombreCompleto: this.usuarioForm.nombreCompleto,
      roles: [this.usuarioForm.rolId]
    };

    this.userService.crear(usuarioCreate).subscribe({
      next: (usuario) => {
        this.toastService.show('Usuario creado exitosamente', 'success');
        this.cargarDatos();
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error al crear usuario:', error);
        const mensaje = error.error?.error || 'Error al crear usuario';
        this.toastService.show(mensaje, 'error');
      }
    });
  }

  actualizar(): void {
    const usuarioActualizado = {
      username: this.usuarioForm.username,
      email: this.usuarioForm.email,
      nombreCompleto: this.usuarioForm.nombreCompleto,
      activo: this.usuarioForm.activo,
      password: this.usuarioForm.password || undefined
    };

    this.userService.actualizar(this.usuarioForm.id, usuarioActualizado).subscribe({
      next: () => {
        this.toastService.show('Usuario actualizado exitosamente', 'success');
        this.cerrarModal();
        this.cargarDatos();
        
        // Asignar rol único
        if (this.usuarioForm.id && this.usuarioForm.rolId) {
          this.userService.asignarRoles(this.usuarioForm.id, [this.usuarioForm.rolId]).subscribe({
            next: () => {
              this.cargarDatos();
            },
            error: (error) => {
              console.error('Error al asignar rol:', error);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        const mensaje = error.error?.error || 'Error al actualizar usuario';
        this.toastService.show(mensaje, 'error');
      }
    });
  }

  eliminar(id: number, username: string): void {
    if (confirm(`¿Está seguro de eliminar el usuario "${username}"?`)) {
      this.userService.eliminar(id).subscribe({
        next: () => {
          this.toastService.show('Usuario eliminado exitosamente', 'success');
          this.cargarDatos();
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          const mensaje = error.error?.error || 'Error al eliminar usuario';
          this.toastService.show(mensaje, 'error');
        }
      });
    }
  }

  desbloquear(id: number): void {
    this.userService.desbloquearCuenta(id).subscribe({
      next: () => {
        this.toastService.show('Cuenta desbloqueada exitosamente', 'success');
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al desbloquear cuenta:', error);
        this.toastService.show('Error al desbloquear cuenta', 'error');
      }
    });
  }



  getRolesNombres(usuario: Usuario): string {
    return usuario.roles.map(r => r.nombre).join(', ');
  }

  volver(): void {
    this.router.navigate(['/coordinadores']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
