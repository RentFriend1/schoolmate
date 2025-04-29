import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Import the new functional API for Firestore
import {
  Firestore, // The injected Firestore instance type
  collection, // Function to get a collection reference
  query,      // Function to build queries
  where,      // Query constraint: filter documents
  orderBy,    // Query constraint: order documents
  getDocs,    // Function to get documents once (Promise-based) - Matches HomepageComponent pattern
  addDoc      // Function to add a document to a collection
} from '@angular/fire/firestore';

import {
  Auth, // The injected Auth instance type
  // We will use auth.currentUser, matching HomepageComponent pattern
} from '@angular/fire/auth';

// Import Timestamp from the Firebase SDK for type definition
import { Timestamp } from 'firebase/firestore'; // Make sure Timestamp is imported

// Define an interface for your expense data for better type safety
// When reading from Firestore, the date field will be a Timestamp object
// When manually adding to the array, it will be a Date object initially
interface Expense {
  id?: string;
  amount: number;
  category: string;
  note: string;
  date: Timestamp | Date; // Allow both Timestamp (from fetch) and Date (from manual add)
  studentId: string;
}

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './wallet.component.html', // Use the updated template below
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  amount: number = 0;
  category: string = '';
  note: string = '';

  // Changed from Observable<Expense[]> to a simple array Expense[]
  // This array will hold the expenses fetched once via getDocs
  expenses: Expense[] = [];

  // Inject the new functional API services using the inject function
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  // ngOnInit is now an async function to use await, matching HomepageComponent pattern
  async ngOnInit() {
    // Load expenses once when the component initializes
    await this.loadExpenses();
  }

  // Method to load expenses using async/await and getDocs, matching HomepageComponent pattern
  async loadExpenses() {
    // Get the current user snapshot, matching HomepageComponent pattern
    const currentUser = this.auth.currentUser;

    if (currentUser) {
      try {
        // Use the new functional API for Firestore queries
        const expensesCollection = collection(this.firestore, 'expenses'); // Get collection reference
        const userExpensesQuery = query( // Build the query
          expensesCollection,
          where('studentId', '==', currentUser.uid), // Filter by user ID
          orderBy('date', 'desc')           // Order by date descending
        );

        // Use getDocs to fetch the documents once, matching HomepageComponent pattern
        const querySnapshot = await getDocs(userExpensesQuery);

        // Map the snapshot documents to the local expenses array
        this.expenses = querySnapshot.docs.map(doc => {
          const data = doc.data() as any; // Use 'any' temporarily for flexibility
          return {
            id: doc.id, // Include the document ID
            amount: data.amount,
            category: data.category,
            note: data.note,
            // Firestore Timestamp objects have a toDate() method.
            // Ensure the date property is a Timestamp or convert if necessary.
            // getDocs usually returns Timestamp objects directly.
            date: data.date instanceof Timestamp ? data.date : new Date(data.date.seconds * 1000),
            studentId: data.studentId
          } as Expense; // Cast back to Expense
        });

      } catch (error) {
        console.error("Error loading expenses: ", error);
        // Optionally show an error message to the user
      }
    } else {
      // If no user is logged in, clear the expenses array
      this.expenses = [];
      console.warn("No authenticated user found to load expenses.");
    }
  }

  // addExpense is now an async function, matching HomepageComponent pattern
  async addExpense() {
    // Get the current user snapshot, matching HomepageComponent pattern
    const currentUser = this.auth.currentUser;

    // Check if user is logged in and required fields are filled
    if (currentUser && this.amount > 0 && this.category.trim() !== '') {
      try {
        // Create the expense object to be added to Firestore
        // When WRITING data, use a standard JavaScript Date object.
        // The Firebase SDK will automatically convert it to a Firestore Timestamp.
        const expenseToAdd = { // Use a different variable name to avoid confusion with the 'expenses' array
          amount: this.amount,
          category: this.category,
          note: this.note || '',
          date: new Date(), // <-- Use standard JavaScript Date object here for writing
          studentId: currentUser.uid
        };

        // Use the new functional API to add a document, matching HomepageComponent pattern
        const expensesCollection = collection(this.firestore, 'expenses'); // Get collection reference
        const docRef = await addDoc(expensesCollection, expenseToAdd); // Use await to wait for the Promise

        console.log("Document written with ID: ", docRef.id);

        // Manually add the new expense to the local array
        // Add to the beginning of the array to match the descending order of the query.
        // The date added here is the JS Date object.
        this.expenses.unshift({
          id: docRef.id,
          amount: expenseToAdd.amount,
          category: expenseToAdd.category,
          note: expenseToAdd.note,
          date: expenseToAdd.date, // This is a Date object
          studentId: expenseToAdd.studentId
        });

        // Reset form fields after successful addition
        this.amount = 0;
        this.category = '';
        this.note = '';

      } catch (error) {
        console.error("Error adding document: ", error);
        // Optionally show an error message to the user
      }
    } else {
      console.warn("Cannot add expense: User not logged in or fields incomplete.");
    }
  }

  // Helper function to get a standard Date object from either Timestamp or Date
  // This is crucial for displaying dates consistently in the template
  getDate(dateValue: Timestamp | Date): Date {
    if (dateValue instanceof Timestamp) {
      return dateValue.toDate();
    }
    // If it's not a Timestamp, assume it's already a Date object
    return dateValue;
  }
}
