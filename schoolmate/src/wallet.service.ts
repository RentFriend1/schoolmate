import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class WalletService {
  constructor(private afs: AngularFirestore, private auth: AngularFireAuth) { }

  addExpense(amount: number, category: string, note?: string) {
    return this.auth.user.subscribe(user => {
      if (user) {
        const expense = {
          amount,
          category,
          note: note || '',
          date: new Date(),
          studentId: user.uid
        };
        this.afs.collection('expenses').add(expense);
      }
    });
  }

  getMyExpenses() {
    return this.auth.user.pipe(
      map(user => {
        if (user) {
          return this.afs.collection('expenses', ref =>
            ref.where('studentId', '==', user.uid)
              .orderBy('date', 'desc')
          ).valueChanges({ idField: 'id' });
        } else {
          return [];
        }
      })
    );
  }
}
