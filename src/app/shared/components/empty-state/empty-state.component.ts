import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  @Input() icon: string = 'pi pi-inbox';
  @Input() title: string = 'No hi ha resultats';
  @Input() description: string = '';
  @Input() buttonText: string = '';
  @Input() buttonRoute: string | null = null;
  @Input() showButton: boolean = true;
  @Output() buttonClick = new EventEmitter<void>();

  onButtonClick() {
    if (this.buttonRoute) {
      return;
    }
    this.buttonClick.emit();
  }
}

