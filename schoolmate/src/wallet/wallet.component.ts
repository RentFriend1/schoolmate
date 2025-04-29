import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Firestore,
  collection,
  getDocs,
  addDoc,
} from '@angular/fire/firestore';

import { Auth } from '@angular/fire/auth';
import { Timestamp } from 'firebase/firestore';

interface Expense {
  id?: string;
  amount: number;
  category: string;
  note: string;
  date: Timestamp | Date;
  studentId: string;
}

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  amount: number = 0;
  category: string = '';
  note: string = '';

  expenses: Expense[] = [];

  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  ngOnInit() {
    // Subscribe to authentication state changes.
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        await this.loadExpenses();
      } else {
        this.expenses = [];
        console.warn("No authenticated user found to load expenses.");
      }
    });
  }

  async loadExpenses() {
    const currentUser = this.auth.currentUser;

    if (currentUser) {
      try {
        const expensesCollection = collection(this.firestore, 'expenses');
        const querySnapshot = await getDocs(expensesCollection);

        this.expenses = querySnapshot.docs
          .map(doc => {
            const data = doc.data() as any;
            return {
              id: doc.id,
              amount: data.amount,
              category: data.category,
              note: data.note,
              date: data.date instanceof Timestamp ? data.date : new Date(data.date.seconds * 1000),
              studentId: data.studentId
            } as Expense;
          })
          .filter(expense => expense.studentId === currentUser.uid) // Filter by studentId
          .sort((a, b) => this.getDate(b.date).getTime() - this.getDate(a.date).getTime()); // Sort by date descending
      } catch (error) {
        console.error("Error loading expenses: ", error);
      }
    }
  }

  async addExpense() {
    const currentUser = this.auth.currentUser;

    if (currentUser && this.amount > 0 && this.category.trim() !== '') {
      try {
        const expenseToAdd = {
          amount: this.amount,
          category: this.category,
          note: this.note || '',
          date: new Date(),
          studentId: currentUser.uid
        };

        const expensesCollection = collection(this.firestore, 'expenses');
        const docRef = await addDoc(expensesCollection, expenseToAdd);

        console.log("Document written with ID: ", docRef.id);

        this.expenses.unshift({
          id: docRef.id,
          amount: expenseToAdd.amount,
          category: expenseToAdd.category,
          note: expenseToAdd.note,
          date: expenseToAdd.date,
          studentId: expenseToAdd.studentId
        });

        this.amount = 0;
        this.category = '';
        this.note = '';
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    } else {
      console.warn("Cannot add expense: User not logged in or fields incomplete.");
    }
  }

  getDate(dateValue: Timestamp | Date): Date {
    if (dateValue instanceof Timestamp) {
      return dateValue.toDate();
    }
    return dateValue;
  }
}
