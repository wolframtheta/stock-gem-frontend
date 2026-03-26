import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { ComposturasService } from '../../services/composturas.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { WorkshopsService } from '../../../workshops/services/workshops.service';
import { ConfigService } from '../../../config/services/config.service';
import { Compostura, CreateComposturaDto } from '../../models/compostura.model';
import { Client } from '../../../clients/models/client.model';
import { Workshop } from '../../../workshops/models/workshop.model';

@Component({
  selector: 'app-compostura-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SelectModule,
  ],
  providers: [MessageService],
  templateUrl: './compostura-form.component.html',
  styleUrl: './compostura-form.component.css',
})
export class ComposturaFormComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('webcamVideo', { static: false }) webcamVideo?: ElementRef<HTMLVideoElement>;
  
  form: FormGroup;
  composturaId: string | null = null;
  loading = false;
  clients: Client[] = [];
  workshops: Workshop[] = [];
  composturaTypes: { id: string; name: string }[] = [];
  
  // Webcam properties
  showWebcam = false;
  stream: MediaStream | null = null;
  capturedImage: string | null = null;
  webcamInitialized = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private composturasService: ComposturasService,
    private clientsService: ClientsService,
    private workshopsService: WorkshopsService,
    private configService: ConfigService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      clientId: ['', [Validators.required]],
      workshopId: [''],
      composturaTypeId: [''],
      description: ['', [Validators.required]],
      workToDo: [''],
      entryDate: ['', [Validators.required]],
      deliveryToWorkshopDate: [''],
      exitFromWorkshopDate: [''],
      deliveryToClientDate: [''],
      cost: [0, [Validators.min(0)]],
      pvp: [0, [Validators.min(0)]],
      paymentOnAccount: [0, [Validators.min(0)]],
      photo: [''],
    });
  }

  ngOnInit() {
    this.loadClients();
    this.loadWorkshops();
    this.loadComposturaTypes();
    
    this.composturaId = this.route.snapshot.paramMap.get('id');
    if (this.composturaId && this.composturaId !== 'new') {
      this.loadCompostura();
    }
  }

  loadClients() {
    this.clientsService.getAll().subscribe({
      next: (data) => {
        this.clients = data;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
      },
    });
  }

  loadComposturaTypes() {
    this.configService.getComposturaTypes().subscribe({
      next: (data) => {
        this.composturaTypes = data;
      },
      error: () => {},
    });
  }

  loadWorkshops() {
    this.workshopsService.getAll().subscribe({
      next: (data) => {
        this.workshops = data;
      },
      error: (error) => {
        console.error('Error loading workshops:', error);
      },
    });
  }

  loadCompostura() {
    if (!this.composturaId) return;

    this.loading = true;
    this.composturasService.getById(this.composturaId).subscribe({
      next: (compostura) => {
        this.form.patchValue({
          code: compostura.code,
          clientId: compostura.client.id,
          workshopId: compostura.workshop?.id || '',
          composturaTypeId: compostura.composturaTypeId || '',
          description: compostura.description,
          workToDo: compostura.workToDo || '',
          entryDate: this.formatDateForInput(compostura.entryDate),
          deliveryToWorkshopDate: compostura.deliveryToWorkshopDate
            ? this.formatDateForInput(compostura.deliveryToWorkshopDate)
            : '',
          exitFromWorkshopDate: compostura.exitFromWorkshopDate
            ? this.formatDateForInput(compostura.exitFromWorkshopDate)
            : '',
          deliveryToClientDate: compostura.deliveryToClientDate
            ? this.formatDateForInput(compostura.deliveryToClientDate)
            : '',
          cost: compostura.cost,
          pvp: compostura.pvp,
          paymentOnAccount: compostura.paymentOnAccount,
          photo: compostura.photo || '',
        });
        if (compostura.photo) {
          this.capturedImage = compostura.photo;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading compostura:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar la compostura',
        });
        this.loading = false;
      },
    });
  }

  formatDateForInput(date: string): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Validar paymentOnAccount <= pvp
    const pvp = this.form.get('pvp')?.value || 0;
    const paymentOnAccount = this.form.get('paymentOnAccount')?.value || 0;
    
    if (paymentOnAccount > pvp) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'El pagament a compte no pot ser major que el PVP',
      });
      return;
    }

    this.loading = true;
    const formValue = this.form.value;
    const composturaDto: CreateComposturaDto = {
      code: formValue.code,
      clientId: formValue.clientId,
      workshopId: formValue.workshopId || undefined,
      composturaTypeId: formValue.composturaTypeId || undefined,
      description: formValue.description,
      workToDo: formValue.workToDo || undefined,
      entryDate: formValue.entryDate,
      deliveryToWorkshopDate: formValue.deliveryToWorkshopDate || undefined,
      exitFromWorkshopDate: formValue.exitFromWorkshopDate || undefined,
      deliveryToClientDate: formValue.deliveryToClientDate || undefined,
      cost: formValue.cost || 0,
      pvp: formValue.pvp || 0,
      paymentOnAccount: formValue.paymentOnAccount || 0,
      photo: formValue.photo || undefined,
    };

    if (this.composturaId && this.composturaId !== 'new') {
      // Update
      this.composturasService.update(this.composturaId, composturaDto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Compostura actualitzada correctament',
          });
          this.router.navigate(['/composturas']);
        },
        error: (error) => {
          console.error('Error updating compostura:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error en actualitzar la compostura',
          });
          this.loading = false;
        },
      });
    } else {
      // Create
      this.composturasService.create(composturaDto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Compostura creada correctament',
          });
          this.router.navigate(['/composturas']);
        },
        error: (error) => {
          console.error('Error creating compostura:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error en crear la compostura',
          });
          this.loading = false;
        },
      });
    }
  }

  cancel() {
    this.stopWebcam();
    this.router.navigate(['/composturas']);
  }

  async startWebcam() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer rear camera if available
      });
      this.showWebcam = true;
      this.webcamInitialized = false;
    } catch (error) {
      console.error('Error accessing webcam:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No s\'ha pogut accedir a la webcam. Assegura\'t que tens permisos.',
      });
    }
  }

  ngAfterViewChecked() {
    if (this.showWebcam && this.stream && !this.webcamInitialized && this.webcamVideo?.nativeElement) {
      this.webcamVideo.nativeElement.srcObject = this.stream;
      this.webcamInitialized = true;
    }
  }

  stopWebcam() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.showWebcam = false;
    this.webcamInitialized = false;
  }

  capturePhoto() {
    if (!this.stream || !this.webcamVideo?.nativeElement) return;

    const video = this.webcamVideo.nativeElement;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      this.capturedImage = imageData;
      this.form.patchValue({ photo: imageData });
      this.stopWebcam();
    }
  }

  removePhoto() {
    this.capturedImage = null;
    this.form.patchValue({ photo: '' });
  }

  ngOnDestroy() {
    this.stopWebcam();
  }
}

