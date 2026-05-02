/**
 * @author Ajay Gandecha, John Schachte
 * @copyright 2024
 * @license MIT
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Reservation } from 'src/app/coworking/coworking.models';
import { Observable, map, timer } from 'rxjs';
import { Router } from '@angular/router';
import { RoomReservationService } from '../../room-reservation/room-reservation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CoworkingService } from '../../coworking.service';

@Component({
  selector: 'coworking-reservation-card',
  templateUrl: './coworking-reservation-card.html',
  standalone: false
})
export class CoworkingReservationCard implements OnInit {
  @Input() reservation!: Reservation;
  @Input() isPane: boolean = true;
  @Output() updateReservationsList = new EventEmitter<void>();
  @Output() isConfirmed = new EventEmitter<boolean>();
  @Output() updateActiveReservation = new EventEmitter<void>();
  @Output() reloadCoworkingHome = new EventEmitter<void>();

  public draftConfirmationDeadline$!: Observable<string>;
  public reservationCountdown$!: Observable<string | null>;
  isCancelExpanded$: Observable<boolean>;

  constructor(
    public router: Router,
    public roomReservationService: RoomReservationService,
    protected snackBar: MatSnackBar,
    public coworkingService: CoworkingService
  ) {
    this.isCancelExpanded$ =
      this.coworkingService.isCancelExpanded.asObservable();
  }

  /**
   * A lifecycle hook that is called after Angular has initialized all data-bound properties of a directive.
   *
   * Use this hook to initialize the directive or component. This is the right place to fetch data from a server,
   * set up any local state, or perform operations that need to be executed only once when the component is instantiated.
   *
   * @returns {void} - This method does not return a value.
   */
  ngOnInit(): void {
    this.draftConfirmationDeadline$ = this.initDraftConfirmationDeadline();
    this.reservationCountdown$ = this.initReservationCountdown();
  }

  checkinDeadline(reservationStart: Date, reservationEnd: Date): Date {
    return new Date(
      Math.min(
        reservationStart.getTime() + 10 * 60 * 1000,
        reservationEnd.getTime()
      )
    );
  }

  cancel() {
    this.roomReservationService.cancel(this.reservation).subscribe({
      next: () => {
        this.refreshCoworkingHome();
      },
      error: (error: Error) => {
        this.snackBar.open(
          'Error: Issue cancelling reservation. Please see CSXL Ambassador for assistance.',
          '',
          { duration: 8000 }
        );
        console.error(error.message);
      }
    });
  }

  confirm() {
    this.isConfirmed.emit(true);
    this.roomReservationService.confirm(this.reservation).subscribe({
      next: () => {
        this.refreshCoworkingHome();
        // this.router.navigateByUrl('/coworking');
      },
      error: (error: Error) => {
        this.snackBar.open(
          'Error: Issue confirming reservation. Please see CSXL Ambassador for assistance.',
          '',
          { duration: 8000 }
        );
        console.error(error.message);
      }
    });
  }

  checkout() {
    this.roomReservationService.checkout(this.reservation).subscribe({
      next: () => this.refreshCoworkingHome(),
      error: (error: Error) => {
        this.snackBar.open(
          'Error: Issue checking out reservation. Please see CSXL Ambassador for assistance.',
          '',
          { duration: 8000 }
        );
        console.error(error.message);
      }
    });
  }

  checkin(): void {
    this.roomReservationService.checkin(this.reservation).subscribe({
      next: () => {
        this.refreshCoworkingHome();
      },
      error: (error: Error) => {
        this.snackBar.open(
          'Error: Issue cancelling reservation. Please see CSXL Ambassador for assistance.',
          '',
          { duration: 8000 }
        );
      }
    });
  }

  private initDraftConfirmationDeadline(): Observable<string> {
    const fiveMinutes =
      5 /* minutes */ * 60 /* seconds */ * 1000; /* milliseconds */

    const reservationDraftDeadline = (reservation: Reservation) => {
      return new Date(reservation.created_at).getTime() + fiveMinutes;
    };

    const deadlineString = (deadline: number): string => {
      const now = new Date().getTime();
      const delta = (deadline - now) / 1000; /* milliseconds */
      if (delta > 60) {
        return `Confirm in ${Math.ceil(delta / 60)} minutes`;
      } else if (delta > 0) {
        return `Confirm in ${Math.ceil(delta)} seconds`;
      } else {
        this.cancel();
        return 'Cancelling...';
      }
    };

    return timer(0, 1000).pipe(
      map(() => this.reservation),
      map(reservationDraftDeadline),
      map(deadlineString)
    );
  }

  private initReservationCountdown(): Observable<string | null> {
    return timer(0, 1000).pipe(
      map(() => this.reservation),
      map((reservation) => this.formatReservationCountdown(reservation))
    );
  }

  public formatReservationCountdown(
    reservation: Reservation,
    now: Date = new Date()
  ): string | null {
    if (
      reservation.state !== 'CONFIRMED' ||
      !reservation.room ||
      reservation.start <= now
    ) {
      return null;
    }

    const totalSeconds = Math.max(
      0,
      Math.floor((reservation.start.getTime() - now.getTime()) / 1000)
    );
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    const padded = (value: number) => value.toString().padStart(2, '0');

    if (days > 0) {
      return `${days}d ${padded(hours)}h ${padded(minutes)}m ${padded(seconds)}s`;
    }

    if (hours > 0) {
      return `${hours}h ${padded(minutes)}m ${padded(seconds)}s`;
    }

    return `${minutes}m ${padded(seconds)}s`;
  }

  refreshCoworkingHome(): void {
    this.reloadCoworkingHome.emit();
    this.router.navigateByUrl('/coworking');
  }

  checkCheckinAllowed(): boolean {
    let now = new Date();
    return (
      new Date(this.reservation!.start) <= now &&
      now <= new Date(this.reservation!.end)
    );
  }

  toggleCancelExpansion(): void {
    this.coworkingService.toggleCancelExpansion();
  }

  /**
   * Evaluates if the cancel operation is expanded or if check-in is allowed.
   *
   * Combines the observable `isCancelExpanded$` with the result of `checkCheckinAllowed()` to
   * determine the UI state. It uses RxJS's `map` to emit true if either condition is met: the
   * cancel operation is expanded (`isCancelExpanded$` is true) or check-in is allowed (`checkCheckinAllowed()`
   * returns true).
   *
   * @returns {Observable<boolean>} Observable that emits true if either condition is true, otherwise false.
   *
   * Usage:
   * Can be used in Angular templates with async pipe for conditional UI rendering:
   * `<ng-container *ngIf="isExpandedOrAllowCheckin() | async">...</ng-container>`
   */
  isExpandedOrAllowCheckin(): Observable<boolean> {
    return this.isCancelExpanded$.pipe(
      map((isCancelExpanded) => isCancelExpanded || this.checkCheckinAllowed())
    );
  }
}
