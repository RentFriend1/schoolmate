import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Firestore, collection, getDocs, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Timestamp } from 'firebase/firestore';

interface Transaction {
  id?: string;
  amount: number;
  date: Date;
  type: 'income' | 'expense';
  category?: string;
  description: string;
  studentId: string;
}

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  // Form fields for a new transaction
  amount: number = 0;
  selectedType: 'income' | 'expense' = 'expense';
  category: string = '';
  description: string = '';
  // Initialize with today's date (YYYY-MM-DD) so the input is prepopulated.
  date: string = new Date().toISOString().split('T')[0];

  // Transactions
  transactions: Transaction[] = [];
  displayedTransactions: Transaction[] = [];
  balance: number = 0;

  // Pre-defined expense categories
  expenseCategories: string[] = [
    'Food & Drinks',
    'Transport',
    'Accommodation/Rent',
    'Books & Supplies',
    'Entertainment',
    'Fees',
    'Clothing',
    'Personal Care'
  ];
  customCategories: string[] = [];

  // Filter properties
  filterType: string = '';
  filterDateFrom: string = '';
  filterDateTo: string = '';

  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  ngOnInit() {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        await this.loadTransactions();
      } else {
        this.transactions = [];
        this.displayedTransactions = [];
        this.balance = 0;
        console.warn("No authenticated user found to load transactions.");
      }
    });
  }

  async loadTransactions() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      try {
        const transactionsCollection = collection(this.firestore, 'transactions');
        const querySnapshot = await getDocs(transactionsCollection);
        this.transactions = querySnapshot.docs
          .map(docSnapshot => {
            const data = docSnapshot.data() as any;
            const convertedDate =
              data.date instanceof Timestamp
                ? data.date.toDate()
                : new Date(data.date);
            // If conversion fails, fallback to current date
            const validDate = isNaN(convertedDate.getTime()) ? new Date() : convertedDate;

            return {
              id: docSnapshot.id,
              amount: data.amount,
              date: validDate,
              type: data.type,
              category: data.category,
              description: data.description,
              studentId: data.studentId
            } as Transaction;
          })
          .filter(tx => tx.studentId === currentUser.uid)
          .sort((a, b) => b.date.getTime() - a.date.getTime());
        // Initially, display all transactions.
        this.displayedTransactions = [...this.transactions];
        this.calculateBalance();
      } catch (error) {
        console.error("Error loading transactions: ", error);
      }
    }
  }

  async addTransaction() {
    const currentUser = this.auth.currentUser;
    if (currentUser && this.amount > 0 && this.description.trim() !== '' && this.date) {
      try {
        const selectedDate = new Date(this.date);
        const transaction: Transaction = {
          amount: this.amount,
          date: selectedDate,
          type: this.selectedType,
          description: this.description,
          studentId: currentUser.uid
        };

        if (this.selectedType === 'expense' && this.category.trim() !== '') {
          transaction.category = this.category;
        }

        const transactionsCollection = collection(this.firestore, 'transactions');
        // Pass the plain Date object. Firestore will store it as a Timestamp.
        const docRef = await addDoc(transactionsCollection, {
          ...transaction,
          date: selectedDate
        });
        transaction.id = docRef.id;
        this.transactions.unshift(transaction);
        this.displayedTransactions = [...this.transactions];
        this.calculateBalance();

        // Reset form fields: reset date back to today's date for the input.
        this.amount = 0;
        this.date = new Date().toISOString().split('T')[0];
        this.description = '';
        this.category = '';
        this.selectedType = 'expense';
      } catch (error) {
        console.error("Error adding transaction: ", error);
      }
    } else {
      console.warn("Cannot add transaction: Missing required fields or user not logged in.");
    }
  }

  calculateBalance() {
    const income = this.transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = this.transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    this.balance = income - expense;
  }

  applyFilters() {
    this.displayedTransactions = this.transactions.filter(tx => {
      let matchesType = true;
      let matchesFrom = true;
      let matchesTo = true;

      if (this.filterType) {
        matchesType = tx.type === this.filterType;
      }
      if (this.filterDateFrom) {
        const fromDate = new Date(this.filterDateFrom);
        matchesFrom = tx.date >= fromDate;
      }
      if (this.filterDateTo) {
        const toDate = new Date(this.filterDateTo);
        matchesTo = tx.date <= toDate;
      }
      return matchesType && matchesFrom && matchesTo;
    });
  }

  // Returns a valid date; if the provided date is invalid, it returns the current date.
  getValidDate(date: Date): Date {
    return isNaN(date.getTime()) ? new Date() : date;
  }

  // Custom category management methods
  addCustomCategory(newCategory: string) {
    if (newCategory && !this.customCategories.includes(newCategory)) {
      this.customCategories.push(newCategory);
    }
  }

  editCustomCategory(oldCategory: string, updatedCategory: string) {
    const index = this.customCategories.indexOf(oldCategory);
    if (index !== -1) {
      this.customCategories[index] = updatedCategory;
    }
  }

  deleteCustomCategory(categoryToDelete: string) {
    this.customCategories = this.customCategories.filter(cat => cat !== categoryToDelete);
  }
}
