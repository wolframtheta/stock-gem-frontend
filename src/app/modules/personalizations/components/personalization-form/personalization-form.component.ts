import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { PersonalizationsService } from '../../services/personalizations.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { WorkshopsService } from '../../../workshops/services/workshops.service';
import { ConfigService } from '../../../config/services/config.service';
import { Personalization, CreatePersonalizationDto } from '../../models/personalization.model';
import { Client } from '../../../clients/models/client.model';
import { Workshop } from '../../../workshops/models/workshop.model';
import { AssetUrlPipe } from '../../../../core/pipes/asset-url.pipe';

@Component({
  selector: 'app-personalization-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SelectModule,
    AssetUrlPipe,
  ],
  providers: [MessageService],
  templateUrl: './personalization-form.component.html',
  styleUrl: './personalization-form.component.css',
})
export class PersonalizationFormComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('webcamVideo', { static: false }) webcamVideo?: ElementRef<HTMLVideoElement>;
  
  form: FormGroup;
  personalizationId: string | null = null;
  loading = false;
  clients: Client[] = [];
  workshops: Workshop[] = [];
  personalizationTypes: { id: string; name: string }[] = [];
  
  // Webcam properties
  showWebcam = false;
  stream: MediaStream | null = null;
  capturedImage: string | null = null;
  webcamInitialized = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private personalizationsService: PersonalizationsService,
    private clientsService: ClientsService,
    private workshopsService: WorkshopsService,
    private configService: ConfigService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      clientId: ['', [Validators.required]],
      workshopId: [''],
      personalizationTypeId: [''],
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
    this.loadPersonalizationTypes();
    
    this.personalizationId = this.route.snapshot.paramMap.get('id');
    if (this.personalizationId && this.personalizationId !== 'new') {
      this.loadPersonalization();
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

  loadPersonalizationTypes() {
    this.configService.getPersonalizationTypes().subscribe({
      next: (data) => {
        this.personalizationTypes = data;
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

  loadPersonalization() {
    if (!this.personalizationId) return;

    this.loading = true;
    this.personalizationsService.getById(this.personalizationId).subscribe({
      next: (personalization) => {
        this.form.patchValue({
          code: personalization.code,
          clientId: personalization.client.id,
          workshopId: personalization.workshop?.id || '',
          personalizationTypeId: personalization.personalizationTypeId || '',
          description: personalization.description,
          workToDo: personalization.workToDo || '',
          entryDate: this.formatDateForInput(personalization.entryDate),
          deliveryToWorkshopDate: personalization.deliveryToWorkshopDate
            ? this.formatDateForInput(personalization.deliveryToWorkshopDate)
            : '',
          exitFromWorkshopDate: personalization.exitFromWorkshopDate
            ? this.formatDateForInput(personalization.exitFromWorkshopDate)
            : '',
          deliveryToClientDate: personalization.deliveryToClientDate
            ? this.formatDateForInput(personalization.deliveryToClientDate)
            : '',
          cost: personalization.cost,
          pvp: personalization.pvp,
          paymentOnAccount: personalization.paymentOnAccount,
          photo: personalization.photo || '',
        });
        if (personalization.photo) {
          this.capturedImage = personalization.photo;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading personalization:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar la personalization',
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
    const personalizationDto: CreatePersonalizationDto = {
      code: formValue.code,
      clientId: formValue.clientId,
      workshopId: formValue.workshopId || undefined,
      personalizationTypeId: formValue.personalizationTypeId || undefined,
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

    if (this.personalizationId && this.personalizationId !== 'new') {
      // Update
      this.personalizationsService.update(this.personalizationId, personalizationDto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Personalization actualitzada correctament',
          });
          this.router.navigate(['/personalizaciones']);
        },
        error: (error) => {
          console.error('Error updating personalization:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error en actualitzar la personalization',
          });
          this.loading = false;
        },
      });
    } else {
      // Create
      this.personalizationsService.create(personalizationDto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Personalization creada correctament',
          });
          this.router.navigate(['/personalizaciones']);
        },
        error: (error) => {
          console.error('Error creating personalization:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error en crear la personalization',
          });
          this.loading = false;
        },
      });
    }
  }

  cancel() {
    this.stopWebcam();
    this.router.navigate(['/personalizaciones']);
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

